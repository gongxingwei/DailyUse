<!-- TaskTemplateForm.vue - 主表单容器 -->
<template>
  <v-form ref="formRef" :model-value="isFormValid" class="task-template-form">
    <!-- 基础信息 -->
    <BasicInfoSection 
      v-model="localTemplate" 
      @update:validation="updateBasicValidation" 
    />
    
    <!-- 时间配置 -->
    <TimeConfigSection 
      v-model="localTemplate" 
      @update:validation="updateTimeValidation" 
    />
    
    <!-- 重复规则 -->
    <RecurrenceSection 
      v-model="localTemplate" 
      @update:validation="updateRecurrenceValidation" 
    />
    
    <!-- 提醒设置 -->
    <ReminderSection 
      v-model="localTemplate" 
      @update:validation="updateReminderValidation" 
    />
    
    <!-- 调度策略 -->
    <SchedulingPolicySection 
      v-model="localTemplate" 
      @update:validation="updateSchedulingValidation" 
    />
    
    <!-- 其他设置 -->
    <MetadataSection 
      v-model="localTemplate" 
      @update:validation="updateMetadataValidation" 
    />
  </v-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BasicInfoSection from './sections/BasicInfoSection.vue';
import TimeConfigSection from './sections/TimeConfigSection.vue';
import RecurrenceSection from './sections/RecurrenceSection.vue';
import ReminderSection from './sections/ReminderSection.vue';
import SchedulingPolicySection from './sections/SchedulingPolicySection.vue';
import MetadataSection from './sections/MetadataSection.vue';
import { useTaskTemplateForm } from '../../composables/useTaskTemplateForm';
import type { TaskTemplate } from '../../types/task';

interface Props {
  modelValue: TaskTemplate;
  isEditMode?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: TaskTemplate];
}>();

// 表单引用
const formRef = ref();

const {
  localTemplate,
  isFormValid,
  validateForm,
  updateBasicValidation,
  updateTimeValidation,
  updateRecurrenceValidation,
  updateReminderValidation,
  updateSchedulingValidation,
  updateMetadataValidation
} = useTaskTemplateForm(props, emit);

// 暴露验证方法和状态
defineExpose({
  validate: validateForm,
  isValid: isFormValid,
  formRef
});
</script>