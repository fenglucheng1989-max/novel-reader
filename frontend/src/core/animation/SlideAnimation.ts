/**
 * SlideAnimation — 平移翻页动画
 *
 * 使用 CSS transform: translateX 实现平移翻页。
 * 新页从右侧/左侧滑入，旧页滑出。
 * 纯 GPU 合成层，60fps。
 */

import type { IAnimator, FlipContext, TurnMode } from '../../types'

export class SlideAnimator implements IAnimator {
  readonly mode: TurnMode = 'SLIDE'

  // 临时元素引用
  private wrapper: HTMLDivElement | null = null
  private oldPage: HTMLDivElement | null = null
  private newPage: HTMLDivElement | null = null
  private animationTimeout: ReturnType<typeof setTimeout> | null = null

  prepare(ctx: FlipContext): void {
    const { container, currentPageEl, targetHtml, direction, viewport } = ctx

    // 检查必要的 DOM 元素是否存在
    if (!container || !currentPageEl) {
      console.error('[SlideAnimator] Missing required DOM elements')
      return
    }

    // 先清理可能存在的旧元素，防止重影
    this.cleanupDOM(null)

    // 创建包裹容器（contain overflow）
    this.wrapper = document.createElement('div')
    this.wrapper.setAttribute('data-anim-layer', 'slide')
    this.wrapper.style.cssText = `
      position:absolute;top:0;left:0;
      width:${viewport.width}px;height:${viewport.height}px;
      overflow:hidden;pointer-events:none;
      z-index:10;
    `

    // 旧页（当前可见内容）
    this.oldPage = document.createElement('div')
    this.oldPage.style.cssText = `
      position:absolute;top:0;left:0;
      width:100%;height:100%;
      transition:transform ${ctx.duration}ms cubic-bezier(0.4,0,0.2,1);
      will-change:transform;
      backface-visibility:hidden;
      transform-style:preserve-3d;
    `
    // 复制当前页内容而不是移动
    this.oldPage.innerHTML = currentPageEl.innerHTML

    // 新页（从侧边进入）
    this.newPage = document.createElement('div')
    this.newPage.style.cssText = `
      position:absolute;top:0;
      width:100%;height:100%;
      transition:transform ${ctx.duration}ms cubic-bezier(0.4,0,0.2,1);
      will-change:transform;
      backface-visibility:hidden;
      transform-style:preserve-3d;
    `
    this.newPage.innerHTML = targetHtml

    // 设置初始位置
    const offset = direction === 1 ? '100%' : '-100%'
    this.oldPage.style.transform = 'translateX(0)'
    this.newPage.style.transform = `translateX(${offset})`

    this.wrapper.appendChild(this.oldPage)
    this.wrapper.appendChild(this.newPage)
    container.appendChild(this.wrapper)
  }

  animate(ctx: FlipContext): Promise<void> {
    return new Promise((resolve) => {
      if (!this.oldPage || !this.newPage) {
        resolve()
        return
      }

      const direction = ctx.direction
      
      const onComplete = (): void => {
        if (this.animationTimeout) {
          clearTimeout(this.animationTimeout)
          this.animationTimeout = null
        }
        this.cleanupDOM(ctx)
        resolve()
      }

      // 同时监听新旧页的 transitionend
      this.oldPage.addEventListener('transitionend', onComplete, { once: true })
      this.newPage.addEventListener('transitionend', onComplete, { once: true })

      // 添加超时保护，防止 transitionend 不触发导致的重影
      this.animationTimeout = setTimeout(() => {
        this.oldPage?.removeEventListener('transitionend', onComplete)
        this.newPage?.removeEventListener('transitionend', onComplete)
        onComplete()
      }, ctx.duration + 200)

      // 触发下一帧动画
      requestAnimationFrame(() => {
        if (!this.oldPage || !this.newPage) {
          resolve()
          return
        }
        const offset = direction === 1 ? '-100%' : '100%'
        this.oldPage.style.transform = `translateX(${offset})`
        this.newPage.style.transform = 'translateX(0)'
      })
    })
  }

  abort(ctx: FlipContext): void {
    this.cleanupDOM(ctx)
    if (ctx.currentPageEl) {
      ctx.currentPageEl.innerHTML = ctx.targetHtml
    }
  }

  destroy(_ctx: FlipContext): void {
    this.cleanupDOM(null)
  }

  private cleanupDOM(ctx: FlipContext | null): void {
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper)
    }
    this.wrapper = null
    this.oldPage = null
    this.newPage = null

    // 确保最终内容已更新
    if (ctx && ctx.currentPageEl) {
      ctx.currentPageEl.innerHTML = ctx.targetHtml
    }
  }
}
