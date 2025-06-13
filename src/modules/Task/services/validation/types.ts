// 验证接口和类型定义
import type { TaskTemplate } from '../../types/task';

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 是否验证通过 */
  isValid: boolean;
  /** 错误信息列表 */
  errors: string[];
  /** 警告信息列表 */
  warnings?: string[];
}

/**
 * 模板验证器接口
 */
export interface ITemplateValidator {
  /**
   * 验证任务模板
   * @param template 任务模板
   * @returns 验证结果
   */
  validate(template: TaskTemplate): ValidationResult;
}

/**
 * 验证器优先级
 */
export enum ValidatorPriority {
  /** 高优先级 - 基础验证 */
  HIGH = 1,
  /** 中优先级 - 业务逻辑验证 */
  MEDIUM = 2,
  /** 低优先级 - 优化建议 */
  LOW = 3
}

/**
 * 验证器配置
 */
export interface ValidatorConfig {
  /** 验证器名称 */
  name: string;
  /** 优先级 */
  priority: ValidatorPriority;
  /** 是否启用 */
  enabled: boolean;
  /** 验证器描述 */
  description?: string;
}

/**
 * 验证上下文
 */
export interface ValidationContext {
  /** 验证模式 */
  mode: 'create' | 'update';
  /** 严格模式 */
  strict?: boolean;
  /** 跳过的验证器 */
  skipValidators?: string[];
  /** 额外的验证参数 */
  extraParams?: Record<string, any>;
}

/**
 * 验证错误类型
 */
export enum ValidationErrorType {
  /** 必填字段缺失 */
  REQUIRED = 'required',
  /** 格式错误 */
  FORMAT = 'format',
  /** 数值超出范围 */
  RANGE = 'range',
  /** 逻辑冲突 */
  CONFLICT = 'conflict',
  /** 业务规则违反 */
  BUSINESS = 'business'
}

/**
 * 详细验证错误
 */
export interface ValidationError {
  /** 错误类型 */
  type: ValidationErrorType;
  /** 字段路径 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 当前值 */
  value?: any;
  /** 期望值或规则 */
  expected?: any;
}

/**
 * 增强的验证结果
 */
export interface EnhancedValidationResult extends ValidationResult {
  /** 详细错误列表 */
  detailedErrors?: ValidationError[];
  /** 验证统计 */
  stats?: {
    totalValidators: number;
    passedValidators: number;
    failedValidators: number;
    executionTime: number;
  };
}
