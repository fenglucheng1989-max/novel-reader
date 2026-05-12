/**
 * ReaderStateMachine — 阅读器有限状态机
 *
 * 状态：
 *   IDLE → LOADING_CHAPTER → SPLITTING → READY
 *   READY → ANIMATING → READY
 *   READY → MENU / SETTINGS / COMMENTS → READY
 *   LOADING_CHAPTER → ERROR → IDLE
 *
 * 每个状态转换触发事件回调。
 * 非法转换自动告警（开发环境 console.warn）。
 */

import type {
  ReaderPhase,
  StateTransition,
} from '../../types/reader'

/* ===================== 合法转换表 ===================== */

const VALID_TRANSITIONS: Record<ReaderPhase, ReaderPhase[]> = {
  IDLE: ['LOADING_CHAPTER'],
  LOADING_CHAPTER: ['SPLITTING', 'ERROR', 'IDLE'],
  SPLITTING: ['READY', 'ERROR', 'IDLE'],
  READY: ['ANIMATING', 'MENU', 'SETTINGS', 'COMMENTS', 'LOADING_CHAPTER', 'IDLE'],
  ANIMATING: ['READY', 'IDLE'],
  MENU: ['READY', 'SETTINGS', 'COMMENTS'],
  SETTINGS: ['READY', 'COMMENTS'],
  COMMENTS: ['READY', 'SETTINGS'],
  ERROR: ['IDLE', 'LOADING_CHAPTER'],
}

/* ===================== 状态机 ===================== */

export type StateChangeCallback = (transition: StateTransition) => void

export class ReaderStateMachine {
  private _phase: ReaderPhase = 'IDLE'
  private _history: StateTransition[] = []
  private listeners: StateChangeCallback[] = []

  get phase(): ReaderPhase {
    return this._phase
  }

  get history(): StateTransition[] {
    return [...this._history]
  }

  /** 注册状态变更监听 */
  onChange(cb: StateChangeCallback): () => void {
    this.listeners.push(cb)
    return () => {
      const idx = this.listeners.indexOf(cb)
      if (idx >= 0) this.listeners.splice(idx, 1)
    }
  }

  /** 尝试转换到目标状态 */
  transition(to: ReaderPhase, reason: string): boolean {
    const from = this._phase
    const allowed = VALID_TRANSITIONS[from]

    if (!allowed || !allowed.includes(to)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[ReaderStateMachine] Invalid transition: ${from} → ${to} (reason: ${reason})`,
        )
      }
      return false
    }

    const transition: StateTransition = {
      from,
      to,
      reason,
      timestamp: Date.now(),
    }

    this._phase = to
    this._history.push(transition)

    // 通知监听器
    for (const cb of this.listeners) {
      cb(transition)
    }

    return true
  }

  /** 快捷方法：LOADING_CHAPTER → SPLITTING */
  startSplitting(): boolean {
    return this.transition('SPLITTING', '章节目录加载完成，开始分页')
  }

  /** 快捷方法：SPLITTING → READY */
  finishSplitting(): boolean {
    return this.transition('READY', '分页完成')
  }

  /** 快捷方法：LOADING_CHAPTER → ERROR */
  fail(error: string): boolean {
    return this.transition('ERROR', error)
  }

  /** 重置状态机 */
  reset(): void {
    this._phase = 'IDLE'
    this._history = []
  }

  /** 获取最后 N 条历史 */
  lastTransitions(n: number): StateTransition[] {
    return this._history.slice(-n)
  }
}
