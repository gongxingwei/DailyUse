<template>
  <v-form ref="formRef" class="task-template-form">
    <!-- 统一使用 @update:model-value 事件 -->
    <BasicInfoSection 
      :model-value="taskTemplateBeingEdited" 
      @update:validation="updateBasicValidation" 
      @update:model-value:title="handleUpdateTitle"
      @update:model-value:description="handleUpdateDescription"
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
    
    <MetadataSection 
      :model-value="taskTemplateBeingEdited" 
      @update:validation="updateMetadataValidation" 
      @update:model-value="handleTemplateUpdate"
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
import { useTaskStore } from '../../stores/taskStore';

interface Props {
  isEditMode?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: TaskTemplate];
}>();

const taskStore = useTaskStore();

const taskTemplateBeingEdited = taskStore.getTaskTemplateBeingEdited!; // 使用了非空断言符

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
} = useTaskTemplateForm(props, emit);

// 暴露验证方法和状态
defineExpose({
  validate: validateForm,
  isValid: isFormValid,
  formRef
});


const handleUpdateTitle = (newTitle: string) => {
  taskTemplateBeingEdited.updateTitle(newTitle);
};

const handleUpdateDescription = (newDescription: string) => {
  taskTemplateBeingEdited.updateDescription(newDescription);
};

const handleTemplateUpdate = (newTEmplate: TaskTemplate) => {
  taskStore.updateTaskTemplateBeingEdited(newTEmplate);
};
</script>