<template>
  <div class="panel form-page wide-form">
    <el-form label-width="90px" :model="form">
      <el-form-item label="序号">
        <el-input-number v-model="form.chapterNo" :min="1" />
      </el-form-item>
      <el-form-item label="标题">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item label="正文">
        <el-input v-model="form.content" type="textarea" :rows="18" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
        <el-button @click="goBack">返回</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createChapter, getChapter, listChapters, updateChapter } from '../api/admin'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const bookId = route.params.bookId || route.query.bookId
const saving = ref(false)
const form = reactive({
  chapterNo: 1,
  title: '',
  content: ''
})

function goBack() {
  router.push(`/books/${bookId}/chapters`)
}

async function submit() {
  if (!form.title.trim()) {
    ElMessage.warning('请填写章节标题')
    return
  }
  if (!form.content.trim()) {
    ElMessage.warning('请填写章节正文')
    return
  }
  saving.value = true
  try {
    if (id) {
      await updateChapter(id, form)
    } else {
      await createChapter(bookId, form)
    }
    ElMessage.success('已保存')
    goBack()
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (id) {
    const res = await getChapter(id)
    Object.assign(form, res.data)
    return
  }
  const chapters = (await listChapters(bookId)).data || []
  form.chapterNo = chapters.length + 1
})
</script>
