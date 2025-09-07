// 任务模板验证器主文件
import type { ITaskTemplate } from '@common/modules/task/types/task';
import type { ITemplateValidator, ValidationResult, ValidationContext, EnhancedValidationResult } from './types';
import { ValidationUtils } from './ValidationUtils';
import { BasicInfoValidator } from './BasicInfoValidator';
import { TimeConfigValidator } from './TimeConfigValidator';
import { RecurrenceValidator } from './RecurrenceValidator';
import { ReminderValidator } from './ReminderValidator';
import { SchedulingPolicyValidator } from './SchedulingPolicyValidator';
import { MetadataValidator } from './MetadataValidator';

/**
 * 任务模板验证器
 * 协调各个子验证器，提供完整的验证功能
 */
export class TaskTemplateValidator {
  private static validators: ITemplateValidator[] = [
    new BasicInfoValidator(),
    new TimeConfigValidator(),
    new RecurrenceValidator(),
    new ReminderValidator(),
    new SchedulingPolicyValidator(),
    new MetadataValidator()
  ];

  /**
   * 验证任务模板（简单版本）
   */
  static validate(template: ITaskTemplate): ValidationResult {
    return this.validateWithContext(template);
  }

  /**
   * 带上下文的验证（增强版本）
   */
  static validateWithContext(
    template: ITaskTemplate,
    context: ValidationContext = { mode: 'create' }
  ): EnhancedValidationResult {
    const startTime = Date.now();
    const results: ValidationResult[] = [];
    let passedValidators = 0;
    let failedValidators = 0;

    // 预验证：检查模板是否存在
    if (!template) {
      return {
        isValid: false,
        errors: ['任务模板不能为空'],
        warnings: [],
        stats: {
          totalValidators: 0,
          passedValidators: 0,
          failedValidators: 1,
          executionTime: Date.now() - startTime
        }
      };
    }

    // 执行各个验证器
    for (const validator of this.validators) {
      const validatorName = validator.constructor.name;
      
      // 检查是否跳过此验证器
      if (context.skipValidators?.includes(validatorName)) {
        continue;
      }

      try {
        const result = validator.validate(template);
        results.push(result);
        
        if (result.isValid) {
          passedValidators++;
        } else {
          failedValidators++;
          
          // 在严格模式下，遇到错误立即停止
          if (context.strict) {
            break;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '验证器执行异常';
        results.push(ValidationUtils.failure([`${validatorName}: ${errorMessage}`]));
        failedValidators++;
      }
    }

    // 合并所有验证结果
    const mergedResult = ValidationUtils.mergeResults(...results);
    const executionTime = Date.now() - startTime;

    return {
      ...mergedResult,
      stats: {
        totalValidators: this.validators.length,
        passedValidators,
        failedValidators,
        executionTime
      }
    };
  }

  /**
   * 快速验证（只检查关键字段）
   */
  static quickValidate(template: ITaskTemplate): ValidationResult {
    const context: ValidationContext = {
      mode: 'create',
      skipValidators: ['MetadataValidator', 'SchedulingPolicyValidator']
    };

    const result = this.validateWithContext(template, context);
    return {
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings
    };
  }

  /**
   * 验证用于创建的模板
   */
  static validateForCreate(template: ITaskTemplate): ValidationResult {
    const context: ValidationContext = {
      mode: 'create',
      strict: false
    };

    return this.validateWithContext(template, context);
  }

  /**
   * 验证用于更新的模板
   */
  static validateForUpdate(template: ITaskTemplate): ValidationResult {
    const context: ValidationContext = {
      mode: 'update',
      strict: false
    };

    return this.validateWithContext(template, context);
  }

  /**
   * 严格验证（所有验证器都必须通过）
   */
  static strictValidate(template: ITaskTemplate): ValidationResult {
    const context: ValidationContext = {
      mode: 'create',
      strict: true
    };

    return this.validateWithContext(template, context);
  }

  /**
   * 获取验证器信息
   */
  static getValidatorInfo() {
    return this.validators.map(validator => ({
      name: validator.constructor.name,
      description: this.getValidatorDescription(validator.constructor.name)
    }));
  }

  /**
   * 获取验证器描述
   */
  private static getValidatorDescription(name: string): string {
    const descriptions: Record<string, string> = {
      'BasicInfoValidator': '验证基础信息：标题、描述、优先级等',
      'TimeConfigValidator': '验证时间配置：时间类型、基础时间、时区等',
      'RecurrenceValidator': '验证重复规则：重复类型、间隔、结束条件等',
      'ReminderValidator': '验证提醒配置：提醒列表、稍后提醒等',
      'SchedulingPolicyValidator': '验证调度策略：重新调度、延迟、时间限制等',
      'MetadataValidator': '验证元数据：分类、标签、难度、地点等'
    };

    return descriptions[name] || '未知验证器';
  }

  /**
   * 添加自定义验证器
   */
  static addValidator(validator: ITemplateValidator): void {
    this.validators.push(validator);
  }

  /**
   * 移除验证器
   */
  static removeValidator(validatorName: string): boolean {
    const index = this.validators.findIndex(v => v.constructor.name === validatorName);
    if (index !== -1) {
      this.validators.splice(index, 1);
      return true;
    }
    return false;
  }
}
