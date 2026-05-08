<template>
  <view
    ref="readerRootRef"
    class="page-reader"
    :class="{ dragging, 'is-night': theme === 'NIGHT' }"
    :style="rootStyle"
    @tap="onTap"
    @touchstart="onTouchStart"
    @touchmove.stop.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
    @contextmenu.prevent.stop="onCanvasContextMenu"
  >
    <view ref="canvasHostRef" class="reader-canvas-host" />
    <view class="reader-footer">
      <text>{{ currentPage + 1 }} / {{ totalPages || 1 }}</text>
      <text>{{ progressText }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { readerThemes } from '../../../utils/reader'

const props = defineProps({
  chapter: { type: Object, default: null },
  content: { type: String, default: '' },
  title: { type: String, default: '' },
  prevContent: { type: String, default: '' },
  nextContent: { type: String, default: '' },
  fontSize: { type: Number, default: 16 },
  lineHeight: { type: Number, default: 30 },
  marginX: { type: Number, default: 22 },
  marginY: { type: Number, default: 28 },
  paragraphSpacing: { type: Number, default: 0 },
  theme: { type: String, default: 'DEFAULT' },
  turnMode: { type: String, default: 'PAGE' },
  brightness: { type: Number, default: 80 },
  initialPage: { type: Number, default: 0 },
  comments: { type: Array, default: () => [] },
  toolsVisible: { type: Boolean, default: true }
})

const emit = defineEmits(['prev', 'next', 'chapterEnd', 'pageChange', 'toggleTools', 'paragraphSelect', 'commentBubbleTap'])

const fontFamily = "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', 'STSong', serif"
const readerRootRef = ref(null)
const canvasHostRef = ref(null)
const viewWidth = ref(375)
const viewHeight = ref(667)
const rootLeft = ref(0)
const rootTop = ref(0)
let ctx = null
let canvasEl = null
let repaginateTimer = null
let resizeRaf = null

const pages = ref([])
const prevPages = ref([])
const nextPages = ref([])
const currentPage = ref(0)
const flipDirection = ref(1)
const flipProgress = ref(0)
const flipActive = ref(false)
const dragging = ref(false)
const committing = ref(false)
const dragStartX = ref(0)
const dragDeltaX = ref(0)
let suppressTapUntil = 0
let suppressMenuUntil = 0
let velocitySamples = []
let dragLockedDir = 0
let longPressTimer = null
let longPressStart = null
let animState = null

const totalPages = computed(() => pages.value.length)
const themeColors = computed(() => readerThemes[props.theme] || readerThemes.DEFAULT)
const effectiveContent = computed(() => props.chapter?.content || props.content || '')
const effectiveTitle = computed(() => props.chapter?.title || props.title || '')
const titleText = computed(() => effectiveTitle.value || pages.value[currentPage.value]?.title || '')
const effectiveFontSize = computed(() => Math.max(14, Math.min(24, Number(props.fontSize) || 16)))
const effectiveLineHeight = computed(() => {
  const minLineHeight = Math.round(effectiveFontSize.value * 1.55)
  return Math.max(minLineHeight, Math.min(42, Number(props.lineHeight) || minLineHeight))
})
const readerTopPadding = 62
const titleFontSize = 24
const titleLineHeight = 34
const titleBottomGap = 24
const chromeBottomInset = 114
const titleY = computed(() => readerTopPadding)
const contentTop = computed(() => titleY.value + titleLineHeight + titleBottomGap)
const contentBottom = computed(() => props.toolsVisible ? chromeBottomInset + 14 : 44)
const progressText = computed(() => {
  if (!totalPages.value) return '0%'
  return `${Math.round(((currentPage.value + 1) / totalPages.value) * 100)}%`
})
const currentPageData = computed(() => pages.value[currentPage.value] || null)
const targetPageIndex = computed(() => currentPage.value + flipDirection.value)
const isBoundaryFlip = computed(() =>
  (flipDirection.value > 0 && currentPage.value >= totalPages.value - 1) ||
  (flipDirection.value < 0 && currentPage.value <= 0)
)
const boundaryTargetPage = computed(() => {
  if (!isBoundaryFlip.value) return null
  if (flipDirection.value > 0) return nextPages.value[0] || null
  return prevPages.value[prevPages.value.length - 1] || null
})
const targetPageData = computed(() => pages.value[targetPageIndex.value] || boundaryTargetPage.value || null)
const rootStyle = computed(() => ({
  backgroundColor: themeColors.value.background,
  color: themeColors.value.text,
  filter: `brightness(${props.brightness / 100})`,
  '--reader-bg': themeColors.value.background,
  '--reader-text': themeColors.value.text
}))

function normalizeContent(content) {
  return String(content || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '    ')
    .trim()
}

function buildPages(sourceContent, sourceTitle) {
  const content = normalizeContent(sourceContent)
  if (!content) return []
  const sourceLines = content.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  const inferredTitle = sourceTitle ? '' : (sourceLines[0] || '')
  const bodyLines = sourceTitle ? sourceLines : sourceLines.slice(1)
  const paragraphs = (bodyLines.length ? bodyLines : sourceLines).filter(Boolean)
  const pageList = []
  let pageLines = []
  let usedHeight = 0
  const maxLineWidth = Math.max(40, viewWidth.value - props.marginX * 2)
  const maxPageHeight = Math.max(effectiveLineHeight.value, viewHeight.value - contentTop.value - contentBottom.value)
  const paragraphGap = Math.max(0, Number(props.paragraphSpacing || 0))

  function pushPage() {
    if (!pageLines.length) return
    pageList.push({
      index: pageList.length,
      title: pageList.length === 0 ? inferredTitle : '',
      lines: pageLines
    })
    pageLines = []
    usedHeight = 0
  }

  function pushLine(text, paragraphIndex) {
    const nextHeight = effectiveLineHeight.value + (pageLines.length ? paragraphGap : 0)
    if (pageLines.length && usedHeight + nextHeight > maxPageHeight) pushPage()
    pageLines.push({
      key: `${pageList.length}-${pageLines.length}-${text}`,
      text,
      paragraphIndex
    })
    usedHeight += nextHeight
  }

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const lines = wrapCanvasText(paragraph, maxLineWidth)
    lines.forEach((line) => pushLine(line, paragraphIndex))
  })

  pushPage()
  if (!pageList.length) {
    return [{ index: 0, title: inferredTitle, lines: [{ key: '0-0-empty', text: '（本章无内容）', paragraphIndex: 0 }] }]
  }
  return pageList
}

