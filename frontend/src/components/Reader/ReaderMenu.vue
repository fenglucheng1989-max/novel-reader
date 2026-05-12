<template>
  <view class="nr-menu" :class="{ 'nr-menu-visible': visible }">
    <view class="nr-menu-mask" @click="$emit('close')" />

    <view class="nr-menu-panel">
      <!-- 标题 -->
      <view class="nr-menu-header">
        <text class="nr-menu-title">目录</text>
        <text class="nr-menu-close" @click="$emit('close')">✕</text>
      </view>

      <!-- 进度信息 -->
      <view class="nr-menu-progress">
        <text class="nr-menu-progress-text">
          已读 {{ Math.round(progressPercent * 100) }}%
        </text>
      </view>

      <!-- 章节列表 -->
      <scroll-view class="nr-menu-list" :scroll-y="true">
        <view
          v-for="ch in chapters"
          :key="ch.chapterNo"
          class="nr-menu-chapter"
          :class="{
            'nr-menu-chapter-current': ch.chapterNo === currentChapterNo,
            'nr-menu-chapter-read': ch.chapterNo < (currentChapterNo ?? 0),
          }"
          @click="onChapterClick(ch.chapterNo)"
        >
          <text class="nr-menu-chapter-title">{{ ch.title || `第 ${ch.chapterNo} 章` }}</text>
          <text v-if="ch.chapterNo === currentChapterNo" class="nr-menu-chapter-badge">正在阅读</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { ChapterData } from '../../types/reader'

const props = withDefaults(defineProps<{
  visible: boolean
  chapters: ChapterData[]
  currentChapterNo: number
  progressPercent: number
}>(), {
  visible: false,
  chapters: () => [],
  currentChapterNo: 1,
  progressPercent: 0,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', chapterNo: number): void
}>()

function onChapterClick(chapterNo: number): void {
  emit('select', chapterNo)
  emit('close')
}
</script>

<style scoped>
.nr-menu {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 200;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s;
}
.nr-menu-visible {
  pointer-events: auto;
  opacity: 1;
}

.nr-menu-mask {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.4);
}

.nr-menu-panel {
  position: absolute;
  left: 0; top: 0;
  width: 80%;
  max-width: 320px;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.nr-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 44px 16px 12px;
  border-bottom: 1px solid #eee;
}

.nr-menu-title {
  font-size: 18px;
  font-weight: bold;
}

.nr-menu-close {
  font-size: 20px;
  color: #999;
  padding: 4px;
}

.nr-menu-progress {
  padding: 8px 16px;
  background: #f8f8f8;
}
.nr-menu-progress-text {
  font-size: 12px;
  color: #C4A882;
}

.nr-menu-list {
  flex: 1;
  overflow-y: auto;
}

.nr-menu-chapter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}
.nr-menu-chapter:active {
  background: #f0f0f0;
}

.nr-menu-chapter-title {
  font-size: 14px;
  color: #333;
}
.nr-menu-chapter-current .nr-menu-chapter-title {
  color: #C4A882;
  font-weight: bold;
}
.nr-menu-chapter-read .nr-menu-chapter-title {
  color: #999;
}

.nr-menu-chapter-badge {
  font-size: 11px;
  color: #C4A882;
  background: #F9F5E8;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
