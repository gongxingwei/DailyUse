<template>
  <v-app>
    <router-view></router-view>
  </v-app>
</template>

<script setup lang="ts">
import { useThemeInit } from '@/modules/Theme/useThemeInit'
import { initializeLanguage } from '@/i18n/index'
import { useReminderInit } from '@/modules/Reminder/useReminderInit';
// Initialize theme
useThemeInit()
initializeLanguage()
useReminderInit()
</script>

<style scoped>
</style>