function wrapCanvasText(text, maxWidth) {
  const chars = [...String(text || '')]
  const lines = []
  let line = ''
  ensureMeasureFont()
  for (const ch of chars) {
    const next = line + ch
    if (line && measureCanvasText(next) > maxWidth) {
      lines.push(line)
      line = ch
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

function ensureMeasureFont() {
  if (!ctx) setupCanvas()
  if (ctx) ctx.font = canvasTextFont()
}

function canvasTextFont(weight = 400, scale = 1) {
  return `${weight} ${Math.round(effectiveFontSize.value * scale)}px ${fontFamily}`
}

function canvasTitleFont() {
  return `700 ${titleFontSize}px ${fontFamily}`
}

function measureCanvasText(text) {
  if (ctx) return ctx.measureText(text).width
  let width = 0
  for (const ch of String(text || '')) {
    width += /[一-鿿　-〿＀-￯]/.test(ch) ? effectiveFontSize.value : effectiveFontSize.value * 0.58
  }
  return width
}

function getCanvasElement() {
  // #ifdef H5
  if (typeof document !== 'undefined') {
    const host = canvasHostRef.value?.$el || canvasHostRef.value
    if (!host) return null
    if (!canvasEl) {
      canvasEl = document.createElement('canvas')
      canvasEl.className = 'reader-canvas'
      canvasEl.setAttribute('aria-hidden', 'true')
      host.innerHTML = ''
      host.appendChild(canvasEl)
    }
    return canvasEl
  }
  // #endif
  return null
}

function updateSize() {
  // #ifdef H5
  if (typeof window !== 'undefined') {
    const root = readerRootRef.value?.$el || readerRootRef.value
    const rect = root?.getBoundingClientRect?.()
    if (rect?.width && rect?.height) {
      viewWidth.value = Math.floor(rect.width)
      viewHeight.value = Math.floor(rect.height)
      rootLeft.value = rect.left || 0
      rootTop.value = rect.top || 0
      setupCanvas()
      return
    }
  }
  // #endif
  const sys = uni.getSystemInfoSync()
  viewWidth.value = sys.windowWidth || 375
  viewHeight.value = sys.windowHeight || 667
}

function setupCanvas() {
  // #ifdef H5
  const canvas = getCanvasElement()
  if (!canvas?.getContext) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const width = Math.max(1, Math.floor(viewWidth.value))
  const height = Math.max(1, Math.floor(viewHeight.value))
  const pw = Math.floor(width * dpr)
  const ph = Math.floor(height * dpr)
  if (canvas.width !== pw) canvas.width = pw
  if (canvas.height !== ph) canvas.height = ph
  canvas.style.setProperty('width', `${width}px`, 'important')
  canvas.style.setProperty('height', `${height}px`, 'important')
  canvas.style.setProperty('display', 'block', 'important')
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  // #endif
}

function paginate() {
  updateSize()
  pages.value = buildPages(effectiveContent.value, effectiveTitle.value)
  prevPages.value = buildPages(props.prevContent, '')
  nextPages.value = buildPages(props.nextContent, '')
  const nextPage = Math.max(0, Math.min(Number(props.initialPage || 0), pages.value.length - 1))
  currentPage.value = nextPage
  emit('pageChange', nextPage)
  drawReader()
}

function schedulePaginate() {
  if (repaginateTimer) { clearTimeout(repaginateTimer); repaginateTimer = null }
  paginate()
  nextTick(() => {
    paginate()
    repaginateTimer = setTimeout(paginate, 120)
  })
}

function clearCanvas() {
  if (!ctx) return
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, viewWidth.value, viewHeight.value)
  ctx.fillStyle = themeColors.value.background
  ctx.fillRect(0, 0, viewWidth.value, viewHeight.value)
  ctx.restore()
}

function drawPage(page, offsetX = 0, shadow = false) {
  if (!ctx || !page) return
  const width = viewWidth.value
  const height = viewHeight.value
  const x = Math.round(offsetX)
  ctx.save()
  ctx.translate(x, 0)
  ctx.fillStyle = themeColors.value.background
  ctx.fillRect(0, 0, width, height)
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.22)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetX = flipDirection.value > 0 ? -8 : 8
    ctx.fillRect(0, 0, width, height)
    ctx.shadowColor = 'transparent'
  }

  ctx.fillStyle = themeColors.value.text
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.font = canvasTitleFont()
  const title = titleText.value || page.title || ''
  if (title) {
    ctx.fillText(title, props.marginX, titleY.value)
  }

  ctx.font = canvasTextFont()
  const lineHeight = effectiveLineHeight.value
  const maxY = height - contentBottom.value
  let y = contentTop.value
  for (const line of page.lines || []) {
    if (y + lineHeight > maxY) break
    ctx.fillText(line.text || ' ', props.marginX, y)
    const count = commentCount(line.paragraphIndex)
    if (count) drawCommentBadge(count, props.marginX + Math.min(width - props.marginX * 2 - 28, ctx.measureText(line.text || '').width + 8), y + 2)
    y += lineHeight + Number(props.paragraphSpacing || 0)
  }
  ctx.restore()
}

