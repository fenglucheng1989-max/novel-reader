/**
 * API 配置
 * 多端 API 基地址管理
 */

function getDevH5ApiBaseUrl(): string {
  return ''
}

const DEFAULT_H5_API_BASE_URL = import.meta.env.DEV ? getDevH5ApiBaseUrl() : ''
const DEFAULT_APP_API_BASE_URL = 'http://192.168.101.12:8080'

function trimTrailingSlash(value: string): string {
  return value ? value.replace(/\/+$/, '') : ''
}

export function getApiBaseUrl(): string {
  let baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || DEFAULT_H5_API_BASE_URL

  // #ifdef APP-PLUS
  baseUrl = (import.meta.env.VITE_APP_API_BASE_URL as string | undefined) ||
            (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
            DEFAULT_APP_API_BASE_URL
  // #endif

  return trimTrailingSlash(baseUrl)
}
