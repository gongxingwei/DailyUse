<template>
  <v-app>
    <router-view></router-view>
  </v-app>
</template>

<script setup lang="ts">
import { useThemeInit } from '@/modules/Theme/useThemeInit'
import { initializeLanguage } from '@/i18n/index'
// Initialize theme
useThemeInit()
initializeLanguage()
</script>

<style scoped>
</style>
