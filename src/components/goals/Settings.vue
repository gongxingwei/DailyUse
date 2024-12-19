<template>
  <v-card>
    <v-card-title>设置</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="saveSettings">
        <v-text-field
          v-model="settings.title"
          label="标题"
        ></v-text-field>
        
        <v-row>
          <v-col>
            <v-text-field
              v-model="settings.mainDocPath"
              label="主文档路径"
              readonly
            ></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-btn @click="selectMainDoc">选择文件</v-btn>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-text-field
              v-model="settings.notePath"
              label="笔记路径"
              readonly
            ></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-btn @click="selectNoteDoc">选择文件</v-btn>
          </v-col>
        </v-row>

        <v-btn color="primary" type="submit" class="mr-4">保存</v-btn>
        <v-btn color="error" @click="deleteGoal">删除目标</v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGoalStore } from '../../stores/goal'
import { useRouter } from 'vue-router'

const goalStore = useGoalStore()
const router = useRouter()
const currentGoal = computed(() => goalStore.currentGoal)

const settings = ref({
  title: currentGoal.value?.title || '',
  mainDocPath: currentGoal.value?.mainDocPath || '',
  notePath: currentGoal.value?.notePath || ''
})

const saveSettings = async () => {
  console.log('Save button clicked')
  if (currentGoal.value) {
    await goalStore.updateGoalSettings({
      ...currentGoal.value,
      ...settings.value
    })
    settings.value = { ...currentGoal.value }
    console.log('Settings saved:', settings.value)
  }
}

const deleteGoal = async () => {
  if (currentGoal.value) {
    await goalStore.deleteGoal(currentGoal.value.id)
    router.push('/goals')
  }
}

const selectMainDoc = async () => {
  const filePath = await window.electron.selectFile()
  if (filePath) {
    settings.value.mainDocPath = filePath
  }
}

const selectNoteDoc = async () => {
  const filePath = await window.electron.selectFile()
  if (filePath) {
    settings.value.notePath = filePath
  }
}

</script>