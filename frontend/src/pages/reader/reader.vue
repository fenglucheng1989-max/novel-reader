<template>
  <view class="reader-root" :style="brightnessStyle">
    <!-- ==================== SCROLL mode ==================== -->
    <view v-if="readerStore.setting.turnMode === 'SCROLL'" class="reader" :style="pageStyle" @tap="onContentTap">
      <scroll-view class="content-scroll" scroll-y :scroll-top="scrollTop" @scroll="onScroll">
        <view v-if="loading" class="empty">正在加载章节...</view>
        <view v-else-if="chapter" class="chapter-content" :style="scrollTextStyle">
          <text class="chapter-title">{{ chapter.title }}</text>
          <view
            v-for="(line, index) in paragraphs"
            :key="index"
            :id="`paragraph-${index}`"
            class="paragraph"
            :class="{ 'paragraph-selected': selectedParagraph?.index === index }"
            @longpress.stop="openParagraphTools(line, index, $event)"
          >
            <template v-if="selectedParagraph?.index === index">
              <text>{{ selectedParts(line).before }}</text>
              <text class="selected-text">{{ selectedParts(line).selected }}</text>
              <text>{{ selectedParts(line).after }}</text>
              <text
                class="selection-handle handle-start"
                @touchstart.stop="startRangeHandle('start')"
                @touchmove.stop.prevent="moveRangeHandle($event, line)"
                @touchend.stop="stopRangeHandle"
                @mousedown.stop="startRangeHandle('start')"
              />
              <text
                class="selection-handle handle-end"
                @touchstart.stop="startRangeHandle('end')"
                @touchmove.stop.prevent="moveRangeHandle($event, line)"
                @touchend.stop="stopRangeHandle"
                @mousedown.stop="startRangeHandle('end')"
              />
            </template>
            <template v-else>{{ line }}</template>
            <text v-if="paragraphCommentCount(index)" class="paragraph-bubble" @tap.stop="showParagraphComments(index)">
              {{ paragraphCommentCount(index) }}
            </text>
          </view>
          <ChapterEndPanel
            v-if="chapter"
            mode="inline"
            :book-id="bookId"
            :chapter-no="chapterNo"
            :chapter-id="chapter.id"
            :max-chapter-no="maxChapterNo"
            :show-comments="readerStore.setting.showComments"
            @next="nextChapter"
            @back-to-detail="goBack"
            @go-to-book="goDetail"
          />
        </view>
        <view v-else class="empty">章节不存在</view>
      </scroll-view>
    </view>

    <!-- ==================== PAGE mode ==================== -->
    <PageReader
      v-else
      :key="bookId"
      ref="pageReaderRef"
      :content="rawContent"
      :prevContent="prevChapterContent"
      :nextContent="nextChapterContent"
      :fontSize="readerStore.setting.fontSize"
      :lineHeight="readerStore.setting.lineHeight"
      :marginX="readerStore.setting.marginX"
      :marginY="readerStore.setting.marginY"
      :paragraphSpacing="readerStore.setting.paragraphSpacing"
      :theme="readerStore.setting.theme"
      :brightness="brightness"
      :initialPage="pageModePage"
      :comments="chapterComments"
      @prev="prevChapter"
      @next="nextChapter"
      @chapterEnd="onChapterEnd"
      @pageChange="onPageChange"
      @toggleTools="toggleTools"
      @paragraphSelect="openCanvasParagraphTools"
      @commentBubbleTap="showParagraphComments"
    />

    <!-- ==================== Tool layers ==================== -->
    <ReaderTopBar
      :visible="showTools && !settingVisible"
      :title="currentTitle || chapter?.title || '阅读'"
      @back="goBack"
      @bookshelf="toggleBookshelf"
      @setting="toggleSetting"
    />

    <ReaderBottomBar
      :visible="showTools && !settingVisible"
      :page-indicator="pageIndicator"
      :progress-percent="progressPercent"
      :is-night="readerStore.setting.theme === 'NIGHT'"
      :is-first-chapter="isFirstChapter"
      :is-last-chapter="isLastChapter"
      @prev="prevChapter"
      @next="nextChapter"
      @catalog="onCatalogTap"
      @discuss="onDiscussTap"
      @night="toggleNight"
      @setting="toggleSetting"
    />

    <!-- ==================== Setting sheet ==================== -->
    <ReaderSettingSheet
      :visible="settingVisible"
      :setting="readerStore.setting"
      :brightness="brightness"
      @close="settingVisible = false"
      @update:setting="saveSetting"
      @update:brightness="onBrightnessChange"
      @more="onMoreSettings"
    />

    <ChapterEndPanel
      v-if="showChapterEndOverlay"
      mode="overlay"
      :book-id="bookId"
      :chapter-no="chapterNo"
      :chapter-id="chapter?.id"
      :max-chapter-no="maxChapterNo"
      :show-comments="readerStore.setting.showComments"
      @next="onPanelNextChapter"
      @back-to-detail="goBack"
      @close="showChapterEndOverlay = false"
      @go-to-book="goDetail"
    />

    <view v-if="selectedParagraph" class="selection-backdrop" @tap.stop="clearParagraphTools" />
    <view
      v-if="selectedParagraph && !paragraphComposerVisible && !typoFeedbackVisible"
      class="selection-bubble"
      :style="selectionToolbarStyle"
      @tap.stop
    >
      <view class="bubble-action" @tap.stop="openParagraphComposer">
        <text class="bubble-icon">✎</text>
        <text class="bubble-label">段评</text>
      </view>
      <view class="bubble-action" @tap.stop="openTypoFeedback">
        <text class="bubble-icon">!</text>
        <text class="bubble-label">反馈</text>
      </view>
      <view class="bubble-action" @tap.stop="copySelectedParagraph">
        <text class="bubble-icon">⎘</text>
        <text class="bubble-label">复制</text>
      </view>
      <view
        v-if="selectedParagraph && paragraphCommentCount(selectedParagraph.index)"
        class="bubble-badge"
      >{{ paragraphCommentCount(selectedParagraph.index) }}</view>
    </view>

    <view v-if="paragraphComposerVisible || typoFeedbackVisible" class="paragraph-feedback-sheet" @tap.stop>
      <text class="feedback-title">{{ typoFeedbackVisible ? '错字反馈' : '写段评' }}</text>
      <text class="feedback-quote">{{ selectedText }}</text>
      <textarea
        v-model="feedbackText"
        class="feedback-input"
        maxlength="500"
        auto-height
        :placeholder="typoFeedbackVisible ? '说明错字或建议修改内容' : '写下你对这一段的想法'"
      />
      <view class="feedback-actions">
        <button class="feedback-cancel" @tap.stop="clearParagraphTools">取消</button>
        <button class="feedback-submit" :disabled="feedbackSubmitting" @tap.stop="submitParagraphFeedback">
          {{ feedbackSubmitting ? '提交中' : '提交' }}
        </button>
      </view>
    </view>

    <view v-if="catalogVisible" class="reader-sheet-mask" @tap.stop="catalogVisible = false" />
    <view v-if="catalogVisible" class="catalog-sheet" @tap.stop>
      <view class="sheet-handle" />
      <view class="catalog-head">
        <text class="catalog-title">目录</text>
        <text class="catalog-sub">{{ chapterNo }} / {{ maxChapterNo || '?' }} 章</text>
      </view>
      <scroll-view class="catalog-list" scroll-y>
        <view
          v-for="item in readerStore.chapters"
          :key="item.id"
          class="catalog-item"
          :class="{ active: Number(item.chapterNo) === Number(chapterNo) }"
          @tap="jumpChapter(item.chapterNo)"
        >
          <text class="catalog-item-title">{{ item.title }}</text>
          <text class="catalog-item-meta">{{ item.wordCount || 0 }} 字</text>
        </view>
      </scroll-view>
    </view>

    <view v-if="paragraphCommentsVisible" class="reader-sheet-mask" @tap.stop="paragraphCommentsVisible = false" />
    <view v-if="paragraphCommentsVisible" class="paragraph-comments-sheet" @tap.stop>
      <view class="sheet-handle" />
      <text class="feedback-title">本段评论</text>
      <text class="feedback-quote">{{ selectedParagraph?.text || '这一段' }}</text>
      <view v-if="selectedParagraphComments.length" class="paragraph-comment-list">
        <view v-for="item in selectedParagraphComments" :key="item.id" class="paragraph-comment-item">
          <text class="paragraph-comment-user">{{ item.username || '读者' }}</text>
          <text class="paragraph-comment-text">{{ item.content }}</text>
        </view>
      </view>
      <text v-else class="paragraph-comment-empty">暂无段评</text>
      <button class="feedback-submit full" @tap.stop="openParagraphComposer">写段评</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, nextTick, watch, onBeforeUnmount, onMounted, getCurrentInstance } from 'vue'
