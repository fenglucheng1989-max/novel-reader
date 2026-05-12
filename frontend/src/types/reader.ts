/**
 * 阅读器内核类型定义
 *
 * 本文件定义阅读器内核所有核心类型。
 * 遵循 strict 模式，禁止 any，接口优先。
 */

/* ===================== 阅读模式 ===================== */

/** 阅读模式 */
export type ReaderMode = 'PAGINATION' | 'SCROLL'

/** 翻页动画模式 */
export type TurnMode = 'NONE' | 'SLIDE' | 'COVER' | 'SCROLL'

/** 扩展动画模式（预留未来） */
export type ExtendedTurnMode = TurnMode | 'CURL' | 'SIMULATION'

/** 阅读器主题 */
export type ReaderTheme =
  | 'DEFAULT'
  | 'PARCHMENT'
  | 'LIGHT_GREEN'
  | 'LIGHT_BLUE'
  | 'NIGHT'
  | 'GRAY'

/* ===================== 章节 ===================== */

/** 章节数据（阅读器内部使用） */
export interface ChapterData {
  id: string | number
  bookId: string | number
  chapterNo: number
  title: string
  content: string
  wordCount: number
  totalChapters: number
}

/* ===================== 分页 ===================== */

/** 行（断行结果） */
export interface Line {
  text: string
  paragraphIndex: number
  isFirstInParagraph: boolean
  indent: boolean
  isTitle: boolean
  /** 在整章字符流中的偏移 */
  charOffset: number
  /** 本行字符数 */
  charLength: number
}

/** 页面（分页结果） */
export interface Page {
  index: number
  lines: Line[]
  html: string
  isFirst: boolean
  fillRatio: number
  paragraphRange: [number, number]
  charRange: [number, number]
}

/** 分页统计 */
export interface SplitStats {
  totalChars: number
  totalLines: number
  totalPages: number
  avgFillRatio: number
  maxFillVariance: number
  splitTimeMs: number
}

/** 分页结果 */
export interface SplitResult {
  pages: Page[]
  stats: SplitStats
}

/** 分页参数（由 platform 注入后计算） */
export interface SplitOptions {
  viewWidth: number
  viewHeight: number
  fontSize: number
  fontFamily: string
  lineHeight: number
  letterSpacing: number
  paddingTop: number
  paddingBottom: number
  paddingLeft: number
  paddingRight: number
  paragraphSpacing: number
  paragraphIndent: boolean
  /** 首页标题区高度（含上下间距） */
  titleHeight: number
  /** 页眉高度 */
  headerHeight: number
  /** 页脚高度 */
  footerHeight: number
}

/** 文本测量接口（由 PlatformAdapter 注入） */
export interface TextMeasureFunction {
  (text: string, fontSize: number, fontFamily: string): number
}

/* ===================== 设置 ===================== */

/** 阅读设置（完整版） */
export interface ReaderSettings {
  fontSize: number
  fontFamily: string
  lineHeight: number
  letterSpacing: number
  backgroundColor: string
  textColor: string
  readerMode: ReaderMode
  turnMode: TurnMode
  animationSpeed: number
  brightness: number
  nightMode: boolean
  eyeProtection: boolean
  paragraphIndent: boolean
  paragraphSpacing: number
  marginHorizontal: number
  marginVertical: number
  showHeader: boolean
  showFooter: boolean
}

/** 设置变更事件 */
export interface SettingsChangeEvent {
  key: keyof ReaderSettings
  oldValue: unknown
  newValue: unknown
}

/* ===================== 进度 ===================== */

/** 阅读进度（精确到 pageIndex） */
export interface ReaderProgress {
  bookId: string | number
  chapterId: string | number
  chapterNo: number
  pageIndex: number
  offset: number
  progressPercent: number
  mode: ReaderMode
  lastReadAt: number
}

/* ===================== 缓存 ===================== */

/** 通用缓存条目 */
export interface CacheEntry<T> {
  data: T
  createdAt: number
  expiresAt: number
  version: number
}

/** 章节缓存 */
export interface ChapterCacheEntry {
  chapter: ChapterData
  pages: Page[] | null
  fetchedAt: number
}

/** 缓存统计 */
export interface CacheStats {
  memoryEntries: number
  storageEntries: number
  memorySize: number
  hitRate: number
}

/* ===================== 状态机 ===================== */

