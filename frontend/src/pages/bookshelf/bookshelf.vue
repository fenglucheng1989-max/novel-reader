<template>
  <view class="page">
    <view class="shelf-shell">
      <view v-if="userStore.isLoggedIn" class="toolbar">
        <view>
          <text class="page-title">书架</text>
          <text class="page-subtitle">{{ syncText }}</text>
        </view>
        <view class="toolbar-actions">
          <view class="icon-button" @tap="goSearch">⌕</view>
          <view v-if="bookStore.shelf.length" class="icon-button" @tap="toggleViewMode">
            {{ viewMode === 'grid' ? '☷' : '▦' }}
          </view>
          <view v-if="editMode && filteredShelf.length" class="text-button" @tap="toggleSelectAll">
            {{ allSelected ? '取消全选' : '全选' }}
          </view>
          <view v-if="bookStore.shelf.length" class="text-button" @tap="toggleEdit">
            {{ editMode ? '完成' : '管理' }}
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
        <view class="stats-grid">
          <view class="stat-card">
            <text class="stat-value">{{ stats.todayMinutes || 0 }}</text>
            <text class="stat-label">今日分钟</text>
          </view>
          <view class="stat-card">
            <text class="stat-value">{{ stats.streakDays || 0 }}</text>
            <text class="stat-label">连续天数</text>
          </view>
          <view class="stat-card">
            <text class="stat-value">{{ stats.updateCount || 0 }}</text>
            <text class="stat-label">有更新</text>
          </view>
          <view class="stat-card">
            <text class="stat-value">{{ stats.totalBooks || bookStore.shelf.length }}</text>
            <text class="stat-label">总藏书</text>
          </view>
        </view>

        <view v-if="latestItem" class="continue-card">
          <BookCover :title="latestItem.book.title" :cover-url="latestItem.book.coverUrl" size="sm" class="continue-cover-slot" />
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

        <view v-else :class="viewMode === 'grid' ? 'shelf-grid' : 'shelf-list'">
          <view
            v-for="item in filteredShelf"
            :key="item.shelfId"
            :class="viewMode === 'grid' ? 'book-card' : 'book-row'"
            @tap="handleBookTap(item)"
            @longpress.stop="showContextMenu(item)"
          >
            <view class="cover-wrap">
              <BookCover :title="item.book.title" :cover-url="item.book.coverUrl" :size="viewMode === 'grid' ? 'xl' : 'lg'" class="shelf-cover" />
              <view
                v-if="viewMode === 'grid' && progressPercent(item) > 0 && progressPercent(item) < 100"
                class="progress-ring"
                :style="{ background: `conic-gradient(#3A3A3A ${progressPercent(item) * 3.6}deg, rgba(0,0,0,0.08) ${progressPercent(item) * 3.6}deg)` }"
              >
                <view class="ring-inner"></view>
              </view>
              <view v-if="editMode" class="select-check" :class="{ checked: selectedIds.has(item.shelfId) }">
                <text v-if="selectedIds.has(item.shelfId)">✓</text>
              </view>
              <text v-if="!editMode && item.pinned" class="pin-badge">置顶</text>
              <text v-else-if="!editMode && remainingChapters(item) > 0" class="update-badge">更新</text>
            </view>

            <view class="book-info">
              <text class="book-name">{{ item.book.title }}</text>
              <text class="book-author">{{ item.book.author || '佚名' }}</text>
              <text class="book-progress">{{ progressText(item) }}</text>
              <text class="book-update">{{ latestChapterText(item) }}</text>
              <view v-if="editMode" class="manage-row">
                <view class="manage-button" @tap.stop="togglePin(item)">
                  {{ item.pinned ? '取消置顶' : '置顶' }}
                </view>
                <view class="manage-button danger" @tap.stop="remove(item.book.id)">移出</view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="editMode && selectedIds.size > 0" class="batch-bar">
          <text class="batch-label">已选 {{ selectedIds.size }} 本</text>
          <view class="batch-button" @tap="batchRemove">移出 ({{ selectedIds.size }})</view>
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
import { useReaderStore } from '../../store/reader'
import BookCover from '../../components/BookCover.vue'

const bookStore = useBookStore()
const userStore = useUserStore()
const readerStore = useReaderStore()
const loading = ref(false)
const editMode = ref(false)
const activeFilter = ref('all')
const viewMode = ref(uni.getStorageSync('bookshelfViewMode') || 'grid')
const selectedIds = ref(new Set())

const filters = [
  { key: 'all', label: '全部' },
  { key: 'updated', label: '有更新' },
  { key: 'reading', label: '在读' },
  { key: 'unread', label: '未读' },
  { key: 'completed', label: '完结' }
]

const stats = computed(() => bookStore.shelfStats || {})
const syncText = computed(() => `已同步 ${bookStore.shelf.length} 本`)

