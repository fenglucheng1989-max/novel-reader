/**
 * H5Platform — H5 平台适配器实现
 *
 * 完整实现 IPlatformAdapter 接口。
 * 所有平台差异在此类中隔离。
 *
 * 关键实现：
 * - 文本测量：Canvas 2D measureText（像素精确）
 * - 存储：localStorage
 * - 分享：navigator.share → clipboard fallback
 * - TTS：speechSynthesis
 * - 亮度：CSS filter brightness
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

class H5Storage implements IStorage {
  private prefix: string

  constructor(prefix: string) {
    this.prefix = prefix
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefix + key)
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value))
    } catch {
      // localStorage 可能满
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch {
      // ignore
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(this.prefix)) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    } catch {
      // ignore
    }
  }
}

/* ===================== 文本测量 ===================== */

class H5TextMeasureService implements ITextMeasureService {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null

  private ensureContext(): CanvasRenderingContext2D {
    if (!this.ctx) {
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
    }
    if (!this.ctx) {
      throw new Error('[TextMeasure] Canvas 2D context unavailable')
    }
    return this.ctx
  }

  measureText(text: string, fontSize: number, fontFamily: string): number {
    const ctx = this.ensureContext()
    ctx.font = `${fontSize}px ${fontFamily}`
    return ctx.measureText(text).width
  }

  destroy(): void {
    this.ctx = null
    this.canvas = null
  }
}

/* ===================== 平台实现 ===================== */

export class H5Platform extends BasePlatformAdapter {
  readonly platform: PlatformType = 'h5'
  readonly storage: IStorage
  readonly textMeasure: ITextMeasureService

  private brightnessOverlay: HTMLDivElement | null = null
  private speechSynth: SpeechSynthesis | null = null
  private ttsCallbacks: Array<(event: TtsEvent) => void> = []
  private utterance: SpeechSynthesisUtterance | null = null

  constructor() {
    super()
    this.storage = new H5Storage(this.config.storagePrefix)
    this.textMeasure = new H5TextMeasureService()
  }

  hasCapability(cap: PlatformCapability): boolean {
    switch (cap) {
      case 'NATIVE_SHARE':
        return !!navigator.share
      case 'TTS':
        return !!window.speechSynthesis
      case 'CLIPBOARD':
        return !!navigator.clipboard
      case 'HAPTIC':
        return !!navigator.vibrate
      case 'SCREEN_KEEP_ON':
        return 'wakeLock' in navigator
      case 'STATUS_BAR':
      case 'BRIGHTNESS':
      case 'FILE_SYSTEM':
        return false
      default:
        return false
    }
  }

  getScreenInfo(): ScreenInfo {
    const width = Math.max(320, window.innerWidth || 320)
    const height = Math.max(480, window.innerHeight || 480)
    const isDesktop = width >= 768

    // 桌面端：限制最大阅读宽度
    const maxContentWidth = isDesktop
      ? Math.min(this.config.desktopMaxWidth, width)
      : width

    // 安全区（使用 CSS env 或 fallback）
    const safeAreaTop = this.parseEnv('safe-area-inset-top', 0)
    const safeAreaBottom = this.parseEnv('safe-area-inset-bottom', 0)

    return {
      width,
      height,
      pixelRatio: window.devicePixelRatio || 1,
      statusBarHeight: safeAreaTop || 20,
      safeAreaTop,
      safeAreaBottom,
      safeAreaLeft: this.parseEnv('safe-area-inset-left', 0),
      safeAreaRight: this.parseEnv('safe-area-inset-right', 0),
      maxContentWidth,
      isDesktop,
    }
  }

  private parseEnv(name: string, fallback: number): number {
    try {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue(`--${name}`)
        .trim()
      if (val.endsWith('px')) {
        return parseFloat(val) || fallback
      }
      // 尝试从 env() 读取
      const dummy = document.createElement('div')
      dummy.style.cssText = `position:fixed;${name}:env(${name})`
      document.body.appendChild(dummy)
      const envVal = parseFloat(getComputedStyle(dummy).getPropertyValue(name))
      document.body.removeChild(dummy)
      return isNaN(envVal) ? fallback : envVal
    } catch {
      return fallback
    }
  }

  getNetworkState(): NetworkState {
    return {
      connected: navigator.onLine,
      type: navigator.onLine ? 'unknown' : 'none',
    }
  }

