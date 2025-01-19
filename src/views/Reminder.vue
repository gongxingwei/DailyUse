<template>
  <v-container>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h5 font-weight-medium">提醒管理</h1>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showAddDialog = true"
      >
        新建提醒
      </v-btn>
    </div>

    <v-row>
      <v-col v-for="plan in reminderStore.plans" :key="plan.id" cols="12" md="4">
        <v-card>
          <v-card-title class="d-flex align-center">
            {{ plan.title }}
            <v-spacer></v-spacer>
            <v-switch
              v-model="plan.enabled"
              hide-details
              density="compact"
              @change="updatePlan(plan)"
            ></v-switch>
          </v-card-title>

          <v-card-text>
            <div class="text-body-1">{{ plan.message }}</div>
            <div class="text-caption text-medium-emphasis mt-2">
              每 {{ plan.interval }} 分钟提醒一次
            </div>
            <div v-if="plan.lastTriggerTime" class="text-caption text-medium-emphasis">
              上次提醒: {{ formatDate(plan.lastTriggerTime) }}
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="small"
              @click="editPlan(plan)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              @click="deletePlan(plan.id)"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 添加/编辑对话框 -->
    <v-dialog v-model="showAddDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ editingPlan ? '编辑提醒' : '新建提醒' }}</v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="savePlan">
            <v-text-field
              v-model="planForm.title"
              label="标题"
              required
              :rules="[v => !!v || '请输入标题']"
            ></v-text-field>

            <v-textarea
              v-model="planForm.message"
              label="提醒内容"
              rows="3"
              required
              :rules="[v => !!v || '请输入提醒内容']"
            ></v-textarea>

            <v-text-field
              v-model.number="planForm.interval"
              label="提醒间隔（分钟）"
              type="number"
              required
              :rules="[
                v => !!v || '请输入间隔时间',
                v => v > 0 || '间隔时间必须大于0'
              ]"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="showAddDialog = false">取消</v-btn>
          <v-btn color="primary" variant="text" @click="savePlan">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useReminderStore } from '../stores/reminder'
import type { ReminderPlan } from '../stores/reminder'

const reminderStore = useReminderStore()
const showAddDialog = ref(false)
const form = ref()
const editingPlan = ref<ReminderPlan | null>(null)

const planForm = ref({
  title: '',
  message: '',
  interval: 45,
  enabled: true
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const editPlan = (plan: ReminderPlan) => {
  editingPlan.value = plan
  planForm.value = { ...plan }
  showAddDialog.value = true
}

const updatePlan = (plan: ReminderPlan) => {
  reminderStore.updatePlan(plan)
}

const deletePlan = (id: number) => {
  if (confirm('确定要删除这个提醒吗？')) {
    reminderStore.deletePlan(id)
  }
}

const savePlan = async () => {
  const { valid } = await form.value.validate()
  if (valid) {
    if (editingPlan.value) {
      reminderStore.updatePlan({
        ...editingPlan.value,
        ...planForm.value
      })
    } else {
      reminderStore.addPlan(planForm.value)
    }
    showAddDialog.value = false
    resetForm()
  }
}

const resetForm = () => {
  planForm.value = {
    title: '',
    message: '',
    interval: 45,
    enabled: true
  }
  editingPlan.value = null
}
</script>

<style scoped>
</style>
