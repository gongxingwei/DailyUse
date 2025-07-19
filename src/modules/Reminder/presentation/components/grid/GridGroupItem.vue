<template>
  <div 
    class="grid-group-item" 
    :class="{ open: isOpen, disabled: !item.enabled }"
    @click="handleOpenFolder"
  >
    <!-- Folder icon and name when closed -->
    <div class="folder-closed">
      <div class="folder-icon">
        <v-icon size="48" :color="item.enabled ? 'amber' : 'grey'">
          mdi-folder
        </v-icon>
      </div>
      <div class="folder-name">
        {{ item.name }}
      </div>
    </div>
  </div>

  <div>

  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue';
import { GridItem } from '../../../domain/types';
import { ReminderTemplate } from '../../../domain/aggregates/reminderTemplate';
import { ReminderTemplateGroup } from '../../../domain/aggregates/reminderTemplateGroup';

interface Props {
  item: ReminderTemplateGroup;
}

const props = defineProps<Props>();


const onClickTemplate = inject<(item: ReminderTemplate) => void>('onClickTemplate');
const onGroupOpen = inject<(group: ReminderTemplateGroup) => void>('onGroupOpen');

const isOpen = ref(false);

const handleOpenFolder = () => {
  if (onGroupOpen) {
    onGroupOpen(props.item);
  } 
  
};


// These functions should be replaced with actual data fetching
const getTemplateName = (templateId: string) => {
  return `Template ${templateId.slice(-4)}`;
};

const getTemplateIcon = () => {
  return 'mdi-bell';
};

const getTemplateColor = () => {
  return 'primary';
};
</script>

<style scoped>
.grid-group-item {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
}

.grid-group-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.grid-group-item.disabled {
  opacity: 0.5;
  background: rgba(128, 128, 128, 0.2);
}

.folder-closed {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.folder-icon {
  position: relative;
  margin-bottom: 8px;
}

.folder-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff5722;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}

.folder-name {
  font-size: 12px;
  text-align: center;
  line-height: 1.2;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.folder-open {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.folder-header {
  display: flex;
  align-items: center;
  padding: 8px;
  background: rgba(255, 193, 7, 0.1);
  border-bottom: 1px solid rgba(255, 193, 7, 0.2);
}

.folder-title {
  flex: 1;
  margin-left: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.folder-content {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.folder-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.item-name {
  margin-left: 8px;
  font-size: 10px;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-folder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-text {
  font-size: 10px;
  margin-top: 4px;
}

.disabled .folder-name,
.disabled .folder-title,
.disabled .item-name {
  color: #999;
}
</style>
