<template>
  <view class="page">
    <view class="search-row">
      <input
        v-model="keyword"
        class="input"
        confirm-type="search"
        placeholder="搜索书名或作者"
        focus
        @confirm="doSearch"
      />
      <button class="button" @tap="doSearch">搜索</button>
    </view>

    <view v-if="loading" class="empty">正在搜索...</view>
    <view v-else-if="searched && !results.length" class="empty">没有找到相关书籍</view>
    <view v-else-if="!searched" class="empty hint">输入关键词，查找书名或作者</view>
    <view v-if="!searched" class="quick-tags">
      <view
        v-for="tag in quickTags"
        :key="tag"
        class="quick-tag"
        @tap="searchTag(tag)"
      >{{ tag }}</view>
    </view>
    <view v-else class="list">
      <view v-for="book in results" :key="book.id" class="item" @tap="goDetail(book.id)">
        <view class="cover">{{ coverText(book.title) }}</view>
        <view class="info">
          <text class="name">{{ book.title }}</text>
          <text class="meta">{{ book.author || '佚名' }}</text>
          <view class="desc">{{ book.description || '暂无简介' }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'

const bookStore = useBookStore()
const keyword = ref('')
const loading = ref(false)
const searched = ref(false)
const results = ref([])
const quickTags = ['玄幻', '都市', '悬疑', '热血', '重生', '完结']

async function doSearch() {
  if (!keyword.value.trim()) {
    results.value = []
    searched.value = false
    uni.showToast({ title: '请输入关键词', icon: 'none' })
    return
  }
  loading.value = true
  searched.value = true
  try {
    const res = await bookStore.search(keyword.value.trim())
    results.value = res.code === 200 ? (res.data || []) : []
  } finally {
    loading.value = false
  }
}

function searchTag(tag) {
  keyword.value = tag
  doSearch()
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function coverText(title) {
  return (title || '书').slice(0, 2)
}

onLoad((options) => {
  if (options?.keyword) {
    keyword.value = decodeURIComponent(options.keyword)
    doSearch()
  }
})
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  padding: 18px;
  background: #f6f3ee;
  box-sizing: border-box;
  overflow-x: hidden;
}

.search-row {
  display: flex;
  gap: 10px;
}

.input {
  flex: 1;
  height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #e4ddd3;
  background: #fff;
  color: #202a26;
  font-size: 15px;
  box-sizing: border-box;
}

.button {
  width: 72px;
  height: 44px;
  line-height: 44px;
  border-radius: 8px;
  background: #2f6f5e;
  color: #fff;
  font-size: 14px;
}

.empty {
  padding: 70px 0;
  color: #81776c;
  text-align: center;
}

.hint {
  color: #9a8f83;
}

.quick-tags {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: -36px;
}

.quick-tag {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #fff;
  color: #4c5550;
  font-size: 14px;
  font-weight: 800;
}

.list {
  margin-top: 16px;
}

.item {
  display: flex;
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #fff;
}

.cover {
  width: 58px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #2f6f5e;
  color: #fff;
  font-weight: 700;
}

.info {
  flex: 1;
  min-width: 0;
  margin-left: 12px;
}

.name,
.meta,
.desc {
  display: block;
}

.name {
  color: #232a27;
  font-size: 16px;
  font-weight: 700;
}

.meta {
  margin-top: 5px;
  color: #81776c;
  font-size: 13px;
}

.desc {
  width: 100%;
  margin-top: 6px;
  color: #4c5550;
  font-size: 13px;
  line-height: 20px;
  word-break: break-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
