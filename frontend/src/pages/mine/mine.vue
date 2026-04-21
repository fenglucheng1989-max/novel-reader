<template>
  <view class="page">
    <view class="profile-card">
      <view class="avatar">{{ avatarText }}</view>
      <view class="profile-main">
        <text class="name">{{ userStore.isLoggedIn ? userStore.username : '未登录' }}</text>
        <text class="subtitle">{{ userStore.isLoggedIn ? '阅读偏好已为你保存' : '登录后同步书架、进度和偏好' }}</text>
      </view>
    </view>

    <view v-if="!userStore.isLoggedIn" class="login-card">
      <view class="segment">
        <button :class="{ active: mode === 'login' }" @tap="mode = 'login'">登录</button>
        <button :class="{ active: mode === 'register' }" @tap="mode = 'register'">注册</button>
      </view>
      <input v-model="username" class="input" placeholder="用户名" />
      <input v-model="password" class="input" password placeholder="密码" />
      <input v-if="mode === 'register'" v-model="email" class="input" placeholder="邮箱，可选" />
      <button class="primary" @tap="submit">{{ mode === 'login' ? '登录悦读' : '创建账号' }}</button>
      <text class="login-tip">本地测试账号可以直接注册，也可以使用已创建的账号登录。</text>
    </view>

    <view v-else>
      <view class="section-card">
        <view class="section-head">
          <text class="section-title">阅读偏好</text>
          <text class="section-note">{{ themeLabel }}</text>
        </view>

        <view class="setting-row">
          <view>
            <text class="setting-title">字号</text>
            <text class="setting-subtitle">影响正文显示大小</text>
          </view>
          <view class="stepper">
            <button @tap="changeFont(-1)">-</button>
            <text>{{ readerStore.setting.fontSize }}</text>
            <button @tap="changeFont(1)">+</button>
          </view>
        </view>

        <view class="setting-row">
          <view>
            <text class="setting-title">行距</text>
            <text class="setting-subtitle">长文阅读更舒展</text>
          </view>
          <view class="stepper">
            <button @tap="changeLineHeight(-2)">-</button>
            <text>{{ readerStore.setting.lineHeight }}</text>
            <button @tap="changeLineHeight(2)">+</button>
          </view>
        </view>

        <view class="theme-row">
          <button :class="{ active: readerStore.setting.theme === 'DEFAULT' }" @tap="setTheme('DEFAULT')">米白</button>
          <button :class="{ active: readerStore.setting.theme === 'GREEN' }" @tap="setTheme('GREEN')">清绿</button>
          <button :class="{ active: readerStore.setting.theme === 'NIGHT' }" @tap="setTheme('NIGHT')">夜间</button>
        </view>
      </view>

      <view class="quick-card" @tap="goShelf">
        <view>
          <text class="quick-title">我的书架</text>
          <text class="quick-subtitle">继续上次的阅读</text>
        </view>
        <text class="quick-arrow">›</text>
      </view>

      <button class="logout" @tap="logout">退出登录</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'
import { useReaderStore } from '../../store/reader'

const userStore = useUserStore()
const readerStore = useReaderStore()
const mode = ref('login')
const username = ref('')
const password = ref('')
const email = ref('')

const avatarText = computed(() => (userStore.isLoggedIn ? userStore.username.slice(0, 1).toUpperCase() : '读'))
const themeLabel = computed(() => {
  if (readerStore.setting.theme === 'GREEN') return '清绿'
  if (readerStore.setting.theme === 'NIGHT') return '夜间'
  return '米白'
})

async function submit() {
  if (!username.value || !password.value) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  if (mode.value === 'login') {
    await userStore.login(username.value, password.value)
  } else {
    await userStore.register(username.value, password.value, email.value)
  }
  await readerStore.loadSetting()
  uni.showToast({ title: '已登录', icon: 'success' })
}

function logout() {
  userStore.logout()
  uni.showToast({ title: '已退出', icon: 'none' })
}

