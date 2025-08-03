// 调度策略验证器
import type { ITaskTemplate } from '@common/modules/task/types/task';
import type { ITemplateValidator, ValidationResult } from './types';
import { ValidationUtils } from './ValidationUtils';

/**
 * 调度策略验证器
 * 负责验证任务模板的调度策略配置
 */
export class SchedulingPolicyValidator implements ITemplateValidator {
  validate(template: ITaskTemplate): ValidationResult {
    const policy = template.schedulingPolicy;
    
    if (!policy) {
      return ValidationUtils.failure(['调度策略不能为空']);
    }

    const results: ValidationResult[] = [];

    // 验证各个策略字段
    results.push(this.validateAllowReschedule(policy.allowReschedule));
    results.push(this.validateMaxDelayDays(policy.maxDelayDays));
    results.push(this.validateSkipWeekends(policy.skipWeekends));
    results.push(this.validateSkipHolidays(policy.skipHolidays));
    results.push(this.validateWorkingHoursOnly(policy.workingHoursOnly));

    // 验证策略组合的合理性
    results.push(this.validatePolicyCombination(policy, template));

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证是否允许重新调度
   */
  private validateAllowReschedule(allowReschedule: any): ValidationResult {
    if (typeof allowReschedule !== 'boolean') {
      return ValidationUtils.failure(['允许重新调度必须是布尔值']);
    }

    return ValidationUtils.success();
  }

  /**
   * 验证最大延迟天数
   */
  private validateMaxDelayDays(maxDelayDays: any): ValidationResult {
    const numberResult = ValidationUtils.validateNumberRange(maxDelayDays, '最大延迟天数', {
      min: 0,
      max: 365, // 最多延迟一年
      required: true,
      integer: true
    });

    if (!numberResult.isValid) {
      return numberResult;
    }

    const warnings: string[] = [];

    if (maxDelayDays === 0) {
      warnings.push('最大延迟天数为0，任务不能延期执行');
    } else if (maxDelayDays > 30) {
      warnings.push('最大延迟天数超过30天，可能影响任务的时效性');
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证跳过周末
   */
  private validateSkipWeekends(skipWeekends: any): ValidationResult {
    if (typeof skipWeekends !== 'boolean') {
      return ValidationUtils.failure(['跳过周末必须是布尔值']);
    }

    return ValidationUtils.success();
  }

  /**
   * 验证跳过节假日
   */
  private validateSkipHolidays(skipHolidays: any): ValidationResult {
    if (typeof skipHolidays !== 'boolean') {
      return ValidationUtils.failure(['跳过节假日必须是布尔值']);
    }

    const warnings: string[] = [];

    if (skipHolidays) {
      warnings.push('跳过节假日功能需要配置节假日数据源');
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证仅工作时间
   */
  private validateWorkingHoursOnly(workingHoursOnly: any): ValidationResult {
    if (typeof workingHoursOnly !== 'boolean') {
      return ValidationUtils.failure(['仅工作时间必须是布尔值']);
    }

    return ValidationUtils.success();
  }

  /**
   * 验证策略组合的合理性
   */
  private validatePolicyCombination(policy: any, template: ITaskTemplate): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 检查重新调度与最大延迟天数的组合
    if (!policy.allowReschedule && policy.maxDelayDays > 0) {
      warnings.push('不允许重新调度时，最大延迟天数设置将无效');
    }

    // 检查全天任务与工作时间限制的组合
    if (template.timeConfig.type === 'allDay' && policy.workingHoursOnly) {
      warnings.push('全天任务设置仅工作时间限制可能不合理');
    }

    // 检查跳过周末与每日重复的组合
    if (template.timeConfig.recurrence.type === 'daily' && policy.skipWeekends) {
      warnings.push('每日重复任务跳过周末，实际为工作日重复');
    }

    // 检查跳过周末与周末特定任务的冲突
    if (template.timeConfig.recurrence.type === 'weekly' && 
        template.timeConfig.recurrence.config?.weekdays) {
      const weekdays = template.timeConfig.recurrence.config.weekdays;
      const hasWeekendDays = weekdays.some((day: number) => day === 0 || day === 6); // 周日或周六
      
      if (hasWeekendDays && policy.skipWeekends) {
        errors.push('任务设置在周末执行，但调度策略要求跳过周末');
      }
    }

    // 检查工作时间限制与非工作时间任务的冲突
    if (policy.workingHoursOnly && template.timeConfig.type === 'timed') {
      const startTime = template.timeConfig.baseTime.start.getTime();
      if (startTime) {
        const hour = new Date(startTime).getHours();

        // 假设工作时间为9:00-18:00
        if (hour < 9 || hour >= 18) {
          warnings.push('任务设置在非工作时间，但策略要求仅工作时间执行');
        }
      }
    }

    // 检查多重限制可能导致无法执行的情况
    const restrictionCount = [
      policy.skipWeekends,
      policy.skipHolidays,
      policy.workingHoursOnly
    ].filter(Boolean).length;

    if (restrictionCount >= 2) {
      warnings.push('设置了多个时间限制，可能导致任务难以找到合适的执行时间');
    }

    // 检查重复任务的调度复杂性
    if (template.timeConfig.recurrence.type !== 'none' && !policy.allowReschedule) {
      if (policy.skipWeekends || policy.skipHolidays || policy.workingHoursOnly) {
        warnings.push('重复任务设置了时间限制但不允许重新调度，可能导致某些实例无法执行');
      }
    }

    if (errors.length > 0) {
      return ValidationUtils.failure(errors, warnings);
    }

    return ValidationUtils.success(warnings);
  }
}