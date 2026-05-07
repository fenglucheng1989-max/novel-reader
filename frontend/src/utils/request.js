import { getApiBaseUrl } from '../config/api'

function getResponseMessage(res, fallback) {
  if (!res) return fallback
  if (res.data && typeof res.data === 'object' && res.data.message) return res.data.message
  if (res.data && typeof res.data === 'string') return res.data
  return fallback
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
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }

    uni.request({
      url: getApiBaseUrl() + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
          return
        }

        if (res.statusCode === 401) {
          const msg = (res.data && res.data.message) || '请先登录'
          uni.removeStorageSync('token')
          uni.removeStorageSync('username')
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
        const message = err && err.errMsg ? err.errMsg : '网络错误'
        uni.showToast({ title: message, icon: 'none' })
        rejectWithMessage(reject, message, err)
      }
    })
  })
}

export function requestRaw(options) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    const header = {
      ...(options.header || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }

    uni.request({
      url: getApiBaseUrl() + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      responseType: options.responseType || 'text',
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
          return
        }

        if (res.statusCode === 401) {
          const msg = (res.data && res.data.message) || '请先登录'
          uni.removeStorageSync('token')
          uni.removeStorageSync('username')
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
