<template>
  <v-card class="mb-4 cursor-pointer" @click="navigateToGoalInfo">
    <!-- 目标名称 -->
    <v-card-text class="d-flex justify-flex-start align-center pb-2">
      <v-icon :color="goal.color" size="24">mdi-radiobox-blank</v-icon>
      <span class="text-h5">{{ goal.title }}</span>
    </v-card-text>
    <!-- 目标时间 -->
    <v-card-text class="pt-0 pb-3">
      <v-icon :color="goal.color" size="24">mdi-calendar-range</v-icon>
      <span>{{ formateDate(goal.startTime) }} - {{ formateDate(goal.endTime) }}</span>
    </v-card-text>
    <!-- 目标完成进度条 -->
    <v-card-text class="d-flex justify-flex-start align-center">
      <v-progress-linear :model-value="progress" :color="goal.color" height="10" max="100"></v-progress-linear>
      <span class="text-caption progess-text">
        {{ goalStore.getGoalProgress(goal.id) }}%
      </span>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IGoal } from '@/modules/Goal/types/goal'
import { useGoalStore } from '../stores/goalStore'
import { useRouter } from 'vue-router'
const goalStore = useGoalStore()
const router = useRouter()
const { t } = useI18n()

const props = defineProps<{
  goal: IGoal
}>()

const emit = defineEmits<{
  (e: 'delete'): void
  (e: 'edit'): void
  (e: 'relative-repo'): void
  (e: 'relative-todo'): void
}>()

const handleEdit = () => {
  emit('edit')
}

const handleDelete = () => {
  emit('delete')
}

const handleRelativeRepo = () => {
  emit('relative-repo')
}

const handleRelativeTodo = () => {
  emit('relative-todo')
}
// 路由跳转
const navigateToGoalInfo = () => {
  router.push({
    name: 'goal-info',  // Make sure this matches your route name
    params: { goalId: props.goal.id }
  });
};
const progress = computed(() => {
  const value = goalStore.getGoalProgress(props.goal.id)
  console.log('value', value)
  return value;
})

const formateDate = (date: string) => {
  const dateObj = new Date(date)
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(
    dateObj.getDate()
  ).padStart(2, '0')}`
}
</script>
<style scoped>
.progess-text {
  width: 5rem;
  padding-left: 1rem;
}
</style>