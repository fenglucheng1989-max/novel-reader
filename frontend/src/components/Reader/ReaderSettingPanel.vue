<template>
  <view class="nr-settings" :class="{ 'nr-settings-visible': visible }">
    <view class="nr-settings-mask" @click="$emit('close')" />

    <view class="nr-settings-sheet">
      <view class="nr-settings-handle" />

      <!-- 亮度 -->
      <view class="nr-settings-row">
        <text class="nr-settings-label">亮度</text>
        <view class="nr-settings-slider-row">
          <text class="nr-settings-icon">☀️</text>
          <slider
            class="nr-settings-slider"
            :min="10"
            :max="100"
            :value="brightness"
            active-color="#C4A882"
            block-size="18"
            @change="onBrightnessChange"
          />
          <text class="nr-settings-icon nr-settings-icon-bright">☀️</text>
        </view>
      </view>

      <!-- 字号 -->
      <view class="nr-settings-row">
        <text class="nr-settings-label">字号</text>
        <view class="nr-settings-stepper">
          <text class="nr-settings-step-btn" @click="$emit('font-decrease')">A-</text>
          <text class="nr-settings-step-value">{{ fontSize }}</text>
          <text class="nr-settings-step-btn" @click="$emit('font-increase')">A+</text>
        </view>
      </view>

      <!-- 字体 -->
      <view class="nr-settings-row">
        <text class="nr-settings-label">字体</text>
        <view class="nr-settings-options">
          <text
            v-for="f in fontOptions"
            :key="f.value"
            class="nr-settings-option"
            :class="{ active: fontFamily === f.value }"
            @click="$emit('font-change', f.value)"
          >{{ f.label }}</text>
        </view>
      </view>

      <!-- 行距 -->
      <view class="nr-settings-row">
        <text class="nr-settings-label">行距</text>
        <view class="nr-settings-stepper">
          <text class="nr-settings-step-btn" @click="$emit('lineheight-decrease')">−</text>
          <text class="nr-settings-step-value">{{ lineHeight.toFixed(1) }}</text>
          <text class="nr-settings-step-btn" @click="$emit('lineheight-increase')">+</text>
        </view>
      </view>

      <!-- 主题 -->
      <view class="nr-settings-row">
        <text class="nr-settings-label">主题</text>
        <view class="nr-settings-themes">
          <view
            v-for="t in themeOptions"
            :key="t.key"
            class="nr-settings-theme"
            :class="{ active: themeKey === t.key }"
            :style="{ backgroundColor: t.bg }"
            @click="$emit('theme-change', t.key)"
          >
            <text v-if="themeKey === t.key" class="nr-settings-theme-check">✓</text>
          </view>
        </view>
      </view>

      <!-- 翻页模式 -->
      <view class="nr-settings-row">
        <text class="nr-settings-label">翻页</text>
        <view class="nr-settings-options">
          <text
            v-for="m in turnModeOptions"
            :key="m.value"
            class="nr-settings-option"
            :class="{ active: turnMode === m.value }"
            @click="$emit('turnmode-change', m.value)"
          >{{ m.label }}</text>
        </view>
      </view>

      <!-- 阅读模式 -->
      <view class="nr-settings-row">
        <text class="nr-settings-label">模式</text>
        <view class="nr-settings-options">
          <text
            v-for="m in modeOptions"
            :key="m.value"
            class="nr-settings-option"
            :class="{ active: readerMode === m.value }"
            @click="$emit('mode-change', m.value)"
          >{{ m.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { ReaderMode, TurnMode } from '../../types/reader'

const props = withDefaults(defineProps<{
  visible: boolean
  brightness: number
  fontSize: number
  fontFamily: string
  lineHeight: number
  themeKey: string
  turnMode: TurnMode
  readerMode: ReaderMode
}>(), {
  visible: false,
  brightness: 80,
  fontSize: 18,
  fontFamily: 'SERIF',
  lineHeight: 1.8,
  themeKey: 'PARCHMENT',
  turnMode: 'COVER',
  readerMode: 'PAGINATION',
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'brightness-change', value: number): void
  (e: 'font-increase'): void
  (e: 'font-decrease'): void
  (e: 'font-change', value: string): void
  (e: 'lineheight-increase'): void
  (e: 'lineheight-decrease'): void
  (e: 'theme-change', value: string): void
  (e: 'turnmode-change', value: TurnMode): void
  (e: 'mode-change', value: ReaderMode): void
}>()

const fontOptions = [
  { label: '宋体', value: 'SERIF' },
  { label: '楷体', value: 'KAITI' },
  { label: '黑体', value: 'HEI' },
]

const themeOptions = [
  { key: 'DEFAULT', bg: '#FFFFFF' },
  { key: 'PARCHMENT', bg: '#F9F5E8' },
  { key: 'LIGHT_GREEN', bg: '#E8F0E3' },
  { key: 'LIGHT_BLUE', bg: '#E4ECF0' },
  { key: 'NIGHT', bg: '#161A1D' },
  { key: 'GRAY', bg: '#EBEBE7' },
]

const turnModeOptions = [
  { label: '无', value: 'NONE' },
  { label: '平移', value: 'SLIDE' },
  { label: '覆盖', value: 'COVER' },
]

const modeOptions = [
  { label: '分页', value: 'PAGINATION' },
  { label: '滚动', value: 'SCROLL' },
]

function onBrightnessChange(e: { detail?: { value: number } } | number): void {
  const value = typeof e === 'number' ? e : (e as { detail: { value: number } }).detail?.value ?? 80
  emit('brightness-change', value)
}
</script>

<style scoped>
.nr-settings {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 150;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s;
}
.nr-settings-visible {
  pointer-events: auto;
  opacity: 1;
}

.nr-settings-mask {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.3);
}

.nr-settings-sheet {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%;
  max-height: 75vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 12px 20px 34px;
  box-sizing: border-box;
  overflow-y: auto;
}

.nr-settings-handle {
  width: 36px; height: 4px;
  background: #ddd;
  border-radius: 2px;
  margin: 0 auto 16px;
}

.nr-settings-row {
  display: flex;
  align-items: center;
  min-height: 48px;
  border-bottom: 1px solid #f5f5f5;
  padding: 8px 0;
}
.nr-settings-row:last-child {
  border-bottom: none;
}

.nr-settings-label {
  width: 44px;
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
}

.nr-settings-slider-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nr-settings-slider {
  flex: 1;
}

.nr-settings-icon {
  font-size: 14px;
}
.nr-settings-icon-bright {
  font-size: 18px;
}

.nr-settings-stepper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.nr-settings-step-btn {
  font-size: 16px;
  color: #666;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.nr-settings-step-btn:active {
  background: #f5f5f5;
}

.nr-settings-step-value {
  font-size: 16px;
  min-width: 36px;
  text-align: center;
}

.nr-settings-options {
  flex: 1;
  display: flex;
  gap: 8px;
}

.nr-settings-option {
  font-size: 13px;
  color: #666;
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.nr-settings-option.active {
  color: #C4A882;
  border-color: #C4A882;
  background: #F9F5E8;
}

.nr-settings-themes {
  flex: 1;
  display: flex;
  gap: 10px;
}

.nr-settings-theme {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nr-settings-theme.active {
  border-color: #C4A882;
}

.nr-settings-theme-check {
  font-size: 14px;
  color: #C4A882;
}
</style>
