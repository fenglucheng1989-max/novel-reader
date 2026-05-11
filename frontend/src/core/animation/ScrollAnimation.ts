/**
 * ScrollAnimation — 滚动模式动画桩
 *
 * 滚动模式下不使用翻页动画。
 * 此实现仅做空操作（no-op），让 ScrollRenderer 处理滚动行为。
 * prepare/abort/destroy 均为空实现。
 */

import type { IAnimator, FlipContext, TurnMode } from '../../types'

export class ScrollAnimator implements IAnimator {
  readonly mode: TurnMode = 'SCROLL'

  prepare(_ctx: FlipContext): void {
    // 滚动模式不参与 DOM 级翻页动画
  }

  animate(_ctx: FlipContext): Promise<void> {
    return Promise.resolve()
  }

  abort(_ctx: FlipContext): void {
    // 滚动模式无动画可中断
  }

  destroy(_ctx: FlipContext): void {
    // 无资源
  }
}
