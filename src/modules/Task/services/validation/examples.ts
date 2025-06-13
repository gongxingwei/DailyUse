// 验证系统使用示例
import type { TaskTemplate } from "../../types/task";
import { TimeUtils } from "../../utils/timeUtils";
import {
  TaskTemplateValidator,
  ValidatorFactory,
  ValidationRuleBuilder,
  ValidationReportGenerator,
  validateTaskTemplate,
  validateAndReport,
  validateWithRuleSet,
  VALIDATION_CONSTANTS,
} from "./index";

/**
 * 基础验证示例
 */
export function basicValidationExample() {
  // 模拟一个任务模板
  const template: Partial<TaskTemplate> = {
    title: "学习TypeScript",
    description: "深入学习TypeScript高级特性",
    // ... 其他字段
  };

  // 1. 简单验证
  const result = validateTaskTemplate(template as TaskTemplate);
  console.log("验证结果:", result.isValid ? "通过" : "失败");
  console.log("错误信息:", result.errors);

  // 2. 验证并生成报告
  const { result: report } = validateAndReport(
    template as TaskTemplate
  );
  console.log("详细报告:");
  console.log(report);

  // 3. 使用预定义规则集验证
  const basicResult = validateWithRuleSet(template as TaskTemplate, "basic");
  console.log("基础验证结果:", basicResult.isValid);
}

/**
 * 高级验证示例
 */
export function advancedValidationExample() {
  const template: Partial<TaskTemplate> = {
    // ... 模板数据
  };

  // 1. 带上下文的验证
  const contextResult = TaskTemplateValidator.validateWithContext(
    template as TaskTemplate,
    {
      mode: "create",
      strict: true,
      skipValidators: ["MetadataValidator"],
    }
  );

  console.log("上下文验证统计:", contextResult.stats);

  // 2. 快速验证
  const quickResult = TaskTemplateValidator.quickValidate(
    template as TaskTemplate
  );
  console.log("快速验证结果:", quickResult.isValid);

  // 3. 严格验证
  const strictResult = TaskTemplateValidator.strictValidate(
    template as TaskTemplate
  );
  console.log("严格验证结果:", strictResult.isValid);
}

/**
 * 自定义验证器示例
 */
export function customValidatorExample() {
  // 1. 使用验证规则构建器
  const customValidator = new ValidationRuleBuilder()
    .field(
      (template) => template.title,
      (title) =>
        title.includes("重要")
          ? { isValid: true, errors: [] }
          : { isValid: false, errors: ['重要任务标题必须包含"重要"关键词'] },
      "标题关键词"
    )
    .when(
      (template) => template.priority === 4,
      (template) =>
        template.timeConfig.reminder?.enabled
          ? { isValid: true, errors: [] }
          : { isValid: false, errors: ["高优先级任务必须启用提醒"] }
    )
    .custom((template) => {
      // 自定义业务规则
      if (
        template.metadata?.category === "work" &&
        template.timeConfig.type === "allDay"
      ) {
        return {
          isValid: false,
          errors: ["工作任务不建议设置为全天任务"],
        };
      }
      return { isValid: true, errors: [] };
    })
    .build();

  // 注册自定义验证器
  ValidatorFactory.registerValidator(
    "CustomBusinessValidator",
    customValidator
  );

  // 使用自定义验证器
  const template: Partial<TaskTemplate> = {
    title: "普通任务",
    priority: 4,
    // ... 其他字段
  };

  const result = customValidator.validate(template as TaskTemplate);
  console.log("自定义验证结果:", result);
}

/**
 * 验证报告示例
 */
export function validationReportExample() {
  const template: Partial<TaskTemplate> = {
    title: "", // 故意留空触发错误
    description: "A".repeat(1500), // 超长描述
    // ... 其他字段
  };

  const result = TaskTemplateValidator.validateWithContext(
    template as TaskTemplate
  );

  // 生成文本报告
  const textReport = ValidationReportGenerator.generateReport(
    template as TaskTemplate,
    result
  );
  console.log("=== 文本报告 ===");
  console.log(textReport);

  // 生成JSON报告
  const jsonReport = ValidationReportGenerator.generateJSONReport(
    template as TaskTemplate,
    result
  );
  console.log("=== JSON报告 ===");
  console.log(JSON.stringify(jsonReport, null, 2));
}

