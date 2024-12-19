<template>
    <v-card>
      <v-card-title>笔记</v-card-title>
      <v-card-text>
        <v-textarea
          v-model="noteContent"
          auto-grow
          rows="20"
          @input="updateNote"
        ></v-textarea>
      </v-card-text>
    </v-card>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useGoalStore } from '../../stores/goal'
  
  const goalStore = useGoalStore()
  const currentGoal = computed(() => goalStore.currentGoal)
  const noteContent = ref(currentGoal.value?.noteContent || '')
  
  const updateNote = async () => {
    if (currentGoal.value) {
      await goalStore.updateNote(noteContent.value)
    }
  }
  </script>