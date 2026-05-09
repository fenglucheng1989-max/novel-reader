<template>
  <view class="page">
    <!-- Header -->
    <view class="header">
      <text class="back" @tap="goBack">&#8249;</text>
      <view class="header-center">
        <view class="header-title-row">
          <text class="title-line"></text>
          <text class="title-ornament">✦</text>
          <text class="header-title">{{ currentRank.label }}</text>
          <text class="title-ornament">✦</text>
          <text class="title-line"></text>
        </view>
        <text class="header-sub">{{ currentRank.desc }}</text>
      </view>
      <text class="header-spacer"></text>
    </view>

    <!-- Category Tabs -->
    <scroll-view class="cate-scroll" scroll-x :show-scrollbar="false">
      <text
        v-for="c in cateTabs"
        :key="c.key"
        class="cate-item"
        :class="{ on: activeCate === c.key }"
        @tap="activeCate = c.key; load()"
      >{{ c.name }}</text>
    </scroll-view>

    <!-- Body: Left Rail + Right List -->
    <view class="body-row">
      <scroll-view class="rail" scroll-y>
        <view
          v-for="r in rankTabs"
          :key="r.key"
          class="rail-item"
          :class="{ active: activeRank === r.key }"
          @tap="activeRank = r.key; load()"
        >
          <text class="rail-icon" v-if="activeRank === r.key">▪</text>
          <text>{{ r.label }}</text>
        </view>
      </scroll-view>

      <scroll-view class="list-area" scroll-y>
        <view v-if="loading" class="state">正在加载...</view>
        <view v-else-if="!rankBooks.length" class="state">暂无内容</view>
        <view v-else class="list">
          <view
            v-for="(book, index) in rankBooks"
            :key="book.id"
            class="book-row"
            @tap="goDetail(book.id)"
          >
            <text class="book-no" :class="{ 'book-no--top': index < 3 }">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1 }}</text>
            <BookCover :title="book.title" :cover-url="book.coverUrl" size="md" />
            <view class="book-info">
              <text class="book-title">{{ book.title }}</text>
              <text class="book-sub">{{ book.author || '佚名' }} · {{ statusLabel(book.status) }}</text>
              <text class="book-meta">{{ wordText(book.wordCount) }} <text v-if="book.latestChapterTitle">· {{ book.latestChapterTitle }}</text></text>
            </view>
          </view>
        </view>
      </scroll-view>
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
const activeCate = ref('all')
const activeRank = ref('recommend')

const cateTabs = [
  { key: 'all', name: '全部' },
  { key: 'novel', name: '小说' },
  { key: 'short', name: '短剧' },
  { key: 'audio', name: '听书' }
]

const rankTabs = [
  { key: 'recommend', label: '推荐榜', desc: '根据阅读热度排行' },
  { key: 'hot', label: '热门榜', desc: '全网热度排行' },
  { key: 'new', label: '新书榜', desc: '最近更新优先' },
  { key: 'completed', label: '完结榜', desc: '完本好书推荐' }
]

const currentRank = computed(() => rankTabs.find((r) => r.key === activeRank.value) || rankTabs[0])

const cateGroupKeyMap = {
  all: null,
  novel: null,
  short: 'short',
  audio: 'audio'
}

async function load() {
  loading.value = true
  const cid = categoryId.value || null
  const group = cateGroupKeyMap[activeCate.value]
  try {
    await bookStore.loadCategories()
    let res
    switch (activeRank.value) {
      case 'recommend':
        res = await bookStore.loadRank(cid, 50, group)
        rankBooks.value = res.code === 200 ? (res.data || []) : []
        break
      case 'hot':
        res = await bookStore.loadFilter({ categoryId: cid, groupKey: group, sortBy: 'chapterCount', pageSize: 50 })
        rankBooks.value = res.code === 200 ? (res.data?.records || []) : []
        break
      case 'new':
        res = await bookStore.loadFilter({ categoryId: cid, groupKey: group, sortBy: 'latest', pageSize: 50 })
        rankBooks.value = res.code === 200 ? (res.data?.records || []) : []
        break
      case 'completed':
        res = await bookStore.loadFilter({ categoryId: cid, groupKey: group, status: 'COMPLETED', sortBy: 'wordCount', pageSize: 50 })
        rankBooks.value = res.code === 200 ? (res.data?.records || []) : []
        break
    }
  } finally {
    loading.value = false
  }
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/index/index' })
  }
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function statusLabel(s) {
  return s === 'COMPLETED' ? '完结' : '连载'
}

function wordText(count) {
  const n = Number(count || 0)
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万字` : `${n}字`
}

onLoad((query) => {
  categoryId.value = Number(query?.categoryId || 0)
  if (query?.type && rankTabs.some((t) => t.key === query.type)) {
    activeRank.value = query.type
  }
  load()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F4F4F1;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 4px;
}

.back {
  flex-shrink: 0;
  width: 40px;
  color: #8C8C8C;
  font-size: 22px;
}

.header-center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-line {
  width: 24px;
  height: 1px;
  background: #C4B8A8;
  border-radius: 1px;
}

.title-ornament {
  color: #C4B8A8;
  font-size: 8px;
  line-height: 1;
}

.header-title {
  color: #1F1F1F;
  font-size: 18px;
  font-weight: 900;
}

.header-sub {
  margin-top: 4px;
  color: #A09080;
  font-size: 11px;
}

.header-spacer {
  width: 40px;
}

/* Category Tabs */
.cate-scroll {
  padding: 10px 12px 8px;
  height: 30px;
  white-space: nowrap;
}

.cate-scroll :deep(.uni-scroll-view-content) {
  display: flex;
  gap: 20px;
  align-items: center;
  height: 30px;
}

.cate-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 30px;
  color: #8C8C8C;
  font-size: 13px;
  font-weight: 800;
}

.cate-item.on {
  color: #1F1F1F;
  font-weight: 900;
}

.cate-item.on::after {
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

/* Body */
.body-row {
  flex: 1;
  display: flex;
  min-height: 0;
  padding: 0 12px;
  gap: 10px;
}

/* Left Rail */
.rail {
  flex-shrink: 0;
  width: 72px;
  height: 100%;
  padding: 6px 0;
  border-radius: 8px;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.rail-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 40px;
  color: #8C8C8C;
  font-size: 13px;
  font-weight: 800;
}

.rail-item.active {
  color: #1F1F1F;
  background: #F4F4F1;
}

.rail-icon {
  color: #A09080;
  font-size: 8px;
}

/* Right List */
.list-area {
  flex: 1;
  min-width: 0;
  height: 100%;
  border-radius: 8px;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.list {
  padding: 4px 0;
}

.book-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
}

.book-row:active {
  background: #F4F4F1;
}

.book-no {
  flex-shrink: 0;
  width: 24px;
  text-align: center;
  color: #B0B0B0;
  font-size: 13px;
  font-weight: 900;
}

.book-no--top {
  font-size: 18px;
}

.book-row :deep(.book-cover) {
  flex-shrink: 0;
  width: 40px;
  height: 54px;
  border-radius: 4px;
}

.book-info {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.book-title {
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-sub {
  color: #A09080;
  font-size: 11px;
}

.book-meta {
  color: #B0B0B0;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* State */
.state {
  padding: 48px 0;
  color: #8C8C8C;
  text-align: center;
  font-size: 13px;
}
</style>
