import { defineStore } from 'pinia'
import { request } from '../utils/request'

export const useBookStore = defineStore('book', {
  state: () => ({
    categories: [],
    books: [],
    shelf: [],
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
    async addShelf(bookId) {
      return request({ url: `/api/v1/bookshelf/${bookId}`, method: 'POST' })
    },
    async removeShelf(bookId) {
      return request({ url: `/api/v1/bookshelf/${bookId}`, method: 'DELETE' })
    }
  }
})
