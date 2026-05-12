/**
 * userStore — 用户状态管理
 *
 * 管理登录/注册/退出、个人资料。
 * Composition API + TypeScript。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { request } from '../utils/request'
import type { ApiResponse } from '../types/api'

/* ===================== 类型 ===================== */

interface LoginResult {
  token: string
  username: string
}

interface ProfileData {
  avatarUrl?: string
  username?: string
  email?: string
  nickname?: string
}

/* ===================== Store ===================== */

export const useUserStore = defineStore('user', () => {
  /* ---- 状态 ---- */
  const token = ref(uni.getStorageSync('token') || '')
  const username = ref(uni.getStorageSync('username') || '')
  const avatarUrl = ref(uni.getStorageSync('avatarUrl') || '')
  const email = ref(uni.getStorageSync('email') || '')

  /* ---- 计算属性 ---- */
  const isLoggedIn = computed(() => !!token.value)

  /* ---- 同步存储 ---- */
  function syncFromStorage(): void {
    token.value = uni.getStorageSync('token') || ''
    username.value = uni.getStorageSync('username') || ''
    avatarUrl.value = uni.getStorageSync('avatarUrl') || ''
    email.value = uni.getStorageSync('email') || ''
  }

  /* ---- 登录/注册 ---- */
  async function login(
    loginUsername: string,
    password: string,
  ): Promise<ApiResponse> {
    const res = await request({
      url: '/api/v1/auth/login',
      method: 'POST',
      data: { username: loginUsername, password },
    })

    if (res.code === 200) {
      const data = res.data as LoginResult
      token.value = data.token
      username.value = loginUsername
      uni.setStorageSync('token', data.token)
      uni.setStorageSync('username', loginUsername)
      await fetchProfile()
    }
    return res
  }

  async function register(
    regUsername: string,
    password: string,
    regEmail?: string,
  ): Promise<ApiResponse> {
    const res = await request({
      url: '/api/v1/auth/register',
      method: 'POST',
      data: { username: regUsername, password, email: regEmail },
    })

    if (res.code === 200) {
      const data = res.data as LoginResult
      token.value = data.token
      username.value = regUsername
      uni.setStorageSync('token', data.token)
      uni.setStorageSync('username', regUsername)
    }
    return res
  }

  function logout(): void {
    token.value = ''
    username.value = ''
    avatarUrl.value = ''
    email.value = ''
    uni.removeStorageSync('token')
    uni.removeStorageSync('username')
    uni.removeStorageSync('avatarUrl')
    uni.removeStorageSync('email')
  }

  /* ---- 资料 ---- */
  async function fetchProfile(): Promise<ApiResponse> {
    const res = await request({
      url: '/api/v1/user/profile',
      method: 'GET',
      silent: true,
    })

    if (res.code === 200 && res.data) {
      const data = res.data as ProfileData
      applyProfile(data)
    }
    return res
  }

  async function updateProfile(data: ProfileData): Promise<ApiResponse> {
    const res = await request({
      url: '/api/v1/user/profile',
      method: 'PUT',
      data,
    })

    if (res.code === 200 && res.data) {
      applyProfile(res.data as ProfileData)
    }
    return res
  }

  /* ---- 内部 ---- */
  function applyProfile(data: ProfileData): void {
    if (data.avatarUrl !== undefined) {
      avatarUrl.value = data.avatarUrl || ''
      uni.setStorageSync('avatarUrl', avatarUrl.value)
    }
    if (data.username) {
      username.value = data.username
      uni.setStorageSync('username', data.username)
    }
    if (data.email !== undefined) {
      email.value = data.email || ''
      uni.setStorageSync('email', email.value)
    }
  }

  return {
    // 状态
    token,
    username,
    avatarUrl,
    email,
    isLoggedIn,

    // 方法
    syncFromStorage,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
  }
})
