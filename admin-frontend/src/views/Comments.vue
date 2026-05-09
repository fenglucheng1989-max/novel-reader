<template>
  <div class="panel">
    <div class="toolbar">
      <div class="searchbar">
        <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 140px" @change="load">
          <el-option label="正常" value="VISIBLE" />
          <el-option label="已隐藏" value="HIDDEN" />
          <el-option label="已删除" value="DELETED" />
        </el-select>
        <el-select v-model="typeFilter" placeholder="全部类型" clearable style="width: 140px" @change="load">
          <el-option label="书评" value="BOOK" />
          <el-option label="章节评论" value="CHAPTER" />
          <el-option label="摘录" value="HIGHLIGHT" />
        </el-select>
        <el-button :loading="loading" @click="load">查询</el-button>
      </div>
    </div>
    <el-table :data="comments" border v-loading="loading" empty-text="暂无评论">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="content" label="内容" min-width="280" show-overflow-tooltip />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag size="small">{{ typeLabel(row.commentType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="bookId" label="书籍ID" width="90" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMeta(row.status).type" size="small">{{ statusMeta(row.status).label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="likeCount" label="点赞" width="80" />
      <el-table-column prop="createdAt" label="时间" width="170" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status !== 'HIDDEN'" size="small" type="warning" @click="setStatus(row.id, 'HIDDEN')">隐藏</el-button>
          <el-button v-if="row.status === 'HIDDEN'" size="small" type="success" @click="setStatus(row.id, 'VISIBLE')">显示</el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrap" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '../api/request'

const comments = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const statusFilter = ref('')
const typeFilter = ref('')

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (statusFilter.value) params.status = statusFilter.value
    if (typeFilter.value) params.commentType = typeFilter.value
    const res = await http.get('/admin/comments', { params })
    if (res && res.records) {
      comments.value = res.records
      total.value = res.total
    }
  } finally {
    loading.value = false
  }
}

async function setStatus(id, status) {
  await http.put(`/admin/comments/${id}/status`, { status })
  ElMessage.success(status === 'HIDDEN' ? '已隐藏' : '已显示')
  load()
}

async function remove(id) {
  await ElMessageBox.confirm('确定删除该评论吗？', '删除确认', { type: 'warning' })
  await http.delete(`/admin/comments/${id}`)
  ElMessage.success('已删除')
  load()
}

function typeLabel(type) {
  if (type === 'BOOK') return '书评'
  if (type === 'CHAPTER') return '章节评论'
  if (type === 'HIGHLIGHT') return '摘录'
  return type || '评论'
}

function statusMeta(status) {
  if (status === 'VISIBLE') return { label: '正常', type: 'success' }
  if (status === 'HIDDEN') return { label: '已隐藏', type: 'warning' }
  return { label: '已删除', type: 'danger' }
}

onMounted(load)
</script>

<style scoped>
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
