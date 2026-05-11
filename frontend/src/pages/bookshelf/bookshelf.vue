<template>
  <view class="page">
    <view class="shelf-shell">
      <!-- Top Tab Bar -->
      <view v-if="!searchMode" class="topbar">
        <view class="topbar-tabs">
          <text
            v-for="tab in tabs"
            :key="tab.key"
            class="topbar-tab"
            :class="{ active: activeTab === tab.key }"
            @tap="activeTab = tab.key"
          >{{ tab.label }}</text>
        </view>
        <view class="topbar-actions">
          <text class="topbar-icon" @tap="enterSearch">⌕</text>
          <text v-if="activeTab === 'shelf'" class="topbar-icon" @tap="showMenu = !showMenu">⋮</text>
        </view>
      </view>

      <!-- Search Bar -->
      <view v-else class="searchbar-bookshelf">
        <view class="searchbar-input-wrap">
          <text class="searchbar-icon">⌕</text>
          <input
            v-model="searchKeyword"
            class="searchbar-input"
            placeholder="搜索书架中的书名或作者"
            :focus="true"
            @input="onShelfSearch"
          />
          <text v-if="searchKeyword" class="searchbar-clear" @tap="clearShelfSearch">✕</text>
        </view>
        <text class="searchbar-cancel" @tap="exitSearch">取消</text>
      </view>

      <!-- Three-dots Menu -->
      <view v-if="showMenu" class="menu-overlay" @tap="showMenu = false"></view>
      <view v-if="showMenu" class="menu-dropdown">
        <view class="menu-item" @tap.stop="toggleEdit">
          <text>书架管理</text>
        </view>
        <view class="menu-divider"></view>
        <view class="menu-item" @tap.stop="toggleViewMode">
          <text>切换为{{ viewMode === 'grid' ? '列表' : '宫格' }}</text>
        </view>
      </view>

      <!-- Not Logged In -->
      <view v-if="!userStore.isLoggedIn" class="empty-card empty-card--login">
        <view class="empty-login-visual">
          <view class="empty-login-shelf">
            <view class="empty-login-book" v-for="i in 5" :key="i" :style="{ animationDelay: (i * 0.12) + 's' }"></view>
          </view>
        </view>
        <text class="empty-title">你的专属书架</text>
        <text class="empty-sub">登录后，阅读进度、收藏和偏好会自动同步</text>
        <view class="empty-btn" @tap="goMine">登录悦读</view>
        <text class="empty-footnote">还没有账号？去注册即享同步体验</text>
      </view>

      <!-- Loading -->
      <view v-else-if="loading" class="state">正在整理书架...</view>

      <!-- Empty -->
      <view v-else-if="!bookStore.shelf.length" class="empty-card">
        <view class="empty-visual">
          <view class="empty-shelf">
            <view class="empty-shelf-plank"></view>
            <view class="empty-shelf-ghost" v-for="i in 3" :key="i" :style="{ animationDelay: (i * 0.3) + 's' }"></view>
          </view>
          <view class="empty-plus">+</view>
        </view>
        <text class="empty-title">书架还没有书</text>
        <text class="empty-sub">去书城逛逛，把喜欢的书加入书架</text>
        <view class="empty-btn" @tap="goStore">去书城</view>
      </view>

      <!-- Has Books -->
      <template v-else>
        <!-- ─── Shelf Tab ─── -->
        <template v-if="activeTab === 'shelf'">
          <view v-if="latestItem" class="hero-slot" @tap="openBook(latestItem)">
            <BookCover :title="latestItem.book.title" :cover-url="latestItem.book.coverUrl" size="md" class="hero-cover" />
            <view class="hero-content">
              <text class="hero-eyebrow">继续阅读</text>
              <text class="hero-title">{{ latestItem.book.title }}</text>
              <text class="hero-desc">第 {{ progressChapter(latestItem) }} 章 · {{ unreadText(latestItem) }}</text>
            </view>
            <text class="hero-arrow">›</text>
          </view>

          <view class="filter-row">
            <text
              v-for="f in quickFilters"
              :key="f.key"
              class="filter-chip"
              :class="{ active: activeFilter === f.key && !hasFilterParams }"
              @tap="selectQuickFilter(f.key)"
            >{{ f.label }}</text>
            <text class="filter-chip filter-more" :class="{ 'has-params': hasFilterParams }" @tap="goFilter">
              {{ hasFilterParams ? '● 筛选' : '◎ 筛选' }}
            </text>
          </view>

          <view v-if="hasFilterParams" class="filter-summary">
            <text class="filter-summary-text">{{ filterSummary }}</text>
            <text class="filter-summary-clear" @tap="clearFilterParams">清除</text>
          </view>

          <view v-if="!filteredShelf.length" class="empty-card compact">
            <text class="empty-visual-search" v-if="searchKeyword">未找到匹配的书籍</text>
            <text class="empty-icon-compact" v-else>☾</text>
            <text class="empty-title-compact" v-if="!searchKeyword">当前筛选下暂无书籍</text>
          </view>

          <view v-if="viewMode === 'grid'" class="shelf-grid">
            <view
              v-for="item in filteredShelf"
              :key="item.shelfId"
              class="book-card"
              @tap="handleBookTap(item)"
              @longpress.stop="showContextMenu(item)"
            >
              <view class="cover-wrap">
                <BookCover :title="item.book.title" :cover-url="item.book.coverUrl" size="xl" />
                <view v-if="!editMode && item.pinned" class="badge badge-pin">置顶</view>
                <view v-else-if="!editMode && remainingChapters(item) > 0" class="badge badge-update">更新</view>
              </view>
              <view v-if="editMode" class="select-check" :class="{ checked: selectedIds.has(item.shelfId) }">
                <text v-if="selectedIds.has(item.shelfId)">✓</text>
              </view>

              <view class="book-info">
                <text class="book-name grid-name">{{ item.book.title }}</text>
                <text class="book-author grid-author">{{ item.book.author || '佚名' }}</text>
                <view class="grid-meta">
                  <text class="grid-progress">{{ progressText(item) }}</text>
                  <text v-if="item.book.status === 'COMPLETED'" class="book-tag done">完结</text>
                  <text v-else-if="remainingChapters(item) > 0" class="book-tag update">更新</text>
                </view>
              </view>
            </view>
          </view>

          <view v-else class="shelf-panel">
            <view
              v-for="item in filteredShelf"
              :key="item.shelfId"
              class="book-row"
              @tap="handleBookTap(item)"
              @longpress.stop="showContextMenu(item)"
            >
              <view class="cover-wrap-list">
                <BookCover :title="item.book.title" :cover-url="item.book.coverUrl" size="md" />
              </view>
              <view v-if="editMode" class="select-check select-check--list" :class="{ checked: selectedIds.has(item.shelfId) }">
                <text v-if="selectedIds.has(item.shelfId)">✓</text>
              </view>

              <view class="book-info">
                <text class="book-name list-name">{{ item.book.title }}</text>
                <view class="list-meta">
                  <text class="book-author">{{ item.book.author || '佚名' }}</text>
                  <text v-if="item.book.wordCount" class="book-meta-sep">·</text>
                  <text v-if="item.book.wordCount" class="book-wordcount">{{ formatWordCount(item.book.wordCount) }}字</text>
                  <text v-if="item.book.status === 'COMPLETED'" class="book-tag done">完结</text>
                  <text v-else-if="remainingChapters(item) > 0" class="book-tag update">更新{{ remainingChapters(item) }}章</text>
                </view>
                <text class="book-progress">{{ progressText(item) }}</text>
                <text v-if="item.book.description" class="book-desc">{{ item.book.description }}</text>
              </view>
            </view>
          </view>
        </template>

        <!-- ─── Favorites Tab ─── -->
        <template v-if="activeTab === 'favorites'">
          <view v-if="!searchedFavorites.length" class="empty-card">
            <view class="empty-visual-heart">
              <text class="empty-heart-icon">♡</text>
            </view>
            <text class="empty-title" v-if="!searchKeyword">暂无收藏</text>
            <text class="empty-title" v-else>未找到匹配的收藏</text>
            <text class="empty-sub" v-if="!searchKeyword">在书籍详情页可以收藏喜欢的书</text>
          </view>
          <view v-else class="history-list-shelf">
            <view
              v-for="item in searchedFavorites"
              :key="item.bookId"
              class="history-item-shelf"
              @tap="handleFavTap(item)"
              @longpress.stop="showFavContextMenu(item)"
            >
              <BookCover :title="item.bookTitle" :cover-url="item.coverUrl" size="md" />
              <view class="history-info-shelf">
                <text class="history-title-shelf">{{ item.bookTitle }}</text>
                <text class="history-author-shelf">{{ item.bookAuthor || '佚名' }} · {{ item.status === 'COMPLETED' ? '完结' : '连载' }}</text>
                <text class="history-time-shelf">{{ item.latestChapterTitle || '' }}</text>
              </view>
              <view v-if="editMode" class="select-check select-check--fav" :class="{ checked: selectedIds.has(item.bookId) }">
                <text v-if="selectedIds.has(item.bookId)">✓</text>
              </view>
            </view>
          </view>
        </template>

        <!-- ─── History Tab ─── -->
        <template v-else-if="activeTab === 'history'">
          <view v-if="historyLoading" class="state">正在加载...</view>
          <view v-else-if="!searchedHistory.length" class="empty-card">
            <view class="empty-visual-history">
              <text class="empty-history-icon">⌛</text>
            </view>
            <text class="empty-title">暂无阅读记录</text>
            <text class="empty-sub">开始阅读一本书吧</text>
          </view>
          <view v-else class="history-list-shelf">
            <view
              v-for="item in searchedHistory"
              :key="item.bookId"
              class="history-item-shelf"
              @tap="goBook(item.bookId)"
            >
              <BookCover :title="item.bookTitle" :cover-url="item.coverUrl" size="md" />
              <view class="history-info-shelf">
                <text class="history-title-shelf">{{ item.bookTitle }}</text>
                <text class="history-author-shelf">{{ item.bookAuthor || '佚名' }} · {{ item.status === 'COMPLETED' ? '完结' : '连载' }}</text>
                <text class="history-time-shelf">{{ formatHistoryTime(item.lastReadAt) }}</text>
              </view>
            </view>
          </view>
        </template>

      </template>
    </view>

    <!-- Batch Bar (Shelf) -->
    <view v-if="editMode && editTarget === 'shelf'" class="batch-bar">
      <view class="batch-left">
        <view class="batch-check" :class="{ checked: allSelected }" @tap="toggleSelectAll">
          <text v-if="allSelected">✓</text>
        </view>
        <text class="batch-label">全选</text>
      </view>
      <view class="batch-right">
        <view class="batch-btn cancel" @tap="cancelEdit">取消</view>
        <view class="batch-btn pin" :class="{ disabled: !selectedIds.size }" @tap="selectedIds.size > 0 && batchPin()">置顶</view>
        <view class="batch-btn remove" :class="{ disabled: !selectedIds.size }" @tap="selectedIds.size > 0 && batchRemove()">移出</view>
      </view>
    </view>

    <!-- Batch Bar (Favorites) -->
    <view v-if="editMode && editTarget === 'favorites'" class="batch-bar">
      <view class="batch-left">
        <view class="batch-check" :class="{ checked: allSelected }" @tap="toggleSelectAll">
          <text v-if="allSelected">✓</text>
        </view>
        <text class="batch-label">全选</text>
      </view>
      <view class="batch-right">
        <view class="batch-btn cancel" @tap="cancelEdit">取消</view>
        <view class="batch-btn remove" :class="{ disabled: !selectedIds.size }" @tap="selectedIds.size > 0 && batchRemoveFav()">取消收藏</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import { useUserStore } from '../../store/user'
