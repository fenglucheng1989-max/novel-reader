/**
 * AppPlatform — uni-app App 平台适配器实现
 *
 * 使用 uni.* 原生 API。
 * 文本测量使用字符估算（CJK ≈ fontSize, ASCII ≈ fontSize * 0.55）
 * 后续可通过 renderjs 扩展为像素精确测量。
 */

import { BasePlatformAdapter } from './BasePlatformAdapter'
import type {
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
} from '../types/platform'

/* ===================== 存储 ===================== */

class AppStorage implements IStorage {
  private prefix: string

  constructor(prefix: string) {
    this.prefix = prefix
  }

  get<T>(key: string): T | null {
    try {
      const raw = uni.getStorageSync(this.prefix + key)
      if (raw === '' || raw == null) return null
      // uni-app 可能自动序列化，也可能返回字符串
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw) as T
        } catch {
          return raw as unknown as T
        }
      }
      return raw as T
    } catch {
      return null
    }
  }

  set<T>(key: string, value: T): void {
    try {
      uni.setStorageSync(this.prefix + key, value)
    } catch {
      // 存储满时静默失败
    }
  }

  remove(key: string): void {
    try {
      uni.removeStorageSync(this.prefix + key)
    } catch {
      // ignore
    }
  }

  clear(): void {
    try {
      const { keys } = uni.getStorageInfoSync()
      keys.forEach((k: string) => {
        if (k.startsWith(this.prefix)) {
          uni.removeStorageSync(k)
        }
      })
    } catch {
      // ignore
    }
  }
}

/* ===================== 文本测量 ===================== */

class AppTextMeasureService implements ITextMeasureService {
  measureText(text: string, fontSize: number, _fontFamily: string): number {
    // App 端：基于字符宽度估算
    // CJK ≈ 1em, ASCII ≈ 0.55em, 标点 ≈ 0.9em
    let width = 0
    for (const ch of text) {
      const code = ch.charCodeAt(0)
      if (code >= 0x4e00 && code <= 0x9fff) {
        // CJK 统一表意文字
        width += fontSize
      } else if (code >= 0x3000 && code <= 0x303f) {
        // CJK 符号和标点
        width += fontSize * 0.9
      } else if (code >= 0xff00 && code <= 0xffef) {
        // 全角 ASCII 和半角标点
        width += code >= 0xff01 && code <= 0xff5e ? fontSize : fontSize * 0.9
      } else if (
        (code >= 0x41 && code <= 0x5a) ||
        (code >= 0x61 && code <= 0x7a) ||
        (code >= 0x30 && code <= 0x39)
      ) {
        // ASCII 字母和数字
        width += fontSize * 0.55
      } else if (code <= 0x7e) {
        // 其他 ASCII
        width += fontSize * 0.5
      } else {
        width += fontSize
      }
    }
    return width
  }

  destroy(): void {
    // nothing to clean up
  }
}

/* ===================== 平台实现 ===================== */

export class AppPlatform extends BasePlatformAdapter {
  readonly platform: PlatformType = 'app'
  readonly storage: IStorage
  readonly textMeasure: ITextMeasureService

  constructor() {
    super()
    this.storage = new AppStorage(this.config.storagePrefix)
    this.textMeasure = new AppTextMeasureService()
  }

  hasCapability(cap: PlatformCapability): boolean {
    switch (cap) {
      case 'NATIVE_SHARE':
        return true
      case 'STATUS_BAR':
        return true
      case 'BRIGHTNESS':
        return true
      case 'SCREEN_KEEP_ON':
        return true
      case 'HAPTIC':
        return true
      case 'CLIPBOARD':
        return true
      case 'FILE_SYSTEM':
        return true
      case 'TTS':
        // App 端 TTS 依赖原生插件
        return false
      default:
        return false
    }
  }

  getScreenInfo(): ScreenInfo {
    try {
      const info = uni.getSystemInfoSync()
      const width = info.windowWidth || info.screenWidth || 375
      const height = info.windowHeight || info.screenHeight || 667
      const statusBarHeight = info.statusBarHeight || 0
      const isDesktop = width >= 768

      return {
        width,
        height,
        pixelRatio: info.pixelRatio || 1,
        statusBarHeight,
        safeAreaTop: info.safeArea?.top ?? statusBarHeight,
        safeAreaBottom: info.safeArea?.bottom ?? 0,
        safeAreaLeft: info.safeArea?.left ?? 0,
        safeAreaRight: info.safeArea?.right ?? 0,
        maxContentWidth: isDesktop
          ? Math.min(this.config.desktopMaxWidth, width)
          : width,
        isDesktop,
      }
    } catch {
      return super.getScreenInfo()
    }
  }

