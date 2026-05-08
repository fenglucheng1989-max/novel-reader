/** API 统一响应 */
export interface ApiResponse<T = unknown> {
  code: number
  data: T | null
  message: string | null
}