import { useReaderStore } from '../../store/reader'
import { request } from '../../utils/request'
import BookCover from '../../components/BookCover.vue'

const bookStore = useBookStore()
const userStore = useUserStore()
const readerStore = useReaderStore()
const loading = ref(false)
const editMode = ref(false)
const editTarget = ref('shelf')
const activeTab = ref('shelf')
const activeFilter = ref('all')
const viewMode = ref(uni.getStorageSync('bookshelfViewMode') || 'grid')
const selectedIds = ref(new Set())
const showMenu = ref(false)
const searchMode = ref(false)
const searchKeyword = ref('')
const filterParams = ref(null)
const readingHistory = ref([])
const historyLoading = ref(false)

async function loadReadingHistory() {
  if (!userStore.isLoggedIn) return
  if (!readingHistory.value.length) {
    historyLoading.value = true
  }
  try {
    const res = await request({ url: '/api/v1/reading/history', silentAuth: true })
    if (res.code === 200) readingHistory.value = res.data || []
  } catch { readingHistory.value = [] }
  finally { historyLoading.value = false }
}

watch(activeTab, (val) => {
  cancelEdit()
  if (val === 'history') loadReadingHistory()
})

const tabs = [
  { key: 'shelf', label: '书架' },
  { key: 'history', label: '历史' },
  { key: 'favorites', label: '收藏' }
]