  getNetworkState(): NetworkState {
    try {
      const netType = uni.getNetworkTypeSync()
      if (netType === 'none') {
        return { connected: false, type: 'none' }
      }
      return {
        connected: true,
        type: netType as NetworkState['type'],
      }
    } catch {
      return super.getNetworkState()
    }
  }

  onNetworkChange(callback: (state: NetworkState) => void): () => void {
    uni.onNetworkStatusChange((res) => {
      callback({
        connected: res.isConnected,
        type: res.networkType as NetworkState['type'],
      })
    })
    return () => {
      uni.offNetworkStatusChange()
    }
  }

  getBrightness(): BrightnessInfo {
    try {
      const value = uni.getScreenBrightnessSync()
      return {
        system: Math.round(value * 100),
        manual: this.storage.get<number>('brightness') ?? Math.round(value * 100),
        followSystem: true,
      }
    } catch {
      return super.getBrightness()
    }
  }

  setBrightness(value: number): void {
    try {
      uni.setScreenBrightnessSync({ value: value / 100 })
      this.storage.set('brightness', value)
    } catch {
      // ignore
    }
  }

  setFollowSystemBrightness(follow: boolean): void {
    // App 端跟随系统亮度需原生支持
    // 暂不实现
  }

  setStatusBarStyle(style: 'light' | 'dark'): void {
    try {
      uni.setStatusBarStyle({
        style: style === 'dark' ? 'light' : 'dark',
      })
    } catch {
      // ignore
    }
  }

  setStatusBarVisible(visible: boolean): void {
    try {
      if (visible) {
        uni.showTabBar({ animation: false })
      } else {
        uni.hideTabBar({ animation: false })
      }
    } catch {
      // ignore
    }
  }

  keepScreenOn(on: boolean): void {
    if (on) {
      uni.setKeepScreenOn({ keepScreenOn: true })
    }
  }

  vibrate(style: 'light' | 'medium' | 'heavy'): void {
    try {
      uni.vibrateShort({ type: style === 'heavy' ? 'heavy' : 'light' })
    } catch {
      try {
        uni.vibrateLong()
      } catch {
        // ignore
      }
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    uni.setClipboardData({ data: text })
  }

  async readFromClipboard(): Promise<string> {
    return new Promise((resolve) => {
      uni.getClipboardData({
        success: (res) => resolve(res.data || ''),
        fail: () => resolve(''),
      })
    })
  }

  async share(options: ShareOptions): Promise<ShareResult> {
    return new Promise((resolve) => {
      uni.share({
        title: options.title || '',
        content: options.text,
        imageUrl: options.imageUrl,
        success: () => resolve({ success: true }),
        fail: (err) =>
          resolve({ success: false, error: err.errMsg || 'share failed' }),
      })
    })
  }

  async speak(_text: string, _options?: TtsOptions): Promise<void> {
    throw new Error('[TTS] App 端 TTS 需要原生插件')
  }

  stopSpeaking(): void {
    // 需要原生插件
  }

  onTtsEvent(_callback: (event: TtsEvent) => void): () => void {
    return () => {}
  }

  navigateBack(): void {
    uni.navigateBack()
  }

  navigateTo(url: string): void {
    uni.navigateTo({ url })
  }

  getSafeArea(): SafeAreaInsets {
    try {
      const info = uni.getSystemInfoSync()
      return {
        top: info.safeArea?.top ?? info.statusBarHeight ?? 0,
        bottom: info.safeArea?.bottom ?? 0,
        left: info.safeArea?.left ?? 0,
        right: info.safeArea?.right ?? 0,
      }
    } catch {
      return super.getSafeArea()
    }
  }

  getOS(): 'ios' | 'android' | 'windows' | 'macos' | 'linux' {
    try {
      const info = uni.getSystemInfoSync()
      const platform = info.platform?.toLowerCase() || ''
      if (platform.includes('ios')) return 'ios'
      if (platform.includes('android')) return 'android'
      if (platform.includes('windows')) return 'windows'
      if (platform.includes('mac')) return 'macos'
      return 'android'
    } catch {
      return 'android'
    }
  }

  getAppVersion(): string {
    try {
      const info = uni.getAppBaseInfo?.() || {}
      return (info as { appVersion?: string }).appVersion || '1.0.0'
    } catch {
      return '1.0.0'
    }
  }
}
