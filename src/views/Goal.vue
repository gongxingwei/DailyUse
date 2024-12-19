<template>
  <v-container fluid>
    <v-row>
      <!-- 导航栏 -->
      <v-col cols="12">
        <v-tabs>
          <v-tab :to="`/goal/${goalId}/maindoc`">主文档</v-tab>
          <v-tab :to="`/goal/${goalId}/note`">笔记</v-tab>
          <v-tab :to="`/goal/${goalId}/settings`">设置</v-tab>
        </v-tabs>
      </v-col>
      
      <!-- 子路由内容 -->
      <v-col cols="12">
        <router-view v-if="goalStore.currentGoal"></router-view>
        <div v-else>加载中...</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGoalStore } from '../stores/goal'

const route = useRoute()
const goalStore = useGoalStore()

const goalId = computed(() => route.params.id)

onMounted(async () => {
  if (goalId.value) {
    console.log('Mounting with goalId:', goalId.value)
    await goalStore.loadGoal(Number(goalId.value))
    console.log('After loading:', goalStore.currentGoal)
  }
})

watch(() => route.params.id, async (newId) => {
  if (newId) {
    await goalStore.loadGoal(Number(newId))
  }
}, { immediate: true })
</script>