<template>
  <view class="detail-page product-page">
    <view v-if="loading" class="state">正在加载书籍...</view>
    <view v-else-if="!detail" class="state">书籍不存在</view>
    <template v-else>
      <view class="topbar">
        <text class="back" @tap="goBack">‹ 返回</text>
        <view class="top-actions">
          <button class="mini-action" @tap="toggleShelf">{{ detail.inBookshelf ? '✓ 在书架' : '+ 书架' }}</button>
          <button class="mini-action" @tap="startRead">▷ 阅读</button>
        </view>
      </view>

      <view class="hero">
        <view class="cover" :style="coverBgStyle">
          <text v-if="!detail.book.coverUrl">{{ coverText(detail.book.title) }}</text>
        </view>
        <text class="title">{{ detail.book.title }}</text>
        <text class="meta">
          <text class="author">{{ detail.book.author || '佚名' }}</text>
          <text> · {{ statusText(detail.book.status) }} · {{ formatWordCount(detail.book.wordCount) }}字</text>
        </text>
      </view>

      <view class="stats product-card">
        <view class="stat">
          <text class="stat-value">{{ formatRating(detail.rating) }}</text>
          <text class="stat-label">{{ detail.ratingCount || 0 }} 人评价 ›</text>
        </view>
        <view class="stat">
          <text class="stat-value">{{ formatCount(detail.readingCount) }}</text>
          <text class="stat-label">正在阅读</text>
        </view>
        <view class="stat">
          <text class="stat-value">{{ formatCount(detail.favoriteCount) }}</text>
          <text class="stat-label">累计收藏</text>
        </view>
      </view>

      <scroll-view v-if="detail.tags?.length" class="tag-row" scroll-x>
        <text class="hot-tag">大热榜</text>
        <text v-for="tag in detail.tags" :key="tag" class="tag">{{ tag }}</text>
        <text class="tag">{{ detail.categoryName || '精选' }}</text>
      </scroll-view>

      <view class="intro product-card">
        <text class="intro-text" :class="{ folded: !descExpanded }">{{ detail.book.description || '暂无简介' }}</text>
        <text v-if="shouldFold" class="more" @tap="descExpanded = !descExpanded">{{ descExpanded ? '收起' : '更多' }}</text>
      </view>

      <view class="catalog product-card">
        <view class="section-head">
          <text class="section-title">目录</text>
          <text class="section-more" @tap="startRead">共 {{ detail.chapters.length }} 章 ›</text>
        </view>
        <view
          v-for="chapter in tocPreview"
          :key="chapter.id"
          class="chapter-row"
          @tap="readChapter(chapter.chapterNo)"
        >
          <text class="chapter-title">{{ chapter.title }}</text>
          <text class="chapter-words">{{ chapter.wordCount || 0 }} 字</text>
        </view>
      </view>

      <view class="reviews product-card">
        <view class="section-head review-head">
          <view>
            <text class="section-title">热门评价</text>
            <text class="review-sub">{{ commentTotal ? `${commentTotal} 人评价过这本书` : '读完的人都在这里留下想法' }}</text>
          </view>
          <text v-if="comments.length" class="section-more" @tap="reviewExpanded = !reviewExpanded">
            {{ reviewExpanded ? '收起' : `查看 ${commentTotal || comments.length} 条评价` }}
          </text>
        </view>

        <button class="write-review" @tap="reviewComposerVisible = !reviewComposerVisible">
          {{ reviewComposerVisible || !comments.length ? '收起书评' : '写书评' }}
        </button>

        <view v-if="reviewComposerVisible || !comments.length" class="composer">
          <textarea
            v-model="commentText"
            class="composer-input"
            maxlength="500"
            auto-height
            placeholder="写下你对这本书的想法"
          />
          <view class="composer-foot">
            <text>{{ commentText.length }}/500</text>
            <button class="send" :disabled="commentSubmitting" @tap="submitBookComment">
              {{ commentSubmitting ? '发布中' : '发布评价' }}
            </button>
          </view>
        </view>

        <view v-if="commentsLoading" class="empty-review">正在加载评价...</view>
        <view v-else-if="!comments.length" class="empty-review">暂无评价，成为第一个评价的人吧</view>
        <view v-else class="review-list">
          <view v-for="item in visibleComments" :key="item.id" class="review-item">
            <view class="avatar">{{ (item.username || '?').slice(0, 1) }}</view>
            <view class="review-body">
              <view class="review-user-row">
                <text class="review-user">{{ item.username || '匿名读者' }}</text>
                <text class="review-chip">好看</text>
              </view>
              <text class="review-content text-cut-3">{{ item.content }}</text>
              <text class="review-meta">☺ 好看 · {{ formatTime(item.createdAt) }}评价</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="recommendations.length" class="recommend product-card">
        <view class="section-head">
          <text class="section-title">为你精选的好书</text>
        </view>
        <scroll-view class="rec-scroll" scroll-x>
          <view v-for="book in recommendations" :key="book.id" class="rec-card" @tap="goRecommendDetail(book.id)">
            <view class="rec-cover">{{ coverText(book.title) }}</view>
            <text class="rec-title text-cut-2">{{ book.title }}</text>
          </view>
        </scroll-view>
      </view>

      <view class="bottom-space" />
    </template>

    <view v-if="detail" class="bottom-cta">
      <button class="shelf-btn" @tap="toggleShelf">{{ detail.inBookshelf ? '已在书架' : '加入书架' }}</button>
      <button class="read-btn" @tap="startRead">开始阅读</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import { useUserStore } from '../../store/user'

