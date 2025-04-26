<template>
  <v-dialog v-model="dialogVisible" max-width="500px">
    <v-card>
      <v-card-title>仓库编辑</v-card-title>
      
      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="repoData.title"
            label="仓库名称"
            :rules="[v => !!v || '请输入仓库名称']"
            required
          />

          <v-textarea
            v-model="repoData.description"
            label="仓库描述"
            rows="3"
          />
          
          <!-- 关联目标 -->
          <v-select
            v-model="repoData.relativeGoalId"
            :items="availableGoals"
            item-title="title"
            item-value="id"
            label="关联目标"
            clearable
          />

          <v-divider class="my-4"></v-divider>
          
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title class="text-error">
                危险区域
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <p class="mb-4">删除仓库将永久删除所有相关数据，此操作不可恢复。</p>
                <v-text-field
                  v-model="deleteConfirm"
                  label="输入 'delete' 确认删除"
                  :rules="[v => v === 'delete' || '请输入 delete 确认']"
                  @keyup.enter="handleDelete"
                />
                <v-btn
                  color="error"
                  block
                  :disabled="deleteConfirm !== 'delete'"
                  @click="handleDelete"
                >
                  删除仓库
                </v-btn>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn color="error" @click="closeDialog">取消</v-btn>
        <v-btn color="primary" @click="saveSettings">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRepositoryStore } from '../stores/repositoryStore'
import { useGoalStore } from '@/modules/Goal/stores/goalStore'
import type { Repository } from '../stores/repositoryStore'
import { fileSystem } from '@/shared/utils/fileSystem'

const props = defineProps<{
  modelValue: boolean
  repo: Repository | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const router = useRouter()
const repoStore = useRepositoryStore()
const goalStore = useGoalStore()
const form = ref()
const deleteConfirm = ref('')

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 计算属性，获取所有目标
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
  createTime: '',
  updateTime: ''
} as Repository)

watch(() => props.repo, (newRepo) => {
  if (newRepo) {
    repoData.value = { ...newRepo }
  }
}, { immediate: true })

const saveSettings = async () => {
  const { valid } = await form.value.validate()
  if (valid && props.repo) {
    try {
      // 如果仓库名称改变了，需要重命名文件夹
      if (repoData.value.title !== props.repo.title) {
        // 构建新路径
        const oldPath = props.repo.path
        const parentPath = window.shared.path.dirname(oldPath)
        const newPath = window.shared.path.join(parentPath, repoData.value.title)

        const success = await fileSystem.rename(oldPath, newPath)

        if (success) {
          // 更新路径
          repoData.value.path = newPath
        } else {
          throw new Error('重命名文件夹失败')
        }
      }

      // 更新仓库信息
      repoStore.$patch((state) => {
        const index = state.repositories.findIndex(r => r.title === props.repo?.title)
        if (index !== -1) {
          state.repositories[index] = {
            ...state.repositories[index],
            ...repoData.value,
            updateTime: new Date().toISOString()
          }
        }
      })
      closeDialog()
      router.push(`/repository`)
    } catch (error) {
      console.error('更新仓库失败:', error)
      alert('更新仓库失败，请检查文件夹权限或是否被占用')
    }
  }
}

const handleDelete = async () => {
  if (deleteConfirm.value === 'delete' && props.repo) {
    try {
      // 先删除文件夹
      await fileSystem.delete(props.repo.path, true)
      
      // 再从 store 中移除
      repoStore.$patch((state) => {
        state.repositories = state.repositories.filter(r => r.title !== props.repo?.title)
      })
      
      closeDialog()
      router.push('/')
    } catch (error) {
      console.error('删除仓库失败:', error)
      // 可以添加错误提示
    }
  }
}

const closeDialog = () => {
  dialogVisible.value = false
  deleteConfirm.value = ''
}
</script>
