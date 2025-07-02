<template>
  <div class="task-template-form-container">
    <!-- 错误状态显示 -->
    <v-alert 
      v-if="!taskTemplateBeingEdited" 
      type="error" 
      variant="tonal" 
      class="mb-4"
    >
      <v-alert-title>无法加载模板</v-alert-title>
      <div>没有找到正在编辑的任务模板，请重新选择或创建模板。</div>
      <template #append>
        <v-btn variant="text" @click="$emit('close')">
          关闭
        </v-btn>
      </template>
    </v-alert>

    <!-- 正常表单内容 -->
    <v-form v-else ref="formRef" class="task-template-form">
      <!-- 统一使用 @update:model-value 事件 -->
      <BasicInfoSection 
        :model-value="taskTemplateBeingEdited" 
        @update:validation="updateBasicValidation" 
        @update:model-value="handleTemplateUpdate"
      />
      
      <TimeConfigSection 
        :model-value="taskTemplateBeingEdited" 
        @update:validation="updateTimeValidation"
        @update:model-value="handleTemplateUpdate"
      />
      
      <RecurrenceSection 
        :model-value="taskTemplateBeingEdited" 
        @update:validation="updateRecurrenceValidation" 
        @update:model-value="handleTemplateUpdate"
      />
      
      <ReminderSection 
        :model-value="taskTemplateBeingEdited" 
        @update:validation="updateReminderValidation" 
        @update:model-value="handleTemplateUpdate"
      />
      
      <SchedulingPolicySection 
        :model-value="taskTemplateBeingEdited" 
        @update:validation="updateSchedulingValidation" 
        @update:model-value="handleTemplateUpdate"
      />
      
      <KeyResultLinksSection 
        :model-value="taskTemplateBeingEdited" 
        @update:model-value="handleTemplateUpdate"
      />

      <MetadataSection 
        :model-value="taskTemplateBeingEdited" 
        @update:validation="updateMetadataValidation" 
        @update:model-value="handleTemplateUpdate"
      />
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BasicInfoSection from './sections/BasicInfoSection.vue';
import TimeConfigSection from './sections/TimeConfigSection.vue';
import RecurrenceSection from './sections/RecurrenceSection.vue';
import ReminderSection from './sections/ReminderSection.vue';
import SchedulingPolicySection from './sections/SchedulingPolicySection.vue';
import MetadataSection from './sections/MetadataSection.vue';
import KeyResultLinksSection from './sections/KeyResultLinksSection.vue';
import { useTaskTemplateForm } from '../../composables/useTaskTemplateForm';
import { useTaskStore } from '../../stores/taskStore';

const taskStore = useTaskStore();

// 修改计算属性，返回 null 而不是抛出错误
const taskTemplateBeingEdited = computed(() => {
  return taskStore.getTaskTemplateBeingEdited || null;
});

const handleTemplateUpdate = (newTemplate: TaskTemplate) => {
  if (!taskTemplateBeingEdited.value) return;
  
  console.log('Updating task template:', newTemplate);
  taskStore.updateTaskTemplateBeingEdited(newTemplate);
};

// 表单引用
const formRef = ref();

const {
  isFormValid,
  validateForm,
  updateBasicValidation,
  updateTimeValidation,
  updateRecurrenceValidation,
  updateReminderValidation,
  updateSchedulingValidation,
  updateMetadataValidation
} = useTaskTemplateForm();

// 暴露验证方法和状态
defineExpose({
  validate: validateForm,
  isValid: isFormValid,
  formRef
});
</script>