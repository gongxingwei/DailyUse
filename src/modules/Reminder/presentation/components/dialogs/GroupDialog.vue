<template>
  <v-dialog v-model="isOpen" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-folder-plus' }}</v-icon>
        {{ isEditing ? 'Edit Reminder Group' : 'Create Reminder Group' }}
        <v-spacer />
        <v-btn icon variant="text" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form ref="formRef" v-model="isFormValid">
          <v-text-field
            v-model="formData.name"
            label="Group Name"
            :rules="nameRules"
            required
            class="mb-4"
          />

          <v-textarea
            v-model="formData.description"
            label="Description"
            rows="3"
            class="mb-4"
          />

          <v-select
            v-model="formData.icon"
            :items="iconOptions"
            label="Icon"
            class="mb-4"
          >
            <template #selection="{ item }">
              <v-icon class="mr-2">{{ item.value }}</v-icon>
              {{ item.title }}
            </template>
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon>{{ item.value }}</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <v-switch
            v-model="formData.isEnabled"
            label="Enable Group"
            color="primary"
            class="mb-4"
          />

          <v-switch
            v-model="formData.controlsChildren"
            label="Control all child reminders"
            color="primary"
            hint="When enabled, this group will control the enable/disable state of all child reminder templates"
            persistent-hint
            class="mb-4"
          />

          <v-divider class="my-4" />

          <div class="text-subtitle-2 mb-3">
            Templates in this group ({{ formData.reminderTemplates.length }})
          </div>

          <div v-if="formData.reminderTemplates.length === 0" class="text-body-2 text-disabled">
            No templates assigned to this group yet.
          </div>

          <div v-else class="template-list">
            <v-chip
              v-for="templateId in formData.reminderTemplates"
              :key="templateId"
              class="ma-1"
              closable
              @click:close="removeTemplate(templateId)"
            >
              <v-icon start>mdi-bell</v-icon>
              {{ getTemplateName(templateId) }}
            </v-chip>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn
          variant="text"
          @click="closeDialog"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          {{ isEditing ? 'Update' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ReminderTemplateGroup } from '../../../domain/entities/ReminderTemplateGroup';

interface GroupFormData {
  name: string;
  description: string;
  icon: string;
  isEnabled: boolean;
  controlsChildren: boolean;
  reminderTemplates: string[];
}

interface Props {
  modelValue: boolean;
  group?: ReminderTemplateGroup | null;
}

const props = withDefaults(defineProps<Props>(), {
  group: null
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: GroupFormData];
}>();

const formRef = ref();
const isFormValid = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const isEditing = computed(() => !!props.group);

const formData = ref<GroupFormData>({
  name: '',
  description: '',
  icon: 'mdi-folder',
  isEnabled: true,
  controlsChildren: false,
  reminderTemplates: []
});

const nameRules = [
  (v: string) => !!v || 'Name is required',
  (v: string) => v.length >= 2 || 'Name must be at least 2 characters'
];

const iconOptions = [
  { title: 'Folder', value: 'mdi-folder' },
  { title: 'Category', value: 'mdi-shape' },
  { title: 'Work', value: 'mdi-briefcase' },
  { title: 'Health', value: 'mdi-heart' },
  { title: 'Home', value: 'mdi-home' },
  { title: 'Exercise', value: 'mdi-run' },
  { title: 'Study', value: 'mdi-book' },
  { title: 'Shopping', value: 'mdi-cart' },
  { title: 'Travel', value: 'mdi-airplane' },
  { title: 'Finance', value: 'mdi-cash' }
];

const closeDialog = () => {
  isOpen.value = false;
  resetForm();
};

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    icon: 'mdi-folder',
    isEnabled: true,
    controlsChildren: false,
    reminderTemplates: []
  };
};

const removeTemplate = (templateId: string) => {
  const index = formData.value.reminderTemplates.indexOf(templateId);
  if (index > -1) {
    formData.value.reminderTemplates.splice(index, 1);
  }
};

const getTemplateName = (templateId: string) => {
  // This should be replaced with actual template lookup
  return `Template ${templateId.slice(-4)}`;
};

const handleSubmit = () => {
  if (isFormValid.value) {
    emit('submit', { ...formData.value });
    closeDialog();
  }
};

// Load group data when editing
watch(() => props.group, (group) => {
  if (group) {
    formData.value = {
      name: group.name || '',
      description: group.description || '',
      icon: group.icon || 'mdi-folder',
      isEnabled: group.isEnabled ?? true,
      controlsChildren: group.controlsChildren ?? false,
      reminderTemplates: [...(group.reminderTemplates || [])]
    };
  }
}, { immediate: true });
</script>

<style scoped>
.template-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 8px;
}
</style>
