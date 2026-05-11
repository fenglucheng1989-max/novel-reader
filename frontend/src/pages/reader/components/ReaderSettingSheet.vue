<template>
  <view v-if="visible" class="setting-sheet-root">
    <view class="setting-backdrop" @tap.stop="emit('close')" />
    <view class="setting-sheet" @tap.stop>
      <view class="sheet-row">
        <text class="row-label">亮度</text>
        <view class="brightness-wrap">
          <text class="brightness-icon">&#x263D;</text>
          <slider
            class="brightness-slider"
            :min="20"
            :max="100"
            :value="brightness"
            activeColor="#3A3A3A"
            backgroundColor="#e0e0e0"
            block-size="18"
            @change="onBrightness"
          />
          <text class="brightness-icon">&#x2600;</text>
        </view>
      </view>

      <view class="sheet-row">
        <text class="row-label">字号</text>
        <view class="stepper">
          <view class="stepper-btn" @tap.stop="emit('update:setting', { fontSize: Math.max(14, setting.fontSize - 1) })">
            <text>A-</text>
          </view>
          <text class="stepper-value">{{ setting.fontSize }}</text>
          <view class="stepper-btn" @tap.stop="emit('update:setting', { fontSize: Math.min(30, setting.fontSize + 1) })">
            <text>A+</text>
          </view>
        </view>
      </view>

      <view class="sheet-row">
        <text class="row-label">行距</text>
        <view class="stepper">
          <view class="stepper-btn" @tap.stop="emit('update:setting', { lineHeight: Math.max(24, setting.lineHeight - 2) })">
            <text>-</text>
          </view>
          <text class="stepper-value">{{ setting.lineHeight }}</text>
          <view class="stepper-btn" @tap.stop="emit('update:setting', { lineHeight: Math.min(48, setting.lineHeight + 2) })">
            <text>+</text>
          </view>
        </view>
      </view>

      <view class="sheet-row">
        <text class="row-label">页距</text>
        <view class="stepper">
          <view class="stepper-btn" @tap.stop="emit('update:setting', { marginX: Math.max(12, setting.marginX - 2) })">
            <text>-</text>
          </view>
          <text class="stepper-value">{{ setting.marginX }}</text>
          <view class="stepper-btn" @tap.stop="emit('update:setting', { marginX: Math.min(48, setting.marginX + 2) })">
            <text>+</text>
          </view>
        </view>
      </view>

      <view class="sheet-row">
        <text class="row-label">段距</text>
        <view class="stepper">
          <view class="stepper-btn" @tap.stop="emit('update:setting', { paragraphSpacing: Math.max(0, setting.paragraphSpacing - 2) })">
            <text>-</text>
          </view>
          <text class="stepper-value">{{ setting.paragraphSpacing }}</text>
          <view class="stepper-btn" @tap.stop="emit('update:setting', { paragraphSpacing: Math.min(24, setting.paragraphSpacing + 2) })">
            <text>+</text>
          </view>
        </view>
      </view>

      <view class="sheet-row">
        <text class="row-label">护眼</text>
        <view class="auto-page-wrap">
          <switch
            :checked="eyeProtection"
            @change="$emit('update:eye-protection', $event.detail.value)"
            color="#C4A882"
          />
        </view>
      </view>

      <view class="sheet-row">
        <text class="row-label">翻页</text>
        <view class="segmented">
          <view
            v-for="opt in turnOptions"
            :key="opt.value"
            class="seg-item"
            :class="{ active: setting.turnMode === opt.value, disabled: opt.disabled }"
            @tap.stop="!opt.disabled && emit('update:setting', { turnMode: opt.value })"
          >
            <text>{{ opt.label }}</text>
          </view>
        </view>
      </view>

      <view class="sheet-row">
        <text class="row-label">评论弹幕</text>
        <view class="auto-page-wrap">
          <switch
            :checked="setting.showComments"
            @change="onCommentToggle"
            color="#3A3A3A"
          />
        </view>
      </view>

      <view class="sheet-row">
        <text class="row-label">主题</text>
        <view class="theme-chips">
          <view
            v-for="t in themes"
            :key="t.key"
            class="theme-chip"
            :class="{ active: setting.theme === t.key }"
            :style="{ backgroundColor: t.bg, borderColor: t.border }"
            @tap.stop="emit('update:setting', { theme: t.key })"
          >
            <text v-if="setting.theme === t.key" class="chip-check">&#x2713;</text>
          </view>
        </view>
      </view>

      <view class="sheet-row">
        <text class="row-label">自动翻页</text>
        <view class="auto-page-wrap">
          <switch
            :checked="setting.autoPageEnabled"
            @change="onAutoPageToggle"
            color="#3A3A3A"
          />
          <picker
            v-if="setting.autoPageEnabled"
            class="interval-select"
            mode="selector"
            :range="intervalLabels"
            :value="intervalIndex"
            @change="onIntervalChange"
          >
            <view class="interval-value">{{ intervalLabel }}</view>
          </picker>
        </view>
      </view>

      <view class="sheet-row more-row" @tap.stop="emit('more')">
        <text class="row-label">更多设置</text>
        <text class="more-arrow">&#x203A;</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  setting: { type: Object, required: true },
  brightness: { type: Number, default: 80 },
  eyeProtection: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'update:setting', 'update:brightness', 'update:eye-protection', 'more'])

