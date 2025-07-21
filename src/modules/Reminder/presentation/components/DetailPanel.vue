<template>
  <v-navigation-drawer
    v-model="isOpen"
    location="right"
    width="400"
    temporary
  >
    <div v-if="selectedItem" class="detail-panel pa-4">
      <!-- Template Details -->
      <div v-if="selectedItem.type === 'template'" class="template-details">
        <div class="d-flex align-center mb-4">
          <v-avatar size="48" class="mr-3" :color="selectedItem.data.isEnabled ? 'primary' : 'grey'">
            <v-icon color="white">{{ selectedItem.data.icon }}</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-h6">{{ selectedItem.data.name }}</h3>
            <p class="text-body-2 text-medium-emphasis">Reminder Template</p>
          </div>
        </div>

        <v-divider class="mb-4" />

        <div class="detail-section mb-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-subtitle-2">Status</span>
            <v-switch
              v-model="templateEnabled"
              color="primary"
              hide-details
              @change="onTemplateToggle"
            />
          </div>
          
          <v-alert
            v-if="!templateEnabled"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            This reminder is currently disabled
          </v-alert>
        </div>

        <div class="detail-section mb-4">
          <h4 class="text-subtitle-2 mb-2">Description</h4>
          <p class="text-body-2">{{ selectedItem.data.description || 'No description provided' }}</p>
        </div>

        <div class="detail-section mb-4">
          <h4 class="text-subtitle-2 mb-2">Schedule</h4>
          <div class="schedule-info">
            <div class="d-flex align-center mb-2">
              <v-icon size="16" class="mr-2">mdi-clock-outline</v-icon>
              <span class="text-body-2">{{ selectedItem.data.schedule?.time || 'Not set' }}</span>
            </div>
            <div class="d-flex align-center">
              <v-icon size="16" class="mr-2">mdi-calendar-outline</v-icon>
              <span class="text-body-2">{{ formatFrequency(selectedItem.data.schedule?.frequency) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section mb-4">
          <h4 class="text-subtitle-2 mb-2">Priority</h4>
          <v-chip :color="getPriorityColor(selectedItem.data.priority)" size="small">
            {{ selectedItem.data.priority || 'Medium' }}
          </v-chip>
        </div>

        <div class="detail-actions">
          <v-btn
            color="primary"
            variant="outlined"
            block
            class="mb-2"
            @click="editTemplate"
          >
            <v-icon start>mdi-pencil</v-icon>
            Edit Template
          </v-btn>
          
          <v-btn
            color="error"
            variant="outlined"
            block
            @click="deleteTemplate"
          >
            <v-icon start>mdi-delete</v-icon>
            Delete Template
          </v-btn>
        </div>
      </div>

      <!-- Group Details -->
      <div v-else-if="selectedItem.type === 'group'" class="group-details">
        <div class="d-flex align-center mb-4">
          <v-avatar size="48" class="mr-3" :color="selectedItem.data.isEnabled ? 'amber' : 'grey'">
            <v-icon color="white">{{ selectedItem.data.icon }}</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-h6">{{ selectedItem.data.name }}</h3>
            <p class="text-body-2 text-medium-emphasis">
              Reminder Group ({{ selectedItem.data.reminderTemplates.length }} templates)
            </p>
          </div>
        </div>

        <v-divider class="mb-4" />

        <div class="detail-section mb-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-subtitle-2">Group Status</span>
            <v-switch
              v-model="groupEnabled"
              color="primary"
              hide-details
              @change="onGroupToggle"
            />
          </div>

          <div v-if="selectedItem.data.controlsChildren" class="mb-3">
            <v-switch
              v-model="groupControlsChildren"
              color="amber"
              hide-details
              label="Control all child reminders"
              @change="onGroupControlToggle"
            />
            <p class="text-caption text-medium-emphasis mt-1">
              When enabled, this group controls all child reminder states
            </p>
          </div>

          <v-alert
            v-if="!groupEnabled"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            This group is currently disabled
          </v-alert>
        </div>

        <div class="detail-section mb-4">
          <h4 class="text-subtitle-2 mb-2">Description</h4>
          <p class="text-body-2">{{ selectedItem.data.description || 'No description provided' }}</p>
        </div>

        <div class="detail-section mb-4">
          <h4 class="text-subtitle-2 mb-2">Templates in Group</h4>
          <div v-if="selectedItem.data.reminderTemplates.length === 0" class="text-body-2 text-medium-emphasis">
            No templates in this group
          </div>
          <div v-else class="template-list">
            <div
              v-for="templateId in selectedItem.data.reminderTemplates"
              :key="templateId"
              class="template-item d-flex align-center pa-2 rounded mb-1"
              @click="selectTemplate(templateId)"
            >
              <v-icon size="16" class="mr-2">mdi-bell</v-icon>
              <span class="text-body-2 flex-grow-1">{{ getTemplateName(templateId) }}</span>
              <v-icon size="16" color="primary">mdi-chevron-right</v-icon>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <v-btn
            color="primary"
            variant="outlined"
            block
            class="mb-2"
            @click="editGroup"
          >
            <v-icon start>mdi-pencil</v-icon>
            Edit Group
          </v-btn>
          
          <v-btn
            color="error"
            variant="outlined"
            block
            @click="deleteGroup"
          >
            <v-icon start>mdi-delete</v-icon>
            Delete Group
          </v-btn>
        </div>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { GridItem } from '../../domain/entities/ReminderTemplateGroup';

interface Props {
  modelValue: boolean;
  selectedItem: GridItem | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'update:template': [templateId: string, enabled: boolean];
  'update:group': [groupId: string, enabled: boolean, controlsChildren: boolean];
  'edit:template': [item: GridItem];
  'edit:group': [item: GridItem];
  'delete:template': [item: GridItem];
  'delete:group': [item: GridItem];
  'select:template': [templateId: string];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const templateEnabled = ref(false);
const groupEnabled = ref(false);
const groupControlsChildren = ref(false);

const formatFrequency = (frequency: string) => {
  const frequencyMap: Record<string, string> = {
    'once': 'One time',
    'daily': 'Daily',
    'weekly': 'Weekly',
    'monthly': 'Monthly'
  };
  return frequencyMap[frequency] || 'Not set';
};

const getPriorityColor = (priority: string) => {
  const colorMap: Record<string, string> = {
    'low': 'success',
    'medium': 'warning',
    'high': 'error'
  };
  return colorMap[priority] || 'warning';
};

const getTemplateName = (templateId: string) => {
  // This should be replaced with actual template lookup
  return `Template ${templateId.slice(-4)}`;
};

const onTemplateToggle = () => {
  if (props.selectedItem?.type === 'template') {
    emit('update:template', props.selectedItem.uuid, templateEnabled.value);
  }
};

const onGroupToggle = () => {
  if (props.selectedItem?.type === 'group') {
    emit('update:group', props.selectedItem.uuid, groupEnabled.value, groupControlsChildren.value);
  }
};

const onGroupControlToggle = () => {
  if (props.selectedItem?.type === 'group') {
    emit('update:group', props.selectedItem.uuid, groupEnabled.value, groupControlsChildren.value);
  }
};

const editTemplate = () => {
  if (props.selectedItem) {
    emit('edit:template', props.selectedItem);
  }
};

const editGroup = () => {
  if (props.selectedItem) {
    emit('edit:group', props.selectedItem);
  }
};

const deleteTemplate = () => {
  if (props.selectedItem) {
    emit('delete:template', props.selectedItem);
  }
};

const deleteGroup = () => {
  if (props.selectedItem) {
    emit('delete:group', props.selectedItem);
  }
};

const selectTemplate = (templateId: string) => {
  emit('select:template', templateId);
};

// Watch for changes to selectedItem and update local state
watch(() => props.selectedItem, (item) => {
  if (item) {
    if (item.type === 'template') {
      templateEnabled.value = item.data.isEnabled ?? true;
    } else if (item.type === 'group') {
      groupEnabled.value = item.data.isEnabled ?? true;
      groupControlsChildren.value = item.data.controlsChildren ?? false;
    }
  }
}, { immediate: true });
</script>

<style scoped>
.detail-panel {
  height: 100%;
  overflow-y: auto;
}

.detail-section {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 16px;
}

.detail-section:last-child {
  border-bottom: none;
}

.schedule-info {
  background: rgba(0, 0, 0, 0.02);
  padding: 12px;
  border-radius: 8px;
}

.template-list {
  max-height: 200px;
  overflow-y: auto;
}

.template-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.template-item:hover {
  background: rgba(0, 0, 0, 0.02);
}

.detail-actions {
  margin-top: 24px;
}
</style>
