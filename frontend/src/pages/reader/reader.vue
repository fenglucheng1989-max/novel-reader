<template>
  <view class="reader-root">
    <!-- ==================== SCROLL mode ==================== -->
    <view v-if="readerStore.setting.turnMode === 'SCROLL'" class="reader reader-brightness-layer" :style="{ ...pageStyle, ...brightnessStyle }" @tap="onContentTap">
      <scroll-view class="content-scroll" scroll-y :scroll-top="scrollTop" @scroll="onScroll">
        <view v-if="loading || !bookId" class="empty">正在加载章节...</view>
        <view v-else-if="chapter" class="chapter-content" :style="scrollTextStyle">
          <text class="chapter-title">{{ chapter.title }}</text>
          <view
            v-for="(line, index) in paragraphs"
            :key="index"
            :id="`paragraph-${index}`"
            class="paragraph"
            :class="{
              'paragraph-selected': selectedParagraph?.index === index,
              'paragraph-highlighted': !!paragraphHighlight(index)
            }"
            :style="paragraphHighlight(index) ? { backgroundColor: paragraphHighlight(index).color, borderBottom: '2px solid ' + (paragraphHighlight(index).color || '#FFEB3B') } : {}"
            @longpress.stop="openParagraphTools(line, index, $event)"
            @contextmenu.prevent.stop="openParagraphTools(line, index, $event)"
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
        </view>
        <view v-else class="empty">{{ loadFailed ? '章节不存在' : '正在加载章节...' }}</view>
      </scroll-view>
    </view>

    <!-- ==================== PAGE mode ==================== -->
    <view v-else-if="loading || !bookId" class="reader-page-loading reader-brightness-layer" :style="{ ...pageStyle, ...brightnessStyle }">
      <text>正在加载章节...</text>
    </view>

    <ViewPageReader
      v-else-if="rawContent"
      class="reader-brightness-layer"
      :key="`${readerRenderKey}-${bookId}`"
      ref="pageReaderRef"
      :chapter="currentChapter || readerStore.chapter"
      :title="chapter?.title || currentTitle"
      :content="currentContent || chapter?.content || ''"
      :prev-content="prevChapterContent"
      :next-content="nextChapterContent"
      :font-size="readerStore.setting.fontSize"
      :line-height="readerStore.setting.lineHeight"
      :margin-x="readerStore.setting.marginX"
      :margin-y="readerStore.setting.marginY"
      :paragraph-spacing="readerStore.setting.paragraphSpacing"
      :theme="readerStore.setting.theme"
      :turn-mode="readerStore.setting.turnMode"
      :brightness="brightness"
      :initial-page="pageModePage"
      :comments="chapterComments"
      :tools-visible="showTools && !settingVisible"
      @prev="prevChapter"
      @next="nextChapter"
      @pageChange="onPageChange"
      @toggleTools="toggleTools"
      @paragraphSelect="openParagraphToolsFromPage"
      @commentBubbleTap="showParagraphComments"
    />
    <view v-else class="reader-page-loading reader-brightness-layer" :style="{ ...pageStyle, ...brightnessStyle }">
      <text>{{ loadFailed ? '章节不存在' : '正在加载章节...' }}</text>
    </view>

    <!-- ==================== Tool layers ==================== -->
    <ReaderTopBar
      :key="`top-${readerRenderKey}`"
      :visible="showTools && !settingVisible"
      :title="currentTitle || chapter?.title || '阅读'"
      @back="goBack"
      @bookshelf="toggleBookshelf"
      @setting="toggleSetting"
    />

    <ReaderBottomBar
      :key="`bottom-${readerRenderKey}`"
      :visible="showTools && !settingVisible"
      :page-indicator="pageIndicator"
      :progress-percent="progressPercent"
      :is-night="readerStore.setting.theme === 'NIGHT'"
      :is-first-chapter="isFirstChapter"
      :is-last-chapter="isLastChapter"
      @prev="prevChapter"
      @next="nextChapter"
      @catalog="onCatalogTap"
      @night="toggleNight"
      @setting="toggleSetting"
    />

    <!-- ==================== Setting sheet ==================== -->
    <ReaderSettingSheet
      :visible="settingVisible"
      :setting="readerStore.setting"
      :brightness="brightness"
      :eye-protection="eyeProtection"
      @close="settingVisible = false"
      @update:setting="saveSetting"
      @update:brightness="onBrightnessChange"
      @update:eye-protection="onEyeProtectionChange"
      @more="onMoreSettings"
    />

    <view v-if="paragraphMenuVisible" class="paragraph-tools-hitarea" @tap.stop="clearParagraphTools" />
    <view
      v-if="paragraphMenuVisible"
      class="paragraph-tools-menu"
      :style="paragraphMenuStyle"
      @tap.stop
    >
      <view class="paragraph-tools-arrow" :style="paragraphMenuArrowStyle" />
      <button
        v-for="item in paragraphMenuItems"
        :key="item.key"
        class="paragraph-tools-item"
        @tap.stop="runParagraphTool(item.key)"
      >
        {{ item.label }}
      </button>
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
import { useHighlightStore } from '../../store/highlight'
import ViewPageReader from './components/ViewPageReader.vue'
import ReaderTopBar from './components/ReaderTopBar.vue'
import ReaderBottomBar from './components/ReaderBottomBar.vue'
import ReaderSettingSheet from './components/ReaderSettingSheet.vue'

