<template>
  <div class="panel">
    <div class="toolbar">
      <div class="searchbar">
        <el-input
          v-model="keyword"
          placeholder="搜索用户名/邮箱"
          clearable
          style="width: 260px"
          @keyup.enter="load"
        />
        <el-button :loading="loading" @click="load">查询</el-button>
      </div>
    </div>
    <el-table :data="users" border v-loading="loading" empty-text="暂无用户">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" min-width="150" />
      <el-table-column prop="email" label="邮箱" min-width="200" />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'info'" disable-transitions>
            {{ row.role || 'USER' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'BANNED' ? 'danger' : 'success'" disable-transitions>
            {{ row.status || 'NORMAL' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="180" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="toggleRole(row)">{{ row.role === 'ADMIN' ? '降为普通' : '升为管理' }}</el-button>
          <el-button size="small" :type="row.status === 'BANNED' ? 'success' : 'warning'" @click="toggleStatus(row)">
            {{ row.status === 'BANNED' ? '解封' : '封禁' }}
          </el-button>
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
import { ElMessage } from 'element-plus'
import http from '../api/request'

const users = ref([])
const keyword = ref('')
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

async function load() {
  loading.value = true
  try {
    const res = await http.get('/admin/users', { params: { page: page.value, pageSize: pageSize.value, keyword: keyword.value } })
    if (res && res.records) {
      users.value = res.records
      total.value = res.total
    }
  } finally {
    loading.value = false
  }
}

async function toggleRole(row) {
  const newRole = row.role === 'ADMIN' ? 'USER' : 'ADMIN'
  await http.put(`/admin/users/${row.id}/role`, { role: newRole })
  ElMessage.success(`已${newRole === 'ADMIN' ? '提升为管理员' : '降级为普通用户'}`)
  load()
}

async function toggleStatus(row) {
  const newStatus = row.status === 'BANNED' ? 'NORMAL' : 'BANNED'
  await http.put(`/admin/users/${row.id}/status`, { status: newStatus })
  ElMessage.success(newStatus === 'BANNED' ? '已封禁' : '已解封')
  load()
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
