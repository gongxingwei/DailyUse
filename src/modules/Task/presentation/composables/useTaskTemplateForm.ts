// composables/useTaskTemplateForm.ts
import { ref, computed, watch } from "vue";

export function useTaskTemplateForm(props: any, emit: any) {
  // 表单验证状态
  const formValidations = ref({
    basic: true,
    time: true,
    recurrence: true,
    reminder: true,
    scheduling: true,
    metadata: true,
  });

  // 本地模板副本 - 使用更好的响应式处理
  const localTemplate = ref<TaskTemplate>(props.modelValue);

  // 整体表单验证状态
  const isFormValid = computed(() =>
    Object.values(formValidations.value).every((valid) => valid)
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
    updateBasicValidation,
    updateTimeValidation,
    updateRecurrenceValidation,
    updateReminderValidation,
    updateSchedulingValidation,
    updateMetadataValidation,
  };
}
