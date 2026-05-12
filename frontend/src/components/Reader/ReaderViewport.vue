<template>
  <view
    ref="viewportRef"
    class="nr-viewport"
    :class="{ 'nr-viewport-scroll': mode === 'SCROLL' }"
    :style="viewportStyle"
  >
    <!-- 空状态提示 -->
    <view v-if="pages.length === 0" class="nr-empty-state">
      <text class="nr-empty-text">暂无内容</text>
      <text class="nr-empty-hint">加载中...</text>
    </view>

    <!-- 分页模式（绑 touch 事件） -->
    <view
      v-else-if="mode === 'PAGINATION'"
      class="nr-stage"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- 无动画：直接渲染 -->
      <ReaderPage
        v-if="noTransition && currentPage"
        :key="currentPageIndex"
        ref="currentPageRef"
        class="nr-current-page"
        :html="currentPage.html || ''"
        :title="currentPage.isFirst ? chapterTitle : ''"
        :is-first="currentPage.isFirst"
        :book-title="bookTitle"
        :page-label="pageLabel"
        :font-size="fontSize"
        :line-height="lineHeight"
        :font-family="fontFamily"
        :text-color="textColor"
        :background-color="backgroundColor"
      />
      <!-- 有动画：Transition 包裹 -->
      <Transition v-else-if="currentPage" :name="transitionName">
        <ReaderPage
          :key="currentPageIndex"
          ref="currentPageRef"
          class="nr-current-page"
          :html="currentPage.html || ''"
          :title="currentPage.isFirst ? chapterTitle : ''"
          :is-first="currentPage.isFirst"
          :book-title="bookTitle"
          :page-label="pageLabel"
          :font-size="fontSize"
          :line-height="lineHeight"
          :font-family="fontFamily"
          :text-color="textColor"
          :background-color="backgroundColor"
        />
      </Transition>

      <!-- 点击区域（分页模式下三区） -->
      <view class="nr-tap-zones">
        <view class="nr-tap nr-tap-left" @click="onTapLeft" />
        <view class="nr-tap nr-tap-center" @click="onTapCenter" />
        <view class="nr-tap nr-tap-right" @click="onTapRight" />
      </view>
    </view>

    <!-- 滚动模式：不绑 touch 事件，让原生滚动处理 -->
    <scroll-view
      v-else-if="pages.length > 0"
      ref="scrollViewRef"
      class="nr-scroll-view"
      :scroll-y="true"
      :scroll-into-view="scrollTargetId"
      :scroll-with-animation="true"
      @scroll="onScroll"
      @scrolltolower="onScrollToLower"
      @scrolltoupper="onScrollToUpper"
    >
      <view
        v-for="(page, idx) in validPages"
        :key="(page.chapterNo ?? 0) + '-' + (page.index ?? idx)"
        :id="'nr-page-' + idx"
        class="nr-scroll-page"
      >
        <view class="nr-scroll-page-inner" @click="onScrollViewTap">
          <ReaderPage
            :html="page.html || ''"
            :title="page.isFirst ? chapterTitle : ''"
            :is-first="!!page.isFirst"
            :book-title="bookTitle"
            :page-label="`${idx + 1} / ${validPages.length}`"
            :font-size="fontSize"
            :line-height="lineHeight"
            :font-family="fontFamily"
            :text-color="textColor"
            :background-color="backgroundColor"
          />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { Page, ReaderMode, TurnMode } from '../../types/reader'
import ReaderPage from './ReaderPage.vue'

const props = withDefaults(defineProps<{
  pages: Page[]
  currentPageIndex: number
  mode: ReaderMode
  turnMode: TurnMode
  chapterNo: number
  chapterTitle: string
  bookTitle: string
  fontSize: number
  lineHeight: number
  fontFamily: string
  textColor: string
  backgroundColor: string
  scrollAnchorIndex?: number
}>(), {
  pages: () => [],
  currentPageIndex: 0,
  mode: 'PAGINATION',
  turnMode: 'SLIDE',
  chapterNo: 0,
  chapterTitle: '',
  bookTitle: '',
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "'Noto Serif SC','Source Han Serif SC',SimSun,STSong,serif",
  textColor: '#3D2B1F',
  backgroundColor: '#F9F5E8',
  scrollAnchorIndex: -1,
})