function goShelf() {
  uni.switchTab({ url: '/pages/bookshelf/bookshelf' })
}

function changeFont(delta) {
  const next = Math.max(14, Math.min(30, readerStore.setting.fontSize + delta))
  readerStore.saveSetting({ fontSize: next })
}

function changeLineHeight(delta) {
  const next = Math.max(24, Math.min(48, readerStore.setting.lineHeight + delta))
  readerStore.saveSetting({ lineHeight: next })
}

function setTheme(theme) {
  readerStore.saveSetting({ theme })
}

onShow(() => {
  if (userStore.isLoggedIn) {
    readerStore.loadSetting()
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 22px 18px 88px;
  background: #f6f3ee;
  box-sizing: border-box;
}

.profile-card,
.login-card,
.section-card,
.quick-card {
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(31, 42, 38, 0.06);
}

.profile-card {
  display: flex;
  align-items: center;
  padding: 18px;
  margin-bottom: 14px;
  background: linear-gradient(145deg, #20342d, #376a58);
  color: #fff;
}

.avatar {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  font-size: 24px;
  font-weight: 800;
}

.profile-main {
  min-width: 0;
  flex: 1;
  margin-left: 14px;
}

.name,
.subtitle,
.login-tip,
.section-title,
.section-note,
.setting-title,
.setting-subtitle,
.quick-title,
.quick-subtitle {
  display: block;
}

.name {
  font-size: 24px;
  font-weight: 800;
}

.subtitle {
  margin-top: 6px;
  color: #d6e3dc;
  font-size: 13px;
}

.login-card,
.section-card {
  padding: 16px;
}

.segment {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
  padding: 4px;
  border-radius: 8px;
  background: #f6f3ee;
}

.segment button {
  height: 34px;
  line-height: 34px;
  border-radius: 7px;
  background: transparent;
  color: #62584d;
  font-size: 14px;
}

.segment button.active {
  background: #fff;
  color: #2f6f5e;
  font-weight: 700;
}

.input {
  width: 100%;
  height: 44px;
  margin-bottom: 10px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #e4ddd3;
  background: #fff;
  color: #202a26;
  font-size: 15px;
  box-sizing: border-box;
}

.primary,
.logout {
  width: 100%;
  height: 44px;
  line-height: 44px;
  border-radius: 8px;
  font-size: 15px;
}

.primary {
  margin-top: 2px;
  background: #2f6f5e;
  color: #fff;
}

.login-tip {
  margin-top: 12px;
  color: #8a8178;
  font-size: 12px;
  line-height: 19px;
  text-align: center;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-title {
  color: #1f2a26;
  font-size: 18px;
  font-weight: 800;
}

.section-note {
  color: #9a6b45;
  font-size: 13px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #eee7de;
}

.setting-title {
  color: #26312d;
  font-size: 15px;
  font-weight: 700;
}

.setting-subtitle {
  margin-top: 4px;
  color: #8a8178;
  font-size: 12px;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stepper button {
  width: 32px;
  height: 30px;
  line-height: 30px;
  border-radius: 7px;
  background: #f1e7dc;
  color: #3f4a45;
  font-size: 15px;
}

.stepper text {
  width: 28px;
  color: #26312d;
  font-size: 14px;
  text-align: center;
}

.theme-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 14px;
}

.theme-row button {
  height: 36px;
  line-height: 36px;
  border-radius: 8px;
  background: #f1e7dc;
  color: #5b5148;
  font-size: 13px;
}

.theme-row button.active {
  background: #2f6f5e;
  color: #fff;
}

.quick-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 16px;
}

.quick-title {
  color: #1f2a26;
  font-size: 16px;
  font-weight: 800;
}

.quick-subtitle {
  margin-top: 5px;
  color: #81776c;
  font-size: 13px;
}

.quick-arrow {
  color: #9a6b45;
  font-size: 28px;
}

.logout {
  margin-top: 14px;
  background: #f1e7dc;
  color: #8f3f36;
}
</style>
