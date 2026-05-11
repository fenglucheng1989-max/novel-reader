/**
 * AnimationFactory — 翻页动画工厂
 *
 * 策略模式核心入口。
 * 通过 register() 注册动画实现，create() 按 mode 创建实例。
 * 扩展新动画 = 实现 IAnimator + register()。
 */

import type {
  TurnMode,
  IAnimator,
  IAnimationFactory,
} from '../../types'

import { NoneAnimator } from './NoneAnimation'
import { SlideAnimator } from './SlideAnimation'
import { CoverAnimator } from './CoverAnimation'
import { ScrollAnimator } from './ScrollAnimation'

/** 动画构造器映射 */
const registry = new Map<TurnMode, new () => IAnimator>()

/** 默认注册的动画 */
const builtInAnimations: [TurnMode, new () => IAnimator][] = [
  ['NONE', NoneAnimator],
  ['SLIDE', SlideAnimator],
  ['COVER', CoverAnimator],
  ['SCROLL', ScrollAnimator],
]

// 使用函数内懒加载以避免循环依赖
let initialized = false

function ensureInitialized(): void {
  if (initialized) return
  initialized = true
  for (const [mode, ctor] of builtInAnimations) {
    registry.set(mode, ctor)
  }
}

/** 需要避免循环依赖，导入动画器类 */
function lazyLoadAnimator(mode: TurnMode): new () => IAnimator | null {
  switch (mode) {
    case 'NONE':
      return NoneAnimator
    case 'SLIDE':
      return SlideAnimator
    case 'COVER':
      return CoverAnimator
    case 'SCROLL':
      return ScrollAnimator
    default:
      return null
  }
}

class AnimationFactoryImpl implements IAnimationFactory {
  register(mode: TurnMode, ctor: new () => IAnimator): void {
    registry.set(mode, ctor)
  }

  create(mode: TurnMode): IAnimator {
    ensureInitialized()

    let Ctor = registry.get(mode)
    if (!Ctor) {
      // 尝试懒加载
      Ctor = lazyLoadAnimator(mode)
      if (Ctor) {
        registry.set(mode, Ctor)
      } else {
        throw new Error(`[AnimationFactory] Unknown animation mode: ${mode}`)
      }
    }

    return new Ctor()
  }

  supports(mode: TurnMode): boolean {
    ensureInitialized()
    if (registry.has(mode)) return true
    const ctor = lazyLoadAnimator(mode)
    if (ctor) {
      registry.set(mode, ctor)
      return true
    }
    return false
  }

  availableModes(): TurnMode[] {
    ensureInitialized()
    return Array.from(registry.keys())
  }
}

/** 全局单例 */
let instance: IAnimationFactory | null = null

export function getAnimationFactory(): IAnimationFactory {
  if (!instance) {
    instance = new AnimationFactoryImpl()
  }
  return instance
}

export function resetAnimationFactory(): void {
  instance = null
}
