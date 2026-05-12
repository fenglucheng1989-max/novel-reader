/**
 * ReaderEngine — 阅读器引擎（核心编排器）
 *
 * 职责：
 * 1. 协调所有子系统（分页、动画、状态机、会话）
 * 2. 章节加载 → 分页 → 渲染 全流程编排
 * 3. 翻页操作（上一页/下一页/跳转）
 * 4. 模式切换（分页/滚动）
 * 5. 设置变更响应（字号/字体/行距 → 重新分页）
 * 6. 事件发布（UI 层通过事件驱动更新）
 *
 * 使用方式：
 *   const engine = new ReaderEngine()
 *   engine.on('page:changed', ({ pageIndex }) => { ... })
 *   await engine.openChapter(bookId, 1)
 *   engine.nextPage()
 */

import type {
  ChapterData,
  Page,
  SplitResult,
  SplitOptions,
  ReaderSettings,
  ReaderMode,
  TurnMode,
  ReaderPhase,
  ReaderEventMap,
  ReaderEventName,
  ReaderEventHandler,
  ReaderRuntimeState,
  StateTransition,
  TextMeasureFunction,
} from '../../types/reader'

import type { IPlatformAdapter } from '../../types/platform'
import type { FlipContext } from '../../types/animation'

import { getPlatformAdapter } from '../../platform/ReaderPlatform'
import { splitContent } from '../pagination/PaginationEngine'
import { buildAllPages, type PageBuildOptions } from '../pagination/PageBuilder'
import { parseContent } from '../pagination/ParagraphParser'
import { ReaderStateMachine } from './ReaderStateMachine'
import { ReaderSession, type SessionConfig } from './ReaderSession'
import { getAnimationFactory } from '../animation/AnimationFactory'

/* ===================== 事件总线 ===================== */

type ListenerMap = {
  [K in ReaderEventName]: Set<ReaderEventHandler<K>>
}

/* ===================== 缓存 ===================== */

interface ChapterCacheRecord {
  chapter: ChapterData
  pages: Page[] | null
  splitOptionsHash: string
  fetchedAt: number
}

/* ===================== 配置 ===================== */

export interface EngineConfig {
  /** 预加载方向：向前几章 */
  preloadAheadCount: number
  /** 接近尾页多少页时触发预加载 */
  preloadThreshold: number
  /** 分页缓存容量 */
  maxPageCacheEntries: number
  /** 翻页动画时长（ms） */
  animationDuration: number
}

const DEFAULT_CONFIG: EngineConfig = {
  preloadAheadCount: 2,
  preloadThreshold: 3,
  maxPageCacheEntries: 30,
  animationDuration: 300,
}

/* ===================== 引擎 ===================== */

export class ReaderEngine {
  /* ---- 子模块 ---- */
  readonly stateMachine: ReaderStateMachine
  readonly session: ReaderSession

  /* ---- 配置 ---- */
  private config: EngineConfig
  private platform: IPlatformAdapter

  /* ---- 当前状态 ---- */
  private _chapter: ChapterData | null = null
  private _pages: Page[] = []
  private _currentPageIndex: number = 0
  private _mode: ReaderMode = 'PAGINATION'
  private _turnMode: TurnMode = 'COVER'
  private _settings: ReaderSettings | null = null
  private _bookId: string | number = ''
  private _bookTitle: string = ''
  private _allChapters: ChapterData[] = []
  private _totalChapters: number = 0

  /* ---- 滚动模式多章节缓冲 ---- */
  private _scrollChapters: Map<number, { chapter: ChapterData; pages: Page[] }> = new Map()
  private _scrollChapterOrder: number[] = []

  /* ---- 缓存 ---- */
  private chapterCache: Map<string, ChapterCacheRecord> = new Map()
  private loadPromises: Map<string, Promise<ChapterData | null>> = new Map()

  /* ---- 事件 ---- */
  private listeners: ListenerMap = {
    'chapter:loaded': new Set(),
    'chapter:changed': new Set(),
    'chapterList:loaded': new Set(),
    'page:changed': new Set(),
    'mode:changed': new Set(),
    'settings:changed': new Set(),
    'progress:saved': new Set(),
    'phase:changed': new Set(),
    'animation:start': new Set(),
    'animation:end': new Set(),
    'error': new Set(),
    'menu:open': new Set(),
    'menu:close': new Set(),
    'longpress': new Set(),
    'highlight:created': new Set(),
    'highlight:removed': new Set(),
    'comment:added': new Set(),
  }

