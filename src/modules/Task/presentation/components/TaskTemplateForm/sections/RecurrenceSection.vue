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
            v-model="recurrenceType" 
            label="重复类型"
            :items="recurrenceTypes" 
            variant="outlined" 
          />
        </v-col>
        
        <v-col cols="12" md="6" v-if="props.modelValue.timeConfig.recurrence.type !== 'none'">
          <v-text-field 
            v-model.number="recurrenceInterval" 
            label="间隔"
            type="number" 
            variant="outlined" 
            min="1" 
            max="365" 
          />
        </v-col>

        <!-- 每周重复的星期选择 -->
        <v-col cols="12" v-if="props.modelValue.timeConfig.recurrence.type === 'weekly'">
          <WeekdaySelector 
            v-model="selectedWeekdays"
            @update:model-value="updateWeekdays"
          />
        </v-col>

        <!-- 结束条件 -->
        <v-col cols="12" v-if="props.modelValue.timeConfig.recurrence.type !== 'none' && props.modelValue.timeConfig.recurrence.endCondition">
          <v-radio-group 
            v-model="recurrenceEndConditionType" 
            label="结束条件"
          >
            <v-radio label="永不结束" value="never" />
            <v-radio label="指定日期结束" value="date" />
            <v-radio label="指定次数结束" value="count" />
          </v-radio-group>
        </v-col>
        
        <v-col cols="12" md="6" v-if="props.modelValue.timeConfig.recurrence.endCondition && props.modelValue.timeConfig.recurrence.endCondition.type === 'date'">
          <v-text-field 
            v-model="endConditionDateInput" 
            label="结束日期" 
            type="date" 
            variant="outlined"
          />
        </v-col>
        
        <v-col cols="12" md="6" v-if="props.modelValue.timeConfig.recurrence.endCondition && props.modelValue.timeConfig.recurrence.endCondition.type === 'count'">
          <v-text-field 
            v-model.number="recurrenceEndConditionCount"
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
import { TaskTemplate } from '@/modules/Task/domain/entities/taskTemplate';
import { computed, ref, watch } from 'vue';
import { TimeUtils } from '@/shared/utils/myDateTimeUtils';
import WeekdaySelector from '../widgets/WeekdaySelector.vue';
import { useRecurrenceValidation } from '@/modules/Task/presentation/composables/useRecurrenceValidation';
interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const updateTemplate = (updater: (template: TaskTemplate) => void) => {
  const updatedTemplate = props.modelValue.clone();
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

const recurrenceType = computed({
  get: () => props.modelValue.timeConfig.recurrence.type,
  set: (value) => {
    updateTemplate((template) => {
      template.updateTimeConfig({
        ...template.timeConfig,
        recurrence: {
          ...template.timeConfig.recurrence,
          type: value as any,
          interval: 1,
          endCondition: {
            type: 'never'
          }
        }
      });
    });
  }
});


const recurrenceInterval = computed({
  get: () => props.modelValue.timeConfig.recurrence.interval,
  set: (value: number) => {
    updateTemplate((template) => {
      template.updateTimeConfig({
        ...template.timeConfig,
        recurrence: {
          ...template.timeConfig.recurrence,
          interval: value
        }
      });
    });
  }
});

const recurrenceEndConditionType = computed({
  get: () => props.modelValue.timeConfig.recurrence.endCondition?.type,
  set: (value: string | null) => {
    handleEndConditionChange(value);
  }
});

const recurrenceEndConditionCount = computed({
  get: () => props.modelValue.timeConfig.recurrence.endCondition?.count || 1,
  set: (value: number) => {
    updateTemplate((template) => {
      template.updateTimeConfig({
        ...template.timeConfig,
        recurrence: {
          ...template.timeConfig.recurrence,
          endCondition: {
            type: template.timeConfig.recurrence.endCondition?.type || 'count',
            endDate: template.timeConfig.recurrence.endCondition?.endDate,
            count: value
          }
        }
      });
    });
  }
});

const endConditionDateInput = computed({
  get: () => {
    const endDate = props.modelValue.timeConfig.recurrence.endCondition?.endDate;
    return endDate ? TimeUtils.formatDateToInput(endDate) : '';
  },
  set: (value: string) => {
    updateEndConditionDate(value);
  }
});

const recurrenceRule = computed(() => {
  return props.modelValue.timeConfig.recurrence;
});

const {
  isValid,
  validationErrors,
  validateRecurrence,
  getRecurrenceDescription
} = useRecurrenceValidation(recurrenceRule);

const selectedWeekdays = ref<number[]>([]);

// 表单选项
const recurrenceTypes = [
  { title: '不重复', value: 'none' },
  { title: '每日', value: 'daily' },
  { title: '每周', value: 'weekly' },
  { title: '每月', value: 'monthly' },
  { title: '每年', value: 'yearly' }
];


// 处理结束条件变化
const handleEndConditionChange = (type: string | null) => {
  updateTemplate((template) => {
    if (!type) {
      template.updateTimeConfig({
        ...template.timeConfig,
        recurrence: {
          ...template.timeConfig.recurrence,
          endCondition: {
            type: 'never'
          }
        }
      });
    } else {
      template.updateTimeConfig({
        ...template.timeConfig,
        recurrence: {
          ...template.timeConfig.recurrence,
          endCondition: {
            type: type as "never" | "date" | "count",
            ...(type === 'count' && { count: 1 }),
            ...(type === 'date' && { endDate: TimeUtils.now() })
          }
        }
      });
    }
  });
};

// 更新星期几选择
const updateWeekdays = (weekdays: number[]) => {
  const updatedTemplate = props.modelValue.clone();
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
  const updatedTemplate = props.modelValue.clone();
  updatedTemplate.updateTimeConfig({
    ...updatedTemplate.timeConfig,
    recurrence: {
      ...updatedTemplate.timeConfig.recurrence,
      endCondition: {
        type: updatedTemplate.timeConfig.recurrence.endCondition?.type || 'date',
        count: updatedTemplate.timeConfig.recurrence.endCondition?.count || undefined,
        endDate: endDate
      }
    }
  });
  emit('update:modelValue', updatedTemplate);
};

watch(isValid, (newValue) => {
  emit('update:validation', newValue);
}, { immediate: true });

watch(props.modelValue, () => {
  validateRecurrence();
}, { deep: true });

</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
