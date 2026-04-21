<template>
  <el-container class="admin-shell">
    <el-aside width="220px" class="sidebar">
      <div class="brand">悦读后台</div>
      <el-menu
        router
        :default-active="$route.path"
        background-color="#1f2a26"
        text-color="#cfd8d3"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/dashboard">概览</el-menu-item>
        <el-menu-item index="/books">书籍管理</el-menu-item>
        <el-menu-item index="/categories">分类管理</el-menu-item>
        <el-menu-item index="/import">URL 导入</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="topbar">
        <div class="page-title">{{ $route.meta.title || '后台管理' }}</div>
        <div class="user-area">
          <span>{{ auth.username }}</span>
          <el-button size="small" @click="logout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.replace('/login')
}
</script>
