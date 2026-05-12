/**
 * ShareService — 分享服务
 *
 * 统一分享接口，支持多平台分发。
 * 使用 PlatformAdapter.share() 作为底层能力。
 */

import { getPlatformAdapter } from '../platform/ReaderPlatform'
import type { ShareOptions, ShareResult } from '../types/platform'

export interface IShareService {
  share(options: ShareOptions): Promise<ShareResult>
  shareText(text: string, title?: string): Promise<ShareResult>
  shareImage(imageUrl: string, title?: string): Promise<ShareResult>
}

export class ShareService implements IShareService {
  private platform = getPlatformAdapter()

  async share(options: ShareOptions): Promise<ShareResult> {
    return this.platform.share(options)
  }

  async shareText(text: string, title?: string): Promise<ShareResult> {
    return this.platform.share({
      title,
      text,
      type: 'text',
    })
  }

  async shareImage(imageUrl: string, title?: string): Promise<ShareResult> {
    return this.platform.share({
      title,
      text: '',
      imageUrl,
      type: 'image',
    })
  }

  /** 生成分享卡片 HTML（用于 H5 自定义分享卡片） */
  static generateShareCard(quote: string, bookTitle: string): string {
    return `
      <div style="
        background:#F9F5E8;border-radius:12px;
        padding:24px 20px;max-width:320px;
        font-family:'Noto Serif SC',serif;
        box-shadow:0 4px 20px rgba(0,0,0,0.1);
      ">
        <div style="font-size:14px;color:#8B7355;margin-bottom:8px;">
          📖 ${bookTitle}
        </div>
        <div style="
          font-size:16px;color:#3D2B1F;
          line-height:1.8;text-indent:2em;
          border-left:3px solid #C4A882;
          padding-left:12px;
        ">
          ${quote}
        </div>
        <div style="text-align:right;font-size:12px;color:#B8A088;margin-top:12px;">
          悦读 · 发现好故事
        </div>
      </div>
    `
  }
}
