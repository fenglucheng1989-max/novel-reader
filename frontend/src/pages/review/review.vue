<template>
  <view class="review-page">
    <view class="topbar">
      <text class="back" @tap="goBack">‹ 返回</text>
      <text class="top-title">全部评价</text>
      <view class="top-right" />
    </view>

    <view v-if="loading" class="state">正在加载...</view>
    <view v-else-if="!reviews.length" class="state">暂无评价</view>
    <view v-else class="review-list">
      <view v-for="item in reviews" :key="item.id" class="review-item">
        <text class="avatar">{{ (item.username || '?').slice(0, 1) }}</text>
        <view class="review-body">
          <view class="review-head">
            <text class="review-user">{{ item.username || '匿名读者' }}</text>
            <text class="review-chip">好看</text>
            <text class="review-time">{{ formatTime(item.createdAt) }}</text>
          </view>
          <text class="review-content">{{ item.content }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'
import type { Comment, PageResult } from '../../types/book'
import type { ApiResponse } from '../../types/api'

const bookStore = useBookStore()
const bookId = ref<string>('')
const reviews = ref<Comment[]>([])
const loading = ref(false)

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await bookStore.loadBookComments(bookId.value, 1, 100) as ApiResponse<PageResult<Comment>>
    reviews.value = res.code === 200 ? (res.data?.records || []) : []
  } catch {
    reviews.value = []
  } finally {
    loading.value = false
  }
}

function goBack(): void {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '刚刚'
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

onLoad((query?: Record<string, any>) => {
  bookId.value = query.bookId || ''
  load()
})
</script>

<style scoped>
.review-page {
  min-height: 100vh;
  padding: 12px 12px 32px;
  background: #F4F4F1;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  height: 44px;
}

.back {
  color: #8C8C8C;
  font-size: 15px;
}

.top-title {
  color: #181818;
  font-size: 17px;
  font-weight: 900;
}

.top-right {
  width: 40px;
}

.state {
  padding-top: 80px;
  color: #8C8C8C;
  text-align: center;
  font-size: 14px;
}

.review-list {
  display: flex;
  flex-direction: column;
}

.review-item {
  display: flex;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.review-item:last-child {
  border-bottom: none;
}

.avatar {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #F0F0ED;
  color: #A09080;
  font-size: 12px;
  font-weight: 900;
  margin-top: 1px;
}

.review-body {
  min-width: 0;
  flex: 1;
}

.review-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.review-user {
  color: #A09080;
  font-size: 13px;
  font-weight: 800;
}

.review-chip {
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(160, 144, 128, 0.18);
  color: #A09080;
  font-size: 10px;
  line-height: 18px;
}

.review-time {
  margin-left: auto;
  color: #B0B0B0;
  font-size: 12px;
  flex-shrink: 0;
}

.review-content {
  display: block;
  color: #3A3A3A;
  font-size: 14px;
  line-height: 22px;
}
</style>
