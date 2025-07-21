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
          <v-text-field v-model="templateName" label="Template Name" :rules="nameRules" required class="mb-4" />

          <v-textarea v-model="templateDescription" label="Description" rows="3" class="mb-4" />

          <v-select v-model="templateImportanceLevel" :items="priorityOptions" label="Priority" class="mb-4" />

          <v-switch v-model="templateSelfEnabled" label="Enable Template" color="primary" class="mb-4" />

          <!-- 通知设置 -->
          <v-switch v-model="templateNotificationSound" label="Sound" color="primary" class="mb-2" />
          <v-switch v-model="templateNotificationVibration" label="Vibration" color="primary" class="mb-2" />
          <v-switch v-model="templateNotificationPopup" label="Popup" color="primary" class="mb-4" />

          <!-- 时间配置 -->
          <div class="mb-4">
            <v-label class="mb-2">Reminder Time</v-label>
            <div class="d-flex align-center gap-2 mb-3">
              <v-select v-model="timeHour" :items="hourOptions" label="Hour" density="compact" style="width: 100px;" />
              <span>时</span>
              <v-select v-model="timeMinute" :items="minuteOptions" label="Minute" density="compact" style="width: 100px;" />
              <span>分</span>
            </div>
            <div class="text-caption text-medium-emphasis">
              Selected time: {{ selectedTime }}
            </div>
          </div>

          <!-- 星期选择器 -->
          <div class="mb-4">
            <v-label class="mb-2">Days of Week</v-label>
            <v-chip-group v-model="timeDaysOfWeek" multiple column>
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
import { RecurrenceRuleHelper } from '@/shared/utils/recurrenceRuleHelpre';

interface Props {
  modelValue: boolean;
  template?: ReminderTemplate | null;
}

const props = withDefaults(defineProps<Props>(), {
  template: null
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'create-template', template: ReminderTemplate): void;
  (e: 'update-template', template: ReminderTemplate): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const isEditing = computed(() => !!props.template);

// 1. 编辑时 clone，创建时 forCreate
const templateModel = ref<ReminderTemplate>(
  props.template ? props.template.clone() : ReminderTemplate.forCreate()
);


// 3. computed get/set 绑定属性
const templateName = computed({
  get: () => templateModel.value.name,
  set: (val: string) => (templateModel.value.name = val)
});
const templateDescription = computed({
  get: () => templateModel.value.description,
  set: (val: string) => (templateModel.value.description = val)
});
const templateImportanceLevel = computed({
  get: () => templateModel.value.importanceLevel,
  set: (val: ImportanceLevel) => (templateModel.value.importanceLevel = val)
});
const templateSelfEnabled = computed({
  get: () => templateModel.value.selfEnabled,
  set: (val: boolean) => (templateModel.value.selfEnabled = val)
});
const templateNotificationSound = computed({
  get: () => templateModel.value.notificationSettings?.sound ?? false,
  set: (val: boolean) => (templateModel.value.notificationSettings.sound = val)
});
const templateNotificationVibration = computed({
  get: () => templateModel.value.notificationSettings?.vibration ?? false,
  set: (val: boolean) => (templateModel.value.notificationSettings.vibration = val)
});
const templateNotificationPopup = computed({
  get: () => templateModel.value.notificationSettings?.popup ?? false,
  set: (val: boolean) => (templateModel.value.notificationSettings.popup = val)
});

// 时间配置相关
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

const timeHour = ref(9);
const timeMinute = ref(0);
const timeDaysOfWeek = ref<number[]>([]);

const selectedTime = computed(() => {
  return `${timeHour.value.toString().padStart(2, '0')}:${timeMinute.value.toString().padStart(2, '0')}`;
});
const selectedDaysText = computed(() => {
  if (timeDaysOfWeek.value.length === 0) return 'None';
  if (timeDaysOfWeek.value.length === 7) return 'Every day';
  return timeDaysOfWeek.value
    .sort()
    .map(day => weekDayOptions.find(opt => opt.value === day)?.title)
    .join(', ');
});
// 从 RecurrenceRule 解析时间和星期
const parseFromRecurrenceRule = (rule: any) => {
  const { hour, minute, daysOfWeek } = RecurrenceRuleHelper.toUISelectors(rule);
  timeHour.value = hour;
  timeMinute.value = minute;
  timeDaysOfWeek.value = daysOfWeek;
};

// 将时间和星期转换为 RecurrenceRule
const convertToRecurrenceRule = () => {
  return RecurrenceRuleHelper.fromUISelectors(
    timeHour.value,
    timeMinute.value,
    timeDaysOfWeek.value
  );
};

// 监听时间相关 UI 变化，实时同步到 model
watch([timeHour, timeMinute, timeDaysOfWeek], () => {
  if (templateModel.value.timeConfig) {
    templateModel.value.timeConfig.schedule = convertToRecurrenceRule();
  }
}, { deep: true });

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

const formRef = ref();
const isFormValid = ref(false);

const closeDialog = () => {
  isOpen.value = false;
};

const handleSubmit = () => {
  if (isFormValid.value) {
    if (props.template) {
      emit('update-template', templateModel.value as ReminderTemplate);
    } else {
      emit('create-template', templateModel.value as ReminderTemplate);
    }
    closeDialog();
  }
};

// 2. 响应 props.template 变化
watch(
  () => props.template,
  (tpl) => {
    templateModel.value = tpl ? tpl.clone() : ReminderTemplate.forCreate();
    // 解析时间配置到 UI
    if (templateModel.value.timeConfig?.schedule) {
      parseFromRecurrenceRule(templateModel.value.timeConfig.schedule);
    }
  },
  { immediate: true }
);

</script>