export type {
  Book,
  BookStatus,
  Chapter,
  ShelfItem,
  ReadingProgress,
  ShelfStats,
  Comment,
  CommentType,
  PageResult,
  BookDetail,
} from './book'

export type {
  UserInfo,
  UserState,
  LoginResult,
  ReadingSetting,
  ReaderTheme,
  TurnMode,
} from './user'

export type { ApiResponse } from './api'

/* ===== 阅读器内核类型 ===== */
export type {
  ReaderMode,
  ExtendedTurnMode,
  ChapterData,
  Line,
  Page,
  SplitResult,
  SplitStats,
  SplitOptions,
  TextMeasureFunction,
  ReaderSettings,
  SettingsChangeEvent,
  ReaderProgress,
  CacheEntry,
  ChapterCacheEntry,
  CacheStats,
  ReaderPhase,
  StateTransition,
  ReaderRuntimeState,
  LoadingState,
  MenuItem,
  ILongPressAction,
  LongPressContext,
  TextHighlight,
  HighlightStyle,
  ParagraphComment,
  CreateCommentRequest,
  CommentListResponse,
  Bookmark,
  ReaderEventMap,
  ReaderEventName,
  ReaderEventHandler,
  BoundingRect,
  ParagraphMeta,
} from './reader'

export type {
  IStorage,
  ScreenInfo,
  BrightnessInfo,
  ITextMeasureService,
  NetworkState,
  PlatformCapability,
  PlatformType,
  IPlatformAdapter,
  ShareOptions,
  ShareResult,
  TtsOptions,
  TtsEventType,
  TtsEvent,
  SafeAreaInsets,
  PersistedSettings,
  PersistedProgress,
  PersistedChapterCache,
  PersistedPageCache,
  PlatformConfig,
} from './platform'

export type {
  FlipContext,
  IAnimator,
  AnimatorEntry,
  IAnimationFactory,
  FlipState,
  AnimationEventType,
  AnimationEvent,
  AnimationConfig,
} from './animation'

export type {
  ICommentService,
  CommentPanelState,
  CommentInputState,
  CommentBubbleData,
} from './comment'
