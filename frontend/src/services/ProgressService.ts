/**
 * ProgressService — 阅读进度服务
 *
 * 负责进度的服务端同步与本地持久化。
 * 双写策略：本地缓存 + 服务端同步。
 */

import type { ReaderProgress } from '../types/reader'
import { request } from '../utils/request'

const PROGRESS_LOCAL_KEY = 'reader_progress'

export class ProgressService {
  /** 未登录时跳过服务端请求，直接走本地进度 */
  private static hasToken(): boolean {
    try {
      return !!uni.getStorageSync('token')
    } catch {
      return false
    }
  }

  /**
   * 从本地 + 服务端恢复进度
   * 服务端优先，若无则用本地
   */
  static async getProgress(
    bookId: string | number,
  ): Promise<ReaderProgress | null> {
    if (ProgressService.hasToken()) {
      try {
        const res = await request({
          url: `/api/v1/reading/progress/${bookId}`,
          silentAuth: true,
          silent: true,
        })
        if (res.code === 200 && res.data) {
          return ProgressService.normalizeProgress(res.data)
        }
      } catch {
        // fallback to local
      }
    }

    return ProgressService.getLocalProgress(bookId)
  }

  /**
   * 保存进度（本地 + 服务端）
   */
  static async saveProgress(progress: ReaderProgress): Promise<void> {
    ProgressService.saveLocalProgress(progress)

    if (ProgressService.hasToken()) {
      try {
        await request({
          url: `/api/v1/reading/progress/${progress.bookId}`,
          method: 'PUT',
          silentAuth: true,
          silent: true,
          data: {
            chapterId: progress.chapterId,
            chapterNo: progress.chapterNo,
            pageIndex: progress.pageIndex,
            progressPercent: progress.progressPercent,
          },
        })
      } catch {
        // 服务端同步失败不影响本地
      }
    }
  }

  /**
   * 获取本地进度
   */
  static getLocalProgress(
    bookId: string | number,
  ): ReaderProgress | null {
    try {
      const all = uni.getStorageSync(PROGRESS_LOCAL_KEY) || {}
      return all[String(bookId)] || null
    } catch {
      return null
    }
  }

  /**
   * 保存本地进度
   */
  static saveLocalProgress(progress: ReaderProgress): void {
    try {
      const all = uni.getStorageSync(PROGRESS_LOCAL_KEY) || {}
      all[String(progress.bookId)] = progress
      uni.setStorageSync(PROGRESS_LOCAL_KEY, all)
    } catch {
      // localStorage 满时忽略
    }
  }

  /**
   * 获取所有书籍的本地进度
   */
  static getAllLocalProgress(): Record<string, ReaderProgress> {
    try {
      return uni.getStorageSync(PROGRESS_LOCAL_KEY) || {}
    } catch {
      return {}
    }
  }

  /**
   * 标准化进度数据
   */
  private static normalizeProgress(data: Record<string, unknown>): ReaderProgress {
    return {
      bookId: data.bookId ?? '',
      chapterId: data.chapterId ?? '',
      chapterNo: Number(data.chapterNo ?? 1),
      pageIndex: Number(data.pageIndex ?? 0),
      offset: Number(data.offset ?? 0),
      progressPercent: Number(data.progressPercent ?? 0),
      mode: (data.mode as ReaderProgress['mode']) || 'PAGINATION',
      lastReadAt: Number(data.lastReadAt ?? Date.now()),
    }
  }
}
