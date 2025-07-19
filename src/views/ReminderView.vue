<template>
  <div class="reminder-view">
    <!-- Grid Container -->
    <div class="grid-container">
      <ReminderGrid
        :items="allGridItems"
        :grid-size="gridSize"
        @click-template="handleClickTemplate"
        @start-create-template="startCreateTemplate"
        @start-create-group="startCreateGroup"
      />
    </div>

   
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

    <!-- ReminderTemplateCard -->
     <reminder-template-card
     :show="reminderTemplateCard.show"
      :template="reminderTemplateCard.template"
      @back="handleBackFromReminderTemplateCard"
      />

      <!-- ReminderTemplateGroupCard -->
    <reminder-template-group-card
      :show="reminderTemplateGroupCard.show"
      :template-group="reminderTemplateGroupCard.templateGroup"
      @back="handleBackFromReminderTemplateGroupCard"
      />

      <!-- TemplateDialog -->
      <template-dialog
        :model-value="templateDialog.show"
        :template="ReminderTemplate.ensureReminderTemplate(templateDialog.template)"
        @update:modelValue="templateDialog.show = $event"
        @create-template="handleCreateReminderTemplate"
        @update-template="handleUpdateReminderTemplate"
      />

      <!-- snackbar -->
      <v-snackbar v-model="snackbar.show" :message="snackbar.message" :color="snackbar.color" :timeout="snackbar.timeout">
      </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from 'vue';
import ReminderGrid from '../modules/Reminder/presentation/components/grid/ReminderGrid.vue';
import DetailPanel from '../modules/Reminder/presentation/components/DetailPanel.vue';
import TemplateDialog from '../modules/Reminder/presentation/components/dialogs/TemplateDialog.vue';
import GroupDialog from '../modules/Reminder/presentation/components/dialogs/GroupDialog.vue';
import { useReminderGrid } from '../modules/Reminder/presentation/composables/useReminderGrid';
import { GridItem } from '../modules/Reminder/domain/types';
import { ReminderTemplate } from '@/modules/Reminder/domain/aggregates/reminderTemplate';
// components
import ReminderTemplateCard from '@/modules/Reminder/presentation/components/ReminderTemplateCard.vue';
import ReminderTemplateGroupCard from '@/modules/Reminder/presentation/components/ReminderTemplateGroupCard.vue';
// composables
import { useReminderServices } from '@/modules/Reminder/presentation/composables/useReminderServices';

// Grid settings
const gridSize = ref(80);

provide('onGroupOpen', (group: any) => {
  handleOpenGroup(group);
});

provide('onClickTemplate', (item: ReminderTemplate) => {
  handleClickTemplate(item);
  
});

// Use the reminder grid composable
const {
  allGridItems,
  selectedItem,
  isDetailPanelOpen,
  selectItem,
  closeDetailPanel,

} = useReminderGrid();

const {
  snackbar,
  handleCreateReminderTemplate,
  handleUpdateReminderTemplate,
} = useReminderServices();


const deleteDialog = ref({
  show: false,
  item: null as GridItem | null,
  itemName: '',
  type: ''
});

const reminderTemplateCard = ref({
  show: false,
  template: null as any
});

const reminderTemplateGroupCard = ref({
  show: false,
  templateGroup: null as any
});

const templateDialog = ref({
  show: false,
  template: null as ReminderTemplate | null
});

const startCreateTemplate = () => {
  templateDialog.value.show = true;
  templateDialog.value.template = null; // Reset for new template
};

const startCreateGroup = () => {
  templateDialog.value.show = true;
  templateDialog.value.template = null; // Reset for new group
};

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


const confirmDelete = () => {
  if (deleteDialog.value.item) {
    if (deleteDialog.value.type === 'template') {
      deleteDialog.value.item = null;
    } else if (deleteDialog.value.type === 'group') {
      deleteDialog.value.item = null;
    }
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
