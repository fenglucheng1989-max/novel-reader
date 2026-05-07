<template>
  <view class="reader-root" :style="brightnessStyle">
    <!-- ==================== SCROLL mode ==================== -->
    <view v-if="readerStore.setting.turnMode === 'SCROLL'" class="reader" :style="pageStyle" @tap="onContentTap">
      <scroll-view class="content-scroll" scroll-y :scroll-top="scrollTop" @scroll="onScroll">
        <view v-if="loading" class="empty">正在加载章节...</view>
        <view v-else-if="chapter" class="chapter-content" :style="textStyle">
          <text class="chapter-title">{{ chapter.title }}</text>
          <view v-for="(line, index) in paragraphs" :key="index" class="paragraph">{{ line }}</view>
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
      :theme="readerStore.setting.theme"
      :brightness="brightness"
      :initialPage="pageModePage"
      @prev="prevChapter"
      @next="nextChapter"
      @pageChange="onPageChange"
      @toggleTools="toggleTools"
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
  </view>
</template>

<script setup>
import { computed, ref, nextTick, watch, onBeforeUnmount, onMounted, getCurrentInstance } from 'vue'
import { onLoad, onUnload, onShow } from '@dcloudio/uni-app'
import { useReaderStore } from '../../store/reader'
import { useUserStore } from '../../store/user'
import { readerThemes, themeStyle } from '../../utils/reader'
import PageReader from './page-reader.vue'
import ReaderTopBar from './components/ReaderTopBar.vue'
import ReaderBottomBar from './components/ReaderBottomBar.vue'
import ReaderSettingSheet from './components/ReaderSettingSheet.vue'

const readerStore = useReaderStore()
const userStore = useUserStore()
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
const textStyle = computed(() => themeStyle(readerStore.setting))
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
  }
  if (restoreSavedProgress && userStore.isLoggedIn) {
    readerStore.loadProgress(bookId.value).then((res) => {
      if (res?.code === 200) restoreProgress(res.data)
    }).catch(() => {})
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

// ---- tools & setting ----
function onContentTap() {
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
  if (!bookId.value) return
  uni.navigateTo({ url: `/pages/book/detail?id=${bookId.value}` })
}

function onDiscussTap() {
  uni.showToast({ title: '评论功能即将上线', icon: 'none' })
}

function onMoreSettings() {
  uni.showToast({ title: '更多设置即将上线', icon: 'none' })
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
  width: 100%;
  margin-bottom: 16px;
  text-align: justify;
  white-space: normal;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.empty {
  padding-top: 120px;
  color: #81776c;
  text-align: center;
}
</style>
