<template>
  <div ref="gridContainer" class="h-100 w-100" @contextmenu.prevent="onGridContextMenu">
    <draggable v-bind:model-value="items" item-key="id" :animation="200" :disabled="false" ghost-class="ghost"
      chosen-class="chosen" drag-class="drag" tag="div" class="reminder-grid" @start="onDragStart" @end="onDragEnd">
      <template #item="{ element }">
        <div :key="element.uuid" class="grid-item" @contextmenu.prevent="onItemContextMenu($event, element)">
          <component :is="getItemComponent(element)" :item="element" />
        </div>
      </template>
    </draggable>

    <!-- Context Menu -->
    <ContextMenu :show="contextMenu.show" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenu.items"
      @select="onContextMenuSelect" @close="closeContextMenu" />

    <!-- ReminderTemplateCard -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import GridTemplateItem from './/GridTemplateItem.vue';
import GridGroupItem from './/GridGroupItem.vue';
import ContextMenu from '..//context-menu/ContextMenu.vue';
import { ImportanceLevel } from '@/shared/types/importance';
import { useContextMenu } from '../..//composables/useContextMenu';
import { GridItem } from '../../../../../../common/modules/reminder/types/reminder';

import { ReminderTemplate } from '../../../domain/entities/reminderTemplate';
import { ReminderTemplateGroup } from '../../../domain/aggregates/reminderTemplateGroup';
import ReminderTemplateCard from '../ReminderTemplateCard.vue';

interface Props {
  items: any[];
  gridSize: number;
}

const emit = defineEmits<{
  (e: 'click-template', item: ReminderTemplate): void;
  (e: 'start-create-template'): void;
  (e: 'start-create-group'): void;
  (e: 'start-edit-item', item: GridItem): void;
  (e: 'start-delete-item', item: GridItem): void;
  (e: 'start-create-template'): void;
}>();


const props = withDefaults(defineProps<Props>(), {
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
      label: 'Add Reminder Template',
      icon: 'mdi-bell-plus',
      action: () => emit('start-create-template')
    },
    {
      label: 'Add Reminder Group',
      icon: 'mdi-folder-plus',
      action: () => emit('start-create-group')
    }
  ]);

};

const onItemContextMenu = (event: MouseEvent, item: GridItem) => {
  event.stopPropagation();

  const menuItems = [
    {
      label: 'Edit',
      icon: 'mdi-pencil',
      action: () => emit('start-edit-item', item)
    },
    {
      label: 'Delete',
      icon: 'mdi-delete',
      action: () => emit('start-delete-item', item)
    }
  ];

  if (ReminderTemplateGroup.isReminderTemplateGroup(item)) {
    menuItems.splice(1, 0, {
      label: 'Add Template to Group',
      icon: 'mdi-bell-plus',
      action: () => emit('start-create-template')
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

const onDragEnd = (event: any) => {

};

const handleOpenFolder = () => {
  console.log('Folder opened');
};

const onCloseFolder = () => {
  // Handle folder close
};

const handleClickTemplate = (item: ReminderTemplate) => {
  console.log('Template clicked:', item);
  emit('click-template', item);
};

</script>

<style scoped>
.reminder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  grid-template-rows: repeat(auto-fill, minmax(80px, 1fr));
  gap: 16px;
  /* 可选，元素间距 */
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: rgb(96, 96, 138);
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
</style>
