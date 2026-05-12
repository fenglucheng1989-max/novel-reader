<template>
  <view class="nr-toolbar" :class="{ 'nr-toolbar-visible': visible }">
    <!-- 背景遮罩 -->
    <view class="nr-toolbar-mask" @click="$emit('close')" />

    <!-- 顶栏 -->
    <view class="nr-toolbar-top">
      <view class="nr-toolbar-row">
        <text class="nr-toolbar-btn" @click="$emit('back')">&lt; 返回</text>
        <text class="nr-toolbar-btn" @click="$emit('add-shelf')">加入书架</text>
        <text class="nr-toolbar-btn" @click="$emit('download')">下载</text>
        <text class="nr-toolbar-btn" @click="$emit('share')">分享</text>
        <text class="nr-toolbar-btn nr-toolbar-btn-more" @click="$emit('more')">⋯</text>
      </view>
    </view>

    <!-- 底栏 -->
    <view class="nr-toolbar-bottom">
      <!-- 进度行 -->
      <view class="nr-toolbar-progress-row">
        <text class="nr-toolbar-nav" @click="$emit('prev-chapter')">上一章</text>
        <view class="nr-toolbar-progress">
          <text class="nr-toolbar-page-label">
            {{ currentPage + 1 }} / {{ totalPages || 1 }}
          </text>
          <view
            ref="progressTrackRef"
            class="nr-toolbar-track"
            @click="onProgressTap"
          >
            <view
              class="nr-toolbar-fill"
              :style="{ width: progressPercent + '%' }"
            />
          </view>
        </view>
        <text class="nr-toolbar-nav" @click="$emit('next-chapter')">下一章</text>
      </view>

      <!-- 操作行 -->
      <view class="nr-toolbar-actions">
        <view class="nr-toolbar-action" @click="$emit('open-catalog')">
          <text class="nr-toolbar-action-icon">📖</text>
          <text class="nr-toolbar-action-label">目录</text>
        </view>
        <view class="nr-toolbar-action" @click="$emit('toggle-night')">
          <text class="nr-toolbar-action-icon">{{ isNight ? '☀️' : '🌙' }}</text>
          <text class="nr-toolbar-action-label">{{ isNight ? '日间' : '夜间' }}</text>
        </view>
        <view class="nr-toolbar-action" @click="$emit('open-settings')">
          <text class="nr-toolbar-action-icon">⚙️</text>
          <text class="nr-toolbar-action-label">设置</text>
        </view>
        <view class="nr-toolbar-action" @click="$emit('open-comments')">
          <text class="nr-toolbar-action-icon">💬</text>
          <text class="nr-toolbar-action-label">段评</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  visible: boolean
  currentPage: number
  totalPages: number
  isNight: boolean
}>(), {
  visible: false,
  currentPage: 0,
  totalPages: 1,
  isNight: false,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'back'): void
  (e: 'add-shelf'): void
  (e: 'download'): void
  (e: 'share'): void
  (e: 'more'): void
  (e: 'prev-chapter'): void
  (e: 'next-chapter'): void
  (e: 'open-catalog'): void
  (e: 'toggle-night'): void
  (e: 'open-settings'): void
  (e: 'open-comments'): void
  (e: 'progress-seek', pageIndex: number): void
}>()

const progressTrackRef = ref<HTMLElement | null>(null)

const progressPercent = computed(() => {
  if (props.totalPages <= 1) return 0
  return (props.currentPage / (props.totalPages - 1)) * 100
})

function onProgressTap(e: { clientX: number } | MouseEvent): void {
  const track = progressTrackRef.value
  if (!track) return
  const rect = track.getBoundingClientRect()
  const x = 'clientX' in e ? e.clientX : 0
  const ratio = Math.max(0, Math.min(1, (x - rect.left) / rect.width))
  const pageIndex = Math.round(ratio * (props.totalPages - 1))
  emit('progress-seek', pageIndex)
}
</script>

<style scoped>
.nr-toolbar {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 100;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s;
}
.nr-toolbar-visible {
  pointer-events: auto;
  opacity: 1;
}

.nr-toolbar-mask {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.3);
}

.nr-toolbar-top {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), transparent);
  padding: 44px 16px 12px;
  box-sizing: border-box;
}
.nr-toolbar-row {
  display: flex;
  gap: 16px;
}
.nr-toolbar-btn {
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
}
.nr-toolbar-btn-more {
  margin-left: auto;
}

.nr-toolbar-bottom {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%;
  background: linear-gradient(to top, rgba(0,0,0,0.3), transparent);
  padding: 12px 16px 34px;
  box-sizing: border-box;
}

.nr-toolbar-progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.nr-toolbar-nav {
  color: #fff;
  font-size: 13px;
  white-space: nowrap;
}
.nr-toolbar-progress {
  flex: 1;
}
.nr-toolbar-page-label {
  color: #fff;
  font-size: 12px;
  text-align: center;
  display: block;
  margin-bottom: 6px;
}
.nr-toolbar-track {
  width: 100%;
  height: 3px;
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
  position: relative;
}
.nr-toolbar-fill {
  height: 100%;
  background: #fff;
  border-radius: 2px;
  transition: width 0.1s;
}

.nr-toolbar-actions {
  display: flex;
  justify-content: space-around;
}
.nr-toolbar-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.nr-toolbar-action-icon {
  font-size: 22px;
}
.nr-toolbar-action-label {
  color: #fff;
  font-size: 12px;
}
</style>
