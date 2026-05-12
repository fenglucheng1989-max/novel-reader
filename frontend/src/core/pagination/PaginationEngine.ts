/**
 * PaginationEngine — 像素精确分页引擎
 *
 * 职责：
 * 1. 接收原始文本 + 排版参数 → 输出 Page[]
 * 2. 字符级二分查找断行
 * 3. 中文禁则处理（行首/行尾避头尾）
 * 4. 标题行检测与独立布局
 * 5. 页面均衡（tail rebalance, fillRatio ≥ 90%）
 *
 * 零外部依赖，纯算法，可独立测试。
 * 测量函数通过 TextMeasureFunction 注入。
 */

import type {
  Page,
  Line,
  SplitResult,
  SplitOptions,
  SplitStats,
  TextMeasureFunction,
} from '../../types/reader'

/* ===================== 禁则字符集 ===================== */

/** 行首禁则（不可出现在行首） */
const LINE_START_BAN = new Set([
  '」', '』', '】', '〕', '》。', '、', '，', '；', '：', '！',
  '？', '）', '〉', '〙', '〗', '〟', "'", '"', '）', '】', ']',
  '}', '》', '』', '〕', '〕', 'ヽ', 'ー', 'ァ', 'ィ', 'ゥ',
  'ェ', 'ォ', 'ッ', 'ャ', 'ュ', 'ョ', 'ヮ', 'ッ', '・', '。',
  '、', '：', '；', '！', '？',
])

/** 行末禁则（不可出现在行末） */
const LINE_END_BAN = new Set([
  '（', '《', '〈', '【', '〔', '『', '「', '〖', '（', '[',
  '{', '（', '《', '〈', '【', '〔', '『', '「', '〖',
])

/** 标题行检测：短行且末尾无句末标点 */
const SENTENCE_END = new Set(['。', '！', '？', '」', '』', '）', '】', '"', "'"])

/* ===================== 工具 ===================== */

/** 判断字符是否为 CJK 或全角 */
function isCJK(ch: string): boolean {
  const code = ch.charCodeAt(0)
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3000 && code <= 0x303f) ||
    (code >= 0xff00 && code <= 0xffef)
  )
}

/** 统计可见字符数（排除空白行） */
function visibleChars(text: string): number {
  return text.replace(/\s/g, '').length
}

/* ===================== 内容预处理 ===================== */

interface ProcessedParagraph {
  chars: string[]
  originalIndex: number
  isTitle: boolean
}

function processContent(content: string): ProcessedParagraph[] {
  // 1. 统一换行符
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '    ')

  // 2. 分割段落
  const rawParagraphs = normalized.split('\n')

  // 3. 处理每个段落
  const result: ProcessedParagraph[] = []
  let emptyCount = 0

  for (let i = 0; i < rawParagraphs.length; i++) {
    const text = rawParagraphs[i].trim()

    if (text.length === 0) {
      emptyCount++
      if (emptyCount <= 3) {
        // 保留最多 3 个连续空行
        result.push({
          chars: [],
          originalIndex: i,
          isTitle: false,
        })
      }
      continue
    }
    emptyCount = 0

    // 标题检测：短行（<= 30 字）且不以句末标点结尾
    const isTitle =
      visibleChars(text) <= 30 &&
      text.length > 0 &&
      !SENTENCE_END.has(text[text.length - 1])

    result.push({
      chars: [...text],
      originalIndex: i,
      isTitle,
    })
  }

  return result
}

/* ===================== 禁则调整 ===================== */

/**
 * 检查断点是否违反禁则，如有冲突则调整
 * @returns 调整后的断点位置（-1 表示当前行已到段落结束）
 */
function adjustBreak(
  breakPos: number,
  chars: string[],
  lineStart: number,
): number {
  if (breakPos <= lineStart || breakPos >= chars.length) {
    return breakPos
  }

  const lastChar = chars[breakPos - 1]
  const firstChar = breakPos < chars.length ? chars[breakPos] : ''

  // 检查行末禁则
  if (lastChar && LINE_END_BAN.has(lastChar)) {
    // 将禁则字符移到下一行
    const adjusted = breakPos - 1
    if (adjusted > lineStart) return adjusted
  }

  // 检查行首禁则
  if (firstChar && LINE_START_BAN.has(firstChar)) {
    // 将禁则字符留在本行
    const adjusted = breakPos + 1
    if (adjusted < chars.length) return adjusted
  }

  return breakPos
}

