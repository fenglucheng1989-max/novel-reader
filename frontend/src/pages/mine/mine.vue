<template>
  <view class="page">
    <view class="account-card">
      <view class="avatar">{{ avatarText }}</view>
      <view class="account-main">
        <text class="account-title">{{ userStore.isLoggedIn ? userStore.username : '悦读账号' }}</text>
        <text class="account-subtitle">{{ userStore.isLoggedIn ? '书架、进度和偏好已同步' : '登录后保存你的阅读世界' }}</text>
        <text v-if="userStore.isLoggedIn && shelfStats" class="account-reading-time">累计阅读 {{ formatMinutes(shelfStats.todayMinutes) }}</text>
      </view>
      <text class="account-badge">{{ userStore.isLoggedIn ? '已登录' : '未登录' }}</text>
    </view>

    <view v-if="userStore.isLoggedIn && shelfStats" class="stats-card">
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-value">0</text>
          <text class="stat-label">金币</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ shelfStats.todayMinutes || 0 }}</text>
          <text class="stat-label">今日分钟</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ shelfStats.streakDays || 0 }}</text>
          <text class="stat-label">连续天数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ shelfStats.totalBooks || 0 }}</text>
          <text class="stat-label">藏书</text>
        </view>
      </view>
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
          <button :class="{ active: readerStore.setting.theme === 'PARCHMENT' }" @tap="setTheme('PARCHMENT')">
            <text class="theme-dot parchment"></text>
            <text>羊皮</text>
          </button>
          <button :class="{ active: readerStore.setting.theme === 'LIGHT_GREEN' }" @tap="setTheme('LIGHT_GREEN')">
            <text class="theme-dot light-green"></text>
            <text>浅绿</text>
          </button>
          <button :class="{ active: readerStore.setting.theme === 'GRAY' }" @tap="setTheme('GRAY')">
            <text class="theme-dot gray"></text>
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
      <view class="quick-card" @tap="() => {}">
        <view>
          <text class="quick-title">阅读历史</text>
          <text class="quick-subtitle">最近阅读记录</text>
        </view>
        <text class="quick-arrow">›</text>
      </view>
      <view class="quick-card" @tap="goShelf">
        <view>
          <text class="quick-title">我的摘录</text>
          <text class="quick-subtitle">划线收藏的句子</text>
        </view>
        <text class="quick-arrow">›</text>
      </view>
      <view class="quick-card" @tap="goReaderSettings">
        <view>
          <text class="quick-title">阅读设置</text>
          <text class="quick-subtitle">字体、主题与翻页</text>
        </view>
        <text class="quick-arrow">›</text>
      </view>
      <view class="quick-card">
        <view>
          <text class="quick-title">夜间模式</text>
          <text class="quick-subtitle">{{ readerStore.setting.theme === 'NIGHT' ? '已开启' : '已关闭' }}</text>
        </view>
        <switch :checked="readerStore.setting.theme === 'NIGHT'" @change="toggleNightMode" color="#3A3A3A" />
      </view>
      <view class="quick-card" @tap="clearCache">
        <view>
          <text class="quick-title">清除缓存</text>
          <text class="quick-subtitle">释放存储空间</text>
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

      <view class="comment-card-panel">
        <view class="panel-head">
          <view>
            <text class="panel-title">阅读历史</text>
            <text class="panel-subtitle">最近阅读的书籍</text>
          </view>
          <text class="theme-pill">{{ readingHistory.length }} 本</text>
        </view>
        <view v-if="historyLoading" class="comment-empty">正在加载...</view>
        <view v-else-if="!readingHistory.length" class="comment-empty">暂无阅读记录</view>
        <view v-else class="my-comment-list">
          <view
            v-for="item in readingHistory"
            :key="item.id || item.bookId"
            class="my-comment-item"
            @tap="goCommentBook(item.bookId)"
          >
            <text class="comment-book">{{ item.bookTitle || '未知书籍' }}</text>
            <text v-if="item.lastChapterTitle" class="comment-chapter">{{ item.lastChapterTitle }}</text>
            <text class="comment-content">{{ item.lastReadAt ? formatTime(item.lastReadAt) : '' }}</text>
          </view>
        </view>
      </view>

      <view class="comment-card-panel">
        <view class="panel-head">
          <view>
            <text class="panel-title">我的摘录</text>
            <text class="panel-subtitle">划线收藏的句子</text>
          </view>
          <text class="theme-pill">{{ highlightStore.highlights.length }} 条</text>
        </view>
        <view v-if="!highlightStore.highlights.length" class="comment-empty">还没有划线摘录。</view>
        <view v-else>
          <view v-for="group in highlightsGrouped" :key="group.bookId" class="highlight-group">
            <text class="highlight-book-title">{{ group.bookTitle || '未知书籍' }}</text>
            <view v-for="item in group.items" :key="item.id" class="highlight-item">
              <text class="highlight-quote">"{{ item.quoteText }}"</text>
              <text class="highlight-meta">第 {{ item.chapterNo }} 章</text>
            </view>
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
import { useHighlightStore } from '../../store/highlight'
import { request } from '../../utils/request'

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
const statsLoading = ref(false)

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
  statsLoading.value = true
  try {
    await bookStore.loadShelfStats()
    shelfStats.value = bookStore.shelfStats
  } catch {
    shelfStats.value = null
  } finally {
    statsLoading.value = false
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

function toggleNightMode(e) {
  const val = typeof e === 'object' ? e.detail?.value : (readerStore.setting.theme !== 'NIGHT')
  readerStore.saveSetting({ theme: val ? 'NIGHT' : 'DEFAULT' })
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

.account-reading-time {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.account-badge {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #CCCCCC;
  font-size: 12px;
}

.stats-card {
  margin-bottom: 14px;
  padding: 14px 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  color: #1F1F1F;
  font-size: 22px;
  font-weight: 900;
}

.stat-label {
  display: block;
  margin-top: 4px;
  color: #8C8C8C;
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

.theme-dot.parchment {
  background: #F5E6C8;
  border: 1px solid #C4A882;
}

.theme-dot.light-green {
  background: #E8F0E3;
  border: 1px solid #A8C4A0;
}

.theme-dot.gray {
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

.highlight-group {
  margin-top: 14px;
}

.highlight-book-title {
  display: block;
  color: #1F1F1F;
  font-size: 15px;
  font-weight: 800;
  margin-bottom: 6px;
}

.highlight-item {
  padding: 8px 10px;
  margin-bottom: 6px;
  border-radius: 6px;
  background: #F5F5F2;
  border-left: 3px solid #C4A882;
}

.highlight-quote {
  display: block;
  color: #3A3A3A;
  font-size: 14px;
  line-height: 22px;
}

.highlight-meta {
  display: block;
  margin-top: 4px;
  color: #B0B0B0;
  font-size: 11px;
}
</style>