  /* ---- 锁定 ---- */
  private _isAnimating: boolean = false

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.platform = getPlatformAdapter()
    this.stateMachine = new ReaderStateMachine()
    this.session = null as unknown as ReaderSession

    // 状态机变化 → 转发为事件
    this.stateMachine.onChange((t: StateTransition) => {
      this.emit('phase:changed', { from: t.from, to: t.to })
    })
  }

  /* ===================== 初始化 ===================== */

  /**
   * 初始化引擎并加载初始章节
   */
  async init(config: SessionConfig): Promise<void> {
    this._bookId = config.bookId
    this._bookTitle = config.bookTitle
    this._mode = config.mode
    this._currentPageIndex = config.initialPageIndex

    // 创建会话
    const session = new ReaderSession(config)
    session.onSave((state) => {
      this.emit('progress:saved', {
        progress: session.buildProgress(),
      })
    })
    this.session = session

    // 加载章节列表
    await this.loadChapterList()

    // 加载初始章节（openChapter 管理自身状态机转换）
    await this.openChapter(config.initialChapterNo, config.initialPageIndex)
  }

  /** 销毁引擎 */
  destroy(): void {
    this.session?.end()
    this.chapterCache.clear()
    this.loadPromises.clear()
    this.resetScrollBuffer()
    this.stateMachine.reset()
  }

  /* ===================== 公开状态 ===================== */

  get chapter(): ChapterData | null {
    return this._chapter
  }

  get pages(): Page[] {
    return this._pages
  }

  get currentPageIndex(): number {
    return this._currentPageIndex
  }

  get currentPage(): Page | null {
    return this._pages[this._currentPageIndex] ?? null
  }

  get totalPages(): number {
    return Math.max(1, this._pages.length)
  }

  get mode(): ReaderMode {
    return this._mode
  }

  get turnMode(): TurnMode {
    return this._turnMode
  }

  get phase(): ReaderPhase {
    return this.stateMachine.phase
  }

  get isAnimating(): boolean {
    return this._isAnimating
  }

  get isReady(): boolean {
    return this.stateMachine.phase === 'READY'
  }

  getRuntimeState(): ReaderRuntimeState {
    return {
      phase: this.stateMachine.phase,
      mode: this._mode,
      chapter: this._chapter,
      pages: this._pages,
      currentPageIndex: this._currentPageIndex,
      isAnimating: this._isAnimating,
      isLoading: this.stateMachine.phase === 'LOADING_CHAPTER',
      error: null,
      menuVisible: false,
      settingsVisible: false,
      toolbarVisible: false,
      commentPanelVisible: false,
      transitionHistory: this.stateMachine.history,
    }
  }

  /* ===================== 章节导航 ===================== */

  /**
   * 打开指定章节
   */
  async openChapter(
    chapterNo: number,
    targetPageIndex: number = 0,
  ): Promise<void> {
    // 如果正在加载，跳过当前请求
    if (this.stateMachine.phase === 'LOADING_CHAPTER') {
      console.warn(`[ReaderEngine] Already loading chapter, skipping request for chapter ${chapterNo}`)
      return
    }
    
    // 如果处于错误状态，先重置
    if (this.stateMachine.phase === 'ERROR') {
      this.stateMachine.transition('IDLE', '从错误状态恢复')
    }
    
    this.stateMachine.transition('LOADING_CHAPTER', `跳转到第${chapterNo}章`)

    try {
      const chapter = await this.loadChapterData(this._bookId, chapterNo)
      if (!chapter) {
        // 创建一个空章节作为降级处理
        const emptyChapter: ChapterData = {
          id: `${this._bookId}:${chapterNo}`,
          bookId: this._bookId,
          chapterNo,
          title: `第${chapterNo}章`,
          content: '',
          wordCount: 0,
          totalChapters: this._totalChapters || chapterNo,
        }
        this._chapter = emptyChapter
        this.stateMachine.startSplitting()
        this.splitAndRender(emptyChapter, targetPageIndex)
        this.stateMachine.finishSplitting()
        this.emit('chapter:loaded', { chapter: emptyChapter })
        return
      }

      const prevChapterNo = this._chapter?.chapterNo ?? 0
      this._chapter = chapter

      this.stateMachine.startSplitting()

      // 分页
      this.splitAndRender(chapter, targetPageIndex)

      this.stateMachine.finishSplitting()
      this.session.changeChapter(chapter, targetPageIndex)

      // 滚动模式：初始化缓冲
      if (this._mode === 'SCROLL') {
        this.resetScrollBuffer()
        this._scrollChapters.set(chapter.chapterNo, { chapter, pages: this._pages })
        this._scrollChapterOrder.push(chapter.chapterNo)
      }

      this.emit('chapter:loaded', { chapter })
      if (prevChapterNo !== chapter.chapterNo) {
        this.emit('chapter:changed', {
          from: prevChapterNo,
          to: chapter.chapterNo,
        })
      }

      // 预加载
      this.prefetchAdjacent(chapter.chapterNo)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error'
      console.error(`[ReaderEngine] Failed to load chapter ${chapterNo}:`, msg)
      
      // 失败时创建空章节作为降级，避免卡住
      const emptyChapter: ChapterData = {
        id: `${this._bookId}:${chapterNo}`,
        bookId: this._bookId,
        chapterNo,
        title: `第${chapterNo}章`,
        content: '',
        wordCount: 0,
        totalChapters: this._totalChapters || chapterNo,
      }
      this._chapter = emptyChapter
      this.stateMachine.startSplitting()
      this.splitAndRender(emptyChapter, targetPageIndex)
      this.stateMachine.finishSplitting()
      
      this.stateMachine.fail(msg)
      this.emit('error', { code: 'CHAPTER_ERROR', message: msg })
      this.emit('chapter:loaded', { chapter: emptyChapter })
    }
  }

  private _lastChapterTransition = 0
  private readonly CHAPTER_TRANSITION_COOLDOWN = 800
  private readonly MAX_SCROLL_CHAPTERS = 3

  /** 上一章 */
  async prevChapter(): Promise<boolean> {
    const now = Date.now()
    if (now - this._lastChapterTransition < this.CHAPTER_TRANSITION_COOLDOWN) return false
    if (!this._chapter || this._chapter.chapterNo <= 1) return false
    this._lastChapterTransition = now

    if (this._mode === 'SCROLL') {
      return this.prependPrevChapter()
    }
    await this.openChapter(this._chapter.chapterNo - 1, -1)
    return true
  }

  /** 下一章 */
  async nextChapter(): Promise<boolean> {
    const now = Date.now()
    if (now - this._lastChapterTransition < this.CHAPTER_TRANSITION_COOLDOWN) return false
    if (!this._chapter) return false
    if (this._chapter.chapterNo >= this._totalChapters) return false
    this._lastChapterTransition = now

    if (this._mode === 'SCROLL') {
      return this.appendNextChapter()
    }
    await this.openChapter(this._chapter.chapterNo + 1, 0)
    return true
  }

  /** 滚动模式：追加下一章页面到缓冲末尾 */
  private async appendNextChapter(): Promise<boolean> {
    const nextNo = this._chapter!.chapterNo + 1
    if (nextNo > this._totalChapters) return false

    // 已在缓冲中，直接定位
    const existing = this._scrollChapters.get(nextNo)
    if (existing) {
      this._chapter = existing.chapter
      this.emit('chapter:loaded', { chapter: existing.chapter })
      this.emit('page:changed', {
        pageIndex: this._currentPageIndex,
        totalPages: this._pages.length,
      })
      return true
    }

    try {
      const chapter = await this.loadChapterData(this._bookId, nextNo)
      if (!chapter) return false

      const pages = this.splitChapter(chapter)
      this._scrollChapters.set(nextNo, { chapter, pages })
      this._scrollChapterOrder.push(nextNo)
      this.trimScrollBuffer()

      // 追加到当前页面数组
      this._pages = [...this._pages, ...pages]
      this._chapter = chapter
      this.session.changeChapter(chapter, this._currentPageIndex)

      this.emit('chapter:loaded', { chapter })
      this.emit('page:changed', {
        pageIndex: this._currentPageIndex,
        totalPages: this._pages.length,
      })
      return true
    } catch (err) {
      console.error('[ReaderEngine] Failed to append next chapter:', err)
      return false
    }
  }

  /** 滚动模式：前置上一章页面到缓冲开头 */
  private async prependPrevChapter(): Promise<boolean> {
    const prevNo = this._chapter!.chapterNo - 1
    if (prevNo < 1) return false

    // 已在缓冲中，直接定位
    const existing = this._scrollChapters.get(prevNo)
    if (existing) {
      // 计算该章在 _pages 中的起始偏移
      let pageOffset = 0
      for (const cno of this._scrollChapterOrder) {
        if (cno === prevNo) break
        pageOffset += this._scrollChapters.get(cno)!.pages.length
      }
      this._chapter = existing.chapter
      this._currentPageIndex = pageOffset
      this.session.changeChapter(existing.chapter, pageOffset)
      this.emit('chapter:loaded', { chapter: existing.chapter })
      this.emit('page:changed', {
        pageIndex: pageOffset,
        totalPages: this._pages.length,
      })
      return true
    }

    try {
      const chapter = await this.loadChapterData(this._bookId, prevNo)
      if (!chapter) return false

      const pages = this.splitChapter(chapter)
      this._scrollChapters.set(prevNo, { chapter, pages })
      this._scrollChapterOrder.unshift(prevNo)
      this.trimScrollBuffer()

      // 记录旧页面长度，用于调整滚动位置
      const addedCount = pages.length
      this._pages = [...pages, ...this._pages]
      this._currentPageIndex = this._currentPageIndex + addedCount
      this._chapter = chapter
      this.session.changeChapter(chapter, this._currentPageIndex)

      this.emit('chapter:loaded', { chapter })
      this.emit('page:changed', {
        pageIndex: this._currentPageIndex,
        totalPages: this._pages.length,
        prependedCount: addedCount,
      })
      return true
    } catch (err) {
      console.error('[ReaderEngine] Failed to prepend prev chapter:', err)
      return false
    }
  }

  /** 对单个章节执行分页，返回 Page[] */
  private splitChapter(chapter: ChapterData): Page[] {
    const screenInfo = this.platform.getScreenInfo()
    const effectiveWidth = screenInfo.isDesktop
      ? screenInfo.maxContentWidth
      : screenInfo.width
    const splitOptions = this.buildSplitOptions(effectiveWidth, screenInfo.height)
    const result = splitContent(
      chapter.content,
      splitOptions,
      this.createMeasureFunction(),
    )
    const pageBuildOptions: PageBuildOptions = {
      paragraphIndent: true,
      paragraphSpacing: splitOptions.paragraphSpacing,
    }
    const parsed = parseContent(chapter.content)
    const paraMeta = this.buildParagraphMeta(parsed.paragraphs)
    if (Object.keys(paraMeta).length > 0) {
      pageBuildOptions.paragraphMeta = paraMeta
    }
    buildAllPages(result.pages, pageBuildOptions)
    // 标记章节号，用于滚动模式稳定 key
    for (const p of result.pages) {
      p.chapterNo = chapter.chapterNo
    }
    return result.pages
  }

  /** 裁剪滚动缓冲区，只保留最近 N 章 */
  private trimScrollBuffer(): void {
    while (this._scrollChapterOrder.length > this.MAX_SCROLL_CHAPTERS) {
      const oldest = this._scrollChapterOrder.shift()!
      const entry = this._scrollChapters.get(oldest)
      this._scrollChapters.delete(oldest)

      // 从 _pages 中移除旧章节的页面
      if (entry) {
        const removeCount = entry.pages.length
        if (this._scrollChapterOrder.length === 0) {
          // 只剩当前章节，完全重建
          // 其实不会进这里，因为至少有一个章节
        }
        // 如果移除的是最旧的（在数组前面），从前面删除
        const remainingOrder = this._scrollChapterOrder
        const firstRemaining = remainingOrder[0]
        const firstEntry = this._scrollChapters.get(firstRemaining)
        if (firstEntry) {
          this._pages = this._pages.slice(removeCount)
          this._currentPageIndex = Math.max(0, this._currentPageIndex - removeCount)
        }
      }
    }
  }

  /** 滚动模式下重置缓冲（切换书籍/模式时使用） */
  private resetScrollBuffer(): void {
    this._scrollChapters.clear()
    this._scrollChapterOrder = []
  }

  /* ===================== 翻页 ===================== */

  /**
   * 下一页
   * @returns 是否成功翻页
   */
  async nextPage(): Promise<boolean> {
    if (this._isAnimating) return false
    
    // 没有页面时不允许翻页
    if (this._pages.length === 0) {
      console.warn('[ReaderEngine] Cannot nextPage: no pages available')
      return false
    }

    const targetIdx = this._currentPageIndex + 1
    if (targetIdx >= this._pages.length) {
      // 已到章节末尾，尝试下一章
      return this.nextChapter()
    }

    return this.flipTo(targetIdx, 1)
  }

  /**
   * 上一页
   */
  async prevPage(): Promise<boolean> {
    if (this._isAnimating) return false
    
    // 没有页面时不允许翻页
    if (this._pages.length === 0) {
      console.warn('[ReaderEngine] Cannot prevPage: no pages available')
      return false
    }

    const targetIdx = this._currentPageIndex - 1
    if (targetIdx < 0) {
      if (this._chapter && this._chapter.chapterNo > 1) {
        return this.prevChapter()
      }
      return false
    }

    return this.flipTo(targetIdx, -1)
  }

  /**
   * 跳转到指定页
   */
  goToPage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this._pages.length) return
    if (this._isAnimating) return
    if (pageIndex === this._currentPageIndex) return

    this._currentPageIndex = pageIndex
    this.session.updatePage(pageIndex, this._pages.length)
    this.emit('page:changed', {
      pageIndex,
      totalPages: this._pages.length,
    })
  }

  /* ===================== 模式切换 ===================== */

  setMode(mode: ReaderMode): void {
    if (mode === this._mode) return
    this._mode = mode
    this.emit('mode:changed', { mode })

    // 滚动模式下翻页模式强制 SCROLL
    if (mode === 'SCROLL' && this._turnMode !== 'SCROLL') {
      this._turnMode = 'SCROLL'
    }

    // 切换模式时重置滚动缓冲
    if (mode !== 'SCROLL') {
      this.resetScrollBuffer()
    }
  }

  setTurnMode(mode: TurnMode): void {
    if (mode === this._turnMode) return
    this._turnMode = mode
    this.emit('settings:changed', {
      key: 'turnMode',
      value: mode,
    })
  }

  /* ===================== 设置变更 ===================== */

  onSettingsChanged(settings: ReaderSettings): void {
    this._settings = settings

    // 字号/字体/行距变更需要重新分页
    if (this._chapter) {
      this.stateMachine.transition('SPLITTING', '排版参数变更')
      this.splitAndRender(this._chapter, this._currentPageIndex)
      this.stateMachine.finishSplitting()
    }

    this.emit('settings:changed', settings)
  }

  /* ===================== 事件系统 ===================== */

  on<K extends ReaderEventName>(
    event: K,
    handler: ReaderEventHandler<K>,
  ): () => void {
    let set = this.listeners[event] as Set<ReaderEventHandler<K>> | undefined
    if (!set) {
      set = new Set<ReaderEventHandler<K>>()
      this.listeners[event] = set as Set<unknown>
    }
    set.add(handler)
    return () => {
      set.delete(handler as ReaderEventHandler<K>)
    }
  }

  /* ===================== 预加载 ===================== */

  private async prefetchAdjacent(currentNo: number): Promise<void> {
    const ahead = []

    for (let i = 1; i <= this.config.preloadAheadCount; i++) {
      const nextNo = currentNo + i
      if (nextNo <= this._totalChapters) {
        ahead.push(this.prefetchChapter(this._bookId, nextNo))
      }
    }

    // 预读上一章（反向翻页场景）
    if (currentNo > 1) {
      ahead.push(this.prefetchChapter(this._bookId, currentNo - 1))
    }

    await Promise.allSettled(ahead)
  }

  private async prefetchChapter(
    bookId: string | number,
    chapterNo: number,
  ): Promise<void> {
    const key = `${bookId}:${chapterNo}`
    if (this.chapterCache.has(key)) return
    try {
      // 加载并缓存分页结果
      const chapter = await this.fetchChapterFromAPI(bookId, chapterNo)
      if (!chapter) return

      const cacheRecord: ChapterCacheRecord = {
        chapter,
        pages: null, // 延迟分页，仅缓存原始数据
        splitOptionsHash: '',
        fetchedAt: Date.now(),
      }
      this.chapterCache.set(key, cacheRecord)
      this.limitCacheSize()
    } catch {
      // 预加载失败不阻塞
    }
  }

  /* ===================== 私有方法 ===================== */

  private async loadChapterData(
    bookId: string | number,
    chapterNo: number,
  ): Promise<ChapterData | null> {
    const key = `${bookId}:${chapterNo}`

    // 查缓存
    const cached = this.chapterCache.get(key)
    if (cached) return cached.chapter

    // 去重
    const pending = this.loadPromises.get(key)
    if (pending) return pending

    const promise = this.fetchChapterFromAPI(bookId, chapterNo)
    this.loadPromises.set(key, promise)

    try {
      const chapter = await promise
      if (chapter) {
        this.chapterCache.set(key, {
          chapter,
          pages: null,
          splitOptionsHash: '',
          fetchedAt: Date.now(),
        })
        this.limitCacheSize()
      }
      return chapter
    } finally {
      this.loadPromises.delete(key)
    }
  }

  private async fetchChapterFromAPI(
    bookId: string | number,
    chapterNo: number,
  ): Promise<ChapterData | null> {
    const { request } = await import('../../utils/request')
    try {
      const res = await request({
        url: `/api/v1/books/${bookId}/chapters/${chapterNo}`,
        noAuth: true,
        silent: true,
      })

      if (res.code === 200 && res.data) {
        const d = res.data
        return {
          id: d.id,
          bookId: d.bookId,
          chapterNo: d.chapterNo,
          title: d.title || '',
          content: d.content || '',
          wordCount: d.wordCount || 0,
          totalChapters: d.totalChapters || d.maxChapterNo || 0,
        }
      }
      console.warn('[ReaderEngine] Chapter API returned empty data:', bookId, chapterNo)
    } catch (err) {
      console.error('[ReaderEngine] Failed to fetch chapter:', bookId, chapterNo, err)
    }
    return null
  }

  private async loadChapterList(): Promise<void> {
    try {
      const { request } = await import('../../utils/request')
      const res = await request({
        url: `/api/v1/books/${this._bookId}/chapters`,
        noAuth: true,
        silent: true,
      })
      if (res.code === 200 && Array.isArray(res.data)) {
        this._allChapters = res.data.map((c: Record<string, unknown>) => ({
          id: c.id as number,
          bookId: c.bookId as number,
          chapterNo: c.chapterNo as number,
          title: (c.title as string) || '',
          content: '',
          wordCount: (c.wordCount as number) || 0,
          totalChapters: 0,
        }))
        this._totalChapters = this._allChapters.length
        this.emit('chapterList:loaded', { chapters: this._allChapters })
      }
    } catch {
      // 章节列表加载失败不阻塞阅读
    }
  }

  private splitAndRender(
    chapter: ChapterData,
    targetPageIndex: number,
  ): void {
    const screenInfo = this.platform.getScreenInfo()

    // 桌面端使用 maxContentWidth（与 CSS max-width 一致），避免分页宽度与渲染宽度不一致
    const effectiveWidth = screenInfo.isDesktop
      ? screenInfo.maxContentWidth
      : screenInfo.width

    // 构建分页选项
    const splitOptions = this.buildSplitOptions(effectiveWidth, screenInfo.height)

    // 执行分页
    const result: SplitResult = splitContent(
      chapter.content,
      splitOptions,
      this.createMeasureFunction(),
    )

    // 构建 HTML
    const pageBuildOptions: PageBuildOptions = {
      paragraphIndent: true,
      paragraphSpacing: splitOptions.paragraphSpacing,
    }

    // 先解析段落以获取 meta
    const parsed = parseContent(chapter.content)
    const paraMeta = this.buildParagraphMeta(parsed.paragraphs)

    if (Object.keys(paraMeta).length > 0) {
      pageBuildOptions.paragraphMeta = paraMeta
    }

    buildAllPages(result.pages, pageBuildOptions)

    // 标记章节号，用于滚动模式稳定 key
    for (const p of result.pages) {
      p.chapterNo = chapter.chapterNo
    }

    this._pages = result.pages

    // 调整目标页码
    if (targetPageIndex === -1) {
      this._currentPageIndex = this._pages.length - 1
    } else {
      this._currentPageIndex = Math.min(
        targetPageIndex,
        Math.max(0, this._pages.length - 1),
      )
    }

    this.session.updatePage(this._currentPageIndex, this._pages.length)
    this.emit('page:changed', {
      pageIndex: this._currentPageIndex,
      totalPages: this._pages.length,
    })
  }

  private buildSplitOptions(
    viewWidth: number,
    viewHeight: number,
  ): SplitOptions {
    const settings = this._settings
    const fontSize = settings?.fontSize ?? 18
    const lineHeight = settings?.lineHeight ?? 1.8
    const marginH = settings?.marginHorizontal ?? 22
    const marginV = settings?.marginVertical ?? 20

    return {
      viewWidth,
      viewHeight,
      fontSize,
      fontFamily: this.resolveFontFamily(settings?.fontFamily ?? 'SERIF'),
      lineHeight,
      letterSpacing: settings?.letterSpacing ?? 0,
      paddingTop: marginV,
      paddingBottom: marginV,
      paddingLeft: marginH,
      paddingRight: marginH,
      paragraphSpacing: settings?.paragraphSpacing ?? 6,
      paragraphIndent: settings?.paragraphIndent ?? true,
      titleHeight: 50,
      headerHeight: 0,
      footerHeight: 0,
    }
  }

  private resolveFontFamily(fontName: string): string {
    const fontMap: Record<string, string> = {
      SERIF: "'Noto Serif SC','Source Han Serif SC',SimSun,STSong,serif",
      KAITI: "'KaiTi','STKaiti',Kai,serif",
      HEI: "'Noto Sans SC','Source Han Sans SC','PingFang SC','Microsoft YaHei',sans-serif",
      YUAN: "'Noto Sans SC','Source Han Sans SC','PingFang SC','Microsoft YaHei',sans-serif",
    }
    return fontMap[fontName] || fontMap.SERIF
  }

  private createMeasureFunction(): TextMeasureFunction {
    const tm = this.platform.textMeasure
    return (text: string, fontSize: number, fontFamily: string): number => {
      return tm.measureText(text, fontSize, fontFamily)
    }
  }

  private buildParagraphMeta(
    paragraphs: Array<{ originalIndex: number; text: string; type: string }>,
  ): Record<number, { index: number; text: string; commentCount: number; highlights: [] }> {
    const meta: Record<number, { index: number; text: string; commentCount: number; highlights: [] }> = {}
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i]
      if (p.type === 'blank') continue
      meta[i] = {
        index: i,
        text: p.text,
        commentCount: 0,
        highlights: [],
      }
    }
    return meta
  }

  /** 翻转页面（纯状态更新，由 Vue 处理渲染） */
  private async flipTo(targetIdx: number, dir: 1 | -1): Promise<boolean> {
    if (targetIdx < 0 || targetIdx >= this._pages.length) {
      console.error('[ReaderEngine] Invalid target page index:', targetIdx, '/', this._pages.length)
      return false
    }

    if (this._isAnimating) {
      console.warn('[ReaderEngine] Already animating, ignoring page turn request')
      return false
    }

    this._isAnimating = true
    this.stateMachine.transition('ANIMATING', `翻页: ${dir > 0 ? '→' : '←'}`)

    this._currentPageIndex = targetIdx
    this.session.updatePage(targetIdx, this._pages.length)

    this.emit('animation:start', { dir, mode: this._turnMode })
    this.emit('page:changed', {
      pageIndex: targetIdx,
      totalPages: this._pages.length,
      direction: dir,
    })

    this._isAnimating = false
    this.stateMachine.transition('READY', '翻页完成')
    this.emit('animation:end', { dir, mode: this._turnMode })

    return true
  }

  /** 限制缓存大小 */
  private limitCacheSize(): void {
    if (this.chapterCache.size <= this.config.maxPageCacheEntries) return
    const entries = Array.from(this.chapterCache.entries())
    entries.sort((a, b) => a[1].fetchedAt - b[1].fetchedAt)
    const toDelete = entries.slice(
      0,
      entries.length - this.config.maxPageCacheEntries,
    )
    for (const [key] of toDelete) {
      this.chapterCache.delete(key)
    }
  }

  /** 发送事件 */
  private emit<K extends ReaderEventName>(
    event: K,
    payload: ReaderEventMap[K],
  ): void {
    const set = this.listeners[event]
    if (!set) return
    set.forEach((handler) => {
      try {
        ;(handler as ReaderEventHandler<K>)(payload)
      } catch (e) {
        console.error(`[ReaderEngine] Event handler error (${event}):`, e)
      }
    })
  }
}
