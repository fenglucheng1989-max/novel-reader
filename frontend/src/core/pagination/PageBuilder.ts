/**
 * PageBuilder — 页面 HTML 构建器
 *
 * 职责：
 * 1. 将 Page (Line[]) 渲染为 HTML 字符串
 * 2. 标题行居中样式
 * 3. 首行缩进（2em）
 * 4. 段间距
 * 5. 高亮标记注入（划线/书签）
 * 6. 段评气泡标记注入
 */

import type { Page, Line, ParagraphMeta } from '../../types/reader'

/* ===================== HTML 转义 ===================== */

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ===================== 构建选项 ===================== */

export interface PageBuildOptions {
  /** 首行缩进（默认 2em） */
  paragraphIndent: boolean
  /** 段间间距（px） */
  paragraphSpacing: number
  /** 标题行上下间距（px） */
  titleMarginTop: number
  titleMarginBottom: number
  /** 段落元信息（高亮、评论数等，用于注入 data 属性） */
  paragraphMeta?: Record<number, ParagraphMeta>
  /** 正文行样式类 */
  textClass?: string
  /** 标题行样式类 */
  titleClass?: string
}

const DEFAULT_OPTIONS: PageBuildOptions = {
  paragraphIndent: true,
  paragraphSpacing: 6,
  titleMarginTop: 20,
  titleMarginBottom: 14,
}

/* ===================== 构建 HTML ===================== */

/**
 * 将 Page 构建为 HTML 字符串（修改 page.html 并返回）
 */
export function buildPageHtml(
  page: Page,
  options: Partial<PageBuildOptions> = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { lines } = page

  if (!lines || lines.length === 0) {
    return ''
  }

  const parts: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const escapedText = escapeHtml(line.text)

    // 空行 → 占位
    if (line.text === '' && line.isFirstInParagraph) {
      parts.push('<p class="nr-empty-line"><br/></p>')
      continue
    }

    // 标题行
    if (line.isTitle) {
      parts.push(
        `<p class="nr-title" ` +
          `style="text-align:center;` +
          `margin-top:${opts.titleMarginTop}px;` +
          `margin-bottom:${opts.titleMarginBottom}px;` +
          `font-weight:bold;font-size:1.1em">` +
          `${escapedText}</p>`,
      )
      continue
    }

    // 正文行
    const indent = line.indent && opts.paragraphIndent
    const isFirstInPara = line.isFirstInParagraph

    // 段间距（通过 margin-top）
    const marginTop =
      isFirstInPara && i > 0 ? opts.paragraphSpacing : 0

    parts.push(
      `<p class="nr-line" ` +
        `style="margin:${marginTop}px 0 0 0;` +
        `${indent ? 'text-indent:2em;' : ''}` +
        `text-align:justify;word-break:break-word">` +
        `${escapedText}</p>`,
    )
  }

  const html = parts.join('\n')
  page.html = html
  return html
}

/**
 * 批量构建页面 HTML
 */
export function buildAllPages(
  pages: Page[],
  options: Partial<PageBuildOptions> = {},
): void {
  for (const page of pages) {
    buildPageHtml(page, options)
  }
}
