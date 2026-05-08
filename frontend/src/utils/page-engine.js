/**
 * Text pagination utility — pure JS, zero canvas.
 *
 * Splits chapter content into viewport-sized "pages" that can be
 * rendered as plain `<view>` / `<text>` DOM nodes.
 *
 * Measurement strategy:
 *   H5  – hidden DOM element + getBoundingClientRect (real CSS rendering)
 *   App – character-count estimation (CJK ≈ fontSize, ASCII ≈ fontSize * 0.55)
 */

let measureEl = null
let measureFontSize = 18
let measureFontFamily = ''

function ensureMeasureEl(fontSize, fontFamily) {
  measureFontSize = fontSize
  measureFontFamily = fontFamily
  // #ifdef H5
  if (typeof document === 'undefined') return null
  if (!measureEl) {
    measureEl = document.createElement('span')
    measureEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;visibility:hidden;white-space:nowrap;pointer-events:none;'
    document.body.appendChild(measureEl)
  }
  measureEl.style.fontSize = `${fontSize}px`
  measureEl.style.fontFamily = fontFamily || ''
  return measureEl
  // #endif
  // #ifndef H5
  return null
  // #endif
}

function measureText(el, text) {
  // #ifdef H5
  if (el) {
    el.textContent = text
    return el.getBoundingClientRect().width
  }
  // #endif
  // Non-H5: rough estimation
  let width = 0
  for (const ch of text) {
    width += /[一-鿿　-〿＀-￯]/.test(ch) ? measureFontSize : measureFontSize * 0.55
  }
  return width
}

/**
 * @param {string} content
 * @param {{ width:number, height:number, fontSize:number, lineHeight:number, paddingX:number, paddingY:number, paragraphSpacing?:number, fontFamily:string }} opts
 * @returns {{ lines: string[], paragraphIndexes: number[], index: number }[]}
 */
export function paginateText(content, { width, height, fontSize, lineHeight, paddingX, paddingY, paragraphSpacing = 0, fontFamily }) {
  const measureCtx = ensureMeasureEl(fontSize, fontFamily)
  const maxLineWidth = Math.max(fontSize, width - paddingX * 2)
  const maxPageHeight = Math.max(lineHeight, height - paddingY * 2)

  const paragraphs = content
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\n{3,}/g, '\n\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const pages = []
  let pageLines = []
  let paragraphIndexes = []
  let usedHeight = 0

  function pushPage() {
    if (!pageLines.length) return
    pages.push({ index: pages.length, lines: pageLines, paragraphIndexes })
    pageLines = []
    paragraphIndexes = []
    usedHeight = 0
  }

  function pushLine(line, paragraphIndex, extraHeight = 0) {
    const nextHeight = lineHeight + extraHeight
    if (pageLines.length && usedHeight + nextHeight > maxPageHeight) {
      pushPage()
    }
    pageLines.push(line)
    paragraphIndexes.push(paragraphIndex)
    usedHeight += nextHeight
  }

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const chars = [...paragraph]
    let charIdx = 0
    let firstLine = true

    while (charIdx < chars.length) {
      let line = ''
      while (charIdx < chars.length) {
        const next = line + chars[charIdx]
        if (line && measureText(measureCtx, next) > maxLineWidth) break
        line = next
        charIdx++
        if (measureText(measureCtx, line) >= maxLineWidth) break
      }
      pushLine(line, paragraphIndex, firstLine ? 0 : 0)
      firstLine = false
    }

    if (paragraphSpacing > 0 && paragraphIndex < paragraphs.length - 1) {
      usedHeight += paragraphSpacing
    }
  })

  pushPage()
  return pages
}

/** Clean up DOM measurement element (call on app teardown if needed). */
export function destroyMeasureEl() {
  // #ifdef H5
  if (measureEl && measureEl.parentNode) {
    measureEl.parentNode.removeChild(measureEl)
    measureEl = null
  }
  // #endif
}
