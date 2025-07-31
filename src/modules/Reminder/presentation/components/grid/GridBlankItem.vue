<template>
  <div class="grid-blank-item" @click="$emit('click')">
    <slot>
      <!-- 默认内容，可自定义：加号图标或留空 -->
    </slot>
  </div>
</template>

<script setup lang="ts">
defineEmits(['click']);
</script>

<style scoped>
.grid-blank-item {
  width: 100%;
  height: 100%;
  min-width: 80px;
  min-height: 80px;
  aspect-ratio: 1 / 1;
  background: rgba(255,255,255,0.08);
  border: 1px dashed #bbb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}
.grid-blank-item:hover {
  background: rgba(255,255,255,0.18);
}
</style>
