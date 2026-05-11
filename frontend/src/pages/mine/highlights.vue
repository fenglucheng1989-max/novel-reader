<template>
  <view class="page">
    <view class="page-hero">
      <text class="page-title">我的摘录</text>
      <text class="page-sub">划线收藏的句子，共 {{ highlightStore.highlights.length }} 条</text>
    </view>

    <view v-if="!highlightStore.highlights.length" class="empty-card">
      <text class="empty-icon">&#x270F;</text>
      <text class="empty-text">还没有划线摘录</text>
      <text class="empty-hint">阅读时选中文字即可划线摘录</text>
    </view>

    <view v-else class="highlight-list">
      <view v-for="group in grouped" :key="group.bookId" class="group-card">
        <view class="group-head" @tap="goDetail(group.bookId)">
          <text class="group-book">{{ group.bookTitle || '未知书籍' }}</text>
          <text class="group-count">{{ group.items.length }} 条</text>
          <text class="group-arrow">&#8250;</text>
        </view>
        <view v-for="item in group.items" :key="item.id" class="highlight-row">
          <text class="highlight-quote">"{{ item.quoteText }}"</text>
          <text class="highlight-meta">第 {{ item.chapterNo }} 章</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useHighlightStore } from '../../store/highlight'
import { useUserStore } from '../../store/user'

const highlightStore = useHighlightStore()
const userStore = useUserStore()
const grouped = ref([])

function goDetail(bookId) {
  uni.navigateTo({ url: `/pages/book/detail?id=${bookId}` })
}

onShow(() => {
  userStore.syncFromStorage()
  highlightStore.loadFromStorage()
  if (userStore.isLoggedIn) {
    highlightStore.syncFromServer().then(() => {
      grouped.value = highlightStore.getGroupedHighlights()
    })
  } else {
    grouped.value = highlightStore.getGroupedHighlights()
  }
})
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

/* ── Highlights ── */
.highlight-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-card {
  background: #FFFFFF;
  border-radius: 9px;
  box-shadow: 0 4px 11px rgba(15, 23, 42, 0.045);
  padding: 12px 14px;
}

.group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #F4F4F1;
  margin-bottom: 8px;
}

.group-book {
  flex: 1;
  font-size: 15px;
  font-weight: 800;
  color: #1F1F1F;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-count {
  font-size: 12px;
  color: #B0B0B0;
  flex-shrink: 0;
}

.group-arrow {
  font-size: 16px;
  color: #D0D0C8;
  flex-shrink: 0;
}

.highlight-row {
  padding: 8px 0;
  border-bottom: 1px solid #F9F8F6;
}

.highlight-row:last-child {
  border-bottom: none;
}

.highlight-quote {
  display: block;
  color: #1F1F1F;
  font-size: 14px;
  line-height: 22px;
}

.highlight-meta {
  display: block;
  margin-top: 4px;
  color: #B0B0B0;
  font-size: 11px;
}
</style>
