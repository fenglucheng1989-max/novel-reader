/**
 * @file 阅读器状态管理
 * @typedef {import('../types').Chapter} Chapter
 * @typedef {import('../types').ReadingSetting} ReadingSetting
 * @typedef {import('../types').ReadingProgress} ReadingProgress
 * @typedef {import('../types').ApiResponse} ApiResponse
 */
import { defineStore } from 'pinia'
import { request } from '../utils/request'

/** @type {ReadingSetting} */
const defaultSetting = {
  fontSize: 16,
  lineHeight: 30,
  marginX: 22,
  marginY: 28,
  paragraphSpacing: 0,
  theme: 'DEFAULT',
  turnMode: 'COVER',
  autoPageEnabled: false,
  autoPageInterval: 15,
  showComments: false,
  brightness: 80,
  eyeProtection: false
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

function unwrapStorageValue(value) {
  if (value && typeof value === 'object' && value.type === 'object' && value.data) {
    return value.data
  }
  return value
}

const chapterRequests = new Map()
const CHAPTER_CACHE_VERSION = 'v3'

export const useReaderStore = defineStore('reader', {
  state: () => ({
    /** @type {Chapter|null} */
    chapter: null,
    /** @type {Chapter[]} */
    chapters: [],
    /** @type {Record<string, Chapter>} */
    chapterCache: {},
    /** @type {ReadingProgress|null} */
    progress: null,
    /** @type {ReadingSetting} */
    setting: { ...defaultSetting, ...(uni.getStorageSync('readerSetting') || {}) }
  }),
  actions: {
    getChapterCacheKey(bookId, chapterNo) {
      return `chapter:${CHAPTER_CACHE_VERSION}:${bookId}:${chapterNo}`
    },
    isChapterForRequest(chapter, bookId, chapterNo) {
      return isFullChapter(chapter) &&
        String(chapter.bookId) === String(bookId) &&
        Number(chapter.chapterNo) === Number(chapterNo)
    },
    getCachedChapter(bookId, chapterNo) {
      const cacheKey = this.getChapterCacheKey(bookId, chapterNo)
      const memoryCached = unwrapStorageValue(this.chapterCache[cacheKey])
      if (this.isChapterForRequest(memoryCached, bookId, chapterNo)) return memoryCached
      const cached = unwrapStorageValue(uni.getStorageSync(cacheKey))
      if (this.isChapterForRequest(cached, bookId, chapterNo)) {
        this.chapterCache = { ...this.chapterCache, [cacheKey]: cached }
        return cached
      }
      uni.removeStorageSync(cacheKey)
      const { [cacheKey]: _invalid, ...rest } = this.chapterCache
      this.chapterCache = rest
      return null
    },
    setCachedChapter(bookId, chapterNo, chapter) {
      if (!this.isChapterForRequest(chapter, bookId, chapterNo)) return
      const cacheKey = this.getChapterCacheKey(bookId, chapterNo)
      this.chapterCache = { ...this.chapterCache, [cacheKey]: chapter }
      uni.setStorageSync(cacheKey, chapter)
    },
    async loadChapters(bookId) {
      const res = await request({ url: `/api/v1/books/${bookId}/chapters`, noAuth: true, silent: true })
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
      const requestKey = this.getChapterCacheKey(bookId, chapterNo)
      const pending = chapterRequests.get(requestKey)
      const res = pending
        ? await pending
        : await (() => {
          const req = request({ url: `/api/v1/books/${bookId}/chapters/${chapterNo}`, noAuth: true, silent: true })
            .finally(() => chapterRequests.delete(requestKey))
          chapterRequests.set(requestKey, req)
          return req
        })()
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
      const requestKey = this.getChapterCacheKey(bookId, chapterNo)
      const pending = chapterRequests.get(requestKey)
      const res = pending
        ? await pending
        : await (() => {
          const req = request({ url: `/api/v1/books/${bookId}/chapters/${chapterNo}`, noAuth: true, silent: true })
            .finally(() => chapterRequests.delete(requestKey))
          chapterRequests.set(requestKey, req)
          return req
        })()
      if (res.code === 200) {
        this.setCachedChapter(bookId, chapterNo, res.data)
        return res.data
      }
      return null
    },
    async loadProgress(bookId) {
      const res = await request({ url: `/api/v1/reading/progress/${bookId}`, silentAuth: true, silent: true })
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
      const res = await request({ url: '/api/v1/reading/setting', silentAuth: true, silent: true })
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
          autoPageInterval: res.data.autoPageInterval || defaultSetting.autoPageInterval,
          showComments: res.data.showComments != null ? res.data.showComments : defaultSetting.showComments,
          brightness: res.data.brightness != null ? res.data.brightness : defaultSetting.brightness,
          eyeProtection: res.data.eyeProtection != null ? res.data.eyeProtection : defaultSetting.eyeProtection
        }
        uni.setStorageSync('readerSetting', this.setting)
        this.syncBrightnessKeys(this.setting)
      }
      return res
    },
    syncBrightnessKeys(setting) {
      if ('brightness' in setting) uni.setStorageSync('readerBrightness', setting.brightness)
      if ('eyeProtection' in setting) uni.setStorageSync('readerEyeProtection', setting.eyeProtection)
    },
    async saveSetting(setting) {
      this.setting = { ...this.setting, ...setting }
      uni.setStorageSync('readerSetting', this.setting)
      this.syncBrightnessKeys(setting)
      return request({ url: '/api/v1/reading/setting', method: 'PUT', data: this.setting })
    },
    updateLocalSetting(setting) {
      this.setting = { ...this.setting, ...setting }
      uni.setStorageSync('readerSetting', this.setting)
      this.syncBrightnessKeys(setting)
    }
  }
})
