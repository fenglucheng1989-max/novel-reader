/**
 * @file 划线/摘录状态管理
 */
import { defineStore } from 'pinia'

const STORAGE_KEY = 'reader_highlights'

export const useHighlightStore = defineStore('highlight', {
  state: () => ({
    highlights: []
  }),
  actions: {
    loadFromStorage() {
      try {
        const raw = uni.getStorageSync(STORAGE_KEY)
        this.highlights = Array.isArray(raw) ? raw : []
      } catch {
        this.highlights = []
      }
    },
    persist() {
      uni.setStorageSync(STORAGE_KEY, this.highlights)
    },
    addHighlight({ bookId, bookTitle, chapterNo, paragraphIndex, quoteText, color }) {
      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        bookId: Number(bookId),
        bookTitle: bookTitle || '',
        chapterNo: Number(chapterNo),
        paragraphIndex: Number(paragraphIndex),
        quoteText,
        color: color || '#FFEB3B',
        createdAt: new Date().toISOString()
      }
      this.highlights.push(item)
      this.persist()
      return item
    },
    removeHighlight(id) {
      this.highlights = this.highlights.filter(h => h.id !== id)
      this.persist()
    },
    getHighlightsByChapter(bookId, chapterNo) {
      return this.highlights.filter(h =>
        h.bookId === Number(bookId) && h.chapterNo === Number(chapterNo)
      )
    },
    getGroupedHighlights() {
      const map = {}
      this.highlights.forEach(h => {
        const key = String(h.bookId)
        if (!map[key]) {
          map[key] = { bookId: h.bookId, bookTitle: h.bookTitle, items: [] }
        }
        map[key].items.push(h)
      })
      return Object.values(map).sort((a, b) => {
        const latestA = Math.max(0, ...a.items.map(i => new Date(i.createdAt).getTime()))
        const latestB = Math.max(0, ...b.items.map(i => new Date(i.createdAt).getTime()))
        return latestB - latestA
      })
    },
    clearAll() {
      this.highlights = []
      this.persist()
    }
  }
})
