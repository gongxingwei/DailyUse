<!-- widgets/TimeConfigSection.vue -->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-clock-outline</v-icon>
      时间配置
    </v-card-title>
    <v-card-text>
      <!-- 显示验证错误 -->
      <v-alert v-if="!isValid" type="error" variant="tonal" class="mb-4">
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

      <!-- 第一部分：日期配置 -->
      <v-row class="mb-4">
        <v-col cols="12">
          <h4 class="subsection-title">📅 日期范围</h4>
        </v-col>

        <!-- 开始日期 -->
        <v-col cols="12" md="6">
          <v-text-field v-model="startDateInput" label="开始日期" type="date" variant="outlined" required
            prepend-inner-icon="mdi-calendar" @update:model-value="updateStartDate" />
        </v-col>

        <!-- 无期限选项 -->
        <v-col cols="12" md="6">
          <v-switch v-model="isNoEndDate" label="无结束日期（长期任务）" color="primary" hide-details class="mt-2" />
        </v-col>

        <!-- 结束日期 -->
        <v-col cols="12" md="6" v-if="!isNoEndDate">
          <v-text-field v-model="endDateInput" label="结束日期" type="date" variant="outlined"
            prepend-inner-icon="mdi-calendar-end" hint="留空表示无结束日期" @update:model-value="updateEndDate" />
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- 第二部分：时间类型和时间设置 -->
      <v-row>
        <v-col cols="12">
          <h4 class="subsection-title">⏰ 每日时间设置</h4>
        </v-col>

        <!-- 时间类型选择 -->
        <v-col cols="12">
          <v-radio-group v-model="timeType" label="时间类型" inline>
            <v-radio label="全天任务" value="allDay">
              <template #label>
                <span class="d-flex align-center">
                  <v-icon class="mr-2" size="small">mdi-weather-sunny</v-icon>
                  全天任务
                </span>
              </template>
            </v-radio>
            <v-radio label="指定时间" value="specificTime">
              <template #label>
                <span class="d-flex align-center">
                  <v-icon class="mr-2" size="small">mdi-clock</v-icon>
                  指定时间
                </span>
              </template>
            </v-radio>
            <v-radio label="时间段" value="timeRange">
              <template #label>
                <span class="d-flex align-center">
                  <v-icon class="mr-2" size="small">mdi-clock-time-eight</v-icon>
                  时间段
                </span>
              </template>
            </v-radio>
          </v-radio-group>
        </v-col>

        <!-- 时间设置说明 -->
        <v-col cols="12" v-if="timeType === 'allDay'">
          <v-alert type="info" density="compact" variant="tonal">
            <v-icon start>mdi-information-outline</v-icon>
            全天任务不需要设置具体时间，将在当天任意时间执行
          </v-alert>
        </v-col>

        <!-- 开始时间（非全天任务） -->
        <v-col cols="12" md="6" v-if="timeType !== 'allDay'">
          <v-text-field v-model="startTimeInput" label="开始时间" type="time" variant="outlined" required
            prepend-inner-icon="mdi-clock-start" @update:model-value="updateStartTime" />
        </v-col>

        <!-- 结束时间（仅时间段类型） -->
        <v-col cols="12" md="6" v-if="timeType === 'timeRange'">
          <v-text-field v-model="endTimeInput" label="结束时间" type="time" variant="outlined"
            prepend-inner-icon="mdi-clock-end" hint="必须在同一天内" @update:model-value="updateEndTime" />
        </v-col>

        <!-- 时间段提示 -->
        <v-col cols="12" v-if="timeType === 'timeRange'">
          <v-alert type="info" density="compact" variant="tonal">
            <v-icon start>mdi-information-outline</v-icon>
            时间段任务将在指定的时间范围内进行，请确保结束时间晚于开始时间
          </v-alert>
        </v-col>

        <!-- 时区设置 -->
        <v-col cols="12" md="6">
          <v-select v-model="timezone" :items="timezoneOptions" label="时区" variant="outlined"
            prepend-inner-icon="mdi-earth" item-title="text" item-value="value" />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { TaskTemplate } from '@dailyuse/domain-client';
import { computed, ref, watch } from 'vue';
import { useTimeConfigValidation } from '@/modules/task/presentation/composables/useTimeConfigValidation';
import { TaskContracts } from '@dailyuse/contracts';
// utils
import { updateDateKeepTime, updateTimeKeepDate, formatDateToInput, formatTimeToInput } from '@dailyuse/utils';

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 时区选项
const timezoneOptions = [
  { text: '北京时间 (GMT+8)', value: 'Asia/Shanghai' },
  { text: 'UTC 标准时间', value: 'UTC' },
  { text: '纽约时间 (GMT-5)', value: 'America/New_York' },
  { text: '伦敦时间 (GMT+0)', value: 'Europe/London' },
  { text: '东京时间 (GMT+9)', value: 'Asia/Tokyo' },
];

