<template>
  <div class="reminder-view">
    
    <!-- Grid Container -->
    <div class="grid-container">
      <ReminderGrid :items="allGridItems" :grid-size="gridSize" />
    </div>


    <ConfirmDialog :model-value="deleteDialog.show" :title="'确认删除'"
      :message="`确定要删除 “${deleteDialog.itemName}”${deleteDialog.type === 'group' ? '？这将同时删除该组中的所有模板。' : '？'}`"
      cancel-text="取消" confirm-text="删除" @update:modelValue="deleteDialog.show = $event" @confirm="confirmDelete"
      @cancel="deleteDialog.show = false" />

    <!-- ReminderTemplateCard -->
    <reminder-template-card :show="reminderTemplateCard.show" :template="reminderTemplateCard.template"
      @back="handleBackFromReminderTemplateCard" />

    <!-- ReminderTemplateGroupCard -->
    <reminder-template-group-card :show="reminderTemplateGroupCard.show"
      :template-group-uuid="(reminderTemplateGroupCard.templateGroup?.uuid as string)" @back="handleBackFromReminderTemplateGroupCard" />

    <!-- TemplateDialog -->
    <template-dialog :model-value="templateDialog.show"
      :template="(templateDialog.template as ReminderTemplate)"
      @update:modelValue="templateDialog.show = $event" @create-template="handleCreateReminderTemplate"
      @update-template="handleUpdateReminderTemplate" />

    <!-- GroupDialog -->
    <group-dialog :model-value="groupDialog.show"
      :group="(groupDialog.group as ReminderTemplateGroup)"
      @update:modelValue="groupDialog.show = $event" @create-group="handleCreateReminderGroup"
      @update-group="handleUpdateReminderGroup" />

    <!-- TemplateMoveDialog -->
    <template-move-dialog :model-value="moveTemplateDialog.show"
      :template="(moveTemplateDialog.template as ReminderTemplate)"
      @update:modelValue="moveTemplateDialog.show = $event" @move="handleMoveTemplateToGroup" />

    <!-- snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue';


import { useReminderGrid } from '../composables/useReminderGrid';
import { GridItem } from '../../../../../common/modules/reminder/types/reminder';
// domains
import { ReminderTemplateGroup } from '@/modules/Reminder/domain/aggregates/reminderTemplateGroup';
import { ReminderTemplate } from '@/modules/Reminder/domain/entities/reminderTemplate';
// components
import ReminderGrid from '@/modules/Reminder/presentation/components/grid/ReminderGrid.vue';
import ReminderTemplateCard from '@/modules/Reminder/presentation/components/ReminderTemplateCard.vue';
import ReminderTemplateGroupCard from '@/modules/Reminder/presentation/components/ReminderTemplateGroupCard.vue';
import TemplateDialog from '@/modules/Reminder/presentation/components/dialogs/TemplateDialog.vue';
import GroupDialog from '@/modules/Reminder/presentation/components/dialogs/GroupDialog.vue';
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue';
import TemplateMoveDialog from '@/modules/Reminder/presentation/components/dialogs/TemplateMoveDialog.vue';
// composables
import { useReminderServices } from '@/modules/Reminder/presentation/composables/useReminderServices';

// Grid settings
const gridSize = ref(100);

provide('onGroupOpen', (group: any) => {
  handleOpenGroup(group);
});

provide('onClickTemplate', (item: ReminderTemplate) => {
  console.log('祖先组件收到点击:', item);
  handleClickTemplate(item);

});

// 新建提醒模板
provide('onStartCreateTemplate', () => {
  // 打开新建提醒模板对话框
  startCreateTemplate();
});

// 新建分组
provide('onStartCreateGroup', () => {
  // 打开新建分组对话框
  startCreateGroup();
});

// 编辑网格项（模板或分组）
provide('onStartEditItem', (item: GridItem) => {
  // 打开编辑对话框
  handleEditGridItem(item);
});

// 删除网格项（模板或分组）
provide('onStartDeleteItem', (item: GridItem) => {
  // 打开删除确认对话框
  handleDeleteGridItem(item);
});

// 移动模板到分组
provide('onStartMoveTemplate', (template: ReminderTemplate) => {
  // 打开移动模板对话框
  startMoveTemplate(template);
});

provide('onSetGroupEnableMode', (groupUuid: string, enableMode: ReminderTemplateGroup['enableMode']) => {
  handleSetGroupEnableMode(groupUuid, enableMode);
});

