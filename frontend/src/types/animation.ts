/**
 * 翻页动画系统类型定义
 *
 * 策略模式：每种动画实现 Animator 接口，
 * AnimationFactory 按 mode 注册和创建 Animator 实例。
 * 添加新动画 = 实现 Animator + 注册到工厂。
 */

import type { TurnMode, BoundingRect } from './reader'

/* ===================== 动画上下文 ===================== */

/** 动画执行上下文 */
export interface FlipContext {
  /** 容器元素 */
  container: HTMLElement
  /** 当前页元素（翻页前可见） */
  currentPageEl: HTMLElement
  /** 目标页 HTML */
  targetHtml: string
  /** 翻页方向：1 = 下一页，-1 = 上一页 */
  direction: 1 | -1
  /** 动画模式 */
  mode: TurnMode
  /** 动画时长（ms） */
  duration: number
  /** 容器视口尺寸 */
  viewport: {
    width: number
    height: number
  }
}

/* ===================== Animator 接口 ===================== */

/**
 * 动画器接口
 *
 * 所有翻页策略实现此接口：
 * - NoneAnimation     — 直接替换，无动画
 * - SlideAnimation    — translateX 平移
 * - CoverAnimation    — 覆盖式（opacity + translate）
 * - ScrollAnimation   — 滚动模式（不使用翻页动画）
 * - CurlAnimation     — 仿真卷页（预留）
 * - SimulationAnimation — 3D 仿真翻页（预留）
 */
export interface IAnimator {
  /** 动画模式标识 */
  readonly mode: TurnMode

  /**
   * 准备动画
   * 在此阶段组装 DOM 结构，设置初始状态。
   * 不应触发布局抖动。
   */
  prepare(ctx: FlipContext): void

  /**
   * 执行动画
   * 返回 Promise，动画完成时 resolve。
   */
  animate(ctx: FlipContext): Promise<void>

  /**
   * 中断动画
   * 快速翻页时调用，立即将 DOM 置为最终态。
   */
  abort(ctx: FlipContext): void

  /**
   * 清理
   * 移除临时 DOM 元素，恢复容器状态。
   */
  destroy(ctx: FlipContext): void
}

/* ===================== 动画工厂 ===================== */

/** 动画注册条目 */
export interface AnimatorEntry {
  mode: TurnMode
  ctor: new () => IAnimator
}

/** 动画工厂接口 */
export interface IAnimationFactory {
  /** 注册动画器 */
  register(mode: TurnMode, ctor: new () => IAnimator): void
  /** 获取动画器实例 */
  create(mode: TurnMode): IAnimator
  /** 检查是否支持某模式 */
  supports(mode: TurnMode): boolean
  /** 获取所有已注册模式 */
  availableModes(): TurnMode[]
}

/* ===================== 动画状态 ===================== */

export interface FlipState {
  isAnimating: boolean
  mode: TurnMode
  direction: 1 | -1
  startTime: number
  /** 0-1 */
  progress: number
}

/* ===================== 动画事件 ===================== */

export type AnimationEventType = 'start' | 'progress' | 'end' | 'abort'

export interface AnimationEvent {
  type: AnimationEventType
  mode: TurnMode
  direction: 1 | -1
  progress: number
  timestamp: number
}

/* ===================== 动画配置 ===================== */

export interface AnimationConfig {
  /** 默认动画时长（ms） */
  defaultDuration: number
  /** 快速翻页时长（ms） */
  fastDuration: number
  /** CSS 缓动函数 */
  easing: string
  /** 滑动翻页的覆盖比例（0-1） */
  slideCoverRatio: number
  /** 覆盖翻页的初始透明度 */
  coverInitialOpacity: number
  /** 覆盖翻页的初始位移（px） */
  coverInitialTranslate: number
}