import { onLoad, onUnload, onShow } from '@dcloudio/uni-app'
import { useReaderStore } from '../../store/reader'
import { useUserStore } from '../../store/user'
import { useBookStore } from '../../store/book'
import { readerThemes, themeStyle } from '../../utils/reader'
import PageReader from './page-reader.vue'
import ReaderTopBar from './components/ReaderTopBar.vue'
import ReaderBottomBar from './components/ReaderBottomBar.vue'
import ReaderSettingSheet from './components/ReaderSettingSheet.vue'
import ChapterEndPanel from '../../components/ChapterEndPanel.vue'

const readerStore = useReaderStore()
const userStore = useUserStore()
const bookStore = useBookStore()
const instance = getCurrentInstance()
const bookId = ref('')
const chapterNo = ref(1)
const loading = ref(false)
const showTools = ref(true)
const settingVisible = ref(false)
const scrollTop = ref(0)
const position = ref(0)
const pageModePage = ref(0)
const pageReaderRef = ref(null)
const brightness = ref(Number(uni.getStorageSync('readerBrightness') || 80))
const currentChapter = ref(null)
const currentTitle = ref('')
const currentContent = ref('')
const showChapterEndOverlay = ref(false)
const selectedParagraph = ref(null)
const selectedStart = ref(0)
const selectedEnd = ref(0)
const selectionToolbarTop = ref(0)
const activeRangeHandle = ref('')
const paragraphComposerVisible = ref(false)
const typoFeedbackVisible = ref(false)
const feedbackText = ref('')
const feedbackSubmitting = ref(false)
const chapterComments = ref([])
const catalogVisible = ref(false)
const paragraphCommentsVisible = ref(false)
let autoPageTimer = null
let initializing = false
let showRetryTimer = null

