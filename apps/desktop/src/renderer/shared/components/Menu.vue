<template>
  <div class="menu-container">
    <!-- Trigger element -->
    <div v-if="$slots.trigger" class="menu-trigger" @click="handleTriggerClick" ref="triggerRef">
      <slot name="trigger"></slot>
    </div>

    <!-- Menu content -->
    <Teleport to="body">
      <div
        v-if="isVisible"
        class="menu"
        :style="menuStyle"
        ref="menuRef"
        @keydown.esc="closeMenu"
        @keydown.up.prevent="navigateItems(-1)"
        @keydown.down.prevent="navigateItems(1)"
        @keydown.enter="selectCurrentItem"
        tabindex="0"
      >
        <div class="menu-content">
          <template v-for="(item, index) in items" :key="index">
            <div v-if="item.type === 'separator'" class="menu-separator"></div>
            <div
              v-else
              class="menu-item"
              :class="{
                disabled: item.disabled,
                active: currentIndex === index,
              }"
              @click="handleItemClick(item)"
              @mouseenter="currentIndex = index"
            >
              <v-icon v-if="item.icon" size="small" class="menu-item-icon">
                {{ item.icon }}
              </v-icon>
              <span class="menu-item-label">{{ item.label }}</span>
              <span v-if="item.keybinding" class="menu-item-keybinding">{{ item.keybinding }}</span>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';

interface MenuItem {
  type?: 'separator';
  label?: string;
  icon?: string;
  keybinding?: string;
  disabled?: boolean;
  action?: () => void;
}

const props = defineProps<{
  items: MenuItem[];
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const isVisible = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const currentIndex = ref(-1);
const menuPosition = ref({ x: 0, y: 0 });

const menuStyle = computed(() => ({
  left: `${menuPosition.value.x}px`,
  top: `${menuPosition.value.y}px`,
}));

function handleTriggerClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  const trigger = triggerRef.value;
  if (!trigger) return;

  const rect = trigger.getBoundingClientRect();
  calculatePosition(rect);

  // Toggle menu visibility
  isVisible.value = !isVisible.value;

  if (isVisible.value) {
    nextTick(() => {
      menuRef.value?.focus();
    });
  }
}

watch(isVisible, (newValue) => {
  console.log('isVisible changed:', newValue);
});

function calculatePosition(triggerRect: DOMRect) {
  const menuWidth = 220;
  const menuHeight = props.items.length * 28;

  let x = triggerRect.left;
  let y = triggerRect.bottom + 2;

  // Adjust position based on viewport bounds
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth;
  }
  if (y + menuHeight > window.innerHeight) {
    y = triggerRect.top - menuHeight - 2;
  }

  menuPosition.value = { x, y };
}

function closeMenu() {
  isVisible.value = false;
  currentIndex.value = -1;
  emit('update:visible', false);
}

function handleItemClick(item: MenuItem) {
  if (item.disabled) return;
  item.action?.();
  closeMenu();
}

function navigateItems(direction: number) {
  const items = props.items.filter((item) => item.type !== 'separator');

  currentIndex.value = (currentIndex.value + direction + items.length) % items.length;

  const menuItem = menuRef.value?.querySelector(
    `.menu-item:nth-child(${currentIndex.value + 1})`,
  ) as HTMLElement;
  menuItem?.scrollIntoView({ block: 'nearest' });
}

function selectCurrentItem() {
  const item = props.items[currentIndex.value];
  if (item && !item.disabled) {
    handleItemClick(item);
  }
}

function handleClickOutside(event: MouseEvent) {
  if (!isVisible.value) return;

  const menu = menuRef.value;
  const trigger = triggerRef.value;

  if (menu && !menu.contains(event.target as Node) && !trigger?.contains(event.target as Node)) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.menu-container {
  position: relative;
  display: inline-block;
}

.menu {
  position: fixed;
  z-index: 9999;
  min-width: 220px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 3px;
  outline: none;
}

.menu-content {
  padding: 4px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 8px 0 24px;
  position: relative;
  cursor: pointer;
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px;
}

.menu-item.active {
  color: rgb(var(--v-theme-primary));
}

.menu-item.disabled {
  opacity: 0.4;
  cursor: default;
}

.menu-item-icon {
  margin-right: 8px;
  font-size: 14px;
}

.menu-item-label {
  flex-grow: 1;
}

.menu-item-keybinding {
  margin-left: 16px;
  opacity: 0.8;
  font-size: 12px;
}

.menu-separator {
  height: 1px;
  margin: 4px 0;
  background-color: rgb(var(--v-theme-on-surface));
}
</style>
