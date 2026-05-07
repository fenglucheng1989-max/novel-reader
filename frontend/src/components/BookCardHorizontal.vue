<template>
  <view class="book-card-h" @tap="$emit('tap')">
    <text v-if="showRank" class="rank-num" :class="{ 'rank-top': showRank <= 3 }">{{ showRank }}</text>
    <BookCover :title="book.title" size="sm" />
    <view class="card-info">
      <text class="card-title">{{ book.title }}</text>
      <text class="card-meta">{{ metaLine }}</text>
    </view>
    <text v-if="showStatus && book.status" class="status-badge" :class="statusClass">{{ statusLabel }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import BookCover from './BookCover.vue'

const props = defineProps({
  book: { type: Object, required: true },
  showRank: { type: Number, default: 0 },
  showStatus: { type: Boolean, default: false },
  showLatestChapter: { type: Boolean, default: false }
})

defineEmits(['tap'])

const statusLabel = computed(() => props.book.status === 'COMPLETED' ? '完结' : '连载')
const statusClass = computed(() => props.book.status === 'COMPLETED' ? 'status-done' : 'status-ongoing')

const metaLine = computed(() => {
  const parts = [props.book.author || '佚名']
  if (props.showLatestChapter && props.book.latestChapterTitle) {
    parts.push(props.book.latestChapterTitle)
  } else if (props.book.wordCount) {
    parts.push(formatWordCount(props.book.wordCount))
  }
  return parts.join(' · ')
})

function formatWordCount(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万字'
  if (n >= 1000) return (n / 1000).toFixed(1) + '千字'
  return n + '字'
}
</script>

<style scoped>
.book-card-h {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.rank-num {
  flex: 0 0 24px;
  text-align: center;
  color: #999;
  font-size: 15px;
  font-weight: 900;
}

.rank-num.rank-top {
  color: #e07b4c;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  display: block;
  color: #1f2a26;
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: block;
  margin-top: 3px;
  color: #8b8176;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  flex: 0 0 auto;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.status-ongoing {
  background: #e8f0ed;
  color: #2f6f5e;
}

.status-done {
  background: #f0e8e3;
  color: #9a6b45;
}
</style>
