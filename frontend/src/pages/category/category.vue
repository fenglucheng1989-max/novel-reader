<template>
  <view class="page">
    <view class="category-shell">
      <view class="nav-bar">
        <view class="nav-button" @tap="goBack">‹</view>
        <scroll-view class="segment-row" scroll-x>
          <view
            v-for="item in genderTabs"
            :key="item.key"
            class="segment-item"
            :class="{ active: activeGender === item.key }"
            @tap="activeGender = item.key"
          >{{ item.name }}</view>
        </scroll-view>
      </view>

      <view class="content-card">
        <view class="rail">
          <view
            v-for="group in groups"
            :key="group.key"
            class="rail-item"
            :class="{ active: activeGroup === group.key }"
            @tap="selectGroup(group.key)"
          >{{ group.name }}</view>
        </view>

        <scroll-view class="main-scroll" scroll-y>
          <!-- Tag Section -->
          <view v-if="activeGroup === 'category'" class="tag-section">
            <view class="section-head">
              <text class="section-title">频道分类</text>
              <text class="section-note">{{ bookStore.categories.length }} 个</text>
            </view>
            <view class="tag-grid">
              <view class="tag-card featured" @tap="chooseCategory(0)"><text>推荐</text></view>
              <view
                v-for="item in bookStore.categories"
                :key="item.id"
                class="tag-card"
                :class="{ active: bookStore.selectedCategoryId === item.id }"
                @tap="chooseCategory(item.id)"
              ><text>{{ item.name }}</text></view>
            </view>

            <view class="section-head spaced">
              <text class="section-title">热门标签</text>
              <text class="section-note">{{ activeGenderName }}</text>
            </view>
            <view class="tag-grid">
              <view v-for="tag in hotTags" :key="tag" class="tag-card soft" @tap="pickTag(tag)"><text>{{ tag }}</text></view>
            </view>
          </view>

          <view v-else class="tag-section">
            <view class="section-head">
              <text class="section-title">{{ currentGroup.name }}</text>
              <text class="section-note">偏好标签</text>
            </view>
            <view class="tag-grid">
              <view v-for="tag in currentTags" :key="tag" class="tag-card" @tap="pickTag(tag)"><text>{{ tag }}</text></view>
            </view>
          </view>

          <!-- Filter + Results (shown when keyword active) -->
          <template v-if="currentKeyword">
            <view class="divider" />

            <view class="filter-bar">
              <view class="filter-row">
                <text class="filter-label">状态</text>
                <view class="filter-chips">
                  <view class="f-chip" :class="{ active: statusFilter === '' }" @tap="setFilter('status', '')">全部</view>
                  <view class="f-chip" :class="{ active: statusFilter === 'ONGOING' }" @tap="setFilter('status', 'ONGOING')">连载</view>
                  <view class="f-chip" :class="{ active: statusFilter === 'COMPLETED' }" @tap="setFilter('status', 'COMPLETED')">完结</view>
                </view>
              </view>
              <view class="filter-row">
                <text class="filter-label">排序</text>
                <view class="filter-chips">
                  <view class="f-chip" :class="{ active: sortBy === 'latest' }" @tap="setFilter('sort', 'latest')">最新</view>
                  <view class="f-chip" :class="{ active: sortBy === 'wordCount' }" @tap="setFilter('sort', 'wordCount')">最多字数</view>
                  <view class="f-chip" :class="{ active: sortBy === 'chapterCount' }" @tap="setFilter('sort', 'chapterCount')">最多章节</view>
                </view>
              </view>
            </view>

            <view class="active-tags">
              <view class="active-tag">
                <text>{{ currentKeyword }}</text>
                <text class="tag-close" @tap="clearKeyword">×</text>
              </view>
              <text class="result-total">共 {{ total }} 本</text>
            </view>

            <view v-if="searchLoading" class="empty">正在查找...</view>
            <view v-else-if="!books.length" class="empty">
              <text class="empty-title">没有找到符合条件的书</text>
              <text class="empty-subtitle">试试其他标签或筛选条件。</text>
            </view>
            <view v-else class="results-list">
              <BookCardHorizontal
                v-for="book in books"
                :key="book.id"
                :book="book"
                :show-status="true"
                :show-latest-chapter="true"
                @tap="goDetail(book.id)"
              />
              <view v-if="hasMore" class="load-more" @tap="loadMore">
                <text>加载更多 ({{ books.length }} / {{ total }})</text>
              </view>
            </view>
          </template>

          <view v-if="loading" class="empty">正在整理分类...</view>
        </scroll-view>
      </view>
    </view>
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
const activeGroup = ref('category')

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