const quickFilters = [
  { key: 'all', label: '全部' },
  { key: 'updated', label: '有更新' },
  { key: 'completed', label: '已完结' }
]

const hasFilterParams = computed(() => {
  const p = filterParams.value
  if (!p) return false
  return !!(p.type || p.status || p.categoryId || p.progress || p.wordRange || p.sortBy)
})

const filterSummary = computed(() => {
  const p = filterParams.value
  if (!p) return ''
  const parts = []
  const typeLabels = { novel: '小说', audio: '听书' }
  if (p.type) parts.push(typeLabels[p.type] || p.type)
  if (p.categoryName) parts.push(p.categoryName)
  if (p.wordRangeLabel) parts.push(p.wordRangeLabel)
  const sortMap = { recent: '最近阅读', update: '最近更新', added: '收藏时间', words: '字数多少' }
  if (p.sortBy && sortMap[p.sortBy]) parts.push(sortMap[p.sortBy])
  return parts.join(' · ')
})

const filteredShelf = computed(() => {
  let list = bookStore.shelf
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      (item.book.title || '').toLowerCase().includes(kw) ||
      (item.book.author || '').toLowerCase().includes(kw)
    )
  }
  if (hasFilterParams.value) {
    const p = filterParams.value
    if (p.type) {
      const relevantKeys = p.type === 'novel' ? ['male', 'female'] : [p.type]
      const typeCatIds = new Set(
        bookStore.categories.filter(c => relevantKeys.includes(c.groupKey)).map(c => c.id)
      )
      list = list.filter((item) => typeCatIds.has(Number(item.book.categoryId)))
    }
    if (p.status) {
      list = list.filter((item) => item.book.status === p.status)
    }
    if (p.categoryId) {
      list = list.filter((item) => Number(item.book.categoryId) === Number(p.categoryId))
    }
    if (p.progress === 'unread') {
      list = list.filter((item) => progressChapter(item) <= 1)
    } else if (p.progress === 'reading') {
      list = list.filter((item) => progressChapter(item) > 1 && progressChapter(item) < Number(item.book.chapterCount || 9999))
    } else if (p.progress === 'finished') {
      list = list.filter((item) => progressChapter(item) >= Number(item.book.chapterCount || 0) && Number(item.book.chapterCount || 0) > 0)
    }
    if (p.wordRange) {
      const [min, max] = { 'lt5': [0, 49999], '5-10': [50000, 99999], '10-30': [100000, 299999], 'gt30': [300000, Infinity] }[p.wordRange] || []
      if (min !== undefined) {
        list = list.filter((item) => {
          const wc = Number(item.book.wordCount || 0)
          return wc >= min && wc <= max
        })
      }
    }
    if (p.onlyUpdated) {
      list = list.filter((item) => remainingChapters(item) > 0)
    }
    if (p.sortBy) {
      list = [...list]
      if (p.sortBy === 'recent') {
        list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      } else if (p.sortBy === 'update') {
        list.sort((a, b) => new Date(b.book.updatedAt || 0) - new Date(a.book.updatedAt || 0))
      } else if (p.sortBy === 'added') {
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      } else if (p.sortBy === 'words') {
        list.sort((a, b) => Number(b.book.wordCount || 0) - Number(a.book.wordCount || 0))
      }
    }
  } else {
    if (activeFilter.value === 'updated') {
      list = list.filter((item) => remainingChapters(item) > 0)
    } else if (activeFilter.value === 'completed') {
      list = list.filter((item) => item.book.status === 'COMPLETED')
    }
  }
  return list
})

