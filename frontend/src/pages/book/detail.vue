<template>
  <view class="page">
    <view v-if="loading" class="empty">正在加载详情...</view>
    <view v-else-if="!detail" class="empty">书籍不存在</view>
    <template v-else>
      <!-- Hero -->
      <view class="hero">
        <view class="hero-cover">
          <text class="cover-text">{{ coverText(detail.book.title) }}</text>
        </view>
        <view class="hero-info">
          <text class="title">{{ detail.book.title }}</text>
          <text class="author">{{ detail.book.author || '佚名' }}</text>
          <view class="hero-meta-row">
            <text class="meta-tag" :class="statusClass">{{ statusText(detail.book.status) }}</text>
            <text class="meta-text">{{ formatWordCount(detail.book.wordCount) }}字</text>
            <text class="meta-text">{{ detail.categoryName || '未分类' }}</text>
          </view>
        </view>
      </view>

      <!-- Stats -->
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-value">{{ formatRating(detail.rating) }}</text>
          <text class="stat-label">评分</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-value">{{ formatCount(detail.readingCount) }}</text>
          <text class="stat-label">阅读人数</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-value">{{ formatCount(detail.favoriteCount) }}</text>
          <text class="stat-label">收藏</text>
        </view>
      </view>

      <!-- Tags + reading time -->
      <view v-if="detail.tags && detail.tags.length" class="tags-row">
        <text v-for="tag in detail.tags" :key="tag" class="tag-chip">{{ tag }}</text>
        <text v-if="detail.estimatedReadingMinutes" class="reading-time">
          预计阅读 {{ formatReadingTime(detail.estimatedReadingMinutes) }}
        </text>
      </view>
      <view v-else-if="detail.estimatedReadingMinutes" class="reading-time-row">
        <text class="reading-time">预计阅读 {{ formatReadingTime(detail.estimatedReadingMinutes) }}</text>
      </view>

      <!-- Description -->
      <view class="section">
        <text class="section-title">简介</text>
        <view class="foldable">
          <view class="desc" :class="{ collapsed: shouldFold && !descExpanded }">
            {{ detail.book.description || '暂无简介' }}
          </view>
          <text v-if="shouldFold" class="fold-btn" @tap="descExpanded = !descExpanded">
            {{ descExpanded ? '收起' : '展开' }}
          </text>
        </view>
      </view>

      <!-- TOC preview -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">目录</text>
          <text class="section-extra">{{ tocPreview.length }} / {{ detail.chapters.length }} 章</text>
        </view>
        <view
          v-for="chapter in tocPreview"
          :key="chapter.id"
          class="chapter-item"
          @tap="readChapter(chapter.chapterNo)"
        >
          <text class="chapter-title">{{ chapter.title }}</text>
          <text class="chapter-words">{{ chapter.wordCount || 0 }} 字</text>
        </view>
        <view v-if="!detail.chapters.length" class="chapter-empty">暂无章节</view>
        <view v-else-if="detail.chapters.length > tocPreview.length" class="toc-more" @tap="readChapter(1)">
          <text>查看全部 {{ detail.chapters.length }} 章</text>
          <text class="arrow">&#x203A;</text>
        </view>
      </view>

      <!-- Comments placeholder -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">热门评论</text>
        </view>
        <view class="comment-placeholder">
          <text class="placeholder-text">评论功能即将上线</text>
        </view>
      </view>

      <!-- Similar recommendations placeholder -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">相似推荐</text>
        </view>
        <view class="comment-placeholder">
          <text class="placeholder-text">推荐功能即将上线</text>
        </view>
      </view>

      <!-- Bottom spacing for fixed CTA -->
      <view class="bottom-spacer" />
    </template>

    <!-- Fixed bottom CTA -->
    <view v-if="detail" class="bottom-bar">
      <button class="cta-shelf" @tap="toggleShelf">
        {{ detail.inBookshelf ? '已加入书架' : '加入书架' }}
      </button>
      <button class="cta-read" @tap="startRead">开始阅读</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import { useUserStore } from '../../store/user'

const FOLD_THRESHOLD = 70
const TOC_PREVIEW_COUNT = 10
const bookStore = useBookStore()
const userStore = useUserStore()
const id = ref('')
const detail = ref(null)
const loading = ref(false)
const descExpanded = ref(false)

const tocPreview = computed(() => (detail.value?.chapters || []).slice(0, TOC_PREVIEW_COUNT))
const shouldFold = computed(() => (detail.value?.book?.description || '').length > FOLD_THRESHOLD)
const statusClass = computed(() => {
  const s = detail.value?.book?.status
  if (s === 'COMPLETED') return 'status-completed'
  if (s === 'PAUSED') return 'status-paused'
  return 'status-ongoing'
})

async function load() {
  loading.value = true
  try {
    const res = await bookStore.loadDetail(id.value)
    if (res.code === 200) detail.value = res.data
  } finally {
    loading.value = false
  }
}

async function toggleShelf() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/mine/mine' }), 800)
    return
  }
  if (detail.value.inBookshelf) {
    await bookStore.removeShelf(id.value)
    uni.showToast({ title: '已移出书架', icon: 'none' })
  } else {
    await bookStore.addShelf(id.value)
    uni.showToast({ title: '已加入书架', icon: 'success' })
  }
  await load()
}

