<template>
  <view
    class="page-reader"
    :style="hostStyle"
    @tap="onTap"
    @touchstart="onTouchStart"
    @touchmove.stop.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
  >
    <view ref="canvasHostRef" class="flip-canvas-host">
      <!-- #ifndef H5 -->
      <canvas
        id="readerFlipCanvas"
        canvas-id="readerFlipCanvas"
        class="flip-canvas"
        width="1"
        height="1"
      />
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { paginateText } from '../../utils/page-engine'
import { readerThemes } from '../../utils/reader'

const props = defineProps({
  content: { type: String, default: '' },
  prevContent: { type: String, default: '' },
  nextContent: { type: String, default: '' },
  fontSize: { type: Number, default: 18 },
  lineHeight: { type: Number, default: 32 },
  marginX: { type: Number, default: 22 },
  marginY: { type: Number, default: 28 },
  paragraphSpacing: { type: Number, default: 0 },
  theme: { type: String, default: 'DEFAULT' },
  brightness: { type: Number, default: 80 },
  initialPage: { type: Number, default: 0 },
  comments: { type: Array, default: () => [] }
})

const emit = defineEmits(['prev', 'next', 'chapterEnd', 'pageChange', 'toggleTools', 'paragraphSelect', 'commentBubbleTap'])

const fontFamily = "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', 'STSong', serif"
const canvasId = 'readerFlipCanvas'
const FLIP_DURATION = 260
const DRAG_START_PX = 3
const PAGE_COMMIT_RATIO = 0.06
const BOUNDARY_COMMIT_RATIO = 0.04
const BOUNDARY_DRAG_VISUAL_RATIO = 0.72

const viewWidth = ref(375)
const viewHeight = ref(667)
const canvasHostRef = ref(null)
const pages = ref([])
const currentPage = ref(0)
const flipProgress = ref(0)
const flipDirection = ref(0)
const animating = ref(false)
const selectedLineKey = ref(null)

let dragStartX = 0
let dragStartY = 0
let dragMoved = false
let dragCommitRatio = 0
let touchHandled = false
let mouseDragging = false
let animationFrame = 0
let resizeHandler = null
let h5Canvas = null
let longPressTimer = null
let longPressPoint = null
let longPressTriggered = false

function requestFrame(callback) {
  // #ifdef H5
  return window.requestAnimationFrame(callback)
  // #endif
  // #ifndef H5
  return setTimeout(callback, 16)
  // #endif
}

function cancelFrame(frameId) {
  // #ifdef H5
  window.cancelAnimationFrame(frameId)
  // #endif
  // #ifndef H5
  clearTimeout(frameId)
  // #endif
}

const themeObj = computed(() => readerThemes[props.theme] || readerThemes.DEFAULT)
const themeBg = computed(() => themeObj.value.background)
const themeText = computed(() => themeObj.value.text)
const paddingX = computed(() => Math.max(12, Math.min(48, Number(props.marginX || 22))))
const paddingY = computed(() => Math.max(16, Math.min(72, Number(props.marginY || 28))))
const paragraphGap = computed(() => Math.max(0, Math.min(24, Number(props.paragraphSpacing || 0))))
const effectiveLineHeight = computed(() => Number(props.lineHeight || 32) + Math.round(paragraphGap.value / 3))
const hostStyle = computed(() => ({
  backgroundColor: themeBg.value,
  color: themeText.value,
  filter: `brightness(${props.brightness / 100})`
}))
const totalPages = computed(() => pages.value.length)
const prevPages = computed(() => paginateContent(props.prevContent))
const nextPages = computed(() => paginateContent(props.nextContent))
const commentsByLineKey = computed(() => {
  const map = {}
  ;(props.comments || []).forEach((item) => {
    if (item?.paragraphIndex == null) return
    const key = String(item.paragraphIndex)
    map[key] = (map[key] || 0) + 1
  })
  return map
})
function getViewportSize() {
  // #ifdef H5
  const root = document.querySelector('.page-reader')
  const rect = root?.getBoundingClientRect()
  viewWidth.value = Math.max(1, Math.round(rect?.width || document.documentElement.clientWidth || window.innerWidth))
  viewHeight.value = Math.max(1, Math.round(rect?.height || window.innerHeight))
  // #endif
  // #ifndef H5
  const sys = uni.getSystemInfoSync()
  viewWidth.value = sys.windowWidth
  viewHeight.value = sys.windowHeight
  // #endif
}

