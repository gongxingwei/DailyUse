// composables/useTaskTemplateForm.ts
import { ref, computed } from 'vue';
import type { TaskTemplate } from '../types/task';

export function useTaskTemplateForm(props: any, emit: any) {
  // 表单验证状态
  const formValidations = ref({
    basic: true,
    time: true,
    recurrence: true,
    reminder: true,
    scheduling: true,
    metadata: true
  });

  // 本地模板副本 - 使用更好的响应式处理
  const localTemplate = computed({
    get: () => props.modelValue,
    set: (value: TaskTemplate) => {
      emit('update:modelValue', value);
    }
  });

  // 更新模板的辅助函数
  const updateTemplate = (updates: Partial<TaskTemplate>) => {
    const newTemplate = { ...props.modelValue, ...updates };
    emit('update:modelValue', newTemplate);
  };

  // 深度更新嵌套属性的辅助函数
  const updateNestedProperty = (path: string, value: any) => {
    const newTemplate = { ...props.modelValue };
    const keys = path.split('.');
    let current: any = newTemplate;
    
    // 创建嵌套结构的副本
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      current[key] = { ...current[key] };
      current = current[key];
    }
    
    // 设置最终值
    current[keys[keys.length - 1]] = value;
    emit('update:modelValue', newTemplate);
  };

  // 整体表单验证状态
  const isFormValid = computed(() => 
    Object.values(formValidations.value).every(valid => valid)
  );

  // 验证更新函数
  const updateBasicValidation = (isValid: boolean) => {
    formValidations.value.basic = isValid;
  };

  const updateTimeValidation = (isValid: boolean) => {
    formValidations.value.time = isValid;
  };

  const updateRecurrenceValidation = (isValid: boolean) => {
    formValidations.value.recurrence = isValid;
  };

  const updateReminderValidation = (isValid: boolean) => {
    formValidations.value.reminder = isValid;
  };

  const updateSchedulingValidation = (isValid: boolean) => {
    formValidations.value.scheduling = isValid;
  };

  const updateMetadataValidation = (isValid: boolean) => {
    formValidations.value.metadata = isValid;
  };

  // 统一验证方法
  const validateForm = async () => {
    // 这里可以添加跨字段验证逻辑
    return isFormValid.value;
  };
  return {
    localTemplate,
    formValidations,
    isFormValid,
    validateForm,
    updateTemplate,
    updateNestedProperty,
    updateBasicValidation,
    updateTimeValidation,
    updateRecurrenceValidation,
    updateReminderValidation,
    updateSchedulingValidation,
    updateMetadataValidation
  };
}