function startRead() {
  const chapters = detail.value?.chapters
  if (!chapters?.length) {
    uni.showToast({ title: '暂无可读章节', icon: 'none' })
    return
  }
  readChapter(chapters[0].chapterNo)
}

function readChapter(chapterNo) {
  uni.navigateTo({ url: `/pages/reader/reader?bookId=${id.value}&chapterNo=${chapterNo}` })
}

function coverText(title) {
  return (title || '书').slice(0, 2)
}

function statusText(status) {
  if (status === 'COMPLETED') return '完结'
  if (status === 'PAUSED') return '暂停'
  return '连载'
}

function formatWordCount(count) {
  if (!count) return '0'
  if (count >= 10000) return (count / 10000).toFixed(1) + '万'
  return String(count)
}

function formatRating(rating) {
  if (rating == null) return '-'
  return Number(rating).toFixed(1)
}

function formatCount(count) {
  if (count == null) return '-'
  if (count >= 10000) return (count / 10000).toFixed(1) + '万'
  return String(count)
}

function formatReadingTime(minutes) {
  if (!minutes || minutes < 1) return ''
  if (minutes < 60) return `${minutes} 分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`
}

onLoad((query) => {
  id.value = query.id
  load()
})
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  padding: 16px 16px 72px;
  background: #f6f3ee;
  box-sizing: border-box;
  overflow-x: hidden;
}

.empty {
  padding: 60px 0;
  color: #81776c;
  text-align: center;
}

/* ---- Hero ---- */
.hero {
  display: flex;
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.hero-cover {
  width: 96px;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: linear-gradient(135deg, #2f6f5e 0%, #5a9e87 100%);
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  flex-shrink: 0;
}

.hero-info {
  flex: 1;
  min-width: 0;
  margin-left: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  display: block;
  color: #1a231f;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  margin-bottom: 8px;
}

.author {
  display: block;
  color: #6b6358;
  font-size: 14px;
  margin-bottom: 10px;
}

.hero-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.meta-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 20px;
}

.status-ongoing {
  background: #e8f5e9;
  color: #2f6f5e;
}

.status-completed {
  background: #e3f2fd;
  color: #1565c0;
}

.status-paused {
  background: #fff3e0;
  color: #e65100;
}

.meta-text {
  color: #9a8f83;
  font-size: 12px;
}

/* ---- Stats ---- */
.stats-row {
  display: flex;
  align-items: center;
  margin-top: 12px;
  padding: 14px 0;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  color: #1a231f;
  font-size: 18px;
  font-weight: 700;
}

.stat-label {
  color: #9a8f83;
  font-size: 12px;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #e8e2d6;
}

/* ---- Tags ---- */
.tags-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 0;
  flex-wrap: wrap;
}

.tag-chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 14px;
  background: rgba(47, 111, 94, 0.08);
  color: #2f6f5e;
  font-size: 12px;
  line-height: 20px;
}

.reading-time,
.reading-time-row {
  margin-top: 0;
}

.reading-time {
  color: #9a8f83;
  font-size: 12px;
  margin-left: auto;
}

.reading-time-row {
  padding: 8px 0;
}

.reading-time-row .reading-time {
  margin-left: 0;
}

/* ---- Section ---- */
.section {
  margin-top: 12px;
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.section-title {
  color: #1a231f;
  font-size: 17px;
  font-weight: 700;
}

.section-extra {
  color: #9a8f83;
  font-size: 12px;
}

/* ---- Desc ---- */
.foldable {
  margin-top: 10px;
  padding-bottom: 20px;
  position: relative;
}

.desc {
  color: #4c5550;
  font-size: 14px;
  line-height: 23px;
  white-space: normal;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.desc.collapsed {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.fold-btn {
  position: absolute;
  right: 0;
  bottom: 0;
  color: #2f6f5e;
  font-size: 13px;
  padding: 2px 0;
}

/* ---- Chapters ---- */
.chapter-item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 0;
  border-top: 1px solid #f0ebe0;
}

.chapter-item:first-of-type {
  margin-top: 8px;
}

.chapter-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333b37;
  font-size: 15px;
}

.chapter-words {
  flex-shrink: 0;
  color: #b0a595;
  font-size: 12px;
}

.chapter-empty {
  padding: 18px 0 4px;
  color: #b0a595;
  text-align: center;
  font-size: 13px;
}

.toc-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px 0 2px;
  color: #2f6f5e;
  font-size: 14px;
}

.toc-more .arrow {
  font-size: 18px;
}

/* ---- Comments placeholder ---- */
.comment-placeholder {
  padding: 28px 0;
  text-align: center;
}

.placeholder-text {
  color: #bfb5a6;
  font-size: 13px;
}

/* ---- Bottom bar ---- */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  gap: 12px;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
}

.cta-shelf,
.cta-read {
  height: 44px;
  line-height: 44px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
}

.cta-shelf {
  flex: 1;
  background: #f0ede5;
  color: #2f6f5e;
  border: 1px solid #ddd8cc;
}

.cta-read {
  flex: 2;
  background: #2f6f5e;
  color: #fff;
}

.cta-shelf:active {
  background: #e6e0d6;
}

.cta-read:active {
  background: #265a4d;
}

.bottom-spacer {
  height: 16px;
}
</style>