// ---- computed ----
const chapter = computed(() => currentChapter.value || readerStore.chapter)
const rawContent = computed(() => currentContent.value || chapter.value?.content || '')
const maxChapterNo = computed(() => {
  const list = readerStore.chapters || []
  return list.length ? Math.max(...list.map((item) => Number(item.chapterNo || 0))) : 0
})
const isFirstChapter = computed(() => chapterNo.value <= 1)
const isLastChapter = computed(() => maxChapterNo.value > 0 && chapterNo.value >= maxChapterNo.value)
const cachedPrevChapter = computed(() => {
  if (chapterNo.value <= 1) return null
  return readerStore.getCachedChapter(bookId.value, chapterNo.value - 1)
})
const cachedNextChapter = computed(() => {
  if (maxChapterNo.value && chapterNo.value >= maxChapterNo.value) return null
  return readerStore.getCachedChapter(bookId.value, chapterNo.value + 1)
})
const prevChapterContent = computed(() => cachedPrevChapter.value?.content || '')
const nextChapterContent = computed(() => cachedNextChapter.value?.content || '')
const chapterIndicator = computed(() => {
  if (!maxChapterNo.value) return `第 ${chapterNo.value} 章`
  return `第 ${chapterNo.value} / ${maxChapterNo.value} 章`
})
const pageIndicator = computed(() => {
  if (readerStore.setting.turnMode === 'PAGE') {
    return pageReaderRef.value?.totalPages ? `${pageReaderRef.value.currentPage + 1} / ${pageReaderRef.value.totalPages} 页` : ''
  }
  return chapterIndicator.value
})
const progressPercent = computed(() => {
  const list = readerStore.chapters || []
  if (!list.length) return 0
  return Math.round((chapterNo.value / list.length) * 100)
})
const paragraphs = computed(() => {
  if (!chapter.value?.content) return []
  return chapter.value.content
    .replace(/\r\n/g, '\n')
    .split(/\n{1,}|(?<=。|！|？|"|")\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
})
const selectedParagraphComments = computed(() => {
  if (!selectedParagraph.value) return []
  return chapterComments.value.filter((item) => Number(item.paragraphIndex) === Number(selectedParagraph.value.index))
})
const selectedText = computed(() => {
  const text = selectedParagraph.value?.text || ''
  if (!text) return ''
  const start = Math.max(0, Math.min(selectedStart.value, selectedEnd.value))
  const end = Math.max(start + 1, Math.max(selectedStart.value, selectedEnd.value))
  return text.slice(start, Math.min(end, text.length))
})
const selectionToolbarStyle = computed(() => ({
  top: `${selectionToolbarTop.value || 120}px`
}))
const textStyle = computed(() => themeStyle(readerStore.setting))
const scrollTextStyle = computed(() => ({
  ...textStyle.value,
  padding: `62px ${readerStore.setting.marginX || 22}px 82px`,
  '--paragraph-spacing': `${16 + Number(readerStore.setting.paragraphSpacing || 0)}px`
}))
const pageStyle = computed(() => {
  const theme = readerThemes[readerStore.setting.theme] || readerThemes.DEFAULT
  return { backgroundColor: theme.background }
})
const brightnessStyle = computed(() => {
  const pct = brightness.value / 100
  return { filter: `brightness(${pct})` }
})

// ---- load ----
async function loadChapter({ restoreSavedProgress = true } = {}) {
  loading.value = true
  try {
    const res = await readerStore.loadChapter(bookId.value, chapterNo.value)
    if (res?.code !== 200 || !res?.data?.content) {
      currentChapter.value = null
      currentTitle.value = ''
      currentContent.value = ''
      readerStore.$patch({ chapter: null })
    } else {
      currentChapter.value = { ...res.data }
      currentTitle.value = res.data.title || ''
      currentContent.value = res.data.content || ''
      await nextTick()
      instance?.proxy?.$forceUpdate?.()
    }
  } catch (error) {
    currentChapter.value = null
    currentTitle.value = ''
    currentContent.value = ''
    readerStore.$patch({ chapter: null })
  } finally {
    loading.value = false
    preloadAdjacentChapters()
    loadChapterComments()
  }
  if (restoreSavedProgress && userStore.isLoggedIn) {
    readerStore.loadProgress(bookId.value).then((res) => {
      if (res?.code === 200) restoreProgress(res.data)
    }).catch(() => {})
  }
}

async function loadChapterComments() {
  if (!chapter.value?.id) {
    chapterComments.value = []
    return
  }
  try {
    const res = await bookStore.loadChapterComments(chapter.value.id, 1, 80)
    chapterComments.value = res.code === 200 ? (res.data?.records || []) : []
  } catch {
    chapterComments.value = []
  }
}

function preloadAdjacentChapters() {
  if (!bookId.value) return
  if (chapterNo.value > 1) {
    readerStore.preloadChapter(bookId.value, chapterNo.value - 1).catch(() => {})
  }
  if (!maxChapterNo.value || chapterNo.value < maxChapterNo.value) {
    readerStore.preloadChapter(bookId.value, chapterNo.value + 1).catch(() => {})
  }
}

function restoreProgress(progress) {
  if (!progress || Number(progress.chapterNo) !== Number(chapterNo.value)) {
    scrollTop.value = 0
    position.value = 0
    pageModePage.value = 0
    return
  }
  const savedPosition = Number(progress.position || 0)
  position.value = savedPosition
  if (readerStore.setting.turnMode === 'PAGE') {
    pageModePage.value = savedPosition
  } else {
    setTimeout(() => { scrollTop.value = savedPosition }, 80)
  }
}

function onPageChange(pageIdx) {
  pageModePage.value = pageIdx
  position.value = pageIdx
}

function paragraphCommentCount(index) {
  return chapterComments.value.filter((item) => Number(item.paragraphIndex) === Number(index)).length
}

function selectedParts(text) {
  const start = Math.max(0, Math.min(selectedStart.value, selectedEnd.value, text.length))
  const end = Math.max(start + 1, Math.min(Math.max(selectedStart.value, selectedEnd.value), text.length))
  return {
    before: text.slice(0, start),
    selected: text.slice(start, end),
    after: text.slice(end)
  }
}

function openParagraphTools(text, index, event, toolbarY) {
  if (!text) return
  selectedParagraph.value = { text, index }
  selectedStart.value = Math.max(0, Math.floor(text.length * 0.36))
  selectedEnd.value = Math.min(text.length, Math.max(selectedStart.value + 4, Math.floor(text.length * 0.62)))
  paragraphComposerVisible.value = false
  typoFeedbackVisible.value = false
  feedbackText.value = ''
  showTools.value = false
  settingVisible.value = false
  nextTick(() => updateSelectionToolbar(index, event, toolbarY))
}

function openCanvasParagraphTools(payload) {
  if (!payload?.text) return
  openParagraphTools(payload.text, payload.index, null, payload.toolbarY)
}

function updateSelectionToolbar(index, event, toolbarY) {
  let top = Number(toolbarY || 0)
  // #ifdef H5
  const el = typeof document !== 'undefined' ? document.getElementById(`paragraph-${index}`) : null
  const rect = el?.getBoundingClientRect?.()
  if (rect) {
    top = rect.bottom + 10
  } else if (event?.changedTouches?.[0]) {
    top = event.changedTouches[0].clientY + 28
  }
  const maxTop = Math.max(70, (window.innerHeight || 720) - 176)
  selectionToolbarTop.value = Math.max(56, Math.min(top || 116, maxTop))
  // #endif
  // #ifndef H5
  selectionToolbarTop.value = Math.max(56, top || 116)
  // #endif
}

function startRangeHandle(type) {
  activeRangeHandle.value = type
}

function stopRangeHandle() {
  activeRangeHandle.value = ''
}

function moveRangeHandle(event, text) {
  if (!activeRangeHandle.value || !text) return
  const touch = event.touches?.[0] || event.changedTouches?.[0]
  const clientX = touch?.clientX ?? event.clientX
  if (clientX == null) return
  let ratio = 0.5
  // #ifdef H5
  const el = typeof document !== 'undefined' ? document.getElementById(`paragraph-${selectedParagraph.value?.index}`) : null
  const rect = el?.getBoundingClientRect?.()
  if (rect?.width) ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  // #endif
  const pos = Math.max(0, Math.min(text.length, Math.round(text.length * ratio)))
  if (activeRangeHandle.value === 'start') {
    selectedStart.value = Math.min(pos, selectedEnd.value - 1)
  } else {
    selectedEnd.value = Math.max(pos, selectedStart.value + 1)
  }
}

function showParagraphComments(payload) {
  const index = typeof payload === 'object' ? payload.paragraphIndex : payload
  const text = selectedParagraph.value?.index === index
    ? selectedParagraph.value.text
    : (paragraphs.value[index] || '这一段')
  selectedParagraph.value = { text, index }
  paragraphComposerVisible.value = false
  typoFeedbackVisible.value = false
  paragraphCommentsVisible.value = true
  showTools.value = false
}

function openParagraphComposer() {
  paragraphComposerVisible.value = true
  typoFeedbackVisible.value = false
}

function openTypoFeedback() {
  typoFeedbackVisible.value = true
  paragraphComposerVisible.value = false
}

function clearParagraphTools() {
  selectedParagraph.value = null
  selectedStart.value = 0
  selectedEnd.value = 0
  activeRangeHandle.value = ''
  paragraphComposerVisible.value = false
  typoFeedbackVisible.value = false
  paragraphCommentsVisible.value = false
  feedbackText.value = ''
  feedbackSubmitting.value = false
}

function copySelectedParagraph() {
  if (!selectedParagraph.value?.text) return
  uni.setClipboardData({
    data: selectedText.value || selectedParagraph.value.text,
    success: () => {
      uni.showToast({ title: '已复制', icon: 'success' })
      clearParagraphTools()
    }
  })
}

async function submitParagraphFeedback() {
  const content = feedbackText.value.trim()
  if (!content) {
    uni.showToast({ title: typoFeedbackVisible.value ? '请输入反馈内容' : '请输入段评内容', icon: 'none' })
    return
  }
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录后再提交', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/mine/mine' }), 800)
    return
  }
  if (!selectedParagraph.value || !chapter.value?.id) return
  feedbackSubmitting.value = true
  try {
    const isTypo = typoFeedbackVisible.value
    const res = await bookStore.createComment({
      bookId: Number(bookId.value),
      chapterId: Number(chapter.value.id),
      content,
      commentType: isTypo ? 'TYPO' : 'PARAGRAPH',
      paragraphIndex: selectedParagraph.value.index,
      quoteText: selectedText.value || selectedParagraph.value.text
    })
    if (res.code === 200) {
      if (!isTypo && res.data) {
        chapterComments.value = [res.data, ...chapterComments.value]
      }
      uni.showToast({ title: isTypo ? '反馈已提交' : '段评已发布', icon: 'success' })
      clearParagraphTools()
    }
  } finally {
    feedbackSubmitting.value = false
  }
}

