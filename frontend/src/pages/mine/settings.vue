<template>
  <view class="page">
    <view class="topbar">
      <text class="back" @tap="goBack">‹ 返回</text>
      <text class="title">阅读设置</text>
      <text class="spacer" />
    </view>

    <view class="section">
      <text class="section-title">阅读设置</text>
      <view class="setting-row">
        <view class="setting-info">
          <text class="setting-name">字号</text>
          <text class="setting-desc">正文文字大小</text>
        </view>
        <view class="stepper">
          <view class="stepper-btn" @tap="changeFont(-1)">-</view>
          <text class="stepper-value">{{ readerStore.settings.fontSize }}</text>
          <view class="stepper-btn" @tap="changeFont(1)">+</view>
        </view>
      </view>
      <view class="setting-row">
        <view class="setting-info">
          <text class="setting-name">行距</text>
          <text class="setting-desc">正文行间距离</text>
        </view>
        <view class="stepper">
          <view class="stepper-btn" @tap="changeLineHeight(-0.1)">-</view>
          <text class="stepper-value">{{ readerStore.settings.lineHeight.toFixed(1) }}</text>
          <view class="stepper-btn" @tap="changeLineHeight(0.1)">+</view>
        </view>
      </view>
      <view class="setting-row">
        <view class="setting-info">
          <text class="setting-name">页边距</text>
          <text class="setting-desc">文字左右边距</text>
        </view>
        <view class="stepper">
          <view class="stepper-btn" @tap="changeMargin(-2)">-</view>
          <text class="stepper-value">{{ readerStore.settings.marginHorizontal }}</text>
          <view class="stepper-btn" @tap="changeMargin(2)">+</view>
        </view>
      </view>
      <view class="setting-row">
        <view class="setting-info">
          <text class="setting-name">段间距</text>
          <text class="setting-desc">段落之间距离</text>
        </view>
        <view class="stepper">
          <view class="stepper-btn" @tap="changeParaSpacing(-2)">-</view>
          <text class="stepper-value">{{ readerStore.settings.paragraphSpacing }}</text>
          <view class="stepper-btn" @tap="changeParaSpacing(2)">+</view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">背景与显示</text>
      <view class="theme-grid">
        <button v-for="t in themes" :key="t.key" :class="{ active: currentThemeKey === t.key }" @tap="setTheme(t.key)">
          <view class="theme-dot" :style="{ background: t.bg, border: '1px solid ' + t.border }" />
          <text>{{ t.label }}</text>
        </button>
      </view>
      <view class="setting-row">
        <view class="setting-info">
          <text class="setting-name">亮度</text>
          <text class="setting-desc">调整屏幕亮度</text>
        </view>
        <slider
          class="brightness-slider"
          :min="20"
          :max="100"
          :value="readerStore.settings.brightness"
          activeColor="#3A3A3A"
          backgroundColor="#e0e0e0"
          block-size="16"
          @change="onBrightness"
        />
      </view>
      <view class="setting-row">
        <view class="setting-info">
          <text class="setting-name">护眼模式</text>
          <text class="setting-desc">降低蓝光，保护眼睛</text>
        </view>
        <switch :checked="readerStore.settings.eyeProtection" @change="onEyeProtection" color="#C4A882" />
      </view>
    </view>

    <view class="section">
      <text class="section-title">翻页模式</text>
      <view class="turn-grid">
        <button
          v-for="opt in turnOptions"
          :key="opt.value"
          class="turn-btn"
          :class="{ active: readerStore.settings.turnMode === opt.value }"
          @tap="setTurnMode(opt.value)"
        >
          <text class="turn-icon">{{ opt.icon }}</text>
          <text class="turn-label">{{ opt.label }}</text>
          <text class="turn-desc">{{ opt.desc }}</text>
        </button>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useReaderStore } from '../../store/reader'
import type { TurnMode } from '../../types/reader'

interface ThemeOption {
  key: string
  label: string
  bg: string
  border: string
  backgroundColor: string
  textColor: string
}

interface TurnOption {
  value: TurnMode
  label: string
  icon: string
  desc: string
}

const readerStore = useReaderStore()

