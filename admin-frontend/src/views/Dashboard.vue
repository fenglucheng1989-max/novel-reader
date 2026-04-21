<template>
  <div>
    <div class="toolbar">
      <h2>概览</h2>
      <el-button type="primary" @click="$router.push('/books/new')">新增书籍</el-button>
    </div>
    <el-row :gutter="16" v-loading="loading">
      <el-col v-for="item in cards" :key="item.label" :span="6">
        <el-card shadow="never">
          <div class="metric-value">{{ item.value }}</div>
          <div class="metric-label">{{ item.label }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { dashboard } from '../api/admin'

const data = ref({})
const loading = ref(false)
const cards = computed(() => [
  { label: '书籍', value: data.value.bookCount || 0 },
  { label: '章节', value: data.value.chapterCount || 0 },
  { label: '分类', value: data.value.categoryCount || 0 },
  { label: '用户', value: data.value.userCount || 0 }
])

onMounted(async () => {
  loading.value = true
  try {
    const res = await dashboard()
    data.value = res.data || {}
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.metric-value {
  font-size: 34px;
  font-weight: 700;
}

.metric-label {
  margin-top: 8px;
  color: #7a8580;
}
</style>