const filteredShelf = computed(() => {
  if (activeFilter.value === 'updated') {
    return bookStore.shelf.filter((item) => remainingChapters(item) > 0)
  }
  if (activeFilter.value === 'reading') {
    return bookStore.shelf.filter((item) => progressChapter(item) > 1)
  }
  if (activeFilter.value === 'unread') {
    return bookStore.shelf.filter((item) => progressChapter(item) <= 1)
  }
  if (activeFilter.value === 'completed') {
    return bookStore.shelf.filter((item) => item.book.status === 'COMPLETED')
  }
  return bookStore.shelf
})

const latestItem = computed(() => {
  const latestBookId = stats.value.latestBookId
  if (latestBookId) {
    const latest = bookStore.shelf.find((item) => Number(item.book.id) === Number(latestBookId))
    if (latest) return latest
  }
  return bookStore.shelf.find((item) => progressChapter(item) > 1) || bookStore.shelf[0]
})

const activeFilterLabel = computed(() => {
  return filters.find((item) => item.key === activeFilter.value)?.label || '全部'
})

const allSelected = computed(() => {
  if (!filteredShelf.value.length) return false
  return filteredShelf.value.every((item) => selectedIds.value.has(item.shelfId))
})

async function refresh() {
  if (!userStore.isLoggedIn) return
  loading.value = true
  try {
    await Promise.all([
      bookStore.loadShelf(),
      bookStore.loadShelfStats()
    ])
  } catch (error) {
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      userStore.syncFromStorage()
      bookStore.shelf = []
      bookStore.shelfStats = null
      editMode.value = false
    }
  } finally {
    loading.value = false
  }
}

function selectFilter(key) {
  activeFilter.value = key
  selectedIds.value = new Set()
}

function toggleEdit() {
  editMode.value = !editMode.value
  selectedIds.value = new Set()
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(filteredShelf.value.map((item) => item.shelfId))
  }
}

function toggleSelect(item) {
  const next = new Set(selectedIds.value)
  if (next.has(item.shelfId)) {
    next.delete(item.shelfId)
  } else {
    next.add(item.shelfId)
  }
  selectedIds.value = next
}

async function batchRemove() {
  uni.showModal({
    title: '批量移出',
    content: `确定要把选中的 ${selectedIds.value.size} 本书移出书架吗？`,
    success: async (res) => {
      if (!res.confirm) return
      const ids = [...selectedIds.value].map((shelfId) => {
        const item = bookStore.shelf.find((i) => i.shelfId === shelfId)
        return item ? item.book.id : null
      }).filter(Boolean)
      await bookStore.removeShelfBatch(ids)
      selectedIds.value = new Set()
      await refresh()
      if (!bookStore.shelf.length) editMode.value = false
    }
  })
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
  uni.setStorageSync('bookshelfViewMode', viewMode.value)
}

function handleBookTap(item) {
  if (editMode.value) {
    toggleSelect(item)
    return
  }
  openBook(item)
}

function openBook(item) {
  const chapterNo = progressChapter(item)
  uni.navigateTo({ url: `/pages/reader/reader?bookId=${item.book.id}&chapterNo=${chapterNo}` })
}

async function togglePin(item) {
  if (item.pinned) {
    await bookStore.unpinShelf(item.book.id)
  } else {
    await bookStore.pinShelf(item.book.id)
  }
  await refresh()
}

