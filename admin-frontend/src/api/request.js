import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15000
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && data.code && data.code !== 200) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(data)
    }
    return data.data
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || '请求失败'
    if (status === 401 || status === 403) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_username')
      router.replace('/login')
    }
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default http
