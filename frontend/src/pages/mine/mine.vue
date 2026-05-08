<template>
  <view class="page">
    <view class="account-card">
      <view class="avatar">{{ avatarText }}</view>
      <view class="account-main">
        <text class="account-title">{{ userStore.isLoggedIn ? userStore.username : '悦读账号' }}</text>
        <text class="account-subtitle">{{ userStore.isLoggedIn ? '书架、进度和偏好已同步' : '登录后保存你的阅读世界' }}</text>
      </view>
      <text class="account-badge">{{ userStore.isLoggedIn ? '已登录' : '未登录' }}</text>
    </view>

    <view v-if="!userStore.isLoggedIn" class="login-card">
      <view class="login-head">
        <text class="panel-title">{{ mode === 'login' ? '登录悦读' : '创建账号' }}</text>
        <text class="panel-subtitle">同步书架、阅读进度和阅读偏好。</text>
      </view>

      <view class="segment">
        <button :class="{ active: mode === 'login' }" @tap="mode = 'login'">登录</button>
        <button :class="{ active: mode === 'register' }" @tap="mode = 'register'">注册</button>
      </view>

      <view class="field">
        <text class="field-label">用户名</text>
        <input v-model="username" class="input" placeholder="请输入用户名" />
      </view>
      <view class="field">
        <text class="field-label">密码</text>
        <input v-model="password" class="input" password placeholder="请输入密码" />
      </view>
      <view v-if="mode === 'register'" class="field">
        <text class="field-label">邮箱</text>
        <input v-model="email" class="input" placeholder="可选" />
      </view>

      <button class="primary" @tap="submit">{{ mode === 'login' ? '登录' : '注册并登录' }}</button>
      <text class="login-tip">登录后可同步书架、进度和阅读偏好。</text>
    </view>

    <view v-else>
      <view class="preference-card">
        <view class="panel-head">
          <view>
            <text class="panel-title">阅读偏好</text>
            <text class="panel-subtitle">这些设置会应用到阅读器正文。</text>
          </view>
          <text class="theme-pill">{{ themeLabel }}</text>
        </view>

        <view class="setting-row">
          <view class="setting-copy">
            <text class="setting-title">字号</text>
            <text class="setting-subtitle">当前 {{ readerStore.setting.fontSize }}</text>
          </view>
          <view class="stepper">
            <button @tap="changeFont(-1)">-</button>
            <text>{{ readerStore.setting.fontSize }}</text>
            <button @tap="changeFont(1)">+</button>
          </view>
        </view>

        <view class="setting-row">
          <view class="setting-copy">
            <text class="setting-title">行距</text>
            <text class="setting-subtitle">当前 {{ readerStore.setting.lineHeight }}</text>
          </view>
          <view class="stepper">
            <button @tap="changeLineHeight(-2)">-</button>
            <text>{{ readerStore.setting.lineHeight }}</text>
            <button @tap="changeLineHeight(2)">+</button>
          </view>
        </view>

        <view class="theme-grid">
          <button :class="{ active: readerStore.setting.theme === 'DEFAULT' }" @tap="setTheme('DEFAULT')">
            <text class="theme-dot default"></text>
            <text>米白</text>
          </button>
          <button :class="{ active: readerStore.setting.theme === 'GRAY' }" @tap="setTheme('GRAY')">
            <text class="theme-dot green"></text>
            <text>素灰</text>
          </button>
          <button :class="{ active: readerStore.setting.theme === 'NIGHT' }" @tap="setTheme('NIGHT')">
            <text class="theme-dot night"></text>
            <text>夜间</text>
          </button>
        </view>
      </view>

      <view class="quick-card" @tap="goShelf">
        <view>
          <text class="quick-title">我的书架</text>
          <text class="quick-subtitle">继续上次的阅读</text>
        </view>
        <text class="quick-arrow">›</text>
      </view>

      <view class="comment-card-panel">
        <view class="panel-head">
          <view>
            <text class="panel-title">我的评论</text>
            <text class="panel-subtitle">你评论过的书会出现在这里。</text>
          </view>
          <text class="theme-pill">{{ myComments.length }} 条</text>
        </view>
        <view v-if="commentsLoading" class="comment-empty">正在加载评论...</view>
        <view v-else-if="!myComments.length" class="comment-empty">还没有评论过书。</view>
        <view v-else class="my-comment-list">
          <view
            v-for="item in myComments"
            :key="item.id"
            class="my-comment-item"
            @tap="goCommentBook(item.bookId)"
          >
            <text class="comment-book">{{ item.bookTitle || '未知书籍' }}</text>
            <text v-if="item.chapterTitle" class="comment-chapter">{{ item.chapterTitle }}</text>
            <text class="comment-content">{{ item.content }}</text>
          </view>
        </view>
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
import { useBookStore } from '../../store/book'

const userStore = useUserStore()
const readerStore = useReaderStore()
const bookStore = useBookStore()
const mode = ref('login')
const username = ref('')
const password = ref('')
const email = ref('')
const myComments = ref([])
const commentsLoading = ref(false)

