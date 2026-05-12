<template>
  <view
    class="reader-root"
    :style="rootStyle"
    @keydown="onKeyDown"
  >
    <!-- 初始化前：显示等待 -->
    <ReaderLoading
      v-if="!pageReady"
      text="初始化中..."
      fullscreen
    />

    <!-- 阅读区域 -->
    <template v-if="pageReady">
      <!-- 返回指示器 -->
      <view class="nr-back-indicator" @click="goBack">
        <text class="nr-back-arrow">‹</text>
        <text class="nr-back-label">{{ backLabel }}</text>
      </view>

      <!-- 加载状态 -->
      <ReaderLoading
        v-if="loading"
        text="加载章节中..."
        fullscreen
      />

      <!-- 阅读视口 -->
      <view class="reader-content">
        <ReaderViewport
          v-if="!loading"
          ref="viewportRef"
          :pages="pages"
          :current-page-index="currentPageIndex"
          :mode="store.settings.readerMode"
          :chapter-title="chapter?.title ?? ''"
          :book-title="store.bookTitle"
          :font-size="store.settings.fontSize"
          :line-height="store.settings.lineHeight"
          :font-family="resolvedFontFamily"
          :text-color="store.settings.textColor"
          :background-color="store.settings.backgroundColor"
          @tap-left="onTapLeft"
          @tap-center="toggleToolbar"
          @tap-right="onTapRight"
          @swipe-left="onSwipeLeft"
          @swipe-right="onSwipeRight"
          @long-press="onLongPress"
          @scroll="onScroll"
        />
      </view>

      <!-- 工具栏 -->
      <ReaderToolbar
        :visible="toolbarVisible"
        :current-page="currentPageIndex"
        :total-pages="totalPages"
        :is-night="store.isNight"
        @close="hideToolbar"
        @back="goBack"
        @add-shelf="addToShelf"
        @open-catalog="showCatalog"
        @toggle-night="toggleNightMode"
        @open-settings="toggleSettings"
        @open-comments="openGlobalComments"
        @prev-chapter="navigatePrevChapter"
        @next-chapter="navigateNextChapter"
        @progress-seek="onProgressSeek"
      />

      <!-- 目录 -->
      <ReaderMenu
        :visible="catalogVisible"
        :chapters="store.chapterList"
        :current-chapter-no="chapter?.chapterNo ?? 1"
        :progress-percent="progressPercent"
        @close="hideCatalog"
        @select="onChapterSelect"
      />

      <!-- 设置面板 -->
      <ReaderSettingPanel
        :visible="settingsVisible"
        :brightness="store.settings.brightness"
        :font-size="store.settings.fontSize"
        :font-family="store.settings.fontFamily"
        :line-height="store.settings.lineHeight"
        :theme-key="currentThemeKey"
        :turn-mode="store.settings.turnMode"
        :reader-mode="store.settings.readerMode"
        @close="toggleSettings"
        @brightness-change="onBrightnessChange"
        @font-increase="onFontIncrease"
        @font-decrease="onFontDecrease"
        @font-change="onFontChange"
        @lineheight-increase="onLineHeightIncrease"
        @lineheight-decrease="onLineHeightDecrease"
        @theme-change="onThemeChange"
        @turnmode-change="onTurnModeChange"
        @mode-change="onReaderModeChange"
      />

      <!-- 长按菜单 -->
      <ReaderLongPressMenu
        :visible="longPressVisible"
        :x="longPressX"
        :y="longPressY"
        @action="onLongPressAction"
      />

      <!-- 评论面板 -->
      <ReaderCommentPanel
        :visible="commentPanel.visible"
        :quote-text="commentPanel.quoteText"
        :comments="commentPanel.comments"
        :loading="commentPanel.loading"
        :has-more="commentPanel.hasMore"
        :submitting="commentPanel.submitting"
        @close="closeCommentPanel"
        @submit="submitComment"
        @load-more="loadMoreComments"
        @like="toggleCommentLike"
      />
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// Components
import ReaderViewport from '../../components/reader/ReaderViewport.vue'
import ReaderToolbar from '../../components/reader/ReaderToolbar.vue'
import ReaderMenu from '../../components/reader/ReaderMenu.vue'
import ReaderSettingPanel from '../../components/reader/ReaderSettingPanel.vue'
import ReaderLongPressMenu from '../../components/reader/ReaderLongPressMenu.vue'
import ReaderCommentPanel from '../../components/reader/ReaderCommentPanel.vue'
import ReaderLoading from '../../components/reader/ReaderLoading.vue'

// Composables
import { useReader } from '../../composables/useReader'
import { useReaderComment } from '../../composables/useReaderComment'
import { useReaderProgress } from '../../composables/useReaderProgress'
import { useReaderSetting } from '../../composables/useReaderSetting'
import { ShareService } from '../../services/ShareService'
import { TtsService } from '../../services/TtsService'

import type { ParagraphComment } from '../../types/reader'

// ===================== 核心 Composable =====================