async function remove(bookId) {
  uni.showModal({
    title: '移出书架',
    content: '确定要把这本书移出书架吗？',
    success: async (res) => {
      if (!res.confirm) return
      await bookStore.removeShelf(bookId)
      await refresh()
      if (!bookStore.shelf.length) editMode.value = false
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
  if (!Number(item.book.chapterCount || 0)) return '暂无章节'
  const count = remainingChapters(item)
  return count > 0 ? `${count} 章未读` : '已读完'
}

function progressPercent(item) {
  const total = Number(item.book.chapterCount || 0)
  if (!total) return 0
  return Math.round((progressChapter(item) / total) * 100)
}

function showContextMenu(item) {
  uni.showActionSheet({
    itemList: ['从书架移除', '标记为已读'],
    success: (res) => {
      if (res.tapIndex === 0) {
        remove(item.book.id)
      } else if (res.tapIndex === 1) {
        markAsRead(item)
      }
    }
  })
}

async function markAsRead(item) {
  const total = Number(item.book.chapterCount || 0)
  if (!total) return
  await readerStore.saveProgress(item.book.id, {
    chapterNo: total,
    position: 0,
    progressPercent: 100,
    durationSeconds: 0
  })
  await refresh()
  uni.showToast({ title: '已标记为已读', icon: 'success' })
}

function progressText(item) {
  const total = Number(item.book.chapterCount || 0)
  if (!total) return '暂无章节'
  return `读到 ${progressChapter(item)} / ${total} 章`
}

function latestChapterText(item) {
  return item.book.latestChapterTitle ? `最新：${item.book.latestChapterTitle}` : unreadText(item)
}

onShow(() => {
  userStore.syncFromStorage()
  refresh()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 14px 14px 88px;
  background: #F8F8F6;
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

.page-title,
.page-subtitle,
.state-mark,
.state-title,
.state-subtitle,
.stat-value,
.stat-label,
.continue-eyebrow,
.continue-title,
.continue-meta,
.summary-title,
.summary-count,
.book-name,
.book-author,
.book-progress,
.book-update {
  display: block;
}

.page-title {
  color: #1F1F1F;
  font-size: 24px;
  font-weight: 900;
}

.page-subtitle {
  margin-top: 3px;
  color: #8C8C8C;
  font-size: 12px;
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
  border: 1px solid #EBEBE5;
  color: #3A3A3A;
  font-weight: 800;
}

.icon-button {
  width: 36px;
  font-size: 18px;
}

.text-button {
  min-width: 52px;
  padding: 0 10px;
  font-size: 13px;
  box-sizing: border-box;
}

.state-card {
  padding: 28px 22px;
  border-radius: 8px;
  background: #fff;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}

.state-card.compact {
  padding: 24px 16px;
}

.state-mark {
  color: #A09080;
  font-size: 13px;
}

.state-title {
  margin-top: 8px;
  color: #1F1F1F;
  font-size: 20px;
  font-weight: 800;
}

.state-subtitle {
  margin-top: 8px;
  color: #8C8C8C;
  font-size: 14px;
  line-height: 22px;
}

.primary-button {
  width: 126px;
  height: 40px;
  line-height: 40px;
  margin: 18px auto 0;
  border-radius: 8px;
  background: #3A3A3A;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.stat-card {
  min-width: 0;
  padding: 12px 6px;
  border-radius: 8px;
  background: #fff;
  text-align: center;
  border: 1px solid #EBEBE5;
}

.stat-value {
  color: #1F1F1F;
  font-size: 20px;
  line-height: 24px;
  font-weight: 900;
}

.stat-label {
  margin-top: 4px;
  color: #8C8C8C;
  font-size: 11px;
}

.continue-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 86px;
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 8px;
  background: linear-gradient(145deg, #FFFFFF, #F5F5F2);
  border: 1px solid #EBEBE5;
  box-sizing: border-box;
}

.continue-cover-slot {
  flex: 0 0 48px;
}

.continue-main {
  min-width: 0;
  flex: 1;
}

.continue-eyebrow {
  color: #A09080;
  font-size: 12px;
  font-weight: 800;
}

.continue-title {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 900;
}

.continue-meta {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #8C8C8C;
  font-size: 12px;
}

.continue-action {
  flex: 0 0 auto;
  height: 34px;
  line-height: 34px;
  padding: 0 13px;
  border-radius: 999px;
  background: #fff;
  color: #3A3A3A;
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
  color: #5A5A5A;
  font-size: 13px;
  font-weight: 800;
  box-sizing: border-box;
}

.filter-chip.active {
  background: #3A3A3A;
  color: #fff;
}

.summary-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.summary-title {
  color: #1F1F1F;
  font-size: 17px;
  font-weight: 900;
}

.summary-count {
  color: #8C8C8C;
  font-size: 13px;
}

.shelf-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 12px;
  row-gap: 18px;
}

.shelf-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.book-card,
.book-row {
  min-width: 0;
}

.book-row {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #EBEBE5;
}

.cover-wrap {
  position: relative;
  width: 100%;
}

.book-row .cover-wrap {
  flex: 0 0 64px;
  width: 64px;
}

.shelf-cover {
  width: 100%;
  height: 132px;
}

.book-row .shelf-cover {
  width: 64px;
  height: 86px;
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.ring-inner {
  width: calc(100% - 6px);
  height: calc(100% - 6px);
  border-radius: 6px;
  background: transparent;
}

.pin-badge,
.update-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
}

.pin-badge {
  background: rgba(58, 58, 58, 0.9);
}

.update-badge {
  background: rgba(160, 144, 128, 0.92);
}

.book-info {
  min-width: 0;
}

.book-name {
  height: 40px;
  margin-top: 9px;
  color: #1F1F1F;
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

.book-row .book-name {
  height: auto;
  margin-top: 0;
  font-size: 16px;
  line-height: 22px;
  -webkit-line-clamp: 1;
}

.book-author,
.book-progress,
.book-update {
  margin-top: 4px;
  color: #8C8C8C;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manage-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.manage-button {
  height: 28px;
  line-height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  background: #F0F0ED;
  color: #5A5A5A;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
}

.manage-button.danger {
  background: #f7e2dd;
  color: #8c3c32;
}

.select-check {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  color: #fff;
  z-index: 2;
}

.select-check.checked {
  background: #3A3A3A;
  border-color: #3A3A3A;
}

.batch-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #EBEBE5;
  box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
  z-index: 100;
}

.batch-label {
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 800;
}

.batch-button {
  height: 34px;
  line-height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  background: #8c3c32;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

@media (min-width: 720px) {
  .page {
    padding-left: 22px;
    padding-right: 22px;
  }
}
</style>
