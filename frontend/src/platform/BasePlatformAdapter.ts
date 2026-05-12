/**
 * BasePlatformAdapter — 平台适配器抽象基类
 *
 * 定义 IPlatformAdapter 的骨架实现（带安全默认值）。
 * 子类只需覆盖需要自定义的方法。
 */

import { DEFAULT_PLATFORM_CONFIG } from './ReaderPlatform'
import type {
  IPlatformAdapter,
  PlatformType,
  PlatformCapability,
  ScreenInfo,
  IStorage,
  ITextMeasureService,
  NetworkState,
  BrightnessInfo,
  ShareOptions,
  ShareResult,
  TtsOptions,
  TtsEvent,
  SafeAreaInsets,
  PlatformConfig,
} from '../types/platform'

export abstract class BasePlatformAdapter implements IPlatformAdapter {
  abstract readonly platform: PlatformType
  abstract readonly storage: IStorage
  abstract readonly textMeasure: ITextMeasureService

  protected config: PlatformConfig

  constructor(config: Partial<PlatformConfig> = {}) {
    this.config = { ...DEFAULT_PLATFORM_CONFIG, ...config }
  }

  hasCapability(_cap: PlatformCapability): boolean {
    return false
  }

  getScreenInfo(): ScreenInfo {
    return {
      width: 375,
      height: 667,
      pixelRatio: 2,
      statusBarHeight: 20,
      safeAreaTop: 20,
      safeAreaBottom: 0,
      safeAreaLeft: 0,
      safeAreaRight: 0,
      maxContentWidth: this.config.desktopMaxWidth,
      isDesktop: false,
    }
  }

  getNetworkState(): NetworkState {
    return { connected: true, type: 'unknown' }
  }

  onNetworkChange(_callback: (state: NetworkState) => void): () => void {
    return () => {}
  }

  getBrightness(): BrightnessInfo {
    return { system: 80, manual: 80, followSystem: true }
  }

  setBrightness(_value: number): void {}

  setFollowSystemBrightness(_follow: boolean): void {}

  setStatusBarStyle(_style: 'light' | 'dark'): void {}

  setStatusBarVisible(_visible: boolean): void {}

  keepScreenOn(_on: boolean): void {}

  vibrate(_style: 'light' | 'medium' | 'heavy'): void {}

  async copyToClipboard(_text: string): Promise<void> {}

  async readFromClipboard(): Promise<string> {
    return ''
  }

  async share(_options: ShareOptions): Promise<ShareResult> {
    return { success: false, error: 'not implemented' }
  }

  async speak(_text: string, _options?: TtsOptions): Promise<void> {}

  stopSpeaking(): void {}

  onTtsEvent(_callback: (event: TtsEvent) => void): () => void {
    return () => {}
  }

  navigateBack(): void {}

  navigateTo(_url: string): void {}

  getSafeArea(): SafeAreaInsets {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }

  getOS(): 'ios' | 'android' | 'windows' | 'macos' | 'linux' {
    return 'windows'
  }

  getAppVersion(): string {
    return '1.0.0'
  }
}
