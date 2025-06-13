// 验证模块的统一导出文件
export * from './types';
export * from './ValidationUtils';
export * from './TaskTemplateValidator';
export * from './ValidatorFactory';

// 导出所有验证器
export { BasicInfoValidator } from './validators/BasicInfoValidator';
export { TimeConfigValidator } from './validators/TimeConfigValidator';
export { RecurrenceValidator } from './validators/RecurrenceValidator';
export { ReminderValidator } from './validators/ReminderValidator';
export { SchedulingPolicyValidator } from './validators/SchedulingPolicyValidator';
export { MetadataValidator } from './validators/MetadataValidator';

// 便捷的验证函数
import { TaskTemplateValidator } from './TaskTemplateValidator';
import { ValidatorFactory, ValidationReportGenerator } from './ValidatorFactory';
import type { TaskTemplate } from '../../types/task';

/**
 * 快速验证任务模板
 */
export const validateTaskTemplate = (template: TaskTemplate) => {
  return TaskTemplateValidator.validate(template);
};

/**
 * 快速验证并生成报告
 */
export const validateAndReport = (template: TaskTemplate) => {
  const result = TaskTemplateValidator.validateWithContext(template);
  const report = ValidationReportGenerator.generateReport(template, result);
  
  return {
    result,
    report
  };
};

/**
 * 使用预定义规则集验证
 */
export const validateWithRuleSet = (template: TaskTemplate, ruleSetName: string) => {
  return ValidatorFactory.validateWithRuleSet(template, ruleSetName);
};

/**
 * 验证常量
 */
export const VALIDATION_CONSTANTS = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_TAGS_COUNT: 20,
  MAX_TAG_LENGTH: 20,
  MAX_LOCATION_LENGTH: 100,
  MAX_DELAY_DAYS: 365,
  MAX_ESTIMATED_DURATION: 8 * 60, // 8小时
  MAX_REMINDER_COUNT: 10,
  MAX_REMINDER_ADVANCE_MINUTES: 10080, // 7天
  RECOMMENDED_CATEGORIES: [
    'work', 'personal', 'health', 'learning', 'family',
    'finance', 'hobby', 'travel', 'habit', 'project',
    'meeting', 'exercise', 'reading', 'shopping', 'maintenance'
  ]
} as const;