provide('onSetGroupEnabled', (groupUuid: string, enabled: boolean) => {
  handleSetGroupEnabled(groupUuid, enabled);
});

provide('onSetTemplateEnabled', (templateUuid: string, enabled: boolean) => {
  handleSetTemplateEnabled(templateUuid, enabled);
});

// Use the reminder grid composable
const {
  allGridItems,
  selectItem,
  closeDetailPanel,

} = useReminderGrid();

const {
  snackbar,
  handleCreateReminderTemplate,
  handleUpdateReminderTemplate,
  handleCreateReminderGroup,
  handleUpdateReminderGroup,
  handleMoveTemplateToGroup,
  handleDeleteReminderGroup,
  handleDeleteReminderTemplate,
  handleSetGroupEnableMode,
  handleSetGroupEnabled,
  handleSetTemplateEnabled,
} = useReminderServices();


const deleteDialog = ref({
  show: false,
  item: null as GridItem | null,
  itemName: '',
  type: ''
});

// templateCard
const reminderTemplateCard = ref({
  show: false,
  template: null as any
});

const handleClickTemplate = (item: ReminderTemplate) => {
  reminderTemplateCard.value = {
    show: true,
    template: item
  };
  selectItem(item);
};

const handleBackFromReminderTemplateCard = () => {
  reminderTemplateCard.value.show = false;
  reminderTemplateCard.value.template = null;
};

// reminderTemplateGroupCard
const reminderTemplateGroupCard = ref({
  show: false,
  templateGroup: null as ReminderTemplateGroup | null
});

// reminderTemplateDialog
const templateDialog = ref({
  show: false,
  template: null as ReminderTemplate | null
});

const handleOpenGroup = (group: any) => {
  reminderTemplateGroupCard.value = {
    show: true,
    templateGroup: group
  };
  selectItem(group);
};

const handleBackFromReminderTemplateGroupCard = () => {
  reminderTemplateGroupCard.value.show = false;
  reminderTemplateGroupCard.value.templateGroup = null;
};

const startCreateTemplate = () => {
  templateDialog.value.show = true;
  templateDialog.value.template = null; // Reset for new template
};

// groupDialog
const groupDialog = ref({
  show: false,
  group: null as ReminderTemplateGroup | null
});

const startCreateGroup = () => {
  groupDialog.value.show = true;
  groupDialog.value.group = null; // Reset for new group
};

// mmove template dialog
const moveTemplateDialog = ref({
  show: false,
  template: null as ReminderTemplate | null
});

const startMoveTemplate = (template: ReminderTemplate) => {
  moveTemplateDialog.value.show = true;
  moveTemplateDialog.value.template = template; // Set the template to be moved
};

const handleEditGridItem = (item: GridItem) => {
  if (ReminderTemplate.isReminderTemplate(item)) {
    // 编辑提醒模板
    templateDialog.value.show = true;
    templateDialog.value.template = item;
  } else if (ReminderTemplateGroup.isReminderTemplateGroup(item)) {
    // 编辑分组
    groupDialog.value.show = true;
    groupDialog.value.group = item;
  }
};

const handleDeleteGridItem = (item: GridItem) => {
  deleteDialog.value.show = true;
  deleteDialog.value.item = item;
  if (ReminderTemplate.isReminderTemplate(item)) {
    deleteDialog.value.itemName = item.name;
    deleteDialog.value.type = 'template';
  } else if (ReminderTemplateGroup.isReminderTemplateGroup(item)) {
    deleteDialog.value.itemName = item.name;
    deleteDialog.value.type = 'group';
  }
};





const confirmDelete = () => {
  if (deleteDialog.value.item) {
    if (deleteDialog.value.type === 'template') {
      // 调用删除提醒模板的方法
      handleDeleteReminderTemplate(deleteDialog.value.item.uuid);
    } else if (deleteDialog.value.type === 'group') {
      // 调用删除分组的方法
      handleDeleteReminderGroup(deleteDialog.value.item.uuid);
    }
    deleteDialog.value.item = null;
  }
  deleteDialog.value.show = false;
  closeDetailPanel();
};


</script>

<style scoped>
.reminder-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg,
      rgba(var(--v-theme-primary), 0.02) 0%,
      rgba(var(--v-theme-surface), 0.95) 100%);
}

.reminder-header {
  padding: 24px;
  background: rgba(var(--v-theme-surface), 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 8px;
}

.page-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 1rem;
  margin: 0;
}

.grid-container {
  flex: 1;
  padding: 24px;
  overflow: auto;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .reminder-header {
    padding: 16px;
  }

  .grid-container {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
