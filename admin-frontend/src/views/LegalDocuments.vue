<template>
  <div class="panel">
    <div class="toolbar">
      <h3>法律文档管理</h3>
      <el-tabs v-model="activeType" @tab-change="load" style="flex:1;margin-left:24px">
        <el-tab-pane label="用户协议" name="TERMS" />
        <el-tab-pane label="隐私政策" name="PRIVACY" />
      </el-tabs>
      <el-button type="primary" @click="openEditor()">新增版本</el-button>
    </div>
    <el-table :data="documents" border v-loading="loading" empty-text="暂无文档">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column prop="version" label="版本" width="140" />
      <el-table-column prop="effectiveDate" label="生效日期" width="130" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" disable-transitions>
            {{ row.enabled ? '当前版本' : '已停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEditor(row)">编辑</el-button>
          <el-button v-if="!row.enabled" size="small" type="primary" @click="activate(row.id)">启用</el-button>
          <el-button size="small" type="warning" @click="viewContent(row)">预览</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="editingId ? '编辑文档' : '新增版本'" width="700px">
      <el-form label-width="100px" :model="form">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="版本号">
          <el-input v-model="form.version" placeholder="例如 2026.06.01" />
        </el-form-item>
        <el-form-item label="生效日期">
          <el-date-picker v-model="form.effectiveDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="12" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" title="文档预览" width="600px">
      <div class="preview-content">{{ previewContent }}</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import http from '../api/request'

const activeType = ref('TERMS')
const documents = ref([])
const loading = ref(false)
const visible = ref(false)
const previewVisible = ref(false)
const previewContent = ref('')
const editingId = ref(null)
const saving = ref(false)
const form = reactive({
  docType: 'TERMS',
  title: '',
  version: '',
  content: '',
  effectiveDate: ''
})

async function load() {
  loading.value = true
  try {
    const res = await http.get('/admin/legal-documents')
    documents.value = (res || []).filter(d => d.docType === activeType.value)
  } finally {
    loading.value = false
  }
}

function openEditor(row) {
  editingId.value = row?.id || null
  form.docType = row?.docType || activeType.value
  form.title = row?.title || ''
  form.version = row?.version || ''
  form.content = row?.content || ''
  form.effectiveDate = row?.effectiveDate || ''
  visible.value = true
}

async function submit() {
  saving.value = true
  try {
    if (editingId.value) {
      await http.put(`/admin/legal-documents/${editingId.value}`, { ...form, enabled: true })
    } else {
      await http.post('/admin/legal-documents', { ...form, enabled: true })
    }
    visible.value = false
    ElMessage.success('已保存')
    load()
  } finally {
    saving.value = false
  }
}

async function activate(id) {
  await http.put(`/admin/legal-documents/${id}/activate`)
  ElMessage.success('已启用该版本')
  load()
}

function viewContent(row) {
  previewContent.value = row.content
  previewVisible.value = true
}

onMounted(load)
</script>

<style scoped>
.preview-content {
  white-space: pre-wrap;
  line-height: 1.8;
  color: #333;
}
</style>
