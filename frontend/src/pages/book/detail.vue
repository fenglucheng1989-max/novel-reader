<template>
  <view class="detail-page" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <view v-if="loading" class="state">正在加载书籍...</view>
    <view v-else-if="!detail" class="state">书籍不存在</view>
    <template v-else>
      <view class="topbar">
        <text class="back" @tap="goBack">‹ 返回</text>
        <view class="top-actions">
          <text class="mini-action" @tap="toggleShelf">{{ detail.inBookshelf ? '已在书架' : '+ 加书架' }}</text>
          <text class="mini-action" @tap="toggleFavorite">{{ isFavorited ? '♥ 已收藏' : '♡ 收藏' }}</text>
        </view>
      </view>
      <view class="hero">
        <view class="cover" :style="coverBgStyle" @tap="startRead">
          <text v-if="!detail.book.coverUrl">{{ coverText(detail.book.title) }}</text>
        </view>
        <text class="title">{{ detail.book.title }}</text>
        <text class="meta">
          <text class="author">{{ detail.book.author || '佚名' }}</text>
          <text> · {{ statusText(detail.book.status) }} · {{ formatWordCount(detail.book.wordCount) }}字</text>
        </text>
      </view>

      <view class="stats">
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

      <view class="intro">
        <view class="intro-head">
          <text class="section-title">简介</text>
          <scroll-view class="intro-tags" scroll-x :show-scrollbar="false">
            <text v-for="tag in detail.tags" :key="tag" class="tag-sm">{{ tag }}</text>
            <text class="tag-sm">{{ detail.categoryName || '精选' }}</text>
          </scroll-view>
        </view>
        <view v-if="shouldFold" class="intro-body intro-collapsed" @tap="showIntroModal = true">
          <text class="intro-text">{{ truncatedIntro }}...<text class="more-btn">更多</text></text>
        </view>
        <text v-else class="intro-text">{{ descText }}</text>
      </view>

      <!-- Intro Modal -->
      <view v-if="showIntroModal" class="intro-modal" :class="{ 'intro-modal--out': modalLeaving }">
        <view class="intro-modal-overlay" :class="{ 'intro-modal-overlay--out': modalLeaving }" @tap="closeIntroModal"></view>
        <view class="intro-modal-panel" :class="{ 'intro-modal-panel--out': modalLeaving }">
          <view class="intro-modal-head">
            <text class="intro-modal-title">简介</text>
            <text class="intro-modal-arrow" @tap="closeIntroModal">‹</text>
          </view>
          <view class="intro-modal-body">
            <text class="intro-modal-text">{{ descText }}</text>
          </view>
          <view class="intro-modal-actions">
            <view class="intro-modal-btn" @tap="startRead">去阅读</view>
          </view>
        </view>
      </view>

      <view class="reviews">
        <view class="section-head review-head">
          <view>
            <text class="section-title">热门评书</text>
          </view>
          <text v-if="comments.length" class="section-more" @tap="goReviews">{{ commentTotal || comments.length }} 条评价 ›</text>
        </view>

        <view v-if="commentsLoading" class="empty-review">正在加载评价...</view>
        <view v-else-if="!comments.length" class="empty-review">暂无评价</view>
        <view v-else class="detail-review-list">
          <view v-for="item in visibleComments" :key="item.id" class="detail-review-item" @tap="goReviews">
            <text class="avatar-sm">{{ (item.username || '?').slice(0, 1) }}</text>
            <view class="review-body">
              <view class="review-head-row">
                <text class="review-user">{{ item.username || '匿名读者' }}</text>
                <text class="review-chip-tag">好看</text>
                <text class="review-time">{{ formatTime(item.createdAt) }}</text>
              </view>
              <text class="review-text text-cut-3">{{ item.content }}</text>
            </view>
          </view>
        </view>
      </view>
    </template>

    <view v-if="showHint" class="swipe-hint" @tap="startRead">
      <text class="hint-text">👈 左滑进入正文</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import { useUserStore } from '../../store/user'
import type { BookDetail, BookStatus, Comment } from '../../types/book'

const bookStore = useBookStore()
const userStore = useUserStore()

const id = ref<string | number>('')
const detail = ref<BookDetail | null>(null)
const loading = ref(false)
const showIntroModal = ref(false)
const modalLeaving = ref(false)
const comments = ref<Comment[]>([])
const commentTotal = ref(0)
const commentsLoading = ref(false)
const showHint = ref(true)
const touchStartX = ref(0)
const isFavorited = ref(false)

