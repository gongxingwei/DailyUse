<template>
  <v-dialog v-model="dialogVisible" max-width="500px">
    <v-card>
      <v-card-title>创建新仓库</v-card-title>
      
      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="repoData.path"
            label="仓库路径"
            readonly
            :rules="[v => !!v || '请选择仓库路径']"
            required
            append-icon="mdi-folder"
            @click:append="selectFolder"
          />
          
          <v-textarea
            v-model="repoData.description"
            label="仓库描述"
            rows="3"
          />
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn color="error" @click="closeDialog">取消</v-btn>
        <v-btn color="primary" @click="createRepo">创建</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRepoStore } from '../repo'
import { fileSystem } from '@/shared/utils/fileSystem';

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const repoStore = useRepoStore()
const form = ref()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const repoData = ref({
  title: '',
  path: '',
  description: ''
})

const selectFolder = async () => {
  try {
    const result = await fileSystem.selectFolder();
    if (result) {
      repoData.value.path = result.directoryPath
      repoData.value.title = window.electron.path.basename(result.directoryPath)
    }
  } catch (error) {
    console.error('选择文件夹失败:', error)
  }
}

const createRepo = async () => {
  const { valid } = await form.value.validate()
  if (valid) {
    if (repoStore.repos.some(r => r.title === repoData.value.title)) {
      alert('该文件夹已被添加为仓库')
      return
    }
    repoStore.addRepo(repoData.value)
    closeDialog()
  }
}

const closeDialog = () => {
  dialogVisible.value = false
  repoData.value = {
    title: '',
    path: '',
    description: ''
  }
}
</script> 