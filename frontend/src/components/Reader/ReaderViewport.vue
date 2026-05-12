<template>
  <view
    ref="viewportRef"
    class="nr-viewport"
    :style="viewportStyle"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- 空状态提示 -->
    <view v-if="pages.length === 0" class="nr-empty-state">
      <text class="nr-empty-text">暂无内容</text>
      <text class="nr-empty-hint">加载中...</text>
    </view>

    <!-- 分页模式：使用 Vue Transition 实现翻页动画 -->
    <view v-else-if="mode === 'PAGINATION'" class="nr-stage">
      <Transition :name="transitionName">
        <ReaderPage
          v-if="currentPage"
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
        />
      </Transition>
    </view>

    <!-- 滚动模式：虚拟列表容器 -->
    <scroll-view
      v-else-if="pages.length > 0"
      ref="scrollViewRef"
      class="nr-scroll-view"
      :scroll-y="true"
      :scroll-into-view="scrollTargetId"
      :scroll-with-animation="true"
      @scroll="onScroll"
    >
      <view
        v-for="(page, idx) in validPages"
        :key="idx"
        :id="'nr-page-' + idx"
        class="nr-scroll-page"
      >
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
        />
      </view>
    </scroll-view>

    <!-- 点击区域（分页模式） -->
    <view v-if="mode === 'PAGINATION'" class="nr-tap-zones">
      <view class="nr-tap nr-tap-left" @click="onTapLeft" />
      <view class="nr-tap nr-tap-center" @click="onTapCenter" />
      <view class="nr-tap nr-tap-right" @click="onTapRight" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { Page, ReaderMode } from '../../types/reader'
import ReaderPage from './ReaderPage.vue'

const props = withDefaults(defineProps<{
  pages: Page[]
  currentPageIndex: number
  mode: ReaderMode
  chapterNo: number
  chapterTitle: string
  bookTitle: string
  fontSize: number
  lineHeight: number
  fontFamily: string
  textColor: string
  backgroundColor: string
}>(), {
  pages: () => [],
  currentPageIndex: 0,
  mode: 'PAGINATION',
  chapterNo: 0,
  chapterTitle: '',
  bookTitle: '',
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "'Noto Serif SC','Source Han Serif SC',SimSun,STSong,serif",
  textColor: '#3D2B1F',
  backgroundColor: '#F9F5E8',
})

const emit = defineEmits<{
  (e: 'tap-left'): void
  (e: 'tap-center'): void
  (e: 'tap-right'): void
  (e: 'swipe-left'): void
  (e: 'swipe-right'): void
  (e: 'long-press', context: { text: string; paragraphIndex: number; rect: DOMRect | null }): void
  (e: 'scroll', pageIndex: number): void
}>()

const viewportRef = ref<HTMLElement | null>(null)
const currentPageRef = ref<HTMLElement | null>(null)
const scrollViewRef = ref<HTMLElement | null>(null)

const transitionName = ref('slide-left')

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

watch(() => props.currentPageIndex, (newIndex, oldIndex) => {
  // 章节切换：由 chapterNo 变化决定方向
  if (props.chapterNo !== prevChapterNo.value) {
    transitionName.value = props.chapterNo > prevChapterNo.value ? 'slide-left' : 'slide-right'
    prevChapterNo.value = props.chapterNo
  } else {
    // 章内翻页：index 增减对应前进/后退
    transitionName.value = newIndex > oldIndex ? 'slide-left' : 'slide-right'
  }
  internalPageIndex.value = newIndex
})

const scrollTargetId = ref('')

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
  if (props.mode === 'PAGINATION') emit('tap-center')
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
  padding: 44px 22px 44px;
  box-sizing: border-box;
}

.nr-scroll-view {
  width: 100%;
  height: 100%;
}

.nr-scroll-page {
  min-height: 100%;
  padding: 44px 22px 44px;
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

/* Vue Transition Animations */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.35s ease;
  position: absolute;
  width: 100%;
  height: 100%;
}

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
</style>
