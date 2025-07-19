<template>
  <v-dialog :model-value="isOpen" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-bell-plus' }}</v-icon>
        {{ isEditing ? 'Edit Reminder Template' : 'Create Reminder Template' }}
        <v-spacer />
        <v-btn icon variant="text" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form ref="formRef" v-model="isFormValid">
          <v-text-field v-model="formData.name" label="Template Name" :rules="nameRules" required class="mb-4" />

          <v-textarea v-model="formData.description" label="Description" rows="3" class="mb-4" />

          <v-select v-model="formData.groupId" :items="groupOptions" label="Group" class="mb-4"
            item-text="name" item-value="id" prepend-inner-icon="mdi-folder" />
          <v-select v-model="formData.importanceLevel" :items="priorityOptions" label="Priority" class="mb-4" />

          <v-switch v-model="formData.selfEnabled" label="Enable Template" color="primary" class="mb-4" />

          <!-- 时间配置 -->
          <div class="mb-4">
            <v-label class="mb-2">Reminder Time</v-label>
            <div class="d-flex align-center gap-2 mb-3">
              <v-select v-model="selectedHour" :items="hourOptions" label="Hour" density="compact"
                style="width: 100px;" />
              <span>时</span>
              <v-select v-model="selectedMinute" :items="minuteOptions" label="Minute" density="compact"
                style="width: 100px;" />
              <span>分</span>
            </div>
            <div class="text-caption text-medium-emphasis">
              Selected time: {{ selectedTime }}
            </div>
          </div>

          <!-- 星期选择器 -->
          <div class="mb-4">
            <v-label class="mb-2">Days of Week</v-label>
            <v-chip-group v-model="selectedDaysOfWeek" multiple column>
              <v-chip v-for="day in weekDayOptions" :key="day.value" :value="day.value" variant="outlined" filter>
                {{ day.title }}
              </v-chip>
            </v-chip-group>
            <div class="text-caption text-medium-emphasis mt-1">
              Selected days: {{ selectedDaysText }}
            </div>
          </div>

        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="closeDialog">
          Cancel
        </v-btn>
        <v-btn color="primary" :disabled="!isFormValid" @click="handleSubmit">
          {{ isEditing ? 'Update' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ReminderTemplate } from '@/modules/Reminder/domain/aggregates/reminderTemplate';
import { ImportanceLevel } from '@/shared/types/importance';
import type { RecurrenceRule, Recurrence } from '@/shared/types/recurrenceRule';
import { RecurrenceRuleHelper } from '@/shared/utils/recurrenceRuleHelpre';
import { useReminderStore } from '../../stores/reminderStore';
import type { TemplateFormData } from '@/modules/Reminder/domain/types';

interface Props {
  modelValue: boolean;
  template: ReminderTemplate | null;
}

const props = withDefaults(defineProps<Props>(), {
  template: null
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;

  (e: 'create-template', data: TemplateFormData): void;
  (e: 'update-template', data: TemplateFormData): void;
}>();

const reminderStore = useReminderStore();

const formRef = ref();
const isFormValid = ref(false);

const groupOptions = reminderStore.getReminderGroups;

const selectedHour = ref(9);
const selectedMinute = ref(0);
const selectedDaysOfWeek = ref<number[]>([]);
const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  title: `${i.toString().padStart(2, '0')} 时`,
  value: i
}));

const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
  title: `${i.toString().padStart(2, '0')} 分`,
  value: i
}));

const weekDayOptions = [
  { title: '周日', value: 0 },
  { title: '周一', value: 1 },
  { title: '周二', value: 2 },
  { title: '周三', value: 3 },
  { title: '周四', value: 4 },
  { title: '周五', value: 5 },
  { title: '周六', value: 6 }
];

const selectedTime = computed(() => {
  return `${selectedHour.value.toString().padStart(2, '0')}:${selectedMinute.value.toString().padStart(2, '0')}`;
});