const themes: ThemeOption[] = [
  { key: 'DEFAULT', label: '米白', bg: '#F8F8F6', border: '#CCCCCC', backgroundColor: '#F9F5E8', textColor: '#3D2B1F' },
  { key: 'PARCHMENT', label: '羊皮', bg: '#F5E6C8', border: '#C4A882', backgroundColor: '#F5E6C8', textColor: '#3D2B1F' },
  { key: 'LIGHT_GREEN', label: '浅绿', bg: '#E8F0E3', border: '#A8C4A0', backgroundColor: '#E8F0E3', textColor: '#3D2B1F' },
  { key: 'GRAY', label: '素灰', bg: '#EBEBE7', border: '#B0B0B0', backgroundColor: '#EBEBE7', textColor: '#3D2B1F' },
  { key: 'NIGHT', label: '夜间', bg: '#161A1D', border: '#3A4045', backgroundColor: '#161A1D', textColor: '#D8D1C7' },
]

const turnOptions: TurnOption[] = [
  { value: 'COVER', label: '覆盖', icon: '▤', desc: '页面平推覆盖' },
  { value: 'SCROLL', label: '上下', icon: '☰', desc: '垂直滚动阅读' },
  { value: 'NONE', label: '无', icon: '◻', desc: '无动画切换' },
]

const currentThemeKey = computed(() => {
  if (readerStore.settings.nightMode) return 'NIGHT'
  const bg = readerStore.settings.backgroundColor
  const found = themes.find(t => t.backgroundColor === bg)
  return found ? found.key : 'DEFAULT'
})

function changeFont(delta: number): void {
  readerStore.updateSettings({ fontSize: Math.max(14, Math.min(36, readerStore.settings.fontSize + delta)) })
}

function changeLineHeight(delta: number): void {
  readerStore.updateTypography({ lineHeight: delta })
}

function changeMargin(delta: number): void {
  const next = Math.max(8, Math.min(48, readerStore.settings.marginHorizontal + delta))
  readerStore.updateSettings({ marginHorizontal: next })
}

function changeParaSpacing(delta: number): void {
  readerStore.updateTypography({ paragraphSpacing: delta })
}

function setTheme(key: string): void {
  const theme = themes.find(t => t.key === key)
  if (!theme) return
  if (key === 'NIGHT') {
    readerStore.updateSettings({ nightMode: true, backgroundColor: theme.backgroundColor, textColor: theme.textColor })
  } else {
    readerStore.updateSettings({ nightMode: false, backgroundColor: theme.backgroundColor, textColor: theme.textColor })
  }
}

function setTurnMode(val: TurnMode): void {
  readerStore.setTurnMode(val)
}

function onBrightness(e: { detail: { value: number } }): void {
  readerStore.updateSettings({ brightness: Math.max(20, Math.min(100, Number(e.detail.value || 80))) })
}

function onEyeProtection(e: { detail: { value: boolean } }): void {
  readerStore.updateSettings({ eyeProtection: !!e.detail.value })
}

function goBack(): void {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/mine/mine' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 0 16px 40px;
  background: #F8F8F6;
  box-sizing: border-box;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 4px;
}

.back {
  color: #3A3A3A;
  font-size: 17px;
  min-width: 64px;
}

.title {
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 800;
}

.spacer {
  min-width: 64px;
}

.section {
  margin-top: 18px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}

.section-title {
  display: block;
  margin-bottom: 10px;
  color: #8C8C8C;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
}

.setting-row + .setting-row {
  border-top: 1px solid #EBEBE5;
}

.setting-info {
  min-width: 0;
  flex: 1;
}

.setting-name {
  display: block;
  color: #1F1F1F;
  font-size: 15px;
  font-weight: 700;
}

.setting-desc {
  display: block;
  margin-top: 3px;
  color: #8C8C8C;
  font-size: 12px;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.stepper-btn {
  width: 32px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: #F0F0ED;
  color: #3A3A3A;
  font-size: 15px;
}

.stepper-btn:active {
  background: #E0E0DD;
}

.stepper-value {
  width: 40px;
  color: #1F1F1F;
  font-size: 14px;
  text-align: center;
}

.brightness-slider {
  flex: 1;
  max-width: 140px;
  margin-left: 12px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 6px;
}

.theme-grid button {
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 10px;
  background: #F5F5F2;
  color: #5A5A5A;
  font-size: 11px;
}

.theme-grid button.active {
  background: #3A3A3A;
  color: #fff;
}

.theme-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.turn-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.turn-btn {
  height: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 10px;
  background: #F5F5F2;
  padding: 0;
  color: #5A5A5A;
}

.turn-btn.active {
  background: #3A3A3A;
  color: #fff;
}

.turn-icon {
  font-size: 20px;
  line-height: 22px;
}

.turn-label {
  font-size: 14px;
  font-weight: 700;
}

.turn-desc {
  font-size: 10px;
  opacity: 0.7;
}

.arrow {
  color: #A09080;
  font-size: 24px;
}
</style>
