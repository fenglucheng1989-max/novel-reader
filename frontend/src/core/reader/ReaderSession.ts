/**
 * ReaderSession — 阅读会话管理器
 *
 * 管理一次阅读会话的生命周期：
 * 1. 会话开始（进入阅读页）
 * 2. 章节切换
 * 3. 进度恢复
 * 4. 自动保存（定时 + 退出）
 * 5. 会话结束（离开阅读页）
 */

import type {
  ChapterData,
  ReaderProgress,
  ReaderMode,
} from '../../types/reader'
import { getPlatformAdapter } from '../../platform/ReaderPlatform'
import type { IPlatformAdapter } from '../../types/platform'

/** 进度自动保存间隔（ms） */
const SAVE_INTERVAL = 30_000

/** 会话配置 */
export interface SessionConfig {
  bookId: string | number
  bookTitle: string
  initialChapterNo: number
  initialPageIndex: number
  mode: ReaderMode
}

/** 会话状态 */
export interface SessionState {
  bookId: string | number
  bookTitle: string
  chapterNo: number
  chapterId: string | number
  pageIndex: number
  progressPercent: number
  mode: ReaderMode
  startedAt: number
  durationMs: number
}

export type SessionEventHandler = (state: SessionState) => void

export class ReaderSession {
  private config: SessionConfig
  private platform: IPlatformAdapter
  private saveTimer: ReturnType<typeof setInterval> | null = null
  private startTime: number = 0
  private chapterStartTime: number = 0
  private onSaveCallbacks: SessionEventHandler[] = []
  private onChapterChangeCallbacks: Array<
    (from: number, to: number) => void
  > = []

  /** 当前状态 */
  state: SessionState

  constructor(config: SessionConfig) {
    this.config = config
    this.platform = getPlatformAdapter()

    this.state = {
      bookId: config.bookId,
      bookTitle: config.bookTitle,
      chapterNo: config.initialChapterNo,
      chapterId: '',
      pageIndex: config.initialPageIndex,
      progressPercent: 0,
      mode: config.mode,
      startedAt: Date.now(),
      durationMs: 0,
    }

    this.startTime = Date.now()
    this.chapterStartTime = Date.now()
  }

  /** 开始会话（启动自动保存） */
  start(): void {
    this.startTime = Date.now()
    this.chapterStartTime = Date.now()

    if (this.saveTimer) clearInterval(this.saveTimer)
    this.saveTimer = setInterval(() => {
      this.doSave()
    }, SAVE_INTERVAL)

    // 页面可见性变化时保存
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }

    // 页面卸载前保存
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload)
    }
  }

  /** 结束会话 */
  end(): void {
    this.doSave()
    this.cleanup()
  }

  /** 切换章节 */
  changeChapter(chapter: ChapterData, pageIndex: number): void {
    const from = this.state.chapterNo

    this.chapterStartTime = Date.now()
    this.state.chapterNo = chapter.chapterNo
    this.state.chapterId = chapter.id
    this.state.pageIndex = pageIndex
    this.state.progressPercent = this.calcProgressPercent(
      chapter.chapterNo,
      0,
    )

    this.onChapterChangeCallbacks.forEach((cb) => cb(from, chapter.chapterNo))
  }

  /** 更新页码 */
  updatePage(pageIndex: number, totalPages: number): void {
    this.state.pageIndex = pageIndex
    this.state.progressPercent = this.calcProgressPercentByPages(
      pageIndex,
      totalPages,
    )
  }

  /** 更新进度百分比 */
  updateProgressPercent(percent: number): void {
    this.state.progressPercent = percent
  }

  /** 注册保存回调 */
  onSave(cb: SessionEventHandler): () => void {
    this.onSaveCallbacks.push(cb)
    return () => {
      const idx = this.onSaveCallbacks.indexOf(cb)
      if (idx >= 0) this.onSaveCallbacks.splice(idx, 1)
    }
  }

  /** 注册章节切换回调 */
  onChapterChange(cb: (from: number, to: number) => void): () => void {
    this.onChapterChangeCallbacks.push(cb)
    return () => {
      const idx = this.onChapterChangeCallbacks.indexOf(cb)
      if (idx >= 0) this.onChapterChangeCallbacks.splice(idx, 1)
    }
  }

  /** 构建进度数据 */
  buildProgress(): ReaderProgress {
    return {
      bookId: this.state.bookId,
      chapterId: this.state.chapterId,
      chapterNo: this.state.chapterNo,
      pageIndex: this.state.pageIndex,
      offset: 0,
      progressPercent: this.state.progressPercent,
      mode: this.state.mode,
      lastReadAt: Date.now(),
    }
  }

  /** 获取会话时长（ms） */
  getDuration(): number {
    return Date.now() - this.startTime
  }

  /** 获取当前章节阅读时长（ms） */
  getChapterDuration(): number {
    return Date.now() - this.chapterStartTime
  }

  /* ===================== 私有 ===================== */

  private doSave(): void {
    this.state.durationMs = this.getDuration()
    this.onSaveCallbacks.forEach((cb) => cb({ ...this.state }))
  }

  private calcProgressPercent(
    _chapterNo: number,
    _chapterProgress: number,
  ): number {
    // 简化为章节级进度百分比
    return this.state.pageIndex > 0 ? Math.min(0.99, this.state.pageIndex / 100) : 0
  }

  private calcProgressPercentByPages(
    pageIndex: number,
    totalPages: number,
  ): number {
    if (totalPages <= 1) return 0
    return pageIndex / (totalPages - 1)
  }

  private handleVisibilityChange = (): void => {
    if (typeof document !== 'undefined' && document.hidden) {
      this.doSave()
    }
  }

  private handleBeforeUnload = (): void => {
    this.doSave()
  }

  private cleanup(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
      this.saveTimer = null
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
      )
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload)
    }
  }
}
