<template>
  <view class="page">
    <!-- ===== Logged In ===== -->
    <template v-if="userStore.isLoggedIn">
      <!-- Profile Card -->
      <view class="profile-card">
        <view class="profile-main">
          <view
            class="profile-avatar"
            :class="{ 'profile-avatar--image': userStore.avatarUrl }"
            :style="userStore.avatarUrl ? { backgroundImage: 'url(' + userStore.avatarUrl + ')' } : {}"
            @tap="handleChangeAvatar"
          >
            <text v-if="!userStore.avatarUrl" class="profile-avatar-text">{{ avatarText }}</text>
            <view class="profile-avatar-badge">
              <text class="profile-avatar-badge-text">+</text>
            </view>
          </view>
          <view class="profile-copy">
            <view class="profile-name-row">
              <text class="profile-name">{{ userStore.username }}</text>
              <text class="profile-edit" @tap="goProfile">编辑</text>
            </view>
            <text v-if="shelfStats" class="profile-stats">今日 {{ shelfStats.todayMinutes || 0 }} 分钟 · 连续 {{ shelfStats.streakDays || 0 }} 天 · 藏书 {{ shelfStats.totalBooks || 0 }} 本</text>
            <text v-else class="profile-stats">探索你的阅读世界</text>
          </view>
        </view>
      </view>

      <!-- Section: 阅读 -->
      <text class="section-title">阅读</text>
      <view class="menu-group">
        <view class="menu-item" @tap="goHistory">
          <view class="menu-icon"><text class="menu-icon-text">&#x1F550;</text></view>
          <view class="menu-copy">
            <text class="menu-title">阅读历史</text>
            <text class="menu-sub">最近阅读记录</text>
          </view>
          <text class="menu-arrow">&#8250;</text>
        </view>
        <view class="menu-item" @tap="goReaderSettings">
          <view class="menu-icon"><text class="menu-icon-text">&#x2699;</text></view>
          <view class="menu-copy">
            <text class="menu-title">阅读设置</text>
            <text class="menu-sub">字号 {{ readerStore.setting.fontSize }} · 行距 {{ readerStore.setting.lineHeight }} · {{ themeLabel }}</text>
          </view>
          <text class="menu-arrow">&#8250;</text>
        </view>
        <view class="menu-item menu-item--toggle" @tap="toggleNightMode">
          <view class="menu-icon"><text class="menu-icon-text">&#x1F319;</text></view>
          <view class="menu-copy">
            <text class="menu-title">夜间模式</text>
          </view>
          <switch :checked="readerStore.setting.theme === 'NIGHT'" color="#A09080" style="transform:scale(0.85)" />
        </view>
      </view>

      <!-- Section: 内容 -->
      <text class="section-title">内容</text>
      <view class="menu-group">
        <view class="menu-item" @tap="goComments">
          <view class="menu-icon"><text class="menu-icon-text">&#x1F4AC;</text></view>
          <view class="menu-copy">
            <text class="menu-title">我的评论</text>
            <text class="menu-sub">{{ commentsCount }} 条评论</text>
          </view>
          <text class="menu-arrow">&#8250;</text>
        </view>
        <view class="menu-item" @tap="goHighlights">
          <view class="menu-icon"><text class="menu-icon-text">&#x270F;</text></view>
          <view class="menu-copy">
            <text class="menu-title">我的摘录</text>
            <text class="menu-sub">{{ highlightStore.highlights.length }} 条摘录</text>
          </view>
          <text class="menu-arrow">&#8250;</text>
        </view>
      </view>

      <!-- Section: 帐号 -->
      <text class="section-title">帐号</text>
      <view class="menu-group">
        <view class="menu-item" @tap="goProfile">
          <view class="menu-icon"><text class="menu-icon-text">&#x1F464;</text></view>
          <view class="menu-copy">
            <text class="menu-title">编辑资料</text>
            <text class="menu-sub">修改用户名、邮箱、头像</text>
          </view>
          <text class="menu-arrow">&#8250;</text>
        </view>
        <view class="menu-item" @tap="goPassword">
          <view class="menu-icon"><text class="menu-icon-text">&#x1F512;</text></view>
          <view class="menu-copy">
            <text class="menu-title">修改密码</text>
            <text class="menu-sub">更新登录密码</text>
          </view>
          <text class="menu-arrow">&#8250;</text>
        </view>
        <view class="menu-item" @tap="clearCache">
          <view class="menu-icon"><text class="menu-icon-text">&#x1F5D1;</text></view>
          <view class="menu-copy">
            <text class="menu-title">清除缓存</text>
            <text class="menu-sub">释放本地存储空间</text>
          </view>
          <text class="menu-arrow">&#8250;</text>
        </view>
      </view>

      <!-- Section: 其他 -->
      <text class="section-title">其他</text>
      <view class="menu-group">
        <view class="menu-item" @tap="goAbout('about')">
          <view class="menu-icon"><text class="menu-icon-text">&#x2139;</text></view>
          <view class="menu-copy">
            <text class="menu-title">关于悦读</text>
            <text class="menu-sub">用户协议、隐私政策</text>
          </view>
          <text class="menu-arrow">&#8250;</text>
        </view>
      </view>

      <!-- Logout -->
      <view class="logout-wrap">
        <text class="logout-btn" @tap="logout">退出登录</text>
      </view>
    </template>

    <!-- ===== Not Logged In ===== -->
    <template v-else>
      <view class="login-card">
        <view class="login-hero">
          <view class="login-book">
            <view class="login-book-spine"></view>
            <view class="login-book-left"></view>
            <view class="login-book-right"></view>
          </view>
          <text class="login-quote">翻开书，就是另一个世界</text>
        </view>
        <view class="login-tabs">
          <text class="login-tab" :class="{ active: mode === 'login' }" @tap="mode = 'login'">登录</text>
          <text class="login-tab" :class="{ active: mode === 'register' }" @tap="mode = 'register'">注册</text>
        </view>
        <view class="login-fields">
          <input class="login-input" v-model="username" placeholder="用户名" maxlength="30" />
          <input class="login-input" v-model="password" password placeholder="密码" maxlength="50" />
          <input v-if="mode === 'register'" class="login-input" v-model="email" placeholder="邮箱（选填）" maxlength="100" />
          <view v-if="mode === 'register'" class="legal-row" @tap="acceptLegal = !acceptLegal">
            <view class="legal-check" :class="{ checked: acceptLegal }">
              <text v-if="acceptLegal" class="legal-check-mark">&#10003;</text>
            </view>
            <text class="legal-copy">我已阅读并同意</text>
            <text class="legal-link" @tap.stop="goAbout('terms')">《用户协议》</text>
            <text class="legal-copy">和</text>
            <text class="legal-link" @tap.stop="goAbout('privacy')">《隐私政策》</text>
          </view>
        </view>
        <view class="login-btn" @tap="submit">
          <text>{{ mode === 'login' ? '登录' : '注册' }}</text>
        </view>
      </view>
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

