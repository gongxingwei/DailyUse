import { ref, computed } from 'vue';
import { TaskTemplate } from '@renderer/modules/Task/domain/aggregates/taskTemplate';
export function useReminderValidation() {
  const errors = ref<string[]>([]);
  const warnings = ref<string[]>([]);

  /**
   * 前端快速验证 - 仅用于UI实时反馈
   */
  const validateReminders = (reminderConfig: TaskTemplate['reminderConfig']): boolean => {
    errors.value = [];
    warnings.value = [];

    if (!reminderConfig.enabled) return true;

    // 快速检查必要字段
    if (!reminderConfig.alerts || reminderConfig.alerts.length === 0) {
      errors.value.push('启用提醒时必须至少添加一个提醒项');
      return false;
    }

    for (const alert of reminderConfig.alerts) {
      if (!validateSingleAlert(alert)) {
        return false;
      }
    }

    return true;
  };

  /**
   * 单个提醒项的快速验证
   */
  const validateSingleAlert = (
    alert: TaskTemplate['reminderConfig']['alerts'][number],
  ): boolean => {
    if (!alert.type) {
      errors.value.push('提醒类型不能为空');
      return false;
    }

    if (!alert.timing || !alert.timing.type) {
      errors.value.push('提醒时机类型不能为空');
      return false;
    }

    if (alert.timing.type === 'relative') {
      if (!alert.timing.minutesBefore || alert.timing.minutesBefore <= 0) {
        errors.value.push('相对提醒时间必须大于0分钟');
        return false;
      }

      // UI层面的用户体验警告
      if (alert.timing.minutesBefore > 1440) {
        warnings.value.push('提前时间超过24小时可能影响提醒效果');
      }

      if (alert.timing.minutesBefore < 5) {
        warnings.value.push('提前时间过短，可能无法及时准备');
      }
    } else if (alert.timing.type === 'absolute') {
      if (!alert.timing.absoluteTime) {
        errors.value.push('绝对提醒时间不能为空');
        return false;
      }
    }

    return true;
  };

  /**
   * 重置验证状态
   */
  const resetValidation = () => {
    errors.value = [];
    warnings.value = [];
  };

  /**
   * 检查提醒时间冲突 (UI层面的简单检查)
   */
  const checkTimeConflicts = (alerts: TaskTemplate['reminderConfig']['alerts']): boolean => {
    const relativeTimes = alerts
      .filter((alert) => alert.timing.type === 'relative' && alert.timing.minutesBefore)
      .map((alert) => alert.timing.minutesBefore!)
      .sort((a, b) => a - b);

    // 检查是否有重复的相对时间
    for (let i = 1; i < relativeTimes.length; i++) {
      if (relativeTimes[i] === relativeTimes[i - 1]) {
        warnings.value.push('存在相同的提醒时间，可能产生重复提醒');
        return false;
      }
    }

    return true;
  };

  const isValid = computed(() => errors.value.length === 0);
  const hasWarnings = computed(() => warnings.value.length > 0);

  return {
    // 状态
    errors,
    warnings,
    isValid,
    hasWarnings,

    // 方法 - 仅UI验证相关
    validateReminders,
    validateSingleAlert,
    resetValidation,
    checkTimeConflicts,
  };
}
