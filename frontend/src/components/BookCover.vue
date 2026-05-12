<template>
  <view class="book-cover" :class="`cover-${size}`" :style="coverStyle">
    <text v-if="!coverUrl" class="cover-text">{{ displayTitle }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type CoverSize = 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(defineProps<{
  title?: string
  coverUrl?: string
  size?: CoverSize
}>(), {
  title: '书',
  coverUrl: '',
  size: 'md',
})

const displayTitle = computed(() => (props.title || '书').slice(0, 2))

const coverStyle = computed(() => ({
  background: props.coverUrl
    ? `center / cover no-repeat url("${props.coverUrl}")`
    : `linear-gradient(145deg, ${hue()} 0%, ${hue(true)} 100%)`,
}))

const TITLE_BASE_CHARCODE = 0
const HUE_SEGMENTS = 24
const HUE_STEP = 15

let cachedHue = 0
function hue(dark?: boolean): string {
  if (!cachedHue) {
    cachedHue = ((props.title || '书').charCodeAt(TITLE_BASE_CHARCODE) % HUE_SEGMENTS) * HUE_STEP
  }
  return dark
    ? `hsl(${cachedHue}, 20%, 38%)`
    : `hsl(${cachedHue}, 18%, 62%)`
}
</script>

<style scoped>
.book-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 7px;
  background: #D0D0CC;
  box-shadow: 0 4px 14px rgba(0,0,0,0.08);
  box-sizing: border-box;
}

.cover-sm { width: 42px; height: 58px; }
.cover-md { width: 54px; height: 74px; }
.cover-lg { width: 86px; height: 118px; }
.cover-xl { width: 100%; height: 132px; }

.cover-sm .cover-text { font-size: 14px; }
.cover-md .cover-text { font-size: 16px; }
.cover-lg .cover-text { font-size: 24px; }
.cover-xl .cover-text { font-size: 24px; }

.cover-text {
  color: #fff;
  font-weight: 900;
}
</style>
