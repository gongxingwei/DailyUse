import { ref, computed, watch, readonly, type Ref } from 'vue';
import type { RecurrenceRule } from '@/modules/Task/types/timeStructure';
import { TimeUtils } from '@/shared/utils/myDateTimeUtils';

/**
 * 重复规则验证组合式函数
 * 提供重复规则的UI层面验证功能
 */
export function useRecurrenceValidation(recurrenceRule: Ref<RecurrenceRule>) {
  // 验证状态
  const validationErrors = ref<string[]>([]);
  const isValid = computed(() => validationErrors.value.length === 0);
  // 验证重复间隔
  const validateInterval = (): string[] => {
    const errors: string[] = [];
    const { type, interval } = recurrenceRule.value;

    if (type === 'none') return errors;

    if (!interval || interval < 1) {
      errors.push('重复间隔必须大于0');
    }

    // 根据类型设置合理的最大值
    const maxIntervals = {
      daily: 365,    // 最多每365天
      weekly: 52,    // 最多每52周  
      monthly: 12,   // 最多每12个月
      yearly: 10,     // 最多每10年
      custom: 365     // 自定义模式的默认限制
    };

    const maxInterval = maxIntervals[type as keyof typeof maxIntervals];
    if (maxInterval && interval && interval > maxInterval) {
      errors.push(`${type}重复间隔不能超过${maxInterval}`);
    }

    return errors;
  };
  // 验证结束条件
  const validateEndCondition = (): string[] => {
    const errors: string[] = [];
    const { type, endCondition } = recurrenceRule.value;

    if (type === 'none') return errors;

    if (!endCondition?.type) {
      errors.push('必须设置重复结束条件');
      return errors;
    }

    switch (endCondition.type) {
      case 'date':
        if (!endCondition.endDate) {
          errors.push('必须设置结束日期');
        } else {
          const now = TimeUtils.now();
          if (endCondition.endDate.timestamp <= now.timestamp) {
            errors.push('结束日期必须在当前时间之后');
          }
        }
        break;
        
      case 'count':
        if (!endCondition.count || endCondition.count < 1) {
          errors.push('重复次数必须大于0');
        } else if (endCondition.count > 1000) {
          errors.push('重复次数不能超过1000次');
        }
        break;
        
      case 'never':
        // 永不结束是有效的，不需要验证
        break;
        
      default:
        errors.push('无效的结束条件类型');
    }

    return errors;
  };

  // 验证周重复的星期配置
  const validateWeeklyConfig = (): string[] => {
    const errors: string[] = [];
    const { type, config } = recurrenceRule.value;

    if (type !== 'weekly') return errors;

    if (!config?.weekdays || config.weekdays.length === 0) {
      errors.push('周重复必须选择至少一个星期');
    } else {
      // 验证星期数值的有效性
      const invalidWeekdays = config.weekdays.filter(day => day < 0 || day > 6);
      if (invalidWeekdays.length > 0) {
        errors.push('无效的星期设置');
      }
    }

    return errors;
  };
  // 验证月重复的配置
  const validateMonthlyConfig = (): string[] => {
    const errors: string[] = [];
    const { type, config } = recurrenceRule.value;

    if (type !== 'monthly') return errors;

    // 根据实际的RecurrenceRule类型结构验证
    if (config?.monthDays && config.monthDays.length > 0) {
      // 验证每月的第几天配置
      const invalidDays = config.monthDays.filter(day => day < 1 || day > 31);
      if (invalidDays.length > 0) {
        errors.push('每月日期必须在1-31之间');
      }
    } else if (config?.monthWeekdays && config.monthWeekdays.length > 0) {
      // 验证每月第几个星期几的配置
      const invalidConfigs = config.monthWeekdays.filter(
        cfg => cfg.week < 1 || cfg.week > 5 || cfg.weekday < 0 || cfg.weekday > 6
      );
      if (invalidConfigs.length > 0) {
        errors.push('每月第几周配置无效：周次必须在1-5之间，星期必须在0-6之间');
      }
    } else {
      // 没有设置任何月重复配置
      errors.push('月重复必须设置具体的重复规则');
    }

    return errors;
  };

  // 综合验证方法
  const validateRecurrence = (): boolean => {
    const errors: string[] = [
      ...validateInterval(),
      ...validateEndCondition(),
      ...validateWeeklyConfig(),
      ...validateMonthlyConfig()
    ];

    validationErrors.value = errors;
    return errors.length === 0;
  };

  // 重置验证状态
  const resetValidation = () => {
    validationErrors.value = [];
  };
  // 获取重复规则的描述文本（用于UI显示）
  const getRecurrenceDescription = computed(() => {
    const { type, interval, config, endCondition } = recurrenceRule.value;

    if (type === 'none') return '不重复';

    let description = '';
    
    // 基础间隔描述
    switch (type) {
      case 'daily':
        description = interval === 1 ? '每天' : `每${interval}天`;
        break;
      case 'weekly':
        if (config?.weekdays?.length) {
          const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
          const selectedDays = config.weekdays.map(d => weekdayNames[d]).join('、');
          description = interval === 1 ? `每周${selectedDays}` : `每${interval}周${selectedDays}`;
        } else {
          description = interval === 1 ? '每周' : `每${interval}周`;
        }
        break;
      case 'monthly':
        description = interval === 1 ? '每月' : `每${interval}月`;
        if (config?.monthDays?.length) {
          description += config.monthDays.map(day => `${day}日`).join('、');
        } else if (config?.monthWeekdays?.length) {
          const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
          const descriptions = config.monthWeekdays.map(cfg => 
            `第${cfg.week}个星期${weekdayNames[cfg.weekday]}`
          );
          description += descriptions.join('、');
        }
        break;
      case 'yearly':
        description = interval === 1 ? '每年' : `每${interval}年`;
        break;
      case 'custom':
        description = '自定义重复';
        break;
    }

    // 结束条件描述
    if (endCondition?.type === 'count' && endCondition.count) {
      description += `，共${endCondition.count}次`;
    } else if (endCondition?.type === 'date' && endCondition.endDate) {
      // 使用TimeUtils的formatDateToInput方法来格式化日期
      const endDateStr = TimeUtils.formatDateToInput(endCondition.endDate);
      description += `，至${endDateStr}`;
    }

    return description;
  });

  // 监听重复规则变化，自动验证
  watch(recurrenceRule, () => {
    validateRecurrence();
  }, { deep: true });

  // 初始验证
  validateRecurrence();

  return {
    // 状态
    validationErrors: readonly(validationErrors),
    isValid,
    
    // 方法
    validateRecurrence,
    resetValidation,
    
    // 计算属性
    getRecurrenceDescription,
    
    // 单独的验证方法（用于特定场景）
    validateInterval,
    validateEndCondition,
    validateWeeklyConfig,
    validateMonthlyConfig
  };
}