const searchedFavorites = computed(() => {
  if (!searchKeyword.value) return bookStore.favorites
  const kw = searchKeyword.value.toLowerCase()
  return bookStore.favorites.filter(item =>
    (item.bookTitle || '').toLowerCase().includes(kw) ||
    (item.bookAuthor || '').toLowerCase().includes(kw)
  )
})

const searchedHistory = computed(() => {
  if (!searchKeyword.value) return readingHistory.value
  const kw = searchKeyword.value.toLowerCase()
  return readingHistory.value.filter(item =>
    (item.bookTitle || '').toLowerCase().includes(kw) ||
    (item.bookAuthor || '').toLowerCase().includes(kw)
  )
})

const latestItem = computed(() => {
  const items = bookStore.shelf.filter((item) => item.lastReadAt || item.progress?.updatedAt)
  if (!items.length) return null
  items.sort((a, b) => {
    const aTime = new Date(a.lastReadAt || a.progress?.updatedAt || 0)
    const bTime = new Date(b.lastReadAt || b.progress?.updatedAt || 0)
    return bTime - aTime
  })
  return items[0]
})

const activeFilterLabel = computed(() => {
  if (hasFilterParams.value) return '筛选结果'
  const found = quickFilters.find((f) => f.key === activeFilter.value)
  return found ? found.label : '全部'
})

