import { getApiBaseUrl } from '../config/api'

function getDevApiFallbackUrl(path) {
  // #ifdef H5
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8080${path}`
  }
  // #endif
  return `http://localhost:8080${path}`
}

function getResponseMessage(res, fallback) {
  if (!res) return fallback
  if (res.data && typeof res.data === 'object' && res.data.message) return res.data.message
  if (res.data && typeof res.data === 'string') return res.data
  return fallback
}

function normalizeResponseData(data) {
  if (typeof data !== 'string') return data
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

function rejectWithMessage(reject, message, payload) {
  const error = new Error(message)
  error.payload = payload
  reject(error)
}

export function request(options) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    const header = {
      'Content-Type': 'application/json',
      ...(token && !options.noAuth ? { Authorization: `Bearer ${token}` } : {})
    }

    const primaryUrl = getApiBaseUrl() + options.url
    const fallbackUrl = getDevApiFallbackUrl(options.url)

    const send = (url, allowFallback = true) => uni.request({
      url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success: (res) => {
        res.data = normalizeResponseData(res.data)
        if (res.statusCode === 200) {
          resolve(res.data)
          return
        }

        if (allowFallback && url !== fallbackUrl && res.statusCode >= 500) {
          send(fallbackUrl, false)
          return
        }

        if (res.statusCode === 401) {
          const msg = (res.data && res.data.message) || '请先登录'
          uni.removeStorageSync('token')
          uni.removeStorageSync('username')
          if (options.silentAuth) {
            rejectWithMessage(reject, msg, res.data)
            return
          }
          uni.showToast({ title: msg, icon: 'none' })
          setTimeout(() => {
            uni.switchTab({ url: '/pages/mine/mine' })
          }, 1500)
          rejectWithMessage(reject, msg, res.data)
          return
        }

        if (res.statusCode === 403) {
          const msg = (res.data && res.data.message) || '权限不足'
          uni.showToast({ title: msg, icon: 'none' })
          rejectWithMessage(reject, msg, res.data)
          return
        }

        const message = getResponseMessage(res, '请求失败')
        uni.showToast({ title: message, icon: 'none' })
        rejectWithMessage(reject, message, res.data)
      },
      fail: (err) => {
        if (allowFallback && url !== fallbackUrl) {
          send(fallbackUrl, false)
          return
        }
        const message = err && err.errMsg ? err.errMsg : '网络错误'
        uni.showToast({ title: message, icon: 'none' })
        rejectWithMessage(reject, message, err)
      }
    })

    send(primaryUrl)
  })
}

export function requestRaw(options) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    const header = {
      ...(options.header || {}),
      ...(token && !options.noAuth ? { Authorization: `Bearer ${token}` } : {})
    }

    uni.request({
      url: getApiBaseUrl() + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      responseType: options.responseType || 'text',
      success: (res) => {
        res.data = normalizeResponseData(res.data)
        if (res.statusCode === 200) {
          resolve(res.data)
          return
        }

        if (res.statusCode === 401) {
          const msg = (res.data && res.data.message) || '请先登录'
          uni.removeStorageSync('token')
          uni.removeStorageSync('username')
          if (options.silentAuth) {
            rejectWithMessage(reject, msg, res.data)
            return
          }
          uni.showToast({ title: msg, icon: 'none' })
          setTimeout(() => {
            uni.switchTab({ url: '/pages/mine/mine' })
          }, 1500)
          rejectWithMessage(reject, msg, res.data)
          return
        }

        const message = getResponseMessage(res, `请求失败(${res.statusCode})`)
        uni.showToast({ title: message, icon: 'none' })
        rejectWithMessage(reject, message, res.data)
      },
      fail: (err) => {
        const message = err && err.errMsg ? err.errMsg : '网络错误'
        uni.showToast({ title: message, icon: 'none' })
        rejectWithMessage(reject, message, err)
      }
    })
  })
}