const userStore = useUserStore()
const readerStore = useReaderStore()
const bookStore = useBookStore()
const highlightStore = useHighlightStore()

// Auth
const mode = ref('login')
const username = ref('')
const password = ref('')
const email = ref('')
const acceptLegal = ref(false)

// Data
const shelfStats = ref(null)
const commentsCount = ref(0)

const avatarText = computed(() => (userStore.username || '悦').slice(0, 1).toUpperCase())
const themeLabel = computed(() => {
  const t = readerStore.setting.theme
  if (t === 'GRAY') return '素灰'
  if (t === 'NIGHT') return '夜间'
  if (t === 'PARCHMENT') return '羊皮'
  if (t === 'LIGHT_GREEN') return '浅绿'
  return '米白'
})

// ── Auth ──
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

// ── Nav ──
function goHistory() { uni.switchTab({ url: '/pages/bookshelf/bookshelf?tab=history' }) }
function goReaderSettings() { uni.navigateTo({ url: '/pages/mine/settings' }) }
function goComments() { uni.navigateTo({ url: '/pages/mine/comments' }) }
function goHighlights() { uni.navigateTo({ url: '/pages/mine/highlights' }) }
function goProfile() { uni.navigateTo({ url: '/pages/mine/profile' }) }
function goPassword() { uni.navigateTo({ url: '/pages/mine/password' }) }
function goAbout(section) { uni.navigateTo({ url: `/pages/mine/about?section=${section}` }) }

