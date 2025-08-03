// 时间配置验证器
import type { ITaskTemplate, TaskTimeConfig } from '@common/modules/task/types/task';

import type { ITemplateValidator, ValidationResult } from './types';
import { ValidationUtils } from './ValidationUtils';
import { isAfter } from 'date-fns';

/**
 * 时间配置验证器
 * 负责验证任务模板的时间相关配置
 */
export class TimeConfigValidator implements ITemplateValidator {
  validate(template: ITaskTemplate): ValidationResult {
    const timeConfig = template.timeConfig;
    
    if (!timeConfig) {
      return ValidationUtils.failure(['时间配置不能为空']);
    }

    const results: ValidationResult[] = [];

    // 验证时间类型
    results.push(this.validateTimeType(timeConfig.type));

    // 验证基础时间
    results.push(this.validateBaseTime(timeConfig));

    // 验证时区
    results.push(this.validateTimezone(timeConfig.timezone));

    // 验证时间逻辑一致性
    results.push(this.validateTimeLogic(timeConfig));

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证时间类型
   */
  private validateTimeType(type: string): ValidationResult {
    return ValidationUtils.validateEnum(
      type as any,
      '时间类型',
      ['allDay', 'timed', 'timeRange'],
      true
    );
  }

  /**
   * 验证基础时间信息
   */
  private validateBaseTime(timeConfig: TaskTimeConfig): ValidationResult {
    if (!timeConfig.baseTime) {
      return ValidationUtils.failure(['基础时间信息不能为空']);
    }

    const results: ValidationResult[] = [];
    const { baseTime, type } = timeConfig;

    // 验证开始时间
    if (!baseTime.start) {
      results.push(ValidationUtils.failure(['开始时间不能为空']));
    } else if (baseTime.start instanceof Date) {
      results.push(this.validateDate(baseTime.start, '开始时间'));
    }

    // 根据时间类型验证结束时间
    if (type === 'timeRange') {
      if (!baseTime.end) {
        results.push(ValidationUtils.failure(['时间段类型必须设置结束时间']));
      } else if (baseTime.end instanceof Date) {
        results.push(this.validateDate(baseTime.end, '结束时间'));
        // 验证时间顺序
        if (baseTime.start && baseTime.end) {
          if (isAfter(baseTime.start, baseTime.end)) {
            results.push(ValidationUtils.failure(['结束时间必须晚于开始时间']));
          }
        }
      }
    } else if (type === 'timed' && baseTime.end) {
      // 定时任务不应该有结束时间
      results.push(ValidationUtils.success(['定时任务不需要设置结束时间，将被忽略']));
    }

    // 验证持续时间
    if (baseTime.duration !== undefined) {
      results.push(this.validateDuration(baseTime.duration));
    }

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证日期
   */
  private validateDate(date: Date, fieldName: string): ValidationResult {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return ValidationUtils.failure([`${fieldName}不是有效日期`]);
    }
    return ValidationUtils.success();
  }


  /**
   * 验证持续时间
   */
  private validateDuration(duration: number): ValidationResult {
    return ValidationUtils.validateNumberRange(duration, '持续时间', {
      min: 1,
      max: 24 * 60, // 最长24小时
      required: false,
      integer: true
    });
  }

  /**
   * 验证时区
   */
  private validateTimezone(timezone: string): ValidationResult {
    if (!timezone) {
      return ValidationUtils.failure(['时区信息不能为空']);
    }

    // 基本格式验证
    if (typeof timezone !== 'string' || timezone.trim() === '') {
      return ValidationUtils.failure(['时区格式不正确']);
    }

    // 验证时区格式（简单验证）
    const validTimezonePattern = /^[A-Za-z]+\/[A-Za-z_]+$|^UTC[+-]?\d{1,2}(:\d{2})?$|^GMT[+-]?\d{1,2}(:\d{2})?$/;
    if (!validTimezonePattern.test(timezone)) {
      return ValidationUtils.success(['时区格式可能不标准，建议使用标准IANA时区格式']);
    }

    return ValidationUtils.success();
  }

  /**
   * 验证时间逻辑一致性
   */
  private validateTimeLogic(timeConfig: TaskTimeConfig): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 检查全天任务是否设置了具体时间
    if (timeConfig.type === 'allDay' && (timeConfig.baseTime as any)?.start?.time) {
      warnings.push('全天任务不需要设置具体时间');
    }

    // 检查定时任务是否缺少时间
    if (timeConfig.type === 'timed' && !(timeConfig.baseTime as any)?.start?.time) {
      errors.push('定时任务必须设置具体时间');
    }

    // 检查时间段任务的持续时间
    if (
      timeConfig.type === 'timeRange' &&
      timeConfig.baseTime.start &&
      timeConfig.baseTime.end
    ) {
      const start = timeConfig.baseTime.start;
      const end = timeConfig.baseTime.end;
      if (start instanceof Date && end instanceof Date) {
        const duration = end.getTime() - start.getTime();
        const durationInMinutes = duration / (1000 * 60);

        if (durationInMinutes < 1) {
          errors.push('时间段持续时间不能少于1分钟');
        } else if (durationInMinutes > 8 * 60) {
          warnings.push('时间段持续时间超过8小时，建议分解为多个任务');
        }
      }
    }

    if (errors.length > 0) {
      return ValidationUtils.failure(errors, warnings);
    }

    return ValidationUtils.success(warnings);
  }
}