<template>
  <div ref="gridContainer" class="h-100 w-100" @contextmenu.prevent="onGridContextMenu">
    <draggable v-if="items.length > 0" :model-value="items" item-key="id" :animation="200" :disabled="false" ghost-class="ghost"
      chosen-class="chosen" drag-class="drag" tag="div" class="reminder-grid" @start="onDragStart" @end="onDragEnd">
      <template #item="{ element }">
        <div :key="element.uuid" class="grid-item" @contextmenu.prevent="onItemContextMenu($event, element)">
          <component :is="getItemComponent(element)" :item="element" />
        </div>
      </template>
    </draggable>

    <!-- 空状态提示区域，支持右键 -->
    <div
      v-else
      class="reminder-grid empty-grid"
      @contextmenu.prevent="onGridContextMenu"
      style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 400px;"
    >
      <span style="color: #aaa;">暂无提醒，可通过右键菜单添加提醒</span>
    </div>

    <!-- Context Menu -->
    <ContextMenu :show="contextMenu.show" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenu.items"
      @select="onContextMenuSelect" @close="closeContextMenu" />

    <!-- ReminderTemplateCard -->
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue';
import draggable from 'vuedraggable';
import GridTemplateItem from './/GridTemplateItem.vue';
import GridGroupItem from './/GridGroupItem.vue';
import ContextMenu from '..//context-menu/ContextMenu.vue';
import { useContextMenu } from '../..//composables/useContextMenu';
import { GridItem } from '../../../../../../common/modules/reminder/types/reminder';

import { ReminderTemplate } from '../../../domain/entities/reminderTemplate';
import { ReminderTemplateGroup } from '../../../domain/aggregates/reminderTemplateGroup';

interface Props {
  items: any[];
  gridSize: number;
}

// 事件处理函数全部用 inject 获取
const onStartCreateTemplate = inject<(() => void) | undefined>('onStartCreateTemplate');
const onStartCreateGroup = inject<(() => void) | undefined>('onStartCreateGroup');
const onStartEditItem = inject<((item: GridItem) => void) | undefined>('onStartEditItem');
const onStartDeleteItem = inject<((item: GridItem) => void) | undefined>('onStartDeleteItem');
const onStartMoveTemplate = inject<((item: ReminderTemplate) => void) | undefined>('onStartMoveTemplate');

withDefaults(defineProps<Props>(), {
  gridSize: 80
});

const gridContainer = ref<HTMLElement>();

const { contextMenu, showContextMenu, closeContextMenu } = useContextMenu();

const getItemComponent = (item: GridItem) => {
  if (ReminderTemplate.isReminderTemplate(item)) {
    return GridTemplateItem;
  } else if (ReminderTemplateGroup.isReminderTemplateGroup(item)) {
    return GridGroupItem;
  }
};

const onGridContextMenu = (event: MouseEvent) => {
  showContextMenu(event, [
    {
      label: '添加提醒',
      icon: 'mdi-bell-plus',
      action: () => onStartCreateTemplate && onStartCreateTemplate()
    },
    {
      label: '添加提醒分组',
      icon: 'mdi-folder-plus',
      action: () => onStartCreateGroup && onStartCreateGroup()
    }
  ]);
};

const onItemContextMenu = (event: MouseEvent, item: GridItem) => {
  event.stopPropagation();

  const menuItems = [
    {
      label: '编辑',
      icon: 'mdi-pencil',
      action: () => onStartEditItem && onStartEditItem(item)
    },
    {
      label: '删除',
      icon: 'mdi-delete',
      action: () => onStartDeleteItem && onStartDeleteItem(item)
    }
  ];

  if (ReminderTemplate.isReminderTemplate(item)) {
    menuItems.splice(1, 0, {
      label: '移动到组中',
      icon: 'mdi-bell-plus',
      action: () => onStartMoveTemplate && onStartMoveTemplate(item)
    });
  }

  showContextMenu(event, menuItems);
};

const onContextMenuSelect = (action: () => void) => {
  action();
  closeContextMenu();
};

const onDragStart = () => {
  // Handle drag start
};

const onDragEnd = () => {
  // Handle drag end
};

</script>

<style scoped>
.reminder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  grid-template-rows: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  /* 可选，元素间距 */
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: transparent;
  padding: 20px;
}

.grid-item {
  cursor: pointer;
  
}

.grid-item.template {
  width: 80px;
  height: 80px;
}

.grid-item.group {
  width: 160px;
  height: 160px;
}

.ghost {
  opacity: 0.5;
}

.chosen {
  transform: scale(1.05);
}

.drag {
  transform: rotate(5deg);
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
}

.context-menu {
  position: absolute;
  background: rgba(var(--v-theme-surface), 1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
  min-width: 180px;
  overflow: hidden;
}

.empty-grid {
  display: flex !important;
  align-items: center;
  justify-content: center;
  background: transparent;
  min-height: 400px;
  width: 100%;
  height: 100%;
}
</style>
