/**
 * BookService — 书籍/章节数据服务
 *
 * 封装后端 API 调用，提供章节加载、章节列表查询接口。
 * 与 ReaderEngine 配合使用，统一数据入口。
 */

import type { ChapterData } from '../types/reader'
import { request } from '../utils/request'

export class BookService {
  /**
   * 获取章节列表
   */
  static async getChapterList(
    bookId: string | number,
  ): Promise<ChapterData[]> {
    const res = await request({
      url: `/api/v1/books/${bookId}/chapters`,
      noAuth: true,
      silent: true,
    })
    if (res.code === 200 && Array.isArray(res.data)) {
      return res.data.map((c: Record<string, unknown>) => ({
        id: c.id as number,
        bookId: c.bookId as number,
        chapterNo: c.chapterNo as number,
        title: (c.title as string) || '',
        content: '',
        wordCount: (c.wordCount as number) || 0,
        totalChapters: 0,
      }))
    }
    return []
  }

  /**
   * 获取章节内容
   */
  static async getChapterContent(
    bookId: string | number,
    chapterNo: number,
  ): Promise<ChapterData | null> {
    const res = await request({
      url: `/api/v1/books/${bookId}/chapters/${chapterNo}`,
      noAuth: true,
      silent: true,
    })

    if (res.code === 200 && res.data) {
      const d = res.data
      return {
        id: d.id,
        bookId: d.bookId,
        chapterNo: d.chapterNo,
        title: d.title || '',
        content: d.content || '',
        wordCount: d.wordCount || 0,
        totalChapters: d.totalChapters || d.maxChapterNo || 0,
      }
    }
    return null
  }

  /**
   * 批量获取章节内容（预加载用）
   */
  static async getChaptersBatch(
    bookId: string | number,
    chapterNos: number[],
  ): Promise<ChapterData[]> {
    const results = await Promise.allSettled(
      chapterNos.map((no) => BookService.getChapterContent(bookId, no)),
    )
    return results
      .filter(
        (r): r is PromiseFulfilledResult<ChapterData | null> =>
          r.status === 'fulfilled' && r.value !== null,
      )
      .map((r) => r.value)
  }
}
