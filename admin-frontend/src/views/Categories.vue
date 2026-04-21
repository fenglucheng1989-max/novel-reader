<template>
  <div class="panel">
    <div class="toolbar">
      <h3>分类管理</h3>
      <el-button type="primary" @click="openEditor()">新增分类</el-button>
    </div>
    <el-table :data="categories" border v-loading="loading" empty-text="暂无分类">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column prop="parentId" label="父级 ID" width="120" />
      <el-table-column prop="sortOrder" label="排序" width="100" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="openEditor(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="editingId ? '编辑分类' : '新增分类'" width="420px">
      <el-form label-width="80px" :model="form">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="父级 ID">
          <el-input-number v-model="form.parentId" :min="0" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createCategory, deleteCategory, listCategories, updateCategory } from '../api/admin'

const categories = ref([])
const visible = ref(false)
const editingId = ref(null)
const loading = ref(false)
const saving = ref(false)
const form = reactive({
  name: '',
  parentId: 0,
  sortOrder: 0
})

async function load() {
  loading.value = true
  try {
    categories.value = (await listCategories()).data || []
  } finally {
    loading.value = false
  }
}

function openEditor(row) {
  editingId.value = row?.id || null
  form.name = row?.name || ''
  form.parentId = row?.parentId || 0
  form.sortOrder = row?.sortOrder || 0
  visible.value = true
}

async function submit() {
  if (!form.name.trim()) {
    ElMessage.warning('请填写分类名称')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateCategory(editingId.value, form)
    } else {
      await createCategory(form)
    }
    visible.value = false
    ElMessage.success('已保存')
    load()
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  await ElMessageBox.confirm('确定删除该分类吗？', '删除确认', { type: 'warning' })
  await deleteCategory(id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>
