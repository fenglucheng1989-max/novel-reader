/**
 * ParagraphParser — 段落解析器
 *
 * 职责：
 * 1. 原始文本 → 标准化段落数组
 * 2. 标题行启发式检测
 * 3. 空段落处理（保留有限个空行）
 * 4. 特殊内容标记（图片、分隔线等）
 * 5. 提供段落元信息
 */

import type { ParagraphMeta } from '../../types/reader'

/* ===================== 段落类型 ===================== */

export type ParagraphType = 'text' | 'title' | 'blank' | 'separator' | 'image'

/** 解析后的段落 */
export interface ParsedParagraph {
  type: ParagraphType
  text: string
  originalIndex: number
  chars: string[]
  isTitle: boolean
  /** 段落字符偏移（intra-paragraph lines） */
  charOffset: number
  charLength: number
}

/** 段落解析结果 */
export interface ParseResult {
  paragraphs: ParsedParagraph[]
  stats: {
    totalParagraphs: number
    textParagraphs: number
    titleParagraphs: number
    blankParagraphs: number
    totalChars: number
  }
}

/* ===================== 常量 ===================== */

/** 最大连续空段落数 */
const MAX_CONSECUTIVE_BLANKS = 3

/** 标题行最大字符数 */
const TITLE_MAX_CHARS = 30

/** 句末标点集合 */
const SENTENCE_ENDERS = new Set([
  '。', '！', '？', '」', '』', '）', '】', '"', '"', "'", "'",
  '！', '？', '…', '—',
])

/** 分隔线模式 */
const SEPARATOR_PATTERN = /^[-=*_]{5,}$/

/** 图片标记模式 */
const IMAGE_PATTERN = /^\[img\](.+?)\[\/img\]$/

/* ===================== 工具函数 ===================== */

function isSentenceEnder(ch: string): boolean {
  return SENTENCE_ENDERS.has(ch)
}

/** 可见字符数（排除空白） */
function visibleCharCount(text: string): number {
  return text.replace(/\s/g, '').length
}

/** 启发式判断是否为标题行 */
function detectTitle(text: string): boolean {
  const visible = visibleCharCount(text)
  if (visible <= 0) return false
  if (visible > TITLE_MAX_CHARS) return false
  if (text.length > 0 && isSentenceEnder(text[text.length - 1])) return false
  // 纯数字一般不是标题
  if (/^\d+$/.test(text.trim())) return false
  return true
}

/* ===================== 主处理 ===================== */

/**
 * 解析章节内容为结构化的段落数组
 */
export function parseContent(content: string): ParseResult {
  // 1. 统一换行符
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '    ')
    // 合并过多空行
    .replace(/\n{4,}/g, '\n\n\n')

  // 2. 分割行
  const rawLines = normalized.split('\n')

  const paragraphs: ParsedParagraph[] = []
  let consecutiveBlanks = 0
  let textParagraphCount = 0
  let titleParagraphCount = 0
  let blankParagraphCount = 0
  let totalChars = 0

  for (let i = 0; i < rawLines.length; i++) {
    const text = rawLines[i].trim()

    // 空行处理
    if (text.length === 0) {
      consecutiveBlanks++
      if (consecutiveBlanks <= MAX_CONSECUTIVE_BLANKS) {
        paragraphs.push({
          type: 'blank',
          text: '',
          originalIndex: i,
          chars: [],
          isTitle: false,
          charOffset: totalChars,
          charLength: 0,
        })
        blankParagraphCount++
      }
      continue
    }
    consecutiveBlanks = 0

    // 检测图片
    const imgMatch = text.match(IMAGE_PATTERN)
    if (imgMatch) {
      paragraphs.push({
        type: 'image',
        text: imgMatch[1],
        originalIndex: i,
        chars: [],
        isTitle: false,
        charOffset: totalChars,
        charLength: 0,
      })
      continue
    }

    // 检测分隔线
    if (SEPARATOR_PATTERN.test(text)) {
      paragraphs.push({
        type: 'separator',
        text: '———',
        originalIndex: i,
        chars: [],
        isTitle: false,
        charOffset: totalChars,
        charLength: 0,
      })
      continue
    }

    // 文本段落
    const isTitle = detectTitle(text)
    const chars = [...text]
    const paraType: ParagraphType = isTitle ? 'title' : 'text'

    paragraphs.push({
      type: paraType,
      text,
      originalIndex: i,
      chars,
      isTitle,
      charOffset: totalChars,
      charLength: chars.length,
    })

    totalChars += chars.length
    textParagraphCount++

    if (isTitle) titleParagraphCount++
  }

  return {
    paragraphs,
    stats: {
      totalParagraphs: paragraphs.length,
      textParagraphs: textParagraphCount,
      titleParagraphs: titleParagraphCount,
      blankParagraphs: blankParagraphCount,
      totalChars,
    },
  }
}

/**
 * 从段落数组构建 ParagraphMeta 映射
 * 用于 PageBuilder 注入 data 属性
 */
export function buildParagraphMetaMap(
  paragraphs: ParsedParagraph[],
  commentCounts: Record<number, number> = {},
): Record<number, ParagraphMeta> {
  const metaMap: Record<number, ParagraphMeta> = {}

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    if (para.type === 'blank' || para.type === 'separator') continue

    metaMap[i] = {
      index: i,
      text: para.text,
      commentCount: commentCounts[i] || 0,
      highlights: [],
    }
  }

  return metaMap
}