// ---- tools & setting ----
function onContentTap() {
  if (selectedParagraph.value) {
    clearParagraphTools()
    return
  }
  if (settingVisible.value) {
    settingVisible.value = false
    return
  }
  showTools.value = !showTools.value
}

function toggleTools() {
  if (settingVisible.value) {
    settingVisible.value = false
    return
  }
  showTools.value = !showTools.value
}

function toggleSetting() {
  settingVisible.value = !settingVisible.value
}

function toggleBookshelf() {
  if (!bookId.value) return
  uni.showToast({ title: '已加入书架', icon: 'none' })
}

function toggleNight() {
  const next = readerStore.setting.theme === 'NIGHT' ? 'DEFAULT' : 'NIGHT'
  saveSetting({ theme: next })
}

function onCatalogTap() {
  catalogVisible.value = true
  showTools.value = false
}

async function jumpChapter(no) {
  catalogVisible.value = false
  await saveProgress()
  chapterNo.value = Number(no || 1)
  position.value = 0
  scrollTop.value = 0
  pageModePage.value = 0
  clearParagraphTools()
  await loadChapter({ restoreSavedProgress: false })
}

function onDiscussTap() {
  if (!readerStore.setting.showComments) {
    saveSetting({ showComments: true })
  }
  showChapterEndOverlay.value = true
  showTools.value = false
}

