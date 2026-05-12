<template>
  <view class="book-card-h" @tap="$emit('tap')">
    <text v-if="showRank" class="rank-num" :class="{ 'rank-top': showRank <= 3 }">{{ showRank }}</text>
    <BookCover :title="book.title" :cover-url="book.coverUrl" size="sm" />
    <view class="card-info">
      <text class="card-title">{{ book.title }}</text>
      <text class="card-meta">{{ metaLine }}</text>
    </view>
    <text v-if="showStatus && book.status" class="status-badge" :class="statusClass">{{ statusLabel }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BookCover from './BookCover.vue'
import type { Book, BookStatus } from '../types/book'

const props = withDefaults(defineProps<{
  book: Book
  showRank?: number
  showStatus?: boolean
  showLatestChapter?: boolean
}>(), {
  showRank: 0,
  showStatus: false,
  showLatestChapter: false,
})

defineEmits<{
  tap: []
}>()

const WORD_COUNT_THRESHOLD_WAN = 10000
const WORD_COUNT_THRESHOLD_QIAN = 1000

const statusLabel = computed(() => (props.book.status === 'COMPLETED' ? '完结' : '连载'))
const statusClass = computed(() => (props.book.status === 'COMPLETED' ? 'status-done' : 'status-ongoing'))

const metaLine = computed(() => {
  const parts: string[] = [props.book.author || '佚名']
  if (props.showLatestChapter && props.book.latestChapterTitle) {
    parts.push(props.book.latestChapterTitle)
  } else if (props.book.wordCount) {
    parts.push(formatWordCount(props.book.wordCount))
  }
  return parts.join(' · ')
})

function formatWordCount(n: number): string {
  if (n >= WORD_COUNT_THRESHOLD_WAN) return (n / WORD_COUNT_THRESHOLD_WAN).toFixed(1) + '万字'
  if (n >= WORD_COUNT_THRESHOLD_QIAN) return (n / WORD_COUNT_THRESHOLD_QIAN).toFixed(1) + '千字'
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
  color: #C4A882;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  display: block;
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: block;
  margin-top: 3px;
  color: #8C8C8C;
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
  background: #F0F0ED;
  color: #3A3A3A;
}

.status-done {
  background: #F0F0ED;
  color: #A09080;
}
</style>