const TWO_LINE_CHARS = 48
const descText = computed(() => detail.value?.book?.description || '')
const shouldFold = computed(() => descText.value.length > TWO_LINE_CHARS)
const truncatedIntro = computed(() => descText.value.slice(0, TWO_LINE_CHARS))
const visibleComments = computed(() => comments.value.slice(0, 2))
const coverBgStyle = computed(() => detail.value?.book?.coverUrl
  ? { background: `center / cover no-repeat url("${detail.value.book.coverUrl}")` }
  : {},
)

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await bookStore.loadDetail(id.value)
    detail.value = (res.code === 200 ? res.data as BookDetail : null)
    checkFavorite()
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
  loadComments()
}

async function loadComments(): Promise<void> {
  commentsLoading.value = true
  try {
    const res = await bookStore.loadBookComments(id.value, 1, 20)
    const data = res.data as { records?: Comment[]; total?: number } | undefined
    comments.value = res.code === 200 ? (data?.records || []) : []
    commentTotal.value = Number(data?.total || comments.value.length || 0)
  } catch {
    comments.value = []
    commentTotal.value = 0
  } finally {
    commentsLoading.value = false
  }
}

async function toggleShelf(): Promise<void> {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/mine/mine' }), 700)
    return
  }
  if (detail.value?.inBookshelf) {
    await bookStore.removeShelf(id.value)
    if (detail.value) detail.value.inBookshelf = false
  } else {
    await bookStore.addShelf(id.value)
    if (detail.value) detail.value.inBookshelf = true
  }
}

async function toggleFavorite(): Promise<void> {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/mine/mine' }), 700)
    return
  }
  if (isFavorited.value) {
    await bookStore.removeFavorite(id.value)
    isFavorited.value = false
    uni.showToast({ title: '已取消收藏', icon: 'none' })
  } else {
    await bookStore.addFavorite(id.value)
    isFavorited.value = true
    uni.showToast({ title: '已收藏', icon: 'none' })
  }
}

async function checkFavorite(): Promise<void> {
  if (!userStore.isLoggedIn) return
  try {
    const res = await bookStore.checkFavoriteStatus(id.value)
    if (res.code === 200) isFavorited.value = Boolean(res.data)
  } catch { isFavorited.value = false }
}

function onTouchStart(e: { touches: Array<{ clientX: number }> }): void {
  touchStartX.value = e.touches[0].clientX
}

function onTouchEnd(e: { changedTouches: Array<{ clientX: number }> }): void {
  const dx = e.changedTouches[0].clientX - touchStartX.value
  if (dx < -50) {
    startRead()
  }
}

function startRead(): void {
  uni.setStorageSync('swipeHintDismissed', true)
  showHint.value = false
  uni.navigateTo({ url: `/pages/reader/index?bookId=${id.value}&chapterNo=1` })
}

function closeIntroModal(): void {
  modalLeaving.value = true
  setTimeout(() => {
    showIntroModal.value = false
    modalLeaving.value = false
  }, 250)
}

function goBack(): void {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.switchTab({ url: '/pages/index/index' })
}

function goReviews(): void {
  uni.navigateTo({ url: `/pages/review/review?bookId=${id.value}` })
}

function coverText(title: string): string {
  return (title || '书').slice(0, 2)
}

function statusText(status: BookStatus): string {
  if (status === 'COMPLETED') return '完结'
  return '连载'
}

function formatRating(value: number): string {
  const num = Number(value || 0)
  return num ? num.toFixed(1) : '暂无'
}

function formatCount(value: number): string {
  const num = Number(value || 0)
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return String(num)
}

function formatWordCount(value: number): string {
  const num = Number(value || 0)
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return String(num)
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '刚刚'
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `阅读 ${minutes} 分钟后`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `阅读 ${hours} 小时后`
  return `阅读 ${Math.floor(hours / 24)} 天后`
}

function resolveBookId(query: Record<string, unknown> = {}): string | number {
  if (query?.id) return query.id as string
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
  id.value = resolveBookId(query as Record<string, unknown>)
  load()
})

