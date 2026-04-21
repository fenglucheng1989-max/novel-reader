<template>
  <view class="reader" :style="pageStyle" @tap="toggleTools">
    <view v-if="showTools" class="reader-top">
      <button class="tool" @tap.stop="goBack">返回</button>
      <text class="top-title">{{ chapter ? chapter.title : '阅读' }}</text>
      <button class="tool" @tap.stop="openSetting">设置</button>
    </view>

    <scroll-view class="content-scroll" scroll-y :scroll-top="scrollTop" @scroll="onScroll">
      <view v-if="loading" class="empty">正在加载章节...</view>
      <view v-else-if="chapter" class="chapter-content" :style="textStyle">
        <text class="chapter-title">{{ chapter.title }}</text>
        <view v-for="(line, index) in paragraphs" :key="index" class="paragraph">{{ line }}</view>
      </view>
      <view v-else class="empty">章节不存在</view>
    </scroll-view>

    <view v-if="showTools" class="reader-bottom">
      <button class="nav" @tap.stop="prevChapter">上一章</button>
      <text class="chapter-indicator">第 {{ chapterNo }} 章</text>
      <button class="nav" @tap.stop="nextChapter">下一章</button>
    </view>

    <view v-if="settingVisible" class="setting" @tap.stop>
      <view class="setting-row">
        <text>字号</text>
        <view class="stepper">
          <button @tap="changeFont(-1)">-</button>
          <text>{{ readerStore.setting.fontSize }}</text>
          <button @tap="changeFont(1)">+</button>
        </view>
      </view>
      <view class="setting-row">
        <text>行距</text>
        <view class="stepper">
          <button @tap="changeLineHeight(-2)">-</button>
          <text>{{ readerStore.setting.lineHeight }}</text>
          <button @tap="changeLineHeight(2)">+</button>
        </view>
      </view>
      <view class="setting-row">
        <text>主题</text>
        <view class="themes">
          <button :class="{ active: readerStore.setting.theme === 'DEFAULT' }" class="theme" @tap="setTheme('DEFAULT')">米白</button>
          <button :class="{ active: readerStore.setting.theme === 'GREEN' }" class="theme" @tap="setTheme('GREEN')">清绿</button>
          <button :class="{ active: readerStore.setting.theme === 'NIGHT' }" class="theme" @tap="setTheme('NIGHT')">夜间</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useReaderStore } from '../../store/reader'
import { useUserStore } from '../../store/user'
import { readerThemes, themeStyle } from '../../utils/reader'

const readerStore = useReaderStore()
const userStore = useUserStore()
const bookId = ref('')
const chapterNo = ref(1)
const loading = ref(false)
const showTools = ref(true)
const settingVisible = ref(false)
const scrollTop = ref(0)
const position = ref(0)

const chapter = computed(() => readerStore.chapter)
const paragraphs = computed(() => {
  if (!chapter.value?.content) return []
  return chapter.value.content
    .replace(/\r\n/g, '\n')
    .split(/\n{1,}|(?<=。|！|？|”)\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
})
const textStyle = computed(() => themeStyle(readerStore.setting))
const pageStyle = computed(() => {
  const theme = readerThemes[readerStore.setting.theme] || readerThemes.DEFAULT
  return { backgroundColor: theme.background }
})

async function loadChapter() {
  loading.value = true
  try {
    await readerStore.loadChapter(bookId.value, chapterNo.value)
    if (userStore.isLoggedIn) {
      const res = await readerStore.loadProgress(bookId.value)
      restoreProgress(res.data)
    }
  } catch (error) {
    readerStore.chapter = null
  } finally {
    loading.value = false
  }
}

function restoreProgress(progress) {
  if (!progress || Number(progress.chapterNo) !== Number(chapterNo.value)) {
    scrollTop.value = 0
    position.value = 0
    return
  }
  const savedPosition = Number(progress.position || 0)
  position.value = savedPosition
  setTimeout(() => {
    scrollTop.value = savedPosition
  }, 80)
}

function toggleTools() {
  if (settingVisible.value) {
    settingVisible.value = false
    return
  }
  showTools.value = !showTools.value
}

function openSetting() {
  settingVisible.value = !settingVisible.value
}

function goBack() {
  saveProgress()
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
  saveProgress()
  chapterNo.value -= 1
  resetScroll()
  await loadChapter()
}

async function nextChapter() {
  saveProgress()
  chapterNo.value += 1
  resetScroll()
  await loadChapter()
  if (!chapter.value) {
    chapterNo.value -= 1
    uni.showToast({ title: '已经是最后一章', icon: 'none' })
    await loadChapter()
  }
}

function resetScroll() {
  position.value = 0
  scrollTop.value = 0
}

function onScroll(event) {
  position.value = Math.floor(event.detail.scrollTop || 0)
}

function changeFont(delta) {
  const next = Math.max(14, Math.min(30, readerStore.setting.fontSize + delta))
  saveSetting({ fontSize: next })
}

function changeLineHeight(delta) {
  const next = Math.max(24, Math.min(48, readerStore.setting.lineHeight + delta))
  saveSetting({ lineHeight: next })
}

function setTheme(theme) {
  saveSetting({ theme })
}

function saveSetting(setting) {
  if (userStore.isLoggedIn) {
    readerStore.saveSetting(setting)
  } else {
    readerStore.updateLocalSetting(setting)
  }
}

function saveProgress() {
  if (!userStore.isLoggedIn || !chapter.value) {
    return
  }
  readerStore.saveProgress(bookId.value, {
    chapterId: chapter.value.id,
    chapterNo: chapterNo.value,
    position: position.value,
    progressPercent: 0,
    durationSeconds: 0
  })
}

onLoad((query) => {
  bookId.value = query.bookId
  chapterNo.value = Number(query.chapterNo || 1)
  if (userStore.isLoggedIn) {
    readerStore.loadSetting()
  }
  loadChapter()
})

onUnload(saveProgress)
</script>

<style scoped>
.reader {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
}

.reader-top,
.reader-bottom {
  position: fixed;
  left: 50%;
  right: auto;
  width: min(100vw, 480px);
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.95);
  box-sizing: border-box;
}

.reader-top {
  top: 0;
}

.reader-bottom {
  bottom: 0;
}

.top-title {
  min-width: 0;
  flex: 1;
  padding: 0 10px;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2f3834;
  font-size: 14px;
}

.tool,
.nav {
  height: 34px;
  line-height: 34px;
  border-radius: 6px;
  background: #2f6f5e;
  color: #fff;
  font-size: 13px;
}

.tool {
  width: 62px;
}

.nav {
  width: 88px;
}

.chapter-indicator {
  color: #62584d;
  font-size: 13px;
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

.setting {
  position: fixed;
  left: 50%;
  right: auto;
  width: min(calc(100vw - 24px), 456px);
  bottom: 62px;
  z-index: 11;
  transform: translateX(-50%);
  padding: 14px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(31, 42, 38, 0.18);
}

@media (max-width: 480px) {
  .reader-top,
  .reader-bottom {
    left: 0;
    right: 0;
    width: 100vw;
    transform: none;
  }

  .setting {
    left: 12px;
    right: 12px;
    width: auto;
    transform: none;
  }
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0;
  color: #26312d;
  font-size: 14px;
}

.stepper,
.themes {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stepper button,
.theme {
  width: 50px;
  height: 30px;
  line-height: 30px;
  border-radius: 6px;
  background: #f1e7dc;
  color: #3f4a45;
  font-size: 13px;
}

.theme.active {
  background: #2f6f5e;
  color: #fff;
}
</style>