function drawCommentBadge(count, x, y) {
  const text = String(count)
  const badgeW = Math.max(20, 12 + text.length * 6)
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  roundedRect(ctx, x, y, badgeW, 18, 9)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#8C7B62'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + badgeW / 2, y + 9)
  ctx.restore()
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.lineTo(x + width - r, y)
  context.quadraticCurveTo(x + width, y, x + width, y + r)
  context.lineTo(x + width, y + height - r)
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  context.lineTo(x + r, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - r)
  context.lineTo(x, y + r)
  context.quadraticCurveTo(x, y, x + r, y)
  context.closePath()
}

function drawReader() {
  if (!ctx) {
    setupCanvas()
    if (!ctx) return
  }
  clearCanvas()
  if (!flipActive.value) {
    drawPage(currentPageData.value, 0, false)
    return
  }

  const width = viewWidth.value
  const progress = Math.max(0, Math.min(1, flipProgress.value))
  const dir = flipDirection.value
  const current = currentPageData.value
  const target = targetPageData.value || current
  drawPage(current, 0, false)
  const offset = dir > 0 ? (1 - progress) * width : -(1 - progress) * width
  drawPage(target, offset, true)
}

function cancelAnim() {
  if (animState?.timeoutId) clearTimeout(animState.timeoutId)
  if (animState?.rafId) cancelAnimationFrame(animState.rafId)
  animState = null
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function animateTo(from, to, duration, easing, onDone) {
  cancelAnim()
  const state = { from, to, duration, easing, startTime: performance.now(), rafId: null, timeoutId: null, onDone }
  animState = state

  function complete() {
    if (animState !== state) return
    if (state.timeoutId) clearTimeout(state.timeoutId)
    if (state.rafId) cancelAnimationFrame(state.rafId)
    flipProgress.value = state.to
    drawReader()
    animState = null
    state.onDone?.()
  }

  function tick(now) {
    if (animState !== state) return
    const elapsed = now - state.startTime
    const t = Math.min(1, elapsed / state.duration)
    flipProgress.value = state.from + (state.to - state.from) * state.easing(t)
    drawReader()
    if (t < 1) state.rafId = requestAnimationFrame(tick)
    else complete()
  }

  state.timeoutId = setTimeout(complete, duration + 160)
  state.rafId = requestAnimationFrame(tick)
}

function beginFlip(direction, progress) {
  if (committing.value) return false
  if (direction > 0 && currentPage.value >= totalPages.value - 1 && !nextPages.value.length) return false
  if (direction < 0 && currentPage.value <= 0 && !prevPages.value.length) return false
  cancelAnim()
  flipDirection.value = direction
  flipProgress.value = progress
  flipActive.value = props.turnMode !== 'NONE'
  drawReader()
  return true
}

function finishFlip() {
  flipProgress.value = 0
  flipActive.value = false
  committing.value = false
  drawReader()
}

function applyPageChange() {
  const next = currentPage.value + flipDirection.value
  currentPage.value = Math.max(0, Math.min(next, totalPages.value - 1))
  emit('pageChange', currentPage.value)
  if (currentPage.value >= totalPages.value - 1) emit('chapterEnd')
}

function settleFlip(shouldCommit) {
  if (props.turnMode === 'NONE') {
    if (shouldCommit) applyPageChange()
    finishFlip()
    return
  }
  if (!shouldCommit) {
    committing.value = true
    animateTo(flipProgress.value, 0, 170, easeInOutCubic, finishFlip)
    return
  }
  committing.value = true
  animateTo(flipProgress.value, 1, 220, easeOutCubic, () => {
    if (isBoundaryFlip.value) {
      const dir = flipDirection.value
      finishFlip()
      if (dir > 0) emit('next')
      else emit('prev')
      return
    }
    applyPageChange()
    finishFlip()
  })
}

function flipBy(direction) {
  if (direction > 0 && currentPage.value >= totalPages.value - 1 && !nextPages.value.length) {
    emit('next')
    return
  }
  if (direction < 0 && currentPage.value <= 0 && !prevPages.value.length) {
    emit('prev')
    return
  }
  if (props.turnMode === 'NONE') {
    if (direction > 0 && currentPage.value >= totalPages.value - 1) { emit('next'); return }
    if (direction < 0 && currentPage.value <= 0) { emit('prev'); return }
    currentPage.value += direction
    emit('pageChange', currentPage.value)
    drawReader()
    return
  }
  if (beginFlip(direction, 0.02)) {
    animateTo(0.02, 1, 220, easeOutCubic, () => {
      if (isBoundaryFlip.value) {
        const dir = flipDirection.value
        finishFlip()
        if (dir > 0) emit('next')
        else emit('prev')
        return
      }
      applyPageChange()
      finishFlip()
    })
  }
}

function startDrag(clientX) {
  if (committing.value) return
  cancelAnim()
  dragging.value = true
  dragStartX.value = clientX
  dragDeltaX.value = 0
  dragLockedDir = 0
  velocitySamples = [{ x: clientX, t: performance.now() }]
}

function moveDrag(clientX) {
  if (!dragging.value || committing.value) return
  const now = performance.now()
  dragDeltaX.value = clientX - dragStartX.value
  if (Math.abs(dragDeltaX.value) > 8) {
    clearLongPressTimer()
    suppressMenuUntil = Date.now() + 700
  }
  if (!flipActive.value) {
    const absDx = Math.abs(dragDeltaX.value)
    if (absDx < 3) return
    dragLockedDir = dragDeltaX.value < 0 ? 1 : -1
    if (!beginFlip(dragLockedDir, 0.01)) {
      dragLockedDir = 0
      return
    }
  }
  const dx = dragDeltaX.value
  const inLockedDir = dragLockedDir > 0 ? -dx : dx
  flipProgress.value = Math.min(0.98, Math.max(0, inLockedDir) / Math.max(1, viewWidth.value * 0.72))
  drawReader()
  velocitySamples.push({ x: clientX, t: now })
  while (velocitySamples.length > 1 && now - velocitySamples[0].t > 100) velocitySamples.shift()
}

function endDrag() {
  if (!dragging.value) return
  clearLongPressTimer()
  const distance = Math.abs(dragDeltaX.value)
  if (distance > 8) suppressTapUntil = Date.now() + 320
  dragging.value = false
  let velocity = 0
  if (velocitySamples.length > 1) {
    const first = velocitySamples[0]
    const last = velocitySamples[velocitySamples.length - 1]
    const dt = last.t - first.t
    if (dt > 0) velocity = (last.x - first.x) / dt
  }
  velocitySamples = []
  const velocityInFlipDir = velocity * (dragLockedDir > 0 ? -1 : 1)
  const shouldCommit = distance > Math.max(34, viewWidth.value * 0.1) || velocityInFlipDir > 0.32
  dragLockedDir = 0
  dragDeltaX.value = 0
  if (flipActive.value) settleFlip(shouldCommit)
}

function handlePointTap(clientX) {
  const localX = Math.max(0, Math.min(viewWidth.value, clientX - rootLeft.value))
  const ratio = localX / viewWidth.value
  if (ratio < 0.28) flipBy(-1)
  else if (ratio > 0.72) flipBy(1)
  else emit('toggleTools')
}

function onTap(event) {
  if (Date.now() < suppressTapUntil) return
  if (dragging.value || committing.value) return
  const x = event?.detail?.x ?? event?.changedTouches?.[0]?.clientX ?? viewWidth.value / 2
  handlePointTap(x)
}

function onTouchStart(event) {
  const touch = event.touches?.[0]
  if (touch) {
    startDrag(touch.clientX)
    scheduleLongPress(touch.clientX, touch.clientY)
  }
}

function onTouchMove(event) {
  const touch = event.touches?.[0]
  if (!touch) return
  if (longPressStart && Math.abs(touch.clientY - longPressStart.y) > 8) {
    clearLongPressTimer()
    suppressMenuUntil = Date.now() + 700
  }
  moveDrag(touch.clientX)
}

function onTouchEnd() {
  clearLongPressTimer()
  endDrag()
}

function onMouseDown(event) { startDrag(event.clientX) }
function onMouseMove(event) { moveDrag(event.clientX) }
function onMouseUp(event) {
  const distance = Math.abs(dragDeltaX.value)
  const wasDragging = dragging.value
  endDrag()
  if (wasDragging && distance <= 8 && Date.now() >= suppressTapUntil && !committing.value) {
    handlePointTap(event.clientX)
    suppressTapUntil = Date.now() + 140
  }
}
function onMouseLeave() { endDrag() }

function clearLongPressTimer() {
  if (longPressTimer) clearTimeout(longPressTimer)
  longPressTimer = null
  longPressStart = null
}

function lineAtPoint(x, y) {
  const localY = y - rootTop.value
  const index = Math.floor((localY - contentTop.value) / Math.max(1, effectiveLineHeight.value + Number(props.paragraphSpacing || 0)))
  return currentPageData.value?.lines?.[index] || null
}

function scheduleLongPress(clientX, clientY) {
  clearLongPressTimer()
  longPressStart = { x: clientX, y: clientY }
  longPressTimer = setTimeout(() => {
    const start = longPressStart
    clearLongPressTimer()
    if (!start || committing.value || flipActive.value || Math.abs(dragDeltaX.value) > 8) return
    const line = lineAtPoint(start.x, start.y)
    if (line?.text) emitParagraphSelect(line, start.x, start.y)
  }, 540)
}

function onCanvasContextMenu(event) {
  const point = getEventPoint(event)
  const line = lineAtPoint(point.x, point.y)
  if (line?.text) emitParagraphSelect(line, point.x, point.y)
}

function getEventPoint(event) {
  const source = event?.touches?.[0] || event?.changedTouches?.[0] || event?.detail || event || {}
  const x = Number(source.clientX ?? source.x ?? source.pageX ?? viewWidth.value / 2)
  const y = Number(source.clientY ?? source.y ?? source.pageY ?? contentTop.value)
  return {
    x: Number.isFinite(x) ? x : viewWidth.value / 2,
    y: Number.isFinite(y) ? y : contentTop.value
  }
}

function emitParagraphSelect(line, x, y) {
  if (Date.now() < suppressMenuUntil || flipActive.value || committing.value) return
  suppressTapUntil = Date.now() + 420
  dragging.value = false
  dragDeltaX.value = 0
  emit('paragraphSelect', {
    text: line.text,
    index: line.paragraphIndex,
    x,
    y,
    toolbarY: y
  })
}

function commentCount(paragraphIndex) {
  if (paragraphIndex == null) return 0
  return props.comments.filter((item) => Number(item.paragraphIndex) === Number(paragraphIndex)).length
}

function goToPage(idx) {
  const next = Math.max(0, Math.min(Number(idx || 0), totalPages.value - 1))
  currentPage.value = next
  emit('pageChange', next)
  drawReader()
}

watch(
  () => [props.chapter?.id, props.chapter?.content, props.chapter?.title, props.content, props.title, props.fontSize, props.lineHeight, props.marginX, props.marginY, props.paragraphSpacing, props.prevContent, props.nextContent, props.theme, props.toolsVisible],
  schedulePaginate,
  { immediate: true }
)

watch(() => props.initialPage, (val) => {
  if (!totalPages.value) return
  goToPage(Number(val || 0))
})

watch(() => [currentPage.value, flipActive.value, flipProgress.value, props.brightness], () => {
  nextTick(drawReader)
})

onMounted(() => {
  schedulePaginate()
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize)
  }
  // #endif
})

function onResize() {
  if (resizeRaf) cancelAnimationFrame(resizeRaf)
  resizeRaf = requestAnimationFrame(schedulePaginate)
}

onBeforeUnmount(() => {
  cancelAnim()
  clearLongPressTimer()
  if (repaginateTimer) clearTimeout(repaginateTimer)
  if (resizeRaf) cancelAnimationFrame(resizeRaf)
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onResize)
  }
  // #endif
})

defineExpose({
  goToPage,
  currentPage,
  totalPages,
  goToLastPage() {
    goToPage(Math.max(0, totalPages.value - 1))
  },
  doFlip(dir) {
    flipBy(dir > 0 ? 1 : -1)
  }
})
</script>

<style scoped>
.page-reader {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  user-select: none;
  touch-action: none;
  -webkit-user-select: none;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  background: var(--reader-bg);
}

.reader-canvas-host {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

:deep(.reader-canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

.reader-footer {
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: calc(14px + env(safe-area-inset-bottom));
  z-index: 4;
  display: flex;
  justify-content: space-between;
  color: rgba(90, 90, 90, 0.72);
  font-size: 11px;
  pointer-events: none;
}

.is-night .reader-footer {
  color: rgba(216, 209, 199, 0.58);
}
</style>
