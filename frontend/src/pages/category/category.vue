<template>
  <view class="page">
    <view class="category-shell">
      <view class="nav-bar">
        <view class="nav-button" @tap="goBack">‹</view>
        <scroll-view class="segment-row" scroll-x>
          <view
            v-for="item in genderTabs"
            :key="item.key"
            class="segment-item"
            :class="{ active: activeGender === item.key }"
            @tap="activeGender = item.key"
          >{{ item.name }}</view>
        </scroll-view>
      </view>

      <view class="content-card">
        <view class="rail">
          <view
            v-for="group in groups"
            :key="group.key"
            class="rail-item"
            :class="{ active: activeGroup === group.key }"
            @tap="activeGroup = group.key"
          >{{ group.name }}</view>
        </view>

        <scroll-view class="tag-scroll" scroll-y>
          <view v-if="activeGroup === 'category'" class="tag-section">
            <view class="section-head">
              <text class="section-title">频道分类</text>
              <text class="section-note">{{ bookStore.categories.length }} 个</text>
            </view>

            <view class="tag-grid">
              <view class="tag-card featured" @tap="chooseCategory(0)">
                <text>推荐</text>
              </view>
              <view
                v-for="item in bookStore.categories"
                :key="item.id"
                class="tag-card"
                :class="{ active: bookStore.selectedCategoryId === item.id }"
                @tap="chooseCategory(item.id)"
              >
                <text>{{ item.name }}</text>
              </view>
            </view>

            <view class="section-head spaced">
              <text class="section-title">热门标签</text>
              <text class="section-note">{{ activeGenderName }}</text>
            </view>
            <view class="tag-grid">
              <view
                v-for="tag in hotTags"
                :key="tag"
                class="tag-card soft"
                @tap="searchTag(tag)"
              >
                <text>{{ tag }}</text>
              </view>
            </view>
          </view>

          <view v-else class="tag-section">
            <view class="section-head">
              <text class="section-title">{{ currentGroup.name }}</text>
              <text class="section-note">偏好标签</text>
            </view>
            <view class="tag-grid">
              <view
                v-for="tag in currentTags"
                :key="tag"
                class="tag-card"
                @tap="searchTag(tag)"
              >
                <text>{{ tag }}</text>
              </view>
            </view>
          </view>

          <view v-if="loading" class="empty">正在整理分类...</view>
          <view v-else-if="activeGroup === 'category' && !bookStore.categories.length" class="empty">
            <text class="empty-title">暂无分类</text>
            <text class="empty-subtitle">可以先在后台维护书籍分类。</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBookStore } from '../../store/book'

const bookStore = useBookStore()
const loading = ref(false)
const activeGender = ref('male')
const activeGroup = ref('category')

const genderTabs = [
  { key: 'male', name: '男生' },
  { key: 'female', name: '女生' },
  { key: 'audio', name: '听书' },
  { key: 'short', name: '短剧' }
]

const groups = [
  { key: 'category', name: '频道' },
  { key: 'theme', name: '主题' },
  { key: 'role', name: '角色' },
  { key: 'plot', name: '情节' }
]

const tagMap = {
  male: {
    hot: ['热血', '升级流', '无限流', '都市脑洞', '玄幻脑洞', '克苏鲁', '游戏体育', '架空', '副本', '求生', '末日', '灵异'],
    theme: ['悬疑', '玄幻', '历史', '都市', '科幻', '奇幻', '武侠', '仙侠', '末世', '游戏', '体育', '脑洞'],
    role: ['少年', '剑客', '医生', '学生', '侦探', '商人', '修士', '反派', '群像', '异能者', '穿越者', '凡人'],
    plot: ['开局', '复仇', '升级', '种田', '探案', '冒险', '权谋', '日常', '求生', '无限流', '副本', '逆袭']
  },
  female: {
    hot: ['古言', '现言', '女强', '甜宠', '宫斗', '重生', '穿越', '先婚后爱', '豪门', '权谋', '种田', '破镜重圆'],
    theme: ['古代言情', '现代言情', '幻想言情', '悬疑恋爱', '青春', '职场', '宫廷', '宅斗', '仙侠', '年代', '田园', '娱乐圈'],
    role: ['女主', '将军', '公主', '医妃', '影后', '总裁', '学霸', '王爷', '反派', '群像', '青梅竹马', '大女主'],
    plot: ['重生', '穿越', '复仇', '甜宠', '虐恋', '追妻', '契约', '婚恋', '成长', '逆袭', '破案', '日久生情']
  },
  audio: {
    hot: ['精品听书', '睡前故事', '多人剧', '悬疑有声', '历史评书', '都市爽文', '玄幻热血', '短篇', '长篇', '新书上架', '完结必听', '高分'],
    theme: ['悬疑', '历史', '都市', '玄幻', '言情', '科幻', '人文', '评书', '儿童', '职场', '情感', '相声'],
    role: ['单播', '双播', '多人剧', '男声', '女声', '旁白', '精品主播', '新锐主播', '剧场', '作者亲读', '沉浸', '白噪'],
    plot: ['探案', '逆袭', '成长', '冒险', '权谋', '日常', '治愈', '烧脑', '爆笑', '催眠', '热血', '情感']
  },
  short: {
    hot: ['短剧热榜', '反转', '逆袭', '爽感', '甜宠', '战神', '赘婿', '复仇', '豪门', '都市', '古装', '悬疑'],
    theme: ['都市短剧', '古装短剧', '甜宠短剧', '悬疑短剧', '家庭', '职场', '校园', '年代', '奇幻', '权谋', '喜剧', '情感'],
    role: ['霸总', '战神', '赘婿', '千金', '神医', '萌宝', '女强', '反派', '管家', '律师', '警探', '群像'],
    plot: ['逆袭', '复仇', '闪婚', '打脸', '追妻', '掉马', '真假千金', '契约', '重逢', '破案', '救赎', '反转']
  }
}

