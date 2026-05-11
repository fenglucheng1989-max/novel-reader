/**
 * CoverAnimation — 覆盖翻页动画
 *
 * 新页从右侧进入，覆盖旧页。
 * 使用 opacity + translateX 组合动画。
 * GPU 合成层友好。
 */

import type { IAnimator, FlipContext, TurnMode } from '../../types'

export class CoverAnimator implements IAnimator {
  readonly mode: TurnMode = 'COVER'

  private overlay: HTMLDivElement | null = null
  private oldContent: string = ''
  private animationTimeout: ReturnType<typeof setTimeout> | null = null

  prepare(ctx: FlipContext): void {
    const { container, currentPageEl, targetHtml, direction, viewport } = ctx

    // 检查必要的 DOM 元素是否存在
    if (!container || !currentPageEl) {
      console.error('[CoverAnimator] Missing required DOM elements')
      return
    }

    // 先清理可能存在的旧覆盖层，防止重影
    this.cleanup(null)

    // 保存旧内容以便回滚
    this.oldContent = currentPageEl.innerHTML

    // 创建覆盖层（新页）
    this.overlay = document.createElement('div')
    this.overlay.setAttribute('data-anim-layer', 'cover')
    this.overlay.style.cssText = `
      position:absolute;top:0;left:0;
      width:100%;height:100%;
      background:inherit;
      overflow-y:auto;
      pointer-events:none;
      will-change:transform,opacity;
      transition:
        transform ${ctx.duration}ms cubic-bezier(0.4,0,0.2,1),
        opacity ${ctx.duration}ms cubic-bezier(0.4,0,0.2,1);
      z-index:10;
      backface-visibility:hidden;
      transform-style:preserve-3d;
    `
    this.overlay.innerHTML = targetHtml

    // 设置初始位置（右侧外）
    const startX = direction === 1 ? '30%' : '-30%'
    this.overlay.style.transform = `translateX(${startX})`
    this.overlay.style.opacity = '0'

    container.appendChild(this.overlay)
  }

  animate(ctx: FlipContext): Promise<void> {
    return new Promise((resolve) => {
      if (!this.overlay) {
        resolve()
        return
      }

      const onComplete = () => {
        if (this.animationTimeout) {
          clearTimeout(this.animationTimeout)
          this.animationTimeout = null
        }
        this.finish(ctx)
        resolve()
      }

      this.overlay.addEventListener('transitionend', onComplete, { once: true })

      // 添加超时保护，防止 transitionend 不触发导致的重影
      this.animationTimeout = setTimeout(() => {
        this.overlay?.removeEventListener('transitionend', onComplete)
        onComplete()
      }, ctx.duration + 200)

      // 下一帧触发过渡
      requestAnimationFrame(() => {
        if (!this.overlay) {
          resolve()
          return
        }
        this.overlay.style.transform = 'translateX(0)'
        this.overlay.style.opacity = '1'
      })
    })
  }

  abort(ctx: FlipContext): void {
    this.cleanup(ctx)
    if (ctx.currentPageEl) {
      ctx.currentPageEl.innerHTML = ctx.targetHtml
    }
  }

  destroy(_ctx: FlipContext): void {
    this.cleanup(null)
  }

  private finish(ctx: FlipContext): void {
    if (ctx.currentPageEl) {
      ctx.currentPageEl.innerHTML = ctx.targetHtml
    }
    this.cleanup(ctx)
  }

  private cleanup(_ctx: FlipContext | null): void {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay)
    }
    this.overlay = null
    this.oldContent = ''
  }
}
