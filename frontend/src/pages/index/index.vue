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
              <view class="banner-cover" :style="bannerCoverStyle(book)">
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
              <BookCover :title="book.title" :cover-url="book.coverUrl" size="xl" />
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
                <BookCover :title="book.title" :cover-url="book.coverUrl" size="sm" />
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

function bannerCoverStyle(book) {
  return book?.coverUrl ? { background: `center / cover no-repeat url("${book.coverUrl}")` } : {}
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
  padding: 10px 10px 76px;
  background: #F8F8F6;
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
  gap: 8px;
  margin-bottom: 8px;
}

.search-entry {
  min-width: 0;
  flex: 1;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 7px;
  background: #FFFFFF;
  border: 1px solid #EBEBE5;
  box-sizing: border-box;
}

.search-icon { color: #8C8C8C; font-size: 17px; }

.search-placeholder {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #8C8C8C;
  font-size: 12px;
}

.category-button {
  flex: 0 0 56px;
  height: 32px;
  line-height: 32px;
  border-radius: 7px;
  background: rgba(255,255,255,0.82);
  border: 1px solid #EBEBE5;
  color: #3A3A3A;
  font-size: 12px;
  font-weight: 700;
}

.channel-row { width: 100%; margin-bottom: 10px; white-space: nowrap; }

.channel-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  margin-right: 16px;
  color: #8C8C8C;
  font-size: 13px;
  font-weight: 700;
}

.channel-item.active { color: #1F1F1F; }

.channel-item.active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 18px;
  height: 3px;
  border-radius: 99px;
  background: #3A3A3A;
  transform: translateX(-50%);
}

/* Banner */
.banner-swiper {
  width: 100%;
  height: 118px;
  margin-bottom: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.banner-card {
  display: flex;
  height: 100%;
  background: linear-gradient(135deg, #2D2D2D 0%, #5A5A5A 58%, #8A8A8A 100%);
}

.banner-cover {
  flex: 0 0 78px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-cover-text {
  color: rgba(255,255,255,0.7);
  font-size: 24px;
  font-weight: 900;
  opacity: 0;
}

.banner-info {
  flex: 1;
  min-width: 0;
  padding: 16px 14px 16px 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.banner-title {
  color: #fff;
  font-size: 16px;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-meta {
  margin-top: 6px;
  color: rgba(255,255,255,0.65);
  font-size: 11px;
}

.banner-desc {
  margin-top: 8px;
  color: rgba(255,255,255,0.45);
  font-size: 11px;
  line-height: 16px;
}

/* Feature grid */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.feature-card {
  min-width: 0;
  overflow: hidden;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}

.feature-info {
  padding: 8px 9px 10px;
}

.feature-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1F1F1F;
  font-size: 13px;
  font-weight: 800;
  display: block;
}

.feature-meta {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #A09080;
  font-size: 10px;
  display: block;
}

.feature-desc {
  margin-top: 7px;
  color: #6E6E6E;
  font-size: 11px;
  line-height: 16px;
  word-break: break-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Panel */
.panel {
  padding: 10px;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  margin-bottom: 10px;
}

/* Rank grid */
.rank-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 8px;
  row-gap: 8px;
}

.rank-item {
  min-width: 0;
  display: flex;
  align-items: center;
}

.rank-no {
  flex: 0 0 22px;
  text-align: center;
  color: #B0B0B0;
  font-size: 12px;
  font-weight: 900;
  margin-right: 8px;
}

.rank-no.rank-top { color: #C4A882; }

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
  color: #1F1F1F;
  font-size: 12px;
  font-weight: 800;
  display: block;
}

.rank-meta {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #8C8C8C;
  font-size: 10px;
  display: block;
}

.empty {
  padding: 52px 0;
  color: #8C8C8C;
  text-align: center;
}

.empty-title {
  color: #1F1F1F;
  font-size: 17px;
  font-weight: 800;
  display: block;
}

.empty-subtitle {
  margin-top: 8px;
  color: #B0B0B0;
  font-size: 13px;
  display: block;
}

@media (min-width: 720px) {
  .page { padding-left: 22px; padding-right: 22px; }
  .banner-swiper { height: 210px; }
}
</style>
