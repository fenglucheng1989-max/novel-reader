<template>
  <view class="page">
    <view class="topbar">
      <text class="back" @tap="goBack">&#8249; 返回</text>
      <text class="title">{{ section === 'terms' ? '用户协议' : '隐私政策' }}</text>
      <text class="placeholder"></text>
    </view>

    <view v-if="loading" class="state">加载中...</view>
    <view v-else class="content-card">
      <text class="doc-title">{{ docTitle }}</text>
      <text v-if="docVersion" class="doc-version">版本 {{ docVersion }}</text>

      <view v-for="block in sections" :key="block.title" class="doc-section">
        <text class="section-title">{{ block.title }}</text>
        <text class="section-body">{{ block.body }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '../../utils/request'

const FALLBACK = {
  terms: {
    title: '用户协议',
    content: '欢迎使用悦读\n感谢您使用悦读。悦读是一款个人阅读管理工具。\n\n服务说明\n悦读为您提供书籍浏览、书架管理、阅读进度同步等功能。\n\n账号与安全\n请妥善保管您的账号和密码。\n\n用户行为规范\n使用悦读时应遵守相关法律法规。\n\n知识产权\n书籍内容归原作者或版权方所有。\n\n免责声明\n悦读按现状提供服务。\n\n协议更新\n我们可能根据需要更新本协议。\n\n联系我们\nyuedu@example.com'
  },
  privacy: {
    title: '隐私政策',
    content: '信息收集\n我们仅收集提供服务所必需的信息。\n\n信息使用\n用于创建和管理您的账号、同步阅读数据。\n\n信息存储\n您的数据存储在安全的服务器上。\n\n信息共享\n我们不会将个人信息出售或分享给第三方。\n\nCookie 与缓存\n本地存储必要的缓存以提升体验。\n\n用户权利\n您可以查看、修改或删除账号信息。\n\n儿童隐私\n不面向13岁以下儿童。\n\n政策更新\n更新后通过应用内通知告知。\n\n联系我们\nyuedu@example.com'
  }
}

const section = ref('terms')
const loading = ref(false)
const docTitle = ref('')
const docVersion = ref('')
const sections = ref([])

function parseContent(content) {
  const lines = String(content || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const result = []
  for (let i = 0; i < lines.length; i += 2) {
    result.push({
      title: lines[i] || '说明',
      body: lines[i + 1] || ''
    })
  }
  return result.length > 0 ? result : [{ title: '说明', body: String(content || '') }]
}

async function load() {
  loading.value = true
  const type = section.value === 'terms' ? 'TERMS' : 'PRIVACY'
  try {
    const res = await request({
      url: `/api/v1/legal-documents/latest/${type}`,
      noAuth: true,
      silent: true
    })
    if (res.code === 200 && res.data) {
      docTitle.value = res.data.title || FALLBACK[section.value].title
      docVersion.value = res.data.version || ''
      sections.value = parseContent(res.data.content)
    } else {
      useFallback()
    }
  } catch {
    useFallback()
  } finally {
    loading.value = false
  }
}

function useFallback() {
  const fb = FALLBACK[section.value]
  docTitle.value = fb.title
  docVersion.value = ''
  sections.value = parseContent(fb.content)
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.switchTab({ url: '/pages/mine/mine' })
}

onLoad((query) => {
  if (query?.section === 'privacy') section.value = 'privacy'
  else section.value = 'terms'
  load()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 16px 32px;
  background: #F4F4F1;
  box-sizing: border-box;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.back {
  color: #8C8C8C;
  font-size: 15px;
}

.title {
  color: #1F1F1F;
  font-size: 17px;
  font-weight: 900;
}

.placeholder {
  width: 48px;
}

.state {
  padding: 64px 0;
  color: #8C8C8C;
  text-align: center;
  font-size: 14px;
}

.content-card {
  padding: 20px;
  border-radius: 7px;
  background: #FFFFFF;
  box-shadow: 0 6px 18px rgba(31, 31, 31, 0.045);
}

.doc-title {
  display: block;
  color: #1F1F1F;
  font-size: 20px;
  font-weight: 900;
}

.doc-version {
  display: block;
  margin-top: 4px;
  color: #B0B0B0;
  font-size: 12px;
}

.doc-section {
  margin-top: 20px;
}

.section-title {
  display: block;
  color: #1F1F1F;
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 6px;
}

.section-body {
  display: block;
  color: #5A5A5A;
  font-size: 14px;
  line-height: 24px;
  word-break: break-word;
}
</style>