/* ===================== 行构建 ===================== */

interface BreakLineResult {
  text: string
  charLength: number
}

/**
 * 二分查找断点，找到在 maxWidth 内能容纳的最多字符
 */
function breakLine(
  chars: string[],
  start: number,
  maxWidth: number,
  measureText: TextMeasureFunction,
  fontSize: number,
  fontFamily: string,
): BreakLineResult {
  if (start >= chars.length) {
    return { text: '', charLength: 0 }
  }

  let lo = start
  let hi = chars.length

  // 二分查找最长可容纳前缀
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1
    const candidate = chars.slice(start, mid).join('')
    const width = measureText(candidate, fontSize, fontFamily)

    if (width <= maxWidth) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  let breakPos = lo

  // 如果一行都没放下（一个字都放不下），至少放一个字
  if (breakPos <= start) {
    breakPos = start + 1
  }

  // 应用禁则调整
  breakPos = adjustBreak(breakPos, chars, start)

  // 验证调整后的宽度
  const text = chars.slice(start, breakPos).join('')
  const width = measureText(text, fontSize, fontFamily)

  // 如果调整后超出宽度，回退一个字符
  if (width > maxWidth && breakPos > start + 1) {
    breakPos = breakPos - 1
  }

  return {
    text: chars.slice(start, breakPos).join(''),
    charLength: breakPos - start,
  }
}

/* ===================== 页面组装 ===================== */

interface PageAccumulator {
  lines: Line[]
  usedHeight: number
  charStart: number
  charEnd: number
}

/**
 * 将段落中的行分配到各页
 */
function buildPages(
  paragraphs: ProcessedParagraph[],
  lines: Line[],
  options: SplitOptions,
): Page[] {
  const {
    viewHeight,
    fontSize,
    lineHeight,
    paddingTop,
    paddingBottom,
    headerHeight,
    footerHeight,
    paragraphSpacing,
    titleHeight,
  } = options

  const usableLineHeight = fontSize * lineHeight

  const availableHeight = viewHeight - paddingTop - paddingBottom - headerHeight - footerHeight

  const pages: Page[] = []
  let lineIdx = 0

  while (lineIdx < lines.length) {
    const isFirst = pages.length === 0
    const maxContentHeight = isFirst
      ? availableHeight - titleHeight
      : availableHeight

    let pageLines: Line[] = []
    let usedHeight = 0

    // 尽可能地填满一页
    while (lineIdx < lines.length) {
      const line = lines[lineIdx]
      const lineH =
        usableLineHeight + (line.isFirstInParagraph && paragraphSpacing > 0 ? paragraphSpacing : 0)

      if (pageLines.length > 0 && usedHeight + lineH > maxContentHeight) {
        break
      }

      pageLines.push(line)
      usedHeight += lineH
      lineIdx++
    }

    // 如果什么都没放下（极端情况），至少放一行
    if (pageLines.length === 0 && lineIdx < lines.length) {
      pageLines.push(lines[lineIdx])
      lineIdx++
    }

    const charStart = pageLines.length > 0 ? pageLines[0].charOffset : 0
    const charEnd =
      pageLines.length > 0
        ? pageLines[pageLines.length - 1].charOffset +
          pageLines[pageLines.length - 1].charLength
        : 0

    const fillRatio =
      maxContentHeight > 0
        ? Math.min(1, usedHeight / maxContentHeight)
        : 0

    const paraStart = pageLines.length > 0 ? pageLines[0].paragraphIndex : 0
    const paraEnd =
      pageLines.length > 0
        ? pageLines[pageLines.length - 1].paragraphIndex
        : 0

    pages.push({
      index: pages.length,
      lines: pageLines,
      html: '', // 由 PageBuilder 填充
      isFirst,
      fillRatio,
      paragraphRange: [paraStart, paraEnd],
      charRange: [charStart, charEnd],
    })
  }

  // 页面均衡：重新分配尾部页面使 fillRatio 均匀
  rebalancePages(pages, availableHeight, titleHeight, usableLineHeight, paragraphSpacing)

  return pages
}

/**
 * 将 Line[] 构建为分页结果
 */
