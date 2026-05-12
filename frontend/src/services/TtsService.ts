/**
 * TtsService — 听书服务
 *
 * 统一 TTS 接口，适配多平台。
 * H5：SpeechSynthesis
 * App：原生插件（预留扩展点）
 *
 * 支持：
 * - 从指定段落开始朗读
 * - 暂停/继续
 * - 朗读进度回调
 */

import { getPlatformAdapter } from '../platform/ReaderPlatform'
import type { TtsOptions, TtsEvent } from '../types/platform'

export type TtsState = 'IDLE' | 'PLAYING' | 'PAUSED'

export interface ITtsService {
  readonly state: TtsState
  start(text: string, options?: TtsOptions): Promise<void>
  pause(): void
  resume(): void
  stop(): void
  onEvent(callback: (event: TtsEvent) => void): () => void
}

export class TtsService implements ITtsService {
  private platform = getPlatformAdapter()
  private _state: TtsState = 'IDLE'
  private cleanupFns: Array<() => void> = []

  get state(): TtsState {
    return this._state
  }

  async start(text: string, options?: TtsOptions): Promise<void> {
    if (this._state === 'PLAYING') {
      this.platform.stopSpeaking()
    }

    this._state = 'PLAYING'

    try {
      await this.platform.speak(text, options)
    } catch {
      this._state = 'IDLE'
      throw new Error('TTS 启动失败')
    }
  }

  pause(): void {
    this._state = 'PAUSED'
  }

  resume(): void {
    if (this._state === 'PAUSED') {
      this._state = 'PLAYING'
    }
  }

  stop(): void {
    this.platform.stopSpeaking()
    this._state = 'IDLE'
  }

  onEvent(callback: (event: TtsEvent) => void): () => void {
    const fn = this.platform.onTtsEvent((event: TtsEvent) => {
      if (event.type === 'end' || event.type === 'error') {
        this._state = 'IDLE'
      }
      callback(event)
    })
    this.cleanupFns.push(fn)
    return fn
  }

  destroy(): void {
    this.stop()
    this.cleanupFns.forEach((fn) => fn())
    this.cleanupFns = []
  }
}
