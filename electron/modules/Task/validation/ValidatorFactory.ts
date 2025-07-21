// 验证器工厂和高级验证功能
import type { ITaskTemplate } from "@/modules/Task/domain/types/task";
import type {
  ITemplateValidator,
  ValidationResult,
  ValidationContext,
  EnhancedValidationResult,
  ValidatorConfig,
} from "./types";
import { ValidationUtils } from "./ValidationUtils";
import { TaskTemplateValidator } from "./TaskTemplateValidator";

/**
 * 验证规则集合
 */
export interface ValidationRuleSet {
  name: string;
  description: string;
  validators: string[];
  config: ValidationContext;
}

/**
 * 验证器工厂
 * 提供创建和管理验证器的高级功能
 */
export class ValidatorFactory {
  private static customValidators: Map<string, ITemplateValidator> = new Map();
  private static validationRuleSets: Map<string, ValidationRuleSet> = new Map();

  /**
   * 注册自定义验证器
   */
  static registerValidator(
    name: string,
    validator: ITemplateValidator,
    config?: ValidatorConfig
  ): void {
    this.customValidators.set(name, validator);

    if (config) {
      // 可以在这里保存验证器配置信息
      console.log(`验证器 ${name} 已注册:`, config);
    }
  }

  /**
   * 获取验证器
   */
  static getValidator(name: string): ITemplateValidator | undefined {
    return this.customValidators.get(name);
  }

  /**
   * 创建组合验证器
   */
  static createCompositeValidator(
    validators: ITemplateValidator[]
  ): ITemplateValidator {
    return {
      validate(template: ITaskTemplate): ValidationResult {
        const results = validators.map((v) => v.validate(template));
        return ValidationUtils.mergeResults(...results);
      },
    };
  }

  /**
   * 注册验证规则集
   */
  static registerRuleSet(ruleSet: ValidationRuleSet): void {
    this.validationRuleSets.set(ruleSet.name, ruleSet);
  }

  /**
   * 使用规则集验证
   */
  static validateWithRuleSet(
    template: ITaskTemplate,
    ruleSetName: string
  ): ValidationResult {
    const ruleSet = this.validationRuleSets.get(ruleSetName);
    if (!ruleSet) {
      return ValidationUtils.failure([`验证规则集 ${ruleSetName} 不存在`]);
    }

    return TaskTemplateValidator.validateWithContext(template, ruleSet.config);
  }

  /**
   * 获取所有已注册的验证器
   */
  static getRegisteredValidators(): string[] {
    return Array.from(this.customValidators.keys());
  }

  /**
   * 获取所有规则集
   */
  static getRuleSets(): ValidationRuleSet[] {
    return Array.from(this.validationRuleSets.values());
  }
}

/**
 * 条件验证器
 * 根据条件决定是否执行验证
 */
export class ConditionalValidator implements ITemplateValidator {
  constructor(
    private condition: (template: ITaskTemplate) => boolean,
    private validator: ITemplateValidator
  ) {}

  validate(template: ITaskTemplate): ValidationResult {
    if (this.condition(template)) {
      return this.validator.validate(template);
    }
    return ValidationUtils.success();
  }
}

/**
 * 自定义验证规则构建器
 */
export class ValidationRuleBuilder {
  private rules: Array<(template: ITaskTemplate) => ValidationResult> = [];

  /**
   * 添加字段验证规则
   */
  field<T>(
    fieldGetter: (template: ITaskTemplate) => T,
    validator: (value: T) => ValidationResult,
    fieldName: string
  ): ValidationRuleBuilder {
    this.rules.push((template) => {
      try {
        const value = fieldGetter(template);
        return validator(value);
      } catch (error) {
        return ValidationUtils.failure([
          `验证 ${fieldName} 时发生错误: ${error}`,
        ]);
      }
    });
    return this;
  }

  /**
   * 添加自定义规则
   */
  custom(
    rule: (template: ITaskTemplate) => ValidationResult
  ): ValidationRuleBuilder {
    this.rules.push(rule);
    return this;
  }

  /**
   * 添加条件规则
   */
  when(
    condition: (template: ITaskTemplate) => boolean,
    rule: (template: ITaskTemplate) => ValidationResult
  ): ValidationRuleBuilder {
    this.rules.push((template) => {
      if (condition(template)) {
        return rule(template);
      }
      return ValidationUtils.success();
    });
    return this;
  }

  /**
   * 构建验证器
   */
  build(): ITemplateValidator {
    const rules = [...this.rules];
    return {
      validate: (template: ITaskTemplate) => {
        const results = rules.map((rule) => rule(template));
        return ValidationUtils.mergeResults(...results);
      },
    };
  }
}

/**
 * 验证报告生成器
 */
