<template>
  <div class="panel">
    <div class="toolbar">
      <div class="searchbar">
        <el-input
          v-model="keyword"
          placeholder="搜索书名/作者"
          clearable
          style="width: 260px"
          @keyup.enter="load"
        />
        <el-select v-model="categoryId" placeholder="全部分类" clearable style="width: 160px">
          <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-button @click="load">查询</el-button>
      </div>
      <el-button type="primary" @click="$router.push('/books/new')">新增书籍</el-button>
    </div>
    <el-table :data="books" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="书名" min-width="180" />
      <el-table-column prop="author" label="作者" width="140" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="chapterCount" label="章节" width="90" />
      <el-table-column prop="wordCount" label="字数" width="110" />
      <el-table-column prop="sourceType" label="来源" width="110" />
      <el-table-column label="操作" width="310" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/books/${row.id}/chapters`)">章节</el-button>
          <el-button size="small" @click="$router.push(`/books/${row.id}/edit`)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteBook, listBooks, listCategories } from '../api/admin'

const books = ref([])
const categories = ref([])
const keyword = ref('')
const categoryId = ref()

async function load() {
  const res = await listBooks({ keyword: keyword.value, categoryId: categoryId.value })
  books.value = res.data || []
}

async function loadCategoriesData() {
  const res = await listCategories()
  categories.value = res.data || []
}

async function remove(id) {
  await ElMessageBox.confirm('确定删除这本书及其章节吗？', '删除确认', { type: 'warning' })
  await deleteBook(id)
  ElMessage.success('已删除')
  load()
}

onMounted(() => {
  loadCategoriesData()
  load()
})
</script>
