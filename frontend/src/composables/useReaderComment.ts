/**
 * useReaderComment — 评论 Composable
 *
 * 封装段评的读取、发表、点赞。
 * 与 ReaderCommentPanel 组件配合使用。
 */

import { ref, reactive, computed } from 'vue'
import type { ParagraphComment, CreateCommentRequest } from '../types/reader'
import { CommentService } from '../services/CommentService'

export function useReaderComment() {
  const commentService = new CommentService()

  // === 评论面板状态 ===
  const panelVisible = ref(false)
  const currentParagraphIndex = ref(-1)
  const currentQuoteText = ref('')
  const comments = ref<ParagraphComment[]>([])
  const totalComments = ref(0)
  const commentPage = ref(1)
  const hasMoreComments = ref(false)
  const commentsLoading = ref(false)

  // === 输入状态 ===
  const inputVisible = ref(false)
  const inputContent = ref('')
  const submitting = ref(false)

  // === 段评数量映射 (paragraphIndex → count) ===
  const commentCounts = reactive<Record<number, number>>({})

  /** 打开评论面板 */
  async function openCommentPanel(
    paragraphIndex: number,
    quoteText: string,
  ): Promise<void> {
    currentParagraphIndex.value = paragraphIndex
    currentQuoteText.value = quoteText
    commentPage.value = 1
    comments.value = []
    panelVisible.value = true
    await loadComments(paragraphIndex, 1)
  }

  /** 关闭评论面板 */
  function closeCommentPanel(): void {
    panelVisible.value = false
    currentParagraphIndex.value = -1
  }

  /** 打开评论输入框 */
  function openCommentInput(): void {
    inputVisible.value = true
    inputContent.value = ''
  }

  /** 关闭评论输入框 */
  function closeCommentInput(): void {
    inputVisible.value = false
    inputContent.value = ''
  }

  /** 加载评论 */
  async function loadComments(
    paragraphIndex: number,
    page: number = 1,
  ): Promise<void> {
    commentsLoading.value = true
    try {
      const res = await commentService.getComments(
        '', // bookId 由外部传入
        0,  // chapterNo 由外部传入
        paragraphIndex,
        page,
      )
      if (page === 1) {
        comments.value = res.comments
      } else {
        comments.value = [...comments.value, ...res.comments]
      }
      totalComments.value = res.total
      hasMoreComments.value = res.hasMore
      commentPage.value = page
    } catch {
      // 加载失败
    } finally {
      commentsLoading.value = false
    }
  }

  /** 加载更多评论（分页） */
  async function loadMoreComments(): Promise<void> {
    if (!hasMoreComments.value || commentsLoading.value) return
    await loadComments(currentParagraphIndex.value, commentPage.value + 1)
  }

  /** 发表评论 */
  async function submitComment(req: CreateCommentRequest): Promise<void> {
    submitting.value = true
    try {
      const comment = await commentService.createComment(req)
      comments.value = [comment, ...comments.value]
      totalComments.value++
      commentCounts[req.paragraphIndex] =
        (commentCounts[req.paragraphIndex] || 0) + 1
      closeCommentInput()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '评论失败'
      throw new Error(msg)
    } finally {
      submitting.value = false
    }
  }

  /** 点赞 */
  async function toggleLike(comment: ParagraphComment): Promise<void> {
    try {
      await commentService.likeComment(comment.id, !comment.liked)
      comment.liked = !comment.liked
      comment.likeCount += comment.liked ? 1 : -1
    } catch {
      // 静默失败
    }
  }

  /** 获取章节所有段落的评论数 */
  async function loadCommentCounts(
    bookId: string | number,
    chapterNo: number,
  ): Promise<void> {
    try {
      const counts = await commentService.getCommentCounts(bookId, chapterNo)
      Object.assign(commentCounts, counts)
    } catch {
      // 静默失败
    }
  }

  return {
    // 状态
    panelVisible,
    currentParagraphIndex,
    currentQuoteText,
    comments,
    totalComments,
    hasMoreComments,
    commentsLoading,
    inputVisible,
    inputContent,
    submitting,
    commentCounts,

    // 方法
    openCommentPanel,
    closeCommentPanel,
    openCommentInput,
    closeCommentInput,
    loadComments,
    loadMoreComments,
    submitComment,
    toggleLike,
    loadCommentCounts,
  }
}
