<template>
  <view class="page">
    <view class="rank-shell">
      <view class="nav-bar">
        <view class="nav-button" @tap="goBack">‹</view>
        <text class="nav-title">完整榜单</text>
        <view class="nav-placeholder"></view>
      </view>

      <view class="rank-tabs">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          class="rank-tab"
          :class="{ active: activeTab === tab.key }"
          @tap="switchTab(tab.key)"
        >{{ tab.label }}</view>
      </view>

      <view v-if="loading" class="empty">正在加载榜单...</view>
      <view v-else-if="!rankBooks.length" class="empty">
        <text class="empty-title">暂无榜单内容</text>
        <text class="empty-subtitle">可以先去后台维护书籍和章节。</text>
      </view>
      <view v-else class="rank-list">
        <view
          v-for="(book, index) in rankBooks"
          :key="book.id"
          class="rank-card"
          @tap="goDetail(book.id)"
        >
          <view class="rank-no" :class="{ top: index < 3 }">{{ index + 1 }}</view>
          <BookCover :title="book.title" size="md" />
          <view class="book-main">
            <view class="book-line">
              <text class="book-title">{{ book.title }}</text>
              <text class="status-badge" :class="book.status === 'COMPLETED' ? 'status-done' : 'status-ongoing'">{{ statusLabel(book.status) }}</text>
            </view>
            <text class="meta">{{ book.author || '佚名' }} · {{ book.chapterCount || 0 }}章 · {{ wordText(book.wordCount) }}</text>
            <text class="latest">{{ book.latestChapterTitle || '暂无章节' }}</text>
            <view class="score-row">
              <text class="score-label">{{ scoreLabel }}</text>
              <view class="score-track">
                <view class="score-fill" :style="{ width: scoreWidth(book) }"></view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import BookCover from '../../components/BookCover.vue'

const bookStore = useBookStore()
const loading = ref(false)
const rankBooks = ref([])
const categoryId = ref(0)
const activeTab = ref('recommend')

const tabs = [
  { key: 'recommend', label: '推荐榜' },
  { key: 'hot', label: '热门榜' },
  { key: 'new', label: '新书榜' },
  { key: 'completed', label: '完结榜' }
]

const scoreLabel = computed(() => {
  if (activeTab.value === 'recommend') return '综合热度'
  if (activeTab.value === 'hot') return '章节数'
  if (activeTab.value === 'new') return '最近更新'
  return '总字数'
})

const maxScore = computed(() => {
  const scores = rankBooks.value.map((book) => rankScore(book))
  return scores.length ? Math.max(1, ...scores) : 1
})

async function load() {
  loading.value = true
  try {
    await bookStore.loadCategories()
    const cid = categoryId.value || null
    let res

    switch (activeTab.value) {
      case 'recommend':
        res = await bookStore.loadRank(cid, 50)
        rankBooks.value = res.code === 200 ? (res.data || []) : []
        break
      case 'hot':
        res = await bookStore.loadFilter({ categoryId: cid, sortBy: 'chapterCount', pageSize: 50 })
        rankBooks.value = res.code === 200 ? (res.data?.records || []) : []
        break
      case 'new':
        res = await bookStore.loadFilter({ categoryId: cid, sortBy: 'latest', pageSize: 50 })
        rankBooks.value = res.code === 200 ? (res.data?.records || []) : []
        break
      case 'completed':
        res = await bookStore.loadFilter({ categoryId: cid, status: 'COMPLETED', sortBy: 'wordCount', pageSize: 50 })
        rankBooks.value = res.code === 200 ? (res.data?.records || []) : []
        break
    }
  } finally {
    loading.value = false
  }
}

function switchTab(key) {
  if (activeTab.value === key) return
  activeTab.value = key
  load()
}

function goBack() {
  uni.navigateBack({
    fail: () => uni.switchTab({ url: '/pages/index/index' })
  })
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function statusLabel(status) {
  if (status === 'COMPLETED') return '完结'
  return '连载'
}

function wordText(count) {
  const value = Number(count || 0)
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万字`
  return `${value}字`
}

function rankScore(book) {
  if (activeTab.value === 'completed') return Number(book.wordCount || 0)
  return Number(book.chapterCount || 0) * 1000 + Number(book.wordCount || 0)
}

function scoreWidth(book) {
  const percent = Math.max(8, Math.round((rankScore(book) / maxScore.value) * 100))
  return `${Math.min(percent, 100)}%`
}

onLoad((query) => {
  categoryId.value = Number(query?.categoryId || 0)
  if (query?.type && tabs.some((t) => t.key === query.type)) {
    activeTab.value = query.type
  }
  load()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 14px 14px 88px;
  background: #f6f3ee;
  box-sizing: border-box;
}

.rank-shell {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.nav-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  margin-bottom: 12px;
}

.nav-button,
.nav-placeholder {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e5ddd2;
  color: #25332e;
  font-size: 28px;
  font-weight: 500;
}

.nav-title {
  position: absolute;
  left: 50%;
  max-width: calc(100% - 112px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #17221e;
  font-size: 17px;
  font-weight: 900;
  transform: translateX(-50%);
}

.rank-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  padding: 6px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(31, 42, 38, 0.04);
}

.rank-tab {
  flex: 1;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #81776c;
  font-size: 14px;
  font-weight: 800;
}

.rank-tab.active {
  background: #2f6f5e;
  color: #fff;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-card {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(31, 42, 38, 0.05);
}

.rank-no {
  flex: 0 0 28px;
  color: #9a6b45;
  font-size: 18px;
  font-weight: 900;
  text-align: center;
}

.rank-no.top {
  color: #2f6f5e;
}

.book-main {
  min-width: 0;
  flex: 1;
}

.book-line {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.book-title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1f2a26;
  font-size: 16px;
  font-weight: 900;
  display: block;
}

.status-badge {
  flex: 0 0 auto;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.status-ongoing {
  background: #e8f0ed;
  color: #2f6f5e;
}

.status-done {
  background: #f0e8e3;
  color: #9a6b45;
}

.meta,
.latest {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #81776c;
  font-size: 12px;
  display: block;
}

.latest {
  color: #9a6b45;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.score-label {
  flex: 0 0 auto;
  color: #8d8175;
  font-size: 11px;
}

.score-track {
  flex: 1;
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1e7dc;
}

.score-fill {
  height: 100%;
  border-radius: 999px;
  background: #2f6f5e;
}

.empty {
  padding: 64px 0;
  color: #81776c;
  text-align: center;
}

.empty-title {
  color: #333b37;
  font-size: 17px;
  font-weight: 800;
  display: block;
}

.empty-subtitle {
  margin-top: 8px;
  color: #94897c;
  font-size: 13px;
  display: block;
}

@media (min-width: 720px) {
  .page { padding-left: 22px; padding-right: 22px; }
}
</style>
