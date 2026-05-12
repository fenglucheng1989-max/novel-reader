/**
 * ReaderPlatform — 平台适配器抽象基类 + 单例工厂
 *
 * 职责：
 * 1. 定义 IPlatformAdapter 的骨架实现（带安全默认值）
 * 2. 单例模式：根据运行环境返回 H5Platform / AppPlatform
 * 3. 业务代码统一通过 ReaderPlatform.getInstance() 调用
 *
 * 设计原则：
 * - 所有 uni.* / document / window 调用必须在具体子类中
 * - 骨架方法提供合理的 fallback 值（平台无关时可用）
 */

import type {
  IPlatformAdapter,
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
  PlatformConfig,
} from '../types/platform'

import { H5Platform } from './H5Platform'
import { AppPlatform } from './AppPlatform'

/* ===================== 配置 ===================== */

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  storagePrefix: 'nr_',
  cacheVersion: 1,
  desktopMaxWidth: 900,
  maxPageCacheEntries: 50,
  maxChapterCacheEntries: 30,
}

export { BasePlatformAdapter } from './BasePlatformAdapter'

/* ===================== 单例工厂 ===================== */

let instance: IPlatformAdapter | null = null

function isH5Platform(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function createPlatform(): IPlatformAdapter {
  if (isH5Platform()) {
    return new H5Platform()
  }
  return new AppPlatform()
}

/**
 * 获取平台适配器单例
 */
export function getPlatformAdapter(): IPlatformAdapter {
  if (!instance) {
    instance = createPlatform()
  }
  return instance
}

/** 重置单例（测试用） */
export function resetPlatformAdapter(): void {
  instance = null
}