function clampPage(page) {
  const max = Math.max(0, pages.value.length - 1)
  return Math.max(0, Math.min(Number(page || 0), max))
}

function paginateContent(content) {
  if (!viewWidth.value || !viewHeight.value || !content) return []
  return paginateText(content, {
    width: viewWidth.value,
    height: viewHeight.value,
    fontSize: props.fontSize,
    lineHeight: effectiveLineHeight.value,
    paddingX: paddingX.value,
    paddingY: paddingY.value,
    paragraphSpacing: paragraphGap.value,
    fontFamily
  })
}

function repaginate() {
  if (!viewWidth.value || !viewHeight.value || !props.content) {
    pages.value = []
    currentPage.value = 0
    draw()
    return
  }

  pages.value = paginateContent(props.content)
  currentPage.value = clampPage(props.initialPage)
  emit('pageChange', currentPage.value)
  draw()
}

function getTargetPage() {
  if (!flipDirection.value) return currentPage.value
  return clampPage(currentPage.value + flipDirection.value)
}

function hasTargetPage() {
  if (!flipDirection.value) return true
  const target = currentPage.value + flipDirection.value
  return target >= 0 && target < totalPages.value
}

function withCanvas(drawer) {
  // #ifdef H5
  const host = canvasHostRef.value?.$el || canvasHostRef.value || document.querySelector('.flip-canvas-host')
  if (!host) return
  if (!h5Canvas) {
    h5Canvas = document.createElement('canvas')
    h5Canvas.className = 'native-flip-canvas'
    host.appendChild(h5Canvas)
  }
  const canvas = h5Canvas
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const pixelWidth = Math.max(1, Math.floor(viewWidth.value * dpr))
  const pixelHeight = Math.max(1, Math.floor(viewHeight.value * dpr))
  canvas.style.position = 'absolute'
  canvas.style.inset = '0'
  canvas.style.display = 'block'
  canvas.style.width = `${viewWidth.value}px`
  canvas.style.height = `${viewHeight.value}px`
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawer(ctx, false)
  // #endif
  // #ifndef H5
  const ctx = uni.createCanvasContext(canvasId)
  drawer(ctx, true)
  ctx.draw()
  // #endif
}

function drawPageData(ctx, page, x, clipWidth) {
  const width = viewWidth.value
  const height = viewHeight.value

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, 0, clipWidth, height)
  ctx.clip()
  ctx.fillStyle = themeBg.value
  ctx.fillRect(x, 0, clipWidth, height)

  if (page) {
    ctx.fillStyle = themeText.value
    ctx.font = `${props.fontSize}px ${fontFamily}`
    ctx.textBaseline = 'top'
    page.lines.forEach((line, index) => {
      const lineKey = getLineKey(page.index, index)
      const y = paddingY.value + index * effectiveLineHeight.value
      if (selectedLineKey.value === lineKey) {
        ctx.fillStyle = props.theme === 'NIGHT' ? 'rgba(160,144,128,0.22)' : 'rgba(160,144,128,0.18)'
        ctx.fillRect(x + paddingX.value - 6, y - 2, width - paddingX.value * 2 + 12, effectiveLineHeight.value + 4)
        ctx.fillStyle = themeText.value
      }
      ctx.fillText(line || ' ', x + paddingX.value, y)
      const bubbleCount = commentsByLineKey.value[String(lineKey)]
      if (bubbleCount) {
        drawCommentBubble(ctx, x + width - paddingX.value + 2, y + 2, bubbleCount)
      }
    })
  }

  const edgeX = x + clipWidth
  ctx.fillStyle = props.theme === 'NIGHT' ? 'rgba(255,255,255,0.04)' : 'rgba(45,35,25,0.045)'
  ctx.fillRect(x + width - 1, 0, 1, height)
  if (clipWidth < width) {
    const gradient = ctx.createLinearGradient(edgeX - 36, 0, edgeX + 12, 0)
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, props.theme === 'NIGHT' ? 'rgba(0,0,0,0.34)' : 'rgba(70,45,20,0.24)')
    ctx.fillStyle = gradient
    ctx.fillRect(edgeX - 36, 0, 48, height)
  }
  ctx.restore()
}

