<template>
  <view class="page">
    <view v-if="userStore.isLoggedIn" class="page-action">
      <button class="refresh-link" @tap="refresh">刷新</button>
    </view>

    <view v-if="userStore.isLoggedIn" class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ bookStore.shelf.length }}</text>
        <text class="stat-label">藏书</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ readingCount }}</text>
        <text class="stat-label">在读</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ latestChapterNo }}</text>
        <text class="stat-label">最近章</text>
      </view>
    </view>

    <view v-if="!userStore.isLoggedIn" class="state-card">
      <text class="state-mark">未登录</text>
      <text class="state-title">登录后同步你的书架</text>
      <text class="state-subtitle">阅读进度、收藏和偏好会跟随账号保存。</text>
      <button class="primary-button" @tap="goMine">去登录</button>
    </view>

    <view v-else-if="loading" class="state-card">
      <text class="state-title">正在整理书架...</text>
      <text class="state-subtitle">马上就好。</text>
    </view>

    <view v-else-if="!bookStore.shelf.length" class="state-card">
      <text class="state-mark">空书架</text>
      <text class="state-title">还没有收藏的书</text>
      <text class="state-subtitle">去书城挑一本，下一次就能从这里继续读。</text>
      <button class="primary-button" @tap="goStore">去书城</button>
    </view>

    <view v-else class="shelf-list">
      <view v-for="item in bookStore.shelf" :key="item.shelfId" class="shelf-card" @tap="openBook(item)">
        <view class="book-row">
          <view class="cover">{{ coverText(item.book.title) }}</view>
          <view class="book-main">
            <view class="book-top">
              <text class="name">{{ item.book.title }}</text>
              <text class="tag">{{ item.book.status === 'COMPLETED' ? '完结' : '连载' }}</text>
            </view>
            <text class="meta">{{ item.book.author || '佚名' }} · {{ item.book.chapterCount || 0 }} 章</text>
            <text class="progress">读到第 {{ progressChapter(item) }} 章</text>
          </view>
        </view>

        <view v-if="item.book.description" class="description-wrap" @tap.stop>
          <view class="description" :class="{ collapsed: shouldFold(item.book.description) && !expanded[item.book.id] }">
            {{ item.book.description }}
          </view>
          <button v-if="shouldFold(item.book.description)" class="desc-toggle" @tap.stop="toggleDesc(item.book.id)">
            {{ expanded[item.book.id] ? '收起' : '展开' }}
          </button>
        </view>

        <view class="card-actions">
          <button class="read-button" @tap.stop="openBook(item)">继续阅读</button>
          <button class="ghost-button" @tap.stop="remove(item.book.id)">移出</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import { useUserStore } from '../../store/user'

const FOLD_THRESHOLD = 70
const bookStore = useBookStore()
const userStore = useUserStore()
const loading = ref(false)
const expanded = reactive({})

const readingCount = computed(() => bookStore.shelf.filter((item) => progressChapter(item) > 1).length)
const latestChapterNo = computed(() => {
  const chapters = bookStore.shelf.map((item) => progressChapter(item))
  return chapters.length ? Math.max(...chapters) : 0
})

async function refresh() {
  if (!userStore.isLoggedIn) {
    return
  }
  loading.value = true
  try {
    await bookStore.loadShelf()
  } finally {
    loading.value = false
  }
}

function openBook(item) {
  const chapterNo = progressChapter(item)
  uni.navigateTo({ url: `/pages/reader/reader?bookId=${item.book.id}&chapterNo=${chapterNo}` })
}

async function remove(bookId) {
  uni.showModal({
    title: '移出书架',
    content: '确定要把这本书移出书架吗？',
    success: async (res) => {
      if (!res.confirm) return
      await bookStore.removeShelf(bookId)
      await refresh()
    }
  })
}

function shouldFold(content) {
  return (content || '').length > FOLD_THRESHOLD
}

function toggleDesc(bookId) {
  expanded[bookId] = !expanded[bookId]
}

function goMine() {
  uni.switchTab({ url: '/pages/mine/mine' })
}

function goStore() {
  uni.switchTab({ url: '/pages/index/index' })
}

function progressChapter(item) {
  return Number(item.progress?.chapterNo || 1)
}

function coverText(title) {
  return (title || '书').slice(0, 2)
}

onShow(refresh)
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 18px 18px 88px;
  background: #f6f3ee;
  box-sizing: border-box;
}

.stat-value,
.stat-label,
.state-mark,
.state-title,
.state-subtitle,
.name,
.meta,
.progress {
  display: block;
}

.refresh-link {
  width: 44px;
  height: 26px;
  line-height: 26px;
  padding: 0;
  border-radius: 999px;
  background: transparent;
  color: #2f6f5e;
  font-size: 12px;
}

.page-action {
  display: flex;
  justify-content: flex-end;
  margin: -4px 0 8px;
}

.stats-card {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  padding: 16px 10px;
  border-radius: 8px;
  background: #20342d;
  color: #fff;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  min-width: 0;
  padding: 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 24px;
  font-weight: 800;
}

.stat-label {
  margin-top: 4px;
  color: #c8d6cf;
  font-size: 12px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.18);
}

.state-card {
  padding: 28px 22px;
  border-radius: 8px;
  background: #fff;
  text-align: center;
}

.state-mark {
  color: #9a6b45;
  font-size: 13px;
}

.state-title {
  margin-top: 8px;
  color: #1f2a26;
  font-size: 20px;
  font-weight: 800;
}

.state-subtitle {
  margin-top: 8px;
  color: #81776c;
  font-size: 14px;
  line-height: 22px;
}

.primary-button {
  width: 126px;
  height: 40px;
  line-height: 40px;
  margin-top: 18px;
  border-radius: 8px;
  background: #2f6f5e;
  color: #fff;
  font-size: 14px;
}

.shelf-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shelf-card {
  padding: 14px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(31, 42, 38, 0.06);
}

.book-row {
  display: flex;
}

.cover {
  flex: 0 0 76px;
  height: 104px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: linear-gradient(145deg, #355f50, #a7794e);
  color: #fff;
  font-size: 21px;
  font-weight: 800;
}

.book-main {
  min-width: 0;
  flex: 1;
  margin-left: 13px;
}

.book-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #202a26;
  font-size: 17px;
  font-weight: 800;
}

.tag {
  padding: 2px 7px;
  border-radius: 999px;
  background: #edf5f1;
  color: #2f6f5e;
  font-size: 11px;
}

.meta {
  margin-top: 6px;
  color: #81776c;
  font-size: 13px;
}

.progress {
  margin-top: 8px;
  color: #9a6b45;
  font-size: 13px;
}

.description-wrap {
  position: relative;
  margin-top: 12px;
  padding: 10px 12px 30px;
  border-radius: 8px;
  background: #f8f5ef;
}

.description {
  color: #5b5148;
  font-size: 13px;
  line-height: 21px;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.description.collapsed {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.desc-toggle {
  position: absolute;
  right: 12px;
  bottom: 4px;
  width: auto;
  height: 24px;
  line-height: 24px;
  padding: 0;
  background: transparent;
  color: #2f6f5e;
  font-size: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.read-button,
.ghost-button {
  height: 32px;
  line-height: 32px;
  border-radius: 7px;
  font-size: 12px;
}

.read-button {
  flex: 1;
  background: #2f6f5e;
  color: #fff;
}

.ghost-button {
  width: 58px;
  background: #f1e7dc;
  color: #7a5136;
}
</style>
