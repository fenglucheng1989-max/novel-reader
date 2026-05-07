import { defineStore } from 'pinia'
import { request } from '../utils/request'

const defaultSetting = {
  fontSize: 18,
  lineHeight: 32,
  theme: 'DEFAULT',
  turnMode: 'SCROLL'
}

export const useReaderStore = defineStore('reader', {
  state: () => ({
    chapter: null,
    chapters: [],
    chapterCache: {},
    progress: null,
    setting: uni.getStorageSync('readerSetting') || defaultSetting
  }),
  actions: {
    getChapterCacheKey(bookId, chapterNo) {
      return `chapter:${bookId}:${chapterNo}`
    },
    getCachedChapter(bookId, chapterNo) {
      const cacheKey = this.getChapterCacheKey(bookId, chapterNo)
      if (this.chapterCache[cacheKey]) return this.chapterCache[cacheKey]
      const cached = uni.getStorageSync(cacheKey)
      if (cached) {
        this.chapterCache = { ...this.chapterCache, [cacheKey]: cached }
        return cached
      }
      return null
    },
    setCachedChapter(bookId, chapterNo, chapter) {
      const cacheKey = this.getChapterCacheKey(bookId, chapterNo)
      this.chapterCache = { ...this.chapterCache, [cacheKey]: chapter }
      uni.setStorageSync(cacheKey, chapter)
    },
    async loadChapters(bookId) {
      const res = await request({ url: `/api/v1/books/${bookId}/chapters` })
      if (res.code === 200) {
        this.chapters = res.data || []
      }
      return res
    },
    async loadChapter(bookId, chapterNo) {
      const cached = this.getCachedChapter(bookId, chapterNo)
      if (cached) {
        this.chapter = cached
        return { code: 200, message: 'success', data: cached, cached: true }
      }
      const res = await request({ url: `/api/v1/books/${bookId}/chapters/${chapterNo}` })
      if (res.code === 200) {
        this.chapter = res.data
        this.setCachedChapter(bookId, chapterNo, res.data)
      }
      return res
    },
    async preloadChapter(bookId, chapterNo) {
      if (!bookId || !chapterNo) return null
      const cached = this.getCachedChapter(bookId, chapterNo)
      if (cached) return cached
      const res = await request({ url: `/api/v1/books/${bookId}/chapters/${chapterNo}` })
      if (res.code === 200) {
        this.setCachedChapter(bookId, chapterNo, res.data)
        return res.data
      }
      return null
    },
    async loadProgress(bookId) {
      const res = await request({ url: `/api/v1/reading/progress/${bookId}` })
      if (res.code === 200) {
        this.progress = res.data
      }
      return res
    },
    async saveProgress(bookId, payload) {
      return request({
        url: `/api/v1/reading/progress/${bookId}`,
        method: 'PUT',
        data: payload
      })
    },
    async loadSetting() {
      const res = await request({ url: '/api/v1/reading/setting' })
      if (res.code === 200 && res.data) {
        this.setting = {
          fontSize: res.data.fontSize || 18,
          lineHeight: res.data.lineHeight || 32,
          theme: res.data.theme || 'DEFAULT',
          turnMode: res.data.turnMode || 'SCROLL'
        }
        uni.setStorageSync('readerSetting', this.setting)
      }
      return res
    },
    async saveSetting(setting) {
      this.setting = { ...this.setting, ...setting }
      uni.setStorageSync('readerSetting', this.setting)
      return request({ url: '/api/v1/reading/setting', method: 'PUT', data: this.setting })
    },
    updateLocalSetting(setting) {
      this.setting = { ...this.setting, ...setting }
      uni.setStorageSync('readerSetting', this.setting)
    }
  }
})
