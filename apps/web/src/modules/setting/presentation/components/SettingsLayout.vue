<template>
  <div class="settings-layout">
    <div class="settings-container">
      <!-- Sidebar Navigation -->
      <aside class="settings-sidebar">
        <h1 class="settings-title">设置</h1>
        <nav class="settings-nav">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            active-class="active"
          >
            <component :is="item.icon" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="settings-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';

// Icons (inline SVG components)
const GeneralIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
    </svg>
  `,
};

const ThemeIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
    </svg>
  `,
};

const NotificationIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
    </svg>
  `,
};

const AdvancedIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z" clip-rule="evenodd"/>
    </svg>
  `,
};

const navItems = [
  { path: '/settings/general', label: '常规', icon: GeneralIcon },
  { path: '/settings/theme', label: '主题', icon: ThemeIcon },
  { path: '/settings/notifications', label: '通知', icon: NotificationIcon },
  { path: '/settings/advanced', label: '高级', icon: AdvancedIcon },
];

const userPreferencesStore = useUserPreferencesStore();

onMounted(async () => {
  // Initialize user preferences when the settings page is loaded
  if (!userPreferencesStore.isLoaded) {
    try {
      await userPreferencesStore.initialize();
    } catch (err) {
      console.error('Failed to initialize user preferences:', err);
    }
  }
});
</script>

<style scoped>
.settings-layout {
  min-height: 100vh;
  background: var(--color-background);
  padding: 24px;
}

.settings-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
}

.settings-sidebar {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 24px;
  height: fit-content;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 24px;
}

.settings-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 24px 0;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.nav-item:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.nav-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 500;
}

.nav-icon {
  width: 20px;
  height: 20px;
}

.nav-label {
  font-size: 15px;
}

.settings-content {
  min-height: 400px;
}

/* Dark mode adjustments */
:root[data-theme='dark'] .settings-layout {
  background: var(--color-background-dark, #121212);
}

:root[data-theme='dark'] .settings-sidebar {
  background: var(--color-surface-dark, #1e1e1e);
}

:root[data-theme='dark'] .nav-item:hover {
  background: var(--color-surface-hover-dark, #2e2e2e);
}

/* Responsive */
@media (max-width: 768px) {
  .settings-container {
    grid-template-columns: 1fr;
  }

  .settings-sidebar {
    position: static;
  }

  .settings-nav {
    flex-direction: row;
    overflow-x: auto;
  }

  .nav-item {
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    min-width: 80px;
  }

  .nav-label {
    font-size: 13px;
  }
}
</style>