const avatarText = computed(() => (userStore.isLoggedIn ? userStore.username.slice(0, 1).toUpperCase() : '悦'))
const themeLabel = computed(() => {
  if (readerStore.setting.theme === 'GRAY') return '素灰'
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

function goCommentBook(bookId) {
  if (!bookId) return
  uni.navigateTo({ url: `/pages/book/detail?id=${bookId}` })
}

async function loadMyComments() {
  if (!userStore.isLoggedIn) {
    myComments.value = []
    return
  }
  commentsLoading.value = true
  try {
    const res = await bookStore.loadMyComments(1, 20)
    if (res.code === 200) {
      myComments.value = res.data?.records || []
    }
  } catch {
    myComments.value = []
  } finally {
    commentsLoading.value = false
  }
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
  userStore.syncFromStorage()
  if (userStore.isLoggedIn) {
    readerStore.loadSetting()
    loadMyComments()
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 22px 18px 88px;
  background: #F8F8F6;
  box-sizing: border-box;
}

.account-card,
.login-card,
.preference-card,
.quick-card,
.comment-card-panel {
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}

.account-card {
  display: flex;
  align-items: center;
  padding: 18px;
  margin-bottom: 14px;
  background: #3A3A3A;
  color: #fff;
}

.avatar {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  font-size: 24px;
  font-weight: 800;
}

.account-main {
  min-width: 0;
  flex: 1;
  margin-left: 14px;
}

.account-title,
.account-subtitle,
.account-badge,
.panel-title,
.panel-subtitle,
.field-label,
.login-tip,
.setting-title,
.setting-subtitle,
.quick-title,
.quick-subtitle {
  display: block;
}

.account-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 24px;
  font-weight: 800;
}

.account-subtitle {
  margin-top: 6px;
  color: #CCCCCC;
  font-size: 13px;
}

.account-badge {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #CCCCCC;
  font-size: 12px;
}

.login-card,
.preference-card {
  padding: 16px;
}

.login-head,
.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title {
  color: #1F1F1F;
  font-size: 20px;
  font-weight: 800;
}

.panel-subtitle {
  margin-top: 5px;
  color: #8C8C8C;
  font-size: 13px;
  line-height: 20px;
}

.segment {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 14px;
  padding: 4px;
  border-radius: 8px;
  background: #F5F5F2;
}

.segment button {
  height: 34px;
  line-height: 34px;
  border-radius: 7px;
  background: transparent;
  color: #5A5A5A;
  font-size: 14px;
}

.segment button.active {
  background: #fff;
  color: #3A3A3A;
  font-weight: 700;
}

.field {
  margin-bottom: 10px;
}

.field-label {
  margin-bottom: 6px;
  color: #5A5A5A;
  font-size: 12px;
}

.input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #EBEBE5;
  background: #fff;
  color: #1F1F1F;
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
  margin-top: 4px;
  background: #3A3A3A;
  color: #fff;
}

.login-tip {
  margin-top: 12px;
  color: #B0B0B0;
  font-size: 12px;
  line-height: 19px;
  text-align: center;
}

.theme-pill {
  flex: 0 0 auto;
  padding: 4px 9px;
  border-radius: 999px;
  background: #F0F0ED;
  color: #A09080;
  font-size: 12px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 0;
  border-bottom: 1px solid #EBEBE5;
}

.setting-copy {
  min-width: 0;
}

.setting-title {
  color: #1F1F1F;
  font-size: 15px;
  font-weight: 700;
}

.setting-subtitle {
  margin-top: 4px;
  color: #8C8C8C;
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
  background: #F0F0ED;
  color: #3A3A3A;
  font-size: 15px;
}

.stepper text {
  width: 28px;
  color: #1F1F1F;
  font-size: 14px;
  text-align: center;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 14px;
}

.theme-grid button {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  background: #F0F0ED;
  color: #5A5A5A;
  font-size: 13px;
}

.theme-grid button.active {
  background: #3A3A3A;
  color: #fff;
}

.theme-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.theme-dot.default {
  background: #F8F8F6;
  border: 1px solid #CCCCCC;
}

.theme-dot.green {
  background: #EBEBE7;
  border: 1px solid #CCCCCC;
}

.theme-dot.night {
  background: #20242a;
}

.quick-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 16px;
}

.quick-title {
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 800;
}

.quick-subtitle {
  margin-top: 5px;
  color: #8C8C8C;
  font-size: 13px;
}

.quick-arrow {
  color: #A09080;
  font-size: 28px;
}

.comment-card-panel {
  margin-top: 12px;
  padding: 16px;
}

.comment-empty {
  padding: 18px 0 4px;
  color: #8C8C8C;
  font-size: 13px;
  text-align: center;
}

.my-comment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.my-comment-item {
  padding: 10px;
  border-radius: 8px;
  background: #F5F5F2;
  border: 1px solid #EBEBE5;
}

.comment-book,
.comment-chapter,
.comment-content {
  display: block;
}

.comment-book {
  color: #3A3A3A;
  font-size: 14px;
  font-weight: 800;
}

.comment-chapter {
  margin-top: 3px;
  color: #B0B0B0;
  font-size: 12px;
}

.comment-content {
  margin-top: 6px;
  color: #5A5A5A;
  font-size: 13px;
  line-height: 20px;
  word-break: break-all;
}

.logout {
  margin-top: 14px;
  background: #F0F0ED;
  color: #8f3f36;
}
</style>
