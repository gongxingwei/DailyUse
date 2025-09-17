import { ref, computed } from 'vue';

/**
 * 任务提醒配置接口 - 使用最新的简化结构
 */
interface TaskReminderConfig {
  enabled: boolean;
  minutesBefore: number;
  methods: ('notification' | 'sound')[];
}

/**
 * 提醒配置验证组合式函数
 * 重构后专注于用户体验验证，核心业务验证移到聚合根中
 */
export function useReminderValidation() {
  const errors = ref<string[]>([]);
  const warnings = ref<string[]>([]);

  /**
   * UI层面的用户体验验证 - 主要是实时反馈和建议
   */
  const validateUserExperience = (reminderConfig: TaskReminderConfig): void => {
    warnings.value = [];

    if (!reminderConfig.enabled) return;

    // 检查提醒方式
    if (!reminderConfig.methods || reminderConfig.methods.length === 0) {
      warnings.value.push('启用提醒但未设置提醒方式，建议至少选择一种');
      return;
    }

    // 提前时间的用户体验建议
    if (reminderConfig.minutesBefore > 1440) {
      // 24小时
      warnings.value.push('提前时间超过24小时，可能导致提醒过早失去意义');
    } else if (reminderConfig.minutesBefore > 720) {
      // 12小时
      warnings.value.push('提前时间较长，建议确认是否真的需要这么早提醒');
    }

    if (reminderConfig.minutesBefore < 5) {
      warnings.value.push('提前时间过短，可能无法提供足够的准备时间');
    }

    // 根据提醒时间给出个性化建议
    if (reminderConfig.minutesBefore === 1440) {
      warnings.value.push('一天前提醒适合重要的长期准备任务');
    } else if (reminderConfig.minutesBefore >= 60 && reminderConfig.minutesBefore < 1440) {
      warnings.value.push('小时级提醒适合需要准备的任务');
    } else if (reminderConfig.minutesBefore < 60) {
      warnings.value.push('分钟级提醒适合即时行动的任务');
    }

    // 检查提醒方式的合理性
    validateReminderMethodsUserExperience(reminderConfig.methods);
  };

  /**
   * 提醒方式的用户体验验证
   */
  const validateReminderMethodsUserExperience = (methods: string[]): void => {
    if (methods.includes('sound') && methods.length === 1) {
      warnings.value.push('仅启用声音提醒，在静音模式下可能会错过');
    }

    if (methods.includes('notification') && methods.includes('sound')) {
      warnings.value.push('同时启用通知和声音，在安静环境中可能过于突出');
    }

    if (methods.length === 0) {
      warnings.value.push('未选择任何提醒方式，将无法收到提醒');
    }
  };

  /**
   * 调用聚合根的业务验证 - 这会抛出错误如果验证失败
   */
  const validateBusinessRules = (reminderConfig: TaskReminderConfig): boolean => {
    try {
      // 这里应该调用 TaskTemplate 聚合根的验证方法
      // 在实际使用时，这些验证会在提交数据到聚合根时进行

      // 基础的业务规则验证（模拟聚合根验证）
      if (reminderConfig.enabled) {
        if (!reminderConfig.methods || reminderConfig.methods.length === 0) {
          throw new Error('启用提醒时必须选择至少一种提醒方式');
        }

        if (reminderConfig.minutesBefore === undefined || reminderConfig.minutesBefore < 0) {
          throw new Error('提醒时间必须大于等于0分钟');
        }

        if (reminderConfig.minutesBefore > 43200) {
          // 30天
          throw new Error('提醒时间不能超过30天');
        }

        // 验证提醒方式
        for (const method of reminderConfig.methods) {
          if (!['notification', 'sound'].includes(method)) {
            throw new Error(`不支持的提醒方式: ${method}`);
          }
        }
      }

      errors.value = [];
      return true;
    } catch (error: any) {
      errors.value = [error.message];
      return false;
    }
  };

  /**
   * 综合验证方法
   */
  const validateReminderConfig = (reminderConfig: TaskReminderConfig): boolean => {
    validateUserExperience(reminderConfig);
    return validateBusinessRules(reminderConfig);
  };

  /**
   * 快速检查提醒配置的基本问题
   */
  const quickCheck = (reminderConfig: TaskReminderConfig): boolean => {
    if (!reminderConfig.enabled) return true;

    if (!reminderConfig.methods?.length) {
      warnings.value.push('启用提醒但未设置提醒方式');
      return false;
    }

    if (reminderConfig.minutesBefore < 0) {
      warnings.value.push('提醒时间不能为负数');
      return false;
    }

    return true;
  };

  /**
   * 获取建议的提醒时间选项
   */
  const getSuggestedReminderTimes = (): Array<{
    value: number;
    label: string;
    description: string;
  }> => {
    return [
      { value: 0, label: '准时提醒', description: '任务开始时提醒' },
      { value: 5, label: '5分钟前', description: '适合短期准备' },
      { value: 15, label: '15分钟前', description: '适合简单准备' },
      { value: 30, label: '30分钟前', description: '适合中等准备' },
      { value: 60, label: '1小时前', description: '适合充分准备' },
      { value: 120, label: '2小时前', description: '适合复杂任务' },
      { value: 1440, label: '1天前', description: '适合重要任务' },
    ];
  };

  /**
   * 获取推荐的提醒方式组合
   */
  const getRecommendedMethodCombinations = (): Array<{
    methods: string[];
    description: string;
  }> => {
    return [
      { methods: ['notification'], description: '适合办公环境的轻提醒' },
      { methods: ['sound'], description: '适合需要强提醒的场景' },
      { methods: ['notification', 'sound'], description: '适合重要任务的双重提醒' },
    ];
  };

  /**
   * 重置验证状态
   */
  const resetValidation = () => {
    errors.value = [];
    warnings.value = [];
  };

  const isValid = computed(() => errors.value.length === 0);
  const hasWarnings = computed(() => warnings.value.length > 0);

  return {
    // 状态
    errors,
    warnings,
    isValid,
    hasWarnings,

    // 方法
    validateReminderConfig,
    validateUserExperience,
    validateBusinessRules,
    quickCheck,
    getSuggestedReminderTimes,
    getRecommendedMethodCombinations,
    resetValidation,
  };
}
