/**
 * 评论系统类型定义
 *
 * 支持段评、点赞、分页加载。
 * 评论气泡按 paragraphIndex 定位到段尾。
 */

import type { CreateCommentRequest, ParagraphComment, CommentListResponse } from './reader'

/* ===================== 评论服务接口 ===================== */

/**
 * 评论服务接口
 *
 * 第一版：接口定义 + Mock 实现
 * 后续：替换为真实 API 调用
 */
export interface ICommentService {
  /**
   * 获取某段落评论列表
   * @param bookId 书籍 ID
   * @param chapterNo 章节号
   * @param paragraphIndex 段落索引
   * @param page 页码
   * @param pageSize 每页条数
   */
  getComments(
    bookId: string | number,
    chapterNo: number,
    paragraphIndex: number,
    page: number,
    pageSize: number,
  ): Promise<CommentListResponse>

  /**
   * 创建评论
   */
  createComment(req: CreateCommentRequest): Promise<ParagraphComment>

  /**
   * 点赞 / 取消点赞
   */
  likeComment(commentId: string | number, liked: boolean): Promise<void>

  /**
   * 获取某章节所有段落的评论数量映射
   * key = paragraphIndex
   */
  getCommentCounts(
    bookId: string | number,
    chapterNo: number,
  ): Promise<Record<number, number>>
}

/* ===================== 评论 UI 状态 ===================== */

export interface CommentPanelState {
  visible: boolean
  /** 当前查看的段落索引 */
  paragraphIndex: number
  /** 段落原文 */
  quoteText: string
  comments: ParagraphComment[]
  total: number
  page: number
  hasMore: boolean
  loading: boolean
}

export interface CommentInputState {
  visible: boolean
  paragraphIndex: number
  quoteText: string
  content: string
  submitting: boolean
}

/* ===================== 评论气泡数据 ===================== */

export interface CommentBubbleData {
  paragraphIndex: number
  count: number
  /** 在当前页面中的 Y 偏移（px） */
  top: number
}
