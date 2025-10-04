<template>
  <div class="theme-settings">
    <div class="settings-section">
      <h2 class="section-title">主题设置</h2>
      <p class="section-description">选择您喜欢的主题模式</p>

      <div class="theme-mode-selector">
        <div
          v-for="mode in themeModes"
          :key="mode.value"
          class="theme-mode-option"
          :class="{ active: currentMode === mode.value }"
          @click="handleThemeModeChange(mode.value)"
        >
          <div class="mode-icon">
            <component :is="mode.icon" />
          </div>
          <div class="mode-info">
            <div class="mode-label">{{ mode.label }}</div>
            <div class="mode-description">{{ mode.description }}</div>
          </div>
          <div v-if="currentMode === mode.value" class="mode-check">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';

// Icons (inline SVG components)
const LightIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  `,
};

const DarkIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  `,
};

const SystemIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  `,
};

const userPreferencesStore = useUserPreferencesStore();

const themeModes = [
  {
    value: 'light',
    label: '浅色模式',
    description: '始终使用浅色主题',
    icon: LightIcon,
  },
  {
    value: 'dark',
    label: '深色模式',
    description: '始终使用深色主题',
    icon: DarkIcon,
  },
  {
    value: 'system',
    label: '跟随系统',
    description: '根据系统设置自动切换',
    icon: SystemIcon,
  },
] as const;

const currentMode = computed(() => userPreferencesStore.currentThemeMode);
const error = computed(() => userPreferencesStore.error);

async function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
  try {
    await userPreferencesStore.switchThemeMode(mode);
  } catch (err) {
    console.error('切换主题模式失败:', err);
  }
}
</script>

<style scoped>
.theme-settings {
  max-width: 800px;
}

.settings-section {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.section-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 24px 0;
}

.theme-mode-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-mode-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-mode-option:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
}

.theme-mode-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.mode-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--color-surface-variant);
  color: var(--color-text-primary);
  margin-right: 16px;
}

.mode-info {
  flex: 1;
}

.mode-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.mode-description {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.mode-check {
  color: var(--color-primary);
  margin-left: 12px;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: var(--color-error-light);
  color: var(--color-error);
  border-radius: 6px;
  font-size: 14px;
}

/* Dark mode adjustments (if using CSS variables) */
:root[data-theme='dark'] .settings-section {
  background: var(--color-surface-dark, #1e1e1e);
}

:root[data-theme='dark'] .theme-mode-option {
  border-color: var(--color-border-dark, #3e3e3e);
}

:root[data-theme='dark'] .theme-mode-option:hover {
  background: var(--color-surface-hover-dark, #2e2e2e);
}

:root[data-theme='dark'] .mode-icon {
  background: var(--color-surface-variant-dark, #2e2e2e);
}
</style>
