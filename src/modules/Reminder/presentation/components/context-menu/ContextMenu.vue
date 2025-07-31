<template>
  <teleport to="body">
    <div 
      v-if="show"
      class="context-menu-overlay"
      @click="$emit('close')"
    >
      <div 
        class="context-menu"
        :style="{ left: x + 'px', top: y + 'px' }"
        @click.stop
      >
        <div 
          v-for="item in items" 
          :key="item.label"
          class="context-menu-item"
          @click="$emit('select', item.action)"
        >
          <v-icon size="16" class="mr-2">{{ item.icon }}</v-icon>
          {{ item.label }}
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue';
interface MenuItem {
  label: string;
  icon: string;
  action: () => void;
}

interface Props {
  show?: boolean;
  x: number;
  y: number;
  items: MenuItem[];
}

const props = withDefaults(defineProps<Props>(), {
  show: false
});

defineEmits<{
  select: [action: () => void];
  close: [];
}>();

</script>

<style scoped>
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: transparent;
}

.context-menu {
    width: 200px;
    height: 200px;
  position: absolute;
  background: rgba(var(--v-theme-surface), 1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  min-width: 180px;
  overflow: hidden;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 14px;
  color: rgb(var(--v-theme-font));
}

.context-menu-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.context-menu-item:active {
  background: rgba(0, 0, 0, 0.1);
}
</style>
