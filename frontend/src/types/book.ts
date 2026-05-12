/** 书籍状态 */
export type BookStatus = 'ONGOING' | 'COMPLETED'

/** 书籍基础信息 */
export interface Book {
  id: number
  title: string
  author: string
  coverUrl: string
  description: string
  categoryId: number | null
  categoryName: string
  tags: string[]
  status: BookStatus
  chapterCount: number
  wordCount: number
  rating: number
  ratingCount: number
  readingCount: number
  favoriteCount: number
  latestChapterTitle: string | null
  createdAt: string
  updatedAt: string
}

/** 分类 */
export interface Category {
  id: number
  name: string
  groupKey?: string
}

/** 章节 */
export interface Chapter {
  id: number
  bookId: number
  chapterNo: number
  title: string
  content: string
  wordCount: number
  createdAt: string
}

/** 书架项 */
export interface ShelfItem {
  shelfId: number
  bookId: number
  book: Book
  pinned: boolean
  progress: ReadingProgress | null
  addedAt: string
  createdAt?: string
  updatedAt?: string
  lastReadAt?: string
}

/** 阅读进度 */
export interface ReadingProgress {
  chapterId: number
  chapterNo: number
  position: number
  progressPercent: number
  durationSeconds: number
  updatedAt: string
}

/** 书架统计 */
export interface ShelfStats {
  totalBooks: number
  todayMinutes: number
  streakDays: number
  updateCount: number
  latestBookId: number | null
}

/** 收藏项 */
export interface FavoriteItem {
  bookId: number
  bookTitle: string
  bookAuthor: string
  coverUrl: string
  status: BookStatus
  latestChapterTitle: string | null
}

/** 阅读历史项 */
export interface HistoryItem {
  bookId: number
  bookTitle: string
  bookAuthor: string
  coverUrl: string
  status: BookStatus
  latestChapterTitle: string | null
  lastReadAt: string
}

/** 评论 */
export interface Comment {
  id: number
  bookId: number
  bookTitle?: string
  chapterId: number | null
  chapterTitle?: string
  username: string
  content: string
  commentType: CommentType
  paragraphIndex: number | null
  quoteText: string | null
  likeCount: number
  createdAt: string
}

export type CommentType = 'REVIEW' | 'PARAGRAPH' | 'TYPO'

/** 分页 */
export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  pageSize: number
}

/** 书籍详情（含章节列表） */
export interface BookDetail {
  book: Book
  chapters: Chapter[]
  tags: string[]
  categoryName: string
  rating: number
  ratingCount: number
  readingCount: number
  favoriteCount: number
  inBookshelf: boolean
  recommendations: Book[]
  ratingDistribution?: Record<number, number>
}
