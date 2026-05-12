/**
 * CommentService — 评论服务
 *
 * 实现 ICommentService 接口。
 * 第一版：接口定义完整实现 + 真实 API 调用。
 */

import type {
  ParagraphComment,
  CommentListResponse,
  CreateCommentRequest,
} from '../types/reader'
import type { ICommentService } from '../types/comment'
import { request } from '../utils/request'

export class CommentService implements ICommentService {
  async getComments(
    bookId: string | number,
    chapterNo: number,
    paragraphIndex: number,
    page: number,
    pageSize: number = 20,
  ): Promise<CommentListResponse> {
    const res = await request({
      url: `/api/v1/comments`,
      data: { bookId, chapterNo, paragraphIndex, page, pageSize },
      silent: true,
    })

    if (res.code === 200 && res.data) {
      return {
        comments: (res.data.records || res.data.list || []).map(
          (c: Record<string, unknown>) => this.normalizeComment(c),
        ),
        total: res.data.total ?? res.data.count ?? 0,
        hasMore: (res.data.page ?? 1) < (res.data.pages ?? 1),
      }
    }

    return { comments: [], total: 0, hasMore: false }
  }

  async createComment(req: CreateCommentRequest): Promise<ParagraphComment> {
    const res = await request({
      url: `/api/v1/comments`,
      method: 'POST',
      data: req,
    })

    if (res.code === 200 && res.data) {
      return this.normalizeComment(res.data)
    }

    throw new Error(res.message || '评论发表失败')
  }

  async likeComment(
    commentId: string | number,
    liked: boolean,
  ): Promise<void> {
    await request({
      url: `/api/v1/comments/${commentId}/like`,
      method: liked ? 'POST' : 'DELETE',
      silent: true,
    })
  }

  async getCommentCounts(
    bookId: string | number,
    chapterNo: number,
  ): Promise<Record<number, number>> {
    const res = await request({
      url: `/api/v1/comments/counts`,
      data: { bookId, chapterNo },
      silent: true,
    })

    if (res.code === 200 && res.data) {
      return res.data as Record<number, number>
    }

    return {}
  }

  private normalizeComment(
    data: Record<string, unknown>,
  ): ParagraphComment {
    return {
      id: data.id ?? 0,
      bookId: data.bookId ?? '',
      chapterNo: Number(data.chapterNo ?? 0),
      paragraphIndex: Number(data.paragraphIndex ?? 0),
      userId: data.userId ?? data.user_id ?? '',
      nickname: (data.nickname as string) || (data.username as string) || '匿名',
      avatar: (data.avatar as string) || '',
      content: (data.content as string) || '',
      likeCount: Number(data.likeCount ?? data.like_count ?? 0),
      liked: !!data.liked,
      createdAt: Number(data.createdAt ?? data.created_at ?? Date.now()),
    }
  }
}