const groups = [
  { key: 'category', name: '频道' },
  { key: 'theme', name: '主题' },
  { key: 'role', name: '角色' },
  { key: 'plot', name: '情节' }
]

const tagMap = {
  male: {
    hot: ['热血', '升级流', '无限流', '都市脑洞', '玄幻脑洞', '克苏鲁', '游戏体育', '架空', '副本', '求生', '末日', '灵异'],
    theme: ['悬疑', '玄幻', '历史', '都市', '科幻', '奇幻', '武侠', '仙侠', '末世', '游戏', '体育', '脑洞'],
    role: ['少年', '剑客', '医生', '学生', '侦探', '商人', '修士', '反派', '群像', '异能者', '穿越者', '凡人'],
    plot: ['开局', '复仇', '升级', '种田', '探案', '冒险', '权谋', '日常', '求生', '无限流', '副本', '逆袭']
  },
  female: {
    hot: ['古言', '现言', '女强', '甜宠', '宫斗', '重生', '穿越', '先婚后爱', '豪门', '权谋', '种田', '破镜重圆'],
    theme: ['古代言情', '现代言情', '幻想言情', '悬疑恋爱', '青春', '职场', '宫廷', '宅斗', '仙侠', '年代', '田园', '娱乐圈'],
    role: ['女主', '将军', '公主', '医妃', '影后', '总裁', '学霸', '王爷', '反派', '群像', '青梅竹马', '大女主'],
    plot: ['重生', '穿越', '复仇', '甜宠', '虐恋', '追妻', '契约', '婚恋', '成长', '逆袭', '破案', '日久生情']
  },
  audio: {
    hot: ['精品听书', '睡前故事', '多人剧', '悬疑有声', '历史评书', '都市爽文', '玄幻热血', '短篇', '长篇', '新书上架', '完结必听', '高分'],
    theme: ['悬疑', '历史', '都市', '玄幻', '言情', '科幻', '人文', '评书', '儿童', '职场', '情感', '相声'],
    role: ['单播', '双播', '多人剧', '男声', '女声', '旁白', '精品主播', '新锐主播', '剧场', '作者亲读', '沉浸', '白噪'],
    plot: ['探案', '逆袭', '成长', '冒险', '权谋', '日常', '治愈', '烧脑', '爆笑', '催眠', '热血', '情感']
  },
  short: {
    hot: ['短剧热榜', '反转', '逆袭', '爽感', '甜宠', '战神', '赘婿', '复仇', '豪门', '都市', '古装', '悬疑'],
    theme: ['都市短剧', '古装短剧', '甜宠短剧', '悬疑短剧', '家庭', '职场', '校园', '年代', '奇幻', '权谋', '喜剧', '情感'],
    role: ['霸总', '战神', '赘婿', '千金', '神医', '萌宝', '女强', '反派', '管家', '律师', '警探', '群像'],
    plot: ['逆袭', '复仇', '闪婚', '打脸', '追妻', '掉马', '真假千金', '契约', '重逢', '破案', '救赎', '反转']
  }
}

