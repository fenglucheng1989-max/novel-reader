import { defineStore } from 'pinia'
import { request } from '../utils/request'

const defaultSetting = {
  fontSize: 18,
  lineHeight: 32,
  marginX: 22,
  marginY: 28,
  paragraphSpacing: 0,
  theme: 'DEFAULT',
  turnMode: 'SCROLL',
  autoPageEnabled: false,
  autoPageInterval: 15
}

function isFullChapter(chapter) {
  return !!chapter &&
    typeof chapter === 'object' &&
    chapter.id != null &&
    chapter.bookId != null &&
    chapter.chapterNo != null &&
    typeof chapter.title === 'string' &&
    chapter.title.length > 0 &&
    typeof chapter.content === 'string' &&
    chapter.content.length > 0
}

export const useReaderStore = defineStore('reader', {
  state: () => ({
    chapter: null,
    chapters: [],
    chapterCache: {},
    progress: null,
    setting: { ...defaultSetting, ...(uni.getStorageSync('readerSetting') || {}) }
  }),
  actions: {
    getChapterCacheKey(bookId, chapterNo) {
      return `chapter:v2:${bookId}:${chapterNo}`
    },
    getCachedChapter(bookId, chapterNo) {
      const cacheKey = this.getChapterCacheKey(bookId, chapterNo)
      if (isFullChapter(this.chapterCache[cacheKey])) return this.chapterCache[cacheKey]
      const cached = uni.getStorageSync(cacheKey)
      if (isFullChapter(cached)) {
        this.chapterCache = { ...this.chapterCache, [cacheKey]: cached }
        return cached
      }
      uni.removeStorageSync(cacheKey)
      const { [cacheKey]: _invalid, ...rest } = this.chapterCache
      this.chapterCache = rest
      return null
    },
    setCachedChapter(bookId, chapterNo, chapter) {
      if (!isFullChapter(chapter)) return
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
        this.$patch({ chapter: cached })
        return { code: 200, message: 'success', data: cached, cached: true }
      }
      const res = await request({ url: `/api/v1/books/${bookId}/chapters/${chapterNo}` })
      if (res.code === 200) {
        this.$patch({ chapter: res.data })
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
          fontSize: res.data.fontSize || defaultSetting.fontSize,
          lineHeight: res.data.lineHeight || defaultSetting.lineHeight,
          marginX: res.data.marginX || defaultSetting.marginX,
          marginY: res.data.marginY || defaultSetting.marginY,
          paragraphSpacing: res.data.paragraphSpacing || defaultSetting.paragraphSpacing,
          theme: res.data.theme || defaultSetting.theme,
          turnMode: res.data.turnMode || defaultSetting.turnMode,
          autoPageEnabled: res.data.autoPageEnabled != null ? res.data.autoPageEnabled : defaultSetting.autoPageEnabled,
          autoPageInterval: res.data.autoPageInterval || defaultSetting.autoPageInterval
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
