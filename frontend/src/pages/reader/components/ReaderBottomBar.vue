<template>
  <view v-if="visible" class="reader-bottom-bar" @tap.stop>
    <view class="progress-row">
      <view class="chapter-btn" :class="{ disabled: isFirstChapter }" @tap.stop="!isFirstChapter && $emit('prev')">上一章</view>
      <view class="progress-wrap">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }" />
        </view>
        <text class="progress-label">{{ pageIndicator }}</text>
      </view>
      <view class="chapter-btn" :class="{ disabled: isLastChapter }" @tap.stop="!isLastChapter && $emit('next')">下一章</view>
    </view>

    <view class="quick-row">
      <view class="quick-item" @tap.stop="$emit('catalog')">
        <text class="quick-icon">☰</text>
        <text class="quick-label">目录</text>
      </view>
      <view class="quick-item" @tap.stop="$emit('discuss')">
        <text class="quick-icon">✎</text>
        <text class="quick-label">讨论</text>
      </view>
      <view class="quick-item" :class="{ active: isNight }" @tap.stop="$emit('night')">
        <text class="quick-icon">◐</text>
        <text class="quick-label">夜间</text>
      </view>
      <view class="quick-item" @tap.stop="$emit('setting')">
        <text class="quick-icon">Aa</text>
        <text class="quick-label">设置</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: true },
  pageIndicator: { type: String, default: '' },
  progressPercent: { type: Number, default: 0 },
  isNight: { type: Boolean, default: false },
  isFirstChapter: { type: Boolean, default: false },
  isLastChapter: { type: Boolean, default: false }
})

defineEmits(['prev', 'next', 'catalog', 'discuss', 'night', 'setting'])
</script>

<style scoped>
.reader-bottom-bar {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  z-index: 20;
  width: min(100vw, 480px);
  padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  background: rgba(248, 248, 246, 0.96);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(12px);
}

.progress-row {
  display: grid;
  grid-template-columns: 64px 1fr 64px;
  align-items: center;
  gap: 10px;
}

.chapter-btn {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  background: rgba(0, 0, 0, 0.05);
  color: #5A5A5A;
  font-size: 13px;
}

.chapter-btn.disabled {
  opacity: 0.35;
}

.progress-wrap {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.progress-bar {
  height: 3px;
  overflow: hidden;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.08);
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  background: #8C7B62;
}

.progress-label {
  color: #999;
  text-align: center;
  font-size: 11px;
}

.quick-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 10px;
}

.quick-item {
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 10px;
  color: #5A5A5A;
}

.quick-item:active,
.quick-item.active {
  background: rgba(0, 0, 0, 0.06);
  color: #1F1F1F;
}

.quick-icon {
  font-size: 19px;
  line-height: 21px;
}

.quick-label {
  font-size: 11px;
}

@media (max-width: 480px) {
  .reader-bottom-bar {
    left: 0;
    width: 100vw;
    transform: none;
  }
}
</style>