function onMoreSettings() {
  uni.showToast({ title: '更多设置即将上线', icon: 'none' })
}

function onChapterEnd() {
  showChapterEndOverlay.value = true
  stopAutoPage()
}

function onPanelNextChapter() {
  showChapterEndOverlay.value = false
  nextChapter()
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function onBrightnessChange(val) {
  brightness.value = Math.max(20, Math.min(100, Number(val) || 80))
  uni.setStorageSync('readerBrightness', brightness.value)
}

// ---- chapter nav ----
async function goBack() {
  await saveProgress()
  stopAutoPage()
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }
  if (bookId.value) {
    uni.redirectTo({ url: `/pages/book/detail?id=${bookId.value}` })
    return
  }
  uni.switchTab({ url: '/pages/index/index' })
}

async function prevChapter() {
  if (chapterNo.value <= 1) {
    uni.showToast({ title: '已经是第一章', icon: 'none' })
    return
  }
  await saveProgress()
  chapterNo.value -= 1
  position.value = 0
  scrollTop.value = 0
  await loadChapter({ restoreSavedProgress: false })
  pageModePage.value = Number.MAX_SAFE_INTEGER
  await nextTick()
  pageReaderRef.value?.goToLastPage()
  restartAutoPage()
}

async function nextChapter() {
  if (maxChapterNo.value && chapterNo.value >= maxChapterNo.value) {
    uni.showToast({ title: '已经是最后一章', icon: 'none' })
    return
  }
  await saveProgress()
  chapterNo.value += 1
  position.value = 0
  scrollTop.value = 0
  await loadChapter({ restoreSavedProgress: false })
  pageModePage.value = 0
  if (!chapter.value) {
    chapterNo.value -= 1
    uni.showToast({ title: '已经是最后一章', icon: 'none' })
    await loadChapter()
  }
  restartAutoPage()
}

