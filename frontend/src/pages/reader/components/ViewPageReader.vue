<template>
  <view
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
  >
    <!-- Base page: always shows what should be visible underneath -->
    <view class="base-page" :style="pageBoxStyle">
      <view class="chapter-title">{{ titleText }}</view>
      <view
        v-for="line in baseLines"
        :key="line.key"
        class="reader-line"
        :class="{ blank: !line.text }"
        :style="lineStyle"
        @longpress.stop="onLineLongPress(line)"
      >
        <text>{{ line.text || ' ' }}</text>
        <text
          v-if="commentCount(line.paragraphIndex)"
          class="line-comment"
          @tap.stop="emit('commentBubbleTap', { paragraphIndex: line.paragraphIndex })"
        >
          {{ commentCount(line.paragraphIndex) }}
        </text>
      </view>
    </view>

    <!-- Flip page: the page being animated (only during flip) -->
    <view
      v-if="flipActive"
      class="flip-page"
      :style="flipPageStyle"
    >
      <view class="chapter-title">{{ titleText }}</view>
      <view
        v-for="line in flipLines"
        :key="line.key"
        class="reader-line"
        :class="{ blank: !line.text }"
        :style="lineStyle"
      >
        <text>{{ line.text || ' ' }}</text>
      </view>
      <view class="spine-shadow" :style="spineShadowStyle" />
    </view>

    <view class="reader-footer">
      <text>{{ currentPage + 1 }} / {{ totalPages || 1 }}</text>
      <text>{{ progressText }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { paginateText } from '../../../utils/page-engine'
import { readerThemes } from '../../../utils/reader'

const props = defineProps({
  chapter: { type: Object, default: null },
  content: { type: String, default: '' },
  title: { type: String, default: '' },
  prevContent: { type: String, default: '' },
  nextContent: { type: String, default: '' },
  fontSize: { type: Number, default: 18 },
  lineHeight: { type: Number, default: 32 },
  marginX: { type: Number, default: 22 },
  marginY: { type: Number, default: 28 },
  paragraphSpacing: { type: Number, default: 0 },
  theme: { type: String, default: 'DEFAULT' },
  turnMode: { type: String, default: 'PAGE' },
  brightness: { type: Number, default: 80 },
  initialPage: { type: Number, default: 0 },
  comments: { type: Array, default: () => [] }
})

const emit = defineEmits(['prev', 'next', 'chapterEnd', 'pageChange', 'toggleTools', 'paragraphSelect', 'commentBubbleTap'])

const fontFamily = "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', 'STSong', serif"

// ---- viewport ----
const viewWidth = ref(375)
const viewHeight = ref(667)

function updateSize() {
  // #ifdef H5
  if (typeof window !== 'undefined') {
    viewWidth.value = window.innerWidth || 375
    viewHeight.value = window.innerHeight || 667
    return
  }
  // #endif
  const sys = uni.getSystemInfoSync()
  viewWidth.value = sys.windowWidth || 375
  viewHeight.value = sys.windowHeight || 667
}

// ---- pagination ----
const pages = ref([])
const prevPages = ref([])
const nextPages = ref([])
const currentPage = ref(0)
let repaginateTimer = null

const totalPages = computed(() => pages.value.length)
const themeColors = computed(() => readerThemes[props.theme] || readerThemes.DEFAULT)
const effectiveContent = computed(() => props.chapter?.content || props.content || '')
const effectiveTitle = computed(() => props.chapter?.title || props.title || '')
const titleText = computed(() => effectiveTitle.value || pages.value[currentPage.value]?.title || '')
const progressText = computed(() => {
  if (!totalPages.value) return '0%'
  return `${Math.round(((currentPage.value + 1) / totalPages.value) * 100)}%`
})

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
  const body = (bodyLines.length ? bodyLines : sourceLines).join('\n\n')
  const result = paginateText(body, {
    width: viewWidth.value,
    height: viewHeight.value,
    fontSize: props.fontSize,
    lineHeight: props.lineHeight,
    paddingX: props.marginX,
    paddingY: props.marginY + 18,
    paragraphSpacing: props.paragraphSpacing,
    fontFamily
  })
  return (result.length ? result : [{ index: 0, lines: ['（本章无内容）'] }]).map((page, pageIndex) => ({
    index: pageIndex,
    title: pageIndex === 0 ? inferredTitle : '',
    lines: page.lines.map((line, lineIndex) => ({
      key: `${pageIndex}-${lineIndex}-${line}`,
      text: line,
      paragraphIndex: page.paragraphIndexes?.[lineIndex] ?? lineIndex
    }))
  }))
}

