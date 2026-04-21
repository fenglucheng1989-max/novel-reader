<template>
  <view class="page">
    <view class="store-shell">
      <view class="search-row">
        <view class="search-entry" @tap="goSearch">
          <text class="search-icon">⌕</text>
          <text class="search-placeholder">搜索书名、作者或关键词</text>
        </view>
        <button class="category-button" @tap="goCategory">分类</button>
      </view>

      <scroll-view class="channel-row" scroll-x>
        <view
          class="channel-item"
          :class="{ active: activeCategory === 0 }"
          @tap="selectCategory(0)"
        >推荐</view>
        <view
          v-for="item in bookStore.categories"
          :key="item.id"
          class="channel-item"
          :class="{ active: activeCategory === item.id }"
          @tap="selectCategory(item.id)"
        >{{ item.name }}</view>
      </scroll-view>

      <view v-if="loading" class="empty">正在加载书城...</view>
      <view v-else-if="!bookStore.books.length" class="empty">
        <text class="empty-title">暂无书籍</text>
        <text class="empty-subtitle">可以先去后台新增小说和章节。</text>
      </view>
      <template v-else>
        <view class="rank-panel">
          <view class="section-head">
            <text class="section-title">推荐榜</text>
            <text class="section-action" @tap="goRank">完整榜单 ›</text>
          </view>
          <view class="rank-grid">
            <view
              v-for="(book, index) in rankedBooks"
              :key="book.id"
              class="rank-item"
              @tap="goDetail(book.id)"
            >
              <view class="mini-cover">
                <text>{{ coverText(book.title) }}</text>
              </view>
              <view class="rank-copy">
                <view class="rank-title-line">
                  <text class="rank-no">{{ index + 1 }}</text>
                  <text class="rank-title">{{ book.title }}</text>
                </view>
                <text class="rank-meta">{{ book.author || '佚名' }} · {{ statusText(book.status) }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="feature-grid">
          <view
            v-for="book in featuredBooks"
            :key="book.id"
            class="feature-card"
            @tap="goDetail(book.id)"
          >
            <view class="feature-cover">
              <text>{{ coverText(book.title) }}</text>
            </view>
            <view class="feature-info">
              <text class="feature-title">{{ book.title }}</text>
              <text class="feature-meta">{{ book.author || '佚名' }} · {{ book.chapterCount || 0 }}章</text>
              <text class="feature-desc">{{ book.description || '暂无简介' }}</text>
            </view>
          </view>
        </view>

        <view class="list-section">
          <view class="section-head">
            <text class="section-title">最新上架</text>
            <text class="section-count">{{ bookStore.books.length }} 本</text>
          </view>
          <view class="book-list">
            <view v-for="book in listBooks" :key="book.id" class="book-row" @tap="goDetail(book.id)">
              <view class="small-cover">{{ coverText(book.title) }}</view>
              <view class="book-info">
                <view class="book-line">
                  <text class="book-title">{{ book.title }}</text>
                  <text class="status">{{ statusText(book.status) }}</text>
                </view>
                <text class="author">{{ book.author || '佚名' }}</text>
                <text class="latest">{{ book.latestChapterTitle || '暂无章节' }}</text>
              </view>
            </view>
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

const bookStore = useBookStore()
const activeCategory = ref(0)
const loading = ref(false)
const rankedBooks = computed(() => bookStore.books.slice(0, 6))
const featuredBooks = computed(() => bookStore.books.slice(0, 2))
const listBooks = computed(() => bookStore.books.slice(2))

async function load() {
  loading.value = true
  try {
    await bookStore.loadCategories()
    activeCategory.value = bookStore.selectedCategoryId || 0
    await bookStore.loadRecommend(activeCategory.value || null)
  } finally {
    loading.value = false
  }
}

function selectCategory(id) {
  activeCategory.value = id
  bookStore.selectCategory(id)
  bookStore.loadRecommend(id || null)
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

function goRank() {
  const query = activeCategory.value ? `?categoryId=${activeCategory.value}` : ''
  uni.navigateTo({ url: `/pages/rank/rank${query}` })
}

function statusText(status) {
  if (status === 'COMPLETED') return '完结'
  if (status === 'PAUSED') return '暂停'
  return '连载'
}

function coverText(title) {
  return (title || '书').slice(0, 2)
}

onShow(load)
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  padding: 14px 14px 88px;
  background: #f6f3ee;
  box-sizing: border-box;
  overflow-x: hidden;
}

.store-shell {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.search-entry {
  min-width: 0;
  flex: 1;
  height: 38px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e7e0d7;
  box-sizing: border-box;
}

.search-icon,
.search-placeholder,
.category-button,
.channel-item,
.section-title,
.section-action,
.section-count,
.rank-no,
.rank-title,
.rank-meta,
.feature-title,
.feature-meta,
.feature-desc,
.book-title,
.author,
.latest,
.empty-title,
.empty-subtitle {
  display: block;
}

.search-icon {
  color: #8b8176;
  font-size: 17px;
}

.search-placeholder {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #8b8176;
  font-size: 14px;
}

.category-button {
  flex: 0 0 66px;
  height: 38px;
  line-height: 38px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e7e0d7;
  color: #25332e;
  font-size: 14px;
  font-weight: 700;
}

.channel-row {
  width: 100%;
  margin-bottom: 14px;
  white-space: nowrap;
}

.channel-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  margin-right: 20px;
  color: #7f766d;
  font-size: 15px;
  font-weight: 700;
}

.channel-item.active {
  color: #141c19;
}

.channel-item.active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 18px;
  height: 3px;
  border-radius: 99px;
  background: #2f6f5e;
  transform: translateX(-50%);
}