const selectedDaysText = computed(() => {
  if (selectedDaysOfWeek.value.length === 0) return 'None';
  if (selectedDaysOfWeek.value.length === 7) return 'Every day';
  
  return selectedDaysOfWeek.value
    .sort()
    .map(day => weekDayOptions.find(opt => opt.value === day)?.title)
    .join(', ');
});


// 将时间和星期转换为 RecurrenceRule
const convertToRecurrenceRule = (): RecurrenceRule => {
  return RecurrenceRuleHelper.fromUISelectors(
    selectedHour.value,
    selectedMinute.value,
    selectedDaysOfWeek.value
  );
};

// 从 RecurrenceRule 解析时间和星期
const parseFromRecurrenceRule = (rule: RecurrenceRule) => {
  const { hour, minute, daysOfWeek } = RecurrenceRuleHelper.toUISelectors(rule);
  selectedHour.value = hour;
  selectedMinute.value = minute;
  selectedDaysOfWeek.value = daysOfWeek;
};

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const isEditing = computed(() => !!props.template);

const formData = ref<TemplateFormData>({
  name: '',
  description: '',
  importanceLevel: ImportanceLevel.Moderate,
  selfEnabled: false,
  enabled: true,
  notificationSettings: {
    sound: true,
    vibration: false,
    popup: true
  },
  timeConfig: {
    name: '',
    type: 'absolute',
    duration: undefined, // For relative time
    schedule: RecurrenceRuleHelper.createDefault() // Default to daily at 9 AM
  }
});

const nameRules = [
  (v: string) => !!v || 'Name is required',
  (v: string) => v.length >= 2 || 'Name must be at least 2 characters'
];

const priorityOptions = [
  { title: 'Trivial', value: ImportanceLevel.Trivial },
  { title: 'Minor', value: ImportanceLevel.Minor },
  { title: 'Moderate', value: ImportanceLevel.Moderate },
  { title: 'Important', value: ImportanceLevel.Important },
  { title: 'Vital', value: ImportanceLevel.Vital }
];

const closeDialog = () => {
  isOpen.value = false;
  resetForm();
};

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    importanceLevel: ImportanceLevel.Moderate,
    selfEnabled: false,
    enabled: true,
    notificationSettings: {
      sound: true,
      vibration: false,
      popup: true
    },
    timeConfig: {
      name: '',
      type: 'absolute',
      duration: undefined,
      schedule: RecurrenceRuleHelper.createDefault()
    }
  };
  
  // 重置时间选择器
  selectedHour.value = 9;
  selectedMinute.value = 0;
  selectedDaysOfWeek.value = [];
};

const handleSubmit = () => {
  
  if (isFormValid.value) {
    console.log('当前是否为编辑模式:', isEditing.value);
    if (isEditing.value) {
      console.log('发送了更新模板事件');
    emit('update-template', { ...formData.value });
  } else {
    console.log('发送了创建模板事件');
    emit('create-template', { ...formData.value });
  }
    closeDialog();
  }
};

// Load template data when editing
watch(() => props.template, (template) => {
  if (template) {
    formData.value = {
      name: template.name || '',
      description: template.description || '',
      importanceLevel: template.importanceLevel || ImportanceLevel.Moderate,
      selfEnabled: template.selfEnabled || false,
      enabled: template.enabled || true,
      notificationSettings: {
        sound: template.notificationSettings?.sound || false,
        vibration: template.notificationSettings?.vibration || false,
        popup: template.notificationSettings?.popup || false
      },
      timeConfig: {
        name: template.timeConfig?.name || '',
        type: template.timeConfig?.type || 'absolute',
        // duration: template.timeConfig?.duration || undefined, // For relative time
        schedule: template.timeConfig?.schedule || { second: 0, minute: 0, hour: 9, dayOfWeek: '*', month: '*', year: '*' }
      } // Default to UTC if not set
      
    };
    if (template.timeConfig?.schedule) {
      parseFromRecurrenceRule(template.timeConfig.schedule);
    }
    
  }
}, { immediate: true });

watch([selectedHour, selectedMinute, selectedDaysOfWeek], () => {
  formData.value.timeConfig.schedule = convertToRecurrenceRule();
  
}, { deep: true });

</script>
