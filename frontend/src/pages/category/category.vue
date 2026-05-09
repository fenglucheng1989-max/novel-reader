<template>
  <view class="page">
    <!-- Top Bar -->
    <view class="topbar">
      <text class="back" @tap="goBack">&#8249;</text>
      <scroll-view class="gender-scroll" scroll-x :show-scrollbar="false">
        <text
          v-for="item in genderTabs"
          :key="item.key"
          class="gender-item"
          :class="{ active: activeGender === item.key }"
          @tap="activeGender = item.key"
        >{{ item.name }}</text>
      </scroll-view>
    </view>

    <scroll-view class="body" scroll-y>
      <!-- Category Grid -->
      <view class="section">
        <view class="cate-grid">
          <view class="cate-card" @tap="chooseCategory(0)">
            <text class="cate-card-icon">✦</text>
            <text class="cate-card-name">推荐</text>
          </view>
          <view
            v-for="(item, idx) in bookStore.categories"
            :key="item.id"
            class="cate-card"
            @tap="chooseCategory(item.id)"
          >
            <text class="cate-card-icon">{{ icons[idx % icons.length] }}</text>
            <text class="cate-card-name">{{ item.name }}</text>
          </view>
        </view>
      </view>

      <!-- Tag Groups -->
      <view class="sep" />
      <view v-for="group in tagGroups" :key="group.key" class="section">
        <view class="sec-head">
          <text class="sec-title">{{ group.label }}</text>
        </view>
        <scroll-view class="tag-scroll" scroll-x :show-scrollbar="false">
          <text
            v-for="tag in activeTagSet[group.key]"
            :key="tag"
            class="tag-chip"
            @tap="pickTag(tag)"
          >{{ tag }}</text>
        </scroll-view>
      </view>

      <!-- Filter + Results (when tag selected) -->
      <template v-if="currentKeyword">
        <view class="sep" />

        <view class="filter-row">
          <text class="filter-item" :class="{ on: statusFilter === '' }" @tap="setFilter('status', '')">全部</text>
          <text class="filter-dot">·</text>
          <text class="filter-item" :class="{ on: statusFilter === 'ONGOING' }" @tap="setFilter('status', 'ONGOING')">连载</text>
          <text class="filter-dot">·</text>
          <text class="filter-item" :class="{ on: statusFilter === 'COMPLETED' }" @tap="setFilter('status', 'COMPLETED')">完结</text>
          <text class="filter-gap">/</text>
          <text class="filter-item" :class="{ on: sortBy === 'latest' }" @tap="setFilter('sort', 'latest')">最新</text>
          <text class="filter-dot">·</text>
          <text class="filter-item" :class="{ on: sortBy === 'wordCount' }" @tap="setFilter('sort', 'wordCount')">字数</text>
          <text class="filter-dot">·</text>
          <text class="filter-item" :class="{ on: sortBy === 'chapterCount' }" @tap="setFilter('sort', 'chapterCount')">章节</text>
        </view>

        <view class="active-row">
          <view class="active-chip">
            <text>{{ currentKeyword }}</text>
            <text class="active-close" @tap="clearKeyword">×</text>
          </view>
          <text class="active-total">共 {{ total }} 本</text>
        </view>

        <view v-if="searchLoading" class="state">正在查找...</view>
        <view v-else-if="!books.length" class="state">
          <text class="state-title">没有找到符合条件的书</text>
        </view>
        <view v-else class="results">
          <BookCardHorizontal
            v-for="book in books"
            :key="book.id"
            :book="book"
            :show-status="true"
            :show-latest-chapter="true"
            @tap="goDetail(book.id)"
          />
          <view v-if="hasMore" class="more" @tap="loadMore">加载更多 ({{ books.length }} / {{ total }})</view>
        </view>
      </template>

      <view v-if="loading" class="state">正在整理分类...</view>
      <view class="body-pad" />
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import BookCardHorizontal from '../../components/BookCardHorizontal.vue'

const bookStore = useBookStore()
const loading = ref(false)
const activeGender = ref('male')

