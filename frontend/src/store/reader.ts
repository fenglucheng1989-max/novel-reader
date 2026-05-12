/**
 * readerStore — 阅读器 Pinia 状态管理
 *
 * 管理阅读器全局状态：
 * - 当前书籍/章节/页码
 * - 阅读设置（持久化）
 * - 阅读进度（本地 + 服务端）
 * - 菜单/面板可见性
 * - 加载状态
 *
 * 使用方式：
 *   import { useReaderStore } from '@/store/reader'
 *   const store = useReaderStore()
 *   store.openChapter(1)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ChapterData,
  Page,
  ReaderSettings,
  ReaderMode,
  TurnMode,
  ReaderPhase,
  ReaderProgress,
} from '../types/reader'
import type { IPlatformAdapter } from '../types/platform'
import { getPlatformAdapter } from '../platform/ReaderPlatform'
import { ProgressService } from '../services/ProgressService'

/* ===================== 默认设置 ===================== */

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  fontFamily: 'SERIF',
  lineHeight: 1.8,
  letterSpacing: 0,
  backgroundColor: '#F9F5E8',
  textColor: '#3D2B1F',
  readerMode: 'PAGINATION',
  turnMode: 'COVER',
  animationSpeed: 300,
  brightness: 80,
  nightMode: false,
  eyeProtection: false,
  paragraphIndent: true,
  paragraphSpacing: 6,
  marginHorizontal: 22,
  marginVertical: 28,
  showHeader: true,
  showFooter: true,
}

const SETTINGS_KEY = 'reader_settings'

/* ===================== Store ===================== */

