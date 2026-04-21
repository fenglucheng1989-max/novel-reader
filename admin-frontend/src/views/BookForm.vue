<template>
  <div class="panel form-page">
    <el-form label-width="90px" :model="form">
      <el-form-item label="书名">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item label="作者">
        <el-input v-model="form.author" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
          <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width: 100%">
          <el-option label="连载" value="ONGOING" />
          <el-option label="完结" value="COMPLETED" />
          <el-option label="暂停" value="PAUSED" />
        </el-select>
      </el-form-item>
      <el-form-item label="封面 URL">
        <el-input v-model="form.coverUrl" />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="form.sortOrder" :min="0" />
      </el-form-item>
      <el-form-item label="简介">
        <el-input v-model="form.description" type="textarea" :rows="6" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">保存</el-button>
        <el-button @click="$router.back()">返回</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createBook, getBook, listCategories, updateBook } from '../api/admin'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const categories = ref([])
const form = reactive({
  title: '',
  author: '',
  categoryId: undefined,
  description: '',
  coverUrl: '',
  status: 'ONGOING',
  sourceType: 'MANUAL',
  sortOrder: 0
})

async function submit() {
  if (id) {
    await updateBook(id, form)
  } else {
    await createBook(form)
  }
  ElMessage.success('已保存')
  router.push('/books')
}

onMounted(async () => {
  categories.value = (await listCategories()).data || []
  if (id) {
    const res = await getBook(id)
    Object.assign(form, res.data.book)
  }
})
</script>