function paginate() {
  updateSize()
  pages.value = buildPages(effectiveContent.value, effectiveTitle.value)
  prevPages.value = buildPages(props.prevContent, '')
  nextPages.value = buildPages(props.nextContent, '')
  const nextPage = Math.max(0, Math.min(Number(props.initialPage || 0), pages.value.length - 1))
  currentPage.value = nextPage
  emit('pageChange', nextPage)
}

function schedulePaginate() {
  if (repaginateTimer) { clearTimeout(repaginateTimer); repaginateTimer = null }
  paginate()
  nextTick(() => {
    paginate()
    repaginateTimer = setTimeout(paginate, 120)
  })
}

// ---- page content ----
const currentLines = computed(() => pages.value[currentPage.value]?.lines || [])

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

const targetPage = computed(() => pages.value[targetPageIndex.value] || boundaryTargetPage.value || null)
const targetLines = computed(() => targetPage.value?.lines || [])

// baseLines: content underneath the flip page.
// PAGE animation → target content revealed as page slides away.
// COVER animation → current content stays in place as cover slides over.
// Idle → current content.
const baseLines = computed(() => {
  if (flipActive.value && props.turnMode === 'PAGE') return targetLines.value
  return currentLines.value
})

// flipLines: the animated layer content.
// COVER → target content (new page sliding in).
// PAGE → current content (sliding/tilting away).
const flipLines = computed(() => {
  if (props.turnMode === 'COVER') return targetLines.value
  return currentLines.value
})

// ---- rAF animation engine ----
let animState = null

function cancelAnim() {
  if (animState?.rafId) {
    cancelAnimationFrame(animState.rafId)
    animState.rafId = null
  }
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
  const state = { from, to, duration, easing, startTime: performance.now(), rafId: null, onDone }
  animState = state

  function tick(now) {
    if (animState !== state) return
    const elapsed = now - state.startTime
    const t = Math.min(1, elapsed / state.duration)
    flipProgress.value = state.from + (state.to - state.from) * state.easing(t)

    if (t < 1) {
      state.rafId = requestAnimationFrame(tick)
    } else {
      animState = null
      state.rafId = null
      if (state.onDone) state.onDone()
    }
  }
  state.rafId = requestAnimationFrame(tick)
}

// ---- flip state ----
const flipDirection = ref(1)
const flipProgress = ref(0)
const flipActive = ref(false)
const dragging = ref(false)
const committing = ref(false)
const dragStartX = ref(0)
const dragDeltaX = ref(0)
let suppressTapUntil = 0
let velocitySamples = []
let dragLockedDir = 0 // direction locked on first move

function beginFlip(direction, progress) {
  if (committing.value) return false
  if (direction > 0 && currentPage.value >= totalPages.value - 1 && !nextPages.value.length) return false
  if (direction < 0 && currentPage.value <= 0 && !prevPages.value.length) return false
  cancelAnim()
  flipDirection.value = direction
  flipProgress.value = progress
  flipActive.value = props.turnMode !== 'NONE'
  return true
}

function finishFlip() {
  flipProgress.value = 0
  flipActive.value = false
  committing.value = false
}

