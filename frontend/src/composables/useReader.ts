/**
 * useReader — 阅读器核心 Composable
 *
 * 组合 ReaderEngine + readerStore 暴露给 UI 层。
 * 作为 UI 层与引擎层的桥梁。
 * 组件通过此 composable 与引擎交互，不直接操作 ReaderEngine。
 */

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import type {
  ChapterData,
  Page,
  ReaderMode,
  TurnMode,
  ReaderPhase,
} from '../types/reader'
import { ReaderEngine } from '../core/reader/ReaderEngine'
import { useReaderStore } from '../store/reader'
import { ProgressService } from '../services/ProgressService'

export interface UseReaderOptions {
  /** 书籍 ID */
  bookId: string | number
  /** 书籍标题 */
  bookTitle?: string
  /** 初始章节号（默认 1 或从进度恢复） */
  chapterNo?: number
  /** 初始页码 */
  pageIndex?: number
  /** 阅读模式 */
  mode?: ReaderMode
  /** 翻页动画模式 */
  turnMode?: TurnMode
}

export function useReader(options?: UseReaderOptions) {
  const store = useReaderStore()
  const engine = new ReaderEngine()
  const resolvedOptions = ref<UseReaderOptions | null>(options || null)

  // === 状态 ===
  const initialized = ref(false)
  const engineError = ref<string | null>(null)

  // === 从 store 获取响应式状态 ===
  const chapter = computed(() => store.chapter)
  const pages = computed(() => store.pages)
  const currentPageIndex = computed(() => store.currentPageIndex)
  const totalPages = computed(() => store.totalPages)
  const phase = computed(() => store.phase)
  const loading = computed(() => store.chapterLoading)
  const toolbarVisible = computed(() => store.toolbarVisible)
  const settingsVisible = computed(() => store.settingsVisible)
  const catalogVisible = computed(() => store.catalogVisible)
  const progressPercent = computed(() => store.progressPercent)
  const isFirstChapter = computed(() => store.isFirstChapter)
  const isLastChapter = computed(() => store.isLastChapter)

  const currentPage = computed<Page | null>(() => {
    return pages.value[currentPageIndex.value] ?? null
  })

  // 构造时是否已有 options（区分主动 init vs onMounted 自动调用）
  const _hadConstructorOptions = options != null

  /**
   * 延迟初始化（支持 onLoad 数据就绪后调用）
   * 解决了 uni-app onLoad 在 setup 之后执行的问题
   */
  async function init(opts: UseReaderOptions): Promise<void> {
    if (initialized.value) return
    resolvedOptions.value = opts

    store.setChapterLoading(true)

    // 安全超时：防止任何原因导致 loading 永远不消失
    let loadingTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      console.warn('[useReader] Init timeout (45s), force hiding loading')
      store.setChapterLoading(false)
    }, 45000)

    try {
      // 绑定引擎事件 → store
      engine.on('chapter:loaded', ({ chapter }) => {
        store.setChapter(chapter)
      })

      engine.on('chapterList:loaded', ({ chapters }) => {
        store.chapterList = chapters
      })

      engine.on('page:changed', ({ pageIndex, prependedCount }) => {
        store.setCurrentPageIndex(pageIndex)
        store.setPages(engine.pages)
        if (typeof prependedCount === 'number' && prependedCount > 0) {
          store.scrollAnchorIndex = prependedCount
        }
      })

      engine.on('phase:changed', ({ from, to }) => {
        store.setPhase(to)
      })

      engine.on('error', ({ message }) => {
        engineError.value = message
      })

      engine.on('progress:saved', () => {
        // 进度已由引擎自动保存
      })

      // 恢复进度
      let startChapterNo = opts.chapterNo ?? 1
      let startPageIndex = opts.pageIndex ?? 0
      let startMode = opts.mode || 'PAGINATION'

      if (opts.bookId) {
        try {
          const savedProgress = await ProgressService.getProgress(opts.bookId)
          if (savedProgress) {
            startChapterNo = opts.chapterNo ?? savedProgress.chapterNo ?? 1
            startPageIndex = opts.pageIndex ?? savedProgress.pageIndex ?? 0
            startMode = opts.mode || savedProgress.mode || 'PAGINATION'
          }
        } catch {
          // 进度恢复失败不阻塞
        }
      }

      store.bookId = opts.bookId
      store.bookTitle = opts.bookTitle || ''

      // 初始化引擎
      await engine.init({
        bookId: opts.bookId,
        bookTitle: opts.bookTitle || '',
        initialChapterNo: startChapterNo,
        initialPageIndex: startPageIndex,
        mode: startMode,
      })

      // 同步 settings → engine
      watch(
        () => store.settings,
        (settings) => {
          engine.onSettingsChanged(settings)
        },
        { deep: true, immediate: true },
      )

      initialized.value = true
    } catch (err) {
      const msg = err instanceof Error ? err.message : '初始化失败'
      console.error('[useReader] Init failed:', msg)
      engineError.value = msg
    } finally {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
        loadingTimeout = null
      }
      store.setChapterLoading(false)
    }
  }

  // 如果 options 中有 bookId，自动初始化
  onMounted(() => {
    if (_hadConstructorOptions && resolvedOptions.value?.bookId) {
      init(resolvedOptions.value)
    }
  })

  onBeforeUnmount(() => {
    engine.destroy()
    store.reset()
  })

  // === 章节导航 ===
  async function openChapter(chapterNo: number): Promise<void> {
    await engine.openChapter(chapterNo)
  }

  async function nextPage(): Promise<boolean> {
    return engine.nextPage()
  }

  async function prevPage(): Promise<boolean> {
    return engine.prevPage()
  }

  async function nextChapter(): Promise<boolean> {
    return engine.nextChapter()
  }

  async function prevChapter(): Promise<boolean> {
    return engine.prevChapter()
  }

  function goToPage(pageIndex: number): void {
    engine.goToPage(pageIndex)
  }

  // === 设置 ===
  function updateSettings(partial: Record<string, unknown>): void {
    store.updateSettings(partial as Parameters<typeof store.updateSettings>[0])
  }

  function setMode(mode: ReaderMode): void {
    store.setReaderMode(mode)
    engine.setMode(mode)
  }

  function setTurnMode(mode: TurnMode): void {
    store.setTurnMode(mode)
    engine.setTurnMode(mode)
  }

  // === UI 控制 ===
  function toggleToolbar(): void {
    store.toggleToolbar()
  }

  function toggleSettings(): void {
    store.toggleSettings()
  }

  function showCatalog(): void {
    store.showCatalog()
  }

  function hideCatalog(): void {
    store.hideCatalog()
  }

  async function saveProgress(): Promise<void> {
    await store.saveCurrentProgress()
  }

  return {
    // 状态
    initialized,
    engineError,
    chapter,
    pages,
    currentPageIndex,
    currentPage,
    totalPages,
    phase,
    loading,
    progressPercent,
    isFirstChapter,
    isLastChapter,

    // 初始化
    init,

    // UI 状态
    toolbarVisible,
    settingsVisible,
    catalogVisible,

    // 章节导航
    openChapter,
    nextPage,
    prevPage,
    nextChapter,
    prevChapter,
    goToPage,

    // 设置
    updateSettings,
    setMode,
    setTurnMode,

    // UI 控制
    toggleToolbar,
    hideToolbar: (): void => store.hideToolbar(),
    toggleSettings,
    showCatalog,
    hideCatalog,
    saveProgress,

    // store
    store,
  }
}