function buildLines(
  paragraphs: ProcessedParagraph[],
  options: SplitOptions,
  measureText: TextMeasureFunction,
): Line[] {
  const { viewWidth, fontSize, fontFamily, paddingLeft, paddingRight, paragraphIndent } =
    options

  const maxLineWidth = viewWidth - paddingLeft - paddingRight
  // 首行缩进宽度（2em）
  const indentWidth = paragraphIndent ? fontSize * 2 : 0
  const effectiveWidth = maxLineWidth - indentWidth

  const lines: Line[] = []
  let charOffset = 0

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx]
    const chars = para.chars

    // 空段落 → 空行占位
    if (chars.length === 0) {
      lines.push({
        text: '',
        paragraphIndex: pIdx,
        isFirstInParagraph: true,
        indent: false,
        isTitle: false,
        charOffset,
        charLength: 0,
      })
      continue
    }

    let lineStart = 0
    let isFirstLine = true

    while (lineStart < chars.length) {
      const currentMaxWidth = isFirstLine ? effectiveWidth : maxLineWidth

      // 标题行：居中不需要缩进，但宽度限制一致
      const lineActualWidth = para.isTitle ? maxLineWidth : currentMaxWidth

      const result = breakLine(
        chars,
        lineStart,
        lineActualWidth,
        measureText,
        fontSize,
        fontFamily,
      )

      if (result.charLength === 0) break

      const lineText = result.text
      const indent = isFirstLine && paragraphIndent && !para.isTitle

      lines.push({
        text: lineText,
        paragraphIndex: pIdx,
        isFirstInParagraph: isFirstLine,
        indent,
        isTitle: para.isTitle,
        charOffset,
        charLength: result.charLength,
      })

      charOffset += result.charLength
      lineStart += result.charLength
      isFirstLine = false
    }
  }

  return lines
}

/* ===================== 页面均衡 ===================== */

function rebalancePages(
  pages: Page[],
  availableHeight: number,
  titleHeight: number,
  lineHeight: number,
  paragraphSpacing: number,
): void {
  let iterations = 0
  const MAX_ITERATIONS = 100

  while (pages.length >= 2 && iterations < MAX_ITERATIONS) {
    iterations++

    const lastIdx = pages.length - 1
    const prevIdx = pages.length - 2

    const lastFill = pages[lastIdx].fillRatio
    const prevMaxH =
      pages[prevIdx].isFirst
        ? availableHeight - titleHeight
        : availableHeight

    if (lastFill >= 0.99) break
    if (pages[prevIdx].fillRatio < 0.7) break

    const prevLines = pages[prevIdx].lines
    const lastLines = pages[lastIdx].lines

    const maxMove = Math.min(5, prevLines.length - 1)
    if (maxMove < 1) break

    let bestMove = 0
    let bestMinFill = lastFill

    for (let n = 1; n <= maxMove; n++) {
      const movedLines = prevLines.slice(prevLines.length - n)
      const firstMovedIsFirstInPara = movedLines[0]?.isFirstInParagraph ?? false
      const movedHeight = movedLines.reduce((h, line, i) => {
        const needSpacing = i > 0 && line.isFirstInParagraph
        const extraSpacing = needSpacing ? paragraphSpacing : 0
        const firstLineExtra = (i === 0 && firstMovedIsFirstInPara && lastLines.length > 0) ? paragraphSpacing : 0
        return h + lineHeight + extraSpacing + firstLineExtra
      }, 0)

      const newPrevHeight = prevLines.slice(0, prevLines.length - n).reduce(
        (h, line, i) => {
          const extra = i > 0 && line.isFirstInParagraph ? paragraphSpacing : 0
          return h + lineHeight + extra
        },
        0,
      )

      const newLastHeight = lastLines.reduce(
        (h, line, i) => h + lineHeight + (i > 0 && line.isFirstInParagraph ? paragraphSpacing : 0),
        0,
      ) + movedHeight

      const newPrevFill = newPrevHeight / prevMaxH
      const newLastFill = newLastHeight / availableHeight

      if (newPrevFill <= 1 && newLastFill <= 1) {
        const minFill = Math.min(newPrevFill, newLastFill)
        if (minFill > bestMinFill) {
          bestMinFill = minFill
          bestMove = n
        }
      }
    }

    // 没有可移动的行：终止循环，防止死循环
    if (bestMove === 0) break

    // 执行行移动
    const movedLines = prevLines.splice(prevLines.length - bestMove)

    // 更新上一页
    const newPrevLines = prevLines
    const newPrevHeight = newPrevLines.reduce(
      (h, line, i) =>
        h + lineHeight + (i > 0 && line.isFirstInParagraph ? paragraphSpacing : 0),
      0,
    )

    // 更新最后一页
    const newLastLines = [...movedLines, ...lastLines]
    const newLastHeight = newLastLines.reduce(
      (h, line, i) =>
        h + lineHeight + (i > 0 && line.isFirstInParagraph ? paragraphSpacing : 0),
      0,
    )

    const prevMaxH2 = pages[prevIdx].isFirst
      ? availableHeight - titleHeight
      : availableHeight

    pages[prevIdx].lines = newPrevLines
    pages[prevIdx].fillRatio = prevMaxH2 > 0 ? newPrevHeight / prevMaxH2 : 0

    pages[lastIdx].lines = newLastLines
    pages[lastIdx].fillRatio = availableHeight > 0 ? newLastHeight / availableHeight : 0

    // 更新 charRange
    updateCharRanges(pages[prevIdx])
    updateCharRanges(pages[lastIdx])
  }
}

