<template>
  <v-app>
    <div v-if="isLoading" class="loading-container">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
      <p class="mt-4">正在初始化应用...</p>
    </div>
    <router-view v-else></router-view>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { AppInitService } from '@/shared/services/appInitService';
import { useThemeInit } from './modules/Theme/useThemeInit';

useThemeInit();

const isLoading = ref(true);

const initializeApp = async () => {
  try {
    await AppInitService.initialize({
      autoInit: true,
      skipDataInit: true, // 根据需要调整
    });
  } catch (error) {
    console.error('应用初始化失败:', error);
    // 可以显示错误提示给用户
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  initializeApp();
  
});

onUnmounted(() => {
  AppInitService.cleanup();
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
  background-color: rgb(var('$v-theme-background'));
}
</style>
