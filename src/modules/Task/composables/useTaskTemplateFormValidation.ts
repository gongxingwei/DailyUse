// // composables/useTaskTemplateFormValidation.ts
// import { ref, computed, watch, readonly } from 'vue';
// import { taskTemplateFormApplicationService } from '../application/TaskTemplateFormApplicationService';
// import type { TaskTemplate } from '../types/task';
// import type { Ref } from 'vue';

// export function useTaskTemplateFormValidation(template: Ref<TaskTemplate>) {
//   // 验证状态
//   const validationState = ref({
//     isValid: false,
//     errors: {} as Record<string, string[]>,
//     warnings: {} as Record<string, string[]>,
//     isValidating: false
//   });

//   // 各section的验证状态
//   const sectionValidation = ref({
//     basic: true,
//     timeConfig: true,
//     recurrence: true,
//     reminder: true,
//     scheduling: true,
//     other: true
//   });

//   // 计算属性：是否全部有效
//   const isAllSectionsValid = computed(() => {
//     return Object.values(sectionValidation.value).every(valid => valid);
//   });

//   // 计算属性：错误总数
//   const totalErrors = computed(() => {
//     return Object.values(validationState.value.errors)
//       .flat()
//       .filter(error => error.length > 0).length;
//   });

//   // 计算属性：警告总数
//   const totalWarnings = computed(() => {
//     return Object.values(validationState.value.warnings)
//       .flat()
//       .filter(warning => warning.length > 0).length;
//   });

//   // 执行完整验证
//   const validateForm = async (): Promise<boolean> => {
//     validationState.value.isValidating = true;
    
//     try {
//       const result = taskTemplateFormApplicationService.validateForm(template.value);
      
//       validationState.value.isValid = result.isValid;
//       validationState.value.errors = result.errors;
//       validationState.value.warnings = result.warnings;
      
//       return result.isValid && isAllSectionsValid.value;
//     } catch (error) {
//       console.error('表单验证失败:', error);
//       validationState.value.isValid = false;
//       return false;
//     } finally {
//       validationState.value.isValidating = false;
//     }
//   };

//   // 更新单个section的验证状态
//   const updateSectionValidation = (section: keyof typeof sectionValidation.value, isValid: boolean) => {
//     sectionValidation.value[section] = isValid;
//   };

//   // 获取section的错误
//   const getSectionErrors = (section: string): string[] => {
//     return validationState.value.errors[section] || [];
//   };

//   // 获取section的警告
//   const getSectionWarnings = (section: string): string[] => {
//     return validationState.value.warnings[section] || [];
//   };

//   // 清除所有验证状态
//   const clearValidation = () => {
//     validationState.value = {
//       isValid: false,
//       errors: {},
//       warnings: {},
//       isValidating: false
//     };
    
//     Object.keys(sectionValidation.value).forEach(key => {
//       sectionValidation.value[key as keyof typeof sectionValidation.value] = true;
//     });
//   };

//   // 获取表单建议
//   const getFormSuggestions = (): string[] => {
//     return taskTemplateFormApplicationService.getFormStatusSuggestions(template.value);
//   };

//   // 实时验证（防抖）
//   let validationTimer: NodeJS.Timeout | null = null;
//   const debounceValidation = () => {
//     if (validationTimer) {
//       clearTimeout(validationTimer);
//     }
    
//     validationTimer = setTimeout(() => {
//       validateForm();
//     }, 500);
//   };

//   // 监听模板变化，执行实时验证
//   watch(
//     template,
//     () => {
//       debounceValidation();
//     },
//     { deep: true }
//   );

//   // 立即执行一次验证
//   validateForm();

//   return {
//     // 状态
//     validationState: readonly(validationState),
//     sectionValidation: readonly(sectionValidation),
    
//     // 计算属性
//     isAllSectionsValid,
//     totalErrors,
//     totalWarnings,
    
//     // 方法
//     validateForm,
//     updateSectionValidation,
//     getSectionErrors,
//     getSectionWarnings,
//     clearValidation,
//     getFormSuggestions,
    
//     // 工具方法
//     hasErrors: computed(() => totalErrors.value > 0),
//     hasWarnings: computed(() => totalWarnings.value > 0),
//     isFormReady: computed(() => validationState.value.isValid && isAllSectionsValid.value)
//   };
// }
