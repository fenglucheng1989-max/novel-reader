<template>
  <view class="page">
    <!-- Search Bar -->
    <view class="search-bar">
      <text class="back-btn" @tap="goBack">&#8249;</text>
      <view class="search-box">
        <input
          v-model="keyword"
          class="search-input"
          confirm-type="search"
          placeholder="搜索书名或作者"
          @confirm="doSearch"
          @input="onInput"
        />
        <text v-if="keyword" class="search-clear" @tap="clearInput">&#10005;</text>
      </view>
      <text class="search-btn" @tap="doSearch">搜索</text>
    </view>

    <!-- Before Search: History + Hot + Rankings -->
    <template v-if="!searched">
      <!-- Search History -->
      <view v-if="history.length" class="section">
        <view class="section-head">
          <text class="section-title">搜索历史</text>
          <text class="section-action" @tap="clearHistory">清除</text>
        </view>
        <scroll-view class="history-scroll" scroll-x :show-scrollbar="false">
          <view class="history-row">
            <text
              v-for="(h, i) in history"
              :key="i"
              class="history-chip"
              @tap="searchTag(h)"
            >{{ h }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- Hot Search -->
      <view class="section">
        <text class="section-title">热门搜索</text>
        <view class="hot-grid">
          <text
            v-for="tag in hotTags"
            :key="tag"
            class="hot-chip"
            @tap="searchTag(tag)"
          >{{ tag }}</text>
        </view>
      </view>

      <!-- Rankings -->
      <view class="section">
        <scroll-view class="rank-scroll" scroll-x :show-scrollbar="false">
          <view class="rank-cards">
            <view
              v-for="tab in rankTabs"
              :key="tab.key"
              class="rank-card"
              :class="`rank-card--${tab.key}`"
              @tap="goRank(tab.key)"
            >
              <text class="rank-card-title">{{ tab.label }}</text>
              <view v-if="rankLoading" class="rank-card-loading">加载中...</view>
              <view v-else class="rank-card-list">
                <view
                  v-for="(book, index) in (rankData[tab.key] || []).slice(0, 10)"
                  :key="book.id"
                  class="rank-card-item"
                  @tap.stop="goDetail(book.id)"
                >
                  <text class="rank-num" :class="{ 'rank-top': index < 3 }">{{ index + 1 }}</text>
                  <BookCover :title="book.title" :cover-url="book.coverUrl" size="sm" class="rank-cover" />
                  <view class="rank-card-info">
                    <view class="rank-card-name-row">
                      <text class="rank-card-name">{{ book.title }}</text>
                      <text v-if="categoryMap[book.categoryId]" class="rank-card-tag">{{ categoryMap[book.categoryId] }}</text>
                    </view>
                    <text class="rank-card-meta">{{ book.author || '佚名' }} · {{ rankScoreText(book, tab.key) }}</text>
                  </view>
                </view>
              </view>
              <text class="rank-card-more">展开 ›</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </template>

    <!-- Search Results -->
    <template v-else>
      <view v-if="loading" class="empty">正在搜索...</view>
      <view v-else-if="!results.length" class="empty">没有找到相关书籍</view>
      <view v-else class="book-section">
        <text class="section-title result-title">搜索结果 ({{ results.length }})</text>
        <view
          v-for="item in results"
          :key="item.id"
          class="book-row"
          @tap="goDetail(item.id)"
        >
          <view class="cover-wrap">
            <BookCover :title="item.title" :cover-url="item.coverUrl" size="md" />
          </view>
          <view class="book-info">
            <text class="list-name">{{ item.title }}</text>
            <view class="list-meta">
              <text class="book-author">{{ item.author || '佚名' }}</text>
              <text v-if="item.wordCount" class="book-meta-sep">·</text>
              <text v-if="item.wordCount" class="book-wordcount">{{ formatWordCount(item.wordCount) }}字</text>
              <text v-if="item.status === 'COMPLETED'" class="book-tag done">完结</text>
              <text v-else class="book-tag ongoing">连载</text>
            </view>
            <text class="book-progress">{{ item.chapterCount || 0 }}章 · {{ item.latestChapterTitle || '暂无章节' }}</text>
            <text v-if="item.description" class="book-desc">{{ item.description }}</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import BookCover from '../../components/BookCover.vue'
import type { Book } from '../../types/book'

const bookStore = useBookStore()
const keyword = ref('')
const loading = ref(false)
const searched = ref(false)
const results = ref<Book[]>([])

const HISTORY_KEY = 'searchHistory'
const MAX_HISTORY = 10
const hotTags: string[] = ['玄幻', '都市', '悬疑', '热血', '重生', '完结', '修真', '科幻']

interface RankTab {
  key: string
  label: string
}

const rankTabs: RankTab[] = [
  { key: 'hot', label: '热搜榜' },
  { key: 'audio', label: '精选榜' },
  { key: 'peak', label: '巅峰榜' },
]

const rankLoading = ref(false)
const rankData = reactive<Record<string, Book[]>>({ hot: [], audio: [], peak: [] })

const categoryMap = computed(() => {
  const map: Record<number, string> = {}
  for (const cat of (bookStore.categories || [])) {
    map[cat.id] = cat.name
  }
  return map
})

const history = ref<string[]>([])

function loadHistory(): void {
  try {
    const raw = uni.getStorageSync(HISTORY_KEY)
    history.value = raw ? JSON.parse(raw as string) : []
  } catch {
    history.value = []
  }
}

function saveHistory(word: string): void {
  const next = [word, ...history.value.filter((h) => h !== word)].slice(0, MAX_HISTORY)
  history.value = next
  uni.setStorageSync(HISTORY_KEY, JSON.stringify(next))
}

function clearHistory(): void {
  history.value = []
  uni.removeStorageSync(HISTORY_KEY)
}

function onInput(e: { detail: { value: string } }): void {
  if (!e.detail.value) {
    keyword.value = ''
  }
}

function clearInput(): void {
  keyword.value = ''
  searched.value = false
  results.value = []
}

async function doSearch(): Promise<void> {
  const kw = keyword.value.trim()
  if (!kw) {
    uni.showToast({ title: '请输入关键词', icon: 'none' })
    return
  }
  saveHistory(kw)
  loading.value = true
  searched.value = true
  try {
    const res = await bookStore.search(kw)
    results.value = res.code === 200 ? (res.data as Book[] || []) : []
  } finally {
    loading.value = false
  }
}

function searchTag(tag: string): void {
  keyword.value = tag
  doSearch()
}

function goBack(): void {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.switchTab({ url: '/pages/index/index' })
}

function goDetail(id: number): void {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function goRank(tabKey: string): void {
  uni.navigateTo({ url: `/pages/rank/rank?type=${tabKey}` })
}

async function loadRankData(): Promise<void> {
  rankLoading.value = true
  try {
    const hotRes = await bookStore.loadFilter({ sortBy: 'chapterCount', pageSize: 10 })
    rankData.hot = hotRes.code === 200 ? ((hotRes.data as { records?: Book[] })?.records || []) : []

    const audioRes = await bookStore.loadFeatured(10)
    rankData.audio = audioRes.code === 200 ? (audioRes.data as Book[] || []) : []

    const peakRes = await bookStore.loadFilter({ sortBy: 'wordCount', pageSize: 10 })
    rankData.peak = peakRes.code === 200 ? ((peakRes.data as { records?: Book[] })?.records || []) : []
  } finally {
    rankLoading.value = false
  }
}

function rankScoreText(book: Book, tabKey: string): string {
  if (tabKey === 'peak') return `${formatWordCount(book.wordCount)}字`
  if (tabKey === 'audio') return book.status === 'COMPLETED' ? '完结' : '连载'
  return `${book.chapterCount || 0}章`
}

function formatWordCount(value: number): string {
  const num = Number(value || 0)
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return String(num)
}

onLoad((options) => {
  bookStore.loadCategories()
  loadHistory()
  loadRankData()
  if (options?.keyword) {
    keyword.value = decodeURIComponent(options.keyword as string)
    doSearch()
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 10px 32px;
  background: #F4F4F1;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* ── Search Bar ── */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.back-btn {
  flex-shrink: 0;
  width: 32px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3A3A3A;
  font-size: 24px;
  font-weight: 300;
}

.search-box {
  display: flex;
  flex: 1;
  align-items: center;
  height: 34px;
  padding: 0 12px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(31, 31, 31, 0.06);
  box-sizing: border-box;
}

.search-input {
  flex: 1;
  height: 34px;
  color: #1F1F1F;
  font-size: 12px;
}

.search-clear {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  color: #999;
  font-size: 10px;
  margin-left: 6px;
}

.search-btn {
  flex-shrink: 0;
  height: 34px;
  line-height: 34px;
  padding: 0 14px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(31, 31, 31, 0.06);
  color: #3A3A3A;
  font-size: 12px;
  font-weight: 700;
}

/* ── Sections ── */
.section {
  margin-bottom: 20px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-title {
  display: block;
  color: #1F1F1F;
  font-size: 17px;
  font-weight: 900;
  margin-bottom: 10px;
}

.section-action {
  color: #8C8C8C;
  font-size: 13px;
  font-weight: 800;
}

/* ── History ── */
.history-scroll {
  white-space: nowrap;
}

.history-scroll ::-webkit-scrollbar {
  display: none;
}

.history-row {
  display: flex;
  gap: 8px;
}

.history-chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: 30px;
  padding: 0 14px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(31, 31, 31, 0.06);
  color: #5A5A5A;
  font-size: 12px;
  font-weight: 600;
}

/* ── Hot Grid ── */
.hot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.hot-chip {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(31, 31, 31, 0.06);
  color: #3A3A3A;
  font-size: 12px;
  font-weight: 700;
}

/* ── Rank Scroll ── */
.rank-scroll {
  white-space: nowrap;
}

.rank-scroll ::-webkit-scrollbar {
  display: none;
}

.rank-cards {
  display: flex;
  gap: 10px;
}

/* ── Rank Card ── */
.rank-card {
  display: inline-flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 240px;
  padding: 16px;
  border-radius: 14px;
  overflow: hidden;
}

.rank-card--hot,
.rank-card--audio,
.rank-card--peak {
  background: #FFFFFF;
}

.rank-card {
  box-shadow: 0 6px 18px rgba(31, 31, 31, 0.045);
}

.rank-card-title {
  display: block;
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 900;
  margin-bottom: 14px;
}

.rank-card-loading {
  padding: 24px 0;
  color: #B0B0B0;
  text-align: center;
  font-size: 12px;
}

.rank-card-list {
  flex: 1;
}

.rank-card-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.rank-card-item:last-child {
  border-bottom: none;
}

.rank-num {
  flex-shrink: 0;
  width: 16px;
  text-align: center;
  color: #B0B0B0;
  font-size: 13px;
  font-weight: 900;
}

.rank-num.rank-top {
  color: #A09080;
}

.rank-cover {
  flex-shrink: 0;
}

.rank-card-info {
  flex: 1;
  min-width: 0;
}

.rank-card-name-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rank-card-name {
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
}

.rank-card-tag {
  flex-shrink: 0;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
  color: #8C8C8C;
  font-size: 10px;
  font-weight: 700;
}

.rank-card-meta {
  display: block;
  margin-top: 2px;
  color: #8C8C8C;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-card-more {
  display: block;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  color: #8C7C6C;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

/* ── Empty ── */
.empty {
  padding: 64px 0;
  color: #8C8C8C;
  text-align: center;
  font-size: 14px;
}

/* ── Results ── */
.result-title {
  margin-bottom: 8px;
}

.book-section {
  margin-top: 4px;
}

.book-row {
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.book-row:last-child {
  border-bottom: none;
}

.cover-wrap {
  position: relative;
  flex-shrink: 0;
  width: 54px;
  height: 74px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.07);
  background: #E8E6E0;
}

.book-info {
  min-width: 0;
  flex: 1;
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

.book-tag.ongoing {
  background: rgba(160, 144, 128, 0.15);
  color: #A09080;
}

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
</style>