// ── Night Mode ──
function toggleNightMode() {
  const next = readerStore.setting.theme === 'NIGHT' ? 'DEFAULT' : 'NIGHT'
  readerStore.saveSetting({ theme: next })
}

// ── Cache ──
function clearCache() {
  uni.showModal({
    title: '清除缓存',
    content: '确定清除所有本地缓存吗？不会影响书架和阅读进度。',
    success: (res) => {
      if (res.confirm) {
        const keys = uni.getStorageInfoSync().keys || []
        keys.filter(k => k.startsWith('chapter:v2:')).forEach(k => uni.removeStorageSync(k))
        uni.showToast({ title: '缓存已清除', icon: 'success' })
      }
    }
  })
}

// ── Avatar ──
function handleChangeAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const path = res.tempFilePaths?.[0]
      if (!path) return
      try {
        const fs = uni.getFileSystemManager()
        const data = fs.readFileSync(path, 'base64')
        const ext = (path.split('.').pop() || 'png').replace(/^jpeg$/, 'jpg')
        const dataUrl = `data:image/${ext};base64,${data}`
        const result = await userStore.updateProfile({ avatarUrl: dataUrl })
        if (result.code === 200) {
          uni.showToast({ title: '头像已更新', icon: 'success' })
        } else {
          uni.showToast({ title: result.message || '头像更新失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: e.message || '头像更新失败', icon: 'none' })
      }
    }
  })
}

// ── Lifecycle ──
async function loadShelfStats() {
  try {
    const res = await bookStore.loadShelfStats()
    if (res.code === 200) shelfStats.value = res.data
  } catch { shelfStats.value = null }
}

async function loadCommentCount() {
  try {
    const res = await bookStore.loadMyComments(1, 1)
    commentsCount.value = res.data?.total || 0
  } catch { commentsCount.value = 0 }
}

