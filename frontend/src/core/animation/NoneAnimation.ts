/**
 * NoneAnimation — 无动画模式
 *
 * 直接替换 DOM 内容，无过渡效果。
 * 作为兜底策略，所有平台都支持。
 */

import type { IAnimator, FlipContext, TurnMode } from '../../types'

export class NoneAnimator implements IAnimator {
  readonly mode: TurnMode = 'NONE'

  prepare(ctx: FlipContext): void {
    // 无动画不需要准备
  }

  animate(ctx: FlipContext): Promise<void> {
    // 直接替换当前页内容
    ctx.currentPageEl.innerHTML = ctx.targetHtml
    return Promise.resolve()
  }

  abort(ctx: FlipContext): void {
    ctx.currentPageEl.innerHTML = ctx.targetHtml
  }

  destroy(_ctx: FlipContext): void {
    // 无资源需要清理
  }
}
