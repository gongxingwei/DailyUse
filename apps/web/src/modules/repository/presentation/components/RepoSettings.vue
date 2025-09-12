<template>
  <v-dialog v-model="dialogVisible" max-width="600px" persistent>
    <v-card class="settings-dialog">
      <v-card-title class="dialog-header">
        <div class="header-content">
          <v-icon color="warning" size="32" class="mr-3">mdi-cog</v-icon>
          <div>
            <h2 class="dialog-title">仓库设置</h2>
            <p class="dialog-subtitle">管理仓库信息和配置</p>
          </div>
        </div>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="dialog-content">
        <v-form ref="form" class="settings-form">
          <!-- 基本信息 -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon class="mr-2" color="primary">mdi-information</v-icon>
              基本信息
            </h3>
            
            <v-text-field
              v-model="repoData.name"
              label="仓库名称"
              :rules="[v => !!v || '请输入仓库名称']"
              required
              variant="outlined"
              prepend-inner-icon="mdi-format-title"
            />

            <v-textarea
              v-model="repoData.description"
              label="仓库描述"
              rows="3"
              variant="outlined"
              prepend-inner-icon="mdi-text"
              counter="200"
            />
            
            <v-select
              v-model="repoData.relatedGoals"
              :items="availableGoals"
              item-title="title"
              item-value="id"
              label="关联目标"
              clearable
              variant="outlined"
              prepend-inner-icon="mdi-target"
            />
          </div>

          <!-- 路径信息 -->
          <div class="form-section info-section">
            <h3 class="section-title">
              <v-icon class="mr-2" color="info">mdi-folder-information</v-icon>
              路径信息
            </h3>
            
            <div class="info-item">
              <div class="info-label">存储路径</div>
              <div class="info-value">{{ repoData.path }}</div>
              <v-btn
                variant="tonal"
                size="small"
                color="info"
                @click="openInExplorer"
                class="ml-2"
              >
                <v-icon start>mdi-folder-open</v-icon>
                打开
              </v-btn>
            </div>
            
            <div class="info-item">
              <div class="info-label">创建时间</div>
              <div class="info-value">{{ (repoData.createdAt) }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">最后更新</div>
              <div class="info-value">{{ (repoData.updatedAt) }}</div>
            </div>
          </div>

          <!-- 危险操作 -->
          <div class="form-section danger-section">
            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title class="danger-title">
                  <v-icon color="error" class="mr-2">mdi-alert</v-icon>
                  危险操作
                </v-expansion-panel-title>
                <v-expansion-panel-text class="danger-content">
                  <v-alert
                    type="warning"
                    variant="tonal"
                    class="mb-4"
                  >
                    <div class="text-body-2">
                      删除仓库将会：<br>
                      • 永久删除仓库文件夹及其所有内容<br>
                      • 移除所有相关配置和关联<br>
                      • 此操作不可恢复
                    </div>
                  </v-alert>
                  
                  <v-text-field
                    v-model="deleteConfirm"
                    label="输入 'DELETE' 确认删除"
                    placeholder="DELETE"
                    variant="outlined"
                    color="error"
                    :rules="[v => v === 'DELETE' || '请输入 DELETE 确认删除']"
                    @keyup.enter="handleDelete"
                  />
                  
                  <v-btn
                    color="error"
                    variant="elevated"
                    block
                    :disabled="deleteConfirm !== 'DELETE'"
                    :loading="deleting"
                    @click="handleDelete"
                    class="delete-btn"
                  >
                    <v-icon start>mdi-delete</v-icon>
                    永久删除仓库
                  </v-btn>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
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
          @click="saveSettings"
          :loading="saving"
          class="save-btn"
        >
          <v-icon start>mdi-content-save</v-icon>
          保存设置
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGoalStore } from '@renderer/modules/Goal/presentation/stores/goalStore'
import { Repository } from '../../domain/aggregates/repository'
import type { IRepository } from '../../domain/types'
const props = defineProps<{
  modelValue: boolean
  repo: Repository | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'handle-delete-repository', repository: Repository): void
}>()

const goalStore = useGoalStore()
const form = ref()
const deleteConfirm = ref('')
const saving = ref(false)
const deleting = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const availableGoals = computed(() => {
  return goalStore.goals.map(goal => ({
    uuid: goal.uuid,
    title: goal.name,
  }))
})

const repoData = ref({
  uuid: '',
  name: '',
  path: '',
  description: '',
  relatedGoals: [],
  createdAt: new Date(),
  updatedAt: new Date()
} as IRepository)


const openInExplorer = () => {
  console.log('打开文件夹:', repoData.value.path)
}

const saveSettings = async () => {
  console.log('保存设置:', repoData.value)
}

const handleDelete = async () => {
  emit('handle-delete-repository', props.repo as Repository)
  
}

const closeDialog = () => {
  dialogVisible.value = false
  deleteConfirm.value = ''
  saving.value = false
  deleting.value = false
}
</script>

<style scoped>
.settings-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-warning), 0.05), rgba(var(--v-theme-primary), 0.05));
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
  max-height: 70vh;
  overflow-y: auto;
}

.settings-form {
  max-width: 100%;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-outline), 0.08);
}

.form-section:not(.info-section):not(.danger-section) {
  background: rgba(var(--v-theme-surface), 0.5);
}

.info-section {
  background: rgba(var(--v-theme-info), 0.05);
  border-color: rgba(var(--v-theme-info), 0.2);
}

.danger-section {
  background: rgba(var(--v-theme-error), 0.05);
  border-color: rgba(var(--v-theme-error), 0.2);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
}

.info-label {
  font-weight: 600;
  min-width: 100px;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.info-value {
  flex: 1;
  color: rgba(var(--v-theme-on-surface), 0.7);
  word-break: break-all;
}

.danger-title {
  font-weight: 600;
}

.danger-content {
  padding-top: 1rem;
}

.delete-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.dialog-actions {
  padding: 1rem 2rem;
  background: rgba(var(--v-theme-surface), 0.8);
}

.save-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 滚动条样式 */
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-outline), 0.05);
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 3px;
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
  
  .info-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .info-label {
    min-width: auto;
  }
}
</style>