const emit = defineEmits<{
  (e: 'tap-left'): void
  (e: 'tap-center'): void
  (e: 'tap-right'): void
  (e: 'swipe-left'): void
  (e: 'swipe-right'): void
  (e: 'long-press', context: { text: string; paragraphIndex: number; rect: DOMRect | null }): void
  (e: 'scroll', pageIndex: number): void
  (e: 'scroll-lower'): void
  (e: 'scroll-upper'): void
}>()

const viewportRef = ref<HTMLElement | null>(null)
const currentPageRef = ref<HTMLElement | null>(null)
const scrollViewRef = ref<HTMLElement | null>(null)

const transitionName = ref('slide-left')

/** 根据翻页模式计算过渡名 */
function resolveTransitionName(forward: boolean): string {
  const prefix = props.turnMode === 'COVER' ? 'cover' : 'slide'
  return forward ? `${prefix}-left` : `${prefix}-right`
}

const currentPage = computed(() => {
  const page = props.pages[props.currentPageIndex]
  return page || null
})

const validPages = computed(() => {
  return props.pages.filter((page): page is Page => !!page)
})

const pageLabel = computed(() =>
  `${props.currentPageIndex + 1} / ${props.pages.length || 1}`,
)

const viewportStyle = computed(() => ({
  backgroundColor: props.backgroundColor,
}))

const internalPageIndex = ref(props.currentPageIndex)
const prevChapterNo = ref(props.chapterNo)

/** 是否禁用过渡动画（NONE 模式） */
const noTransition = computed(() => props.turnMode === 'NONE')

watch(() => props.currentPageIndex, (newIndex, oldIndex) => {
  // 章节切换：由 chapterNo 变化决定方向
  if (props.chapterNo !== prevChapterNo.value) {
    const forward = props.chapterNo > prevChapterNo.value
    transitionName.value = resolveTransitionName(forward)
    prevChapterNo.value = props.chapterNo
  } else {
    // 章内翻页：index 增减对应前进/后退
    transitionName.value = resolveTransitionName(newIndex > oldIndex)
  }
  internalPageIndex.value = newIndex
})

const scrollTargetId = ref('')

/** 滚动模式：当页面被前置时，滚动到原内容起始位置 */
watch(() => props.scrollAnchorIndex, (anchorIndex) => {
  if (anchorIndex == null || anchorIndex < 0) return
  if (props.mode !== 'SCROLL') return
  nextTick(() => {
    scrollTargetId.value = `nr-page-${anchorIndex}`
  })
})

let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let isSwiping = false

function onTouchStart(e: TouchEvent): void {
  const touch = e.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  touchStartTime = Date.now()
  isSwiping = false

  longPressTimer = setTimeout(() => {
    if (!isSwiping) {
      handleLongPress(touch.clientX, touch.clientY)
    }
  }, 600)
}

function onTouchMove(e: TouchEvent): void {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }

  if (!touchStartX) return
  const touch = e.touches[0]
  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY

  if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
    isSwiping = true
  }
}

function onTouchEnd(e: TouchEvent): void {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }

  if (isSwiping) {
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartX
    const elapsed = Date.now() - touchStartTime

    if (Math.abs(dx) > 50 || Math.abs(dx) / elapsed > 0.3) {
      if (dx < 0) emit('swipe-left')
      else emit('swipe-right')
    }
    isSwiping = false
    return
  }
}

