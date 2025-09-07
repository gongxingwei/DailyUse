// 基础信息验证器
import type { ITaskTemplate } from '@common/modules/task/types/task';
import type { ITemplateValidator, ValidationResult } from './types';
import { ValidationUtils } from './ValidationUtils';
import { isValidUUID } from '@common/shared/utils/uuid';

/**
 * 基础信息验证器
 * 负责验证任务模板的基本字段：标题、描述、优先级等
 */
export class BasicInfoValidator implements ITemplateValidator {
  validate(template: ITaskTemplate): ValidationResult {
    const results: ValidationResult[] = [];

    // 验证标题
    results.push(this.validateTitle(template.title));

    // 验证描述
    results.push(this.validateDescription(template.description));

    // 验证版本号
    results.push(this.validateVersion(template.version));

    // 验证ID（更新时）
    if (template.uuid) {
      results.push(this.validateId(template.uuid));
    }

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证标题
   */
  private validateTitle(title: string): ValidationResult {
    // 必填验证
    const requiredResult = ValidationUtils.validateRequired(title, '任务标题');
    if (!requiredResult.isValid) {
      return requiredResult;
    }

    // 长度验证
    const lengthResult = ValidationUtils.validateStringLength(title, '任务标题', {
      min: 1,
      max: 100,
      required: true,
    });
    if (!lengthResult.isValid) {
      return lengthResult;
    }

    // 格式验证
    const trimmed = title.trim();
    if (trimmed !== title) {
      return ValidationUtils.failure(['任务标题不能以空格开头或结尾']);
    }

    // 特殊字符检查
    const invalidChars = /[<>\"'&]/g;
    if (invalidChars.test(title)) {
      return ValidationUtils.failure(['任务标题不能包含特殊字符: < > " \' &']);
    }

    // 警告：建议使用动词开头
    const warnings: string[] = [];
    if (!/^[a-zA-Z\u4e00-\u9fa5]/.test(trimmed)) {
      warnings.push('建议任务标题以动词开头，如"完成"、"准备"、"学习"等');
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证描述
   */
  private validateDescription(description?: string): ValidationResult {
    if (!description) {
      return ValidationUtils.success();
    }

    // 长度验证
    const lengthResult = ValidationUtils.validateStringLength(description, '任务描述', {
      max: 1000,
    });
    if (!lengthResult.isValid) {
      return lengthResult;
    }

    const warnings: string[] = [];

    // 建议：描述过短
    if (description.trim().length < 10) {
      warnings.push('建议任务描述更详细一些，以便更好地理解任务内容');
    }

    // 建议：描述过长
    if (description.trim().length > 500) {
      warnings.push('任务描述较长，建议简化或分解为多个任务');
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证版本号
   */
  private validateVersion(version: number): ValidationResult {
    return ValidationUtils.validateNumberRange(version, '版本号', {
      min: 1,
      required: true,
      integer: true,
    });
  }

  /**
   * 验证ID格式
   */
  private validateId(uuid: string): ValidationResult {
    const requiredResult = ValidationUtils.validateRequired(uuid, '任务模板ID');
    if (!requiredResult.isValid) {
      return requiredResult;
    }

    // 使用统一的 UUID 验证函数
    if (!isValidUUID(uuid)) {
      return ValidationUtils.failure(['任务模板ID格式不正确']);
    }

    return ValidationUtils.success();
  }
}
