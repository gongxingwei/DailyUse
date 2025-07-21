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
            v-model="groupModelName"
            label="Group Name"
            :rules="nameRules"
            required
            class="mb-4"
          />

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
import { ReminderTemplateGroup } from '@/modules/Reminder/domain/aggregates/reminderTemplateGroup';

interface Props {
  modelValue: boolean;
  group?: ReminderTemplateGroup | null;
}

const props = withDefaults(defineProps<Props>(), {
  group: null
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', data: ReminderTemplateGroup): void;
}>();

const formRef = ref();
const isFormValid = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const isEditing = computed(() => !!props.group);

// 1. 编辑时 clone，创建时 forCreate
const groupModel = ref<ReminderTemplateGroup>(
  props.group ? props.group.clone() : ReminderTemplateGroup.forCreate()
);

// 2. 响应 props.group 变化
watch(
  () => props.group,
  (group) => {
    groupModel.value = group ? group.clone() : ReminderTemplateGroup.forCreate();
  },
  { immediate: true }
);

// 3. computed get/set 绑定属性
const groupModelName = computed({
  get: () => groupModel.value.name,
  set: (val: string) => (groupModel.value.name = val)
});

const nameRules = [
  (v: string) => !!v || 'Name is required',
  (v: string) => v.length >= 2 || 'Name must be at least 2 characters'
];

const closeDialog = () => {
  isOpen.value = false;
};

const handleSubmit = () => {
  if (isFormValid.value) {
    emit('submit', groupModel.value as ReminderTemplateGroup);
    closeDialog();
  }
};
</script>