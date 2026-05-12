/**
 * 统一请求模块
 *
 * 封装 uni.request，提供：
 * - JWT 自动注入
 * - 401 自动跳转登录
 * - 服务端 fallback 重试
 * - 统一错误处理
 * - 类型安全的请求/响应
 */

import { getApiBaseUrl } from '../config/api'
import type { ApiResponse } from '../types/api'

/* ===================== 类型 ===================== */

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown> | string | ArrayBuffer
  header?: Record<string, string>
  noAuth?: boolean
  silent?: boolean
  silentAuth?: boolean
  responseType?: 'text' | 'arraybuffer'
  timeout?: number
}

interface RequestError extends Error {
  payload?: unknown
}

function createError(message: string, payload?: unknown): RequestError {
  const err = new Error(message) as RequestError
  err.payload = payload
  return err
}

/* ===================== 工具 ===================== */

function getDevFallbackUrl(path: string): string {
  // #ifdef H5
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8080${path}`
  }
  // #endif
  return `http://localhost:8080${path}`
}

function getResponseMessage(res: UniApp.RequestSuccessCallbackResult, fallback: string): string {
  const data = res.data as Record<string, unknown> | string | null | undefined
  if (!data) return fallback
  if (typeof data === 'object' && data !== null && typeof data.message === 'string') return data.message
  if (typeof data === 'string') return data
  return fallback
}

function normalizeResponseData(data: unknown): unknown {
  if (typeof data !== 'string') return data
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

/* ===================== 核心请求 ===================== */

function buildHeader(options: RequestOptions): Record<string, string> {
  const token = uni.getStorageSync('token') as string | undefined
  return {
    'Content-Type': 'application/json',
    ...(options.header || {}),
    ...(token && !options.noAuth ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * 通用请求
 * 返回 Promise<ApiResponse<T>>
 */
// 默认超时时间（毫秒）
const DEFAULT_TIMEOUT = 15000

export function request<T = unknown>(options: RequestOptions): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const header = buildHeader(options)
    const silent = options.silent
    const primaryUrl = getApiBaseUrl() + options.url
    const fallbackUrl = getDevFallbackUrl(options.url)
    const timeout = options.timeout ?? DEFAULT_TIMEOUT

    function send(url: string, allowFallback: boolean = true): void {
      // 超时处理
      const timeoutTimer = setTimeout(() => {
        if (allowFallback && url !== fallbackUrl) {
          send(fallbackUrl, false)
        } else {
          const message = '请求超时'
          if (!silent) uni.showToast({ title: message, icon: 'none' })
          reject(createError(message, { url, timeout }))
        }
      }, timeout)

      uni.request({
        url,
        method: options.method || 'GET',
        data: options.data || {},
        header,
        timeout,
        success: (res) => {
          clearTimeout(timeoutTimer)
          res.data = normalizeResponseData(res.data) as UniApp.RequestSuccessCallbackResult['data']

          if (res.statusCode === 200) {
            resolve(res.data as ApiResponse<T>)
            return
          }

          // 服务端错误 → fallback
          if (allowFallback && url !== fallbackUrl && res.statusCode >= 500) {
            send(fallbackUrl, false)
            return
          }

          // 401
          if (res.statusCode === 401) {
            const msg = getResponseMessage(res, '请先登录')
            uni.removeStorageSync('token')
            uni.removeStorageSync('username')

            if (options.silentAuth) {
              reject(createError(msg, res.data))
              return
            }

            if (!silent) uni.showToast({ title: msg, icon: 'none' })
            setTimeout(() => {
              uni.switchTab({ url: '/pages/mine/mine' })
            }, 1500)

            reject(createError(msg, res.data))
            return
          }

          // 403
          if (res.statusCode === 403) {
            const msg = getResponseMessage(res, '权限不足')
            if (!silent) uni.showToast({ title: msg, icon: 'none' })
            reject(createError(msg, res.data))
            return
          }

          // 其他错误
          const message = getResponseMessage(res, `请求失败(${res.statusCode})`)
          if (!silent) uni.showToast({ title: message, icon: 'none' })
          reject(createError(message, res.data))
        },
        fail: (err) => {
          clearTimeout(timeoutTimer)
          if (allowFallback && url !== fallbackUrl) {
            send(fallbackUrl, false)
            return
          }
          const message = err?.errMsg || '网络错误'
          if (!silent) uni.showToast({ title: message, icon: 'none' })
          reject(createError(message, err))
        },
      })
    }

    send(primaryUrl)
  })
}

/**
 * 原始请求（不包装响应格式）
 * 用于文件下载等场景
 */
export function requestRaw<T = unknown>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token') as string | undefined
    const header: Record<string, string> = {
      ...(options.header || {}),
      ...(token && !options.noAuth ? { Authorization: `Bearer ${token}` } : {}),
    }

    uni.request({
      url: getApiBaseUrl() + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      responseType: options.responseType || 'text',
      success: (res) => {
        res.data = normalizeResponseData(res.data) as UniApp.RequestSuccessCallbackResult['data']

        if (res.statusCode === 200) {
          resolve(res.data as T)
          return
        }

        if (res.statusCode === 401) {
          const msg = getResponseMessage(res, '请先登录')
          uni.removeStorageSync('token')
          uni.removeStorageSync('username')
          if (options.silentAuth) {
            reject(createError(msg, res.data))
            return
          }
          uni.showToast({ title: msg, icon: 'none' })
          setTimeout(() => {
            uni.switchTab({ url: '/pages/mine/mine' })
          }, 1500)
          reject(createError(msg, res.data))
          return
        }

        const message = getResponseMessage(res, `请求失败(${res.statusCode})`)
        uni.showToast({ title: message, icon: 'none' })
        reject(createError(message, res.data))
      },
      fail: (err) => {
        const message = err?.errMsg || '网络错误'
        uni.showToast({ title: message, icon: 'none' })
        reject(createError(message, err))
      },
    })
  })
}
