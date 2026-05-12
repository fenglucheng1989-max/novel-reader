<template>
  <view class="page">
    <!-- Section Menu -->
    <template v-if="section === 'about'">
      <view class="page-hero">
        <text class="page-title">关于悦读</text>
        <text class="page-sub">用户协议与隐私政策</text>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="section = 'terms'; load()">
          <view class="menu-icon"><text class="menu-icon-text">&#x1F4C4;</text></view>
          <view class="menu-copy">
            <text class="menu-title">用户协议</text>
            <text class="menu-sub">使用条款与服务说明</text>
          </view>
          <text class="menu-arrow">&#8250;</text>
        </view>
        <view class="menu-item" @tap="section = 'privacy'; load()">
          <view class="menu-icon"><text class="menu-icon-text">&#x1F6E1;</text></view>
          <view class="menu-copy">
            <text class="menu-title">隐私政策</text>
            <text class="menu-sub">信息收集与保护说明</text>
          </view>
          <text class="menu-arrow">&#8250;</text>
        </view>
      </view>
    </template>

    <!-- Document Viewer -->
    <template v-else>
      <view class="page-hero">
        <text class="back" @tap="section = 'about'">&#8249; 关于悦读</text>
        <text class="page-title">{{ section === 'terms' ? '用户协议' : '隐私政策' }}</text>
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
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '../../utils/request'

interface DocSection {
  title: string
  body: string
}

interface LegalDocument {
  title?: string
  version?: string
  content?: string
}

const FALLBACK: Record<string, { title: string; content: string }> = {
  terms: {
    title: '用户协议',
    content: '欢迎使用悦读\n感谢您使用悦读。悦读是一款个人阅读管理工具。\n\n服务说明\n悦读为您提供书籍浏览、书架管理、阅读进度同步等功能。\n\n账号与安全\n请妥善保管您的账号和密码。\n\n用户行为规范\n使用悦读时应遵守相关法律法规。\n\n知识产权\n书籍内容归原作者或版权方所有。\n\n免责声明\n悦读按现状提供服务。\n\n协议更新\n我们可能根据需要更新本协议。\n\n联系我们\nyuedu@example.com',
  },
  privacy: {
    title: '隐私政策',
    content: '信息收集\n我们仅收集提供服务所必需的信息。\n\n信息使用\n用于创建和管理您的账号、同步阅读数据。\n\n信息存储\n您的数据存储在安全的服务器上。\n\n信息共享\n我们不会将个人信息出售或分享给第三方。\n\nCookie 与缓存\n本地存储必要的缓存以提升体验。\n\n用户权利\n您可以查看、修改或删除账号信息。\n\n儿童隐私\n不面向13岁以下儿童。\n\n政策更新\n更新后通过应用内通知告知。\n\n联系我们\nyuedu@example.com',
  },
}

const section = ref<'about' | 'terms' | 'privacy'>('about')
const loading = ref(false)
const docTitle = ref('')
const docVersion = ref('')
const sections = ref<DocSection[]>([])

function parseContent(content: string): DocSection[] {
  const lines = String(content || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const result: DocSection[] = []
  for (let i = 0; i < lines.length; i += 2) {
    result.push({ title: lines[i] || '说明', body: lines[i + 1] || '' })
  }
  return result.length > 0 ? result : [{ title: '说明', body: String(content || '') }]
}

async function load(): Promise<void> {
  loading.value = true
  const type = section.value === 'terms' ? 'TERMS' : 'PRIVACY'
  try {
    const res = await request({ url: `/api/v1/legal-documents/latest/${type}`, noAuth: true, silent: true })
    if (res.code === 200 && res.data) {
      const data = res.data as LegalDocument
      docTitle.value = data.title || FALLBACK[section.value].title
      docVersion.value = data.version || ''
      sections.value = parseContent(data.content || '')
    } else {
      useFallback()
    }
  } catch {
    useFallback()
  } finally {
    loading.value = false
  }
}

function useFallback(): void {
  const fb = FALLBACK[section.value]
  docTitle.value = fb.title
  docVersion.value = ''
  sections.value = parseContent(fb.content)
}

onLoad((query) => {
  if (query?.section && (query.section === 'terms' || query.section === 'privacy')) {
    section.value = query.section
    load()
  } else {
    section.value = 'about'
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

.page-hero {
  padding: 10px 5px 14px;
}

.back {
  display: block;
  color: #A09080;
  font-size: 13px;
  margin-bottom: 6px;
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

/* ── Menu ── */
.menu-group {
  background: #FFFFFF;
  border-radius: 9px;
  box-shadow: 0 4px 11px rgba(15, 23, 42, 0.045);
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

/* ── State ── */
.state {
  padding: 64px 0;
  color: #8C8C8C;
  text-align: center;
  font-size: 14px;
}

/* ── Document ── */
.content-card {
  padding: 20px;
  border-radius: 9px;
  background: #FFFFFF;
  box-shadow: 0 4px 11px rgba(15, 23, 42, 0.045);
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
