<template>
  <view class="page">
    <view class="category-shell">
      <view class="nav-bar">
        <view class="nav-button" @tap="goBack">‹</view>
        <text class="nav-title">全部分类</text>
        <view class="nav-placeholder"></view>
      </view>

      <view class="page-head">
        <text class="eyebrow">书城频道</text>
        <text class="title">按频道浏览书城内容</text>
      </view>

      <view class="featured-card" @tap="chooseCategory(0)">
        <view>
          <text class="featured-title">推荐</text>
          <text class="featured-subtitle">查看当前推荐榜、精选书籍和最新上架。</text>
        </view>
        <text class="featured-mark">全部</text>
      </view>

      <view class="section-head">
        <text class="section-title">频道分类</text>
        <text class="section-count">{{ bookStore.categories.length }} 个</text>
      </view>

      <view v-if="loading" class="empty">正在整理分类...</view>
      <view v-else-if="!bookStore.categories.length" class="empty">
        <text class="empty-title">暂无分类</text>
        <text class="empty-subtitle">可以先在后台维护书籍分类。</text>
      </view>
      <view v-else class="category-grid">
        <view
          v-for="item in bookStore.categories"
          :key="item.id"
          class="category-card"
          :class="{ active: bookStore.selectedCategoryId === item.id }"
          @tap="chooseCategory(item.id)"
        >
          <view class="category-main">
            <text class="category-name">{{ item.name }}</text>
            <text class="category-desc">浏览{{ item.name }}频道内容</text>
          </view>
          <text class="category-arrow">›</text>
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
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    await bookStore.loadCategories()
  } finally {
    loading.value = false
  }
}

function chooseCategory(id) {
  bookStore.selectCategory(id)
  uni.switchTab({ url: '/pages/index/index' })
}

function goBack() {
  uni.navigateBack({
    fail: () => uni.switchTab({ url: '/pages/index/index' })
  })
}

onShow(load)
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  padding: 18px 16px 34px;
  background: #f6f3ee;
  box-sizing: border-box;
}

.category-shell {
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
  margin-bottom: 14px;
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

.page-head {
  margin-bottom: 16px;
}

.eyebrow,
.title,
.nav-title,
.featured-title,
.featured-subtitle,
.featured-mark,
.section-title,
.section-count,
.category-name,
.category-desc,
.category-arrow,
.empty-title,
.empty-subtitle {
  display: block;
}

.eyebrow {
  color: #9a6b45;
  font-size: 12px;
  font-weight: 800;
}

.title {
  margin-top: 4px;
  color: #17221e;
  font-size: 26px;
  font-weight: 900;
}

.featured-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 112px;
  padding: 18px;
  border-radius: 8px;
  background: #20342d;
  color: #fff;
  box-shadow: 0 12px 30px rgba(31, 42, 38, 0.12);
  box-sizing: border-box;
}

.featured-title {
  font-size: 22px;
  font-weight: 900;
}

.featured-subtitle {
  margin-top: 8px;
  color: #d8e4dd;
  font-size: 13px;
  line-height: 20px;
}

.featured-mark {
  flex: 0 0 auto;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 20px 0 12px;
}

.section-title {
  color: #1f2a26;
  font-size: 18px;
  font-weight: 900;
}

.section-count {
  color: #91867a;
  font-size: 13px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.category-card {
  min-width: 0;
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 15px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid transparent;
  box-shadow: 0 10px 24px rgba(31, 42, 38, 0.05);
  box-sizing: border-box;
}

.category-card.active {
  border-color: #2f6f5e;
  background: #f4fbf7;
}

.category-main {
  min-width: 0;
}

.category-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1f2a26;
  font-size: 17px;
  font-weight: 900;
}

.category-desc {
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #81776c;
  font-size: 12px;
}

.category-arrow {
  flex: 0 0 auto;
  color: #9a6b45;
  font-size: 24px;
  line-height: 1;
}

.empty {
  padding: 64px 0;
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
}
</style>