function updateCharRanges(page: Page): void {
  if (page.lines.length === 0) {
    page.charRange = [0, 0]
    return
  }
  const first = page.lines[0]
  const last = page.lines[page.lines.length - 1]
  page.charRange = [first.charOffset, last.charOffset + last.charLength]
  page.paragraphRange = [first.paragraphIndex, last.paragraphIndex]
}

/* ===================== 主入口 ===================== */

/**
 * 执行分页
 *
 * @param content  原始章节内容
 * @param options  排版参数
 * @param measureText  文本测量函数（由 PlatformAdapter 提供）
 * @returns SplitResult
 */
export function splitContent(
  content: string,
  options: SplitOptions,
  measureText: TextMeasureFunction,
): SplitResult {
  const startTime = performance.now()

  // 校验关键参数
  if (options.viewWidth <= 0 || options.viewHeight <= 0) {
    console.error('[PaginationEngine] Invalid view dimensions:', options)
    const emptyPage: Page = {
      index: 0,
      lines: [],
      html: '<p style="text-align:center;color:#999;margin-top:40px">（加载中...）</p>',
      isFirst: true,
      fillRatio: 0,
      paragraphRange: [0, 0],
      charRange: [0, 0],
    }
    return {
      pages: [emptyPage],
      stats: {
        totalChars: 0,
        totalLines: 0,
        totalPages: 1,
        avgFillRatio: 0,
        maxFillVariance: 0,
        splitTimeMs: performance.now() - startTime,
      },
    }
  }

  // 1. 预处理
  const paragraphs = processContent(content)

  // 2. 计算总字符数
  const totalChars = paragraphs.reduce(
    (sum, p) => sum + p.chars.length,
    0,
  )

  if (totalChars === 0) {
    const emptyPage: Page = {
      index: 0,
      lines: [],
      html: '<p style="text-align:center;color:#999;margin-top:40px">（暂无内容）</p>',
      isFirst: true,
      fillRatio: 0,
      paragraphRange: [0, 0],
      charRange: [0, 0],
    }
    return {
      pages: [emptyPage],
      stats: {
        totalChars: 0,
        totalLines: 0,
        totalPages: 1,
        avgFillRatio: 0,
        maxFillVariance: 0,
        splitTimeMs: performance.now() - startTime,
      },
    }
  }

  // 3. 断行
  const lines = buildLines(paragraphs, options, measureText)

  // 4. 组装页面
  const pages = buildPages(paragraphs, lines, options)

  // 5. 统计
  const totalLines = lines.length
  const totalPages = pages.length
  const avgFillRatio =
    totalPages > 0
      ? pages.reduce((s, p) => s + p.fillRatio, 0) / totalPages
      : 0
  const fillRatios = pages.map((p) => p.fillRatio)
  const maxFillVariance =
    fillRatios.length > 1
      ? Math.max(...fillRatios) - Math.min(...fillRatios)
      : 0

  return {
    pages,
    stats: {
      totalChars,
      totalLines,
      totalPages,
      avgFillRatio,
      maxFillVariance,
      splitTimeMs: performance.now() - startTime,
    },
  }
}
