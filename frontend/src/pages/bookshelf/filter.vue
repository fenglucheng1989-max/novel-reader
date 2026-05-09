<template>
  <view class="page">
    <!-- Top Bar -->
    <view class="topbar">
      <text class="back" @tap="goBack">‹ 返回</text>
      <text class="title">筛选</text>
      <text class="reset" @tap="resetAll">重置</text>
    </view>

    <!-- Row 1: Content Type -->
    <scroll-view class="filter-scroll" scroll-x :show-scrollbar="false">
      <view class="filter-row">
        <text
          v-for="opt in typeOptions"
          :key="opt.value"
          class="chip"
          :class="{ active: form.type === opt.value }"
          @tap="form.type = form.type === opt.value ? '' : opt.value"
        >{{ opt.label }}</text>
      </view>
    </scroll-view>

    <!-- Row 2: Progress -->
    <scroll-view class="filter-scroll" scroll-x :show-scrollbar="false">
      <view class="filter-row">
        <text
          v-for="opt in progressOptions"
          :key="opt.value"
          class="chip"
          :class="{ active: form.progress === opt.value }"
          @tap="form.progress = form.progress === opt.value ? '' : opt.value"
        >{{ opt.label }}</text>
      </view>
    </scroll-view>

    <!-- Row 3: Status -->
    <scroll-view class="filter-scroll" scroll-x :show-scrollbar="false">
      <view class="filter-row">
        <text
          v-for="opt in statusOptions"
          :key="opt.value"
          class="chip"
          :class="{ active: form.status === opt.value }"
          @tap="form.status = form.status === opt.value ? '' : opt.value"
        >{{ opt.label }}</text>
      </view>
    </scroll-view>

    <!-- Row 4: Category -->
    <scroll-view class="filter-scroll" scroll-x :show-scrollbar="false">
      <view class="filter-row">
        <text
          class="chip"
          :class="{ active: !form.categoryId }"
          @tap="form.categoryId = null; form.categoryName = ''"
        >全部</text>
        <text
          v-for="cat in categories"
          :key="cat.id"
          class="chip"
          :class="{ active: form.categoryId === cat.id }"
          @tap="selectCategory(cat)"
        >{{ cat.name }}</text>
      </view>
    </scroll-view>

    <!-- Book List -->
    <view class="book-section">
      <view v-if="!filteredList.length" class="empty">暂无匹配书籍</view>
      <view
        v-for="item in filteredList"
        :key="item.shelfId"
        class="book-row"
        @tap="openBook(item)"
      >
        <view class="cover-wrap">
          <BookCover :title="item.book.title" :cover-url="item.book.coverUrl" size="md" />
        </view>
        <view class="book-info">
          <text class="list-name">{{ item.book.title }}</text>
          <view class="list-meta">
            <text class="book-author">{{ item.book.author || '佚名' }}</text>
            <text v-if="item.book.wordCount" class="book-meta-sep">·</text>
            <text v-if="item.book.wordCount" class="book-wordcount">{{ formatWordCount(item.book.wordCount) }}字</text>
            <text v-if="item.book.status === 'COMPLETED'" class="book-tag done">完结</text>
            <text v-else-if="remainingChapters(item) > 0" class="book-tag update">更新{{ remainingChapters(item) }}章</text>
          </view>
          <text class="book-progress">{{ progressText(item) }}</text>
          <text v-if="item.book.description" class="book-desc">{{ item.book.description }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import { useUserStore } from '../../store/user'
import BookCover from '../../components/BookCover.vue'

const bookStore = useBookStore()
const userStore = useUserStore()

const typeOptions = [
  { label: '全部', value: '' },
  { label: '小说', value: 'novel' },
  { label: '听书', value: 'audio' }
]

const progressOptions = [
  { label: '全部', value: '' },
  { label: '未读', value: 'unread' },
  { label: '阅读中', value: 'reading' },
  { label: '已读完', value: 'finished' }
]

const statusOptions = [
  { label: '全部', value: '' },
  { label: '完结', value: 'COMPLETED' },
  { label: '连载', value: 'ONGOING' },
  { label: '有更新', value: 'updated' }
]

const categories = ref([])

const form = reactive({
  type: '',
  progress: '',
  status: '',
  categoryId: null,
  categoryName: ''
})

const filteredList = computed(() => {
  let list = bookStore.shelf || []
  if (form.type) {
    if (form.type === 'novel') {
      const novelCatIds = new Set(
        categories.value.filter(c => c.groupKey === 'male' || c.groupKey === 'female').map(c => c.id)
      )
      list = list.filter((item) => novelCatIds.has(Number(item.book.categoryId)))
    } else if (form.type === 'audio') {
      const audioCatIds = new Set(
        categories.value.filter(c => c.groupKey === 'audio').map(c => c.id)
      )
      list = list.filter((item) => audioCatIds.has(Number(item.book.categoryId)))
    }
  }
  if (form.status) {
    if (form.status === 'updated') {
      list = list.filter((item) => remainingChapters(item) > 0)
    } else {
      list = list.filter((item) => item.book.status === form.status)
    }
  }
  if (form.progress === 'unread') {
    list = list.filter((item) => progressChapter(item) <= 1)
  } else if (form.progress === 'reading') {
    list = list.filter((item) => progressChapter(item) > 1 && progressChapter(item) < Number(item.book.chapterCount || 9999))
  } else if (form.progress === 'finished') {
    list = list.filter((item) => progressChapter(item) >= Number(item.book.chapterCount || 0) && Number(item.book.chapterCount || 0) > 0)
  }
  if (form.categoryId) {
    list = list.filter((item) => Number(item.book.categoryId) === Number(form.categoryId))
  }
  return list
})

function progressChapter(item) {
  return Number(item.progress?.chapterNo || 1)
}

function remainingChapters(item) {
  const total = Number(item.book.chapterCount || 0)
  if (!total) return 0
  return Math.max(total - progressChapter(item), 0)
}

function formatWordCount(value) {
  const num = Number(value || 0)
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return String(num)
}

function progressText(item) {
  const total = Number(item.book.chapterCount || 0)
  if (!total) return '暂无章节'
  return `${progressChapter(item)}/${total} 章`
}

async function loadCategories() {
  await bookStore.loadCategories()
  categories.value = bookStore.categories || []
}

function selectCategory(cat) {
  if (form.categoryId === cat.id) {
    form.categoryId = null
    form.categoryName = ''
  } else {
    form.categoryId = cat.id
    form.categoryName = cat.name
  }
}

function resetAll() {
  form.type = ''
  form.progress = ''
  form.status = ''
  form.categoryId = null
  form.categoryName = ''
}

function openBook(item) {
  const chapterNo = progressChapter(item)
  uni.navigateTo({ url: `/pages/reader/reader?bookId=${item.book.id}&chapterNo=${chapterNo}` })
}

function goBack() {
  // save filter state before going back
  uni.setStorageSync('bookshelfFilter', JSON.stringify({
    type: form.type,
    status: form.status === 'updated' ? '' : form.status,
    categoryId: form.categoryId,
    categoryName: form.categoryName,
    progress: form.progress,
    onlyUpdated: form.status === 'updated'
  }))
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/bookshelf/bookshelf' })
}

onLoad(async () => {
  userStore.syncFromStorage()
  await bookStore.loadShelf()
  await loadCategories()
  try {
    const raw = uni.getStorageSync('bookshelfFilter')
    if (raw) {
      const prev = JSON.parse(raw)
      if (prev.type) form.type = prev.type
      if (prev.onlyUpdated) {
        form.status = 'updated'
      } else if (prev.status) {
        form.status = prev.status
      }
      if (prev.progress) form.progress = prev.progress
      if (prev.categoryId) {
        form.categoryId = prev.categoryId
        form.categoryName = prev.categoryName || ''
      }
    }
  } catch {}
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 10px 32px;
  background: #F4F4F1;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* ── Topbar ── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.back {
  color: #8C8C8C;
  font-size: 13px;
}

.title {
  color: #1F1F1F;
  font-size: 17px;
  font-weight: 900;
}

.reset {
  color: #8C8C8C;
  font-size: 13px;
  font-weight: 800;
}

/* ── Filter Rows ── */
.filter-scroll {
  margin-bottom: 12px;
  white-space: nowrap;
}

.filter-scroll ::-webkit-scrollbar {
  display: none;
}

.filter-row {
  display: flex;
  gap: 0;
  white-space: nowrap;
}

.chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: 28px;
  margin-right: 20px;
  color: #8C8C8C;
  font-size: 13px;
  font-weight: 700;
  position: relative;
}

.chip:last-child {
  margin-right: 0;
}

.chip.active {
  color: #1F1F1F;
}

.chip.active::after {
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

/* ── Book List ── */
.book-section {
  margin-top: 12px;
  padding: 10px;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 6px 18px rgba(31, 31, 31, 0.045);
}

.empty {
  padding: 48px 0;
  color: #8C8C8C;
  text-align: center;
  font-size: 14px;
}

.book-row {
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.book-row:last-child {
  border-bottom: none;
}

.cover-wrap {
  position: relative;
  flex-shrink: 0;
  width: 54px;
  height: 74px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.07);
  background: #E8E6E0;
}

.book-info {
  min-width: 0;
  flex: 1;
}

.list-name {
  display: block;
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 800;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.book-author {
  color: #8C8C8C;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-meta-sep {
  color: #C0C0C0;
  font-size: 12px;
}

.book-wordcount {
  color: #8C8C8C;
  font-size: 13px;
  flex-shrink: 0;
}

.book-progress {
  display: block;
  margin-top: 4px;
  color: #8C8C8C;
  font-size: 12px;
}

.book-tag {
  display: inline-block;
  margin-left: 4px;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.book-tag.done {
  background: rgba(0, 0, 0, 0.06);
  color: #8C8C8C;
}

.book-tag.update {
  background: rgba(160, 144, 128, 0.15);
  color: #A09080;
}

.book-desc {
  display: block;
  margin-top: 5px;
  color: #A0A0A0;
  font-size: 12px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