const readerStore = useReaderStore()
const userStore = useUserStore()
const bookStore = useBookStore()
const highlightStore = useHighlightStore()
const instance = getCurrentInstance()
const bookId = ref('')
const chapterNo = ref(1)
const loading = ref(true)
const loadFailed = ref(false)
const showTools = ref(true)
const settingVisible = ref(false)
const scrollTop = ref(0)
const position = ref(0)
const pageModePage = ref(0)
const pageReaderRef = ref(null)
const brightness = ref(Number(uni.getStorageSync('readerBrightness') || 80))
const eyeProtection = ref(Boolean(uni.getStorageSync('readerEyeProtection') || false))
const currentChapter = ref(null)
const currentTitle = ref('')
const currentContent = ref('')
const selectedParagraph = ref(null)
const selectedStart = ref(0)
const selectedEnd = ref(0)
const activeRangeHandle = ref('')
const paragraphMenuVisible = ref(false)
const paragraphMenuStyle = ref({})
const paragraphMenuArrowStyle = ref({})
const paragraphComposerVisible = ref(false)
const typoFeedbackVisible = ref(false)
const feedbackText = ref('')
const feedbackSubmitting = ref(false)
const chapterComments = ref([])
const catalogVisible = ref(false)
const paragraphCommentsVisible = ref(false)
const chapterSwitching = ref(false)
const readerRenderKey = ref(0)
let autoPageTimer = null
let autoSaveTimer = null
let initializing = false
let showRetryTimer = null
const lastReaderRouteKey = 'reader:lastRoute'

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
  if (readerStore.setting.turnMode !== 'SCROLL') {
    const ref = pageReaderRef.value
    const total = getReaderExposeNumber(ref?.totalPages)
    const page = getReaderExposeNumber(ref?.currentPage)
    if (total > 1) {
      return `${page + 1} / ${total} 页`
    }
    return chapterIndicator.value
  }
  return chapterIndicator.value
})
const progressPercent = computed(() => {
  if (readerStore.setting.turnMode === 'SCROLL') {
    if (scrollContentHeight.value > 0) {
      const viewH = window?.innerHeight || 667
      const maxScroll = Math.max(0, scrollContentHeight.value - viewH)
      if (maxScroll <= 0) return 0
      return Math.min(100, Math.round((position.value / maxScroll) * 100))
    }
    return 0
  }
  const ref = pageReaderRef.value
  const total = getReaderExposeNumber(ref?.totalPages)
  const page = getReaderExposeNumber(ref?.currentPage)
  if (total > 1) {
    return Math.round((page / (total - 1)) * 100)
  }
  return 0
})
const paragraphs = computed(() => {
  if (!chapter.value?.content) return []
  return chapter.value.content
    .replace(/\r\n/g, '\n')
    .split(/\n{1,}|(?<=。|！|？|"|")\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
})
const chapterHighlights = computed(() =>
  highlightStore.getHighlightsByChapter(Number(bookId.value), Number(chapterNo.value))
)
function paragraphHighlight(index) {
  return chapterHighlights.value.find(h => Number(h.paragraphIndex) === Number(index))
}

function getReaderExposeNumber(value) {
  const raw = value && typeof value === 'object' && 'value' in value ? value.value : value
  const num = Number(raw || 0)
  return Number.isFinite(num) ? num : 0
}
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
const paragraphMenuItems = computed(() => {
  const count = selectedParagraph.value ? paragraphCommentCount(selectedParagraph.value.index) : 0
  return [
    { key: 'comment', label: `段评${count ? ` (${count})` : ''}` },
    { key: 'feedback', label: '反馈' },
    { key: 'copy', label: '复制' },
    { key: 'highlight', label: '划线' },
    { key: 'share', label: '分享' }
  ]
})
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
  const filters = [`brightness(${brightness.value / 100})`]
  if (eyeProtection.value) filters.push('sepia(0.25)', 'saturate(0.85)')
  return { filter: filters.join(' ') }
})