.rank-panel,
.list-section {
  padding: 14px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(31, 42, 38, 0.05);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  color: #1f2a26;
  font-size: 18px;
  font-weight: 800;
}

.section-action,
.section-count {
  color: #8d8175;
  font-size: 13px;
}

.section-action {
  padding: 4px 0 4px 12px;
}

.rank-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 12px;
  row-gap: 12px;
}

.rank-item {
  min-width: 0;
  display: flex;
  align-items: center;
}

.mini-cover,
.small-cover {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(145deg, #2f6f5e, #9a6b45);
  color: #fff;
  font-weight: 800;
}

.mini-cover {
  width: 48px;
  height: 64px;
  font-size: 15px;
}

.rank-copy {
  min-width: 0;
  flex: 1;
  margin-left: 9px;
}

.rank-title-line {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.rank-no {
  flex: 0 0 auto;
  color: #9a6b45;
  font-size: 13px;
  font-weight: 800;
}

.rank-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #27322e;
  font-size: 14px;
  font-weight: 800;
}

.rank-meta {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #92877c;
  font-size: 12px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.feature-card {
  min-width: 0;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(31, 42, 38, 0.05);
}

.feature-cover {
  height: 156px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #efe1cb, #2f6f5e);
  color: #fff;
  font-size: 26px;
  font-weight: 900;
}

.feature-info {
  padding: 11px 12px 13px;
}

.feature-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1f2a26;
  font-size: 16px;
  font-weight: 800;
}

.feature-meta {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #9a6b45;
  font-size: 12px;
}

.feature-desc {
  margin-top: 7px;
  color: #5c625f;
  font-size: 12px;
  line-height: 18px;
  word-break: break-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.list-section {
  margin-top: 14px;
}

.book-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.book-row {
  display: flex;
  min-width: 0;
}

.small-cover {
  width: 58px;
  height: 78px;
  font-size: 17px;
}

.book-info {
  min-width: 0;
  flex: 1;
  margin-left: 11px;
}

.book-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.book-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #232a27;
  font-size: 16px;
  font-weight: 800;
}

.status {
  flex: 0 0 auto;
  color: #2f6f5e;
  font-size: 12px;
}

.author {
  margin-top: 6px;
  color: #82786d;
  font-size: 13px;
}

.latest {
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #9a6b45;
  font-size: 12px;
}

.empty {
  padding: 52px 0;
  color: #8b8176;
  text-align: center;
}

.empty-title {
  color: #333b37;
  font-size: 17px;
  font-weight: 800;
}

.empty-subtitle {
  margin-top: 8px;
  color: #94897c;
  font-size: 13px;
}

@media (min-width: 720px) {
  .page {
    padding-left: 22px;
    padding-right: 22px;
  }

  .feature-cover {
    height: 190px;
  }
}
</style>
