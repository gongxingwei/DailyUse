// 提醒验证器
import type { ITaskTemplate } from '@/modules/Task/domain/types/task';
import type { TaskReminderConfig } from '@/modules/Task/domain/types/task';
import type { ITemplateValidator, ValidationResult } from './types';
import { ValidationUtils } from './ValidationUtils';

/**
 * 提醒验证器
 * 负责验证任务模板的提醒配置
 */
export class ReminderValidator implements ITemplateValidator {
  validate(template: ITaskTemplate): ValidationResult {
    const reminder = template.reminderConfig as TaskReminderConfig;
    
    if (!reminder) {
      return ValidationUtils.failure(['提醒规则不能为空']);
    }

    // 如果提醒未启用，只做基本验证
    if (!reminder.enabled) {
      return this.validateDisabledReminder(reminder);
    }

    const results: ValidationResult[] = [];

    // 验证提醒列表
    results.push(this.validateAlerts(reminder.alerts));

    // 验证稍后提醒配置
    results.push(this.validateSnoozeConfig(reminder.snooze));

    // 验证业务逻辑
    results.push(this.validateBusinessLogic(reminder, template));

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证未启用的提醒配置
   */
  private validateDisabledReminder(reminder: TaskReminderConfig): ValidationResult {
    const warnings: string[] = [];

    if (reminder.alerts && reminder.alerts.length > 0) {
      warnings.push('提醒未启用，但配置了提醒项目');
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证提醒列表
   */
  private validateAlerts(alerts: any[]): ValidationResult {
    if (!alerts || alerts.length === 0) {
      return ValidationUtils.failure(['启用提醒时必须至少设置一个提醒']);
    }

    const arrayResult = ValidationUtils.validateArray(alerts, '提醒列表', {
      required: true,
      minLength: 1,
      maxLength: 10, // 最多10个提醒
      elementValidator: (alert, index) => this.validateAlert(alert, index)
    });

    if (!arrayResult.isValid) {
      return arrayResult;
    }

    // 检查重复的提醒设置
    const duplicateResult = this.checkDuplicateAlerts(alerts);
    if (!duplicateResult.isValid) {
      return duplicateResult;
    }

    const warnings: string[] = [];

    // 提醒过多的警告
    if (alerts.length > 5) {
      warnings.push('设置了较多提醒，可能会造成干扰');
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证单个提醒项
   */
  private validateAlert(alert: any, index: number): ValidationResult {
    const results: ValidationResult[] = [];
    const alertName = `第 ${index + 1} 个提醒`;

    // 验证ID
    results.push(ValidationUtils.validateRequired(alert.uuid, `${alertName}ID`));

    // 验证提醒类型
    results.push(ValidationUtils.validateEnum(
      alert.type,
      `${alertName}类型`,
      ['notification', 'email', 'sound'],
      true
    ));

    // 验证时间配置
    results.push(this.validateAlertTiming(alert.timing, alertName));

    // 验证消息
    if (alert.message) {
      results.push(ValidationUtils.validateStringLength(alert.message, `${alertName}消息`, {
        max: 200
      }));
    }

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证提醒时间配置
   */
  private validateAlertTiming(timing: any, alertName: string): ValidationResult {
    if (!timing) {
      return ValidationUtils.failure([`${alertName}缺少时机设置`]);
    }

    const results: ValidationResult[] = [];

    // 验证时间类型
    results.push(ValidationUtils.validateEnum(
      timing.type,
      `${alertName}时机类型`,
      ['relative', 'absolute'],
      true
    ));

    // 根据类型验证具体配置
    switch (timing.type) {
      case 'relative':
        results.push(this.validateRelativeTiming(timing, alertName));
        break;
      case 'absolute':
        results.push(this.validateAbsoluteTiming(timing, alertName));
        break;
    }

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证相对时间配置
   */
  private validateRelativeTiming(timing: any, alertName: string): ValidationResult {
    if (timing.minutesBefore === undefined) {
      return ValidationUtils.failure([`${alertName}缺少提前时间设置`]);
    }

    const numberResult = ValidationUtils.validateNumberRange(timing.minutesBefore, `${alertName}提前时间`, {
      min: 0,
      max: 10080, // 最多提前7天
      required: true,
      integer: true
    });

    if (!numberResult.isValid) {
      return numberResult;
    }

    const warnings: string[] = [];
    const minutes = timing.minutesBefore;

    // 给出合理性建议
    if (minutes === 0) {
      warnings.push(`${alertName}设置为任务开始时提醒`);
    } else if (minutes > 1440) { // 超过1天
      warnings.push(`${alertName}提前时间超过1天，请确认是否合理`);
    }

    // 检查是否有绝对时间配置（应该清理）
    if (timing.absoluteTime) {
      warnings.push(`${alertName}是相对时间模式，绝对时间配置将被忽略`);
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证绝对时间配置
   */
  private validateAbsoluteTiming(timing: any, alertName: string): ValidationResult {
    if (!timing.absoluteTime) {
      return ValidationUtils.failure([`${alertName}缺少绝对时间设置`]);
    }

    // 验证绝对时间格式
    const dateResult = ValidationUtils.validateDate(timing.absoluteTime, `${alertName}绝对时间`, {
      required: true
    });

    if (!dateResult.isValid) {
      return dateResult;
    }

    const warnings: string[] = [];

    // 检查是否有相对时间配置（应该清理）
    if (timing.minutesBefore !== undefined) {
      warnings.push(`${alertName}是绝对时间模式，相对时间配置将被忽略`);
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 检查重复的提醒设置
   */
  private checkDuplicateAlerts(alerts: any[]): ValidationResult {
    const seenTimings = new Set<string>();
    const errors: string[] = [];

    for (let i = 0; i < alerts.length; i++) {
      const alert = alerts[i];
      let timingKey: string;

      if (alert.timing?.type === 'relative') {
        timingKey = `relative:${alert.timing.minutesBefore}`;
      } else if (alert.timing?.type === 'absolute') {
        timingKey = `absolute:${alert.timing.absoluteTime?.timestamp}`;
      } else {
        continue; // 跳过无效的时间配置
      }

      if (seenTimings.has(timingKey)) {
        errors.push(`第 ${i + 1} 个提醒与其他提醒时间重复`);
      } else {
        seenTimings.add(timingKey);
      }
    }

    return errors.length > 0 ? ValidationUtils.failure(errors) : ValidationUtils.success();
  }

  /**
   * 验证稍后提醒配置
   */
  private validateSnoozeConfig(snooze: any): ValidationResult {
    if (!snooze) {
      return ValidationUtils.failure(['稍后提醒配置不能为空']);
    }

    const results: ValidationResult[] = [];

    // 验证是否启用
    if (typeof snooze.enabled !== 'boolean') {
      results.push(ValidationUtils.failure(['稍后提醒启用状态必须是布尔值']));
    }

    // 如果启用了稍后提醒，验证相关配置
    if (snooze.enabled) {
      // 验证间隔时间
      results.push(ValidationUtils.validateNumberRange(snooze.interval, '稍后提醒间隔', {
        min: 1,
        max: 60, // 最多1小时
        required: true,
        integer: true
      }));

      // 验证最大次数
      results.push(ValidationUtils.validateNumberRange(snooze.maxCount, '稍后提醒最大次数', {
        min: 1,
        max: 10,
        required: true,
        integer: true
      }));
    }

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证业务逻辑
   */
  private validateBusinessLogic(reminder: TaskReminderConfig, template: ITaskTemplate): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 检查全天任务的绝对时间提醒
    if (template.timeConfig.type === 'allDay') {
      const hasAbsoluteAlerts = reminder.alerts.some(alert => 
        alert.timing?.type === 'absolute'
      );
      
      if (hasAbsoluteAlerts) {
        warnings.push('全天任务使用绝对时间提醒，建议使用相对时间');
      }
    }

    // 检查提醒时间与任务时间的逻辑关系
    if (template.timeConfig.type === 'timed' && template.timeConfig.baseTime.start) {
      const taskTime = new Date(template.timeConfig.baseTime.start.timestamp);
      
      for (const alert of reminder.alerts) {
        if (alert.timing?.type === 'absolute' && alert.timing.absoluteTime) {
          const reminderTime = new Date(alert.timing.absoluteTime.timestamp);
          
          if (reminderTime >= taskTime) {
            errors.push('绝对时间提醒不能晚于或等于任务开始时间');
          }
          
          const timeDiff = taskTime.getTime() - reminderTime.getTime();
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          
          if (daysDiff > 30) {
            warnings.push('绝对时间提醒时间过早，超过30天');
          }
        }
      }
    }

    // 检查重复任务的提醒策略
    if (template.timeConfig.recurrence.type !== 'none') {
      const hasRelativeAlerts = reminder.alerts.some(alert => 
        alert.timing?.type === 'relative'
      );
      
      if (!hasRelativeAlerts && reminder.alerts.length > 0) {
        warnings.push('重复任务建议使用相对时间提醒，以适应不同的执行时间');
      }
    }

    // 检查提醒类型的可用性
    const emailAlerts = reminder.alerts.filter(alert => alert.type === 'email');
    if (emailAlerts.length > 0) {
      warnings.push('邮件提醒功能暂未实现');
    }

    const soundAlerts = reminder.alerts.filter(alert => alert.type === 'sound');
    if (soundAlerts.length > 0) {
      warnings.push('声音提醒功能暂未实现');
    }

    if (errors.length > 0) {
      return ValidationUtils.failure(errors, warnings);
    }

    return ValidationUtils.success(warnings);
  }
}