const allSelected = computed(() => {
  if (editTarget.value === 'favorites') {
    if (!bookStore.favorites.length) return false
    return bookStore.favorites.every((item) => selectedIds.value.has(item.bookId))
  }
  if (!filteredShelf.value.length) return false
  return filteredShelf.value.every((item) => selectedIds.value.has(item.shelfId))
})

function loadFilterFromStorage() {
  try {
    const raw = uni.getStorageSync('bookshelfFilter')
    if (raw) {
      filterParams.value = JSON.parse(raw)
    }
  } catch {
    filterParams.value = null
  }
}

async function refresh() {
  if (!userStore.isLoggedIn) return
  if (!bookStore.shelf.length) {
    loading.value = true
  }
  try {
    await Promise.all([
      bookStore.loadShelf(),
      bookStore.loadShelfStats(),
      bookStore.loadFavorites()
    ])
  } catch (error) {
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      userStore.syncFromStorage()
      bookStore.shelf = []
      bookStore.shelfStats = null
      bookStore.favorites = []
      editMode.value = false
    }
  } finally {
    loading.value = false
  }
}

function selectQuickFilter(key) {
  activeFilter.value = key
  filterParams.value = null
  uni.removeStorageSync('bookshelfFilter')
  selectedIds.value = new Set()
}

function goFilter() {
  showMenu.value = false
  uni.navigateTo({ url: '/pages/bookshelf/filter' })
}

function clearFilterParams() {
  filterParams.value = null
  uni.removeStorageSync('bookshelfFilter')
  activeFilter.value = 'all'
}

function toggleEdit() {
  showMenu.value = false
  editMode.value = !editMode.value
  selectedIds.value = new Set()
}

async function batchPin() {
  const ids = [...selectedIds.value].map((shelfId) => {
    const item = bookStore.shelf.find((i) => i.shelfId === shelfId)
    return item ? item.book.id : null
  }).filter(Boolean)
  for (const bookId of ids) {
    await bookStore.pinShelf(bookId)
  }
  selectedIds.value = new Set()
  await refresh()
  uni.showToast({ title: '已置顶', icon: 'success' })
}

