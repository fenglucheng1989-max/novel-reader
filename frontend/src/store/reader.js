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
    progress: null,
    setting: uni.getStorageSync('readerSetting') || defaultSetting
  }),
  actions: {
    async loadChapters(bookId) {
      const res = await request({ url: `/api/v1/books/${bookId}/chapters` })
      if (res.code === 200) {
        this.chapters = res.data || []
      }
      return res
    },
    async loadChapter(bookId, chapterNo) {
      const cacheKey = `chapter:${bookId}:${chapterNo}`
      const cached = uni.getStorageSync(cacheKey)
      if (cached) {
        this.chapter = cached
      }
      const res = await request({ url: `/api/v1/books/${bookId}/chapters/${chapterNo}` })
      if (res.code === 200) {
        this.chapter = res.data
        uni.setStorageSync(cacheKey, res.data)
      }
      return res
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
