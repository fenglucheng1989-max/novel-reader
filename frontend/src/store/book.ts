/**
 * bookStore — 书籍状态管理
 *
 * 管理分类、书籍、书架、收藏等数据。
 * Composition API + TypeScript。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { request } from '../utils/request'
import type { ApiResponse } from '../types/api'
import type {
  Book,
  ShelfItem,
  ShelfStats,
  Chapter,
  BookDetail,
  PageResult,
  Category,
  FavoriteItem,
} from '../types/book'

export interface FilterParams {
  categoryId?: number
  groupKey?: string
  status?: string
  minWordCount?: number
  maxWordCount?: number
  keyword?: string
  sortBy?: string
  page?: number
  pageSize?: number
}

export const useBookStore = defineStore('book', () => {
  /* ---- 状态 ---- */
  const categories = ref<Category[]>([])
  const books = ref<Book[]>([])
  const shelf = ref<ShelfItem[]>([])
  const shelfStats = ref<ShelfStats | null>(null)
  const favorites = ref<Book[]>([])
  const currentBook = ref<Book | null>(null)
  const chapters = ref<Chapter[]>([])
  const selectedCategoryId = ref(0)

  /* ---- 计算属性 ---- */
  const shelfBookIds = computed(() =>
    shelf.value.map((item) => Number(item.bookId)),
  )

  /* ---- 分类 ---- */
  function selectCategory(categoryId: number): void {
    selectedCategoryId.value = categoryId || 0
  }

  async function loadCategories(): Promise<ApiResponse> {
    const res = await request({
      url: '/api/v1/categories',
      noAuth: true,
      silent: true,
    })
    if (res.code === 200) {
      categories.value = (res.data as Category[]) || []
    }
    return res
  }

  /* ---- 推荐/排行 ---- */
  async function loadRecommend(categoryId?: number): Promise<ApiResponse> {
    const query = categoryId ? `?categoryId=${categoryId}` : ''
    const res = await request({
      url: `/api/v1/books/recommend${query}`,
      noAuth: true,
      silent: true,
    })
    if (res.code === 200) {
      books.value = (res.data as Book[]) || []
    }
    return res
  }

  async function loadRank(
    categoryId?: number,
    limit: number = 50,
    groupKey?: string,
  ): Promise<ApiResponse> {
    const params: string[] = [`limit=${encodeURIComponent(limit)}`]
    if (categoryId) params.push(`categoryId=${encodeURIComponent(categoryId)}`)
    if (groupKey) params.push(`groupKey=${encodeURIComponent(groupKey)}`)
    return request({
      url: `/api/v1/books/rank?${params.join('&')}`,
      noAuth: true,
      silent: true,
    })
  }

  /* ---- 搜索 ---- */
  async function search(keyword: string): Promise<ApiResponse> {
    const res = await request({
      url: `/api/v1/search/books?keyword=${encodeURIComponent(keyword || '')}`,
      noAuth: true,
      silent: true,
    })
    if (res.code === 200) {
      books.value = (res.data as Book[]) || []
    }
    return res
  }

  /* ---- 详情 ---- */
  async function loadDetail(bookId: number | string): Promise<ApiResponse> {
    const res = await request({
      url: `/api/v1/books/${bookId}`,
      noAuth: true,
      silent: true,
    })
    if (res.code === 200) {
      const data = res.data as BookDetail
      currentBook.value = data.book
      chapters.value = data.chapters || []
    }
    return res
  }

  /* ---- 书架 ---- */
  async function loadShelf(): Promise<ApiResponse> {
    const res = await request({ url: '/api/v1/bookshelf', silent: true })
    if (res.code === 200) {
      shelf.value = (res.data as ShelfItem[]) || []
    }
    return res
  }

  async function loadShelfStats(): Promise<ApiResponse> {
    const res = await request({
      url: '/api/v1/bookshelf/stats',
      silent: true,
    })
    if (res.code === 200) {
      shelfStats.value = (res.data as ShelfStats) || null
    }
    return res
  }

  async function addShelf(bookId: number | string): Promise<ApiResponse> {
    return request({ url: `/api/v1/bookshelf/${bookId}`, method: 'POST' })
  }

  async function removeShelf(bookId: number | string): Promise<ApiResponse> {
    return request({ url: `/api/v1/bookshelf/${bookId}`, method: 'DELETE' })
  }

  async function pinShelf(bookId: number | string): Promise<ApiResponse> {
    return request({ url: `/api/v1/bookshelf/${bookId}/pin`, method: 'PUT' })
  }

  async function unpinShelf(bookId: number | string): Promise<ApiResponse> {
    return request({
      url: `/api/v1/bookshelf/${bookId}/pin`,
      method: 'DELETE',
    })
  }

  async function removeShelfBatch(
    bookIds: (number | string)[],
  ): Promise<ApiResponse[]> {
    const results: ApiResponse[] = []
    for (const bookId of bookIds) {
      results.push(
        await request({ url: `/api/v1/bookshelf/${bookId}`, method: 'DELETE' }),
      )
    }
    return results
  }

  /* ---- 收藏 ---- */
  async function addFavorite(bookId: number | string): Promise<ApiResponse> {
    return request({ url: `/api/v1/favorites/${bookId}`, method: 'POST' })
  }

  async function removeFavorite(bookId: number | string): Promise<ApiResponse> {
    return request({ url: `/api/v1/favorites/${bookId}`, method: 'DELETE' })
  }

  async function loadFavorites(): Promise<ApiResponse> {
    const res = await request({
      url: '/api/v1/favorites',
      silentAuth: true,
    })
    if (res.code === 200) {
      favorites.value = (res.data as Book[]) || []
    }
    return res
  }

  async function checkFavoriteStatus(bookId: number | string): Promise<ApiResponse<boolean>> {
    return request({
      url: `/api/v1/favorites/${bookId}/status`,
      silentAuth: true,
      silent: true,
    })
  }

  /* ---- 筛选 ---- */
  async function loadFilter(params: FilterParams = {}): Promise<ApiResponse> {
    const parts: string[] = []
    if (params.categoryId) parts.push(`categoryId=${encodeURIComponent(params.categoryId)}`)
    if (params.groupKey) parts.push(`groupKey=${encodeURIComponent(params.groupKey)}`)
    if (params.status) parts.push(`status=${encodeURIComponent(params.status)}`)
    if (params.minWordCount != null) parts.push(`minWordCount=${params.minWordCount}`)
    if (params.maxWordCount != null) parts.push(`maxWordCount=${params.maxWordCount}`)
    if (params.keyword) parts.push(`keyword=${encodeURIComponent(params.keyword)}`)
    if (params.sortBy) parts.push(`sortBy=${encodeURIComponent(params.sortBy)}`)
    if (params.page != null) parts.push(`page=${params.page}`)
    if (params.pageSize != null) parts.push(`pageSize=${params.pageSize}`)
    return request({
      url: `/api/v1/books/filter?${parts.join('&')}`,
      noAuth: true,
      silent: true,
    })
  }

  async function loadFeatured(
    limit: number = 6,
    groupKey?: string,
  ): Promise<ApiResponse> {
    const query = [`limit=${limit}`]
    if (groupKey) query.push(`groupKey=${encodeURIComponent(groupKey)}`)
    return request({
      url: `/api/v1/books/featured?${query.join('&')}`,
      noAuth: true,
      silent: true,
    })
  }

  /* ---- 评论 ---- */
  async function loadBookComments(
    bookId: number | string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<ApiResponse> {
    return request({
      url: `/api/v1/books/${bookId}/comments?page=${page}&pageSize=${pageSize}`,
      noAuth: true,
      silent: true,
    })
  }

  async function loadMyComments(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<ApiResponse> {
    return request({
      url: `/api/v1/comments/mine?page=${page}&pageSize=${pageSize}`,
      silent: true,
    })
  }

  return {
    // 状态
    categories,
    books,
    shelf,
    shelfStats,
    favorites,
    currentBook,
    chapters,
    selectedCategoryId,

    // 计算属性
    shelfBookIds,

    // 分类
    selectCategory,
    loadCategories,

    // 书籍
    loadRecommend,
    loadRank,
    search,
    loadDetail,
    loadFeatured,
    loadFilter,

    // 书架
    loadShelf,
    loadShelfStats,
    addShelf,
    removeShelf,
    pinShelf,
    unpinShelf,
    removeShelfBatch,

    // 收藏
    addFavorite,
    removeFavorite,
    loadFavorites,
    checkFavoriteStatus,

    // 评论
    loadBookComments,
    loadMyComments,
  }
})
