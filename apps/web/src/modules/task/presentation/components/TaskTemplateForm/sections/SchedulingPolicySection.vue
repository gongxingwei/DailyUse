<!-- widgets/SchedulingPolicySection.vue -->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-calendar-clock</v-icon>
      调度策略
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <v-alert type="info" density="compact" variant="tonal">
            <v-icon start>mdi-information-outline</v-icon>
            当前使用的是新版任务模板结构，调度策略已集成到时间配置中。调度模式可在"时间配置"部分设置。
          </v-alert>
        </v-col>

        <v-col cols="12" md="6">
          <v-select v-model="scheduleMode" :items="scheduleModeOptions" label="调度模式" variant="outlined"
            item-title="text" item-value="value" />
        </v-col>

        <v-col cols="12" md="6" v-if="scheduleMode === 'intervalDays'">
          <v-text-field v-model.number="intervalDays" label="间隔天数" type="number" variant="outlined" min="1" max="365" />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field v-model="location" label="任务地点" variant="outlined" prepend-inner-icon="mdi-map-marker" />
        </v-col>

        <v-col cols="12">
          <v-combobox v-model="tags" :items="[]" label="标签" variant="outlined" multiple chips clearable
            prepend-inner-icon="mdi-tag-multiple" hint="按回车键添加新标签" />
        </v-col>
      </v-row>

      <!-- 策略说明 -->
      <v-row>
        <v-col cols="12">
          <v-alert type="info" density="compact" variant="tonal">
            <v-icon start>mdi-information-outline</v-icon>
            调度模式决定任务实例的生成频率。标签和地点信息将应用于所有生成的任务实例。
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskTemplate } from '@dailyuse/domain-client';

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const scheduleModeOptions = [
  { text: '单次执行', value: 'once' },
  { text: '每日重复', value: 'daily' },
  { text: '每周重复', value: 'weekly' },
  { text: '每月重复', value: 'monthly' },
  { text: '自定义间隔', value: 'intervalDays' }
];

const updateTemplate = (updater: (template: TaskTemplate) => void) => {
  const updatedTemplate = props.modelValue.clone();
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

const scheduleMode = computed({
  get: () => props.modelValue.timeConfig.schedule.mode,
  set: (value: string) => {
    updateTemplate((template) => {
      (template as any)._timeConfig = {
        ...template.timeConfig,
        schedule: {
          ...template.timeConfig.schedule,
          mode: value
        }
      };
    });
  }
});

const intervalDays = computed({
  get: () => props.modelValue.timeConfig.schedule.intervalDays || 1,
  set: (value: number) => {
    updateTemplate((template) => {
      (template as any)._timeConfig = {
        ...template.timeConfig,
        schedule: {
          ...template.timeConfig.schedule,
          intervalDays: value
        }
      };
    });
  }
});

const location = computed({
  get: () => props.modelValue.properties.location || '',
  set: (value: string) => {
    updateTemplate((template) => {
      (template as any)._properties = {
        ...template.properties,
        location: value
      };
    });
  }
});

const tags = computed({
  get: () => props.modelValue.properties.tags || [],
  set: (value: string[]) => {
    updateTemplate((template) => {
      (template as any)._properties = {
        ...template.properties,
        tags: value
      };
    });
  }
});
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
