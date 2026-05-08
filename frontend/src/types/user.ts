/** 阅读器翻页模式 */
export type TurnMode = 'SCROLL' | 'PAGE'

/** 阅读器主题 */
export type ReaderTheme = 'DEFAULT' | 'GRAY' | 'NIGHT'

/** 阅读设置 */
export interface ReadingSetting {
  fontSize: number
  lineHeight: number
  marginX: number
  marginY: number
  paragraphSpacing: number
  theme: ReaderTheme
  turnMode: TurnMode
  autoPageEnabled: boolean
  autoPageInterval: number
  showComments: boolean
}

/** 用户信息 */
export interface UserInfo {
  nickname: string
  avatar: string
  coins: number
  readTime: number
}

/** 登录响应 */
export interface LoginResult {
  token: string
  username: string
}

/** 用户状态 */
export interface UserState {
  token: string
  username: string
}
