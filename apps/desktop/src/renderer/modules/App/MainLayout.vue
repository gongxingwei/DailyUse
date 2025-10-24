<template>
  <v-app>
    <div class="app-layout">
      <div class="sidebar">
        <sidebar />
      </div>
      <!-- 标题栏 -->
      <div class="header">
        <header-section />
      </div>
      <!-- 主内容区 -->
      <div class="content">
        <v-main class="main-content">
          <router-view />
        </v-main>
      </div>
    </div>
  </v-app>
</template>
<script setup lang="ts">
// components
import Sidebar from './components/Sidebar.vue';
import HeaderSection from './components/HeaderSection.vue';
</script>
<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: 60px 1fr;
  grid-template-rows: 30px 1fr;
  height: 100vh;
}

.sidebar {
  grid-column: 1;
  grid-row: 1 / 3;
}

.header {
  grid-column: 2;
  grid-row: 1;
}

.content {
  grid-column: 2;
  grid-row: 2;
  height: 100%;
  overflow: hidden;
}
.main-content {
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>
