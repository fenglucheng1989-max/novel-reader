<template>
  <view class="page">
    <!-- Row 1: Search + Category -->
    <view class="top-row">
      <view class="search-entry" @tap="goSearch">
        <text class="search-icon">⌕</text>
        <text class="search-placeholder">搜索书名、作者或关键词</text>
      </view>
      <!-- <view class="cate-btn" @tap="goCategory">
        <text class="cate-btn-icon">⊞</text>
        <text>分类</text>
      </view> -->
    </view>
    <view v-if="categoryId" class="active-cate-row">
      <text class="active-cate-chip">{{ activeCateName }} <text class="active-cate-close" @tap="bookStore.selectCategory(0); load()">×</text></text>
    </view>

    <!-- Row 2: Main Tabs -->
    <scroll-view class="main-tabs" scroll-x :show-scrollbar="false">
      <text
        v-for="t in mainTabs"
        :key="t.key"
        class="main-tab"
        :class="{ active: activeMain === t.key }"
        @tap="switchMain(t.key)"
      >{{ t.name }}</text>
    </scroll-view>

    <!-- Row 3: Sub Tabs + Full Rank Link -->
    <view class="sub-row">
      <view class="sub-tabs">
        <text
          v-for="s in subTabs"
          :key="s.key"
          class="sub-tab"
          :class="{ on: activeSub === s.key }"
          @tap="activeSub = s.key; loadRank()"
        >{{ s.label }}</text>
      </view>
      <text class="full-link" @tap="goFullRank">完整榜单 ›</text>
    </view>

    <!-- Row 4: Rank Card (2 cols × 4 rows, swipeable) -->
    <view class="rank-card-wrap" v-if="rankBooks.length">
      <scroll-view class="rank-scroll" scroll-x :show-scrollbar="false" @scroll="onRankScroll">
        <view class="rank-track">
          <view
            v-for="(page, pi) in rankPages"
            :key="pi"
            class="rank-page"
          >
            <view
              v-for="(book, bi) in pageBooks(pi)"
              :key="book.id"
              class="rank-item"
              @tap="goDetail(book.id)"
            >
              <BookCover :title="book.title" :cover-url="book.coverUrl" size="sm" />
              <text class="rank-no" :class="{ 'rank-no--top': (pi * perPage + bi) < 3 }">{{ pi * perPage + bi + 1 }}</text>
              <view class="rank-info">
                <text class="rank-title">{{ book.title }}</text>
                <text class="rank-chapter">{{ book.latestChapterTitle || (book.description || '').slice(0, 20) }}</text>
                <view class="rank-tags">
                  <text class="rank-tag">{{ book.author || '佚名' }}</text>
                  <text class="rank-tag rank-tag--status" :class="{ done: book.status === 'COMPLETED' }">{{ statusLabel(book.status) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="loading" class="state">正在加载书城...</view>

    <template v-else>
      <!-- Editor Picks -->
      <view class="sec-card">
        <view class="sec-card-hd">
          <view class="sec-card-title-row">
            <text class="sec-card-icon">✦</text>
            <text class="sec-card-title">编辑精选</text>
          </view>
          <text class="sec-card-sub">为你甄选</text>
        </view>
        <scroll-view class="h-scroll" scroll-x :show-scrollbar="false">
          <view
            v-for="book in editorialBooks"
            :key="book.id"
            class="pick-card"
            @tap="goDetail(book.id)"
          >
            <BookCover :title="book.title" :cover-url="book.coverUrl" size="lg" />
            <text class="pick-name">{{ book.title }}</text>
            <text class="pick-author">{{ book.author || '佚名' }}</text>
            <text class="pick-desc">{{ (book.description || '').slice(0, 20) }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- New Books - Staggered -->
      <view class="sec-card" v-if="newBooks.length">
        <view class="sec-card-hd">
          <view class="sec-card-title-row">
            <text class="sec-card-icon">⌛</text>
            <text class="sec-card-title">热门新书</text>
          </view>
          <text class="sec-card-sub">新鲜上架</text>
        </view>
        <view class="new-list">
          <view
            v-for="(book, i) in newBooks"
            :key="book.id"
            class="new-card"
            :class="{ 'new-card--alt': i % 2 === 1 }"
            @tap="goDetail(book.id)"
          >
            <BookCover :title="book.title" :cover-url="book.coverUrl" size="md" />
            <view class="new-info">
              <text class="new-title">{{ book.title }}</text>
              <text class="new-author">{{ book.author || '佚名' }} · {{ statusLabel(book.status) }} · {{ book.chapterCount || 0 }}章</text>
              <text class="new-desc">{{ (book.description || '').slice(0, 60) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Completed - Horizontal Scroll -->
      <view class="sec-card" v-if="completedBooks.length">
        <view class="sec-card-hd">
          <view class="sec-card-title-row">
            <text class="sec-card-icon">✓</text>
            <text class="sec-card-title">完结精选</text>
          </view>
          <text class="sec-card-sub">一口气读完</text>
        </view>
        <scroll-view class="h-scroll" scroll-x :show-scrollbar="false">
          <view
            v-for="book in completedBooks"
            :key="book.id"
            class="done-card"
            @tap="goDetail(book.id)"
          >
            <BookCover :title="book.title" :cover-url="book.coverUrl" size="sm" />
            <text class="done-name">{{ book.title }}</text>
            <text class="done-author">{{ book.author || '佚名' }}</text>
          </view>
        </scroll-view>
      </view>

      <view v-if="!editorialBooks.length && !newBooks.length && !completedBooks.length" class="state">
        <text class="state-title">暂无书籍</text>
      </view>

      <view class="ender">—— 已经到底了 ——</view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import BookCover from '../../components/BookCover.vue'

const bookStore = useBookStore()
const loading = ref(false)
const hasAnyData = computed(() => editorialBooks.value.length > 0 || newBooks.value.length > 0 || completedBooks.value.length > 0)
const activeMain = ref('recommend')
const activeSub = ref('hot')

const rankBooks = ref([])
const editorialBooks = ref([])
const newBooks = ref([])
const completedBooks = ref([])

const groupKey = computed(() => {
  return activeMain.value === 'recommend' ? null : activeMain.value
})

const categoryId = computed(() => {
  return bookStore.selectedCategoryId || null
})

const activeCateName = computed(() => {
  if (!bookStore.selectedCategoryId) return ''
  const cat = bookStore.categories.find(c => c.id === bookStore.selectedCategoryId)
  return cat ? cat.name : ''
})

const rankPage = ref(0)
const perPage = 8
const rankPages = computed(() => {
  const n = Math.ceil(rankBooks.value.length / perPage)
  return Array.from({ length: n }, (_, i) => i)
})
function pageBooks(pi) {
  const start = pi * perPage
  return rankBooks.value.slice(start, start + perPage)
}

const mainTabs = [
  { key: 'recommend', name: '推荐' },
  { key: 'male', name: '男生' },
  { key: 'female', name: '女生' },
  { key: 'audio', name: '听书' },
  { key: 'short', name: '短剧' }
]

const subTabs = [
  { key: 'hot', label: '推荐榜' },
  { key: 'completed', label: '完结榜' },
  { key: 'new', label: '新书榜' }
]

const subApiMap = {
  hot: { sortBy: 'chapterCount', pageSize: 16 },
  completed: { status: 'COMPLETED', sortBy: 'chapterCount', pageSize: 16 },
  new: { sortBy: 'latest', pageSize: 16 }
}

function onRankScroll(e) {
  const x = e.detail.scrollLeft
  const w = e.detail.scrollWidth / rankPages.value.length
  if (w > 0) rankPage.value = Math.round(x / w)
}

async function load() {
  if (!hasAnyData.value) {
    loading.value = true
  }
  try {
    await bookStore.loadCategories()
    await Promise.allSettled([
      loadRank(),
      loadEditorial(),
      loadNewBooks(),
      loadCompleted()
    ])
  } finally {
    loading.value = false
  }
}

async function loadRank() {
  const cfg = subApiMap[activeSub.value] || subApiMap.hot
  try {
    const res = await bookStore.loadFilter({ ...cfg, groupKey: groupKey.value, categoryId: categoryId.value, silent: true })
    if (res.code === 200) {
      rankBooks.value = res.data?.records || []
      rankPage.value = 0
    }
  } catch { /* ignore */ }
}

async function loadEditorial() {
  try {
    const res = await bookStore.loadFeatured(8, groupKey.value)
    if (res.code === 200) editorialBooks.value = res.data || []
  } catch { /* ignore */ }
}

async function loadNewBooks() {
  try {
    const res = await bookStore.loadFilter({
      groupKey: groupKey.value,
      categoryId: categoryId.value,
      sortBy: 'latest',
      pageSize: 10
    })
    if (res.code === 200) newBooks.value = res.data?.records || []
  } catch { /* ignore */ }
}

async function loadCompleted() {
  try {
    const res = await bookStore.loadFilter({
      groupKey: groupKey.value,
      categoryId: categoryId.value,
      status: 'COMPLETED',
      pageSize: 10
    })
    if (res.code === 200) completedBooks.value = res.data?.records || []
  } catch { /* ignore */ }
}

function switchMain(key) {
  activeMain.value = key
  bookStore.selectCategory(0)
  load()
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/search' })
}

function goCategory() {
  uni.navigateTo({ url: '/pages/category/category' })
}

function goFullRank() {
  uni.navigateTo({ url: `/pages/rank/rank?type=${activeSub.value}` })
}

function statusLabel(s) {
  return s === 'COMPLETED' ? '完结' : '连载'
}

onShow(() => {
  load()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F4F4F1;
  padding: 10px 12px 80px;
  box-sizing: border-box;
}

/* Row 1: Search */
.top-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.search-entry {
  width: 94%;
  min-width: 0;
  height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 8px;
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.search-icon { color: #8C8C8C; font-size: 16px; }

.search-placeholder {
  color: #B0B0B0;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cate-btn {
  flex-shrink: 0;
  height: 34px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  border-radius: 8px;
  background: #FFFFFF;
  color: #8C8C8C;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.cate-btn-icon {
  font-size: 13px;
  color: #A09080;
}

/* Active Category Chip */
.active-cate-row {
  margin-top: 8px;
  display: flex;
}

.active-cate-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: #3A3A3A;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 800;
}

.active-cate-close {
  color: rgba(255,255,255,0.5);
  font-size: 14px;
}

/* Row 2: Main Tabs */
.main-tabs {
  margin-top: 10px;
  height: 30px;
  white-space: nowrap;
}

.main-tabs :deep(.uni-scroll-view-content) {
  display: flex;
  align-items: center;
  gap: 22px;
  height: 30px;
}

.main-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 30px;
  color: #8C8C8C;
  font-size: 15px;
  font-weight: 800;
}

.main-tab.active {
  color: #1F1F1F;
  font-size: 17px;
  font-weight: 900;
}

.main-tab.active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 16px;
  height: 3px;
  border-radius: 999px;
  background: #A09080;
  transform: translateX(-50%);
}

/* Row 3: Sub Tabs */
.sub-row {
  display: flex;
  align-items: center;
  margin-top: 8px;
  gap: 10px;
}

.sub-tabs {
  display: flex;
  gap: 18px;
}

.sub-tab {
  position: relative;
  color: #8C8C8C;
  font-size: 13px;
  font-weight: 800;
  padding-bottom: 4px;
}

.sub-tab.on {
  color: #1F1F1F;
}

.sub-tab.on::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 14px;
  height: 2px;
  border-radius: 999px;
  background: #A09080;
  transform: translateX(-50%);
}

.full-link {
  margin-left: auto;
  flex-shrink: 0;
  color: #A09080;
  font-size: 12px;
  font-weight: 700;
}

/* Row 4: Rank Card */
.rank-card-wrap {
  margin-top: 10px;
  border-radius: 8px;
  background: #FFFFFF;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  padding: 10px 10px 6px;
}

.rank-scroll {
  width: 100%;
  white-space: nowrap;
}

.rank-scroll :deep(.uni-scroll-view-content) {
  display: flex;
}

.rank-track {
  display: flex;
}

.rank-page {
  flex-shrink: 0;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 10px;
}

.rank-item {
  min-width: 0;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.rank-no {
  flex-shrink: 0;
  width: 18px;
  text-align: center;
  color: #B0B0B0;
  font-size: 13px;
  font-weight: 900;
}

.rank-no--top {
  color: #C4A882;
}

.rank-item :deep(.book-cover) {
  flex-shrink: 0;
  width: 40px;
  height: 54px;
  border-radius: 4px;
}

.rank-info {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 54px;
  padding: 1px 0;
}

.rank-title {
  color: #1F1F1F;
  font-size: 13px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 17px;
}

.rank-chapter {
  color: #8C8C8C;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 15px;
}

.rank-tags {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}

.rank-tag {
  height: 17px;
  line-height: 17px;
  padding: 0 6px;
  border-radius: 3px;
  background: #F4F4F1;
  color: #8C8C8C;
  font-size: 10px;
  font-weight: 700;
}

.rank-tag--status {
  color: #A09080;
}

.rank-tag--status.done {
  color: #8FA0B8;
}

/* Section Card */
.sec-card {
  margin-top: 18px;
  padding: 14px 14px 10px;
  border-radius: 10px;
  background: #FFFFFF;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}

.sec-card-hd {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sec-card-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sec-card-icon {
  color: #A09080;
  font-size: 14px;
}

.sec-card-title {
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 900;
}

.sec-card-sub {
  color: #B0B0B0;
  font-size: 11px;
}

/* Section (for non-card sections) */
.sec {
  margin-top: 24px;
}

.sec-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}

.sec-line {
  color: #D0D0C8;
  font-size: 10px;
}

.sec-title {
  color: #1F1F1F;
  font-size: 15px;
  font-weight: 900;
}

/* Editor Picks */
.h-scroll {
  white-space: nowrap;
}

.h-scroll :deep(.uni-scroll-view-content) {
  display: flex;
  gap: 10px;
}

.pick-card {
  flex-shrink: 0;
  width: 110px;
  display: flex;
  flex-direction: column;
}

.pick-name {
  margin-top: 8px;
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pick-author {
  margin-top: 3px;
  color: #A09080;
  font-size: 11px;
}

.pick-desc {
  margin-top: 4px;
  color: #8C8C8C;
  font-size: 11px;
  line-height: 16px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* New Book List */
.new-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.new-card {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background: #F9F8F6;
  align-items: flex-start;
}

.new-card--alt {
  background: #FFFFFF;
}

.new-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding-top: 1px;
}

.new-title {
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-author {
  margin-top: 4px;
  color: #A09080;
  font-size: 11px;
}

.new-desc {
  margin-top: 6px;
  color: #8C8C8C;
  font-size: 12px;
  line-height: 18px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Completed - Horizontal Scroll Small Cards */
.done-card {
  flex-shrink: 0;
  width: 72px;
  display: flex;
  flex-direction: column;
}

.done-name {
  margin-top: 6px;
  color: #1F1F1F;
  font-size: 12px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.done-author {
  margin-top: 1px;
  color: #B0B0B0;
  font-size: 10px;
}

/* State */
.state {
  padding: 52px 0;
  color: #8C8C8C;
  text-align: center;
  font-size: 13px;
}

.state-title {
  display: block;
  color: #1F1F1F;
  font-size: 15px;
  font-weight: 800;
}

.ender {
  padding: 32px 0 16px;
  text-align: center;
  color: #D0D0C8;
  font-size: 11px;
}

@media (min-width: 720px) {
  .page { padding-left: calc((100% - 480px) / 2); padding-right: calc((100% - 480px) / 2); }
  .grid-card { width: calc(50% - 10px); }
}
</style>
