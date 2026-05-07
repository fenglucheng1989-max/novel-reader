<template>
  <view class="book-cover" :class="`cover-${size}`" :style="coverStyle">
    <text class="cover-text">{{ displayTitle }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '书' },
  size: { type: String, default: 'md' }
})

const displayTitle = computed(() => (props.title || '书').slice(0, 2))
const coverStyle = computed(() => ({
  background: `linear-gradient(145deg, ${hue()} 0%, ${hue(true)} 100%)`
}))

let _hue = 0
function hue(dark) {
  if (!_hue) _hue = (props.title || '书').charCodeAt(0) % 36 * 10
  const h = _hue
  return dark ? `hsl(${h}, 35%, 38%)` : `hsl(${h}, 28%, 52%)`
}
</script>

<style scoped>
.book-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  box-shadow: 0 10px 22px rgba(31, 42, 38, 0.12);
  box-sizing: border-box;
  overflow: hidden;
}

.cover-sm { width: 48px; height: 64px; }
.cover-sm .cover-text { font-size: 15px; }

.cover-md { width: 58px; height: 78px; }
.cover-md .cover-text { font-size: 17px; }

.cover-lg { width: 96px; height: 128px; }
.cover-lg .cover-text { font-size: 26px; }

.cover-xl { width: 100%; height: 142px; }
.cover-xl .cover-text { font-size: 26px; }

.cover-text {
  color: #fff;
  font-weight: 900;
}
</style>
