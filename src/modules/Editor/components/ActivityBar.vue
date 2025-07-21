<template>
  <div class="activity-bar">
    <button 
      v-for="item in store.activityBarItems" 
      class="function-icon"
      :class="{ 'active': store.activeActivityBarItemId === item.uuid }"
      :key="item.uuid"
      :title="item.title"
      @click="store.setActiveActivityBarItemId(item.uuid)"
    >
      <v-icon>{{ item.icon }}</v-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useActivityBarStore } from '@/modules/Editor/stores/activityBarStore';
const store = useActivityBarStore();
</script>

<style scoped>
.activity-bar button {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  cursor: pointer;
}

.activity-bar button.active {
  border-left: 2px solid rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-surface));
}
</style>