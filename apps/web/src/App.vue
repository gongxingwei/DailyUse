<template>
  <v-app>
    <div v-if="isLoading" class="loading-container">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">正在初始化应用...</p>
    </div>
    <router-view v-else></router-view>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSettingStore } from '@/modules/setting/presentation/stores/settingStore';
import { useAccountStore } from '@/modules/account/presentation/stores/accountStore';

const isLoading = ref(true);
const settingStore = useSettingStore();
const accountStore = useAccountStore();

onMounted(async () => {
  try {
    // 初始化设置
    await settingStore.initializeSettings();

    // 恢复账户信息
    accountStore.restoreAccount();

    // 初始化完成
    isLoading.value = false;
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
</style>
