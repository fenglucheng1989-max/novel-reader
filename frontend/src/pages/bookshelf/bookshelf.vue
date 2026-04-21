<template>
  <view class="page">
    <view class="shelf-shell">
      <view v-if="userStore.isLoggedIn" class="toolbar">
        <view class="sync-pill">
          <text class="sync-dot"></text>
          <text>已同步 {{ bookStore.shelf.length }} 本</text>
        </view>
        <view class="toolbar-actions">
          <view class="icon-button" @tap="goSearch">⌕</view>
          <view v-if="bookStore.shelf.length" class="text-button" @tap="toggleEdit">
            {{ editMode ? '完成' : '编辑' }}
          </view>
        </view>
      </view>

      <view v-if="!userStore.isLoggedIn" class="state-card">
        <text class="state-mark">未登录</text>
        <text class="state-title">登录后同步你的书架</text>
        <text class="state-subtitle">阅读进度、收藏和偏好会跟随账号保存。</text>
        <view class="primary-button" @tap="goMine">去登录</view>
      </view>

      <view v-else-if="loading" class="state-card">
        <text class="state-title">正在整理书架...</text>
        <text class="state-subtitle">马上就好。</text>
      </view>

      <view v-else-if="!bookStore.shelf.length" class="state-card">
        <text class="state-mark">空书架</text>
        <text class="state-title">还没有收藏的书</text>
        <text class="state-subtitle">去书城挑一本，下一次就能从这里继续读。</text>
        <view class="primary-button" @tap="goStore">去书城</view>
      </view>

      <template v-else>
        <view v-if="latestItem" class="continue-card">
          <view class="continue-cover">{{ coverText(latestItem.book.title) }}</view>
          <view class="continue-main">
            <text class="continue-eyebrow">继续阅读</text>
            <text class="continue-title">{{ latestItem.book.title }}</text>
            <text class="continue-meta">读到第 {{ progressChapter(latestItem) }} 章 · {{ unreadText(latestItem) }}</text>
          </view>
          <view class="continue-action" @tap="openBook(latestItem)">去阅读</view>
        </view>

        <scroll-view class="filter-row" scroll-x>
          <view
            v-for="filter in filters"
            :key="filter.key"
            class="filter-chip"
            :class="{ active: activeFilter === filter.key }"
            @tap="selectFilter(filter.key)"
          >
            {{ filter.label }}
          </view>
        </scroll-view>

        <view class="summary-row">
          <text class="summary-title">{{ activeFilterLabel }}</text>
          <text class="summary-count">{{ filteredShelf.length }} 本</text>
        </view>

        <view v-if="!filteredShelf.length" class="state-card compact">
          <text class="state-title">当前筛选下暂无书籍</text>
          <text class="state-subtitle">切换到全部书籍看看。</text>
        </view>

        <view v-else class="shelf-grid">
          <view
            v-for="item in filteredShelf"
            :key="item.shelfId"
            class="book-card"
            :class="{ editing: editMode }"
            @tap="handleBookTap(item)"
          >
            <view class="cover-wrap">
              <view class="cover">{{ coverText(item.book.title) }}</view>
              <text v-if="remainingChapters(item) > 0" class="update-badge">更新</text>
              <view v-if="editMode" class="remove-dot" @tap.stop="remove(item.book.id)">×</view>
            </view>
            <text class="book-name">{{ item.book.title }}</text>
            <text class="book-progress">{{ unreadText(item) }}</text>
            <view v-if="editMode" class="remove-button" @tap.stop="remove(item.book.id)">移出</view>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import { useUserStore } from '../../store/user'

const bookStore = useBookStore()
const userStore = useUserStore()
const loading = ref(false)
const editMode = ref(false)
const activeFilter = ref('all')

const filters = [
  { key: 'all', label: '全部' },
  { key: 'reading', label: '在读' },
  { key: 'unread', label: '未读' },
  { key: 'serial', label: '连载' },
  { key: 'completed', label: '完结' }
]

const filteredShelf = computed(() => {
  if (activeFilter.value === 'reading') {
    return bookStore.shelf.filter((item) => progressChapter(item) > 1)
  }
  if (activeFilter.value === 'unread') {
    return bookStore.shelf.filter((item) => progressChapter(item) <= 1)
  }
  if (activeFilter.value === 'serial') {
    return bookStore.shelf.filter((item) => item.book.status !== 'COMPLETED')
  }
  if (activeFilter.value === 'completed') {
    return bookStore.shelf.filter((item) => item.book.status === 'COMPLETED')
  }
  return bookStore.shelf
})

const latestItem = computed(() => {
  return bookStore.shelf.find((item) => progressChapter(item) > 1) || bookStore.shelf[0]
})

