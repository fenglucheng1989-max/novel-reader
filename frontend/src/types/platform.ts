/**
 * 平台抽象层类型定义
 *
 * 定义所有平台差异的抽象接口。
 * 业务代码通过接口调用，不直接引用 uni / document / window。
 */

import type { ReaderSettings, ReaderProgress, ChapterData, Page } from './reader'

/* ===================== 存储抽象 ===================== */

/** 存储接口 */
export interface IStorage {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  remove(key: string): void
  clear(): void
}

/* ===================== 屏幕信息 ===================== */

export interface ScreenInfo {
  width: number
  height: number
  pixelRatio: number
  statusBarHeight: number
  safeAreaTop: number
  safeAreaBottom: number
  safeAreaLeft: number
  safeAreaRight: number
  /** 桌面端: 阅读区域最大宽度 */
  maxContentWidth: number
  /** 是否桌面端 H5 */
  isDesktop: boolean
}

/* ===================== 亮度 ===================== */

export interface BrightnessInfo {
  /** 0-100 */
  system: number
  /** 0-100 */
  manual: number
  /** 跟随系统 */
  followSystem: boolean
}

/* ===================== 文本测量 ===================== */

/** 文本测量服务接口 */
export interface ITextMeasureService {
  /** 测量单行文本宽度（像素） */
  measureText(text: string, fontSize: number, fontFamily: string): number
  /** 清理资源 */
  destroy(): void
}

/* ===================== 网络 ===================== */

export interface NetworkState {
  connected: boolean
  type: 'wifi' | 'cellular' | 'none' | 'ethernet' | 'unknown'
}

/* ===================== 平台能力 ===================== */

/** 平台能力枚举 */
export type PlatformCapability =
  | 'NATIVE_SHARE'
  | 'TTS'
  | 'HAPTIC'
  | 'STATUS_BAR'
  | 'BRIGHTNESS'
  | 'SCREEN_KEEP_ON'
  | 'FILE_SYSTEM'
  | 'CLIPBOARD'

/** 平台类型 */
export type PlatformType = 'h5' | 'app' | 'mp-weixin' | 'mp-alipay' | 'mp-baidu'

/* ===================== 平台提供者 ===================== */

/**
 * 平台适配器接口
 *
 * 所有平台差异在此接口收敛。
 * 业务层通过 ReaderPlatform.getInstance() 调用，
 * 不直接引用任何 uni.* / document / window。
 */
export interface IPlatformAdapter {
  /** 平台类型 */
  readonly platform: PlatformType

  /** 检查平台能力 */
  hasCapability(cap: PlatformCapability): boolean

  /* ---- 屏幕 ---- */
  getScreenInfo(): ScreenInfo

  /* ---- 存储 ---- */
  readonly storage: IStorage

  /* ---- 文本测量 ---- */
  readonly textMeasure: ITextMeasureService

  /* ---- 网络 ---- */
  getNetworkState(): NetworkState
  onNetworkChange(callback: (state: NetworkState) => void): () => void

  /* ---- 亮度 ---- */
  getBrightness(): BrightnessInfo
  setBrightness(value: number): void
  /** 跟随系统亮度 */
  setFollowSystemBrightness(follow: boolean): void

  /* ---- 系统 UI ---- */
  setStatusBarStyle(style: 'light' | 'dark'): void
  setStatusBarVisible(visible: boolean): void
  /** 屏幕常亮 */
  keepScreenOn(on: boolean): void
  /** 震动反馈 */
  vibrate(style: 'light' | 'medium' | 'heavy'): void

  /* ---- 剪贴板 ---- */
  copyToClipboard(text: string): Promise<void>
  readFromClipboard(): Promise<string>

  /* ---- 分享 ---- */
  share(options: ShareOptions): Promise<ShareResult>

  /* ---- 语言合成 ---- */
  speak(text: string, options?: TtsOptions): Promise<void>
  stopSpeaking(): void
  onTtsEvent(callback: (event: TtsEvent) => void): () => void

  /* ---- 导航 ---- */
  navigateBack(): void
  navigateTo(url: string): void

  /* ---- 安全区 ---- */
  getSafeArea(): SafeAreaInsets

  /* ---- 环境信息 ---- */
  getOS(): 'ios' | 'android' | 'windows' | 'macos' | 'linux'
  getAppVersion(): string
}

/* ===================== 分享 ===================== */

export interface ShareOptions {
  title?: string
  text: string
  url?: string
  imageUrl?: string
  type?: 'text' | 'image' | 'url'
}

export interface ShareResult {
  success: boolean
  platform?: string
  error?: string
}

/* ===================== TTS ===================== */

export interface TtsOptions {
  rate?: number
  pitch?: number
  volume?: number
  voice?: string
  /** 从 paragraphIndex 开始朗读 */
  startParagraph?: number
}

export type TtsEventType = 'start' | 'pause' | 'resume' | 'end' | 'error' | 'word'

export interface TtsEvent {
  type: TtsEventType
  charIndex?: number
  charLength?: number
  paragraphIndex?: number
  error?: string
}

/* ===================== 安全区 ===================== */

export interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

/* ===================== 持久化数据格式 ===================== */

/** 持久化存储的阅读设置 */
export interface PersistedSettings {
  version: number
  data: ReaderSettings
  updatedAt: number
}

/** 持久化存储的阅读进度 */
export interface PersistedProgress {
  version: number
  data: ReaderProgress
  updatedAt: number
}

/** 持久化存储的章节缓存 */
export interface PersistedChapterCache {
  version: number
  entries: Record<string, { chapter: ChapterData; fetchedAt: number }>
  updatedAt: number
}

/** 持久化存储的分页缓存 */
export interface PersistedPageCache {
  version: number
  entries: Record<string, { pages: Page[]; optionsHash: string; createdAt: number }>
  updatedAt: number
}

/* ===================== 配置 ===================== */

/** 平台适配器配置 */
export interface PlatformConfig {
  /** 存储 key 前缀 */
  storagePrefix: string
  /** 缓存版本号 */
  cacheVersion: number
  /** 桌面端最大阅读宽度 */
  desktopMaxWidth: number
  /** 页面缓存数量上限 */
  maxPageCacheEntries: number
  /** 章节缓存数量上限 */
  maxChapterCacheEntries: number
}
