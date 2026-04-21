<template>
  <view class="page">
    <view class="topbar">
      <text class="eyebrow">Novel Reader</text>
      <text class="title">悦读书城</text>
    </view>

    <view class="search-entry" @tap="goSearch">
      <text class="search-icon">⌕</text>
      <text class="search-placeholder">搜索书名或作者</text>
      <text class="search-action">搜索</text>
    </view>

    <scroll-view class="category-row" scroll-x>
      <view
        class="category-pill"
        :class="{ active: activeCategory === 0 }"
        @tap="selectCategory(0)"
      >全部</view>
      <view
        v-for="item in bookStore.categories"
        :key="item.id"
        class="category-pill"
        :class="{ active: activeCategory === item.id }"
        @tap="selectCategory(item.id)"
      >{{ item.name }}</view>
    </scroll-view>

    <view class="section-head">
      <text class="section-title">推荐阅读</text>
      <text class="section-subtitle">{{ bookStore.books.length }} 本</text>
    </view>

    <view v-if="loading" class="empty">正在加载书城...</view>
    <view v-else-if="!bookStore.books.length" class="empty">
      <text class="empty-title">暂无书籍</text>
      <text class="empty-subtitle">可以先去后台新增一本小说和章节</text>
    </view>
    <view v-else class="book-list">
      <view v-for="book in bookStore.books" :key="book.id" class="book-card" @tap="goDetail(book.id)">
        <view class="cover">
          <text>{{ coverText(book.title) }}</text>
        </view>
        <view class="book-info">
          <view class="book-line">
            <text class="book-title">{{ book.title }}</text>
            <text class="status">{{ statusText(book.status) }}</text>
          </view>
          <text class="author">{{ book.author || '佚名' }}</text>
          <view class="desc">{{ book.description || '暂无简介' }}</view>
          <text class="latest">{{ book.latestChapterTitle || '暂无章节' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'

const bookStore = useBookStore()
const activeCategory = ref(0)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    await bookStore.loadCategories()
    await bookStore.loadRecommend(activeCategory.value || null)
  } finally {
    loading.value = false
  }
}

function selectCategory(id) {
  activeCategory.value = id
  bookStore.loadRecommend(id || null)
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/search' })
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
  padding: 22px 18px 88px;
  background: #f6f3ee;
  box-sizing: border-box;
  overflow-x: hidden;
}

.topbar {
  margin-bottom: 14px;
}

.eyebrow,
.title,
.search-icon,
.search-placeholder,
.search-action,
.section-title,
.section-subtitle,
.book-title,
.author,
.desc,
.latest,
.empty-title,
.empty-subtitle {
  display: block;
}

.eyebrow {
  color: #7b6f60;
  font-size: 12px;
}

.title {
  margin-top: 4px;
  color: #1f2a26;
  font-size: 28px;
  font-weight: 700;
}

.search-entry {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 16px;
  padding: 0 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e4ddd3;
  box-sizing: border-box;
}

.search-icon {
  color: #7f766d;
  font-size: 18px;
}

.search-placeholder {
  flex: 1;
  color: #8a8278;
  font-size: 14px;
}

.search-action {
  color: #2f6f5e;
  font-size: 14px;
  font-weight: 700;
}

.category-row {
  white-space: nowrap;
  margin-bottom: 22px;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 34px;
  margin-right: 10px;
  padding: 0 14px;
  border: 1px solid #d8d0c5;
  border-radius: 6px;
  color: #62584d;
  font-size: 14px;
  box-sizing: border-box;
}

.category-pill.active {
  background: #2f6f5e;
  border-color: #2f6f5e;
  color: #fff;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.section-title {
  color: #27322e;
  font-size: 18px;
  font-weight: 700;
}

.section-subtitle {
  color: #93877a;
  font-size: 13px;
}

.empty {
  padding: 44px 0;
  color: #8b8176;
  text-align: center;
}

.empty-title {
  color: #333b37;
  font-size: 17px;
}

.empty-subtitle {
  margin-top: 8px;
  color: #94897c;
  font-size: 13px;
}

.book-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.book-card {
  width: 100%;
  display: flex;
  min-height: 132px;
  padding: 14px;
  border-radius: 8px;
  background: #fff;
  box-sizing: border-box;
}

.cover {
  flex: 0 0 78px;
  height: 104px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(135deg, #2f6f5e, #9a6b45);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
}

.book-info {
  min-width: 0;
  flex: 1;
  margin-left: 12px;
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
  font-size: 17px;
  font-weight: 700;
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

.desc {
  width: 100%;
  margin-top: 8px;
  color: #4a514e;
  font-size: 13px;
  line-height: 20px;
  word-break: break-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.latest {
  margin-top: 8px;
  color: #9a6b45;
  font-size: 12px;
}
</style>