function onScroll(event) {
  position.value = Math.floor(event.detail.scrollTop || 0)
}

// ---- auto page ----
function startAutoPage() {
  if (!readerStore.setting.autoPageEnabled) return
  stopAutoPage()
  const interval = (readerStore.setting.autoPageInterval || 15) * 1000
  autoPageTimer = setInterval(() => {
    if (settingVisible.value) return
    if (readerStore.setting.turnMode === 'PAGE' && pageReaderRef.value) {
      const total = pageReaderRef.value.totalPages || 0
      const cur = pageReaderRef.value.currentPage || 0
      if (cur < total - 1) {
        pageReaderRef.value.doFlip?.(1)
      } else {
        nextChapter()
      }
    }
  }, interval)
}

function stopAutoPage() {
  if (autoPageTimer) {
    clearInterval(autoPageTimer)
    autoPageTimer = null
  }
}

function restartAutoPage() {
  stopAutoPage()
  startAutoPage()
}

watch(() => readerStore.setting.autoPageEnabled, (enabled) => {
  if (enabled) startAutoPage()
  else stopAutoPage()
})

watch(() => readerStore.setting.autoPageInterval, () => {
  if (readerStore.setting.autoPageEnabled) restartAutoPage()
})

// ---- setting ----
function saveSetting(patch) {
  if (userStore.isLoggedIn) {
    readerStore.saveSetting(patch)
  } else {
    readerStore.updateLocalSetting(patch)
  }
}

