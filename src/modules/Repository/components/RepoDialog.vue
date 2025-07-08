<template>
  <v-dialog v-model="dialogVisible" max-width="600px" persistent>
    <v-card class="create-dialog">
      <v-card-title class="dialog-header">
        <div class="header-content">
          <v-icon color="primary" size="32" class="mr-3">mdi-folder-plus</v-icon>
          <div>
            <h2 class="dialog-title">创建新仓库</h2>
            <p class="dialog-subtitle">选择文件夹并设置仓库信息</p>
          </div>
        </div>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="dialog-content">
        <v-form ref="form" class="repo-form">
          <!-- 路径选择 -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon class="mr-2" color="primary">mdi-folder-outline</v-icon>
              仓库位置
            </h3>
            <v-text-field
              v-model="repoData.path"
              label="仓库路径"
              placeholder="点击右侧按钮选择文件夹"
              readonly
              :rules="[v => !!v || '请选择仓库路径']"
              required
              variant="outlined"
              prepend-inner-icon="mdi-folder"
            >
              <template v-slot:append>
                <v-btn
                  color="primary"
                  variant="tonal"
                  @click="selectFolder"
                  class="select-btn"
                >
                  选择文件夹
                </v-btn>
              </template>
            </v-text-field>
            
            <v-text-field
              v-model="repoData.title"
              label="仓库名称"
              placeholder="自动从文件夹名称获取"
              variant="outlined"
              prepend-inner-icon="mdi-format-title"
              :rules="[v => !!v || '请输入仓库名称']"
              required
            />
          </div>

          <!-- 基本信息 -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon class="mr-2" color="success">mdi-information</v-icon>
              基本信息
            </h3>
            <v-textarea
              v-model="repoData.description"
              label="仓库描述"
              placeholder="描述这个仓库的用途和内容（可选）"
              rows="3"
              variant="outlined"
              prepend-inner-icon="mdi-text"
              counter="200"
            />
          </div>

          <!-- 关联设置 -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon class="mr-2" color="warning">mdi-target</v-icon>
              关联设置
            </h3>
            <v-select
              v-model="repoData.relativeGoalId"
              :items="availableGoals"
              item-title="title"
              item-value="id"
              label="关联目标"
              placeholder="选择要关联的目标（可选）"
              clearable
              variant="outlined"
              prepend-inner-icon="mdi-bullseye-arrow"
            >
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-title>暂无可关联的目标</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>
          </div>
        </v-form>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions class="dialog-actions">
        <v-spacer />
        <v-btn 
          variant="text" 
          @click="closeDialog"
          class="cancel-btn"
        >
          取消
        </v-btn>
        <v-btn 
          color="primary" 
          variant="elevated"
          @click="createRepo"
          :loading="creating"
          class="create-btn"
        >
          <v-icon start>mdi-plus</v-icon>
          创建仓库
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { fileSystem } from '@/shared/utils/fileUtils';
import { useRepositoryStore } from '../stores/repositoryStore'
import { useGoalStore } from '@/modules/Goal/presentation/stores/goalStore'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const repoStore = useRepositoryStore()
const goalStore = useGoalStore()
const form = ref()
const creating = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const availableGoals = computed(() => {
  return goalStore.goals.map(goal => ({
    id: goal.id,
    title: goal.title,
  }))
})

const repoData = ref({
  title: '',
  path: '',
  description: '',
  relativeGoalId: '',
})

const selectFolder = async () => {
  try {
    const response = await fileSystem.selectFolder();
    if (response.success) {
      if (!response.data) {
        throw new Error('未选择文件夹')
      }
      repoData.value.path = response.data.folderPath
      repoData.value.title = window.shared.path.basename(response.data.folderPath)
    }
  } catch (error) {
    console.error('选择文件夹失败:', error)
  }
}

const createRepo = async () => {
  const { valid } = await form.value.validate()
  if (valid) {
    if (repoStore.repositories.some(r => r.title === repoData.value.title)) {
      alert('该文件夹已被添加为仓库')
      return
    }
    
    creating.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // 模拟创建延迟
      repoStore.addRepository(repoData.value)
      closeDialog()
    } finally {
      creating.value = false
    }
  }
}

const closeDialog = () => {
  dialogVisible.value = false
  repoData.value = {
    title: '',
    path: '',
    description: '',
    relativeGoalId: '',
  }
}
</script>

<style scoped>
.create-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05), rgba(var(--v-theme-secondary), 0.05));
  padding: 1.5rem 2rem;
}

.header-content {
  display: flex;
  align-items: center;
}

.dialog-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.dialog-subtitle {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0.25rem 0 0 0;
}

.dialog-content {
  padding: 2rem;
}

.repo-form {
  max-width: 100%;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-outline), 0.08);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
}

.select-btn {
  font-weight: 500;
}

.dialog-actions {
  padding: 1rem 2rem;
  background: rgba(var(--v-theme-surface), 0.8);
}

.create-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .dialog-header {
    padding: 1rem;
  }
  
  .dialog-content {
    padding: 1rem;
  }
  
  .form-section {
    padding: 1rem;
  }
}
</style>