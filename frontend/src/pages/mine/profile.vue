<template>
  <view class="page">
    <view class="page-hero">
      <text class="page-title">编辑资料</text>
      <text class="page-sub">修改头像、用户名和邮箱</text>
    </view>

    <!-- Avatar -->
    <view class="avatar-card">
      <view
        class="avatar"
        :class="{ 'avatar--image': avatarUrl }"
        :style="avatarUrl ? { backgroundImage: 'url(' + avatarUrl + ')' } : {}"
        @tap="changeAvatar"
      >
        <text v-if="!avatarUrl" class="avatar-text">{{ avatarLetter }}</text>
        <view class="avatar-badge"><text class="avatar-badge-text">+</text></view>
      </view>
      <text class="avatar-hint">点击更换头像</text>
    </view>

    <!-- Form -->
    <view class="form-card">
      <view class="form-row">
        <text class="form-label">用户名</text>
        <input class="form-input" v-model="formUsername" placeholder="输入用户名" maxlength="30" />
      </view>
      <view class="form-row">
        <text class="form-label">邮箱</text>
        <input class="form-input" v-model="formEmail" placeholder="选填" maxlength="100" />
      </view>
    </view>

    <view class="btn-wrap">
      <text class="btn-save" :class="{ 'btn-save--disabled': !formUsername.trim() }" @tap="save">保存</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const formUsername = ref('')
const formEmail = ref('')
const avatarUrl = ref('')
const saving = ref(false)

const avatarLetter = computed(() => (userStore.username || '悦').slice(0, 1).toUpperCase())

onShow(() => {
  userStore.syncFromStorage()
  formUsername.value = userStore.username || ''
  formEmail.value = userStore.email || ''
  avatarUrl.value = userStore.avatarUrl || ''
})

function changeAvatar(): void {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const path = res.tempFilePaths?.[0]
      if (!path) return
      try {
        const fs = uni.getFileSystemManager()
        const data = fs.readFileSync(path, 'base64') as string
        const ext = (path.split('.').pop() || 'png').replace(/^jpeg$/, 'jpg')
        const dataUrl = `data:image/${ext};base64,${data}`
        const result = await userStore.updateProfile({ avatarUrl: dataUrl })
        if (result.code === 200) {
          avatarUrl.value = userStore.avatarUrl
          uni.showToast({ title: '头像已更新', icon: 'success' })
        } else {
          uni.showToast({ title: (result.message as string) || '更新失败', icon: 'none' })
        }
      } catch {
        uni.showToast({ title: '更新失败', icon: 'none' })
      }
    },
  })
}

async function save(): Promise<void> {
  if (saving.value) return
  if (!formUsername.value.trim()) {
    uni.showToast({ title: '用户名不能为空', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const res = await userStore.updateProfile({
      username: formUsername.value.trim(),
      email: formEmail.value.trim(),
    })
    if (res.code === 200) {
      uni.showToast({ title: '已更新', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 600)
    } else {
      uni.showToast({ title: (res.message as string) || '更新失败', icon: 'none' })
    }
  } catch {
    uni.showToast({ title: '更新失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 11px calc(48px + env(safe-area-inset-bottom));
  background: #F4F4F1;
  box-sizing: border-box;
}

.page-hero {
  padding: 10px 5px 14px;
}

.page-title {
  display: block;
  font-size: 20px;
  line-height: 26px;
  font-weight: 900;
  color: #1F1F1F;
}

.page-sub {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  line-height: 18px;
  color: #A09080;
}

/* ── Avatar ── */
.avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 22px;
  margin-bottom: 14px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid #EBE8E1;
  box-shadow: 0 4px 11px rgba(15, 23, 42, 0.035);
}

.avatar {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #B0A090, #9B8B7A);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #FFFFFF;
  box-shadow: 0 0 0 1px #e8e4dc, 0 6px 16px rgba(15, 23, 42, 0.10);
}

.avatar--image { color: transparent; }

.avatar-text {
  color: #fff;
  font-size: 32px;
  font-weight: 700;
}

.avatar-badge {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #A09080;
  border: 2px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 7px rgba(15, 23, 42, 0.12);
}

.avatar-badge-text {
  color: #fff;
  font-size: 14px;
  line-height: 14px;
  font-weight: 700;
}

.avatar-hint {
  margin-top: 10px;
  color: #A09080;
  font-size: 12px;
}

/* ── Form Card ── */
.form-card {
  background: #FFFFFF;
  border-radius: 10px;
  border: 1px solid #EBE8E1;
  box-shadow: 0 4px 11px rgba(15, 23, 42, 0.035);
  overflow: hidden;
}

.form-row {
  display: flex;
  align-items: center;
  padding: 0 15px;
  min-height: 48px;
  border-bottom: 1px solid #F4F4F1;
}

.form-row:last-child { border-bottom: none; }

.form-label {
  width: 70px;
  flex-shrink: 0;
  color: #1F1F1F;
  font-size: 14px;
  font-weight: 700;
}

.form-input {
  flex: 1;
  height: 40px;
  text-align: right;
  color: #8C8C8C;
  font-size: 14px;
}

/* ── Button ── */
.btn-wrap {
  padding: 28px 0;
  display: flex;
  justify-content: center;
}

.btn-save {
  display: block;
  width: 100%;
  height: 44px;
  line-height: 44px;
  text-align: center;
  border-radius: 999px;
  background: #A09080;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 700;
}

.btn-save--disabled {
  background: #D0C8BC;
  color: #FFFFFF;
}
</style>
