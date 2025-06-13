<!-- widgets/SchedulingPolicySection.vue -->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-calendar-clock</v-icon>
      调度策略
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-switch 
            v-model="localData.schedulingPolicy.allowReschedule" 
            label="允许重新调度"
            color="primary" 
          />
        </v-col>
        
        <v-col cols="12" md="6">
          <v-switch 
            v-model="localData.schedulingPolicy.skipWeekends" 
            label="跳过周末" 
            color="primary" 
          />
        </v-col>
        
        <v-col cols="12" md="6">
          <v-switch 
            v-model="localData.schedulingPolicy.skipHolidays" 
            label="跳过节假日" 
            color="primary" 
          />
        </v-col>
        
        <v-col cols="12" md="6">
          <v-switch 
            v-model="localData.schedulingPolicy.workingHoursOnly" 
            label="仅工作时间"
            color="primary" 
          />
        </v-col>
        
        <v-col cols="12" md="6" v-if="localData.schedulingPolicy.allowReschedule">
          <v-text-field 
            v-model.number="localData.schedulingPolicy.maxDelayDays" 
            label="最大延迟天数"
            type="number" 
            variant="outlined" 
            min="1" 
            max="30" 
          />
        </v-col>
      </v-row>
      
      <!-- 策略说明 -->
      <v-row>
        <v-col cols="12">
          <v-alert type="info" density="compact" variant="tonal">
            <v-icon start>mdi-information-outline</v-icon>
            调度策略会影响任务实例的生成时间。启用"跳过周末"后，周末的任务会自动调整到工作日
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskTemplate } from '../../../types/task';

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