const FOLD_THRESHOLD = 92
const TOC_PREVIEW_COUNT = 3
const bookStore = useBookStore()
const userStore = useUserStore()

const id = ref('')
const detail = ref(null)
const loading = ref(false)
const descExpanded = ref(false)
const recommendations = ref([])
const comments = ref([])
const commentTotal = ref(0)
const commentsLoading = ref(false)
const commentText = ref('')
const commentSubmitting = ref(false)
const reviewExpanded = ref(false)
const reviewComposerVisible = ref(false)

const tocPreview = computed(() => (detail.value?.chapters || []).slice(0, TOC_PREVIEW_COUNT))
const shouldFold = computed(() => (detail.value?.book?.description || '').length > FOLD_THRESHOLD)
const visibleComments = computed(() => (reviewExpanded.value ? comments.value : comments.value.slice(0, 2)))
const coverBgStyle = computed(() => detail.value?.book?.coverUrl
  ? { background: `center / cover no-repeat url("${detail.value.book.coverUrl}")` }
  : {})

async function load() {
  loading.value = true
  try {
    const res = await bookStore.loadDetail(id.value)
    detail.value = res.code === 200 ? res.data : null
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
  loadRecommendations()
  loadComments()
}

async function loadRecommendations() {
  try {
    const res = await bookStore.loadRecommendations(id.value, 8)
    recommendations.value = res.code === 200 ? (res.data || []) : []
  } catch {
    recommendations.value = []
  }
}

async function loadComments() {
  commentsLoading.value = true
  try {
    const res = await bookStore.loadBookComments(id.value, 1, 20)
    comments.value = res.code === 200 ? (res.data?.records || []) : []
    commentTotal.value = Number(res.data?.total || comments.value.length || 0)
  } catch {
    comments.value = []
    commentTotal.value = 0
  } finally {
    commentsLoading.value = false
  }
}

async function submitBookComment() {
  const content = commentText.value.trim()
  if (!content) {
    uni.showToast({ title: '请输入评价内容', icon: 'none' })
    return
  }
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录后再评价', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/mine/mine' }), 700)
    return
  }
  commentSubmitting.value = true
  try {
    const res = await bookStore.createComment({ bookId: Number(id.value), content, commentType: 'REVIEW' })
    if (res.code === 200) {
      commentText.value = ''
      reviewComposerVisible.value = false
      uni.showToast({ title: '评价已发布', icon: 'success' })
      await loadComments()
    }
  } finally {
    commentSubmitting.value = false
  }
}

