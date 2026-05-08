<template>
  <view v-if="visible" class="reader-top-bar" @tap.stop>
    <view class="top-left" @tap.stop="$emit('back')">
      <text class="top-icon">&#x2190;</text>
    </view>
    <text class="top-title">{{ title }}</text>
    <view class="top-right">
      <view class="top-action" @tap.stop="$emit('bookshelf')">
        <text class="top-icon">+</text>
      </view>
      <view class="top-action" @tap.stop="$emit('setting')">
        <text class="top-icon">&#x2699;</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: true },
  title: { type: String, default: '' }
})

defineEmits(['back', 'bookshelf', 'setting'])
</script>

<style scoped>
.reader-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  padding-top: env(safe-area-inset-top);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  box-sizing: content-box;
}

.top-left,
.top-right {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 72px;
}

.top-right {
  justify-content: flex-end;
}

.top-title {
  flex: 1;
  min-width: 0;
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  color: #3A3A3A;
  font-size: 15px;
  font-weight: 500;
}

.top-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.top-action:active {
  background: rgba(0, 0, 0, 0.06);
}

.top-icon {
  font-size: 20px;
  color: #3A3A3A;
  line-height: 1;
}
</style>
