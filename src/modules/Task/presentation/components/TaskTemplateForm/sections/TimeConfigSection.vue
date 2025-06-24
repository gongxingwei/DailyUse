<!-- widgets/TimeConfigSection.vue -->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-clock-outline</v-icon>
      时间配置
    </v-card-title>
    <v-card-text>
      <!-- 显示验证错误 -->
      <v-alert 
        v-if="!isValid" 
        type="error" 
        variant="tonal" 
        class="mb-4"
      >
        <ul class="mb-0">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </v-alert>
      <!-- 显示警告信息 -->
      <v-alert 
        v-if="hasWarnings" 
        type="warning" 
        variant="tonal" 
        class="mb-4"
      >
        <ul class="mb-0">
          <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
        </ul>
      </v-alert>
      <!-- 任务类型选择 -->
      <v-row>
        <v-col cols="12">
          <v-radio-group v-model="localData.timeConfig.type" label="任务类型" inline>
            <v-radio label="全天任务" value="allDay" />
            <v-radio label="指定时间" value="timed" />
            <v-radio label="时间段" value="timeRange" />
          </v-radio-group>
        </v-col>

        <!-- 开始时间 -->
        <v-col cols="12" md="6">
          <v-text-field 
            v-model="startDateInput" 
            label="开始日期" 
            type="date" 
            variant="outlined" 
            required
            @update:model-value="updateStartDate" 
          />
        </v-col>
        
        <v-col cols="12" md="6" v-if="localData.timeConfig.type !== 'allDay'">
          <v-text-field 
            v-model="startTimeInput" 
            label="开始时间" 
            type="time" 
            variant="outlined" 
            required
            @update:model-value="updateStartTime" 
          />
        </v-col>

        <!-- 结束时间（仅时间段类型） -->
        <v-col cols="12" md="6" v-if="localData.timeConfig.type === 'timeRange'">
          <v-text-field 
            v-model="endDateInput" 
            label="结束日期" 
            type="date" 
            variant="outlined"
            @update:model-value="updateEndDate" 
          />
        </v-col>
        
        <v-col cols="12" md="6" v-if="localData.timeConfig.type === 'timeRange'">
          <v-text-field 
            v-model="endTimeInput" 
            label="结束时间" 
            type="time" 
            variant="outlined"
            @update:model-value="updateEndTime" 
          />
        </v-col> 
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TimeUtils } from '@/shared/utils/myDateTimeUtils';
import { useTimeConfigValidation } from '@/modules/Task/presentation/composables/useTimeConfigValidation';
interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
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

// 时间更新方法
const updateStartDate = (date: string) => {
  if (!date) return;
  
  const currentStart = localData.value.timeConfig.baseTime.start;
  const newStart = TimeUtils.updateDateKeepTime(currentStart, date);
  
  const updatedTemplate = localData.value.clone();
  updatedTemplate.updateTimeConfig({
    ...updatedTemplate.timeConfig,
    baseTime: {
      ...updatedTemplate.timeConfig.baseTime,
      start: newStart
    }
  });
  emit('update:modelValue', updatedTemplate);
};

const updateStartTime = (time: string) => {
  if (!time) return;
  
  const currentStart = localData.value.timeConfig.baseTime.start;
  const newStart = TimeUtils.updateTimeKeepDate(currentStart, time);
  
  const updatedTemplate = localData.value.clone();
  updatedTemplate.updateTimeConfig({
    ...updatedTemplate.timeConfig,
    baseTime: {
      ...updatedTemplate.timeConfig.baseTime,
      start: newStart
    }
  });
  emit('update:modelValue', updatedTemplate);
};const updateEndDate = (date: string) => {
  if (!date) return;
  
  const currentEnd = localData.value.timeConfig.baseTime.end;
  if (!currentEnd) return;
  
  const newEnd = TimeUtils.updateDateKeepTime(currentEnd, date);
  
  const updatedTemplate = localData.value.clone();
  updatedTemplate.updateTimeConfig({
    ...updatedTemplate.timeConfig,
    baseTime: {
      ...updatedTemplate.timeConfig.baseTime,
      end: newEnd
    }
  });
  emit('update:modelValue', updatedTemplate);
};

const updateEndTime = (time: string) => {
  if (!time) return;
  
  const currentEnd = localData.value.timeConfig.baseTime.end;
  if (!currentEnd) return;
  
  const newEnd = TimeUtils.updateTimeKeepDate(currentEnd, time);
  
  const updatedTemplate = localData.value.clone();
  updatedTemplate.updateTimeConfig({
    ...updatedTemplate.timeConfig,
    baseTime: {
      ...updatedTemplate.timeConfig.baseTime,
      end: newEnd
    }
  });
  emit('update:modelValue', updatedTemplate);
};// 初始化表单数据
const initializeFormData = () => {
  if (localData.value?.timeConfig?.baseTime?.start) {
    const startTime = localData.value.timeConfig.baseTime.start;
    startDateInput.value = TimeUtils.formatDateToInput(startTime);
    startTimeInput.value = TimeUtils.formatTimeToInput(startTime);
  }

  if (localData.value?.timeConfig?.baseTime?.end) {
    const endTime = localData.value.timeConfig.baseTime.end;
    endDateInput.value = TimeUtils.formatDateToInput(endTime);
    endTimeInput.value = TimeUtils.formatTimeToInput(endTime);
  }
};

// 监听时间配置变化，触发验证
watch(() => localData.value.timeConfig, () => {
  const isValid = validateTimeConfig(localData.value.timeConfig);
  emit('update:validation', isValid);
}, { deep: true, immediate: true });

// 监听模板变化，初始化表单数据
watch(() => props.modelValue, () => {
  initializeFormData();
}, { immediate: true });
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>