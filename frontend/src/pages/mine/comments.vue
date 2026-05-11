<template>
  <view class="page">
    <view class="page-hero">
      <text class="page-title">我的评论</text>
      <text class="page-sub">共 {{ totalCount }} 条评论</text>
    </view>

    <view v-if="loading" class="state">正在加载...</view>

    <view v-else-if="!comments.length" class="empty-card">
      <text class="empty-icon">&#x1F4AC;</text>
      <text class="empty-text">还没有评论</text>
      <text class="empty-hint">阅读时发表的评论会出现在这里</text>
    </view>

    <view v-else class="comment-list">
      <view v-for="item in comments" :key="item.id" class="comment-card" @tap="goDetail(item.bookId)">
        <view class="comment-head">
          <text class="comment-book">{{ item.bookTitle || '未知书籍' }}</text>
          <text class="comment-arrow">&#8250;</text>
        </view>
        <text v-if="item.chapterTitle" class="comment-chapter">{{ item.chapterTitle }}</text>
        <text class="comment-body">{{ item.content }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import { useUserStore } from '../../store/user'

const bookStore = useBookStore()
const userStore = useUserStore()
const comments = ref([])
const totalCount = ref(0)
const loading = ref(false)

function goDetail(bookId) {
  if (!bookId) return
  uni.navigateTo({ url: `/pages/book/detail?id=${bookId}` })
}

onShow(() => {
  userStore.syncFromStorage()
  if (userStore.isLoggedIn) {
    loadComments()
  }
})

async function loadComments() {
  loading.value = true
  try {
    const res = await bookStore.loadMyComments(1, 50)
    if (res.code === 200) {
      comments.value = res.data?.records || []
      totalCount.value = res.data?.total || 0
    }
  } catch {
    comments.value = []
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 11px calc(48px + env(safe-area-inset-bottom));
  background: #F4F4F1;
  box-sizing: border-box;
}

.page-hero {
  padding: 10px 5px 14px;
}

.page-title {
  display: block;
  font-size: 20px;
  line-height: 26px;
  font-weight: 900;
  color: #1F1F1F;
}

.page-sub {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  line-height: 18px;
  color: #A09080;
}

/* ── State ── */
.state {
  padding: 52px 0;
  color: #8C8C8C;
  text-align: center;
  font-size: 13px;
}

/* ── Empty ── */
.empty-card {
  padding: 60px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 14px;
}

.empty-text {
  display: block;
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 700;
}

.empty-hint {
  display: block;
  margin-top: 6px;
  color: #B0B0B0;
  font-size: 13px;
}

/* ── Comments ── */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-card {
  background: #FFFFFF;
  border-radius: 9px;
  box-shadow: 0 4px 11px rgba(15, 23, 42, 0.045);
  padding: 12px 14px;
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-book {
  flex: 1;
  font-size: 15px;
  font-weight: 800;
  color: #1F1F1F;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comment-arrow {
  font-size: 16px;
  color: #D0D0C8;
  flex-shrink: 0;
}

.comment-chapter {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #A09080;
}

.comment-body {
  display: block;
  margin-top: 8px;
  color: #1F1F1F;
  font-size: 14px;
  line-height: 22px;
}
</style>
