<!--
  Theme Switcher Component (Simplified - Integrated with UserPreferences)
  @description 简化的主题切换器组件，与UserPreferences集成
  @author DailyUse Team
  @date 2025-01-04
-->

<template>
  <v-menu offset-y>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        :icon="currentThemeIcon"
        variant="text"
        :title="`当前主题: ${currentThemeLabel}`"
      >
      </v-btn>
    </template>

    <v-card min-width="200">
      <v-card-title class="pa-4 pb-2">
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-palette</v-icon>
          <span class="font-weight-bold">主题设置</span>
        </div>
      </v-card-title>

      <v-card-text class="pa-2">
        <v-list density="compact">
          <v-list-item
            v-for="mode in themeModes"
            :key="mode.value"
            :prepend-icon="mode.icon"
            :title="mode.label"
            :subtitle="mode.description"
            :active="currentMode === mode.value"
            @click="handleThemeModeChange(mode.value)"
          >
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '../themeStore';
import { useUserPreferencesStore } from '@/modules/setting/presentation/stores/userPreferencesStore';

const themeStore = useThemeStore();
const userPreferencesStore = useUserPreferencesStore();

const themeModes = [
  {
    value: 'light',
    label: '浅色模式',
    description: '始终使用浅色主题',
    icon: 'mdi-weather-sunny',
  },
  {
    value: 'dark',
    label: '深色模式',
    description: '始终使用深色主题',
    icon: 'mdi-weather-night',
  },
  {
    value: 'system',
    label: '跟随系统',
    description: '根据系统设置自动切换',
    icon: 'mdi-monitor',
  },
] as const;

const currentMode = computed(() => themeStore.currentThemeMode);

const currentThemeLabel = computed(() => {
  const mode = themeModes.find((m) => m.value === currentMode.value);
  return mode?.label || '未知';
});

const currentThemeIcon = computed(() => {
  const mode = themeModes.find((m) => m.value === currentMode.value);
  return mode?.icon || 'mdi-help-circle';
});

async function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
  try {
    await themeStore.setThemeMode(mode);
  } catch (err) {
    console.error('切换主题模式失败:', err);
  }
}
</script>

<style scoped>
.v-list-item--active {
  color: rgb(var(--v-theme-primary));
}
</style>
