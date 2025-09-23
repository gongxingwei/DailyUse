<template>
  <div class="editor-area">
    <div class="editor-placeholder">
      <v-icon size="64" color="primary">mdi-text-box-outline</v-icon>
      <h3 class="mt-4">文本编辑器</h3>
      <p class="text-grey">Web版本编辑器功能正在开发中...</p>
      <p class="text-grey-darken-1 text-caption">路径: {{ path }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  path: string;
  isPreview?: boolean;
}

const props = defineProps<Props>();
</script>

<style scoped>
.editor-area {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface));
}

.editor-placeholder {
  text-align: center;
  padding: 32px;
}
</style>