async function saveProgress() {
  if (!userStore.isLoggedIn || !chapter.value) return null
  return readerStore.saveProgress(bookId.value, {
    chapterId: chapter.value.id,
    chapterNo: chapterNo.value,
    position: position.value,
    progressPercent: 0,
    durationSeconds: 0
  })
}

// ---- init ----
function resolveReaderQuery(query = {}) {
  const resolved = { ...(query || {}) }
  // #ifdef H5
  if ((!resolved.bookId || !resolved.chapterNo) && typeof window !== 'undefined') {
    const hash = window.location.hash || ''
    const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
    const params = new URLSearchParams(queryText)
    if (!resolved.bookId) resolved.bookId = params.get('bookId') || ''
    if (!resolved.chapterNo) resolved.chapterNo = params.get('chapterNo') || ''
  }
  // #endif
  return resolved
}

async function initReader(query) {
  if (initializing) return
  initializing = true
  const resolved = resolveReaderQuery(query)
  bookId.value = resolved.bookId
  chapterNo.value = Number(resolved.chapterNo || 1)
  pageModePage.value = 0
    if (!bookId.value) {
      currentChapter.value = null
      currentTitle.value = ''
      currentContent.value = ''
      readerStore.$patch({ chapter: null })
    uni.showToast({ title: '缺少书籍参数', icon: 'none' })
    initializing = false
    return
  }
  try {
    if (userStore.isLoggedIn) {
      readerStore.loadSetting().catch(() => {})
    }
    await readerStore.loadChapters(bookId.value)
    await loadChapter()
    startAutoPage()
  } finally {
    initializing = false
  }
}

function hasLoadedChapter(targetBookId, targetChapterNo) {
  const loaded = currentChapter.value || readerStore.chapter
  return !!loaded?.content &&
    String(loaded.bookId) === String(targetBookId) &&
    Number(loaded.chapterNo) === Number(targetChapterNo)
}

async function ensureReaderReady() {
  if (initializing) {
    showRetryTimer = setTimeout(ensureReaderReady, 120)
    return
  }
  const resolved = resolveReaderQuery()
  const targetBookId = resolved.bookId || bookId.value
  const targetChapterNo = Number(resolved.chapterNo || chapterNo.value || 1)
  if (!targetBookId || hasLoadedChapter(targetBookId, targetChapterNo)) return
  await initReader({ bookId: targetBookId, chapterNo: targetChapterNo })
}

onLoad((query) => { initReader(query) })

onMounted(() => {
  if (showRetryTimer) clearTimeout(showRetryTimer)
  showRetryTimer = setTimeout(ensureReaderReady, 0)
})

onShow(() => {
  if (showRetryTimer) clearTimeout(showRetryTimer)
  showRetryTimer = setTimeout(ensureReaderReady, 0)
})

onUnload(() => {
  if (showRetryTimer) clearTimeout(showRetryTimer)
  stopAutoPage()
  saveProgress()
})

onBeforeUnmount(() => {
  if (showRetryTimer) clearTimeout(showRetryTimer)
  stopAutoPage()
})
</script>

<style scoped>
.reader-root {
  width: 100%;
  min-height: 100vh;
}

.reader {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
}

.content-scroll {
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
}

.chapter-content {
  width: 100%;
  min-height: 100vh;
  padding: 62px 22px 82px;
  box-sizing: border-box;
  overflow-x: hidden;
}

.chapter-title {
  display: block;
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 700;
  line-height: 34px;
}

.paragraph {
  display: block;
  position: relative;
  width: 100%;
  margin-bottom: var(--paragraph-spacing, 16px);
  text-align: justify;
  white-space: normal;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.paragraph-selected {
  background: transparent;
}

.selected-text {
  background: rgba(180, 160, 140, 0.28);
  box-shadow: 0 0 0 3px rgba(180, 160, 140, 0.16);
}

.selection-handle {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3A3A3A;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.selection-handle::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 16px;
  width: 2px;
  height: 32px;
  background: #3A3A3A;
  opacity: 0.5;
}

.handle-start {
  left: -4px;
  top: 2px;
}

.handle-end {
  right: 4px;
  bottom: 2px;
}

.paragraph-bubble {
  display: inline-flex;
  min-width: 22px;
  height: 18px;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  padding: 0 5px;
  border-radius: 9px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.75);
  color: #8C8C8C;
  font-size: 11px;
  vertical-align: text-top;
}