const currentKeyword = ref('')
const statusFilter = ref('')
const sortBy = ref('latest')
const books = ref([])
const searchLoading = ref(false)
const page = ref(1)
const total = ref(0)
const hasMore = computed(() => books.value.length < total.value)

const genderTabs = [
  { key: 'male', name: '男生' },
  { key: 'female', name: '女生' },
  { key: 'audio', name: '听书' },
  { key: 'short', name: '短剧' }
]

const icons = ['🔥','🏙️','⚔️','🏛️','🌌','🧙','⚡','💀','🎭','🕵️','🎮','🏆']

const tagGroups = [
  { key: 'hot', label: '热门标签' },
  { key: 'theme', label: '主题' },
  { key: 'role', label: '角色' },
  { key: 'plot', label: '情节' }
]

const tagMap = {
  male: {
    hot: ['热血','升级流','无限流','都市脑洞','玄幻脑洞','克苏鲁','游戏体育','架空','副本','求生','末日','灵异'],
    theme: ['悬疑','玄幻','历史','都市','科幻','奇幻','武侠','仙侠','末世','游戏','体育','脑洞'],
    role: ['少年','剑客','医生','学生','侦探','商人','修士','反派','群像','异能者','穿越者','凡人'],
    plot: ['开局','复仇','升级','种田','探案','冒险','权谋','日常','求生','无限流','副本','逆袭']
  },
  female: {
    hot: ['古言','现言','女强','甜宠','宫斗','重生','穿越','先婚后爱','豪门','权谋','种田','破镜重圆'],
    theme: ['古代言情','现代言情','幻想言情','悬疑恋爱','青春','职场','宫廷','宅斗','仙侠','年代','田园','娱乐圈'],
    role: ['女主','将军','公主','医妃','影后','总裁','学霸','王爷','反派','群像','青梅竹马','大女主'],
    plot: ['重生','穿越','复仇','甜宠','虐恋','追妻','契约','婚恋','成长','逆袭','破案','日久生情']
  },
  audio: {
    hot: ['精品听书','睡前故事','多人剧','悬疑有声','历史评书','都市爽文','玄幻热血','短篇','长篇','新书上架','完结必听','高分'],
    theme: ['悬疑','历史','都市','玄幻','言情','科幻','人文','评书','儿童','职场','情感','相声'],
    role: ['单播','双播','多人剧','男声','女声','旁白','精品主播','新锐主播','剧场','作者亲读','沉浸','白噪'],
    plot: ['探案','逆袭','成长','冒险','权谋','日常','治愈','烧脑','爆笑','催眠','热血','情感']
  },
  short: {
    hot: ['短剧热榜','反转','逆袭','爽感','甜宠','战神','赘婿','复仇','豪门','都市','古装','悬疑'],
    theme: ['都市短剧','古装短剧','甜宠短剧','悬疑短剧','家庭','职场','校园','年代','奇幻','权谋','喜剧','情感'],
    role: ['霸总','战神','赘婿','千金','神医','萌宝','女强','反派','管家','律师','警探','群像'],
    plot: ['逆袭','复仇','闪婚','打脸','追妻','掉马','真假千金','契约','重逢','破案','救赎','反转']
  }
}

const activeTagSet = computed(() => tagMap[activeGender.value] || tagMap.male)

async function load() {
  loading.value = true
  try { await bookStore.loadCategories() } finally { loading.value = false }
}

function pickTag(tag) {
  currentKeyword.value = tag
  page.value = 1
  books.value = []
  total.value = 0
  doSearch()
}

function clearKeyword() {
  currentKeyword.value = ''
  books.value = []
  total.value = 0
}

function setFilter(type, value) {
  if (type === 'status') statusFilter.value = value
  if (type === 'sort') sortBy.value = value
  page.value = 1
  books.value = []
  total.value = 0
  if (currentKeyword.value) doSearch()
}

