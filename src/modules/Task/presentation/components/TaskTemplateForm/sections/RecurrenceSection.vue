<!-- widgets/RecurrenceSection.vue -->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-repeat</v-icon>
      重复规则
    </v-card-title>
    <v-card-text>
      <!-- 显示验证错误 -->
      <v-alert 
        v-if="validationErrors.length > 0" 
        type="error" 
        variant="tonal" 
        class="mb-4"
      >
        <ul class="mb-0">
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </v-alert>
      
      <!-- 显示重复规则描述 -->
      <v-alert 
        v-if="isValid && recurrenceRule.type !== 'none'" 
        type="info" 
        variant="tonal" 
        class="mb-4"
      >
        当前设置：{{ getRecurrenceDescription }}
      </v-alert>
      <v-row>
        <v-col cols="12" md="6">
          <v-select 
            v-model="localData.timeConfig.recurrence.type" 
            label="重复类型"
            :items="recurrenceTypes" 
            variant="outlined" 
            @update:model-value="handleRecurrenceChange"
          />
        </v-col>
        
        <v-col cols="12" md="6" v-if="localData.timeConfig.recurrence.type !== 'none'">
          <v-text-field 
            v-model.number="localData.timeConfig.recurrence.interval" 
            label="间隔"
            type="number" 
            variant="outlined" 
            min="1" 
            max="365" 
          />
        </v-col>

        <!-- 每周重复的星期选择 -->
        <v-col cols="12" v-if="localData.timeConfig.recurrence.type === 'weekly'">
          <WeekdaySelector 
            v-model="selectedWeekdays"
            @update:model-value="updateWeekdays"
          />
        </v-col>

        <!-- 结束条件 -->
        <v-col cols="12" v-if="localData.timeConfig.recurrence.type !== 'none'">
          <v-radio-group 
            v-model="localData.timeConfig.recurrence.endCondition.type" 
            label="结束条件"
            @update:model-value="handleEndConditionChange"
          >
            <v-radio label="永不结束" value="never" />
            <v-radio label="指定日期结束" value="date" />
            <v-radio label="指定次数结束" value="count" />
          </v-radio-group>
        </v-col>
        
        <v-col cols="12" md="6" v-if="localData.timeConfig.recurrence.endCondition.type === 'date'">
          <v-text-field 
            v-model="endConditionDateInput" 
            label="结束日期" 
            type="date" 
            variant="outlined"
            @update:model-value="updateEndConditionDate" 
          />
        </v-col>
        
        <v-col cols="12" md="6" v-if="localData.timeConfig.recurrence.endCondition.type === 'count'">
          <v-text-field 
            v-model.number="localData.timeConfig.recurrence.endCondition.count"
            label="重复次数" 
            type="number" 
            variant="outlined" 
            min="1" 
            max="999" 
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TimeUtils } from '@/shared/utils/myDateTimeUtils';
import WeekdaySelector from '../widgets/WeekdaySelector.vue';
import { useRecurrenceValidation } from '@/modules/Task/presentation/composables/useRecurrenceValidation';
import { formatDate } from '@/shared/utils/dateUtils';
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


const recurrenceRule = computed(() => {
  return localData.value.timeConfig.recurrence;
});

const {
  isValid,
  validationErrors,
  validateRecurrence,
  getRecurrenceDescription
} = useRecurrenceValidation(recurrenceRule);

// 表单输入字段
const endConditionDateInput = ref('');
const selectedWeekdays = ref<number[]>([]);

// 表单选项
const recurrenceTypes = [
  { title: '不重复', value: 'none' },
  { title: '每日', value: 'daily' },
  { title: '每周', value: 'weekly' },
  { title: '每月', value: 'monthly' },
  { title: '每年', value: 'yearly' }
];

// 处理重复类型变化
const handleRecurrenceChange = (type: string | null) => {
  if (!type) {
    const updatedTemplate = localData.value.clone();
    updatedTemplate.updateTimeConfig({
      ...updatedTemplate.timeConfig,
      recurrence: {
        ...updatedTemplate.timeConfig.recurrence,
        endCondition: {
          type: 'never'
        }
      }
    });
    emit('update:modelValue', updatedTemplate);
  }
};

// 处理结束条件变化
const handleEndConditionChange = (type: string | null) => {
  console.log(endConditionDateInput, 'endConditionDateInput reset to empty');
  console.log("localData.value.timeConfig.recurrence.endCondition", localData.value.timeConfig.recurrence.endCondition);
  if (!type) {
    console.warn('endCondition type is null, setting default to "never"');
    const updatedTemplate = localData.value.clone();
    updatedTemplate.updateTimeConfig({
      ...updatedTemplate.timeConfig,
      recurrence: {
        ...updatedTemplate.timeConfig.recurrence,
        endCondition: {
          type: 'never'
        }
      }
    });    emit('update:modelValue', updatedTemplate);
  } else {
    const updatedTemplate = localData.value.clone();
    updatedTemplate.updateTimeConfig({
      ...updatedTemplate.timeConfig,
      recurrence: {
        ...updatedTemplate.timeConfig.recurrence,
        endCondition: {
          type: type as any,
          ...(type === 'count' && { count: 1 }),
          ...(type === 'date' && { endDate: TimeUtils.toDateTime(endConditionDateInput.value) }) 
        }
      }
    });
    emit('update:modelValue', updatedTemplate);
  }
};

// 更新星期几选择
const updateWeekdays = (weekdays: number[]) => {
  const updatedTemplate = localData.value.clone();
  if (!updatedTemplate.timeConfig.recurrence.config) {
    updatedTemplate.timeConfig.recurrence.config = {};
  }
  updatedTemplate.timeConfig.recurrence.config.weekdays = [...weekdays];
  updatedTemplate.updateTimeConfig(updatedTemplate.timeConfig);
  emit('update:modelValue', updatedTemplate);
};

// 更新结束日期
const updateEndConditionDate = (date: string) => {
  if (!date) return;
    const endDate = TimeUtils.toDateTime(date);
  const updatedTemplate = localData.value.clone();
  updatedTemplate.updateTimeConfig({
    ...updatedTemplate.timeConfig,
    recurrence: {
      ...updatedTemplate.timeConfig.recurrence,
      endCondition: {
        ...updatedTemplate.timeConfig.recurrence.endCondition,
        endDate: endDate
      }
    }
  });
  emit('update:modelValue', updatedTemplate);
};

// 初始化表单数据
const initializeFormData = () => {
  if (localData.value?.timeConfig?.recurrence?.endCondition?.endDate) {
    endConditionDateInput.value = TimeUtils.formatDateToInput(
      localData.value.timeConfig.recurrence.endCondition.endDate
    );
  } else {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    endConditionDateInput.value = formatDate(nextWeek);
  }
  
  if (localData.value?.timeConfig?.recurrence?.config?.weekdays) {
    selectedWeekdays.value = [...localData.value.timeConfig.recurrence.config.weekdays];
  }
};


watch(isValid, (newValue) => {
  emit('update:validation', newValue);
}, { immediate: true });

watch(localData, () => {
  validateRecurrence();
}, { deep: true });

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
