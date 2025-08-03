import { ValidationResult } from './validationResult';
/**
 * 验证器接口
 */
export interface IValidator<T> {
  validate(entity: T): ValidationResult;
  validateAsync?(entity: T): Promise<ValidationResult>;
}

/**
 * 验证器基类
 */
export abstract class BaseValidator<T> implements IValidator<T> {
  abstract validate(entity: T): ValidationResult;

  /**
   * 验证必填字段
   */
  protected validateRequired(value: any, fieldName: string): string[] {
    const errors: string[] = [];
    
    if (value === null || value === undefined) {
      errors.push(`${fieldName}不能为空`);
    } else if (typeof value === 'string' && !value.trim()) {
      errors.push(`${fieldName}不能为空字符串`);
    }
    
    return errors;
  }

  /**
   * 验证字符串长度
   */
  protected validateStringLength(
    value: string, 
    fieldName: string, 
    minLength: number = 0, 
    maxLength: number = Number.MAX_SAFE_INTEGER
  ): string[] {
    const errors: string[] = [];
    
    if (value && value.length < minLength) {
      errors.push(`${fieldName}长度不能少于${minLength}个字符`);
    }
    
    if (value && value.length > maxLength) {
      errors.push(`${fieldName}长度不能超过${maxLength}个字符`);
    }
    
    return errors;
  }

  /**
   * 验证数值范围
   */
  protected validateNumberRange(
    value: number, 
    fieldName: string, 
    min: number = Number.MIN_SAFE_INTEGER, 
    max: number = Number.MAX_SAFE_INTEGER
  ): string[] {
    const errors: string[] = [];
    
    if (value < min) {
      errors.push(`${fieldName}不能小于${min}`);
    }
    
    if (value > max) {
      errors.push(`${fieldName}不能大于${max}`);
    }
    
    return errors;
  }
}