const currentGroup = computed(() => groups.find((item) => item.key === activeGroup.value) || groups[0])
const activeGenderName = computed(() => genderTabs.find((item) => item.key === activeGender.value)?.name || '男生')
const activeTagSet = computed(() => tagMap[activeGender.value] || tagMap.male)
const currentTags = computed(() => activeTagSet.value[activeGroup.value] || [])
const hotTags = computed(() => activeTagSet.value.hot || [])

async function load() {
  loading.value = true
  try {
    await bookStore.loadCategories()
  } finally {
    loading.value = false
  }
}

function chooseCategory(id) {
  bookStore.selectCategory(id)
  uni.switchTab({ url: '/pages/index/index' })
}

function searchTag(tag) {
  uni.navigateTo({ url: `/pages/search/search?keyword=${encodeURIComponent(tag)}` })
}

function goBack() {
  uni.navigateBack({
    fail: () => uni.switchTab({ url: '/pages/index/index' })
  })
}

onShow(load)
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  padding: 14px 12px 28px;
  background: #f6f3ee;
  box-sizing: border-box;
  overflow-x: hidden;
}

.category-shell {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.nav-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 42px;
  margin-bottom: 12px;
}

.nav-button {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e5ddd2;
  color: #25332e;
  font-size: 28px;
  font-weight: 500;
}

.segment-row {
  min-width: 0;
  flex: 1;
  height: 42px;
  white-space: nowrap;
}

.segment-row :deep(.uni-scroll-view-content) {
  display: flex;
  align-items: center;
  gap: 22px;
  min-height: 42px;
}

.segment-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 42px;
  margin-right: 22px;
  color: #81776c;
  font-size: 15px;
  font-weight: 800;
}

.segment-item.active {
  color: #17221e;
  font-size: 22px;
  font-weight: 900;
}

.segment-item.active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 1px;
  width: 18px;
  height: 3px;
  border-radius: 999px;
  background: #2f6f5e;
  transform: translateX(-50%);
}

.content-card {
  min-height: calc(100vh - 128px);
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(31, 42, 38, 0.06);
}

.rail {
  padding: 12px 0;
  background: #f1eee8;
}

.rail-item {
  position: relative;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #62584d;
  font-size: 14px;
  font-weight: 800;
}

.rail-item.active {
  background: #fff;
  color: #17221e;
}

.rail-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  width: 3px;
  height: 20px;
  border-radius: 0 999px 999px 0;
  background: #2f6f5e;
}

.tag-scroll {
  height: calc(100vh - 128px);
}

.tag-section {
  padding: 16px 12px 22px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-head.spaced {
  margin-top: 22px;
}

.section-title,
.section-note,
.tag-card,
.empty-title,
.empty-subtitle {
  display: block;
}

.section-title {
  color: #1f2a26;
  font-size: 16px;
  font-weight: 900;
}

.section-note {
  color: #9a6b45;
  font-size: 12px;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.tag-card {
  min-width: 0;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 8px;
  background: #f6f3ee;
  color: #2a332f;
  font-size: 14px;
  font-weight: 800;
  box-sizing: border-box;
}

.tag-card text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-card.featured {
  background: #20342d;
  color: #fff;
}

.tag-card.active {
  background: #2f6f5e;
  color: #fff;
}

.tag-card.soft {
  background: #fbfaf7;
  border: 1px solid #efe8df;
}

.empty {
  padding: 44px 0;
  color: #8b8176;
  text-align: center;
}

.empty-title {
  color: #333b37;
  font-size: 17px;
  font-weight: 800;
}

.empty-subtitle {
  margin-top: 8px;
  color: #94897c;
  font-size: 13px;
}

@media (min-width: 720px) {
  .page {
    padding-left: 22px;
    padding-right: 22px;
  }

  .content-card {
    grid-template-columns: 108px minmax(0, 1fr);
  }
}
</style>