onShow(() => {
  userStore.syncFromStorage()
  if (userStore.isLoggedIn) {
    userStore.fetchProfile()
    readerStore.loadSetting()
    loadShelfStats()
    loadCommentCount()
    highlightStore.loadFromStorage()
    highlightStore.syncFromServer()
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 11px calc(48px + env(safe-area-inset-bottom));
  background: #F4F4F1;
  box-sizing: border-box;
}

/* ── Profile Card ── */
.profile-card {
  padding: 15px 15px 14px;
  margin-bottom: 10px;
  border-radius: 9px;
  background: #FFFFFF;
  box-shadow: 0 4px 11px rgba(15, 23, 42, 0.045);
}

.profile-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.profile-avatar {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #B0A090, #9B8B7A);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #FFFFFF;
  box-shadow: 0 0 0 1px #e8e4dc, 0 6px 13px rgba(15, 23, 42, 0.10);
  flex-shrink: 0;
}

.profile-avatar--image {
  color: transparent;
}

.profile-avatar-text {
  color: #fff;
  font-size: 23px;
  font-weight: 700;
}

.profile-avatar-badge {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #A09080;
  border: 2px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 7px rgba(15, 23, 42, 0.12);
}

.profile-avatar-badge-text {
  color: #fff;
  font-size: 13px;
  line-height: 13px;
  font-weight: 700;
}

.profile-copy {
  flex: 1;
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-name {
  font-size: 18px;
  line-height: 24px;
  font-weight: 800;
  color: #1F1F1F;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.profile-edit {
  flex-shrink: 0;
  color: #A09080;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: #F4F4F1;
}

.profile-stats {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  line-height: 18px;
  color: #A09080;
  font-weight: 600;
}

/* ── Section Title ── */
.section-title {
  display: block;
  margin: 0 5px 6px;
  color: #A09080;
  font-size: 12px;
  line-height: 18px;
  font-weight: 700;
}

/* ── Menu Group ── */
.menu-group {
  background: #FFFFFF;
  border-radius: 9px;
  box-shadow: 0 4px 11px rgba(15, 23, 42, 0.045);
  margin-bottom: 14px;
  overflow: hidden;
}

.menu-item {
  min-height: 49px;
  padding: 0 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #F4F4F1;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item--toggle {
  /* no extra styles needed */;
}

.menu-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #F9F8F6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon-text {
  font-size: 14px;
  line-height: 14px;
}

.menu-copy {
  flex: 1;
  min-width: 0;
  padding: 9px 0;
}

.menu-title {
  display: block;
  color: #1F1F1F;
  font-size: 15px;
  line-height: 20px;
  font-weight: 700;
}

.menu-sub {
  display: block;
  margin-top: 2px;
  color: #B0B0B0;
  font-size: 12px;
  line-height: 17px;
}

.menu-arrow {
  color: #D0D0C8;
  font-size: 18px;
  flex-shrink: 0;
}

/* ── Logout ── */
.logout-wrap {
  padding: 20px 0 0;
  text-align: center;
}

.logout-btn {
  display: inline-block;
  padding: 8px 36px;
  border-radius: 999px;
  border: 1px solid #D0D0C8;
  color: #B0B0B0;
  font-size: 14px;
  font-weight: 600;
}

/* ── Login Card (not logged in) ── */
.login-card {
  background: #FFFFFF;
  border-radius: 9px;
  box-shadow: 0 4px 11px rgba(15, 23, 42, 0.045);
  padding: 32px 18px 28px;
  margin-top: 12px;
}

.login-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.login-book {
  width: 48px;
  height: 48px;
  position: relative;
  margin-bottom: 14px;
}

.login-book-spine {
  position: absolute;
  left: 0;
  top: 0;
  width: 6px;
  height: 48px;
  background: #8C7B6B;
  border-radius: 2px 0 0 2px;
}

.login-book-left {
  position: absolute;
  left: 6px;
  top: 0;
  width: 20px;
  height: 48px;
  background: linear-gradient(135deg, #C4B5A5, #A09080);
  border-radius: 0 2px 0 0;
}

.login-book-right {
  position: absolute;
  left: 26px;
  top: 0;
  width: 22px;
  height: 48px;
  background: linear-gradient(135deg, #D4C8B8, #B0A090);
  border-radius: 0 2px 2px 0;
}

.login-quote {
  color: #A09080;
  font-size: 14px;
  font-weight: 600;
}

.login-tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 18px;
}

.login-tab {
  color: #B0B0B0;
  font-size: 18px;
  font-weight: 800;
  padding-bottom: 4px;
}

.login-tab.active {
  color: #1F1F1F;
  border-bottom: 2px solid #A09080;
}

.login-fields {
  margin-bottom: 20px;
}

.login-input {
  background: #F9F8F6;
  border-radius: 7px;
  height: 44px;
  padding: 0 15px;
  font-size: 14px;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.legal-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  flex-wrap: wrap;
}

.legal-check {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid #D0D0C8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.legal-check.checked {
  background: #A09080;
  border-color: #A09080;
}

.legal-check-mark {
  color: #fff;
  font-size: 12px;
}

.legal-copy {
  color: #8C8C8C;
}

.legal-link {
  color: #A09080;
  font-weight: 600;
}

.login-btn {
  height: 44px;
  line-height: 44px;
  text-align: center;
  border-radius: 999px;
  background: #3A3A3A;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 700;
}

</style>