const {
  initialized,
  chapter,
  pages,
  currentPageIndex,
  totalPages,
  progressPercent,
  loading,
  toolbarVisible,
  settingsVisible,
  catalogVisible,
  store,
  engineError,
  init: initReader,
  openChapter,
  nextPage,
  prevPage,
  nextChapter,
  prevChapter,
  goToPage,
  toggleToolbar,
  toggleSettings,
  showCatalog,
  hideCatalog,
  saveProgress,
  setMode,
  setTurnMode,
  updateSettings,
  hideToolbar,
} = useReader()

// ===================== 两阶段初始化 =====================

const pageReady = ref(false)
const routeQuery = ref<{
  bookId: string
  bookTitle: string
  chapterNo?: string
}>({
  bookId: '',
  bookTitle: '',
})

onLoad((q) => {
  const bookId = (q?.bookId as string) || ''
  const bookTitle = (q?.title as string) || (q?.bookTitle as string) || ''
  const chapterNo = (q?.chapterNo as string) || undefined

  routeQuery.value = { bookId, bookTitle, chapterNo }
  
  // 验证必要参数
  if (!bookId) {
    console.error('[Reader] Missing bookId parameter')
    uni.showToast({ title: '参数错误', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }
  
  pageReady.value = true

  // 路由参数就绪后启动阅读器引擎
  initReader({
    bookId,
    bookTitle,
    chapterNo: chapterNo ? Number(chapterNo) : undefined,
  })
})

// ===================== 设置 Composable =====================

const {
  increaseFontSize,
  decreaseFontSize,
  increaseLineHeight,
  decreaseLineHeight,
  setFontFamily,
  setBrightness,
  applyTheme,
} = useReaderSetting()

// ===================== 进度 Composable =====================

const {
  startAutoSave,
  setupVisibilitySave,
  setupBeforeUnloadSave,
  saveNow,
} = useReaderProgress()

// ===================== 评论 Composable =====================

const commentCtrl = useReaderComment()

const commentPanel = computed(() => ({
  visible: commentCtrl.panelVisible.value,
  quoteText: commentCtrl.currentQuoteText.value,
  comments: commentCtrl.comments.value,
  loading: commentCtrl.commentsLoading.value,
  hasMore: commentCtrl.hasMoreComments.value,
  submitting: commentCtrl.submitting.value,
}))

// ===================== 长按菜单 =====================

const longPressVisible = ref(false)
const longPressX = ref(0)
const longPressY = ref(0)
const longPressText = ref('')
const longPressParagraphIndex = ref(-1)

// ===================== 样式 =====================

const rootStyle = computed(() => ({
  backgroundColor: store.settings.backgroundColor,
  color: store.settings.textColor,
}))

const resolvedFontFamily = computed(() => {
  const map: Record<string, string> = {
    SERIF: "'Noto Serif SC','Source Han Serif SC',SimSun,STSong,serif",
    KAITI: "'KaiTi','STKaiti',Kai,serif",
    HEI: "'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif",
  }
  return map[store.settings.fontFamily] || map.SERIF
})

const currentThemeKey = computed(() => {
  const bg = store.settings.backgroundColor
  const map: Record<string, string> = {
    '#FFFFFF': 'DEFAULT',
    '#F9F5E8': 'PARCHMENT',
    '#E8F0E3': 'LIGHT_GREEN',
    '#E4ECF0': 'LIGHT_BLUE',
    '#161A1D': 'NIGHT',
    '#EBEBE7': 'GRAY',
  }
  return map[bg] || 'PARCHMENT'
})

const backLabel = computed(() => {
  if (currentPageIndex.value === 0 && store.bookTitle) {
    return store.bookTitle
  }
  return chapter.value?.title || '返回'
})

// ===================== 生命周期 =====================

onMounted(() => {
  startAutoSave()
  setupVisibilitySave()
  setupBeforeUnloadSave()
})

onBeforeUnmount(() => {
  saveNow()
})

// ===================== 导航事件 =====================

function onTapLeft(): void {
  prevPage()
}

function onTapRight(): void {
  nextPage()
}

function onSwipeLeft(): void {
  nextPage()
}

function onSwipeRight(): void {
  prevPage()
}

function goBack(): void {
  saveNow()
  uni.navigateBack()
}

async function navigatePrevChapter(): Promise<void> {
  store.hideToolbar()
  await prevChapter()
}

async function navigateNextChapter(): Promise<void> {
  store.hideToolbar()
  await nextChapter()
}

function onProgressSeek(pageIndex: number): void {
  goToPage(pageIndex)
}

function onChapterSelect(chapterNo: number): void {
  openChapter(chapterNo)
}

// ===================== 设置事件 =====================

function onBrightnessChange(value: number): void {
  setBrightness(value)
}

function onFontIncrease(): void { increaseFontSize() }
function onFontDecrease(): void { decreaseFontSize() }
function onFontChange(value: string): void { setFontFamily(value) }
function onLineHeightIncrease(): void { increaseLineHeight() }
function onLineHeightDecrease(): void { decreaseLineHeight() }
function onThemeChange(key: string): void { applyTheme(key) }

function onTurnModeChange(mode: string): void {
  setTurnMode(mode as Parameters<typeof setTurnMode>[0])
}

function onReaderModeChange(mode: string): void {
  setMode(mode as Parameters<typeof setMode>[0])
}

function toggleNightMode(): void {
  store.toggleNightMode()
  store.hideToolbar()
}

// ===================== 长按事件 =====================

function onLongPress(context: {
  text: string
  paragraphIndex: number
  rect: DOMRect | null
}): void {
  longPressText.value = context.text
  longPressParagraphIndex.value = context.paragraphIndex
  longPressX.value = context.rect ? context.rect.left + context.rect.width / 2 : 0
  longPressY.value = context.rect ? context.rect.top : 0
  longPressVisible.value = true
}

function onLongPressAction(actionId: string): void {
  longPressVisible.value = false

  switch (actionId) {
    case 'copy':
      copyText(longPressText.value)
      break
    case 'share':
      shareText(longPressText.value)
      break
    case 'comment':
      openCommentPanel(longPressParagraphIndex.value, longPressText.value)
      break
    case 'highlight':
      addHighlight(longPressText.value)
      break
    case 'listen':
      startTts(longPressText.value)
      break
    case 'dictionary':
      lookupDictionary(longPressText.value)
      break
    case 'typo':
      reportTypo(longPressText.value)
      break
  }
}

async function copyText(text: string): Promise<void> {
  try {
    const { getPlatformAdapter } = await import('../../platform/ReaderPlatform')
    await getPlatformAdapter().copyToClipboard(text)
    uni.showToast({ title: '已复制', icon: 'success' })
  } catch {
    uni.showToast({ title: '复制失败', icon: 'none' })
  }
}

function shareText(text: string): void {
  const shareService = new ShareService()
  shareService.shareText(text, store.bookTitle)
}

function addHighlight(_text: string): void {
  uni.showToast({ title: '已划线', icon: 'success' })
}

function lookupDictionary(word: string): void {
  uni.showToast({ title: `查词: ${word.slice(0, 10)}`, icon: 'none' })
}

function reportTypo(_text: string): void {
  uni.showToast({ title: '已反馈，感谢', icon: 'success' })
}

// ===================== TTS =====================

let ttsService: TtsService | null = null

function startTts(text: string): void {
  if (!ttsService) ttsService = new TtsService()
  ttsService.start(text, { rate: 1, pitch: 1 })
}

// ===================== 评论事件 =====================

function openCommentPanel(paragraphIndex: number, text: string): void {
  commentCtrl.openCommentPanel(paragraphIndex, text)
}

function openGlobalComments(): void {
  if (!chapter.value) return
  commentCtrl.openCommentPanel(0, '')
}

function closeCommentPanel(): void {
  commentCtrl.closeCommentPanel()
}

async function submitComment(content: string): Promise<void> {
  if (!chapter.value) return
  try {
    await commentCtrl.submitComment({
      bookId: store.bookId,
      chapterNo: chapter.value.chapterNo,
      paragraphIndex: commentCtrl.currentParagraphIndex.value,
      content,
      quoteText: commentCtrl.currentQuoteText.value,
    })
    uni.showToast({ title: '评论成功', icon: 'success' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '评论失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

function loadMoreComments(): void {
  commentCtrl.loadMoreComments()
}

function toggleCommentLike(comment: ParagraphComment): void {
  commentCtrl.toggleLike(comment)
}

function addToShelf(): void {
  uni.showToast({ title: '已加入书架', icon: 'success' })
  store.hideToolbar()
}

// ===================== 滚动事件 =====================

function onScroll(pageIndex: number): void {
  if (store.settings.readerMode === 'SCROLL') {
    goToPage(pageIndex)
  }
}

// ===================== 键盘事件（H5） =====================

function onKeyDown(e: KeyboardEvent): void {
  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      prevPage()
      break
    case 'ArrowRight':
      e.preventDefault()
      nextPage()
      break
    case ' ':
      e.preventDefault()
      nextPage()
      break
    case 'Escape':
      store.hideToolbar()
      if (settingsVisible.value) toggleSettings()
      if (catalogVisible.value) hideCatalog()
      break
  }
}
</script>

<style>
.reader-root {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', SimSun, STSong, serif;
}

.reader-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

@media (min-width: 768px) {
  .reader-root {
    max-width: min(900px, 85vw);
    margin: 0 auto;
    border-left: 1px solid #eee;
    border-right: 1px solid #eee;
  }
}

.nr-back-indicator {
  position: fixed;
  top: env(safe-area-inset-top, 4px);
  left: 4px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px;
  color: #B8A088;
  font-size: 14px;
}

.nr-back-arrow {
  font-size: 24px;
  line-height: 1;
}

.nr-back-label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
