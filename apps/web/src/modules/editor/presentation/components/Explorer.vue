<template>
  <div class="explorer">
    <div class="explorer-placeholder">
      <v-icon size="48" color="primary">mdi-folder-outline</v-icon>
      <h4 class="mt-2">文件浏览器</h4>
      <p class="text-grey text-caption">Web版本文件浏览器功能正在开发中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rootPath?: string;
}

const props = defineProps<Props>();
</script>

<style scoped>
.explorer {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface));
  padding: 16px;
}

.explorer-placeholder {
  text-align: center;
}
</style>
