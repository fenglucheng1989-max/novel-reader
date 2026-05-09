/**
 * @file 书籍状态管理
 * @typedef {import('../types').Book} Book
 * @typedef {import('../types').Chapter} Chapter
 * @typedef {import('../types').ShelfItem} ShelfItem
 * @typedef {import('../types').ShelfStats} ShelfStats
 * @typedef {import('../types').BookDetail} BookDetail
 * @typedef {import('../types').PageResult} PageResult
 * @typedef {import('../types').ApiResponse} ApiResponse
 */
import { defineStore } from 'pinia'
import { request } from '../utils/request'

export const useBookStore = defineStore('book', {
  state: () => ({
    /** @type {Array<{id:number,name:string}>} */
    categories: [],
    /** @type {Book[]} */
    books: [],
    /** @type {ShelfItem[]} */
    shelf: [],
    /** @type {ShelfStats|null} */
    shelfStats: null,
    /** @type {import('../types').ReadingHistoryItem[]} */
    favorites: [],
    /** @type {Book|null} */
    currentBook: null,
    /** @type {Chapter[]} */
    chapters: [],
    selectedCategoryId: 0
  }),
  actions: {
    selectCategory(categoryId) {
      this.selectedCategoryId = categoryId || 0
    },
    async loadCategories() {
      const res = await request({ url: '/api/v1/categories', noAuth: true, silent: true })
      if (res.code === 200) {
        this.categories = res.data || []
      }
      return res
    },
    async loadRecommend(categoryId) {
      const query = categoryId ? `?categoryId=${categoryId}` : ''
      const res = await request({ url: `/api/v1/books/recommend${query}`, noAuth: true, silent: true })
      if (res.code === 200) {
        this.books = res.data || []
      }
      return res
    },
    async loadRank(categoryId, limit = 50, groupKey) {
      const params = [`limit=${encodeURIComponent(limit)}`]
      if (categoryId) {
        params.push(`categoryId=${encodeURIComponent(categoryId)}`)
      }
      if (groupKey) {
        params.push(`groupKey=${encodeURIComponent(groupKey)}`)
      }
      return request({ url: `/api/v1/books/rank?${params.join('&')}`, noAuth: true, silent: true })
    },
    async search(keyword) {
      const res = await request({ url: `/api/v1/search/books?keyword=${encodeURIComponent(keyword || '')}`, noAuth: true, silent: true })
      if (res.code === 200) {
        this.books = res.data || []
      }
      return res
    },
    async loadDetail(bookId) {
      const res = await request({ url: `/api/v1/books/${bookId}`, noAuth: true, silent: true })
      if (res.code === 200) {
        this.currentBook = res.data.book
        this.chapters = res.data.chapters || []
      }
      return res
    },
    async loadShelf() {
      const res = await request({ url: '/api/v1/bookshelf', silent: true })
      if (res.code === 200) {
        this.shelf = res.data || []
      }
      return res
    },
    async loadShelfStats() {
      const res = await request({ url: '/api/v1/bookshelf/stats', silent: true })
      if (res.code === 200) {
        this.shelfStats = res.data || null
      }
      return res
    },
    async addShelf(bookId) {
      return request({ url: `/api/v1/bookshelf/${bookId}`, method: 'POST' })
    },
    async removeShelf(bookId) {
      return request({ url: `/api/v1/bookshelf/${bookId}`, method: 'DELETE' })
    },
    async pinShelf(bookId) {
      return request({ url: `/api/v1/bookshelf/${bookId}/pin`, method: 'PUT' })
    },
    async unpinShelf(bookId) {
      return request({ url: `/api/v1/bookshelf/${bookId}/pin`, method: 'DELETE' })
    },
    async removeShelfBatch(bookIds) {
      const results = []
      for (const bookId of bookIds) {
        results.push(await request({ url: `/api/v1/bookshelf/${bookId}`, method: 'DELETE' }))
      }
      return results
    },
    async addFavorite(bookId) {
      return request({ url: `/api/v1/favorites/${bookId}`, method: 'POST' })
    },
    async removeFavorite(bookId) {
      return request({ url: `/api/v1/favorites/${bookId}`, method: 'DELETE' })
    },
    async loadFavorites() {
      const res = await request({ url: '/api/v1/favorites', silentAuth: true })
      if (res.code === 200) {
        this.favorites = res.data || []
      }
      return res
    },
    async checkFavoriteStatus(bookId) {
      return request({ url: `/api/v1/favorites/${bookId}/status`, silent: true })
    },
    async loadRecommendations(bookId, limit = 6) {
      return request({ url: `/api/v1/books/${bookId}/recommendations?limit=${limit}`, noAuth: true, silent: true })
    },
    async loadFilter(params = {}) {
      const queryParts = []
      if (params.categoryId) queryParts.push(`categoryId=${encodeURIComponent(params.categoryId)}`)
      if (params.groupKey) queryParts.push(`groupKey=${encodeURIComponent(params.groupKey)}`)
      if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`)
      if (params.minWordCount != null) queryParts.push(`minWordCount=${params.minWordCount}`)
      if (params.maxWordCount != null) queryParts.push(`maxWordCount=${params.maxWordCount}`)
      if (params.keyword) queryParts.push(`keyword=${encodeURIComponent(params.keyword)}`)
      if (params.sortBy) queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`)
      if (params.page != null) queryParts.push(`page=${params.page}`)
      if (params.pageSize != null) queryParts.push(`pageSize=${params.pageSize}`)
      return request({ url: `/api/v1/books/filter?${queryParts.join('&')}`, noAuth: true, silent: true })
    },
    async loadFeatured(limit = 6, groupKey) {
      const query = [`limit=${limit}`]
      if (groupKey) query.push(`groupKey=${encodeURIComponent(groupKey)}`)
      return request({ url: `/api/v1/books/featured?${query.join('&')}`, noAuth: true, silent: true })
    },
    async loadBookComments(bookId, page = 1, pageSize = 10) {
      return request({ url: `/api/v1/books/${bookId}/comments?page=${page}&pageSize=${pageSize}`, noAuth: true, silent: true })
    },
    async loadChapterComments(chapterId, page = 1, pageSize = 10) {
      return request({ url: `/api/v1/chapters/${chapterId}/comments?page=${page}&pageSize=${pageSize}`, noAuth: true, silent: true })
    },
    async createComment(payload) {
      return request({ url: '/api/v1/comments', method: 'POST', data: payload })
    },
    async loadMyComments(page = 1, pageSize = 20) {
      return request({ url: `/api/v1/comments/mine?page=${page}&pageSize=${pageSize}`, silent: true })
    }
  }
})
