<template>
  <view class="page">
    <!-- Profile Hero -->
    <view v-if="userStore.isLoggedIn" class="profile-card">
      <view
        class="avatar"
        :class="{ 'avatar--image': userStore.avatarUrl }"
        :style="userStore.avatarUrl ? { backgroundImage: 'url(' + userStore.avatarUrl + ')' } : {}"
        @tap="handleChangeAvatar"
      >
        <text v-if="!userStore.avatarUrl">{{ avatarText }}</text>
        <view class="avatar-badge"><text class="avatar-badge-text">+</text></view>
      </view>
      <view class="profile-info">
        <text class="profile-name">{{ userStore.username }}</text>
        <text v-if="shelfStats" class="profile-reading">今日 {{ shelfStats.todayMinutes || 0 }} 分钟 · 连续 {{ shelfStats.streakDays || 0 }} 天 · 藏书 {{ shelfStats.totalBooks || 0 }} 本</text>
      </view>
    </view>

    <!-- Login Card -->
    <view v-if="!userStore.isLoggedIn" class="login-wrapper">
    <view class="login-card">
      <view class="login-hero">
        <view class="login-book">
          <view class="login-book-spine"></view>
          <view class="login-book-left"></view>
          <view class="login-book-right"></view>
        </view>
        <text class="login-quote">翻开书，就是另一个世界</text>
      </view>

      <view class="login-switch">
        <text :class="{ active: mode === 'login' }" @tap="mode = 'login'">登录</text>
        <text class="login-switch-sep">·</text>
        <text :class="{ active: mode === 'register' }" @tap="mode = 'register'">注册</text>
      </view>

      <view class="field">
        <input v-model="username" class="input" placeholder="用户名" />
      </view>
      <view class="field">
        <input v-model="password" class="input" password placeholder="密码" />
      </view>
      <view class="field field--email" :class="{ 'field--show': mode === 'register' }">
        <input v-model="email" class="input" placeholder="邮箱（可选）" />
      </view>

      <view v-if="mode === 'register'" class="legal-row" @tap="acceptLegal = !acceptLegal">
        <view class="legal-check" :class="{ checked: acceptLegal }">
          <text v-if="acceptLegal" class="legal-check-mark">&#10003;</text>
        </view>
        <text class="legal-copy">我已阅读并同意</text>
        <text class="legal-link" @tap.stop="goAbout('terms')">《用户协议》</text>
        <text class="legal-copy">和</text>
        <text class="legal-link" @tap.stop="goAbout('privacy')">《隐私政策》</text>
      </view>

      <button class="submit-btn" @tap="submit">{{ mode === 'login' ? '进入悦读' : '创建并进入' }}</button>

      <text class="login-tip" v-if="mode === 'login'">登录后可同步书架、进度和阅读偏好</text>
    </view>
    </view>

    <!-- Quick Actions Grid -->
    <view v-if="userStore.isLoggedIn" class="actions-card">
      <view class="actions-grid">
        <view class="action-cell" @tap="goShelf">
          <text class="action-label">我的书架</text>
          <text class="action-desc">继续阅读</text>
        </view>
        <view class="action-cell" @tap="() => {}">
          <text class="action-label">阅读历史</text>
          <text class="action-desc">最近记录</text>
        </view>
        <view class="action-cell" @tap="goShelf">
          <text class="action-label">我的摘录</text>
          <text class="action-desc">划线收藏</text>
        </view>
        <view class="action-cell" @tap="goReaderSettings">
          <text class="action-label">阅读设置</text>
          <text class="action-desc">字体主题</text>
        </view>
        <view class="action-cell" @tap="toggleNightMode">
          <text class="action-label">夜间模式</text>
          <text class="action-desc">{{ readerStore.setting.theme === 'NIGHT' ? '已开启' : '已关闭' }}</text>
        </view>
        <view class="action-cell" @tap="clearCache">
          <text class="action-label">清除缓存</text>
          <text class="action-desc">释放空间</text>
        </view>
      </view>
    </view>

    <!-- Preferences (compact) -->
    <view v-if="userStore.isLoggedIn" class="pref-card" @tap="goReaderSettings">
      <view class="pref-left">
        <text class="pref-title">阅读偏好</text>
        <text class="pref-summary">字号 {{ readerStore.setting.fontSize }} · 行距 {{ readerStore.setting.lineHeight }} · {{ themeLabel }}</text>
      </view>
      <text class="pref-arrow">›</text>
    </view>

    <!-- Content Panels (logged in) -->
    <template v-if="userStore.isLoggedIn">
      <!-- My Comments -->
      <view class="content-card">
        <view class="content-head">
          <view class="content-head-left">
            <text class="content-title">我的评论</text>
            <text class="content-sub">你评论过的书</text>
          </view>
          <text class="content-badge">{{ myComments.length }} 条</text>
        </view>
        <view v-if="commentsLoading" class="content-empty">加载中...</view>
        <view v-else-if="!myComments.length" class="content-empty">还没有评论过书</view>
        <view v-else class="comment-list">
          <view
            v-for="item in myComments"
            :key="item.id"
            class="comment-item"
            @tap="goCommentBook(item.bookId)"
          >
            <text class="comment-book-title">{{ item.bookTitle || '未知书籍' }}</text>
            <text v-if="item.chapterTitle" class="comment-chapter-title">{{ item.chapterTitle }}</text>
            <text class="comment-text">{{ item.content }}</text>
          </view>
        </view>
      </view>

      <!-- Reading History -->
      <view class="content-card">
        <view class="content-head">
          <view class="content-head-left">
            <text class="content-title">阅读历史</text>
            <text class="content-sub">最近阅读的书籍</text>
          </view>
          <text class="content-badge">{{ readingHistory.length }} 本</text>
        </view>
        <view v-if="historyLoading" class="content-empty">加载中...</view>
        <view v-else-if="!readingHistory.length" class="content-empty">暂无阅读记录</view>
        <view v-else class="history-list">
          <view
            v-for="item in readingHistory"
            :key="item.bookId"
            class="history-item"
            @tap="goCommentBook(item.bookId)"
          >
            <BookCover :title="item.bookTitle" :cover-url="item.coverUrl" size="md" />
            <view class="history-info">
              <text class="history-title">{{ item.bookTitle || '未知书籍' }}</text>
              <text class="history-author">{{ item.bookAuthor || '佚名' }} · {{ item.status === 'COMPLETED' ? '完结' : '连载' }}</text>
              <text class="history-chapter" v-if="item.latestChapterTitle">{{ item.latestChapterTitle }}</text>
              <text class="history-time">{{ item.lastReadAt ? formatTime(item.lastReadAt) : '' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Highlights -->
      <view class="content-card">
        <view class="content-head">
          <view class="content-head-left">
            <text class="content-title">我的摘录</text>
            <text class="content-sub">划线收藏的句子</text>
          </view>
          <text class="content-badge">{{ highlightStore.highlights.length }} 条</text>
        </view>
        <view v-if="!highlightStore.highlights.length" class="content-empty">还没有划线摘录</view>
        <view v-else class="highlight-list">
          <view v-for="group in highlightsGrouped" :key="group.bookId" class="highlight-group">
            <text class="highlight-book">{{ group.bookTitle || '未知书籍' }}</text>
            <view v-for="item in group.items" :key="item.id" class="highlight-row">
              <text class="highlight-quote">"{{ item.quoteText }}"</text>
              <text class="highlight-chapter">第 {{ item.chapterNo }} 章</text>
            </view>
          </view>
        </view>
      </view>

      <button class="logout-btn" @tap="logout">退出登录</button>
    </template>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'
import { useReaderStore } from '../../store/reader'
import { useBookStore } from '../../store/book'
import { useHighlightStore } from '../../store/highlight'
import { request } from '../../utils/request'
import BookCover from '../../components/BookCover.vue'

const userStore = useUserStore()
const readerStore = useReaderStore()
const bookStore = useBookStore()
const highlightStore = useHighlightStore()
const mode = ref('login')
const username = ref('')
const password = ref('')
const email = ref('')
const myComments = ref([])
const commentsLoading = ref(false)
const shelfStats = ref(null)
const readingHistory = ref([])
const historyLoading = ref(false)
const highlightsGrouped = ref([])
const acceptLegal = ref(false)

const avatarText = computed(() => (userStore.isLoggedIn ? userStore.username.slice(0, 1).toUpperCase() : '悦'))
const themeLabel = computed(() => {
  if (readerStore.setting.theme === 'GRAY') return '素灰'
  if (readerStore.setting.theme === 'NIGHT') return '夜间'
  if (readerStore.setting.theme === 'PARCHMENT') return '羊皮'
  if (readerStore.setting.theme === 'LIGHT_GREEN') return '浅绿'
  return '米白'
})

async function submit() {
  if (!username.value || !password.value) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  if (mode.value === 'register' && !acceptLegal.value) {
    uni.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
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

async function loadShelfStats() {
  if (!userStore.isLoggedIn) return
  try {
    await bookStore.loadShelfStats()
    shelfStats.value = bookStore.shelfStats
  } catch {
    shelfStats.value = null
  }
}

async function loadReadingHistory() {
  if (!userStore.isLoggedIn) return
  historyLoading.value = true
  try {
    const res = await request({ url: '/api/v1/reading/history', silentAuth: true })
    if (res.code === 200) {
      readingHistory.value = res.data?.records || res.data || []
    }
  } catch {
    readingHistory.value = []
  } finally {
    historyLoading.value = false
  }
}

function formatMinutes(mins) {
  const m = Number(mins || 0)
  if (!m) return '0 分钟'
  if (m < 60) return `${m}分钟`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return mm > 0 ? `${h}小时${mm}分钟` : `${h}小时`
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function toggleNightMode() {
  const next = readerStore.setting.theme !== 'NIGHT'
  readerStore.saveSetting({ theme: next ? 'NIGHT' : 'DEFAULT' })
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

function goReaderSettings() {
  uni.navigateTo({ url: '/pages/mine/settings' })
}

function goAbout(section) {
  uni.navigateTo({ url: `/pages/mine/about?section=${section}` })
}

function handleChangeAvatar() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      const base64 = await fileToBase64(tempFilePath)
      if (!base64) {
        uni.showToast({ title: '图片读取失败', icon: 'none' })
        return
      }
      try {
        const result = await userStore.updateProfile({ avatarUrl: base64 })
        if (result && result.code === 200) {
          uni.showToast({ title: '头像已更新', icon: 'success' })
        } else if (result) {
          uni.showToast({ title: result.message || '头像更新失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: e.message || '头像更新失败', icon: 'none' })
      }
    }
  })
}

function fileToBase64(filePath) {
  return new Promise((resolve) => {
    // #ifdef H5
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxW = 256
      const maxH = 256
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => resolve(null)
    img.src = filePath
    // #endif
    // #ifndef H5
    uni.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => resolve('data:image/png;base64,' + res.data),
      fail: () => resolve(null)
    })
    // #endif
  })
}

onShow(() => {
  userStore.syncFromStorage()
  if (userStore.isLoggedIn) {
    userStore.fetchProfile()
    readerStore.loadSetting()
    loadMyComments()
    loadShelfStats()
    loadReadingHistory()
  }
  highlightStore.loadFromStorage()
  highlightsGrouped.value = highlightStore.getGroupedHighlights()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 10px 88px;
  background: #F4F4F1;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* ── Profile Card ── */
.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  margin-bottom: 10px;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 6px 18px rgba(31, 31, 31, 0.045);
}

.avatar {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #B0A090, #9B8B7A);
  color: #fff;
  font-size: 20px;
  font-weight: 900;
  position: relative;
  overflow: visible;
}

.avatar--image {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: transparent;
}


.avatar-badge {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #3A3A3A;
  border: 2px solid #FFFFFF;
}

.avatar-badge-text {
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.profile-info {
  min-width: 0;
  flex: 1;
}

.profile-name {
  display: block;
  color: #1F1F1F;
  font-size: 18px;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-reading {
  display: block;
  margin-top: 3px;
  color: #A09080;
  font-size: 12px;
  font-weight: 600;
}

/* ── Login Wrapper ── */
.login-wrapper {
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  box-sizing: border-box;
}

/* ── Login Card ── */
.login-card {
  width: 100%;
  max-width: 360px;
  margin-bottom: 10px;
  padding: 32px 24px 28px;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 6px 18px rgba(31, 31, 31, 0.045);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: "";
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(176, 160, 144, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

/* ── Hero: Open Book ── */
.login-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.login-book {
  width: 44px;
  height: 34px;
  position: relative;
  margin-bottom: 10px;
  perspective: 60px;
}

.login-book-spine {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 2px;
  background: #B0A090;
  transform: translateX(-50%);
}

.login-book-left {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 50%;
  border-radius: 4px 2px 2px 4px;
  background: linear-gradient(135deg, #E8E4DC, #D8D2C6);
  border: 1px solid rgba(176, 160, 144, 0.3);
  transform-origin: right center;
  animation: bookLeft 6s ease-in-out infinite;
}

.login-book-right {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 50%;
  border-radius: 2px 4px 4px 2px;
  background: linear-gradient(-135deg, #F0ECE4, #E0DAD0);
  border: 1px solid rgba(176, 160, 144, 0.3);
  transform-origin: left center;
  animation: bookRight 6s ease-in-out infinite;
}

@keyframes bookLeft {
  0%, 100% { transform: rotateY(0deg); }
  25% { transform: rotateY(-25deg); }
  75% { transform: rotateY(0deg); }
}

@keyframes bookRight {
  0%, 100% { transform: rotateY(0deg); }
  25% { transform: rotateY(25deg); }
  75% { transform: rotateY(0deg); }
}

.login-quote {
  color: #5A5A5A;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* ── Login/Register Switch ── */
.login-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.login-switch text {
  color: #B0B0B0;
  font-size: 15px;
  font-weight: 700;
  transition: color 0.2s ease;
}

.login-switch text.active {
  color: #1F1F1F;
}

.login-switch-sep {
  color: #D0D0D0 !important;
  font-weight: 400 !important;
}

/* ── Fields ── */
.field {
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}

.field--email {
  max-height: 0;
  margin-bottom: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, margin-bottom 0.3s ease, opacity 0.3s ease;
}

.field--show {
  max-height: 58px;
  margin-bottom: 14px;
  opacity: 1;
}

/* ── Legal Checkbox ── */
.legal-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.legal-check {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid #D0D0D0;
  margin-right: 6px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.legal-check.checked {
  border-color: #B0A090;
  background: #B0A090;
}

.legal-check-mark {
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.legal-copy {
  color: #8C8C8C;
  font-size: 12px;
}

.legal-link {
  color: #A09080;
  font-size: 12px;
  font-weight: 600;
}

.input {
  width: 100%;
  height: 48px;
  padding: 0 4px;
  background: transparent;
  color: #1F1F1F;
  font-size: 16px;
  border-bottom: 1px solid #E8E6E0;
  border-radius: 0;
  box-sizing: border-box;
  transition: border-bottom-color 0.2s ease;
}

.input:focus {
  border-bottom-color: #B0A090;
}

/* ── Submit Button ── */
.submit-btn {
  width: 100%;
  height: 48px;
  line-height: 48px;
  margin-top: 8px;
  border-radius: 24px;
  background: linear-gradient(135deg, #B0A090, #9B8B7A);
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
}

.login-tip {
  display: block;
  margin-top: 16px;
  color: #B0B0B0;
  font-size: 12px;
  text-align: center;
  position: relative;
  z-index: 1;
}

/* ── Quick Actions Grid ── */
.actions-card {
  margin-bottom: 10px;
  padding: 14px;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 6px 18px rgba(31, 31, 31, 0.045);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.action-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 72px;
  border-radius: 7px;
  background: rgba(160, 144, 128, 0.06);
}

.action-label {
  color: #3A3A3A;
  font-size: 14px;
  font-weight: 700;
}

.action-desc {
  margin-top: 4px;
  color: #A09080;
  font-size: 11px;
}

/* ── Preferences Compact ── */
.pref-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 16px;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 6px 18px rgba(31, 31, 31, 0.045);
}

.pref-left {
  min-width: 0;
}

.pref-title {
  display: block;
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 800;
}

.pref-summary {
  display: block;
  margin-top: 4px;
  color: #8C8C8C;
  font-size: 13px;
}

.pref-arrow {
  flex-shrink: 0;
  color: #A09080;
  font-size: 28px;
}

/* ── Content Cards ── */
.content-card {
  margin-bottom: 10px;
  padding: 16px;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 6px 18px rgba(31, 31, 31, 0.045);
}

.content-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.content-head-left {
  min-width: 0;
}

.content-title {
  display: block;
  color: #1F1F1F;
  font-size: 17px;
  font-weight: 900;
}

.content-sub {
  display: block;
  margin-top: 3px;
  color: #8C8C8C;
  font-size: 13px;
}

.content-badge {
  flex-shrink: 0;
  padding: 3px 9px;
  border-radius: 99px;
  background: rgba(160, 144, 128, 0.12);
  color: #A09080;
  font-size: 12px;
  font-weight: 700;
}

.content-empty {
  padding: 18px 0 4px;
  color: #B0B0B0;
  font-size: 13px;
  text-align: center;
}

/* ── Comment Items ── */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-item {
  padding: 10px;
  border-radius: 7px;
  background: #F8F8F6;
}

.comment-book-title {
  display: block;
  color: #3A3A3A;
  font-size: 14px;
  font-weight: 800;
}

.comment-chapter-title {
  display: block;
  margin-top: 2px;
  color: #B0B0B0;
  font-size: 12px;
}

.comment-text {
  display: block;
  margin-top: 6px;
  color: #5A5A5A;
  font-size: 13px;
  line-height: 20px;
  word-break: break-all;
}

/* ── History ── */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background: #F8F8F6;
  align-items: flex-start;
}

.history-item :deep(.book-cover) {
  flex-shrink: 0;
  width: 40px;
  height: 54px;
  border-radius: 4px;
}

.history-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.history-title {
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-author {
  color: #A09080;
  font-size: 11px;
}

.history-chapter {
  color: #8C8C8C;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  color: #B0B0B0;
  font-size: 10px;
}

/* ── Highlights ── */
.highlight-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.highlight-group {
}

.highlight-book {
  display: block;
  color: #1F1F1F;
  font-size: 15px;
  font-weight: 800;
  margin-bottom: 6px;
}

.highlight-row {
  padding: 8px 10px;
  margin-bottom: 6px;
  border-radius: 6px;
  background: #F8F8F6;
  border-left: 3px solid #C4A882;
}

.highlight-quote {
  display: block;
  color: #3A3A3A;
  font-size: 14px;
  line-height: 22px;
}

.highlight-chapter {
  display: block;
  margin-top: 4px;
  color: #B0B0B0;
  font-size: 11px;
}

/* ── Logout ── */
.logout-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  margin-top: 4px;
  border-radius: 7px;
  background: #FFFFFF;
  color: #8C8C8C;
  font-size: 14px;
  font-weight: 600;
}
</style>