function settleFlip(shouldCommit) {
  if (props.turnMode === 'NONE') {
    if (shouldCommit) applyPageChange()
    else finishFlip()
    return
  }

  if (!shouldCommit) {
    committing.value = true
    const duration = Math.max(160, 280 * (1 - flipProgress.value))
    animateTo(flipProgress.value, 0, duration, easeInOutCubic, finishFlip)
    return
  }

  committing.value = true
  const remaining = 1 - flipProgress.value
  const duration = Math.max(200, Math.min(420, remaining * 500))
  animateTo(flipProgress.value, 1, duration, easeOutCubic, () => {
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

function applyPageChange() {
  const next = currentPage.value + flipDirection.value
  currentPage.value = Math.max(0, Math.min(next, totalPages.value - 1))
  emit('pageChange', currentPage.value)
  if (currentPage.value >= totalPages.value - 1) emit('chapterEnd')
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
    return
  }

  if (beginFlip(direction, 0.02)) {
    animateTo(0.02, 1, 360, easeOutCubic, () => {
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

// ---- drag (with direction locking) ----
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

  // Lock direction on first significant move
  if (!flipActive.value) {
    const absDx = Math.abs(dragDeltaX.value)
    if (absDx < 2) return // dead zone
    dragLockedDir = dragDeltaX.value < 0 ? 1 : -1
    if (!beginFlip(dragLockedDir, 0.01)) {
      dragLockedDir = 0
      return
    }
  }

  // Progress only in locked direction; reversing snaps back to 0 smoothly
  const dx = dragDeltaX.value
  const inLockedDir = dragLockedDir > 0 ? -dx : dx
  const rawProgress = Math.max(0, inLockedDir) / Math.max(1, viewWidth.value * 0.78)
  flipProgress.value = Math.min(0.98, rawProgress)

  velocitySamples.push({ x: clientX, t: now })
  while (velocitySamples.length > 1 && now - velocitySamples[0].t > 100) {
    velocitySamples.shift()
  }
}

function endDrag() {
  if (!dragging.value) return
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

  // Velocity relative to flip direction
  const velocityInFlipDir = velocity * (dragLockedDir > 0 ? -1 : 1)
  const fastFlick = velocityInFlipDir > 0.35
  const threshold = Math.max(36, viewWidth.value * 0.1)
  const shouldCommit = distance > threshold || fastFlick

  dragLockedDir = 0
  dragDeltaX.value = 0
  if (flipActive.value) settleFlip(shouldCommit)
}

// ---- input handlers ----
function onTap(event) {
  if (Date.now() < suppressTapUntil) return
  if (dragging.value || committing.value) return
  const x = event?.detail?.x ?? event?.changedTouches?.[0]?.clientX ?? viewWidth.value / 2
  const ratio = x / viewWidth.value
  if (ratio < 0.28) flipBy(-1)
  else if (ratio > 0.72) flipBy(1)
  else emit('toggleTools')
}

function onTouchStart(event) {
  const touch = event.touches?.[0]
  if (touch) startDrag(touch.clientX)
}

function onTouchMove(event) {
  const touch = event.touches?.[0]
  if (touch) moveDrag(touch.clientX)
}

function onTouchEnd() { endDrag() }

function onMouseDown(event) { startDrag(event.clientX) }
function onMouseMove(event) { moveDrag(event.clientX) }
function onMouseUp() { endDrag() }
function onMouseLeave() { endDrag() }

function onLineLongPress(line) {
  if (!line?.text) return
  emit('paragraphSelect', {
    text: line.text,
    index: line.paragraphIndex,
    toolbarY: props.marginY + 80
  })
}

function commentCount(paragraphIndex) {
  if (paragraphIndex == null) return 0
  return props.comments.filter((item) => Number(item.paragraphIndex) === Number(paragraphIndex)).length
}

// ---- exposed ----
function goToPage(idx) {
  const next = Math.max(0, Math.min(Number(idx || 0), totalPages.value - 1))
  currentPage.value = next
  emit('pageChange', next)
}

// ---- styles ----
const rootStyle = computed(() => ({
  backgroundColor: themeColors.value.background,
  color: themeColors.value.text,
  filter: `brightness(${props.brightness / 100})`,
  '--reader-bg': themeColors.value.background,
  '--reader-text': themeColors.value.text
}))

const pageBoxStyle = computed(() => ({
  padding: `${props.marginY}px ${props.marginX}px ${Math.max(props.marginY, 46)}px`,
  fontSize: `${props.fontSize}px`,
  lineHeight: `${props.lineHeight}px`,
  fontFamily
}))

const lineStyle = computed(() => ({
  marginBottom: `${props.paragraphSpacing}px`
}))

const flipPageStyle = computed(() => {
  if (props.turnMode === 'COVER') {
    // COVER: smooth horizontal slide, no rotation
    const offset = flipDirection.value > 0
      ? (1 - flipProgress.value) * viewWidth.value
      : -(1 - flipProgress.value) * viewWidth.value
    return {
      ...pageBoxStyle.value,
      willChange: 'transform',
      transform: `translate3d(${offset}px, 0, 0)`,
      boxShadow: `0 0 28px rgba(0,0,0,${0.06 + flipProgress.value * 0.12})`
    }
  }

  // PAGE mode: slide + subtle perspective tilt
  const isForward = flipDirection.value > 0
  const slideX = isForward
    ? -flipProgress.value * viewWidth.value
    : flipProgress.value * viewWidth.value
  const tilt = Math.sin(flipProgress.value * Math.PI) * 28
  const tiltAngle = isForward ? -tilt : tilt
  const originX = isForward ? 'left' : 'right'

  return {
    ...pageBoxStyle.value,
    willChange: 'transform',
    transformOrigin: `${originX} center`,
    transform: `perspective(1000px) translate3d(${slideX}px, 0, 0) rotateY(${tiltAngle}deg)`,
    boxShadow: flipProgress.value > 0.02
      ? `0 0 28px rgba(0,0,0,${0.06 + tilt * 0.012})`
      : 'none'
  }
})

const spineShadowStyle = computed(() => {
  if (props.turnMode !== 'PAGE') return { opacity: 0 }
  const tilt = Math.sin(flipProgress.value * Math.PI)
  const gradientDir = flipDirection.value > 0 ? '90deg' : '270deg'
  return {
    opacity: tilt * 0.45,
    background: `linear-gradient(${gradientDir}, rgba(0,0,0,0.22) 0%, transparent 45%)`
  }
})

// ---- watchers ----
watch(
  () => [props.chapter?.id, props.chapter?.content, props.chapter?.title, props.content, props.title, props.fontSize, props.lineHeight, props.marginX, props.marginY, props.paragraphSpacing, props.prevContent, props.nextContent],
  schedulePaginate,
  { immediate: true }
)
watch(() => props.theme, () => nextTick(updateSize))
watch(() => props.initialPage, (val) => {
  if (!totalPages.value) return
  goToPage(Number(val || 0))
})

onMounted(() => {
  schedulePaginate()
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', schedulePaginate)
  }
  // #endif
})

onBeforeUnmount(() => {
  cancelAnim()
  if (repaginateTimer) clearTimeout(repaginateTimer)
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', schedulePaginate)
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
  perspective: 1000px;
  user-select: none;
  touch-action: none;
  -webkit-user-select: none;
}

.base-page {
  position: absolute;
  inset: 0;
  z-index: 1;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--reader-bg);
  color: var(--reader-text);
}

.flip-page {
  position: absolute;
  inset: 0;
  z-index: 3;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--reader-bg);
  color: var(--reader-text);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
}

.chapter-title {
  min-height: 28px;
  margin-bottom: 18px;
  font-size: 1.16em;
  line-height: 1.45;
  font-weight: 800;
}

.reader-line {
  position: relative;
  min-height: 1em;
  text-align: justify;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.reader-line.blank {
  opacity: 0;
}

.line-comment {
  display: inline-flex;
  min-width: 20px;
  height: 18px;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  padding: 0 5px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.72);
  color: #8C7B62;
  font-size: 11px;
  line-height: 18px;
}

.spine-shadow {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  mix-blend-mode: multiply;
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
