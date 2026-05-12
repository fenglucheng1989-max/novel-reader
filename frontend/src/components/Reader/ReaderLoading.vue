<template>
  <view class="nr-loading" :class="{ 'nr-loading-fullscreen': fullscreen }">
    <view class="nr-loading-spinner">
      <view class="nr-loading-dot" v-for="i in 3" :key="i" />
    </view>
    <text class="nr-loading-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  text?: string
  fullscreen?: boolean
}>(), {
  text: '加载中...',
  fullscreen: false,
})
</script>

<style scoped>
.nr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}
.nr-loading-fullscreen {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(255,255,255,0.8);
  z-index: 1000;
}
.nr-loading-spinner {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.nr-loading-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #C4A882;
  animation: nr-bounce 0.6s infinite alternate;
}
.nr-loading-dot:nth-child(2) { animation-delay: 0.2s; }
.nr-loading-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes nr-bounce {
  from { opacity: 0.3; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1.2); }
}
.nr-loading-text {
  font-size: 14px;
  color: #999;
}
</style>
