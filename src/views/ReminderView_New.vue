<template>
  <div class="reminder-view">
    <!-- Header -->
    <div class="reminder-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <v-icon size="32" class="mr-3">mdi-bell-ring</v-icon>
            Reminders
          </h1>
          <p class="page-subtitle">
            Manage your daily reminders and important tasks
          </p>
        </div>
      </div>
    </div>

    <!-- Grid Container -->
    <div class="grid-container">
      <ReminderGrid
        :items="allGridItems"
        :grid-size="gridSize"
        @item-click="onItemClick"
        @item-move="onItemMove"
        @create-template="onCreateTemplate"
        @create-group="onCreateGroup"
        @delete-item="onDeleteItem"
        @edit-item="onEditItem"
      />
    </div>

    <!-- Detail Panel -->
    <DetailPanel
      v-model="isDetailPanelOpen"
      :selected-item="selectedItem"
      @update:template="onUpdateTemplate"
      @update:group="onUpdateGroup"
      @edit:template="onEditTemplate"
      @edit:group="onEditGroup"
      @delete:template="onDeleteTemplate"
      @delete:group="onDeleteGroup"
      @select:template="onSelectTemplate"
    />

    <!-- Template Dialog -->
    <TemplateDialog
      v-model="templateDialog.show"
      :template="templateDialog.template"
      @submit="onTemplateSubmit"
    />

    <!-- Group Dialog -->
    <GroupDialog
      v-model="groupDialog.show"
      :group="groupDialog.group"
      @submit="onGroupSubmit"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          Confirm Delete
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deleteDialog.itemName }}"?
          {{ deleteDialog.type === 'group' ? 'This will also remove all templates from the group.' : '' }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteDialog.show = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ReminderGrid from '../modules/Reminder/presentation/components/grid/ReminderGrid.vue';
import DetailPanel from '../modules/Reminder/presentation/components/DetailPanel.vue';
import TemplateDialog from '../modules/Reminder/presentation/components/dialogs/TemplateDialog.vue';
import GroupDialog from '../modules/Reminder/presentation/components/dialogs/GroupDialog.vue';
import { useReminderGrid } from '../modules/Reminder/presentation/composables/useReminderGrid';
import { GridItem } from '../modules/Reminder/domain/entities/ReminderTemplateGroup';

// Grid settings
const gridSize = ref(80);

// Use the reminder grid composable
const {
  allGridItems,
  selectedItem,
  isDetailPanelOpen,
  selectItem,
  closeDetailPanel,
  createTemplate,
  createGroup,
  updateTemplate,
  updateGroup,
  deleteTemplate,
  deleteGroup,
  moveItem,
  loadInitialData
} = useReminderGrid();

// Dialog states
const templateDialog = ref({
  show: false,
  template: null as any,
  position: { x: 0, y: 0 }
});

const groupDialog = ref({
  show: false,
  group: null as any,
  position: { x: 0, y: 0 }
});

const deleteDialog = ref({
  show: false,
  item: null as GridItem | null,
  itemName: '',
  type: ''
});

// Event handlers
const onItemClick = (item: GridItem) => {
  selectItem(item);
};

const onItemMove = (item: GridItem, newPosition: { x: number; y: number }) => {
  moveItem(item.id, newPosition);
};

const onCreateTemplate = (position: { x: number; y: number }) => {
  templateDialog.value = {
    show: true,
    template: null,
    position
  };
};

const onCreateGroup = (position: { x: number; y: number }) => {
  groupDialog.value = {
    show: true,
    group: null,
    position
  };
};

const onDeleteItem = (item: GridItem) => {
  deleteDialog.value = {
    show: true,
    item,
    itemName: item.data.name,
    type: item.type
  };
};

const onEditItem = (item: GridItem) => {
  if (item.type === 'template') {
    templateDialog.value = {
      show: true,
      template: item.data,
      position: { x: 0, y: 0 }
    };
  } else if (item.type === 'group') {
    groupDialog.value = {
      show: true,
      group: item.data,
      position: { x: 0, y: 0 }
    };
  }
};

// Detail panel handlers
const onUpdateTemplate = (templateId: string, enabled: boolean) => {
  updateTemplate(templateId, { isEnabled: enabled });
};

const onUpdateGroup = (groupId: string, enabled: boolean, controlsChildren: boolean) => {
  updateGroup(groupId, { isEnabled: enabled, controlsChildren });
};

const onEditTemplate = (item: GridItem) => {
  templateDialog.value = {
    show: true,
    template: item.data,
    position: { x: 0, y: 0 }
  };
};

const onEditGroup = (item: GridItem) => {
  groupDialog.value = {
    show: true,
    group: item.data,
    position: { x: 0, y: 0 }
  };
};

const onDeleteTemplate = (item: GridItem) => {
  onDeleteItem(item);
};

const onDeleteGroup = (item: GridItem) => {
  onDeleteItem(item);
};

const onSelectTemplate = (templateId: string) => {
  // Find and select the template
  const templateItem = allGridItems.value.find(item => 
    item.type === 'template' && item.id === templateId
  );
  if (templateItem) {
    selectItem(templateItem);
  }
};

// Dialog handlers
const onTemplateSubmit = async (data: any) => {
  if (templateDialog.value.template) {
    // Edit existing template
    updateTemplate(templateDialog.value.template.id, data);
  } else {
    // Create new template
    await createTemplate(data, templateDialog.value.position);
  }
  templateDialog.value.show = false;
};

const onGroupSubmit = async (data: any) => {
  if (groupDialog.value.group) {
    // Edit existing group
    updateGroup(groupDialog.value.group.id, data);
  } else {
    // Create new group
    await createGroup(data, groupDialog.value.position);
  }
  groupDialog.value.show = false;
};

const confirmDelete = () => {
  if (deleteDialog.value.item) {
    if (deleteDialog.value.type === 'template') {
      deleteTemplate(deleteDialog.value.item.id);
    } else if (deleteDialog.value.type === 'group') {
      deleteGroup(deleteDialog.value.item.id);
    }
  }
  deleteDialog.value.show = false;
  closeDetailPanel();
};

// Initialize
onMounted(() => {
  loadInitialData();
});
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
  background: rgba(255, 255, 255, 0.8);
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
