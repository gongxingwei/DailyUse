<template>
  <div 
    v-show="modelValue"
    class="context-menu"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
    //   transform: 'translateY(-2px)'
    }"
  >
    <div 
      v-for="item in menuItems" 
      :key="item.title"
      class="menu-item"
      :class="{ 'menu-item-disabled': item.disabled }"
      @click="!item.disabled && handleClick(item)"
    >
      <v-icon v-if="item.icon" class="menu-icon">{{ item.icon }}</v-icon>
      <span class="menu-title">{{ item.title }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

interface MenuItem {
  title: string
  action: () => void
  icon?: string
  disabled?: boolean
}

interface Position {
  x: number
  y: number
}

interface Props {
  modelValue: boolean
  position: Position
  menuItems: MenuItem[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', item: MenuItem): void
}>()

function handleClick(item: MenuItem) {
  emit('select', item)
  emit('update:modelValue', false)
}

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
  const menu = event.target as HTMLElement
  if (!menu.closest('.context-menu')) {
    emit('update:modelValue', false)
  }
}

// 添加/移除全局点击事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 4px 0;
  min-width: 160px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #2c2c2c;
}

.menu-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #fff;
}

.menu-title {
  font-size: 14px;
  color: #fff;
}

.menu-item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item-disabled:hover {
  background-color: transparent;
}
</style> 