// 时间配置验证器
import type { TaskTemplate } from '../../../types/task';
import type { TaskTimeConfig, DateTime } from '../../../types/timeStructure';
import type { ITemplateValidator, ValidationResult } from '../types';
import { ValidationUtils } from '../ValidationUtils';

/**
 * 时间配置验证器
 * 负责验证任务模板的时间相关配置
 */
export class TimeConfigValidator implements ITemplateValidator {
  validate(template: TaskTemplate): ValidationResult {
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
    } else {
      results.push(this.validateDateTime(baseTime.start, '开始时间'));
    }

    // 根据时间类型验证结束时间
    if (type === 'timeRange') {
      if (!baseTime.end) {
        results.push(ValidationUtils.failure(['时间段类型必须设置结束时间']));
      } else {
        results.push(this.validateDateTime(baseTime.end, '结束时间'));
        
        // 验证时间顺序
        if (baseTime.start && baseTime.end) {
          if (baseTime.end.timestamp <= baseTime.start.timestamp) {
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
   * 验证DateTime对象
   */
  private validateDateTime(dateTime: DateTime, fieldName: string): ValidationResult {
    if (!dateTime) {
      return ValidationUtils.failure([`${fieldName}不能为空`]);
    }

    const results: ValidationResult[] = [];

    // 验证timestamp
    if (typeof dateTime.timestamp !== 'number' || isNaN(dateTime.timestamp)) {
      results.push(ValidationUtils.failure([`${fieldName}的时间戳格式不正确`]));
    } else {
      // 验证时间戳是否合理（不能是负数，不能太久远）
      const now = Date.now();
      const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
      const tenYearsLater = now + (10 * 365 * 24 * 60 * 60 * 1000);

      if (dateTime.timestamp < oneYearAgo) {
        results.push(ValidationUtils.success([`${fieldName}是很久以前的时间，请确认是否正确`]));
      }

      if (dateTime.timestamp > tenYearsLater) {
        results.push(ValidationUtils.success([`${fieldName}是很久以后的时间，请确认是否正确`]));
      }
    }

    // 验证date对象
    if (!dateTime.date) {
      results.push(ValidationUtils.failure([`${fieldName}的日期信息不能为空`]));
    } else {
      results.push(this.validateDateInfo(dateTime.date, fieldName));
    }

    // 验证time对象（如果存在）
    if (dateTime.time) {
      results.push(this.validateTimePoint(dateTime.time, fieldName));
    }

    // 验证ISO字符串
    if (!dateTime.isoString) {
      results.push(ValidationUtils.failure([`${fieldName}的ISO字符串不能为空`]));
    } else {
      const isoDate = new Date(dateTime.isoString);
      if (isNaN(isoDate.getTime())) {
        results.push(ValidationUtils.failure([`${fieldName}的ISO字符串格式不正确`]));
      }
      // 检查timestamp和ISO字符串是否一致
      else if (Math.abs(isoDate.getTime() - dateTime.timestamp) > 1000) {
        results.push(ValidationUtils.failure([`${fieldName}的时间戳与ISO字符串不一致`]));
      }
    }

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证日期信息
   */
  private validateDateInfo(date: any, fieldName: string): ValidationResult {
    const results: ValidationResult[] = [];

    // 验证年份
    results.push(ValidationUtils.validateNumberRange(date.year, `${fieldName}年份`, {
      min: 1900,
      max: 2100,
      required: true,
      integer: true
    }));

    // 验证月份
    results.push(ValidationUtils.validateNumberRange(date.month, `${fieldName}月份`, {
      min: 1,
      max: 12,
      required: true,
      integer: true
    }));

    // 验证日期
    results.push(ValidationUtils.validateNumberRange(date.day, `${fieldName}日期`, {
      min: 1,
      max: 31,
      required: true,
      integer: true
    }));

    // 验证日期合法性
    if (date.year && date.month && date.day) {
      const testDate = new Date(date.year, date.month - 1, date.day);
      if (testDate.getFullYear() !== date.year || 
          testDate.getMonth() !== date.month - 1 || 
          testDate.getDate() !== date.day) {
        results.push(ValidationUtils.failure([`${fieldName}不是有效日期`]));
      }
    }

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证时间点
   */
  private validateTimePoint(time: any, fieldName: string): ValidationResult {
    const results: ValidationResult[] = [];

    // 验证小时
    results.push(ValidationUtils.validateNumberRange(time.hour, `${fieldName}小时`, {
      min: 0,
      max: 23,
      required: true,
      integer: true
    }));

    // 验证分钟
    results.push(ValidationUtils.validateNumberRange(time.minute, `${fieldName}分钟`, {
      min: 0,
      max: 59,
      required: true,
      integer: true
    }));

    return ValidationUtils.mergeResults(...results);
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
    if (timeConfig.type === 'allDay' && timeConfig.baseTime.start?.time) {
      warnings.push('全天任务不需要设置具体时间');
    }

    // 检查定时任务是否缺少时间
    if (timeConfig.type === 'timed' && !timeConfig.baseTime.start?.time) {
      errors.push('定时任务必须设置具体时间');
    }

    // 检查时间段任务的持续时间
    if (timeConfig.type === 'timeRange' && timeConfig.baseTime.start && timeConfig.baseTime.end) {
      const duration = timeConfig.baseTime.end.timestamp - timeConfig.baseTime.start.timestamp;
      const durationInMinutes = duration / (1000 * 60);
      
      if (durationInMinutes < 1) {
        errors.push('时间段持续时间不能少于1分钟');
      } else if (durationInMinutes > 8 * 60) { // 8小时
        warnings.push('时间段持续时间超过8小时，建议分解为多个任务');
      }
    }

    if (errors.length > 0) {
      return ValidationUtils.failure(errors, warnings);
    }

    return ValidationUtils.success(warnings);
  }
}