const currentGroup = computed(() => groups.find((item) => item.key === activeGroup.value) || groups[0])
const activeGenderName = computed(() => genderTabs.find((item) => item.key === activeGender.value)?.name || '男生')
const activeTagSet = computed(() => tagMap[activeGender.value] || tagMap.male)
const currentTags = computed(() => activeTagSet.value[activeGroup.value] || [])
const hotTags = computed(() => activeTagSet.value.hot || [])

async function load() {
  loading.value = true
  try { await bookStore.loadCategories() } finally { loading.value = false }
}

function selectGroup(key) {
  activeGroup.value = key
  clearKeyword()
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
  padding: 14px 12px 28px;
  background: #F8F8F6;
  box-sizing: border-box;
  overflow-x: hidden;
}

.category-shell {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.nav-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 42px;
  margin-bottom: 12px;
}

.nav-button {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #EBEBE5;
  color: #3A3A3A;
  font-size: 28px;
  font-weight: 500;
}

.segment-row {
  min-width: 0;
  flex: 1;
  height: 42px;
  white-space: nowrap;
}

.segment-row :deep(.uni-scroll-view-content) {
  display: flex;
  align-items: center;
  gap: 22px;
  min-height: 42px;
}

.segment-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 42px;
  margin-right: 22px;
  color: #8C8C8C;
  font-size: 15px;
  font-weight: 800;
}

.segment-item.active {
  color: #1F1F1F;
  font-size: 22px;
  font-weight: 900;
}

.segment-item.active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 1px;
  width: 18px;
  height: 3px;
  border-radius: 999px;
  background: #3A3A3A;
  transform: translateX(-50%);
}

.content-card {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}

.rail {
  padding: 12px 0;
  background: #F5F5F2;
}

.rail-item {
  position: relative;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5A5A5A;
  font-size: 14px;
  font-weight: 800;
}

.rail-item.active {
  background: #fff;
  color: #1F1F1F;
}

.rail-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  width: 3px;
  height: 20px;
  border-radius: 0 999px 999px 0;
  background: #3A3A3A;
}

.main-scroll {
  height: calc(100vh - 128px);
}

.tag-section {
  padding: 16px 12px 22px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-head.spaced { margin-top: 22px; }

.section-title {
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 900;
}

.section-note {
  color: #A09080;
  font-size: 12px;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.tag-card {
  min-width: 0;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 8px;
  background: #F5F5F2;
  color: #3A3A3A;
  font-size: 14px;
  font-weight: 800;
  box-sizing: border-box;
}

.tag-card text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-card.featured { background: #3A3A3A; color: #fff; }
.tag-card.active { background: #3A3A3A; color: #fff; }
.tag-card.soft { background: #fbfaf7; border: 1px solid #EBEBE5; }

.divider {
  height: 1px;
  margin: 0 12px;
  background: #EBEBE5;
}

/* Filter */
.filter-bar {
  padding: 10px 12px 6px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.filter-label {
  flex: 0 0 36px;
  color: #8C8C8C;
  font-size: 13px;
  font-weight: 800;
}

.filter-chips {
  display: flex;
  gap: 6px;
}

.f-chip {
  height: 28px;
  line-height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  background: #F5F5F2;
  color: #5A5A5A;
  font-size: 12px;
  font-weight: 800;
}

.f-chip.active {
  background: #3A3A3A;
  color: #fff;
}

/* Active tags */
.active-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 8px;
}

.active-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  background: #F0F0ED;
  color: #3A3A3A;
  font-size: 12px;
  font-weight: 800;
}

.tag-close {
  color: #8C8C8C;
  font-size: 15px;
}

.result-total {
  margin-left: auto;
  color: #8C8C8C;
  font-size: 12px;
}

/* Results */
.results-list {
  padding: 4px 12px 24px;
}

.load-more {
  padding: 16px 0;
  text-align: center;
  color: #3A3A3A;
  font-size: 13px;
  font-weight: 800;
}

.empty {
  padding: 44px 0;
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
  .content-card { grid-template-columns: 108px minmax(0, 1fr); }
}
</style>
