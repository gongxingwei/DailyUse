<template>
  <v-app>
    <div v-if="isLoading" class="loading-container">
      <!-- 使用 @dailyuse/assets 中的 logo -->
      <img :src="logo" alt="DailyUse Logo" class="loading-logo mb-4" />
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">正在初始化应用...</p>
    </div>
    <router-view v-else></router-view>

    <!-- 全局 Snackbar 组件 -->
    <GlobalSnackbar />

    <!-- 命令面板 (Cmd/Ctrl + K) -->
    <CommandPalette
      v-model="showCommandPalette"
      :goals="goals"
      :tasks="tasks"
      :reminders="reminders"
    />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useSettingStore } from '@/modules/setting/presentation/stores/settingStore';
import { useAccountStore } from '@/modules/account/presentation/stores/accountStore';
import GlobalSnackbar from '@/shared/components/GlobalSnackbar.vue';
import CommandPalette from '@/shared/components/command-palette/CommandPalette.vue';
import { searchDataProvider } from '@/shared/services/SearchDataProvider';
import { logo128 as logo } from '@dailyuse/assets';

const isLoading = ref(true);
const showCommandPalette = ref(false);
const settingStore = useSettingStore();
const accountStore = useAccountStore();

// Computed properties for search data (reactive to cache updates)
const goals = computed(() => searchDataProvider.getGoals());
const tasks = computed(() => searchDataProvider.getTasks());
const reminders = computed(() => searchDataProvider.getReminders());

onMounted(async () => {
  try {
    // 并行初始化各个系统
    await Promise.all([
      // 初始化设置
      settingStore.initializeSettings(),
      // 加载搜索数据 (后台加载，不阻塞应用启动)
      searchDataProvider.loadData().catch((error) => {
        console.error('搜索数据加载失败:', error);
      }),
    ]);

    // 恢复账户信息
    accountStore.restoreAccount();

    // 初始化完成
    isLoading.value = false;

    console.log('应用初始化完成');
  } catch (error) {
    console.error('应用初始化失败:', error);
    isLoading.value = false;
  }
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  background-color: rgb(var(--v-theme-background));
}

.loading-logo {
  width: 128px;
  height: 128px;
  object-fit: contain;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
</style>

<style>
:root {
  color-scheme: light dark;
}

html,
body,
#app {
  height: 100%;
  margin: 0;
}

/* Theme transition styles */
body.theme-transition,
body.theme-transition *,
body.theme-transition *::before,
body.theme-transition *::after {
  transition:
    background-color 0.3s ease-in-out,
    color 0.3s ease-in-out,
    border-color 0.3s ease-in-out !important;
  transition-delay: 0s !important;
}
</style>
