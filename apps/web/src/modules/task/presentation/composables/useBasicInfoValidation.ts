import { ref, computed, readonly } from 'vue';

/**
 * 基础信息验证组合式函数
 * 重构后专注于用户体验验证，核心业务验证移到聚合根中
 */
export function useBasicInfoValidation() {
  const validationErrors = ref<string[]>([]);
  const warnings = ref<string[]>([]);
  const isValid = computed(() => validationErrors.value.length === 0);
  const hasWarnings = computed(() => warnings.value.length > 0);

  /**
   * UI层面的用户体验验证 - 主要是实时反馈和建议
   */
  const validateUserExperience = (title: string, description?: string): void => {
    warnings.value = [];

    // 用户体验建议
    if (title && title.length < 3) {
      warnings.value.push('标题较短，建议添加更多描述性信息');
    }

    if (title && title.length > 50) {
      warnings.value.push('标题较长，考虑将部分内容移到描述中');
    }

    if (description && description.length > 300) {
      warnings.value.push('描述较长，考虑精简表达');
    }

    if (!description || description.trim() === '') {
      warnings.value.push('建议添加任务描述，有助于后续回顾');
    }
  };

  /**
   * 调用聚合根的业务验证 - 这会抛出错误如果验证失败
   */
  const validateBusinessRules = (title: string, description?: string): boolean => {
    try {
      // 这里应该调用 TaskTemplate 聚合根的验证方法
      // 在实际使用时，这些验证会在提交数据到聚合根时进行
      // 这里做基础的业务规则验证，确保数据符合聚合根的要求

      // 基础的业务规则验证（模拟聚合根验证）
      if (!title || title.trim() === '') {
        throw new Error('任务标题不能为空');
      }

      if (title.length > 200) {
        throw new Error('任务标题不能超过200个字符');
      }

      if (title.trim() !== title) {
        throw new Error('任务标题不能以空格开头或结尾');
      }

      if (description && description.length > 500) {
        throw new Error('任务描述不能超过500个字符');
      }

      validationErrors.value = [];
      return true;
    } catch (error: any) {
      validationErrors.value = [error.message];
      return false;
    }
  };

  /**
   * 综合验证方法
   */
  const validate = (title: string, description?: string): boolean => {
    validateUserExperience(title, description);
    return validateBusinessRules(title, description);
  };

  /**
   * 单独验证标题（向后兼容）
   */
  const validateTitle = (title: string): string[] => {
    try {
      validateBusinessRules(title);
      return [];
    } catch (error: any) {
      return [error.message];
    }
  };

  /**
   * 单独验证描述（向后兼容）
   */
  const validateDescription = (description: string): string[] => {
    try {
      validateBusinessRules('测试标题', description); // 提供一个测试标题来验证描述
      return [];
    } catch (error: any) {
      if (error.message.includes('描述')) {
        return [error.message];
      }
      return [];
    }
  };

  /**
   * 重置验证状态
   */
  const resetValidation = () => {
    validationErrors.value = [];
    warnings.value = [];
  };

  return {
    // 状态
    validationErrors: readonly(validationErrors),
    warnings: readonly(warnings),
    isValid,
    hasWarnings,

    // 方法
    validate,
    validateUserExperience,
    validateBusinessRules,
    resetValidation,

    // 向后兼容的方法
    validateTitle,
    validateDescription,
  };
}