  onNetworkChange(callback: (state: NetworkState) => void): () => void {
    const handleOnline = (): void => {
      callback({ connected: true, type: 'unknown' })
    }
    const handleOffline = (): void => {
      callback({ connected: false, type: 'none' })
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  getBrightness(): BrightnessInfo {
    return {
      system: 100,
      manual: 80,
      followSystem: false,
    }
  }

  setBrightness(value: number): void {
    // H5：通过 CSS filter 模拟亮度
    if (!this.brightnessOverlay) {
      this.brightnessOverlay = document.createElement('div')
      this.brightnessOverlay.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'pointer-events:none;z-index:2147483647;transition:background-color 0.3s;'
      document.body.appendChild(this.brightnessOverlay)
    }
    const alpha = 1 - value / 100
    this.brightnessOverlay.style.backgroundColor = `rgba(0,0,0,${alpha * 0.6})`
  }

  setFollowSystemBrightness(_follow: boolean): void {}

  setStatusBarStyle(style: 'light' | 'dark'): void {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', style === 'dark' ? '#000000' : '#ffffff')
    }
  }

  setStatusBarVisible(_visible: boolean): void {}

  keepScreenOn(_on: boolean): void {
    // H5 无法控制屏幕常亮
  }

  vibrate(style: 'light' | 'medium' | 'heavy'): void {
    if (!navigator.vibrate) return
    const durations: Record<string, number> = {
      light: 10,
      medium: 20,
      heavy: 40,
    }
    navigator.vibrate(durations[style] || 10)
  }

  async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return
    }
    // fallback: textarea + execCommand
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  async readFromClipboard(): Promise<string> {
    if (navigator.clipboard) {
      return navigator.clipboard.readText()
    }
    return ''
  }

  async share(options: ShareOptions): Promise<ShareResult> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url,
        })
        return { success: true }
      } catch (err: unknown) {
        // user cancelled
        const msg = err instanceof Error ? err.message : 'share cancelled'
        return { success: false, error: msg }
      }
    }

    // fallback: 复制到剪贴板
    const shareText = [options.title, options.text, options.url]
      .filter(Boolean)
      .join('\n')
    await this.copyToClipboard(shareText)
    return { success: true, platform: 'clipboard' }
  }

  async speak(text: string, options?: TtsOptions): Promise<void> {
    if (!window.speechSynthesis) {
      throw new Error('[TTS] SpeechSynthesis not available')
    }

    this.speechSynth = window.speechSynthesis
    this.utterance = new SpeechSynthesisUtterance(text)

    if (options?.rate != null) this.utterance.rate = options.rate
    if (options?.pitch != null) this.utterance.pitch = options.pitch
    if (options?.volume != null) this.utterance.volume = options.volume
    if (options?.voice) {
      const voices = this.speechSynth.getVoices()
      const matched = voices.find((v) => v.name === options.voice)
      if (matched) this.utterance.voice = matched
    }

    this.utterance.onstart = () => {
      this.emitTtsEvent({ type: 'start' })
    }
    this.utterance.onend = () => {
      this.emitTtsEvent({ type: 'end' })
      this.utterance = null
    }
    this.utterance.onerror = (e) => {
      this.emitTtsEvent({ type: 'error', error: e.error })
      this.utterance = null
    }
    this.utterance.onboundary = (e) => {
      if (e.name === 'word') {
        this.emitTtsEvent({
          type: 'word',
          charIndex: e.charIndex,
          charLength: e.charLength ?? 1,
        })
      }
    }

    this.speechSynth.speak(this.utterance)
  }

  stopSpeaking(): void {
    if (this.speechSynth) {
      this.speechSynth.cancel()
    }
    this.utterance = null
  }

  onTtsEvent(callback: (event: TtsEvent) => void): () => void {
    this.ttsCallbacks.push(callback)
    return () => {
      const i = this.ttsCallbacks.indexOf(callback)
      if (i >= 0) this.ttsCallbacks.splice(i, 1)
    }
  }

  private emitTtsEvent(event: TtsEvent): void {
    this.ttsCallbacks.forEach((cb) => cb(event))
  }

  navigateBack(): void {
    window.history.back()
  }

  navigateTo(url: string): void {
    window.location.href = url
  }

  getSafeArea(): SafeAreaInsets {
    return {
      top: this.parseEnv('safe-area-inset-top', 0),
      bottom: this.parseEnv('safe-area-inset-bottom', 0),
      left: this.parseEnv('safe-area-inset-left', 0),
      right: this.parseEnv('safe-area-inset-right', 0),
    }
  }

  getOS(): 'ios' | 'android' | 'windows' | 'macos' | 'linux' {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios'
    if (ua.includes('android')) return 'android'
    if (ua.includes('mac')) return 'macos'
    if (ua.includes('windows')) return 'windows'
    return 'linux'
  }

  getAppVersion(): string {
    return '1.0.0'
  }
}