function handleLongPress(x: number, y: number): void {
  const el = document.elementFromPoint(x, y)
  if (!el) return

  const pEl = el.closest('[data-p]')
  if (!pEl) return

  const paragraphIndex = parseInt(pEl.getAttribute('data-p') ?? '-1', 10)
  if (paragraphIndex < 0) return

  const text = pEl.textContent || ''
  const rect = pEl.getBoundingClientRect()

  emit('long-press', { text, paragraphIndex, rect })
}

function onTapLeft(): void {
  if (props.mode === 'PAGINATION') emit('tap-left')
}

function onTapCenter(): void {
  emit('tap-center')
}

function onScrollViewTap(): void {
  emit('tap-center')
}

function onScrollToLower(): void {
  emit('scroll-lower')
}

function onScrollToUpper(): void {
  emit('scroll-upper')
}

function onTapRight(): void {
  if (props.mode === 'PAGINATION') emit('tap-right')
}

function onScroll(e: { detail: { scrollTop: number } }): void {
  const scrollTop = e.detail.scrollTop
  const pageHeight = (scrollViewRef.value as HTMLElement | null)?.clientHeight || 600
  const pageIndex = Math.round(scrollTop / pageHeight)
  emit('scroll', pageIndex)
}

function scrollToPage(pageIndex: number): void {
  scrollTargetId.value = `nr-page-${pageIndex}`
}

defineExpose({
  viewportRef,
  currentPageRef,
  scrollViewRef,
  scrollToPage,
})
</script>

<style scoped>
.nr-viewport {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.nr-viewport-scroll {
  touch-action: pan-y;
  overflow: visible;
}

.nr-empty-state {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.nr-empty-text {
  font-size: 18px;
  color: #999;
  margin-bottom: 12px;
}

.nr-empty-hint {
  font-size: 14px;
  color: #ccc;
}

.nr-scroll-empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 100px 20px;
}

.nr-stage {
  position: relative;
  width: 100%;
  height: 100%;
}

.nr-current-page {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  padding: 36px 22px 44px;
  box-sizing: border-box;
}

.nr-scroll-view {
  width: 100%;
  height: 100%;
}

.nr-scroll-page {
  min-height: 100%;
}

.nr-scroll-page-inner {
  min-height: 100%;
  padding: 36px 22px 44px;
  box-sizing: border-box;
}

.nr-tap-zones {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  pointer-events: none;
}

.nr-tap {
  height: 100%;
  pointer-events: auto;
}

.nr-tap-left {
  width: 33.33%;
}

.nr-tap-center {
  width: 33.34%;
}

.nr-tap-right {
  width: 33.33%;
}

/* ===== 平移 (SLIDE) ===== */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active,
.cover-left-enter-active,
.cover-left-leave-active,
.cover-right-enter-active,
.cover-right-leave-active {
  transition: transform 0.35s ease;
  position: absolute;
  width: 100%;
  height: 100%;
}

/* 覆盖模式：新页盖在旧页上方 */
.cover-left-enter-active,
.cover-right-enter-active {
  z-index: 2;
}

.cover-left-leave-active,
.cover-right-leave-active {
  z-index: 1;
}

/* -- 平移：两页同向移动 -- */
.slide-left-enter-from {
  transform: translateX(100%);
}
.slide-left-leave-to {
  transform: translateX(-100%);
}
.slide-right-enter-from {
  transform: translateX(-100%);
}
.slide-right-leave-to {
  transform: translateX(100%);
}

.slide-left-enter-to,
.slide-left-leave-from,
.slide-right-enter-to,
.slide-right-leave-from {
  transform: translateX(0);
}

/* -- 覆盖 (COVER)：旧页原位不动，新页滑入覆盖 -- */
.cover-left-enter-from {
  transform: translateX(100%);
}
.cover-left-leave-to {
  transform: translateX(0);
}
.cover-right-enter-from {
  transform: translateX(-100%);
}
.cover-right-leave-to {
  transform: translateX(0);
}

.cover-left-enter-to,
.cover-left-leave-from,
.cover-right-enter-to,
.cover-right-leave-from {
  transform: translateX(0);
}
</style>
