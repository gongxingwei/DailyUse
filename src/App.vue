<template>
  <v-app>
    <router-view></router-view>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeInit } from '@/modules/Theme/useThemeInit'
import { initializeLanguage } from '@/i18n/index'
import { useReminderInit } from '@/modules/Reminder/useReminderInit';   
import { useTaskReminderInit } from './modules/Task/services/useTaskReminderInit';
import { userDataInitializationService } from '@/modules/Account/services/userDataInitializationService';
import { useAuthStore } from '@/modules/Account/stores/authStore';

// Initialize theme
useThemeInit()
initializeLanguage()
useReminderInit()
useTaskReminderInit()

onMounted(async () => {
  const authStore = useAuthStore();
  if (authStore.user) {
    await userDataInitializationService.initializeUserData();
  }
});
</script>

<style scoped>
</style>
