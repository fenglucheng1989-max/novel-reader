<template>
  <view
    class="nr-page"
    :class="{
      'nr-page-first': isFirst,
      'nr-page-empty': !html,
    }"
    :style="pageStyle"
  >
    <!-- 第一页显示章节标题 -->
    <view v-if="isFirst && title" class="nr-page-title">
      <text>{{ title }}</text>
    </view>

    <!-- 正文内容 -->
    <view
      ref="contentRef"
      class="nr-page-content"
      :style="contentStyle"
    >
      <rich-text v-if="html" :nodes="html" />
      <text v-else class="nr-page-placeholder">（暂无内容）</text>
    </view>

    <!-- 页脚 -->
    <view v-if="showFooter && bookTitle" class="nr-page-footer">
      <text class="nr-page-footer-left">{{ bookTitle }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  html?: string
  title?: string
  isFirst?: boolean
  bookTitle?: string
  pageLabel?: string
  showFooter?: boolean
  fontSize?: number
  lineHeight?: number
  fontFamily?: string
  textColor?: string
}>(), {
  html: '',
  title: '',
  isFirst: false,
  bookTitle: '',
  pageLabel: '',
  showFooter: true,
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "'Noto Serif SC','Source Han Serif SC',SimSun,STSong,serif",
  textColor: '#3D2B1F',
})

const pageStyle = computed(() => ({
  color: props.textColor,
}))

const contentStyle = computed(() => ({
  fontSize: `${props.fontSize}px`,
  lineHeight: props.lineHeight,
  fontFamily: props.fontFamily,
}))
</script>

<style scoped>
.nr-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}
.nr-page-first {
  padding-top: 0;
}
.nr-page-empty {
  justify-content: center;
  align-items: center;
}

.nr-page-title {
  text-align: center;
  padding: 24px 0 14px;
  font-size: 1.15em;
  font-weight: bold;
  line-height: 1.4;
}

.nr-page-content {
  flex: 1;
  overflow: hidden;
  text-align: justify;
  word-break: break-word;
  overflow-wrap: break-word;
}

.nr-page-placeholder {
  text-align: center;
  color: #999;
  margin-top: 40px;
}

.nr-page-footer {
  display: flex;
  justify-content: space-between;
  padding: 8px 0 4px;
  font-size: 12px;
  color: #B8A088;
}
</style>