export class ValidationReportGenerator {
  /**
   * 生成详细的验证报告
   */
  static generateReport(
    template: ITaskTemplate,
    result: EnhancedValidationResult
  ): string {
    const lines: string[] = [];

    lines.push("=== 任务模板验证报告 ===");
    lines.push(`任务标题: ${template.title || "未设置"}`);
    lines.push(`验证状态: ${result.isValid ? "✅ 通过" : "❌ 失败"}`);
    lines.push("");

    // 验证统计
    if (result.stats) {
      lines.push("--- 验证统计 ---");
      lines.push(`总验证器数量: ${result.stats.totalValidators}`);
      lines.push(`通过验证器: ${result.stats.passedValidators}`);
      lines.push(`失败验证器: ${result.stats.failedValidators}`);
      lines.push(`执行时间: ${result.stats.executionTime}ms`);
      lines.push("");
    }

    // 错误信息
    if (result.errors.length > 0) {
      lines.push("--- 错误信息 ---");
      result.errors.forEach((error, index) => {
        lines.push(`${index + 1}. ❌ ${error}`);
      });
      lines.push("");
    }

    // 警告信息
    if (result.warnings && result.warnings.length > 0) {
      lines.push("--- 警告信息 ---");
      result.warnings.forEach((warning, index) => {
        lines.push(`${index + 1}. ⚠️  ${warning}`);
      });
      lines.push("");
    }

    // 建议
    const suggestions = this.generateSuggestions(template, result);
    if (suggestions.length > 0) {
      lines.push("--- 优化建议 ---");
      suggestions.forEach((suggestion, index) => {
        lines.push(`${index + 1}. 💡 ${suggestion}`);
      });
      lines.push("");
    }

    lines.push("=== 报告结束 ===");

    return lines.join("\n");
  }

  /**
   * 生成优化建议
   */ 
  private static generateSuggestions(
    template: ITaskTemplate,
    result: ValidationResult
  ): string[] {
    const suggestions: string[] = [];

    // 基于验证错误给出具体建议
    if (result.errors?.some((error) => error.includes("标题"))) {
      suggestions.push("请提供一个简洁明确的任务标题，长度在1-100个字符之间");
    }

    if (result.errors?.some((error) => error.includes("时间"))) {
      suggestions.push("请检查时间配置，确保开始时间早于结束时间");
    }

    if (result.errors?.some((error) => error.includes("重复"))) {
      suggestions.push("请检查重复规则配置，确保间隔和结束条件设置正确");
    }

    // 根据任务类型给出建议
    if (template.timeConfig?.type === "allDay" && !template.description) {
      suggestions.push("全天任务建议添加详细描述，说明具体要完成的内容");
    }

    // 根据重复类型给出建议
    if (
      template.timeConfig?.recurrence?.type === "daily" &&
      !template.reminderConfig?.enabled
    ) {
      suggestions.push("每日重复任务建议启用提醒功能，帮助养成习惯");
    }

    // 根据优先级给出建议
    if (
      template.metadata.priority === 5 &&
      template.timeConfig?.recurrence?.type !== "none"
    ) {
      suggestions.push("高优先级的重复任务可能需要重新评估重要性和紧急性");
    } // 基于警告提供改进建议
    if (result.warnings && result.warnings.length > 0) {
      suggestions.push("建议关注验证警告，这些可能影响任务的执行效果");
    }

    return suggestions;
  }

  /**
   * 生成JSON格式的报告
   */
  static generateJSONReport(
    template: ITaskTemplate,
    result: EnhancedValidationResult
  ): object {
    return {
      template: {
        uuid: template.uuid,
        title: template.title,
        type: template.timeConfig?.type,
        category: template.metadata?.category,
      },
      validation: {
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings || [],
        stats: result.stats,
      },
      suggestions: this.generateSuggestions(template, result),
      timestamp: new Date().toISOString(),
    };
  }
}

// 预定义的验证规则集
ValidatorFactory.registerRuleSet({
  name: "basic",
  description: "基础验证 - 只验证必要字段",
  validators: ["BasicInfoValidator", "TimeConfigValidator"],
  config: {
    mode: "create",
    skipValidators: ["MetadataValidator", "SchedulingPolicyValidator"],
  },
});

ValidatorFactory.registerRuleSet({
  name: "complete",
  description: "完整验证 - 验证所有字段",
  validators: [],
  config: {
    mode: "create",
    strict: false,
  },
});

ValidatorFactory.registerRuleSet({
  name: "strict",
  description: "严格验证 - 遇到错误立即停止",
  validators: [],
  config: {
    mode: "create",
    strict: true,
  },
});

ValidatorFactory.registerRuleSet({
  name: "update",
  description: "更新验证 - 用于更新现有模板",
  validators: [],
  config: {
    mode: "update",
    strict: false,
  },
});