const turnOptions = [
  { label: '覆盖', value: 'COVER' },
  { label: '上下', value: 'SCROLL' },
  { label: '仿真', value: 'PAGE' },
  { label: '无', value: 'NONE' }
]

const themes = [
  { key: 'DEFAULT', bg: '#F8F8F6', border: '#CCCCCC' },
  { key: 'PARCHMENT', bg: '#F5E6C8', border: '#C4A882' },
  { key: 'LIGHT_GREEN', bg: '#E8F0E3', border: '#A8C4A0' },
  { key: 'GRAY', bg: '#EBEBE7', border: '#B0B0B0' },
  { key: 'NIGHT', bg: '#161A1D', border: '#3A4045' }
]

const intervalOptions = [10, 15, 20, 30, 60]
const intervalLabels = intervalOptions.map((item) => `${item}s`)
const intervalIndex = computed(() => {
  const idx = intervalOptions.indexOf(Number(props.setting.autoPageInterval || 15))
  return idx >= 0 ? idx : 1
})
const intervalLabel = computed(() => intervalLabels[intervalIndex.value])

function onBrightness(e) {
  emit('update:brightness', Number(e.detail.value || 80))
}

function onAutoPageToggle(e) {
  emit('update:setting', { autoPageEnabled: e.detail.value || e.target?.checked || false })
}

function onIntervalChange(e) {
  const index = Number(e.detail.value || 0)
  emit('update:setting', { autoPageInterval: intervalOptions[index] || 15 })
}

function onCommentToggle(e) {
  emit('update:setting', { showComments: e.detail.value || e.target?.checked || false })
}
</script>

<style scoped>
.setting-sheet-root {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  z-index: 1000;
  overflow: hidden;
}

.setting-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}

.setting-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1001;
  max-height: min(78vh, 560px);
  max-height: min(78dvh, 560px);
  overflow-y: auto;
  padding: 16px 18px calc(18px + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  background: #fff;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.sheet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 5px 0;
}

.sheet-row + .sheet-row {
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.row-label {
  color: #333;
  font-size: 14px;
  white-space: nowrap;
  min-width: 64px;
}

.brightness-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 220px;
}

.brightness-icon {
  font-size: 16px;
  color: #999;
}

.brightness-slider {
  flex: 1;
  margin: 0 4px;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stepper-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 30px;
  border-radius: 6px;
  background: #F0F0ED;
  font-size: 13px;
  color: #3A3A3A;
}

.stepper-btn:active {
  background: #E0E0DD;
}

.stepper-value {
  font-size: 14px;
  color: #333;
  min-width: 28px;
  text-align: center;
}

.segmented {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.seg-item {
  padding: 6px 14px;
  font-size: 13px;
  color: #666;
  background: #f8f8f8;
}

.seg-item + .seg-item {
  border-left: 1px solid #e0e0e0;
}

.seg-item.active {
  background: #3A3A3A;
  color: #fff;
}

.seg-item.disabled {
  opacity: 0.35;
}

.theme-chips {
  display: flex;
  gap: 10px;
}

.theme-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid;
  transition: transform 0.15s;
}

.theme-chip.active {
  transform: scale(1.15);
  box-shadow: 0 0 0 2px #3A3A3A;
}

.chip-check {
  font-size: 16px;
  color: #333;
  font-weight: bold;
}

.auto-page-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.interval-select {
  min-width: 58px;
}

.interval-value {
  height: 30px;
  padding: 0 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  line-height: 30px;
  color: #333;
  text-align: center;
  background: #fff;
}

.more-row {
  cursor: pointer;
}

.more-arrow {
  font-size: 22px;
  color: #ccc;
}
</style>
