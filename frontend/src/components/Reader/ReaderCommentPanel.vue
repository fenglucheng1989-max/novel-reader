<template>
  <view class="nr-comment" :class="{ 'nr-comment-visible': visible }">
    <view class="nr-comment-mask" @click="$emit('close')" />

    <view class="nr-comment-panel">
      <!-- 头部 -->
      <view class="nr-comment-header">
        <text class="nr-comment-title">段评</text>
        <text class="nr-comment-close" @click="$emit('close')">✕</text>
      </view>

      <!-- 引用原文 -->
      <view v-if="quoteText" class="nr-comment-quote">
        <text class="nr-comment-quote-text">{{ quoteText }}</text>
      </view>

      <!-- 评论列表 -->
      <scroll-view class="nr-comment-list" :scroll-y="true" @scrolltolower="$emit('load-more')">
        <view v-if="loading" class="nr-comment-loading">
          <text>加载中...</text>
        </view>

        <view v-else-if="comments.length === 0" class="nr-comment-empty">
          <text>暂无段评</text>
        </view>

        <view
          v-for="c in comments"
          :key="c.id"
          class="nr-comment-item"
        >
          <view class="nr-comment-item-header">
            <text class="nr-comment-item-name">{{ c.nickname }}</text>
            <text class="nr-comment-item-time">{{ formatTime(c.createdAt) }}</text>
          </view>
          <text class="nr-comment-item-content">{{ c.content }}</text>
          <view class="nr-comment-item-actions">
            <text
              class="nr-comment-item-like"
              :class="{ liked: c.liked }"
              @click="$emit('like', c)"
            >
              {{ c.liked ? '❤️' : '🤍' }} {{ c.likeCount || '' }}
            </text>
          </view>
        </view>

        <view v-if="hasMore" class="nr-comment-more" @click="$emit('load-more')">
          <text>加载更多</text>
        </view>
      </scroll-view>

      <!-- 输入区 -->
      <view class="nr-comment-input-row">
        <textarea
          v-model="inputContent"
          class="nr-comment-input"
          :placeholder="`写段评...（${inputContent.length}/200）`"
          maxlength="200"
          :disabled="submitting"
        />
        <view class="nr-comment-input-actions">
          <text
            class="nr-comment-submit"
            :class="{ disabled: !inputContent.trim() || submitting }"
            @click="onSubmit"
          >
            {{ submitting ? '发布中...' : '发布' }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, withDefaults } from 'vue'
import type { ParagraphComment } from '../../types/reader'

const props = withDefaults(defineProps<{
  visible: boolean
  quoteText: string
  comments: ParagraphComment[]
  loading: boolean
  hasMore: boolean
  submitting: boolean
}>(), {
  visible: false,
  quoteText: '',
  comments: () => [],
  loading: false,
  hasMore: false,
  submitting: false,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', content: string): void
  (e: 'load-more'): void
  (e: 'like', comment: ParagraphComment): void
}>()

const inputContent = ref('')

function onSubmit(): void {
  if (!inputContent.value.trim() || props.submitting) return
  emit('submit', inputContent.value.trim())
  inputContent.value = ''
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}小时前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.nr-comment {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 200;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s;
}
.nr-comment-visible {
  pointer-events: auto;
  opacity: 1;
}

.nr-comment-mask {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.4);
}

.nr-comment-panel {
  position: absolute;
  right: 0; top: 0;
  width: 85%;
  max-width: 360px;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.nr-comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 44px 16px 12px;
  border-bottom: 1px solid #eee;
}

.nr-comment-title {
  font-size: 17px;
  font-weight: bold;
}

.nr-comment-close {
  font-size: 20px;
  color: #999;
  padding: 4px;
}

.nr-comment-quote {
  background: #F9F5E8;
  padding: 10px 16px;
  margin: 8px 12px;
  border-radius: 8px;
  border-left: 3px solid #C4A882;
}

.nr-comment-quote-text {
  font-size: 13px;
  color: #8B7355;
  line-height: 1.6;
}

.nr-comment-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
}

.nr-comment-loading,
.nr-comment-empty {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

.nr-comment-item {
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.nr-comment-item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.nr-comment-item-name {
  font-size: 13px;
  color: #C4A882;
  font-weight: bold;
}

.nr-comment-item-time {
  font-size: 11px;
  color: #999;
}

.nr-comment-item-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.nr-comment-item-actions {
  margin-top: 6px;
}

.nr-comment-item-like {
  font-size: 12px;
  color: #999;
}
.nr-comment-item-like.liked {
  color: #C4A882;
}

.nr-comment-more {
  text-align: center;
  padding: 12px;
  color: #C4A882;
  font-size: 13px;
}

.nr-comment-input-row {
  border-top: 1px solid #eee;
  padding: 8px 12px 24px;
  background: #fff;
}

.nr-comment-input {
  width: 100%;
  min-height: 36px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px;
  font-size: 14px;
  box-sizing: border-box;
  resize: none;
}

.nr-comment-input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.nr-comment-submit {
  font-size: 14px;
  color: #fff;
  background: #C4A882;
  padding: 6px 20px;
  border-radius: 16px;
}
.nr-comment-submit.disabled {
  opacity: 0.5;
}
.nr-comment-submit:active {
  opacity: 0.8;
}
</style>
