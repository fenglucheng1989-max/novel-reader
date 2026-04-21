<template>
  <div class="panel import-page">
    <el-form label-width="90px">
      <el-form-item label="网页 URL">
        <div class="inline-action">
          <el-input v-model="url" placeholder="输入小说网页地址" clearable />
          <el-button type="primary" :loading="previewing" @click="loadPreview">预览</el-button>
        </div>
      </el-form-item>
    </el-form>

    <el-divider v-if="preview" />

    <el-form v-if="preview" label-width="90px" :model="form">
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
      <el-form-item label="简介">
        <el-input v-model="form.description" type="textarea" :rows="4" />
      </el-form-item>
      <el-form-item label="章节标题">
        <el-input v-model="form.chapterTitle" />
      </el-form-item>
      <el-form-item label="正文">
        <el-input v-model="form.content" type="textarea" :rows="18" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="submit">确认入库</el-button>
        <span class="muted">预览字数：{{ preview.wordCount || 0 }}</span>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { confirmImport, listCategories, previewImport } from '../api/admin'

const router = useRouter()
const url = ref('')
const preview = ref(null)
const categories = ref([])
const previewing = ref(false)
const saving = ref(false)
const form = reactive({
  sourceUrl: '',
  title: '',
  author: '',
  categoryId: undefined,
  description: '',
  chapterTitle: '',
  content: ''
})

async function loadPreview() {
  previewing.value = true
  try {
    const res = await previewImport({ url: url.value })
    preview.value = res.data
    Object.assign(form, res.data)
    if (!form.categoryId && categories.value.length > 0) {
      form.categoryId = categories.value[0].id
    }
  } finally {
    previewing.value = false
  }
}

async function submit() {
  saving.value = true
  try {
    const res = await confirmImport(form)
    ElMessage.success('已导入')
    router.push(`/books/${res.data.id}/chapters`)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  categories.value = (await listCategories()).data || []
})
</script>
