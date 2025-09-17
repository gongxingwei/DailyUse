import { ref, computed } from 'vue';

export function useTaskTemplateForm() {
  // 表单验证状态
  const formValidations = ref({
    basic: true,
    time: true,
    recurrence: true,
    reminder: true,
    metadata: true,
  });

  // 整体表单验证状态
  const isFormValid = computed(() => Object.values(formValidations.value).every((valid) => valid));

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

  const updateMetadataValidation = (isValid: boolean) => {
    formValidations.value.metadata = isValid;
  };

  // 统一验证方法
  const validateForm = async () => {
    // 这里可以添加跨字段验证逻辑
    return isFormValid.value;
  };

  return {
    formValidations,
    isFormValid,
    validateForm,
    updateBasicValidation,
    updateTimeValidation,
    updateRecurrenceValidation,
    updateReminderValidation,
    updateMetadataValidation,
  };
}