const updateTemplate = (updater: (template: TaskTemplate) => void) => {
  const updatedTemplate = props.modelValue.clone();
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

// 时间类型控制
const timeType = computed({
  get: () => props.modelValue.timeConfig.time.timeType,
  set: (newType: TaskContracts.TaskTimeType) => {
    updateTemplate((template) => {
      (template as any)._timeConfig = {
        ...template.timeConfig,
        time: {
          ...template.timeConfig.time,
          timeType: newType,
          // 根据类型清理不相关的时间
          ...(newType === 'allDay' ? { startTime: undefined, endTime: undefined } : {}),
          ...(newType === 'specificTime' ? { endTime: undefined } : {})
        }
      };
    });
  }
});

// 时区控制
const timezone = computed({
  get: () => props.modelValue.timeConfig.timezone || 'Asia/Shanghai',
  set: (newTimezone: string) => {
    updateTemplate((template) => {
      (template as any)._timeConfig = {
        ...template.timeConfig,
        timezone: newTimezone
      };
    });
  }
});

// 无期限任务控制
const isNoEndDate = computed({
  get: () => !props.modelValue.timeConfig.date.endDate,
  set: (value: boolean) => {
    updateTemplate((template) => {
      (template as any)._timeConfig = {
        ...template.timeConfig,
        date: {
          ...template.timeConfig.date,
          endDate: value ? undefined : new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) // 默认30天后
        }
      };
    });
  }
});

// 使用时间配置验证
const {
  isValid,
  hasWarnings,
  errors,
  warnings,
  validateTimeConfig
} = useTimeConfigValidation();

// 表单输入字段
const startDateInput = ref('');
const startTimeInput = ref('');
const endDateInput = ref('');
const endTimeInput = ref('');

// 日期更新方法
const updateStartDate = (date: string) => {
  if (!date) return;

  updateTemplate((template) => {
    const newStartDate = new Date(date);
    (template as any)._timeConfig = {
      ...template.timeConfig,
      date: {
        ...template.timeConfig.date,
        startDate: newStartDate
      }
    };
  });
};

const updateEndDate = (date: string) => {
  if (!date) {
    updateTemplate((template) => {
      (template as any)._timeConfig = {
        ...template.timeConfig,
        date: {
          ...template.timeConfig.date,
          endDate: undefined
        }
      };
    });
    return;
  }

  updateTemplate((template) => {
    const newEndDate = new Date(date);
    (template as any)._timeConfig = {
      ...template.timeConfig,
      date: {
        ...template.timeConfig.date,
        endDate: newEndDate
      }
    };
  });
};

// 时间更新方法
const updateStartTime = (time: string) => {
  if (!time) return;

  updateTemplate((template) => {
    (template as any)._timeConfig = {
      ...template.timeConfig,
      time: {
        ...template.timeConfig.time,
        startTime: time
      }
    };
  });
};

const updateEndTime = (time: string) => {
  if (!time) return;

  updateTemplate((template) => {
    (template as any)._timeConfig = {
      ...template.timeConfig,
      time: {
        ...template.timeConfig.time,
        endTime: time
      }
    };
  });
};

// 初始化表单数据
const initializeFormData = () => {
  if (props.modelValue?.timeConfig?.date?.startDate) {
    startDateInput.value = formatDateToInput(props.modelValue.timeConfig.date.startDate);
  }

  if (props.modelValue?.timeConfig?.date?.endDate) {
    endDateInput.value = formatDateToInput(props.modelValue.timeConfig.date.endDate);
  }

  if (props.modelValue?.timeConfig?.time?.startTime) {
    startTimeInput.value = props.modelValue.timeConfig.time.startTime;
  }

  if (props.modelValue?.timeConfig?.time?.endTime) {
    endTimeInput.value = props.modelValue.timeConfig.time.endTime;
  }
};

// 监听时间配置变化，触发验证
watch(() => props.modelValue.timeConfig, () => {
  const isValid = validateTimeConfig(props.modelValue.timeConfig);
  emit('update:validation', isValid);
}, { deep: true, immediate: true });

// 监听模板变化，初始化表单数据
watch(() => props.modelValue, () => {
  initializeFormData();
}, { immediate: true });

// 监听无期限开关，自动清空结束日期输入框
watch(isNoEndDate, (newValue) => {
  if (newValue) {
    endDateInput.value = '';
  }
});
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