/** 阅读器阶段 */
export type ReaderPhase =
  | 'IDLE'
  | 'LOADING_CHAPTER'
  | 'SPLITTING'
  | 'READY'
  | 'ANIMATING'
  | 'MENU'
  | 'SETTINGS'
  | 'COMMENTS'
  | 'ERROR'

/** 状态转换 */
export interface StateTransition {
  from: ReaderPhase
  to: ReaderPhase
  reason: string
  timestamp: number
}

/* ===================== 状态 ===================== */

/** 阅读器运行时状态 */
export interface ReaderRuntimeState {
  phase: ReaderPhase
  mode: ReaderMode
  chapter: ChapterData | null
  pages: Page[]
  currentPageIndex: number
  isAnimating: boolean
  isLoading: boolean
  error: string | null
  menuVisible: boolean
  settingsVisible: boolean
  toolbarVisible: boolean
  commentPanelVisible: boolean
  transitionHistory: StateTransition[]
}

/** 加载状态细节 */
export interface LoadingState {
  chapter: boolean
  pages: boolean
  preload: boolean
  comments: Record<number, boolean>
  submittingComment: boolean
  savingProgress: boolean
}

/* ===================== 菜单 ===================== */

/** 菜单项 */
export interface MenuItem {
  id: string
  label: string
  icon?: string
  action: string
  disabled?: boolean
}

/** 长按菜单操作接口 */
export interface ILongPressAction {
  id: string
  label: string
  icon?: string
  order: number
  handler: (context: LongPressContext) => void | Promise<void>
}

/** 长按操作上下文 */
export interface LongPressContext {
  text: string
  paragraphIndex: number
  chapterNo: number
  bookId: string | number
  pageIndex: number
  rect: BoundingRect | null
}

/* ===================== 高亮 ===================== */

/** 文本高亮 */
export interface TextHighlight {
  id: string | number
  bookId: string | number
  chapterNo: number
  paragraphIndex: number
  text: string
  color: string
  createdAt: number
  style: HighlightStyle
}

export type HighlightStyle = 'LINE' | 'WAVE' | 'MARKER'

/* ===================== 评论 ===================== */

/** 段评 */
export interface ParagraphComment {
  id: string | number
  bookId: string | number
  chapterNo: number
  paragraphIndex: number
  userId: string | number
  nickname: string
  avatar: string
  content: string
  likeCount: number
  liked: boolean
  createdAt: number
}

/** 评论创建请求 */
export interface CreateCommentRequest {
  bookId: string | number
  chapterNo: number
  paragraphIndex: number
  content: string
  quoteText: string
}

/** 评论响应 */
export interface CommentListResponse {
  comments: ParagraphComment[]
  total: number
  hasMore: boolean
}

/* ===================== 书签 ===================== */

export interface Bookmark {
  id: string | number
  bookId: string | number
  chapterNo: number
  chapterTitle: string
  pageIndex: number
  text: string
  createdAt: number
}

/* ===================== 事件 ===================== */

/** 阅读器事件映射 */
export interface ReaderEventMap {
  'chapter:loaded': { chapter: ChapterData }
  'chapter:changed': { from: number; to: number }
  'chapterList:loaded': { chapters: ChapterData[] }
  'page:changed': { pageIndex: number; totalPages: number }
  'mode:changed': { mode: ReaderMode }
  'settings:changed': { key: keyof ReaderSettings; value: unknown }
  'progress:saved': { progress: ReaderProgress }
  'phase:changed': { from: ReaderPhase; to: ReaderPhase }
  'animation:start': { dir: 1 | -1; mode: TurnMode }
  'animation:end': { dir: 1 | -1; mode: TurnMode }
  'error': { code: string; message: string }
  'menu:open': void
  'menu:close': void
  'longpress': LongPressContext
  'highlight:created': TextHighlight
  'highlight:removed': TextHighlight
  'comment:added': ParagraphComment
}

export type ReaderEventName = keyof ReaderEventMap

export type ReaderEventHandler<K extends ReaderEventName> =
  (payload: ReaderEventMap[K]) => void

/* ===================== 工具类型 ===================== */

export interface BoundingRect {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}

/* ===================== 注释类型 ===================== */

/** 段落级注释元信息 */
export interface ParagraphMeta {
  index: number
  text: string
  commentCount: number
  highlights: TextHighlight[]
}