async function doSearch() {
  searchLoading.value = true
  try {
    const res = await bookStore.loadFilter({
      keyword: currentKeyword.value,
      groupKey: activeGender.value,
      status: statusFilter.value || undefined,
      sortBy: sortBy.value,
      page: page.value,
      pageSize: 20
    })
    if (res.code === 200) {
      const newRecords = res.data?.records || []
      if (page.value === 1) {
        books.value = newRecords
      } else {
        books.value = [...books.value, ...newRecords]
      }
      total.value = res.data?.total || 0
    }
  } finally {
    searchLoading.value = false
  }
}

function loadMore() {
  page.value++
  doSearch()
}

function chooseCategory(id) {
  bookStore.selectCategory(id)
  uni.switchTab({ url: '/pages/index/index' })
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}

onShow(load)
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F4F4F1;
  display: flex;
  flex-direction: column;
}

/* Top Bar */
.topbar {
  display: flex;
  align-items: center;
  padding: 6px 12px 0;
  gap: 10px;
}

.back {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #1F1F1F;
  font-size: 20px;
  font-weight: 500;
}

.gender-scroll {
  flex: 1;
  min-width: 0;
  height: 36px;
  white-space: nowrap;
}

.gender-scroll :deep(.uni-scroll-view-content) {
  display: flex;
  align-items: center;
  gap: 22px;
  height: 36px;
}

.gender-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 36px;
  color: #8C8C8C;
  font-size: 14px;
  font-weight: 800;
}

.gender-item.active {
  color: #1F1F1F;
  font-size: 17px;
  font-weight: 900;
}

.gender-item.active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 14px;
  height: 3px;
  border-radius: 999px;
  background: #A09080;
  transform: translateX(-50%);
}

/* Body */
.body {
  flex: 1;
  min-height: 0;
}

.section {
  padding: 12px 12px 0;
}

.sec-head {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.sec-title {
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 900;
}

/* Category Grid */
.cate-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.cate-card {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 12px;
  border-radius: 8px;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0,0,0,0.035);
}

.cate-card:active {
  background: #EDEBE6;
}

.cate-card-icon {
  font-size: 18px;
  width: 22px;
  text-align: center;
  flex-shrink: 0;
}

.cate-card-name {
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 800;
  line-height: 20px;
}

/* Tag Scroll */
.tag-scroll {
  height: 30px;
  white-space: nowrap;
}

.tag-scroll :deep(.uni-scroll-view-content) {
  display: flex;
  gap: 6px;
  height: 30px;
  align-items: center;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: #FFFFFF;
  color: #5A5A5A;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0,0,0,0.035);
  flex-shrink: 0;
}

.tag-chip:active {
  background: #E0DCD5;
}

/* Separator */
.sep {
  height: 1px;
  margin: 14px 12px 0;
  background: #E0DED8;
}

/* Filter Row */
.filter-row {
  display: flex;
  align-items: center;
  padding: 10px 12px 0;
  gap: 0;
  flex-wrap: wrap;
}

.filter-item {
  color: #8C8C8C;
  font-size: 12px;
  font-weight: 800;
}

.filter-item.on {
  color: #1F1F1F;
}

.filter-dot {
  color: #D0D0D0;
  font-size: 10px;
  margin: 0 4px;
}

.filter-gap {
  color: #D0D0D0;
  font-size: 11px;
  margin: 0 8px 0 12px;
}

/* Active Tag */
.active-row {
  display: flex;
  align-items: center;
  padding: 10px 12px 4px;
  gap: 8px;
}

.active-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: #3A3A3A;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 800;
}

.active-close {
  color: rgba(255,255,255,0.5);
  font-size: 14px;
}

.active-total {
  margin-left: auto;
  color: #B0B0B0;
  font-size: 11px;
}

/* Results */
.results {
  padding: 4px 12px 24px;
}

.more {
  padding: 14px 0;
  text-align: center;
  color: #8C8C8C;
  font-size: 12px;
  font-weight: 700;
}

.state {
  padding: 48px 0;
  text-align: center;
  color: #8C8C8C;
  font-size: 13px;
}

.state-title {
  display: block;
  color: #1F1F1F;
  font-size: 15px;
  font-weight: 800;
}

.body-pad {
  height: 24px;
}

@media (min-width: 720px) {
  .cate-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