export const useReaderStore = defineStore('reader', () => {
  const bookId = ref<string | number>('')
  const bookTitle = ref('')
  const chapterList = ref<ChapterData[]>([])

  /* ---- 当前章节 ---- */
  const chapter = ref<ChapterData | null>(null)
  const pages = ref<Page[]>([])
  const currentPageIndex = ref(0)

  /* ===================== 平台适配器（惰性，避免 TDZ） ===================== */

  let _platform: IPlatformAdapter | null = null
  function getStorePlatform(): IPlatformAdapter {
    if (!_platform) _platform = getPlatformAdapter()
    return _platform
  }

  function loadSettings(): ReaderSettings {
    const saved = getStorePlatform().storage.get<Partial<ReaderSettings>>(SETTINGS_KEY)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...saved }
    }
    return { ...DEFAULT_SETTINGS }
  }

  function persistSettings(): void {
    getStorePlatform().storage.set(SETTINGS_KEY, settings.value)
  }

  /* ---- 阅读设置 ---- */
  const settings = ref<ReaderSettings>(loadSettings())

  /* ---- UI 状态 ---- */
  const phase = ref<ReaderPhase>('IDLE')
  const toolbarVisible = ref(false)
  const settingsVisible = ref(false)
  const menuVisible = ref(false)
  const commentPanelVisible = ref(false)
  const catalogVisible = ref(false)

  /* ---- 加载状态 ---- */
  const loading = ref(false)
  const chapterLoading = ref(false)
  const error = ref<string | null>(null)

  /* ---- 进度 ---- */
  const progress = ref<ReaderProgress | null>(null)

  /* ---- 滚动模式锚点 ---- */
  const scrollAnchorIndex = ref(-1)

  /* ===================== Computed ===================== */

  const totalPages = computed(() => Math.max(1, pages.value.length))
  const progressPercent = computed(() => {
    if (totalPages.value <= 1) return 0
    return currentPageIndex.value / (totalPages.value - 1)
  })
  const isFirstChapter = computed(() => {
    if (!chapter.value) return true
    return chapter.value.chapterNo <= 1
  })
  const isLastChapter = computed(() => {
    if (!chapter.value) return true
    return chapter.value.chapterNo >= chapter.value.totalChapters
  })
  const isNight = computed(() => settings.value.nightMode)
  const mode = computed((): ReaderMode => settings.value.readerMode)
  const turnMode = computed((): TurnMode => settings.value.turnMode)

  /* ===================== 章节操作 ===================== */

  function setChapter(ch: ChapterData): void {
    chapter.value = ch
  }

  function setPages(pg: Page[]): void {
    pages.value = pg
  }

  function setCurrentPageIndex(index: number): void {
    currentPageIndex.value = Math.max(0, Math.min(index, totalPages.value - 1))
  }

  /* ===================== 设置操作 ===================== */

  function updateSettings(partial: Partial<ReaderSettings>): void {
    settings.value = { ...settings.value, ...partial }
    persistSettings()
  }

  function updateTypography(delta: {
    fontSize?: number
    lineHeight?: number
    letterSpacing?: number
    paragraphSpacing?: number
  }): void {
    const s = settings.value
    if (delta.fontSize != null) {
      s.fontSize = Math.max(14, Math.min(36, s.fontSize + delta.fontSize))
    }
    if (delta.lineHeight != null) {
      s.lineHeight = Math.max(1.2, Math.min(3.0, +(s.lineHeight + delta.lineHeight).toFixed(1)))
    }
    if (delta.letterSpacing != null) {
      s.letterSpacing = Math.max(0, Math.min(4, s.letterSpacing + delta.letterSpacing))
    }
    if (delta.paragraphSpacing != null) {
      s.paragraphSpacing = Math.max(0, Math.min(24, s.paragraphSpacing + delta.paragraphSpacing))
    }
    settings.value = { ...s }
    persistSettings()
  }

  function toggleNightMode(): void {
    const next = !settings.value.nightMode
    updateSettings({
      nightMode: next,
      backgroundColor: next ? '#161A1D' : '#F9F5E8',
      textColor: next ? '#D8D1C7' : '#3D2B1F',
    })
  }

  function setBackgroundColor(color: string): void {
    updateSettings({ backgroundColor: color })
  }

  function setReaderMode(mode: ReaderMode): void {
    updateSettings({ readerMode: mode })
  }

  function setTurnMode(mode: TurnMode): void {
    updateSettings({ turnMode: mode })
  }

  /* ===================== UI 面板 ===================== */

  function toggleToolbar(): void {
    toolbarVisible.value = !toolbarVisible.value
    if (toolbarVisible.value) {
      settingsVisible.value = false
      commentPanelVisible.value = false
      menuVisible.value = false
    }
  }

  function showToolbar(): void {
    toolbarVisible.value = true
  }

  function hideToolbar(): void {
    toolbarVisible.value = false
  }

  function toggleSettings(): void {
    settingsVisible.value = !settingsVisible.value
    if (settingsVisible.value) {
      toolbarVisible.value = false
    }
  }

  function showCatalog(): void {
    catalogVisible.value = true
  }

  function hideCatalog(): void {
    catalogVisible.value = false
  }

  /* ===================== 进度 ===================== */

  async function loadProgress(bId: string | number): Promise<void> {
    const p = await ProgressService.getProgress(bId)
    if (p) progress.value = p
  }

  async function saveCurrentProgress(): Promise<void> {
    if (!chapter.value) return
    const p: ReaderProgress = {
      bookId: bookId.value,
      chapterId: chapter.value.id,
      chapterNo: chapter.value.chapterNo,
      pageIndex: currentPageIndex.value,
      offset: 0,
      progressPercent: progressPercent.value,
      mode: settings.value.readerMode,
      lastReadAt: Date.now(),
    }
    progress.value = p
    await ProgressService.saveProgress(p)
  }

  /* ===================== 状态管理 ===================== */

  function setPhase(p: ReaderPhase): void {
    phase.value = p
  }

  function setLoading(v: boolean): void {
    loading.value = v
  }

  function setChapterLoading(v: boolean): void {
    chapterLoading.value = v
  }

  function setError(e: string | null): void {
    error.value = e
  }

  /* ===================== 重置 ===================== */

  function reset(): void {
    chapter.value = null
    pages.value = []
    currentPageIndex.value = 0
    toolbarVisible.value = false
    settingsVisible.value = false
    menuVisible.value = false
    commentPanelVisible.value = false
    catalogVisible.value = false
    loading.value = false
    chapterLoading.value = false
    error.value = null
    phase.value = 'IDLE'
  }

  /* ===================== 向下兼容（旧版 reader store API） ===================== */

  /** 兼容：旧版使用 `setting`（单数）而非 `settings` */
  const setting = computed(() => settings.value)

  function loadSetting(): void {
    // settings 已在初始化时自动加载，无需额外操作
  }

  function saveSetting(patch: Record<string, unknown>): void {
    const mapped: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(patch)) {
      if (key === 'marginX') mapped.marginHorizontal = value
      else if (key === 'theme') {
        // 旧版 theme → 新版 nightMode + colors
        mapped.nightMode = value === 'NIGHT'
        if (value === 'NIGHT') {
          mapped.backgroundColor = '#161A1D'
          mapped.textColor = '#D8D1C7'
        } else if (value === 'PARCHMENT') {
          mapped.backgroundColor = '#F5E6C8'
          mapped.textColor = '#3D2B1F'
        } else if (value === 'LIGHT_GREEN') {
          mapped.backgroundColor = '#E8F0E3'
          mapped.textColor = '#3D2B1F'
        } else if (value === 'GRAY') {
          mapped.backgroundColor = '#EBEBE7'
          mapped.textColor = '#3D2B1F'
        } else {
          mapped.backgroundColor = '#F9F5E8'
          mapped.textColor = '#3D2B1F'
        }
      } else mapped[key] = value
    }
    updateSettings(mapped as Partial<ReaderSettings>)
  }

  function updateLocalSetting(patch: Record<string, unknown>): void {
    saveSetting(patch)
  }

  // 兼容：bookshelf 页调用 saveProgress(bookId, data) 格式
  async function saveProgress(
    _bookId: string | number,
    data: { chapterNo: number; position: number; progressPercent: number; durationSeconds: number },
  ): Promise<void> {
    await ProgressService.saveProgress({
      bookId: _bookId,
      chapterId: 0,
      chapterNo: data.chapterNo,
      pageIndex: 0,
      offset: data.position,
      progressPercent: data.progressPercent,
      mode: settings.value.readerMode,
      lastReadAt: Date.now(),
    })
  }

  return {
    // 状态
    bookId, bookTitle, chapterList,
    chapter, pages, currentPageIndex,
    settings,
    phase, toolbarVisible, settingsVisible,
    menuVisible, commentPanelVisible, catalogVisible,
    loading, chapterLoading, error, progress,
    scrollAnchorIndex,

    // 计算属性
    totalPages, progressPercent,
    isFirstChapter, isLastChapter,
    isNight, mode, turnMode,

    // 章节操作
    setChapter, setPages, setCurrentPageIndex,

    // 设置操作
    updateSettings, updateTypography,
    toggleNightMode, setBackgroundColor,
    setReaderMode, setTurnMode,

    // UI 面板
    toggleToolbar, showToolbar, hideToolbar,
    toggleSettings, showCatalog, hideCatalog,

    // 进度
    loadProgress, saveCurrentProgress,

    // 状态管理
    setPhase, setLoading, setChapterLoading, setError,

    // 重置
    reset,

    // 向下兼容
    setting,
    loadSetting, saveSetting, updateLocalSetting,
    saveProgress,
  }
})