function cancelEdit() {
  editMode.value = false
  editTarget.value = 'shelf'
  selectedIds.value = new Set()
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else if (editTarget.value === 'favorites') {
    selectedIds.value = new Set(bookStore.favorites.map((item) => item.bookId))
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
  showMenu.value = false
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

function enterSearch() {
  searchMode.value = true
  searchKeyword.value = ''
}

function exitSearch() {
  searchMode.value = false
  searchKeyword.value = ''
}

function onShelfSearch() {
  // reactive filtering via computed
}

function clearShelfSearch() {
  searchKeyword.value = ''
}

function goBook(bookId) {
  uni.navigateTo({ url: `/pages/reader/reader?bookId=${bookId}&chapterNo=1` })
}

function handleFavTap(item) {
  if (editMode.value) {
    const next = new Set(selectedIds.value)
    if (next.has(item.bookId)) next.delete(item.bookId)
    else next.add(item.bookId)
    selectedIds.value = next
    return
  }
  goBook(item.bookId)
}

function showFavContextMenu(item) {
  editTarget.value = 'favorites'
  editMode.value = true
  selectedIds.value = new Set([item.bookId])
}

async function batchRemoveFav() {
  uni.showModal({
    title: '取消收藏',
    content: `确定要取消收藏选中的 ${selectedIds.value.size} 本书吗？`,
    success: async (res) => {
      if (!res.confirm) return
      const ids = [...selectedIds.value]
      for (const bookId of ids) {
        await bookStore.removeFavorite(bookId)
      }
      selectedIds.value = new Set()
      await refresh()
      if (!bookStore.favorites.length) editMode.value = false
    }
  })
}

function formatHistoryTime(timeStr) {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${d.getMonth() + 1}/${d.getDate()}`
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
  editTarget.value = 'shelf'
  editMode.value = true
  selectedIds.value = new Set([item.shelfId])
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

function formatWordCount(value) {
  const num = Number(value || 0)
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return String(num)
}

function progressText(item) {
  const total = Number(item.book.chapterCount || 0)
  if (!total) return '暂无章节'
  return `第 ${progressChapter(item)}/${total} 章`
}

onLoad((options) => {
  if (options?.tab && ['shelf', 'history', 'favorites'].includes(options.tab)) {
    activeTab.value = options.tab
  }
  loadFilterFromStorage()
})

onShow(() => {
  userStore.syncFromStorage()
  if (activeTab.value === 'history') {
    loadReadingHistory()
  } else {
    refresh()
  }
  loadFilterFromStorage()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 10px 88px;
  background: #F4F4F1;
  box-sizing: border-box;
  overflow-x: hidden;
}

.shelf-shell {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

/* ── Topbar ── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

/* Search Bar (Bookshelf) */
.searchbar-bookshelf {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.searchbar-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.searchbar-icon {
  color: #8C8C8C;
  font-size: 16px;
  margin-right: 6px;
}

.searchbar-input {
  flex: 1;
  height: 34px;
  color: #1F1F1F;
  font-size: 13px;
}

.searchbar-clear {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0,0,0,0.08);
  color: #999;
  font-size: 10px;
}

.searchbar-cancel {
  flex-shrink: 0;
  color: #A09080;
  font-size: 13px;
  font-weight: 700;
}

.topbar-tabs {
  display: flex;
  gap: 24px;
}

.topbar-tab {
  color: #8C8C8C;
  font-size: 17px;
  font-weight: 700;
  position: relative;
  padding-bottom: 6px;
}

.topbar-tab.active {
  color: #1F1F1F;
  font-weight: 900;
}

.topbar-tab.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 18px;
  height: 3px;
  border-radius: 99px;
  background: #3A3A3A;
  transform: translateX(-50%);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-icon {
  font-size: 20px;
  color: #3A3A3A;
  padding: 4px;
}

/* ── Menu ── */
.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 150;
}

.menu-dropdown {
  position: fixed;
  top: 52px;
  right: 20px;
  z-index: 160;
  min-width: 140px;
  padding: 4px 0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
}

.menu-item {
  padding: 12px 18px;
  color: #3A3A3A;
  font-size: 14px;
  font-weight: 600;
}

.menu-divider {
  height: 1px;
  margin: 4px 12px;
  background: rgba(0, 0, 0, 0.06);
}

/* ── Empty ── */
.empty-card {
  padding: 48px 24px;
  text-align: center;
}

.empty-card.compact {
  padding: 32px 20px;
}

.empty-card--login {
  padding: 40px 24px 36px;
  margin: 0 10px;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 6px 18px rgba(31, 31, 31, 0.045);
}

/* ── Bookshelf Visual ── */
.empty-login-visual {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-login-shelf {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 64px;
}

.empty-login-book {
  width: 14px;
  border-radius: 2px 3px 3px 2px;
  background: linear-gradient(135deg, #D8D2C6, #B0A090);
  animation: shelfFloat 3s ease-in-out infinite;
}

.empty-login-book:nth-child(1) { height: 38px; }
.empty-login-book:nth-child(2) { height: 48px; }
.empty-login-book:nth-child(3) { height: 56px; }
.empty-login-book:nth-child(4) { height: 44px; }
.empty-login-book:nth-child(5) { height: 36px; }

@keyframes shelfFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.empty-icon {
  display: block;
  font-size: 48px;
  margin-bottom: 16px;
}

/* ── Empty Visual: Shelf ── */
.empty-visual {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: 28px;
  height: 80px;
  position: relative;
}

.empty-shelf {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  position: relative;
  padding-bottom: 6px;
}

.empty-shelf-plank {
  position: absolute;
  bottom: 0;
  left: -12px;
  right: -12px;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #D0C8B8, #B0A090, #D0C8B8);
}

.empty-shelf-ghost {
  width: 16px;
  height: 48px;
  border-radius: 3px 4px 4px 3px;
  border: 1.5px dashed #C8C0B4;
  background: rgba(200, 192, 180, 0.12);
  animation: ghostPulse 2.4s ease-in-out infinite;
}

@keyframes ghostPulse {
  0%, 100% { opacity: 0.3; transform: scaleY(1); }
  50% { opacity: 0.7; transform: scaleY(1.06); }
}

.empty-plus {
  margin-left: 16px;
  font-size: 28px;
  color: #C0B8A8;
  font-weight: 200;
}

/* ── Empty Visual: Heart ── */
.empty-visual-heart {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-heart-icon {
  font-size: 52px;
  color: #D0B8B8;
}

/* ── Empty Visual: History ── */
.empty-visual-history {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-history-icon {
  font-size: 44px;
  color: #C0C0B8;
}

/* ── Empty Compact ── */
.empty-icon-compact {
  display: block;
  font-size: 36px;
  margin-bottom: 12px;
  color: #D0C8B8;
}

.empty-title-compact {
  display: block;
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 800;
}

.empty-visual-search {
  display: block;
  padding: 20px 0;
  color: #B0B0B0;
  font-size: 14px;
}

.empty-title {
  display: block;
  color: #1F1F1F;
  font-size: 20px;
  font-weight: 900;
}

.empty-sub {
  display: block;
  margin-top: 8px;
  color: #8C8C8C;
  font-size: 14px;
  line-height: 22px;
}

.state {
  padding: 52px 0;
  color: #8C8C8C;
  text-align: center;
  font-size: 13px;
}

.empty-btn {
  width: 160px;
  height: 44px;
  line-height: 44px;
  margin: 22px auto 0;
  border-radius: 22px;
  background: linear-gradient(135deg, #B0A090, #9B8B7A);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
}

.empty-footnote {
  display: block;
  margin-top: 12px;
  color: #B0B0B0;
  font-size: 12px;
}

/* ── Hero Slot (continue reading) ── */
.hero-slot {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  margin-bottom: 18px;
  border-radius: 10px;
  background: #FFFFFF;
  box-shadow: 0 4px 16px rgba(31, 31, 31, 0.06);
}

.hero-cover {
  flex-shrink: 0;
  width: 52px;
  height: 70px;
}

.hero-content {
  flex: 1;
  min-width: 0;
}

.hero-eyebrow {
  color: #A09080;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.hero-title {
  display: block;
  margin-top: 2px;
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-desc {
  display: block;
  margin-top: 6px;
  color: #8C8C8C;
  font-size: 11px;
}

.hero-arrow {
  flex-shrink: 0;
  color: #C0B8A8;
  font-size: 24px;
  font-weight: 300;
}

/* ── Filter ── */
.filter-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.filter-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 28px;
  margin-right: 20px;
  color: #8C8C8C;
  font-size: 13px;
  font-weight: 700;
}

.filter-chip:last-child {
  margin-right: 0;
}

.filter-chip.active {
  color: #1F1F1F;
}

.filter-chip.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 18px;
  height: 3px;
  border-radius: 99px;
  background: #3A3A3A;
  transform: translateX(-50%);
}

.filter-more {
  margin-left: auto;
  color: #8C8C8C;
}

.filter-more.has-params {
  color: #A09080;
  font-weight: 800;
}

/* ── Filter Summary ── */
.filter-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 6px 0;
}

.filter-summary-text {
  color: #8C7C6C;
  font-size: 12px;
}

.filter-summary-clear {
  color: #8C7C6C;
  font-size: 12px;
  font-weight: 800;
}

/* ── Grid ── */
.shelf-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 8px;
  row-gap: 12px;
}

.shelf-panel {
  padding: 10px;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 6px 18px rgba(31, 31, 31, 0.045);
}

/* ── Cover ── */
.cover-wrap {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  background: #E8E6E0;
}

.cover-wrap-list {
  position: relative;
  flex-shrink: 0;
  width: 54px;
  height: 74px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.07);
  background: #E8E6E0;
}

/* ── Badges ── */
.badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 7px;
  border-radius: 999px;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
}

.badge-pin {
  background: rgba(58, 58, 58, 0.88);
}

.badge-update {
  background: rgba(160, 144, 128, 0.9);
}

/* ── Select Check (grid) ── */
.select-check {
  position: absolute;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid #c0c0c0;
  background: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  color: #fff;
  z-index: 2;
}

.book-card > .select-check {
  top: 14px;
  left: 14px;
}

.select-check.checked {
  background: #A09080;
  border-color: #A09080;
}

/* ── Select Check (list) ── */
.select-check--list {
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
}

.select-check--fav {
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
}

/* ── Book Info ── */
.book-info {
  min-width: 0;
  flex: 1;
}

/* ── Grid Card ── */
.book-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 6px 18px rgba(31, 31, 31, 0.045);
}

.grid-name {
  display: block;
  margin-top: 8px;
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 800;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-author {
  display: block;
  margin-top: 3px;
  color: #8C8C8C;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.grid-progress {
  color: #A0A0A0;
  font-size: 11px;
}

/* ── List Row ── */
.book-row {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.book-row:last-child {
  border-bottom: none;
}

.list-name {
  display: block;
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 800;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.book-author {
  color: #8C8C8C;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-meta-sep {
  color: #C0C0C0;
  font-size: 12px;
}

.book-wordcount {
  color: #8C8C8C;
  font-size: 13px;
  flex-shrink: 0;
}

.book-progress {
  display: block;
  margin-top: 4px;
  color: #8C8C8C;
  font-size: 12px;
}

/* ── Tags ── */
.book-tag {
  display: inline-block;
  margin-left: 4px;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.book-tag.done {
  background: rgba(0, 0, 0, 0.06);
  color: #8C8C8C;
}

.book-tag.update {
  background: rgba(160, 144, 128, 0.15);
  color: #A09080;
}

/* ── Book Desc (list mode) ── */
.book-desc {
  display: block;
  margin-top: 5px;
  color: #A0A0A0;
  font-size: 12px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── History Tab ── */
.history-list-shelf {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-item-shelf {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #FFFFFF;
  box-shadow: 0 2px 8px rgba(31, 31, 31, 0.04);
  align-items: flex-start;
}

.history-item-shelf :deep(.book-cover) {
  flex-shrink: 0;
  width: 40px;
  height: 54px;
  border-radius: 4px;
}

.history-info-shelf {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
}

.history-title-shelf {
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-author-shelf {
  color: #A09080;
  font-size: 11px;
}

.history-time-shelf {
  color: #B0B0B0;
  font-size: 10px;
}

/* ── Batch Bar ── */
.batch-bar {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -6px 18px rgba(31, 31, 31, 0.06);
  z-index: 200;
}

.batch-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-check {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid #C0C0C0;
  font-size: 12px;
  color: #fff;
}

.batch-check.checked {
  background: #A09080;
  border-color: #A09080;
}

.batch-label {
  color: #3A3A3A;
  font-size: 14px;
  font-weight: 700;
}

.batch-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.batch-btn {
  height: 34px;
  line-height: 34px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
}

.batch-btn.cancel {
  background: #F0F0ED;
  color: #5A5A5A;
}

.batch-btn.pin {
  background: #F0F0ED;
  color: #3A3A3A;
}

.batch-btn.remove {
  background: #8c3c32;
  color: #fff;
}

.batch-btn.disabled {
  opacity: 0.4;
  pointer-events: none;
}

@media (min-width: 720px) {
  .page {
    padding-left: 24px;
    padding-right: 24px;
  }
}
</style>
