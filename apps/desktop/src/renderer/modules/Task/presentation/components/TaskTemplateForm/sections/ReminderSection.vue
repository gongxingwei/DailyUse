<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-bell-outline</v-icon>
      提醒设置
      <!-- 验证状态指示器 -->
      <v-icon v-if="!isValid" color="error" class="ml-2">mdi-alert-circle</v-icon>
      <v-icon v-else color="success" class="ml-2">mdi-check-circle</v-icon>
    </v-card-title>
    <v-card-text>
      <!-- 显示验证错误 -->
      <v-alert v-if="errors.length > 0" type="error" variant="tonal" class="mb-4">
        <ul class="mb-0">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </v-alert>

      <!-- 显示警告信息 -->
      <v-alert v-if="hasWarnings" type="warning" variant="tonal" class="mb-4">
        <ul class="mb-0">
          <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
        </ul>
      </v-alert>

      <v-row>
        <v-col cols="12">
          <v-switch v-model="localData.reminderConfig.enabled" label="启用提醒" color="primary" />
        </v-col>

        <template v-if="localData.reminderConfig.enabled">
          <v-col cols="12">
            <ReminderAlertsList
              v-model="localData.reminderConfig.alerts"
              @update:validation="handleAlertsValidation"
            />
          </v-col>

          <v-col cols="12">
            <ReminderSnoozeSettings v-model="localData.reminderConfig.snooze" />
          </v-col>
        </template>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import ReminderAlertsList from '../widgets/ReminderAlertsList.vue';
import ReminderSnoozeSettings from '../widgets/ReminderSnoozeSettings.vue';
import { useReminderValidation } from '../../../composables/useReminderValidation';
import type { TaskTemplate } from '@renderer/modules/Task/domain/aggregates/taskTemplate';
interface Props {
  modelValue: TaskTemplate;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: TaskTemplate];
  'update:validation': [isValid: boolean];
}>();

const localData = computed({
  get: () => props.modelValue,
  set: (value) => {
    const updatedTemplate = props.modelValue.clone();
    updatedTemplate.updateReminderConfig(value.reminderConfig);
    emit('update:modelValue', updatedTemplate);
  },
});

// 使用完整的验证功能
const {
  errors,
  warnings,
  isValid,
  hasWarnings,
  validateReminders,
  resetValidation,
  checkTimeConflicts,
} = useReminderValidation();

const handleAlertsValidation = (isValid: boolean) => {
  emit('update:validation', isValid);
};

// 执行验证并发射结果
const performValidation = () => {
  const validationResult = validateReminders(localData.value.reminderConfig);

  // 额外检查时间冲突
  if (validationResult && localData.value.reminderConfig.enabled) {
    checkTimeConflicts(localData.value.reminderConfig.alerts);
  }

  emit('update:validation', validationResult);
  return validationResult;
};

// 监听提醒配置变化，触发验证
watch(
  () => localData.value.reminderConfig,
  () => {
    performValidation();
  },
  { deep: true, immediate: true }, // 添加 immediate: true 进行初始验证
);

// 监听启用状态变化
watch(
  () => localData.value.reminderConfig.enabled,
  (newEnabled) => {
    if (!newEnabled) {
      resetValidation();
    }
  },
);
</script>
