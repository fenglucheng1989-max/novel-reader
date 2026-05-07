<template>
  <view v-if="visible" class="setting-sheet-root">
    <view class="setting-backdrop" @tap.stop="emit('close')" />
    <view class="setting-sheet" @tap.stop>
      <!-- Brightness -->
      <view class="sheet-row">
        <text class="row-label">亮度</text>
        <view class="brightness-wrap">
          <text class="brightness-icon">&#x263D;</text>
          <slider
            class="brightness-slider"
            :min="20"
            :max="100"
            :value="brightness"
            activeColor="#2f6f5e"
            backgroundColor="#e0e0e0"
            block-size="18"
            @change="onBrightness"
          />
          <text class="brightness-icon">&#x2600;</text>
        </view>
      </view>

      <!-- Font size -->
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

      <!-- Line height -->
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

      <!-- Turn mode -->
      <view class="sheet-row">
        <text class="row-label">翻页</text>
        <view class="segmented">
          <view
            v-for="opt in turnOptions"
            :key="opt.value"
            class="seg-item"
            :class="{ active: setting.turnMode === opt.value }"
            @tap.stop="emit('update:setting', { turnMode: opt.value })"
          >
            <text>{{ opt.label }}</text>
          </view>
        </view>
      </view>

      <!-- Theme -->
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

      <!-- Auto page -->
      <view class="sheet-row">
        <text class="row-label">自动翻页</text>
        <view class="auto-page-wrap">
          <switch
            :checked="setting.autoPageEnabled"
            @change="onAutoPageToggle"
            color="#2f6f5e"
          />
          <select
            v-if="setting.autoPageEnabled"
            class="interval-select"
            :value="setting.autoPageInterval"
            @change="onIntervalChange"
          >
            <option v-for="o in intervalOptions" :key="o" :value="o">{{ o }}s</option>
          </select>
        </view>
      </view>

      <!-- More settings -->
      <view class="sheet-row more-row" @tap.stop="emit('more')">
        <text class="row-label">更多设置</text>
        <text class="more-arrow">&#x203A;</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  visible: { type: Boolean, default: false },
  setting: { type: Object, required: true },
  brightness: { type: Number, default: 80 }
})

const emit = defineEmits(['close', 'update:setting', 'update:brightness', 'more'])

const turnOptions = [
  { label: '滚动', value: 'SCROLL' },
  { label: 'Canvas', value: 'PAGE' }
]

const themes = [
  { key: 'DEFAULT', bg: '#F6F0E6', border: '#D4C8B0' },
  { key: 'GREEN', bg: '#EAF3E8', border: '#B8CFB4' },
  { key: 'NIGHT', bg: '#161A1D', border: '#3A4045' }
]

const intervalOptions = [10, 15, 20, 30, 60]

function onBrightness(e) {
  emit('update:brightness', Number(e.detail.value || 80))
}

function onAutoPageToggle(e) {
  emit('update:setting', { autoPageEnabled: e.detail.value || e.target?.checked || false })
}

function onIntervalChange(e) {
  emit('update:setting', { autoPageInterval: Number(e.detail.value || e.target?.value || 15) })
}
</script>

<style scoped>
.setting-sheet-root {
  position: fixed;
  inset: 0;
  z-index: 20;
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
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  background: #fff;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
}

.sheet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 6px 0;
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
  background: #f1e7dc;
  font-size: 13px;
  color: #3f4a45;
}

.stepper-btn:active {
  background: #e0d5c8;
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
  background: #2f6f5e;
  color: #fff;
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
  box-shadow: 0 0 0 2px #2f6f5e;
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
  height: 30px;
  padding: 0 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
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
