/**
 * @file 划线/摘录状态管理
 */
import { defineStore } from 'pinia'
import { request } from '../utils/request'

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
    async syncFromServer() {
      try {
        const res = await request({ url: '/api/v1/highlights', silentAuth: true, silent: true })
        if (res.code === 200 && Array.isArray(res.data)) {
          const serverItems = res.data.map(h => ({
            id: String(h.id),
            bookId: h.bookId,
            bookTitle: h.bookTitle || '',
            chapterNo: h.chapterNo,
            paragraphIndex: h.paragraphIndex,
            quoteText: h.quoteText,
            color: h.color || '#FFEB3B',
            createdAt: h.createdAt
          }))
          // Merge: server wins, keep local items not yet synced (those with non-numeric ids)
          const localOnly = this.highlights.filter(h => isNaN(Number(h.id)))
          this.highlights = [...serverItems, ...localOnly]
          this.persist()
        }
      } catch { /* offline, use local */ }
    },
    async addHighlight({ bookId, bookTitle, chapterNo, paragraphIndex, quoteText, color }) {
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

      // Sync to server
      try {
        const res = await request({
          url: '/api/v1/highlights',
          method: 'POST',
          data: { bookId, bookTitle, chapterNo, paragraphIndex, quoteText, color }
        })
        if (res.code === 200 && res.data?.id) {
          item.id = String(res.data.id)
          item.createdAt = res.data.createdAt || item.createdAt
          this.persist()
        }
      } catch { /* offline, will be local-only */ }

      return item
    },
    async removeHighlight(id) {
      this.highlights = this.highlights.filter(h => h.id !== id)
      this.persist()
      // Delete from server if it's a server-side id
      if (!isNaN(Number(id))) {
        try {
          await request({ url: `/api/v1/highlights/${id}`, method: 'DELETE' })
        } catch { /* ignore */ }
      }
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
