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
import { onMounted, ref } from 'vue';
import { useThemeInit } from './modules/Theme/useThemeInit';
import { init } from './aaa';
useThemeInit();

const isLoading = ref(false);




onMounted(() => {

  // init();
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
