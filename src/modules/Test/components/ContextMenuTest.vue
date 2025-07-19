<template>
  <div style="height: 400px; background: rgb(var(--v-theme-surface)); position: relative;" @contextmenu.prevent="onContextMenu">
    <h3>右键菜单测试区</h3>
    <p>请在此区域右键，弹出 ContextMenu 组件。</p>
    <ContextMenu
      :show="menu.show"
      :x="menu.x"
      :y="menu.y"
      :items="menu.items"
      @select="onMenuSelect"
      @close="closeMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ContextMenu from '@/modules/Reminder/presentation/components/context-menu/ContextMenu.vue';

interface MenuItem {
  label: string;
  icon: string;
  action: () => void;
}

const menu = ref({
  show: false,
  x: 0,
  y: 0,
  items: [] as MenuItem[],
});

const onContextMenu = (e: MouseEvent) => {
  menu.value.x = e.clientX;
  menu.value.y = e.clientY;
  menu.value.items = [
    {
      label: '操作一',
      icon: 'mdi-pencil',
      action: () => alert('点击了操作一'),
    },
    {
      label: '操作二',
      icon: 'mdi-delete',
      action: () => alert('点击了操作二'),
    },
  ];
  menu.value.show = true;
};

const onMenuSelect = (action: () => void) => {
  action();
  closeMenu();
};

const closeMenu = () => {
  menu.value.show = false;
};
</script>
