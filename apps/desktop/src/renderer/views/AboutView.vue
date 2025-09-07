<template>
  <v-container fluid class="pa-6">
    <v-card class="settings-card" elevation="2">
      <v-card-title class="settings-section-title">
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-3">mdi-information</v-icon>
          <span>{{ t('settings.about.title') }}</span>
        </div>
      </v-card-title>
      <v-card-text class="pa-6">
        <div class="d-flex align-center">
          <v-avatar size="64" color="primary" variant="tonal" class="mr-6">
            <v-icon size="32">mdi-application</v-icon>
          </v-avatar>
          <div class="flex-grow-1">
            <h3 class="text-h6 font-weight-bold mb-2">DailyUse</h3>
            <div class="text-body-1 mb-1">{{ t('settings.about.version') }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ t('settings.about.description') }}
            </div>
          </div>
        </div>
        <v-divider class="my-4"></v-divider>
        <div class="d-flex gap-3">
          <v-btn 
            variant="outlined" 
            color="primary"
            prepend-icon="mdi-github" 
            href="https://github.com/yourusername/dailyuse"
            target="_blank"
          >
            GitHub
          </v-btn>
          <v-btn 
            variant="text" 
            prepend-icon="mdi-heart"
            color="error"
          >
            支持项目
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<style scoped>
.settings-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
}
.settings-section-title {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08) 0%, rgba(var(--v-theme-primary), 0.02) 100%);
  font-size: 1.25rem;
  font-weight: 600;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}
/* 深色主题适配 */
.v-theme--dark .settings-section-title {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.12) 0%, rgba(var(--v-theme-primary), 0.04) 100%);
}
</style>