const activeFilterLabel = computed(() => {
  return filters.find((item) => item.key === activeFilter.value)?.label || '全部'
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

function selectFilter(key) {
  activeFilter.value = key
}

function toggleEdit() {
  editMode.value = !editMode.value
}

function handleBookTap(item) {
  if (editMode.value) {
    return
  }
  openBook(item)
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
      if (!bookStore.shelf.length) {
        editMode.value = false
      }
    }
  })
}

function goMine() {
  uni.switchTab({ url: '/pages/mine/mine' })
}

function goStore() {
  uni.switchTab({ url: '/pages/index/index' })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/search' })
}

function progressChapter(item) {
  return Number(item.progress?.chapterNo || 1)
}

function remainingChapters(item) {
  const total = Number(item.book.chapterCount || 0)
  if (!total) return 0
  return Math.max(total - progressChapter(item), 0)
}

function unreadText(item) {
  if (!Number(item.book.chapterCount || 0)) {
    return '暂无章节'
  }
  const count = remainingChapters(item)
  return count > 0 ? `${count} 章未读` : '已读完'
}

function coverText(title) {
  return (title || '书').slice(0, 2)
}

onShow(refresh)
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 14px 14px 88px;
  background: #f6f3ee;
  box-sizing: border-box;
}

.shelf-shell {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.sync-pill {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #6f655b;
  font-size: 13px;
}

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d99a45;
}

.toolbar-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-button,
.text-button {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e5ddd2;
  color: #25332e;
  font-weight: 800;
}

.icon-button {
  width: 36px;
  font-size: 19px;
}

.text-button {
  min-width: 52px;
  padding: 0 10px;
  font-size: 13px;
  box-sizing: border-box;
}

.state-mark,
.state-title,
.state-subtitle,
.continue-eyebrow,
.continue-title,
.continue-meta,
.summary-title,
.summary-count,
.book-name,
.book-progress {
  display: block;
}

.state-card {
  padding: 28px 22px;
  border-radius: 8px;
  background: #fff;
  text-align: center;
  box-shadow: 0 10px 28px rgba(31, 42, 38, 0.06);
}

.state-card.compact {
  padding: 24px 16px;
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
  margin: 18px auto 0;
  border-radius: 8px;
  background: #2f6f5e;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.continue-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 86px;
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 8px;
  background: linear-gradient(145deg, #fff, #f2e8de);
  border: 1px solid #ebe1d5;
  box-sizing: border-box;
}

.continue-cover {
  flex: 0 0 48px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(145deg, #2f6f5e, #9a6b45);
  color: #fff;
  font-size: 15px;
  font-weight: 900;
}

.continue-main {
  min-width: 0;
  flex: 1;
}

.continue-eyebrow {
  color: #9a6b45;
  font-size: 12px;
  font-weight: 800;
}

.continue-title {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1f2a26;
  font-size: 16px;
  font-weight: 900;
}

.continue-meta {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #81776c;
  font-size: 12px;
}

.continue-action {
  flex: 0 0 auto;
  height: 34px;
  line-height: 34px;
  padding: 0 13px;
  border-radius: 999px;
  background: #fff;
  color: #2f6f5e;
  font-size: 13px;
  font-weight: 900;
}

.filter-row {
  width: 100%;
  margin-bottom: 12px;
  white-space: nowrap;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  min-width: 58px;
  margin-right: 8px;
  padding: 0 14px;
  border-radius: 8px;
  background: #fff;
  color: #62584d;
  font-size: 13px;
  font-weight: 800;
  box-sizing: border-box;
}

.filter-chip.active {
  background: #2f6f5e;
  color: #fff;
}

.summary-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.summary-title {
  color: #1f2a26;
  font-size: 17px;
  font-weight: 900;
}

.summary-count {
  color: #8d8175;
  font-size: 13px;
}

.shelf-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 12px;
  row-gap: 18px;
}

.book-card {
  min-width: 0;
}

.cover-wrap {
  position: relative;
  width: 100%;
}

.cover {
  width: 100%;
  height: 142px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: linear-gradient(145deg, #355f50, #a7794e);
  color: #fff;
  font-size: 22px;
  font-weight: 900;
  box-shadow: 0 10px 22px rgba(31, 42, 38, 0.12);
  box-sizing: border-box;
}

.update-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(221, 122, 76, 0.92);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
}

.remove-dot {
  position: absolute;
  top: -8px;
  right: -6px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #8c3c32;
  color: #fff;
  font-size: 17px;
  font-weight: 500;
}

.book-name {
  height: 40px;
  margin-top: 9px;
  color: #202a26;
  font-size: 14px;
  font-weight: 800;
  line-height: 20px;
  word-break: break-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.book-progress {
  margin-top: 3px;
  color: #8b8176;
  font-size: 12px;
}

.remove-button {
  height: 28px;
  line-height: 28px;
  margin-top: 8px;
  border-radius: 7px;
  background: #f1e7dc;
  color: #7a5136;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
}

@media (min-width: 720px) {
  .page {
    padding-left: 22px;
    padding-right: 22px;
  }

  .cover {
    height: 168px;
  }
}
</style>