.paragraph-bubble:active {
  background: rgba(58, 58, 58, 0.1);
  color: #3A3A3A;
}

.selection-backdrop {
  position: fixed;
  inset: 0;
  z-index: 34;
  background: transparent;
}

.selection-bubble {
  position: fixed;
  left: 50%;
  z-index: 35;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  overflow: visible;
  border-radius: 22px;
  background: rgba(40, 40, 40, 0.92);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
  transform: translateX(-50%);
  white-space: nowrap;
}

.bubble-action {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 36px;
  padding: 0 10px;
  border-radius: 18px;
  color: rgba(255, 255, 255, 0.9);
}

.bubble-action:active {
  background: rgba(255, 255, 255, 0.12);
}

.bubble-action + .bubble-action {
  margin-left: 2px;
}

.bubble-icon {
  font-size: 15px;
  line-height: 1;
}

.bubble-label {
  font-size: 12px;
  font-weight: 700;
}

.bubble-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 9px;
  background: #C4A882;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.paragraph-feedback-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 36;
  max-height: 64vh;
  overflow-y: auto;
  padding: 16px 18px calc(18px + env(safe-area-inset-bottom));
  border-radius: 18px 18px 0 0;
  background: #F8F8F6;
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.16);
}

.feedback-title {
  display: block;
  color: #1F1F1F;
  font-size: 17px;
  font-weight: 800;
}

.feedback-quote {
  display: block;
  max-height: 96px;
  margin-top: 10px;
  padding: 10px;
  overflow: hidden;
  border-left: 3px solid #3A3A3A;
  background: #F0F0ED;
  color: #5A5A5A;
  font-size: 14px;
  line-height: 21px;
}

.feedback-input {
  width: 100%;
  min-height: 86px;
  margin-top: 12px;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 8px;
  background: #F0F0ED;
  color: #1F1F1F;
  font-size: 14px;
  line-height: 21px;
}

.feedback-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.feedback-cancel,
.feedback-submit {
  flex: 1;
  height: 36px;
  line-height: 36px;
  margin: 0;
  border-radius: 8px;
  font-size: 14px;
}

.feedback-cancel {
  background: #F0F0ED;
  color: #8C8C8C;
}

.feedback-submit {
  background: #3A3A3A;
  color: #fff;
}

.feedback-submit.full {
  width: 100%;
  margin-top: 14px;
}

.reader-sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 32;
  background: rgba(0, 0, 0, 0.22);
}

.catalog-sheet,
.paragraph-comments-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 37;
  max-height: 72vh;
  overflow-y: auto;
  padding: 10px 18px calc(18px + env(safe-area-inset-bottom));
  border-radius: 18px 18px 0 0;
  background: #F8F8F6;
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.14);
}

.sheet-handle {
  width: 36px;
  height: 4px;
  margin: 0 auto 14px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.18);
}

.catalog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.catalog-title {
  color: #181818;
  font-size: 22px;
  font-weight: 900;
}

.catalog-sub {
  color: #8C8C8C;
  font-size: 13px;
}

.catalog-list {
  max-height: 54vh;
}

.catalog-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.catalog-item.active .catalog-item-title {
  color: #3A3A3A;
  font-weight: 900;
}

.catalog-item-title {
  min-width: 0;
  flex: 1;
  color: #3A3A3A;
  font-size: 16px;
}

.catalog-item-meta {
  color: #B0B0B0;
  font-size: 12px;
}

.paragraph-comment-list {
  margin-top: 12px;
}

.paragraph-comment-item {
  padding: 12px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.paragraph-comment-user {
  display: block;
  color: #3A3A3A;
  font-size: 13px;
  font-weight: 800;
}

.paragraph-comment-text {
  display: block;
  margin-top: 6px;
  color: #3A3A3A;
  font-size: 15px;
  line-height: 24px;
}

.paragraph-comment-empty {
  display: block;
  padding: 18px 0 6px;
  color: #B0B0B0;
  text-align: center;
  font-size: 14px;
}

.empty {
  padding-top: 120px;
  color: #8C8C8C;
  text-align: center;
}
</style>
