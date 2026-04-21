<template>
  <div class="import-center">
    <section class="import-hero panel">
      <div>
        <p class="eyebrow">Import Center</p>
        <h2>导入中心</h2>
        <p>支持网页 URL 和 TXT 文件导入。导入前先预览清洗结果，确认后再写入书籍与章节。</p>
      </div>
      <div class="hero-stats">
        <div>
          <strong>{{ preview?.chapterCount || 0 }}</strong>
          <span>预览章节</span>
        </div>
        <div>
          <strong>{{ preview?.wordCount || 0 }}</strong>
          <span>预览字数</span>
        </div>
      </div>
    </section>

    <section class="panel source-panel">
      <el-tabs v-model="sourceMode">
        <el-tab-pane label="网页 URL" name="url">
          <el-form label-width="92px">
            <el-form-item label="网页地址">
              <div class="inline-action">
                <el-input v-model="url" placeholder="输入小说章节或文章网页地址" clearable />
                <el-button type="primary" :loading="previewing" @click="loadUrlPreview">抓取预览</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="TXT 文件" name="txt">
          <el-upload
            drag
            action=""
            accept=".txt,text/plain"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleTxtChange"
          >
            <div class="upload-box">
              <div class="upload-icon">TXT</div>
              <div class="upload-title">拖入或选择 TXT 文件</div>
              <div class="upload-subtitle">自动识别 UTF-8 / GB18030，并按“第 x 章 / Chapter x”切分章节</div>
            </div>
          </el-upload>
          <div class="upload-action">
            <span class="muted no-margin">{{ txtFile?.name || '尚未选择文件' }}</span>
            <el-button type="primary" :loading="previewing" :disabled="!txtFile" @click="loadTxtPreview">解析预览</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <section v-if="preview" class="import-workbench">
      <div class="panel meta-panel">
        <div class="section-title">书籍信息</div>
        <el-form label-width="78px" :model="form">
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
          <el-form-item label="来源">
            <el-input v-model="form.sourceUrl" disabled />
          </el-form-item>
          <el-form-item label="简介">
            <el-input v-model="form.description" type="textarea" :rows="5" />
          </el-form-item>
        </el-form>
      </div>

      <div class="panel chapters-panel">
        <div class="chapter-head">
          <div>
            <div class="section-title">章节预览</div>
            <p>{{ form.chapters.length }} 章，确认后会按当前顺序入库。</p>
          </div>
          <el-button type="primary" :loading="saving" @click="submit">确认入库</el-button>
        </div>

        <div class="chapter-layout">
          <div class="chapter-list">
            <button
              v-for="(chapter, index) in form.chapters"
              :key="index"
              class="chapter-item"
              :class="{ active: activeChapterIndex === index }"
              type="button"
              @click="activeChapterIndex = index"
            >
              <span>{{ chapter.chapterNo || index + 1 }}</span>
              <strong>{{ chapter.title }}</strong>
              <em>{{ chapter.wordCount || countWords(chapter.content) }} 字</em>
            </button>
          </div>
          <div v-if="activeChapter" class="chapter-editor">
            <el-input v-model="activeChapter.title" class="title-input" />
            <el-input v-model="activeChapter.content" type="textarea" :rows="20" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { confirmImport, listCategories, previewImport, previewTxtImport } from '../api/admin'

const router = useRouter()
const sourceMode = ref('url')
const url = ref('')
const txtFile = ref(null)
const preview = ref(null)
const categories = ref([])
const previewing = ref(false)
const saving = ref(false)
const activeChapterIndex = ref(0)
const form = reactive({
  sourceUrl: '',
  sourceType: 'EXTERNAL',
  title: '',
  author: '',
  categoryId: undefined,
  description: '',
  chapterTitle: '',
  content: '',
  chapters: []
})

const activeChapter = computed(() => form.chapters[activeChapterIndex.value])

function resetPreview(data) {
  preview.value = data
  Object.assign(form, {
    sourceUrl: data.sourceUrl || '',
    sourceType: data.sourceType || (sourceMode.value === 'txt' ? 'FILE' : 'EXTERNAL'),
    title: data.title || '',
    author: data.author || '',
    categoryId: form.categoryId,
    description: data.description || '',
    chapterTitle: data.chapterTitle || '',
    content: data.content || '',
    chapters: (data.chapters || []).map((item, index) => ({
      chapterNo: item.chapterNo || index + 1,
      title: item.title || `第 ${index + 1} 章`,
      content: item.content || '',
      wordCount: item.wordCount || countWords(item.content)
    }))
  })
  if (!form.categoryId && categories.value.length > 0) {
    form.categoryId = categories.value[0].id
  }
  activeChapterIndex.value = 0
}

async function loadUrlPreview() {
  if (!url.value.trim()) {
    ElMessage.warning('请输入网页 URL')
    return
  }
  previewing.value = true
  try {
    const res = await previewImport({ url: url.value.trim() })
    resetPreview(res.data)
  } finally {
    previewing.value = false
  }
}

function handleTxtChange(file) {
  txtFile.value = file.raw
}

async function loadTxtPreview() {
  if (!txtFile.value) {
    ElMessage.warning('请选择 TXT 文件')
    return
  }
  const data = new FormData()
  data.append('file', txtFile.value)
  previewing.value = true
  try {
    const res = await previewTxtImport(data)
    resetPreview(res.data)
  } finally {
    previewing.value = false
  }
}

async function submit() {
  if (!form.title.trim()) {
    ElMessage.warning('请填写书名')
    return
  }
  if (!form.categoryId) {
    ElMessage.warning('请选择分类')
    return
  }
  if (!form.chapters.length || form.chapters.some((item) => !item.title.trim() || !item.content.trim())) {
    ElMessage.warning('请检查章节标题和正文')
    return
  }
  saving.value = true
  try {
    const payload = {
      ...form,
      chapterTitle: form.chapters[0].title,
      content: form.chapters[0].content,
      chapters: form.chapters.map((item, index) => ({
        chapterNo: index + 1,
        title: item.title,
        content: item.content
      }))
    }
    const res = await confirmImport(payload)
    ElMessage.success('已导入书籍和章节')
    router.push(`/books/${res.data.id}/chapters`)
  } finally {
    saving.value = false
  }
}

function countWords(content) {
  return (content || '').replace(/\s+/g, '').length
}

onMounted(async () => {
  categories.value = (await listCategories()).data || []
})
</script>
