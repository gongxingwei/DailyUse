<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        :icon="currentIcon"
        variant="text"
        :title="currentTooltip"
        aria-label="Toggle theme"
      />
    </template>

    <v-list density="compact" min-width="200">
      <v-list-subheader>主题模式</v-list-subheader>
      
      <v-list-item
        v-for="mode in themeModes"
        :key="mode.value"
        :active="themeMode === mode.value"
        @click="handleModeChange(mode.value)"
      >
        <template v-slot:prepend>
          <v-icon :icon="mode.icon" />
        </template>
        <v-list-item-title>{{ mode.label }}</v-list-item-title>
        <template v-slot:append v-if="themeMode === mode.value">
          <v-icon icon="mdi-check" color="primary" />
        </template>
      </v-list-item>

      <v-divider class="my-2" />

      <v-list-subheader v-if="themeMode !== 'auto'">
        主题样式
      </v-list-subheader>

      <v-list-item
        v-if="themeMode !== 'auto'"
        v-for="theme in availableThemes"
        :key="theme.value"
        :active="isThemeActive(theme.value)"
        @click="handleThemeChange(theme.value)"
      >
        <template v-slot:prepend>
          <v-avatar :color="theme.previewColor" size="24" />
        </template>
        <v-list-item-title>{{ theme.label }}</v-list-item-title>
        <template v-slot:append v-if="isThemeActive(theme.value)">
          <v-icon icon="mdi-check" color="primary" />
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme, type ThemeMode, type ThemeName } from '../composables/useTheme';

const {
  themeMode,
  isDark,
  currentTheme,
  setThemeMode,
  setSpecificTheme,
  getAvailableThemes,
} = useTheme();

interface ThemeModeOption {
  value: ThemeMode;
  label: string;
  icon: string;
  tooltip: string;
}

interface ThemeOption {
  value: ThemeName;
  label: string;
  previewColor: string;
}

const themeModes: ThemeModeOption[] = [
  {
    value: 'light',
    label: '浅色',
    icon: 'mdi-white-balance-sunny',
    tooltip: '浅色模式',
  },
  {
    value: 'dark',
    label: '深色',
    icon: 'mdi-moon-waning-crescent',
    tooltip: '深色模式',
  },
  {
    value: 'auto',
    label: '跟随系统',
    icon: 'mdi-theme-light-dark',
    tooltip: '跟随系统',
  },
];

const lightThemes: ThemeOption[] = [
  { value: 'light', label: '经典浅色', previewColor: '#FFFFFF' },
  { value: 'lightBlue', label: '清新蓝', previewColor: '#E1E8F5' },
  { value: 'warmPaper', label: '暖纸色', previewColor: '#F5F0E6' },
];

const darkThemes: ThemeOption[] = [
  { value: 'dark', label: '经典深色', previewColor: '#121212' },
  { value: 'darkBlue', label: '深蓝', previewColor: '#1E1E1E' },
  { value: 'blueGreen', label: '蓝绿', previewColor: '#14181A' },
];

// Current icon based on mode and state
const currentIcon = computed<string>(() => {
  if (themeMode.value === 'auto') {
    return 'mdi-theme-light-dark';
  }
  return isDark.value ? 'mdi-moon-waning-crescent' : 'mdi-white-balance-sunny';
});

// Current tooltip
const currentTooltip = computed<string>(() => {
  const mode = themeModes.find((m) => m.value === themeMode.value);
  return mode?.tooltip || '切换主题';
});

// Available themes based on current mode
const availableThemes = computed<ThemeOption[]>(() => {
  if (themeMode.value === 'auto') {
    return [];
  }
  return isDark.value ? darkThemes : lightThemes;
});

// Check if a theme is active
const isThemeActive = (themeName: ThemeName): boolean => {
  return currentTheme.value === themeName;
};

// Handle mode change
const handleModeChange = (mode: ThemeMode): void => {
  setThemeMode(mode);
};

// Handle theme change
const handleThemeChange = (themeName: ThemeName): void => {
  const type = isDark.value ? 'dark' : 'light';
  setSpecificTheme(type, themeName);
};
</script>

<style scoped>
/* No custom styles needed - using Vuetify components */
</style>
