<template>
    <v-card>
      <v-card-title>{{ currentGoal?.title }} - 主文档</v-card-title>
      <v-card-text>
        <v-textarea
          v-model="mainDocContent"
          auto-grow
          rows="20"
          @input="updateMainDoc"
        ></v-textarea>
      </v-card-text>
    </v-card>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useGoalStore } from '../../stores/goal'
  
  const goalStore = useGoalStore()
  const currentGoal = computed(() => goalStore.currentGoal)
  const mainDocContent = ref(currentGoal.value?.mainDocContent || '')
  
  const updateMainDoc = async () => {
    await goalStore.updateMainDoc(mainDocContent.value)
  }
  </script>