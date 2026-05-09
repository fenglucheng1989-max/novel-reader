/**
 * @file 用户状态管理
 * @typedef {import('../types').UserState} UserState
 * @typedef {import('../types').LoginResult} LoginResult
 * @typedef {import('../types').ApiResponse} ApiResponse
 */
import { defineStore } from 'pinia'
import { request } from '../utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    /** @type {string} */
    token: uni.getStorageSync('token') || '',
    /** @type {string} */
    username: uni.getStorageSync('username') || '',
    /** @type {string} */
    avatarUrl: uni.getStorageSync('avatarUrl') || ''
  }),
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  actions: {
    syncFromStorage() {
      this.token = uni.getStorageSync('token') || ''
      this.username = uni.getStorageSync('username') || ''
      this.avatarUrl = uni.getStorageSync('avatarUrl') || ''
    },
    async login(username, password) {
      const res = await request({
        url: '/api/v1/auth/login',
        method: 'POST',
        data: { username, password }
      })
      if (res.code === 200) {
        this.token = res.data.token
        this.username = username
        uni.setStorageSync('token', this.token)
        uni.setStorageSync('username', username)
        await this.fetchProfile()
      }
      return res
    },
    async register(username, password, email) {
      const res = await request({
        url: '/api/v1/auth/register',
        method: 'POST',
        data: { username, password, email }
      })
      if (res.code === 200) {
        this.token = res.data.token
        this.username = username
        uni.setStorageSync('token', this.token)
        uni.setStorageSync('username', username)
      }
      return res
    },
    logout() {
      this.token = ''
      this.username = ''
      this.avatarUrl = ''
      uni.removeStorageSync('token')
      uni.removeStorageSync('username')
      uni.removeStorageSync('avatarUrl')
    },
    async fetchProfile() {
      const res = await request({
        url: '/api/v1/user/profile',
        method: 'GET',
        silent: true
      })
      if (res.code === 200 && res.data) {
        if (res.data.avatarUrl !== undefined) {
          this.avatarUrl = res.data.avatarUrl || ''
          uni.setStorageSync('avatarUrl', this.avatarUrl)
        }
        if (res.data.username) {
          this.username = res.data.username
          uni.setStorageSync('username', res.data.username)
        }
      }
      return res
    },
    async updateProfile(data) {
      const res = await request({
        url: '/api/v1/user/profile',
        method: 'PUT',
        data
      })
      if (res.code === 200 && res.data) {
        if (res.data.avatarUrl !== undefined) {
          this.avatarUrl = res.data.avatarUrl || ''
          uni.setStorageSync('avatarUrl', this.avatarUrl)
        }
        if (res.data.username) {
          this.username = res.data.username
          uni.setStorageSync('username', res.data.username)
        }
      }
      return res
    }
  }
})
