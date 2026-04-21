<template>
  <div class="panel">
    <div class="toolbar">
      <h3>章节管理：{{ bookTitle }}</h3>
      <div>
        <el-button @click="$router.push('/books')">返回书籍</el-button>
        <el-button type="primary" @click="$router.push(`/books/${bookId}/chapters/new`)">新增章节</el-button>
      </div>
    </div>
    <el-table :data="chapters" border>
      <el-table-column prop="chapterNo" label="序号" width="100" />
      <el-table-column prop="title" label="章节标题" min-width="220" />
      <el-table-column prop="wordCount" label="字数" width="120" />
      <el-table-column label="操作" width="190">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/chapters/${row.id}/edit?bookId=${bookId}`)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteChapter, getBook, listChapters } from '../api/admin'

const route = useRoute()
const bookId = route.params.bookId
const chapters = ref([])
const bookTitle = ref('')

async function load() {
  chapters.value = (await listChapters(bookId)).data || []
  const detail = await getBook(bookId)
  bookTitle.value = detail.data.book.title
}

async function remove(id) {
  await ElMessageBox.confirm('确定删除章节吗？', '删除确认', { type: 'warning' })
  await deleteChapter(id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>
