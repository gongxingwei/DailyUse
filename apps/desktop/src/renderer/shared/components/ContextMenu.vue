<template>
  <div
    v-show="isVisible"
    class="context-menu"
    :style="{
      left: `${adjustedPosition.x}px`,
      top: `${adjustedPosition.y}px`,
    }"
    @click.stop
    @contextmenu.stop.prevent
  >
    <div class="menu-list">
      <template v-for="(item, index) in menuItems" :key="index">
        <!-- 分隔线 -->
        <div v-if="item.divider" class="menu-divider"></div>

        <!-- 菜单项 -->
        <div
          v-else
          class="menu-item"
          :class="{
            disabled: item.disabled,
            [item.className || '']: !!item.className,
          }"
          @click="handleItemClick(item)"
        >
          <!-- 图标区域 -->
          <div class="item-icon" v-if="item.icon || item.customIcon">
            <i v-if="item.icon" class="icon" :class="item.icon"></i>
            <slot v-else :name="`icon-${item.value}`"></slot>
          </div>

          <!-- 内容区域 -->
          <div class="item-content">
            <template v-if="item.customContent">
              <slot :name="`content-${item.value}`" :item="item"></slot>
            </template>
            <template v-else>
              <div class="item-title">{{ item.title }}</div>
              <div v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</div>
            </template>
          </div>

          <!-- 快捷键或其他追加内容 -->
          <div v-if="item.shortcut || item.append" class="item-append">
            <template v-if="item.append">
              <slot :name="`append-${item.value}`" :item="item"></slot>
            </template>
            <template v-else>{{ item.shortcut }}</template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';

interface MenuItem {
  value: string;
  title: string;
  icon?: string;
  subtitle?: string;
  disabled?: boolean;
  className?: string;
  divider?: boolean;
  customIcon?: boolean;
  customContent?: boolean;
  append?: boolean;
  shortcut?: string;
  data?: any;
  action: (item: MenuItem) => void;
}

interface Props {
  modelValue: boolean;
  x: number;
  y: number;
  items: MenuItem[];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', item: MenuItem): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const menuItems = computed(() => props.items);

// 调整位置以确保菜单不会超出视窗
const adjustedPosition = computed(() => {
  if (typeof window === 'undefined') return { x: props.x, y: props.y };

  const menuWidth = 200; // 估计的菜单宽度
  const menuHeight = menuItems.value.length * 32; // 估计的菜单高度
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let x = props.x;
  let y = props.y;

  // 确保不超出右边界
  if (x + menuWidth > windowWidth) {
    x = windowWidth - menuWidth;
  }

  // 确保不超出下边界
  if (y + menuHeight > windowHeight) {
    y = windowHeight - menuHeight;
  }

  // 确保不超出左边界
  if (x < 0) x = 0;

  // 确保不超出上边界
  if (y < 0) y = 0;

  return { x, y };
});

function handleItemClick(item: MenuItem) {
  if (item.disabled) return;

  // 调用项目自己的处理函数
  item.action?.(item);
  // 发出选择事件
  emit('select', item);
  // 关闭菜单
  isVisible.value = false;
}

// 点击外部关闭菜单
function handleOutsideClick(e: MouseEvent) {
  const menu = document.querySelector('.context-menu');
  if (isVisible.value && menu && !menu.contains(e.target as Node)) {
    isVisible.value = false;
  }
}

// 监听全局点击事件
onMounted(() => {
  // 使用 setTimeout 确保事件处理器在当前事件循环之后才添加
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('contextmenu', handleOutsideClick);
  }, 0);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('contextmenu', handleOutsideClick);
});
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  background: rgb(var(--v-theme-surface));
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 200px;
  animation: fadeIn 0.15s ease-out;
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  user-select: none;
  color: rgb(var(--v-theme-text-primary-on-surface));
  font-size: 14px;
  transition: background-color 0.2s;
}

.menu-item:hover:not(.disabled) {
  background-color: #f5f5f5;
}

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-divider {
  height: 1px;
  background-color: rgb(var(--v-theme-on-surface));
  margin: 4px 0;
}

.item-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-content {
  flex-grow: 1;
  min-width: 0;
}

.item-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-subtitle {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.item-append {
  margin-left: 16px;
  color: #999;
  font-size: 12px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