// ---- load ----
function applyChapterData(data) {
  currentChapter.value = { ...data }
  currentTitle.value = data.title || ''
  currentContent.value = data.content || ''
  readerStore.$patch({ chapter: data })
  saveLastReaderRoute()
  readerRenderKey.value += 1
  loadFailed.value = false
}

async function loadChapter({ restoreSavedProgress = true } = {}) {
  const cached = readerStore.getCachedChapter(bookId.value, chapterNo.value)
  loading.value = !cached
  loadFailed.value = false
  try {
    const res = cached
      ? { code: 200, message: 'success', data: cached, cached: true }
      : await readerStore.loadChapter(bookId.value, chapterNo.value)
    if (res?.code !== 200 || !res?.data?.content) {
      const recovered = await recoverMissingChapter()
      if (!recovered) {
        currentChapter.value = null
        currentTitle.value = ''
        currentContent.value = ''
        readerStore.$patch({ chapter: null })
        loadFailed.value = true
      }
    } else {
      applyChapterData(res.data)
      await nextTick()
      instance?.proxy?.$forceUpdate?.()
    }
  } catch (error) {
    currentChapter.value = null
    currentTitle.value = ''
    currentContent.value = ''
    readerStore.$patch({ chapter: null })
    loadFailed.value = true
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
  highlightStore.loadFromStorage()
  startAutoSave()
}

function saveLastReaderRoute() {
  if (!bookId.value || !chapterNo.value) return
  uni.setStorageSync(lastReaderRouteKey, {
    bookId: String(bookId.value),
    chapterNo: Number(chapterNo.value),
    at: Date.now()
  })
}

function getLastReaderRoute() {
  const last = uni.getStorageSync(lastReaderRouteKey)
  if (!last?.bookId || !last?.chapterNo) return null
  return last
}

async function recoverMissingChapter() {
  if (!bookId.value) {
    const last = getLastReaderRoute()
    if (last?.bookId) {
      await initReader({ bookId: last.bookId, chapterNo: last.chapterNo || 1 }, { force: true })
      return true
    }
    return false
  }
  const maxNo = Number(maxChapterNo.value || 0)
  if (maxNo && chapterNo.value > maxNo) {
    chapterNo.value = maxNo
    syncReaderUrl()
    await loadChapter({ restoreSavedProgress: false })
    return true
  }
  return false
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
  const current = Number(chapterNo.value || 1)
  const maxNo = Number(maxChapterNo.value || 0)
  const targets = [current - 1, current + 1, current + 2]
    .filter((no) => no > 0 && (!maxNo || no <= maxNo))
  targets.forEach((no) => {
    readerStore.preloadChapter(bookId.value, no).catch(() => {})
  })
}

async function ensureChapterPreloaded(no) {
  if (!bookId.value || !no) return null
  const cached = readerStore.getCachedChapter(bookId.value, no)
  if (cached) return cached
  try {
    return await readerStore.preloadChapter(bookId.value, no)
  } catch {
    return null
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
  const ref = pageReaderRef.value
  const total = Number(ref?.totalPages || 0)
  if (readerStore.setting.turnMode !== 'SCROLL' && total > 0) {
    if (pageIdx >= total - 2) {
      ensureChapterPreloaded(Number(chapterNo.value) + 1)
    }
    if (pageIdx <= 1 && Number(chapterNo.value) > 1) {
      ensureChapterPreloaded(Number(chapterNo.value) - 1)
    }
  }
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

function getViewportSize() {
  // #ifdef H5
  if (typeof window !== 'undefined') {
    return {
      width: window.innerWidth || 375,
      height: window.innerHeight || 667
    }
  }
  // #endif
  const sys = uni.getSystemInfoSync()
  return {
    width: sys.windowWidth || 375,
    height: sys.windowHeight || 667
  }
}

function getEventPoint(event, fallbackY) {
  const source = event?.touches?.[0] ||
    event?.changedTouches?.[0] ||
    event?.detail ||
    event ||
    {}
  const viewport = getViewportSize()
  const x = Number(source.clientX ?? source.x ?? source.pageX ?? viewport.width / 2)
  const y = Number(source.clientY ?? source.y ?? source.pageY ?? fallbackY ?? viewport.height / 2)
  return {
    x: Number.isFinite(x) ? x : viewport.width / 2,
    y: Number.isFinite(y) ? y : (fallbackY ?? viewport.height / 2)
  }
}

function positionParagraphMenu(point) {
  const viewport = getViewportSize()
  const menuWidth = Math.min(318, Math.max(260, viewport.width - 24))
  const menuHeight = 44
  const gap = 12
  const sidePadding = 10
  const topPadding = 10
  const bottomPadding = 12
  const desiredLeft = point.x - menuWidth / 2
  const left = Math.max(sidePadding, Math.min(desiredLeft, viewport.width - menuWidth - sidePadding))
  let top = point.y - menuHeight - gap
  let arrowTop = menuHeight - 1
  let arrowDirection = 'down'

  if (top < topPadding) {
    top = point.y + gap
    arrowTop = -5
    arrowDirection = 'up'
  }
  top = Math.max(topPadding, Math.min(top, viewport.height - menuHeight - bottomPadding))

  const arrowLeft = Math.max(14, Math.min(point.x - left - 6, menuWidth - 26))
  paragraphMenuStyle.value = {
    width: `${menuWidth}px`,
    left: `${left}px`,
    top: `${top}px`
  }
  paragraphMenuArrowStyle.value = {
    left: `${arrowLeft}px`,
    top: `${arrowTop}px`,
    transform: arrowDirection === 'down' ? 'rotate(45deg)' : 'rotate(225deg)'
  }
}

function openParagraphTools(text, index, event, toolbarY) {
  if (!text) return
  selectedParagraph.value = { text, index }
  selectedStart.value = Math.max(0, Math.floor(text.length * 0.36))
  selectedEnd.value = Math.min(text.length, Math.max(selectedStart.value + 4, Math.floor(text.length * 0.62)))
  paragraphComposerVisible.value = false
  typoFeedbackVisible.value = false
  paragraphCommentsVisible.value = false
  feedbackText.value = ''
  showTools.value = false
  settingVisible.value = false
  positionParagraphMenu(getEventPoint(event, toolbarY))
  paragraphMenuVisible.value = true
}

function openParagraphToolsFromPage(payload) {
  if (!payload?.text) return
  openParagraphTools(payload.text, payload.index, payload, payload.toolbarY)
}

function runParagraphTool(key) {
  paragraphMenuVisible.value = false
  if (key === 'comment') openParagraphComposer()
  else if (key === 'feedback') openTypoFeedback()
  else if (key === 'copy') copySelectedParagraph()
  else if (key === 'highlight') highlightParagraph()
  else if (key === 'share') shareParagraph()
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
  paragraphMenuVisible.value = false
  paragraphComposerVisible.value = true
  typoFeedbackVisible.value = false
}

function openTypoFeedback() {
  paragraphMenuVisible.value = false
  typoFeedbackVisible.value = true
  paragraphComposerVisible.value = false
}

function clearParagraphTools() {
  selectedParagraph.value = null
  selectedStart.value = 0
  selectedEnd.value = 0
  activeRangeHandle.value = ''
  paragraphMenuVisible.value = false
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

function highlightParagraph() {
  if (!selectedParagraph.value) return
  const quote = selectedText.value || selectedParagraph.value.text
  highlightStore.addHighlight({
    bookId: Number(bookId.value),
    bookTitle: chapter.value?.bookTitle || currentTitle.value || '',
    chapterNo: Number(chapterNo.value),
    paragraphIndex: selectedParagraph.value.index,
    quoteText: quote,
    color: 'rgba(255, 235, 59, 0.5)'
  })
  uni.showToast({ title: '已划线', icon: 'success' })
  clearParagraphTools()
}

function shareParagraph() {
  if (!selectedParagraph.value) return
  const quote = selectedText.value || selectedParagraph.value.text
  const title = chapter.value?.bookTitle || currentTitle.value || '阅读'
  uni.setClipboardData({
    data: `《${title}》\n\n${quote}`,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
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
function onContentTap(e) {
  if (selectedParagraph.value) {
    clearParagraphTools()
    return
  }
  if (settingVisible.value) {
    settingVisible.value = false
    return
  }
  if (readerStore.setting.turnMode === 'SCROLL') {
    const x = (e?.detail?.x ?? e?.changedTouches?.[0]?.clientX) || 0
    const width = window?.innerWidth || (uni.getSystemInfoSync().windowWidth || 375)
    const ratio = x / (width || 375)
    if (ratio < 0.3) { prevChapter(); return }
    if (ratio > 0.7) { nextChapter(); return }
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
  await switchChapter(Number(no || 1), { toLastPage: false })
}

function onMoreSettings() {
  uni.showToast({ title: '更多设置即将上线', icon: 'none' })
}

function onBrightnessChange(val) {
  brightness.value = Math.max(20, Math.min(100, Number(val) || 80))
  uni.setStorageSync('readerBrightness', brightness.value)
}

function onEyeProtectionChange(val) {
  eyeProtection.value = !!val
  uni.setStorageSync('readerEyeProtection', eyeProtection.value)
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
  await switchChapter(chapterNo.value - 1, { toLastPage: true })
}

async function nextChapter() {
  if (maxChapterNo.value && chapterNo.value >= maxChapterNo.value) {
    uni.showToast({ title: '已经是最后一章', icon: 'none' })
    return
  }
  await switchChapter(chapterNo.value + 1, { toLastPage: false })
}

async function switchChapter(targetChapterNo, { toLastPage = false } = {}) {
  if (chapterSwitching.value) return
  if (!bookId.value || !targetChapterNo) return
  chapterSwitching.value = true
  saveProgress().catch(() => {})
  try {
    const target = await ensureChapterPreloaded(targetChapterNo)
    if (!target?.content) {
      uni.showToast({ title: '章节不存在', icon: 'none' })
      return
    }
    stopAutoPage()
    chapterNo.value = Number(targetChapterNo)
    // Update data in-place so ViewPageReader stays mounted and repaginates
    currentChapter.value = { ...target }
    currentTitle.value = target.title || ''
    currentContent.value = target.content || ''
    readerStore.$patch({ chapter: target })
    saveLastReaderRoute()
    loadFailed.value = false
    pageModePage.value = toLastPage ? Number.MAX_SAFE_INTEGER : 0
    position.value = 0
    syncReaderUrl()
    await nextTick()
    if (toLastPage) {
      pageReaderRef.value?.goToLastPage()
    } else {
      pageReaderRef.value?.goToPage?.(0)
    }
    preloadAdjacentChapters()
    loadChapterComments()
    startAutoPage()
  } finally {
    chapterSwitching.value = false
  }
}

const scrollContentHeight = ref(0)

function onScroll(event) {
  position.value = Math.floor(event.detail.scrollTop || 0)
  const sh = Number(event.detail.scrollHeight || 0)
  if (sh) scrollContentHeight.value = sh
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

function startAutoSave() {
  stopAutoSave()
  autoSaveTimer = setInterval(() => {
    if (userStore.isLoggedIn && chapter.value) {
      saveProgress()
    }
  }, 5000)
}

function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
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
    if (!resolved.page) resolved.page = params.get('page') || ''
  }
  // #endif
  if (!resolved.bookId) {
    const last = getLastReaderRoute()
    if (last?.bookId) {
      resolved.bookId = last.bookId
      resolved.chapterNo = resolved.chapterNo || last.chapterNo || 1
    }
  }
  return resolved
}

function syncReaderUrl() {
  // #ifdef H5
  if (typeof window === 'undefined' || !bookId.value) return
  const nextHash = `/pages/reader/reader?bookId=${encodeURIComponent(bookId.value)}&chapterNo=${encodeURIComponent(chapterNo.value)}`
  if ((window.location.hash || '').replace(/^#/, '') === nextHash) return
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${nextHash}`)
  // #endif
}

async function initReader(query, options = {}) {
  if (initializing && !options.force) return
  initializing = true
  const resolved = resolveReaderQuery(query)
  bookId.value = resolved.bookId
  chapterNo.value = Number(resolved.chapterNo || 1)
  syncReaderUrl()
  pageModePage.value = resolved.page === 'last' ? Number.MAX_SAFE_INTEGER : Number(resolved.page || 0)
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
    await loadChapter({ restoreSavedProgress: !resolved.page })
    if (resolved.page === 'last') {
      await nextTick()
      pageReaderRef.value?.goToLastPage()
    }
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
  if (!targetBookId) return
  if (hasLoadedChapter(targetBookId, targetChapterNo)) {
    bookId.value = targetBookId
    chapterNo.value = targetChapterNo
    syncReaderUrl()
    return
  }
  await initReader({ bookId: targetBookId, chapterNo: targetChapterNo }, { force: true })
}

onLoad((query) => { initReader(query) })

onMounted(() => {
  if (showRetryTimer) clearTimeout(showRetryTimer)
  showRetryTimer = setTimeout(ensureReaderReady, 0)
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', ensureReaderReady)
  }
  // #endif
})

onShow(() => {
  if (showRetryTimer) clearTimeout(showRetryTimer)
  showRetryTimer = setTimeout(ensureReaderReady, 0)
})

onUnload(() => {
  if (showRetryTimer) clearTimeout(showRetryTimer)
  stopAutoPage()
  stopAutoSave()
  saveProgress()
})

onBeforeUnmount(() => {
  if (showRetryTimer) clearTimeout(showRetryTimer)
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window.removeEventListener('hashchange', ensureReaderReady)
  }
  // #endif
  stopAutoPage()
  stopAutoSave()
})
</script>

<style scoped>
.reader-root {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.reader-brightness-layer {
  width: 100%;
  height: 100%;
}

.reader-page-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8C7B62;
  font-size: 15px;
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

.paragraph-highlighted {
  padding: 2px 4px;
  border-radius: 3px;
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

.paragraph-tools-hitarea {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: transparent;
}

.paragraph-tools-menu {
  position: fixed;
  z-index: 41;
  display: flex;
  height: 44px;
  align-items: center;
  justify-content: space-between;
  overflow: visible;
  border-radius: 7px;
  background: rgba(19, 19, 19, 0.96);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
}

.paragraph-tools-arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: rgba(19, 19, 19, 0.96);
}

.paragraph-tools-item {
  flex: 1;
  height: 44px;
  min-width: 0;
  margin: 0;
  padding: 0 6px;
  border-radius: 0;
  border: 0;
  background: transparent;
  color: #FFFFFF;
  font-size: 13px;
  line-height: 44px;
  text-align: center;
}

.paragraph-tools-item::after {
  border: 0;
}

.paragraph-tools-item:active {
  background: rgba(255, 255, 255, 0.14);
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
