// composables/useTimeConfigValidation.ts - 纯前端UI验证
import { ref, computed } from 'vue';
import { TaskTemplate } from '@/modules/task/domain/aggregates/taskTemplate';

export function useTimeConfigValidation() {
  const errors = ref<string[]>([]);
  const warnings = ref<string[]>([]);

  /**
   * 前端时间配置验证 - 仅用于UI反馈
   */
  const validateTimeConfig = (timeConfig: TaskTemplate['timeConfig']): boolean => {
    errors.value = [];
    warnings.value = [];

    // 基础类型检查
    if (!['allDay', 'timed', 'timeRange'].includes(timeConfig.type)) {
      errors.value.push('请选择有效的任务类型');
      return false;
    }

    // 开始时间检查
    if (!timeConfig.baseTime?.start) {
      errors.value.push('请设置开始时间');
      return false;
    }

    // 时间段类型的特殊检查
    if (timeConfig.type === 'timeRange') {
      if (!timeConfig.baseTime.end) {
        errors.value.push('时间段任务必须设置结束时间');
        return false;
      }

      // 时间顺序检查
      if (timeConfig.baseTime.end.getTime() <= timeConfig.baseTime.start.getTime()) {
        errors.value.push('结束时间必须晚于开始时间');
        return false;
      }

      // 时长合理性检查
      const duration = timeConfig.baseTime.end.getTime() - timeConfig.baseTime.start.getTime();
      const hours = duration / (1000 * 60 * 60);
      
      if (hours > 12) {
        warnings.value.push('任务时长超过12小时，请确认是否合理');
      } else if (hours < 0.25) {
        warnings.value.push('任务时长不足15分钟，可能过于简短');
      }
    }

    // 时间设置的用户体验检查
    if (timeConfig.type === 'timed' && timeConfig.baseTime.start) {
      const hour = timeConfig.baseTime.start.getHours();
      if (hour < 6 || hour > 23) {
        warnings.value.push('任务时间较早或较晚，请确认是否合适');
      }
    }

    return true;
  };

  /**
   * 快速检查时间冲突 (简单的UI层检查)
   */
  const checkBasicTimeConflict = (timeConfig: TaskTemplate['timeConfig'], otherTimes: TaskTemplate['timeConfig'][] = []): boolean => {
    if (timeConfig.type === 'allDay') return true;

    // 简单的重叠检查
    for (const other of otherTimes) {
      if (other.type === 'allDay') continue;
      
      const start1 = timeConfig.baseTime.start.getTime();
      const end1 = timeConfig.baseTime.end?.getTime() || start1 + (60 * 60 * 1000); // 默认1小时
      const start2 = other.baseTime.start.getTime();
      const end2 = other.baseTime.end?.getTime() || start2 + (60 * 60 * 1000);

      if (start1 < end2 && end1 > start2) {
        warnings.value.push('存在时间重叠的任务，请注意安排');
        break;
      }
    }

    return true;
  };

  /**
   * 验证重复设置的合理性
   */
  const validateRecurrenceSettings = (timeConfig: TaskTemplate['timeConfig']): boolean => {
    const recurrence = timeConfig.recurrence;
    
    if (recurrence.type === 'none') return true;

    // 检查间隔合理性
    if (recurrence.interval && recurrence.interval > 365) {
      warnings.value.push('重复间隔过长，可能影响任务连续性');
    }

    // 每日重复且时间很晚的警告
    if (recurrence.type === 'daily' && timeConfig.baseTime.start) {
      const hour = timeConfig.baseTime.start.getHours();
      if (hour > 22) {
        warnings.value.push('每日重复任务时间较晚，可能影响执行');
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

  const isValid = computed(() => errors.value.length === 0);
  const hasWarnings = computed(() => warnings.value.length > 0);

  return {
    // 状态
    errors,
    warnings,
    isValid,
    hasWarnings,
    
    // 方法 - 仅UI验证相关
    validateTimeConfig,
    checkBasicTimeConflict,
    validateRecurrenceSettings,
    resetValidation
  };
}
