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
          <text class="stepper-value">{{ readerStore.setting.fontSize }}</text>
          <view class="stepper-btn" @tap="changeFont(1)">+</view>
        </view>
      </view>
      <view class="setting-row">
        <view class="setting-info">
          <text class="setting-name">行距</text>
          <text class="setting-desc">正文行间距离</text>
        </view>
        <view class="stepper">
          <view class="stepper-btn" @tap="changeLineHeight(-2)">-</view>
          <text class="stepper-value">{{ readerStore.setting.lineHeight }}</text>
          <view class="stepper-btn" @tap="changeLineHeight(2)">+</view>
        </view>
      </view>
      <view class="setting-row">
        <view class="setting-info">
          <text class="setting-name">页边距</text>
          <text class="setting-desc">文字左右边距</text>
        </view>
        <view class="stepper">
          <view class="stepper-btn" @tap="changeMargin(-2)">-</view>
          <text class="stepper-value">{{ readerStore.setting.marginX }}</text>
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
          <text class="stepper-value">{{ readerStore.setting.paragraphSpacing }}</text>
          <view class="stepper-btn" @tap="changeParaSpacing(2)">+</view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">背景与显示</text>
      <view class="theme-grid">
        <button v-for="t in themes" :key="t.key" :class="{ active: readerStore.setting.theme === t.key }" @tap="setTheme(t.key)">
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
          :value="brightness"
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
        <switch :checked="eyeProtection" @change="onEyeProtection" color="#C4A882" />
      </view>
    </view>

    <view class="section">
      <text class="section-title">翻页模式</text>
      <view class="turn-grid">
        <button
          v-for="opt in turnOptions"
          :key="opt.value"
          class="turn-btn"
          :class="{ active: readerStore.setting.turnMode === opt.value }"
          @tap="setTurnMode(opt.value)"
        >
          <text class="turn-icon">{{ opt.icon }}</text>
          <text class="turn-label">{{ opt.label }}</text>
          <text class="turn-desc">{{ opt.desc }}</text>
        </button>
      </view>
    </view>

    <view class="section">
      <text class="section-title">通用设置</text>
      <view class="setting-row" @tap="clearCache">
        <view class="setting-info">
          <text class="setting-name">清除缓存</text>
          <text class="setting-desc">释放本地存储空间</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useReaderStore } from '../../store/reader'
import { useUserStore } from '../../store/user'

const readerStore = useReaderStore()
const userStore = useUserStore()
const brightness = ref(Number(uni.getStorageSync('readerBrightness') || 80))
const eyeProtection = ref(Boolean(uni.getStorageSync('readerEyeProtection') || false))

const themes = [
  { key: 'DEFAULT', label: '米白', bg: '#F8F8F6', border: '#CCCCCC' },
  { key: 'PARCHMENT', label: '羊皮', bg: '#F5E6C8', border: '#C4A882' },
  { key: 'LIGHT_GREEN', label: '浅绿', bg: '#E8F0E3', border: '#A8C4A0' },
  { key: 'GRAY', label: '素灰', bg: '#EBEBE7', border: '#B0B0B0' },
  { key: 'NIGHT', label: '夜间', bg: '#161A1D', border: '#3A4045' }
]

const turnOptions = [
  { value: 'COVER', label: '覆盖', icon: '▤', desc: '页面平推覆盖' },
  { value: 'SCROLL', label: '上下', icon: '☰', desc: '垂直滚动阅读' },
  { value: 'PAGE', label: '仿真', icon: '▯', desc: '模拟翻书效果' },
  { value: 'NONE', label: '无', icon: '◻', desc: '无动画切换' }
]

function saveSetting(patch) {
  if (userStore.isLoggedIn) {
    readerStore.saveSetting(patch)
  } else {
    readerStore.updateLocalSetting(patch)
  }
}

function changeFont(delta) {
  saveSetting({ fontSize: Math.max(14, Math.min(30, readerStore.setting.fontSize + delta)) })
}

function changeLineHeight(delta) {
  saveSetting({ lineHeight: Math.max(24, Math.min(48, readerStore.setting.lineHeight + delta)) })
}

function changeMargin(delta) {
  saveSetting({ marginX: Math.max(12, Math.min(48, readerStore.setting.marginX + delta)) })
}

function changeParaSpacing(delta) {
  saveSetting({ paragraphSpacing: Math.max(0, Math.min(24, readerStore.setting.paragraphSpacing + delta)) })
}

function setTheme(key) {
  saveSetting({ theme: key })
}

function setTurnMode(val) {
  saveSetting({ turnMode: val })
}

function onBrightness(e) {
  brightness.value = Math.max(20, Math.min(100, Number(e.detail.value || 80)))
  uni.setStorageSync('readerBrightness', brightness.value)
}

function onEyeProtection(e) {
  eyeProtection.value = !!e.detail.value
  uni.setStorageSync('readerEyeProtection', eyeProtection.value)
}

function clearCache() {
  uni.showModal({
    title: '清除缓存',
    content: '确定要清除所有本地缓存吗？这不会影响书架和阅读进度。',
    success: (res) => {
      if (res.confirm) {
        const keys = uni.getStorageInfoSync().keys || []
        keys.filter(k => k.startsWith('chapter:v2:')).forEach(k => uni.removeStorageSync(k))
        uni.showToast({ title: '缓存已清除', icon: 'success' })
      }
    }
  })
}

function goBack() {
  uni.navigateBack()
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
  width: 28px;
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