onShow(() => {
  if (!uni.getStorageSync('swipeHintDismissed')) {
    showHint.value = true
  }
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  padding: 12px 20px 32px;
  background: #F4F4F1;
}

.state {
  padding-top: 96px;
  color: #8C8C8C;
  text-align: center;
}

/* ── Topbar ── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.back {
  color: #8C8C8C;
  font-size: 15px;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-action {
  height: 28px;
  line-height: 28px;
  padding: 0 12px;
  border-radius: 14px;
  background: rgba(160, 144, 128, 0.12);
  color: #8C7C6C;
  font-size: 13px;
  font-weight: 800;
}

/* ── Hero ── */
.hero {
  padding: 0 0 18px;
  text-align: center;
}

.cover {
  width: 140px;
  height: 196px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  border-radius: 8px;
  background: linear-gradient(145deg, #8A8A8A, #3A3A3A 48%, #A09080);
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  color: #fff;
  font-size: 36px;
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

/* ── Stats ── */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 14px 0;
  background: transparent;
  box-shadow: none;
}

.stat {
  position: relative;
  text-align: center;
}

.stat + .stat::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: 22px;
  background: rgba(0,0,0,0.08);
  transform: translateY(-50%);
}

.stat-value {
  display: block;
  color: #1F1F1F;
  font-size: 20px;
  font-weight: 900;
}

.stat-label {
  display: block;
  margin-top: 4px;
  color: #B0B0B0;
  font-size: 11px;
}

/* ── Intro ── */
.intro {
  margin-top: 4px;
}

.intro-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.intro-tags {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
}

.intro-tags ::-webkit-scrollbar {
  display: none;
}

.tag-sm {
  display: inline-flex;
  align-items: center;
  height: 20px;
  margin-right: 6px;
  padding: 0 8px;
  border-radius: 4px;
  background: rgba(160, 144, 128, 0.18);
  color: #5A5A5A;
  font-size: 11px;
}

.intro-body {
  margin-top: 4px;
}

.intro-collapsed {
  max-height: 52px;
  overflow: hidden;
  line-height: 26px;
  cursor: pointer;
}

.intro-text {
  color: #5A5A5A;
  font-size: 15px;
  line-height: 26px;
  word-break: break-word;
}

.more-btn {
  color: #A09080;
  font-size: 13px;
  font-weight: 800;
}

/* ── Intro Modal ── */
.intro-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: modalFadeIn 0.3s ease;
}

.intro-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

.intro-modal-panel {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: #F4F4F1;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  animation: modalSlideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.intro-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 8px;
  flex-shrink: 0;
}

.intro-modal-title {
  color: #181818;
  font-size: 18px;
  font-weight: 900;
}

.intro-modal-arrow {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  color: #8C8C8C;
  font-size: 22px;
  font-weight: 300;
  transform: rotate(-90deg);
}

.intro-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px 20px;
  -webkit-overflow-scrolling: touch;
}

.intro-modal-text {
  display: block;
  color: #5A5A5A;
  font-size: 17px;
  line-height: 30px;
  word-break: break-word;
  overflow-wrap: break-word;
}

.intro-modal-actions {
  display: flex;
  padding: 16px 20px 28px;
  flex-shrink: 0;
}

.intro-modal-btn {
  padding: 0 48px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 19px;
  background: linear-gradient(135deg, #B0A090, #9B8B7A);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  margin: 0 auto;
}

/* exit animations */
.intro-modal--out {
  animation: modalFadeOut 0.25s ease forwards;
}

.intro-modal-overlay--out {
  animation: modalFadeOut 0.25s ease forwards;
}

.intro-modal-panel--out {
  animation: modalSlideDown 0.25s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

@keyframes modalFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes modalSlideDown {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
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

/* ── Reviews (compact, no card) ── */
.reviews {
  margin-top: 16px;
}

.empty-review {
  padding: 20px 0 8px;
  color: #B0B0B0;
  text-align: center;
  font-size: 14px;
}

.detail-review-list {
  margin-top: 4px;
}

.detail-review-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.detail-review-item:last-child {
  border-bottom: none;
}

.avatar-sm {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #F0F0ED;
  color: #A09080;
  font-size: 12px;
  font-weight: 900;
  margin-top: 1px;
}

.review-body {
  min-width: 0;
  flex: 1;
}

.review-head-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.review-user {
  color: #A09080;
  font-size: 13px;
  font-weight: 800;
}

.review-chip-tag {
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(160, 144, 128, 0.18);
  color: #A09080;
  font-size: 10px;
  line-height: 18px;
}

.review-time {
  margin-left: auto;
  color: #B0B0B0;
  font-size: 11px;
  flex-shrink: 0;
}

.review-text {
  display: block;
  color: #3A3A3A;
  font-size: 14px;
  line-height: 22px;
}

/* ── Swipe Hint ── */
.swipe-hint {
  position: fixed;
  left: 50%;
  bottom: 48px;
  z-index: 100;
  transform: translateX(-50%);
  animation: hintFloat 2s ease-in-out infinite;
}

.hint-text {
  display: block;
  padding: 10px 24px;
  border-radius: 999px;
  background: rgba(58, 58, 58, 0.88);
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

@keyframes hintFloat {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-6px); }
}

</style>