/**
 * 规则集管理示例
 */
export function ruleSetManagementExample() {
  // 1. 注册新的规则集
  ValidatorFactory.registerRuleSet({
    name: "habit-validation",
    description: "习惯养成任务专用验证",
    validators: [
      "BasicInfoValidator",
      "TimeConfigValidator",
      "RecurrenceValidator",
    ],
    config: {
      mode: "create",
      skipValidators: ["SchedulingPolicyValidator"],
    },
  });

  // 2. 查看所有规则集
  const ruleSets = ValidatorFactory.getRuleSets();
  console.log(
    "可用规则集:",
    ruleSets.map((rs) => rs.name)
  );

  // 3. 使用习惯养成验证
  const habitTemplate: Partial<TaskTemplate> = {
    title: "每日阅读30分钟",
    metadata: {
      category: "habit",
      tags: ["阅读", "习惯养成"],
      estimatedDuration: 30,
      difficulty: 2,
      location: "家中",
    },
    // ... 其他字段
  };

  const habitResult = validateWithRuleSet(
    habitTemplate as TaskTemplate,
    "habit-validation"
  );
  console.log("习惯养成验证结果:", habitResult.isValid);
}

/**
 * 验证常量使用示例
 */
export function validationConstantsExample() {
  console.log("验证常量:");
  console.log("最大标题长度:", VALIDATION_CONSTANTS.MAX_TITLE_LENGTH);
  console.log("推荐分类:", VALIDATION_CONSTANTS.RECOMMENDED_CATEGORIES);

  // 在验证中使用常量
  const isValidTitle = (title: string) => {
    return title.length <= VALIDATION_CONSTANTS.MAX_TITLE_LENGTH;
  };

  console.log('标题"学习TypeScript"是否有效:', isValidTitle("学习TypeScript"));
}

/**
 * 批量验证示例
 */
export function batchValidationExample() {
  const templates: Partial<TaskTemplate>[] = [
    { title: "任务1" /* ... */ },
    { title: "任务2" /* ... */ },
    { title: "" /* ... */ }, // 无效任务
  ];

  const results = templates.map((template) => ({
    template,
    validation: validateTaskTemplate(template as TaskTemplate),
  }));

  const validTemplates = results.filter((r) => r.validation.isValid);
  const invalidTemplates = results.filter((r) => !r.validation.isValid);

  console.log(
    `批量验证完成: ${validTemplates.length}个有效, ${invalidTemplates.length}个无效`
  );

  // 输出无效模板的错误信息
  invalidTemplates.forEach((item, index) => {
    console.log(`无效模板${index + 1}:`, item.validation.errors);
  });
}

/**
 * 条件验证示例
 */
export function conditionalValidationExample() {
  const template: Partial<TaskTemplate> = {
    timeConfig: {
      type: "timed",
      baseTime: { start: TimeUtils.now() },
      recurrence: {
        type: "daily",
        endCondition: { type: "never" },
      },
      reminder: {
        enabled: true,
        alerts: [
          {
            id: "alert-1",
            timing: {
              type: "relative",
              minutesBefore: 30,
            },
            type: "notification",
          },
        ],
        snooze: { enabled: true, interval: 10, maxCount: 3 },
      },
      timezone: "Asia/Shanghai",
    },
  };

  // 只对重复任务进行特殊验证
  const conditionalValidator = new ValidationRuleBuilder()
    .when(
      (template) => template.timeConfig.recurrence.type !== "none",
      (template) => {
        if (!template.timeConfig.reminder?.enabled) {
          return {
            isValid: false,
            errors: ["重复任务建议启用提醒功能"],
          };
        }
        return { isValid: true, errors: [] };
      }
    )
    .build();

  const result = conditionalValidator.validate(template as TaskTemplate);
  console.log("条件验证结果:", result);
}
