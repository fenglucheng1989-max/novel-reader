// #ifdef H5
const MEASURE_CANVAS = document.createElement('canvas')
const MEASURE_CTX = MEASURE_CANVAS.getContext('2d')
// #endif

function buildMeasureCtx(fontSize, fontFamily) {
  measureFontSize = fontSize
  // #ifdef H5
  MEASURE_CTX.font = `${fontSize}px ${fontFamily}`
  return MEASURE_CTX
  // #endif
  // #ifndef H5
  return null
  // #endif
}

let measureFontSize = 18

function measureText(ctx, text) {
  if (ctx) {
    return ctx.measureText(text).width
  }
  // Non-H5: rough estimation – Chinese ≈ fontSize * 1.0, ASCII ≈ fontSize * 0.55
  let width = 0
  for (const ch of text) {
    width += /[一-鿿　-〿＀-￯]/.test(ch) ? measureFontSize : measureFontSize * 0.55
  }
  return width
}

/**
 * Paginate chapter content into page-sized chunks.
 *
 * @param {string} content  – raw chapter text
 * @param {number} width    – canvas CSS width (logical px)
 * @param {number} height   – canvas CSS height (logical px)
 * @param {number} fontSize
 * @param {number} lineHeight
 * @param {number} paddingX
 * @param {number} paddingY
 * @param {string} fontFamily
 * @returns {{ lines: string[], index: number }[]}
 */
export function paginateText(content, { width, height, fontSize, lineHeight, paddingX, paddingY, fontFamily }) {
  const ctx = buildMeasureCtx(fontSize, fontFamily)
  const maxLineWidth = Math.max(fontSize, width - paddingX * 2)
  const maxLinesPerPage = Math.max(1, Math.floor((height - paddingY * 2) / lineHeight))

  const raw = content
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\n{3,}/g, '\n\n')

  const chars = [...raw]
  const pages = []
  let charIdx = 0

  while (charIdx < chars.length) {
    const pageLines = []

    for (let lineIdx = 0; lineIdx < maxLinesPerPage && charIdx < chars.length; lineIdx++) {
      // Handle newline
      if (chars[charIdx] === '\n') {
        pageLines.push('')
        charIdx++
        continue
      }

      let line = ''
      while (charIdx < chars.length && chars[charIdx] !== '\n') {
        const next = line + chars[charIdx]
        if (measureText(ctx, next) > maxLineWidth) break
        line = next
        charIdx++
      }
      if (line.length === 0 && charIdx < chars.length) {
        // Single character wider than line — force it in
        line = chars[charIdx]
        charIdx++
      }
      pageLines.push(line)
      // Consume newline after a filled line
      if (charIdx < chars.length && chars[charIdx] === '\n') {
        charIdx++
      }
    }

    // Skip trailing empty page (happens when content ends with newlines)
    if (pageLines.length === 0 || pageLines.every(l => l === '')) {
      break
    }

    pages.push({
      index: pages.length,
      lines: pageLines
    })
  }

  return pages
}