function getLineKey(pageIndex, lineIndex) {
  return Number(pageIndex || 0) * 100 + Number(lineIndex || 0)
}

function drawCommentBubble(ctx, x, y, count) {
  const label = String(Math.min(99, count))
  ctx.save()
  ctx.strokeStyle = props.theme === 'NIGHT' ? 'rgba(180,180,175,0.55)' : 'rgba(140,140,135,0.5)'
  ctx.fillStyle = props.theme === 'NIGHT' ? 'rgba(28,28,25,0.82)' : 'rgba(248,248,246,0.88)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect?.(x, y, 34, 22, 10)
  if (!ctx.roundRect) {
    ctx.rect(x, y, 34, 22)
  }
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = props.theme === 'NIGHT' ? '#CCCBC5' : '#8C8C8C'
  ctx.font = `12px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + 17, y + 11)
  ctx.restore()
}

function drawPage(ctx, pageIndex, x, clipWidth) {
  drawPageData(ctx, pages.value[pageIndex], x, clipWidth)
}

function drawBlankPage(ctx) {
  ctx.fillStyle = themeBg.value
  ctx.fillRect(0, 0, viewWidth.value, viewHeight.value)
}

function drawBoundaryTargetPage(ctx, direction) {
  if (direction > 0 && nextPages.value.length) {
    drawPageData(ctx, nextPages.value[0], 0, viewWidth.value)
    return
  }
  if (direction < 0 && prevPages.value.length) {
    drawPageData(ctx, prevPages.value[prevPages.value.length - 1], 0, viewWidth.value)
    return
  }
  drawBlankPage(ctx)
}

function drawCurl(ctx, direction, progress) {
  if (!direction || progress <= 0.001) return
  const curlFadeStart = 0.82
  const curlAlpha = progress > curlFadeStart
    ? Math.max(0, 1 - (progress - curlFadeStart) / (1 - curlFadeStart))
    : 1
  if (curlAlpha <= 0.01) return
  const width = viewWidth.value
  const height = viewHeight.value
  const foldWidth = Math.max(24, width * 0.18 * progress)
  const foldX = direction > 0 ? width * (1 - progress) : width * progress
  const start = direction > 0 ? foldX : foldX - foldWidth
  const end = direction > 0 ? foldX + foldWidth : foldX
  const gradient = ctx.createLinearGradient(start, 0, end, 0)

  if (direction > 0) {
    gradient.addColorStop(0, `rgba(255,255,255,${0.18 * curlAlpha})`)
    gradient.addColorStop(0.42, props.theme === 'NIGHT' ? `rgba(70,70,70,${0.38 * curlAlpha})` : `rgba(255,251,242,${0.72 * curlAlpha})`)
    gradient.addColorStop(1, `rgba(0,0,0,${0.20 * curlAlpha})`)
  } else {
    gradient.addColorStop(0, `rgba(0,0,0,${0.20 * curlAlpha})`)
    gradient.addColorStop(0.58, props.theme === 'NIGHT' ? `rgba(70,70,70,${0.38 * curlAlpha})` : `rgba(255,251,242,${0.72 * curlAlpha})`)
    gradient.addColorStop(1, `rgba(255,255,255,${0.18 * curlAlpha})`)
  }

  ctx.save()
  ctx.globalAlpha = curlAlpha
  ctx.beginPath()
  ctx.moveTo(direction > 0 ? foldX : foldX - foldWidth, 0)
  ctx.quadraticCurveTo(foldX + direction * foldWidth * 0.45, height * 0.5, direction > 0 ? foldX : foldX - foldWidth, height)
  ctx.lineTo(direction > 0 ? foldX + foldWidth : foldX, height)
  ctx.lineTo(direction > 0 ? foldX + foldWidth : foldX, 0)
  ctx.closePath()
  ctx.clip()
  ctx.fillStyle = gradient
  ctx.fillRect(start, 0, foldWidth, height)
  ctx.restore()
}

function draw() {
  withCanvas((ctx) => {
    const width = viewWidth.value
    const height = viewHeight.value
    const progress = Math.max(0, Math.min(1, flipProgress.value))
    const direction = flipDirection.value

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = themeBg.value
    ctx.fillRect(0, 0, width, height)

    if (!pages.value.length) return

    if (!direction || progress <= 0.001) {
      drawPage(ctx, currentPage.value, 0, width)
      return
    }

    if (hasTargetPage()) {
      const targetPage = getTargetPage()
      drawPage(ctx, targetPage, 0, width)
    } else {
      drawBoundaryTargetPage(ctx, direction)
    }

    if (direction > 0) {
      drawPage(ctx, currentPage.value, 0, width * (1 - progress))
    } else {
      const visibleWidth = width * (1 - progress)
      drawPage(ctx, currentPage.value, width - visibleWidth, visibleWidth)
    }
    drawCurl(ctx, direction, progress)
  })
}

function animateTo(target, done) {
  cancelFrame(animationFrame)
  animating.value = true
  const start = flipProgress.value
  const startedAt = Date.now()

  function tick() {
    const elapsed = Date.now() - startedAt
    const t = Math.min(1, elapsed / FLIP_DURATION)
    const eased = 1 - Math.pow(1 - t, 3)
    flipProgress.value = start + (target - start) * eased
    draw()
    if (t < 1) {
      animationFrame = requestFrame(tick)
      return
    }
    animating.value = false
    done?.()
  }

  tick()
}

function commitFlip(targetPage) {
  animateTo(1, () => {
    currentPage.value = targetPage
    flipProgress.value = 0
    flipDirection.value = 0
    emit('pageChange', currentPage.value)
  })
}

function cancelFlip() {
  animateTo(0, () => {
    flipProgress.value = 0
    flipDirection.value = 0
    draw()
  })
}

function commitChapterFlip(direction) {
  flipDirection.value = direction
  animateTo(1, () => {
    flipProgress.value = 0
    flipDirection.value = 0
    if (direction > 0) emit('chapterEnd')
    else emit('prev')
  })
}

function doFlip(direction) {
  if (!pages.value.length || animating.value) return
  if (direction > 0 && currentPage.value >= totalPages.value - 1) {
    commitChapterFlip(direction)
    return
  }
  if (direction < 0 && currentPage.value <= 0) {
    commitChapterFlip(direction)
    return
  }

  flipDirection.value = direction
  flipProgress.value = 0
  commitFlip(currentPage.value + direction)
}

function resolveLocalX(e) {
  if (e.detail && typeof e.detail.x === 'number') return e.detail.x
  const touch = e.changedTouches?.[0] || e.touches?.[0]
  const clientX = touch ? touch.clientX : (typeof e.clientX === 'number' ? e.clientX : viewWidth.value / 2)
  // #ifdef H5
  const root = document.querySelector('.page-reader')
  const rect = root?.getBoundingClientRect()
  if (rect) {
    const localX = clientX - rect.left
    if (localX >= 0 && localX <= rect.width) return localX
  }
  // #endif
  return Math.max(0, Math.min(clientX, viewWidth.value))
}

function resolveLocalPoint(e) {
  const touch = e.changedTouches?.[0] || e.touches?.[0]
  const clientX = touch ? touch.clientX : (typeof e.clientX === 'number' ? e.clientX : viewWidth.value / 2)
  const clientY = touch ? touch.clientY : (typeof e.clientY === 'number' ? e.clientY : viewHeight.value / 2)
  // #ifdef H5
  const root = document.querySelector('.page-reader')
  const rect = root?.getBoundingClientRect()
  if (rect) return { x: clientX - rect.left, y: clientY - rect.top }
  // #endif
  return { x: clientX, y: clientY }
}

function findLineAt(point) {
  const page = pages.value[currentPage.value]
  if (!page) return null
  const lineIndex = Math.floor((point.y - paddingY.value) / effectiveLineHeight.value)
  if (lineIndex < 0 || lineIndex >= page.lines.length) return null
  const text = page.lines[lineIndex]
  if (!text || !text.trim()) return null
  const key = getLineKey(page.index, lineIndex)
  return {
    text: text.trim(),
    index: key,
    lineIndex,
    pageIndex: page.index,
    toolbarY: paddingY.value + (lineIndex + 1) * effectiveLineHeight.value + 52
  }
}

function clearLongPressTimer() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function startLongPress(e) {
  clearLongPressTimer()
  longPressPoint = resolveLocalPoint(e)
  longPressTriggered = false
  longPressTimer = setTimeout(() => {
    const target = findLineAt(longPressPoint)
    if (!target) return
    longPressTriggered = true
    selectedLineKey.value = target.index
    draw()
    emit('paragraphSelect', target)
  }, 520)
}

function handleTap(e) {
  const point = resolveLocalPoint(e)
  const current = pages.value[currentPage.value]
  if (current) {
    const lineIndex = Math.floor((point.y - paddingY.value) / effectiveLineHeight.value)
    const lineKey = getLineKey(current.index, lineIndex)
    if (commentsByLineKey.value[String(lineKey)] && point.x > viewWidth.value - paddingX.value - 8) {
      selectedLineKey.value = lineKey
      draw()
      emit('commentBubbleTap', { paragraphIndex: lineKey })
      return
    }
  }
  const localX = resolveLocalX(e)
  const centerLeft = viewWidth.value * 0.3
  const centerRight = viewWidth.value * 0.7
  if (localX > centerLeft && localX < centerRight) {
    emit('toggleTools')
    return
  }
  doFlip(localX >= centerRight ? 1 : -1)
}

function onTouchStart(e) {
  if (!pages.value.length || animating.value) return
  const touch = e.touches[0]
  dragStartX = touch.clientX
  dragStartY = touch.clientY
  dragMoved = false
  dragCommitRatio = 0
  touchHandled = false
  flipProgress.value = 0
  flipDirection.value = 0
  startLongPress(e)
}

function updateDrag(clientX, clientY) {
  if (!pages.value.length || animating.value) return
  const dx = clientX - dragStartX
  const dy = clientY - dragStartY
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  if (!dragMoved && absDx + absDy < DRAG_START_PX) return
  dragMoved = true
  clearLongPressTimer()
  if (absDx < absDy * 0.65) return

  const direction = dx < 0 ? 1 : -1
  const atBoundary = (direction > 0 && currentPage.value >= totalPages.value - 1) ||
    (direction < 0 && currentPage.value <= 0)
  dragCommitRatio = Math.min(1, absDx / viewWidth.value)
  flipDirection.value = direction
  flipProgress.value = dragCommitRatio * (atBoundary ? BOUNDARY_DRAG_VISUAL_RATIO : 1)
  draw()
}

function finishDrag(e) {
  clearLongPressTimer()
  if (longPressTriggered) {
    touchHandled = true
    return
  }
  if (!dragMoved) {
    touchHandled = true
    handleTap(e)
    return
  }

  const direction = flipDirection.value
  const atLastPage = direction > 0 && currentPage.value >= totalPages.value - 1
  const atFirstPage = direction < 0 && currentPage.value <= 0
  if (atLastPage || atFirstPage) {
    if (dragCommitRatio > BOUNDARY_COMMIT_RATIO) {
      commitChapterFlip(direction)
    } else {
      cancelFlip()
    }
    return
  }

  if (dragCommitRatio > PAGE_COMMIT_RATIO) {
    commitFlip(currentPage.value + direction)
  } else {
    cancelFlip()
  }
}

function onTouchMove(e) {
  const touch = e.touches?.[0]
  if (!touch) return
  updateDrag(touch.clientX, touch.clientY)
}

function onTouchEnd(e) {
  finishDrag(e)
}

function onMouseDown(e) {
  if (!pages.value.length || animating.value || e.button !== 0) return
  mouseDragging = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragMoved = false
  dragCommitRatio = 0
  touchHandled = false
  flipProgress.value = 0
  flipDirection.value = 0
  startLongPress(e)
}

function onMouseMove(e) {
  if (!mouseDragging) return
  clearLongPressTimer()
  updateDrag(e.clientX, e.clientY)
}

function onMouseUp(e) {
  clearLongPressTimer()
  if (!mouseDragging) return
  mouseDragging = false
  if (longPressTriggered) {
    touchHandled = true
    return
  }
  if (dragMoved) {
    touchHandled = true
    finishDrag(e)
  }
}

function onMouseLeave(e) {
  clearLongPressTimer()
  if (!mouseDragging) return
  mouseDragging = false
  if (dragMoved) {
    touchHandled = true
    finishDrag(e)
  }
}

function onTap(e) {
  clearLongPressTimer()
  if (longPressTriggered) return
  if (touchHandled) return
  if (dragMoved || animating.value) return
  handleTap(e)
}

function goToLastPage() {
  currentPage.value = Math.max(0, pages.value.length - 1)
  flipProgress.value = 0
  flipDirection.value = 0
  emit('pageChange', currentPage.value)
  draw()
}

defineExpose({ goToLastPage, doFlip, currentPage, totalPages })

watch(() => props.content, () => {
  currentPage.value = Number(props.initialPage || 0)
  repaginate()
})
watch(() => [props.prevContent, props.nextContent], draw)
watch(() => props.initialPage, (page) => {
  currentPage.value = clampPage(page)
  emit('pageChange', currentPage.value)
  draw()
})
watch(() => props.fontSize, repaginate)
watch(() => props.lineHeight, repaginate)
watch(() => [props.marginX, props.marginY, props.paragraphSpacing], repaginate)
watch(() => props.theme, draw)
watch(() => props.comments, draw, { deep: true })

onMounted(async () => {
  await nextTick()
  getViewportSize()
  repaginate()
  // #ifdef H5
  resizeHandler = () => {
    getViewportSize()
    repaginate()
  }
  window.addEventListener('resize', resizeHandler)
  // #endif
})

onBeforeUnmount(() => {
  cancelFrame(animationFrame)
  clearLongPressTimer()
  // #ifdef H5
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (h5Canvas?.parentNode) h5Canvas.parentNode.removeChild(h5Canvas)
  h5Canvas = null
  // #endif
})
</script>

<style scoped>
.page-reader {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: contain;
  user-select: none;
}

.flip-canvas-host,
.flip-canvas,
.native-flip-canvas {
  display: block;
  width: 100%;
  height: 100vh;
}

.flip-canvas-host {
  position: relative;
  overflow: hidden;
}

:deep(.native-flip-canvas) {
  position: absolute;
  inset: 0;
}

</style>