async function toggleShelf() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/mine/mine' }), 700)
    return
  }
  if (detail.value?.inBookshelf) {
    await bookStore.removeShelf(id.value)
    detail.value.inBookshelf = false
  } else {
    await bookStore.addShelf(id.value)
    detail.value.inBookshelf = true
  }
}

function readChapter(chapterNo) {
  uni.navigateTo({ url: `/pages/reader/reader?bookId=${id.value}&chapterNo=${chapterNo}` })
}

function startRead() {
  readChapter(1)
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.switchTab({ url: '/pages/index/index' })
}

function goRecommendDetail(bookId) {
  uni.navigateTo({ url: `/pages/book/detail?id=${bookId}` })
}

function coverText(title) {
  return (title || '书').slice(0, 2)
}

function statusText(status) {
  if (status === 'COMPLETED') return '完结'
  if (status === 'PAUSED') return '暂停'
  return '连载'
}

function formatRating(value) {
  const num = Number(value || 0)
  return num ? num.toFixed(1) : '暂无'
}

function formatCount(value) {
  const num = Number(value || 0)
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return String(num)
}

function formatWordCount(value) {
  const num = Number(value || 0)
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return String(num)
}

function formatTime(dateStr) {
  if (!dateStr) return '刚刚'
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `阅读 ${minutes} 分钟后`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `阅读 ${hours} 小时后`
  return `阅读 ${Math.floor(hours / 24)} 天后`
}

function resolveBookId(query = {}) {
  if (query?.id) return query.id
  // #ifdef H5
  if (typeof window !== 'undefined') {
    const hash = window.location.hash || ''
    const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
    return new URLSearchParams(queryText).get('id') || ''
  }
  // #endif
  return ''
}

