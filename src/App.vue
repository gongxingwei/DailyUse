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

import { useAuthStore } from '@/modules/Account/stores/authStore';

// Initialize theme
useThemeInit()
initializeLanguage()
useReminderInit()
useTaskReminderInit()


</script>

<style scoped>
</style>
