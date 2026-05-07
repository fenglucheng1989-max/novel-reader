<template>
  <view v-if="visible" class="reader-bottom-bar" @tap.stop>
    <view class="bottom-nav-row">
      <view class="nav-btn" @tap.stop="$emit('prev')">
        <text class="nav-text">上一章</text>
      </view>
      <view class="progress-wrap" @tap.stop>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }" />
        </view>
        <text class="progress-label">{{ pageIndicator }}</text>
      </view>
      <view class="nav-btn" @tap.stop="$emit('next')">
        <text class="nav-text">下一章</text>
      </view>
    </view>
    <view class="bottom-quick-row">
      <view class="quick-item" @tap.stop="$emit('catalog')">
        <text class="quick-icon">&#x2630;</text>
        <text class="quick-label">目录</text>
      </view>
      <view class="quick-item" @tap.stop="$emit('discuss')">
        <text class="quick-icon">&#x270E;</text>
        <text class="quick-label">讨论</text>
      </view>
      <view class="quick-item" :class="{ active: isNight }" @tap.stop="$emit('night')">
        <text class="quick-icon">&#x263E;</text>
        <text class="quick-label">夜间</text>
      </view>
      <view class="quick-item" @tap.stop="$emit('setting')">
        <text class="quick-icon">&#x2699;</text>
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
  chapterIndicator: { type: String, default: '' }
})

defineEmits(['prev', 'next', 'catalog', 'discuss', 'night', 'setting'])
</script>

<style scoped>
.reader-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 4px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 16px;
  background: rgba(47, 111, 94, 0.1);
}

.nav-btn:active {
  background: rgba(47, 111, 94, 0.2);
}

.nav-text {
  color: #2f6f5e;
  font-size: 13px;
}

.progress-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
}

.progress-bar {
  width: 100%;
  height: 3px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  background: #2f6f5e;
  transition: width 0.3s ease;
}

.progress-label {
  color: #999;
  font-size: 11px;
}

.bottom-quick-row {
  display: flex;
  justify-content: space-around;
  padding: 6px 16px 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px;
  border-radius: 8px;
}

.quick-item:active {
  background: rgba(0, 0, 0, 0.06);
}

.quick-icon {
  font-size: 18px;
  color: #555;
  line-height: 1;
}

.quick-label {
  font-size: 11px;
  color: #888;
}

.quick-item.active .quick-icon,
.quick-item.active .quick-label {
  color: #2f6f5e;
}
</style>