onLoad((query) => {
  id.value = resolveBookId(query)
  load()
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  padding: 10px 12px 84px;
}

.state {
  padding-top: 96px;
  color: #8C8C8C;
  text-align: center;
}

.topbar {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back {
  color: #8C8C8C;
  font-size: 15px;
}

.top-actions {
  display: flex;
  gap: 8px;
}

.mini-action {
  height: 30px;
  line-height: 30px;
  margin: 0;
  padding: 0 12px;
  border-radius: 15px;
  background: rgba(160, 144, 128, 0.2);
  color: #5A5A5A;
  font-size: 13px;
}

.hero {
  padding: 22px 0 14px;
  text-align: center;
}

.cover {
  width: 94px;
  height: 130px;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  border-radius: 8px;
  background: linear-gradient(145deg, #8A8A8A, #3A3A3A 48%, #A09080);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  color: #fff;
  font-size: 28px;
  font-weight: 900;
}

.title {
  display: block;
  color: #181818;
  font-size: 24px;
  font-weight: 900;
  line-height: 32px;
}

.meta {
  display: block;
  margin-top: 7px;
  color: #8C8C8C;
  font-size: 13px;
}

.author {
  color: #A09080;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 12px 6px;
}

.stat {
  text-align: center;
  border-right: 1px solid rgba(0,0,0,0.08);
}

.stat:last-child {
  border-right: 0;
}

.stat-value {
  display: block;
  color: #1F1F1F;
  font-size: 21px;
  font-weight: 900;
}

.stat-label {
  display: block;
  margin-top: 5px;
  color: #8C8C8C;
  font-size: 11px;
}

.tag-row {
  margin: 12px 0 10px;
  white-space: nowrap;
}

.hot-tag,
.tag {
  display: inline-flex;
  align-items: center;
  height: 26px;
  margin-right: 8px;
  padding: 0 12px;
  border-radius: 6px;
  background: rgba(160, 144, 128, 0.18);
  color: #5A5A5A;
  font-size: 12px;
}

.hot-tag {
  background: #3A3A3A;
  color: #fff;
  font-weight: 800;
}

.intro,
.catalog,
.reviews,
.recommend {
  margin-top: 12px;
  padding: 12px;
}

.intro-text {
  display: block;
  color: #5A5A5A;
  font-size: 15px;
  line-height: 25px;
}

.intro-text.folded {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.more {
  display: block;
  margin-top: 8px;
  color: #6E6E6E;
  text-align: right;
  font-size: 13px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  display: block;
  color: #181818;
  font-size: 18px;
  font-weight: 900;
}

.section-more {
  color: #A09080;
  font-size: 12px;
  line-height: 26px;
}

.chapter-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid rgba(0,0,0,0.06);
}

.chapter-row:first-of-type {
  margin-top: 10px;
}

.chapter-title {
  min-width: 0;
  flex: 1;
  color: #3A3A3A;
  font-size: 13px;
}

.chapter-words {
  color: #B0B0B0;
  font-size: 11px;
}

.review-sub {
  display: block;
  margin-top: 6px;
  color: #8C8C8C;
  font-size: 11px;
}

.write-review {
  width: 96px;
  height: 30px;
  line-height: 30px;
  margin: 14px 0 0 auto;
  border-radius: 17px;
  border: 1px solid rgba(0,0,0,0.12);
  background: #F5F5F2;
  color: #5A5A5A;
  font-size: 12px;
}

.composer {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #F5F5F2;
  border: 1px solid rgba(0,0,0,0.08);
}

.composer-input {
  width: 100%;
  min-height: 84px;
  color: #1F1F1F;
  font-size: 13px;
  line-height: 21px;
}

.composer-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  color: #B0B0B0;
  font-size: 12px;
}

.send {
  width: 94px;
  height: 34px;
  line-height: 34px;
  margin: 0;
  border-radius: 8px;
  background: #3A3A3A;
  color: #fff;
  font-size: 12px;
}

.empty-review {
  padding: 26px 0 12px;
  color: #B0B0B0;
  text-align: center;
  font-size: 14px;
}

.review-list {
  margin-top: 8px;
}

.review-item {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid rgba(0,0,0,0.06);
}

.avatar {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #F0F0ED;
  color: #A09080;
  font-weight: 900;
}

.review-body {
  min-width: 0;
  flex: 1;
}

.review-user-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.review-user {
  color: #A09080;
  font-size: 14px;
  font-weight: 800;
}

.review-chip {
  padding: 2px 7px;
  border-radius: 10px;
  background: rgba(160, 144, 128, 0.18);
  color: #A09080;
  font-size: 11px;
}

.review-content {
  color: #3A3A3A;
  font-size: 15px;
  line-height: 24px;
}

.review-meta {
  display: block;
  margin-top: 8px;
  color: #B0B0B0;
  font-size: 13px;
}

.rec-scroll {
  margin-top: 12px;
  white-space: nowrap;
}

.rec-card {
  display: inline-flex;
  width: 86px;
  flex-direction: column;
  margin-right: 12px;
  vertical-align: top;
}

.rec-cover {
  width: 82px;
  height: 108px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: linear-gradient(145deg, #3A3A3A, #A09080);
  color: #fff;
  font-size: 20px;
  font-weight: 900;
}

.rec-title {
  margin-top: 8px;
  color: #3A3A3A;
  font-size: 13px;
  line-height: 18px;
}

.bottom-space {
  height: 28px;
}

.bottom-cta {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  z-index: 12;
  width: min(100vw, 480px);
  display: grid;
  grid-template-columns: 0.85fr 1.45fr;
  gap: 12px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  background: rgba(248, 248, 246, 0.94);
  backdrop-filter: blur(10px);
}

.shelf-btn,
.read-btn {
  height: 46px;
  line-height: 46px;
  margin: 0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 800;
}

.shelf-btn {
  background: #F5F5F2;
  color: #5A5A5A;
  border: 1px solid rgba(0,0,0,0.08);
}

.read-btn {
  background: #3A3A3A;
  color: #fff;
}

@media (max-width: 480px) {
  .bottom-cta {
    left: 0;
    width: 100vw;
    transform: none;
  }
}
</style>
