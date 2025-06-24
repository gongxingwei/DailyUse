/**
 * 验证结果值对象
 */
export class ValidationResult {
  constructor(
    public readonly isValid: boolean,
    public readonly errors: string[] = []
  ) {}

  static success(): ValidationResult {
    return new ValidationResult(true, []);
  }

  static create(errors: string[]): ValidationResult {
    return new ValidationResult(errors.length === 0, errors);
  }

  static failure(error: string): ValidationResult {
    return new ValidationResult(false, [error]);
  }

  /**
   * 合并多个验证结果
   */
  static combine(...results: ValidationResult[]): ValidationResult {
    const allErrors = results.flatMap(r => r.errors);
    return ValidationResult.create(allErrors);
  }

  /**
   * 添加错误信息
   */
  addError(error: string): ValidationResult {
    return ValidationResult.create([...this.errors, error]);
  }

  /**
   * 添加多个错误
   */
  addErrors(errors: string[]): ValidationResult {
    return ValidationResult.create([...this.errors, ...errors]);
  }

  /**
   * 获取错误摘要
   */
  getErrorSummary(): string {
    return this.errors.join('; ');
  }
}

