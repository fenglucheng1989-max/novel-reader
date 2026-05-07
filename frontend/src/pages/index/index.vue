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
      <template v-else>
        <!-- Banner -->
        <swiper v-if="bannerBooks.length" class="banner-swiper" :indicator-dots="true" :autoplay="true" :interval="4000" :duration="500" circular>
          <swiper-item v-for="book in bannerBooks" :key="book.id">
            <view class="banner-card" @tap="goDetail(book.id)">
              <view class="banner-cover">
                <text class="banner-cover-text">{{ (book.title || '书').slice(0, 3) }}</text>
              </view>
              <view class="banner-info">
                <text class="banner-title">{{ book.title }}</text>
                <text class="banner-meta">{{ book.author || '佚名' }} · {{ statusLabel(book.status) }}</text>
                <text class="banner-desc">{{ (book.description || '').slice(0, 60) }}</text>
              </view>
            </view>
          </swiper-item>
        </swiper>

        <view v-if="!bannerBooks.length && !editorialBooks.length && !hotBooks.length && !newBooks.length && !completedBooks.length" class="empty">
          <text class="empty-title">暂无书籍</text>
          <text class="empty-subtitle">可以先去后台新增小说和章节。</text>
        </view>

        <!-- Editor Picks -->
        <template v-if="editorialBooks.length">
          <SectionHead title="编辑精选" />
          <view class="feature-grid">
            <view
              v-for="book in editorialBooks.slice(0, 2)"
              :key="book.id"
              class="feature-card"
              @tap="goDetail(book.id)"
            >
              <BookCover :title="book.title" size="xl" />
              <view class="feature-info">
                <text class="feature-title">{{ book.title }}</text>
                <text class="feature-meta">{{ book.author || '佚名' }} · {{ book.chapterCount || 0 }}章</text>
                <text class="feature-desc">{{ (book.description || '').slice(0, 80) }}</text>
              </view>
            </view>
          </view>
        </template>

        <!-- Hot Ranking -->
        <template v-if="hotBooks.length">
          <view class="panel">
            <SectionHead title="热门榜" action-text="完整榜单 >" @action="goRank('hot')" />
            <view class="rank-grid">
              <view v-for="(book, index) in hotBooks" :key="book.id" class="rank-item" @tap="goDetail(book.id)">
                <text class="rank-no" :class="{ 'rank-top': index < 3 }">{{ index + 1 }}</text>
                <BookCover :title="book.title" size="sm" />
                <view class="rank-copy">
                  <text class="rank-title">{{ book.title }}</text>
                  <text class="rank-meta">{{ book.author || '佚名' }} · {{ statusLabel(book.status) }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- Latest -->
        <template v-if="newBooks.length">
          <view class="panel">
            <SectionHead title="最新上架" />
            <BookCardHorizontal
              v-for="book in newBooks"
              :key="book.id"
              :book="book"
              :show-status="true"
              :show-latest-chapter="true"
              @tap="goDetail(book.id)"
            />
          </view>
        </template>

        <!-- Completed -->
        <template v-if="completedBooks.length">
          <view class="panel">
            <SectionHead title="完结精选" />
            <BookCardHorizontal
              v-for="book in completedBooks"
              :key="book.id"
              :book="book"
              :show-status="true"
              @tap="goDetail(book.id)"
            />
          </view>
        </template>
      </template>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import BookCover from '../../components/BookCover.vue'
import SectionHead from '../../components/SectionHead.vue'
import BookCardHorizontal from '../../components/BookCardHorizontal.vue'

const bookStore = useBookStore()
const activeCategory = ref(0)
const loading = ref(false)

const bannerBooks = ref([])
const editorialBooks = ref([])
const hotBooks = ref([])
const newBooks = ref([])
const completedBooks = ref([])

async function load() {
  loading.value = true
  try {
    await bookStore.loadCategories()
    const cid = activeCategory.value || null

    const [featuredRes, hotRes, newRes, completedRes] = await Promise.all([
      bookStore.loadFeatured(5),
      bookStore.loadFilter({ categoryId: cid, sortBy: 'chapterCount', pageSize: 6 }),
      bookStore.loadFilter({ categoryId: cid, sortBy: 'latest', pageSize: 10 }),
      bookStore.loadFilter({ categoryId: cid, status: 'COMPLETED', pageSize: 6 })
    ])

    const featuredData = featuredRes.code === 200 ? (featuredRes.data || []) : []
    bannerBooks.value = featuredData.slice(0, 3)
    editorialBooks.value = featuredData
    hotBooks.value = hotRes.code === 200 ? (hotRes.data?.records || []) : []
    newBooks.value = newRes.code === 200 ? (newRes.data?.records || []) : []
    completedBooks.value = completedRes.code === 200 ? (completedRes.data?.records || []) : []
  } finally {
    loading.value = false
  }
}

function selectCategory(id) {
  activeCategory.value = id
  bookStore.selectCategory(id)
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

function goRank(type) {
  const cid = activeCategory.value ? `categoryId=${activeCategory.value}&` : ''
  uni.navigateTo({ url: `/pages/rank/rank?${cid}type=${type}` })
}

function statusLabel(status) {
  if (status === 'COMPLETED') return '完结'
  return '连载'
}

onShow(() => {
  if (activeCategory.value) load()
  else {
    activeCategory.value = bookStore.selectedCategoryId || 0
    load()
  }
})
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

.search-icon { color: #8b8176; font-size: 17px; }

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

.channel-row { width: 100%; margin-bottom: 14px; white-space: nowrap; }

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

.channel-item.active { color: #141c19; }

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

/* Banner */
.banner-swiper {
  width: 100%;
  height: 170px;
  margin-bottom: 14px;
  border-radius: 10px;
  overflow: hidden;
}

.banner-card {
  display: flex;
  height: 100%;
  background: linear-gradient(135deg, #2f6f5e 0%, #1a3d33 50%, #3c2a1a 100%);
}

.banner-cover {
  flex: 0 0 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-cover-text {
  color: rgba(255,255,255,0.7);
  font-size: 32px;
  font-weight: 900;
}

.banner-info {
  flex: 1;
  min-width: 0;
  padding: 28px 18px 28px 6px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.banner-title {
  color: #fff;
  font-size: 19px;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-meta {
  margin-top: 6px;
  color: rgba(255,255,255,0.65);
  font-size: 13px;
}

.banner-desc {
  margin-top: 8px;
  color: rgba(255,255,255,0.45);
  font-size: 12px;
  line-height: 18px;
}

/* Feature grid */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.feature-card {
  min-width: 0;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(31, 42, 38, 0.05);
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
  display: block;
}

.feature-meta {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #9a6b45;
  font-size: 12px;
  display: block;
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

/* Panel */
.panel {
  padding: 14px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(31, 42, 38, 0.05);
  margin-bottom: 14px;
}

/* Rank grid */
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

.rank-no {
  flex: 0 0 22px;
  text-align: center;
  color: #999;
  font-size: 14px;
  font-weight: 900;
  margin-right: 8px;
}

.rank-no.rank-top { color: #e07b4c; }

.rank-copy {
  min-width: 0;
  flex: 1;
  margin-left: 8px;
}

.rank-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #27322e;
  font-size: 14px;
  font-weight: 800;
  display: block;
}

.rank-meta {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #92877c;
  font-size: 12px;
  display: block;
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
  .banner-swiper { height: 210px; }
}
</style>
