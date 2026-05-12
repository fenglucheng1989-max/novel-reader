<template>
  <view class="page">
    <view class="page-hero">
      <text class="page-title">修改密码</text>
      <text class="page-sub">更新你的登录密码</text>
    </view>

    <view class="form-card">
      <view class="form-row">
        <input class="form-input" v-model="oldPassword" password placeholder="输入原密码" />
      </view>
      <view class="form-row">
        <input class="form-input" v-model="newPassword" password placeholder="新密码，至少6位" maxlength="50" />
      </view>
      <view class="form-row">
        <input class="form-input" v-model="confirmPassword" password placeholder="再次输入新密码" maxlength="50" />
      </view>
    </view>

    <view class="btn-wrap">
      <text class="btn-save" :class="{ 'btn-save--disabled': !canSave }" @tap="save">保存</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { request } from '../../utils/request'

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)

const canSave = computed(() => !!(oldPassword.value && newPassword.value.length >= 6 && confirmPassword.value))

async function save(): Promise<void> {
  if (saving.value || !canSave.value) return
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const res = await request({
      url: '/api/v1/user/password',
      method: 'PUT',
      data: { oldPassword: oldPassword.value, newPassword: newPassword.value },
    })
    if (res.code === 200) {
      uni.showToast({ title: '密码已修改', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 600)
    } else {
      uni.showToast({ title: res.message || '修改失败', icon: 'none' })
    }
  } catch {
    uni.showToast({ title: '修改失败', icon: 'none' })
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

/* ── Form Card ── */
.form-card {
  background: #FFFFFF;
  border-radius: 10px;
  border: 1px solid #EBE8E1;
  box-shadow: 0 4px 11px rgba(15, 23, 42, 0.035);
  overflow: hidden;
}

.form-row {
  border-bottom: 1px solid #F4F4F1;
}

.form-row:last-child { border-bottom: none; }

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 15px;
  font-size: 14px;
  color: #1F1F1F;
  box-sizing: border-box;
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
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 999px;
  border: 2px solid #A09080;
  color: #A09080;
  font-size: 15px;
  font-weight: 700;
  background: #FFFFFF;
}

.btn-save--disabled {
  border-color: #E0DDD5;
  color: #C0BDB5;
}
</style>
