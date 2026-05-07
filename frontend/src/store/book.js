import { defineStore } from 'pinia'
import { request } from '../utils/request'

export const useBookStore = defineStore('book', {
  state: () => ({
    categories: [],
    books: [],
    shelf: [],
    shelfStats: null,
    currentBook: null,
    chapters: [],
    selectedCategoryId: 0
  }),
  actions: {
    selectCategory(categoryId) {
      this.selectedCategoryId = categoryId || 0
    },
    async loadCategories() {
      const res = await request({ url: '/api/v1/categories' })
      if (res.code === 200) {
        this.categories = res.data || []
      }
      return res
    },
    async loadRecommend(categoryId) {
      const query = categoryId ? `?categoryId=${categoryId}` : ''
      const res = await request({ url: `/api/v1/books/recommend${query}` })
      if (res.code === 200) {
        this.books = res.data || []
      }
      return res
    },
    async loadRank(categoryId, limit = 50) {
      const params = [`limit=${encodeURIComponent(limit)}`]
      if (categoryId) {
        params.push(`categoryId=${encodeURIComponent(categoryId)}`)
      }
      return request({ url: `/api/v1/books/rank?${params.join('&')}` })
    },
    async search(keyword) {
      const res = await request({ url: `/api/v1/search/books?keyword=${encodeURIComponent(keyword || '')}` })
      if (res.code === 200) {
        this.books = res.data || []
      }
      return res
    },
    async loadDetail(bookId) {
      const res = await request({ url: `/api/v1/books/${bookId}` })
      if (res.code === 200) {
        this.currentBook = res.data.book
        this.chapters = res.data.chapters || []
      }
      return res
    },
    async loadShelf() {
      const res = await request({ url: '/api/v1/bookshelf' })
      if (res.code === 200) {
        this.shelf = res.data || []
      }
      return res
    },
    async loadShelfStats() {
      const res = await request({ url: '/api/v1/bookshelf/stats' })
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
    async loadRecommendations(bookId, limit = 6) {
      return request({ url: `/api/v1/books/${bookId}/recommendations?limit=${limit}` })
    },
    async loadFilter(params = {}) {
      const queryParts = []
      if (params.categoryId) queryParts.push(`categoryId=${encodeURIComponent(params.categoryId)}`)
      if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`)
      if (params.minWordCount != null) queryParts.push(`minWordCount=${params.minWordCount}`)
      if (params.maxWordCount != null) queryParts.push(`maxWordCount=${params.maxWordCount}`)
      if (params.keyword) queryParts.push(`keyword=${encodeURIComponent(params.keyword)}`)
      if (params.sortBy) queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`)
      if (params.page != null) queryParts.push(`page=${params.page}`)
      if (params.pageSize != null) queryParts.push(`pageSize=${params.pageSize}`)
      return request({ url: `/api/v1/books/filter?${queryParts.join('&')}` })
    },
    async loadFeatured(limit = 6) {
      return request({ url: `/api/v1/books/featured?limit=${limit}` })
    }
  }
})
