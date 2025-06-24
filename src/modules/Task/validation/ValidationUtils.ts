// 验证工具类
import type { ValidationResult, ValidationError, ValidationErrorType } from './types';

/**
 * 验证工具类 - 提供通用的验证方法
 */
export class ValidationUtils {
  /**
   * 创建验证结果
   */
  static createResult(isValid: boolean, errors: string[] = [], warnings: string[] = []): ValidationResult {
    return {
      isValid,
      errors,
      warnings
    };
  }

  /**
   * 创建成功的验证结果
   */
  static success(warnings: string[] = []): ValidationResult {
    return this.createResult(true, [], warnings);
  }

  /**
   * 创建失败的验证结果
   */
  static failure(errors: string[], warnings: string[] = []): ValidationResult {
    return this.createResult(false, errors, warnings);
  }

  /**
   * 合并多个验证结果
   */
  static mergeResults(...results: ValidationResult[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let isValid = true;

    for (const result of results) {
      if (!result.isValid) {
        isValid = false;
      }
      allErrors.push(...result.errors);
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    return this.createResult(isValid, allErrors, allWarnings);
  }

  /**
   * 验证必填字段
   */
  static validateRequired(value: any, fieldName: string): ValidationResult {
    if (value === null || value === undefined || 
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)) {
      return this.failure([`${fieldName}不能为空`]);
    }
    return this.success();
  }

  /**
   * 验证字符串长度
   */
  static validateStringLength(
    value: string | undefined, 
    fieldName: string, 
    options: { min?: number; max?: number; required?: boolean } = {}
  ): ValidationResult {
    if (!value) {
      if (options.required) {
        return this.failure([`${fieldName}不能为空`]);
      }
      return this.success();
    }

    const errors: string[] = [];
    const length = value.trim().length;

    if (options.min !== undefined && length < options.min) {
      errors.push(`${fieldName}长度不能少于${options.min}个字符`);
    }

    if (options.max !== undefined && length > options.max) {
      errors.push(`${fieldName}长度不能超过${options.max}个字符`);
    }

    return errors.length > 0 ? this.failure(errors) : this.success();
  }

  /**
   * 验证数值范围
   */
  static validateNumberRange(
    value: number | undefined,
    fieldName: string,
    options: { min?: number; max?: number; required?: boolean; integer?: boolean } = {}
  ): ValidationResult {
    if (value === undefined) {
      if (options.required) {
        return this.failure([`${fieldName}不能为空`]);
      }
      return this.success();
    }

    const errors: string[] = [];

    if (typeof value !== 'number' || isNaN(value)) {
      errors.push(`${fieldName}必须是有效数字`);
      return this.failure(errors);
    }

    if (options.integer && !Number.isInteger(value)) {
      errors.push(`${fieldName}必须是整数`);
    }

    if (options.min !== undefined && value < options.min) {
      errors.push(`${fieldName}不能小于${options.min}`);
    }

    if (options.max !== undefined && value > options.max) {
      errors.push(`${fieldName}不能大于${options.max}`);
    }

    return errors.length > 0 ? this.failure(errors) : this.success();
  }

  /**
   * 验证枚举值
   */
  static validateEnum<T>(
    value: T,
    fieldName: string,
    allowedValues: T[],
    required: boolean = true
  ): ValidationResult {
    if (!required && (value === null || value === undefined)) {
      return this.success();
    }

    if (!allowedValues.includes(value)) {
      return this.failure([`${fieldName}必须是以下值之一: ${allowedValues.join(', ')}`]);
    }

    return this.success();
  }

  /**
   * 验证数组
   */
  static validateArray(
    value: any[] | undefined,
    fieldName: string,
    options: { 
      required?: boolean; 
      minLength?: number; 
      maxLength?: number;
      elementValidator?: (item: any, index: number) => ValidationResult;
    } = {}
  ): ValidationResult {
    if (!value) {
      if (options.required) {
        return this.failure([`${fieldName}不能为空`]);
      }
      return this.success();
    }

    if (!Array.isArray(value)) {
      return this.failure([`${fieldName}必须是数组`]);
    }

    const errors: string[] = [];

    if (options.minLength !== undefined && value.length < options.minLength) {
      errors.push(`${fieldName}至少需要${options.minLength}个元素`);
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      errors.push(`${fieldName}最多只能有${options.maxLength}个元素`);
    }

    // 验证数组元素
    if (options.elementValidator) {
      value.forEach((item, index) => {
        const result = options.elementValidator!(item, index);
        if (!result.isValid) {
          errors.push(...result.errors.map(err => `${fieldName}[${index}]: ${err}`));
        }
      });
    }

    return errors.length > 0 ? this.failure(errors) : this.success();
  }

  /**
   * 验证邮箱格式
   */
  static validateEmail(email: string, fieldName: string = '邮箱'): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
      return this.failure([`${fieldName}格式不正确`]);
    }

    return this.success();
  }

  /**
   * 验证URL格式
   */
  static validateUrl(url: string, fieldName: string = 'URL'): ValidationResult {
    try {
      new URL(url);
      return this.success();
    } catch {
      return this.failure([`${fieldName}格式不正确`]);
    }
  }

  /**
   * 验证日期
   */
  static validateDate(
    date: any,
    fieldName: string,
    options: { 
      required?: boolean;
      minDate?: Date;
      maxDate?: Date;
      futureOnly?: boolean;
      pastOnly?: boolean;
    } = {}
  ): ValidationResult {
    if (!date) {
      if (options.required) {
        return this.failure([`${fieldName}不能为空`]);
      }
      return this.success();
    }

    // 检查是否有timestamp属性（DateTime类型）
    let dateValue: Date;
    if (typeof date === 'object' && date.timestamp) {
      dateValue = new Date(date.timestamp);
    } else if (date instanceof Date) {
      dateValue = date;
    } else if (typeof date === 'string') {
      dateValue = new Date(date);
    } else {
      return this.failure([`${fieldName}格式不正确`]);
    }

    if (isNaN(dateValue.getTime())) {
      return this.failure([`${fieldName}不是有效日期`]);
    }

    const now = new Date();
    const errors: string[] = [];

    if (options.futureOnly && dateValue <= now) {
      errors.push(`${fieldName}必须是未来时间`);
    }

    if (options.pastOnly && dateValue >= now) {
      errors.push(`${fieldName}必须是过去时间`);
    }

    if (options.minDate && dateValue < options.minDate) {
      errors.push(`${fieldName}不能早于${options.minDate.toLocaleDateString()}`);
    }

    if (options.maxDate && dateValue > options.maxDate) {
      errors.push(`${fieldName}不能晚于${options.maxDate.toLocaleDateString()}`);
    }

    return errors.length > 0 ? this.failure(errors) : this.success();
  }

  /**
   * 自定义验证器
   */
  static custom(
    validator: () => boolean,
    errorMessage: string,
    warningMessage?: string
  ): ValidationResult {
    if (validator()) {
      return warningMessage ? this.success([warningMessage]) : this.success();
    } else {
      return this.failure([errorMessage]);
    }
  }

  /**
   * 条件验证
   */
  static conditional(
    condition: boolean,
    validator: () => ValidationResult
  ): ValidationResult {
    if (condition) {
      return validator();
    }
    return this.success();
  }

  /**
   * 创建详细错误信息
   */
  static createDetailedError(
    type: ValidationErrorType,
    field: string,
    message: string,
    value?: any,
    expected?: any
  ): ValidationError {
    return {
      type,
      field,
      message,
      value,
      expected
    };
  }
}
