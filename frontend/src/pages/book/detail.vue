<template>
  <view class="page">
    <view v-if="loading" class="empty">正在加载详情...</view>
    <view v-else-if="!detail" class="empty">书籍不存在</view>
    <view v-else>
      <view class="book-hero">
        <view class="cover">{{ coverText(detail.book.title) }}</view>
        <view class="hero-info">
          <text class="title">{{ detail.book.title }}</text>
          <text class="meta">{{ detail.book.author || '佚名' }} · {{ detail.categoryName || '未分类' }}</text>
          <text class="meta">{{ statusText(detail.book.status) }} · {{ detail.book.chapterCount || 0 }} 章</text>
          <text class="latest">{{ detail.book.latestChapterTitle || '暂无最新章节' }}</text>
        </view>
      </view>

      <view class="actions">
        <button class="primary" @tap="startRead">开始阅读</button>
        <button class="secondary" @tap="toggleShelf">{{ detail.inBookshelf ? '移出书架' : '加入书架' }}</button>
      </view>

      <view class="section">
        <text class="section-title">简介</text>
        <view class="desc">{{ detail.book.description || '暂无简介' }}</view>
      </view>

      <view class="section">
        <view class="section-row">
          <text class="section-title">目录</text>
          <text class="count">{{ detail.chapters.length }} 章</text>
        </view>
        <view
          v-for="chapter in detail.chapters"
          :key="chapter.id"
          class="chapter"
          @tap="readChapter(chapter.chapterNo)"
        >
          <text class="chapter-title">{{ chapter.title }}</text>
          <text class="chapter-meta">{{ chapter.wordCount || 0 }} 字</text>
        </view>
        <view v-if="!detail.chapters.length" class="chapter-empty">暂无章节</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import { useUserStore } from '../../store/user'

const bookStore = useBookStore()
const userStore = useUserStore()
const id = ref('')
const detail = ref(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await bookStore.loadDetail(id.value)
    if (res.code === 200) {
      detail.value = res.data
    }
  } finally {
    loading.value = false
  }
}

async function toggleShelf() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/mine/mine' }), 800)
    return
  }
  if (detail.value.inBookshelf) {
    await bookStore.removeShelf(id.value)
    uni.showToast({ title: '已移出书架', icon: 'none' })
  } else {
    await bookStore.addShelf(id.value)
    uni.showToast({ title: '已加入书架', icon: 'success' })
  }
  await load()
}

function startRead() {
  if (!detail.value.chapters.length) {
    uni.showToast({ title: '暂无可读章节', icon: 'none' })
    return
  }
  readChapter(detail.value.chapters[0].chapterNo)
}

function readChapter(chapterNo) {
  uni.navigateTo({ url: `/pages/reader/reader?bookId=${id.value}&chapterNo=${chapterNo}` })
}

function statusText(status) {
  if (status === 'COMPLETED') return '完结'
  if (status === 'PAUSED') return '暂停'
  return '连载'
}

function coverText(title) {
  return (title || '书').slice(0, 2)
}

onLoad((query) => {
  id.value = query.id
  load()
})
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  padding: 18px;
  background: #f6f3ee;
  box-sizing: border-box;
  overflow-x: hidden;
}

.empty,
.chapter-empty {
  padding: 60px 0;
  color: #81776c;
  text-align: center;
}

.chapter-empty {
  padding: 18px 0 4px;
}

.book-hero {
  width: 100%;
  display: flex;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
}

.cover {
  width: 88px;
  height: 118px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(135deg, #2f6f5e, #9a6b45);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
}

.hero-info {
  flex: 1;
  min-width: 0;
  margin-left: 14px;
}

.title,
.meta,
.latest,
.section-title,
.desc,
.chapter-title,
.chapter-meta,
.count {
  display: block;
}

.title {
  color: #202a26;
  font-size: 22px;
  font-weight: 700;
}

.meta,
.latest {
  margin-top: 8px;
  color: #81776c;
  font-size: 13px;
}

.latest {
  color: #9a6b45;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 14px 0;
}

.primary,
.secondary {
  height: 42px;
  line-height: 42px;
  border-radius: 6px;
  font-size: 15px;
}

.primary {
  background: #2f6f5e;
  color: #fff;
}

.secondary {
  background: #fff;
  color: #2f6f5e;
}

.section {
  margin-top: 14px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
}

.section-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.section-title {
  color: #26312d;
  font-size: 17px;
  font-weight: 700;
}

.count {
  color: #91867a;
  font-size: 13px;
}

.desc {
  width: 100%;
  margin-top: 10px;
  color: #4c5550;
  font-size: 14px;
  line-height: 23px;
  white-space: normal;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.chapter {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 0;
  border-top: 1px solid #eee7de;
}

.chapter:first-of-type {
  margin-top: 8px;
}

.chapter-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333b37;
  font-size: 15px;
}

.chapter-meta {
  flex: 0 0 auto;
  color: #9a8f83;
  font-size: 12px;
}
</style>
