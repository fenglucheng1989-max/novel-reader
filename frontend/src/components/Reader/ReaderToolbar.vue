<template>
  <view
    class="nr-toolbar"
    :class="{ 'nr-toolbar-visible': visible }"
    @click="$emit('close')"
    @touchstart="onTouchStart"
    @touchmove.prevent="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- 顶栏 -->
    <view class="nr-top" @click.stop>
      <view class="nr-top-left">
        <text class="nr-top-back" @click="$emit('back')">‹</text>
        <text class="nr-top-title">{{ bookTitle }}</text>
      </view>
      <view class="nr-top-right">
        <view class="nr-action" :class="{ 'nr-action-active': isInShelf }" @click="$emit('toggle-shelf')">
          <text class="nr-action-icon">{{ isInShelf ? '✓' : '+' }}</text>
          <text class="nr-action-label">{{ isInShelf ? '已加入' : '书架' }}</text>
        </view>
        <view class="nr-action" :class="{ 'nr-action-active': isFavorited }" @click="$emit('toggle-favorite')">
          <text class="nr-action-icon">{{ isFavorited ? '★' : '☆' }}</text>
          <text class="nr-action-label">{{ isFavorited ? '已收藏' : '收藏' }}</text>
        </view>
        <view class="nr-action" @click="$emit('more')">
          <text class="nr-action-icon">⋮</text>
          <text class="nr-action-label">更多</text>
        </view>
      </view>
    </view>

    <!-- 底栏 -->
    <view class="nr-bottom" @click.stop>
      <!-- 进度条 -->
      <view class="nr-progress">
        <text class="nr-progress-chapter" @click="$emit('prev-chapter')">上一章</text>
        <view class="nr-progress-center">
          <text class="nr-progress-page">{{ currentPage + 1 }} / {{ totalPages || 1 }}</text>
          <view ref="progressTrackRef" class="nr-progress-track" @click="onProgressTap">
            <view class="nr-progress-fill" :style="{ width: progressPercent + '%' }" />
          </view>
        </view>
        <text class="nr-progress-chapter" @click="$emit('next-chapter')">下一章</text>
      </view>

      <!-- 操作图标 -->
      <view class="nr-actions">
        <view class="nr-action" @click="$emit('open-catalog')">
          <text class="nr-action-icon">☰</text>
          <text class="nr-action-label">目录</text>
        </view>
        <view class="nr-action" @click="$emit('toggle-night')">
          <text class="nr-action-icon">{{ isNight ? '☀' : '☽' }}</text>
          <text class="nr-action-label">{{ isNight ? '日间' : '夜间' }}</text>
        </view>
        <view class="nr-action" @click="$emit('open-settings')">
          <text class="nr-action-icon">&#9901;</text>
          <text class="nr-action-label">设置</text>
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
  bookTitle: string
  isInShelf?: boolean
  isFavorited?: boolean
}>(), {
  visible: false,
  currentPage: 0,
  totalPages: 1,
  isNight: false,
  bookTitle: '',
  isInShelf: false,
  isFavorited: false,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'back'): void
  (e: 'toggle-shelf'): void
  (e: 'toggle-favorite'): void
  (e: 'download'): void
  (e: 'more'): void
  (e: 'prev-chapter'): void
  (e: 'next-chapter'): void
  (e: 'open-catalog'): void
  (e: 'toggle-night'): void
  (e: 'open-settings'): void
  (e: 'progress-seek', pageIndex: number): void
  (e: 'swipe-left'): void
  (e: 'swipe-right'): void
}>()

const progressTrackRef = ref<HTMLElement | null>(null)

const progressPercent = computed(() => {
  if (props.totalPages <= 1) return 0
  return (props.currentPage / (props.totalPages - 1)) * 100
})

// 手势检测（用于滑动翻页）
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0

function onTouchStart(e: TouchEvent): void {
  const touch = e.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  touchStartTime = Date.now()
}

function onTouchMove(_e: TouchEvent): void {
  // prevent default scroll only
}

function onTouchEnd(e: TouchEvent): void {
  const touch = e.changedTouches[0]
  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY
  const elapsed = Date.now() - touchStartTime

  // 水平滑动超过阈值 → 翻页
  if (Math.abs(dx) > 50 || (elapsed > 0 && Math.abs(dx) / elapsed > 0.3)) {
    emit('close')
    if (dx < 0) emit('swipe-left')
    else emit('swipe-right')
    return
  }

  // 垂直滑动 → 收起
  if (Math.abs(dy) > 30) {
    emit('close')
    return
  }

  // 小幅度移动 → 判断为点击 → 由 @click 处理
}

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
}

.nr-toolbar-visible {
  pointer-events: auto;
}

/* ===== 顶栏 ===== */
.nr-top {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 52px;
  padding: env(safe-area-inset-top, 0) 16px 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(249, 245, 232, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
  transform: translateY(-100%);
  transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
}

.nr-toolbar-visible .nr-top {
  transform: translateY(0);
}

.nr-top-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nr-top-back {
  font-size: 26px;
  color: #8B7355;
  line-height: 1;
  font-weight: 300;
}

.nr-top-title {
  font-size: 14px;
  color: #4A3728;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nr-top-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ===== 底栏 ===== */
.nr-bottom {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%;
  padding: 0 16px calc(env(safe-area-inset-bottom, 2px) + 2px);
  box-sizing: border-box;
  background: rgba(249, 245, 232, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 -1px 0 rgba(0, 0, 0, 0.06);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
}

.nr-toolbar-visible .nr-bottom {
  transform: translateY(0);
}

/* 进度 */
.nr-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0 2px;
}

.nr-progress-chapter {
  font-size: 11px;
  color: #8B7355;
  white-space: nowrap;
  min-width: 38px;
  text-align: center;
}

.nr-progress-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.nr-progress-page {
  font-size: 10px;
  color: #B8A088;
}

.nr-progress-track {
  width: 100%;
  height: 1.5px;
  background: rgba(139, 115, 85, 0.12);
  border-radius: 1px;
}

.nr-progress-fill {
  height: 100%;
  background: #8B7355;
  border-radius: 1px;
  transition: width 0.15s ease;
}

/* 操作区（顶栏 + 底栏共用） */
.nr-actions {
  display: flex;
  justify-content: space-around;
  padding: 2px 0 2px;
}

.nr-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 2px 12px;
}

.nr-action-icon {
  font-size: 15px;
  color: #6B5E53;
  line-height: 1;
}

.nr-action-active .nr-action-icon {
  color: #C8965E;
}

.nr-action-active .nr-action-label {
  color: #C8965E;
}

.nr-action-label {
  font-size: 10px;
  color: #A09080;
}
</style>
