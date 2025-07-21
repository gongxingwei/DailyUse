// 验证系统测试文件
import type { ITaskTemplate } from '@/modules/Task/domain/types/task';
import type { DateTime } from '@/shared/types/myDateTime';
import { TimeUtils } from '@/shared/utils/myDateTimeUtils';
import {
  TaskTemplateValidator,
  BasicInfoValidator,
  TimeConfigValidator,
  RecurrenceValidator,
  ReminderValidator,
  MetadataValidator,
  ValidationUtils
} from './index';

/**
 * 创建测试用的DateTime对象
 */
function createTestDateTime(year: number, month: number, day: number, timePoint?: {hour: number, minute: number}): DateTime {
  return TimeUtils.createDateTime(year, month, day, timePoint);
}

/**
 * 创建有效的测试模板
 */
function createValidTemplate(): ITaskTemplate {
  return {
    uuid: '550e8400-e29b-41d4-a716-446655440000',
    title: '学习TypeScript',
    description: '深入学习TypeScript高级特性',
    timeConfig: {
      type: 'timed',      baseTime: {
        start: createTestDateTime(2025, 6, 15, {hour: 9, minute: 0}),
        end: createTestDateTime(2025, 6, 15, {hour: 10, minute: 0}),
        duration: 60
      },
      recurrence: {
        type: 'daily',
        interval: 1,
        endCondition: {
          type: 'count',
          count: 30
        }
      },
      timezone: 'Asia/Shanghai'
    },
    schedulingPolicy: {
      allowReschedule: true,
      maxDelayDays: 3,
      skipWeekends: false,
      skipHolidays: false,
      workingHoursOnly: false
    },
    reminderConfig: {
        enabled: true,
        alerts: [{
          uuid: 'alert-1',
          timing: {
            type: 'relative',
            minutesBefore: 15
          },
          type: 'notification',
          message: '准备开始学习'
        }],
        snooze: {
          enabled: true,
          interval: 5,
          maxCount: 3
        }
      },
    metadata: {
      category: 'learning',
      tags: ['编程', '技能提升'],
      estimatedDuration: 60,
      priority: 3,
      difficulty: 3,
      location: '书房'
    },    lifecycle: {
      status: 'draft',
      createdAt: createTestDateTime(2025, 6, 12),
      updatedAt: createTestDateTime(2025, 6, 12)
    },
    analytics: {
      totalInstances: 0,
      completedInstances: 0,
      successRate: 0
    },
    keyResultLinks: [],
    version: 1
  };
}

/**
 * 测试基础信息验证器
 */
export function testBasicInfoValidator() {
  console.log('=== 测试基础信息验证器 ===');
  
  const validator = new BasicInfoValidator();
  const template = createValidTemplate();
  
  // 测试有效模板
  let result = validator.validate(template);
  console.log('有效模板测试:', result.isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试空标题
  const emptyTitleTemplate = { ...template, title: '' };
  result = validator.validate(emptyTitleTemplate);
  console.log('空标题测试:', !result.isValid ? '✅ 通过' : '❌ 失败');
  console.log('错误信息:', result.errors);
  
  // 测试过长标题
  const longTitleTemplate = { ...template, title: 'A'.repeat(150) };
  result = validator.validate(longTitleTemplate);
  console.log('过长标题测试:', !result.isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试无效优先级
  const invalidPriorityTemplate = { ...template, priority: 5 as any };
  result = validator.validate(invalidPriorityTemplate);
  console.log('无效优先级测试:', !result.isValid ? '✅ 通过' : '❌ 失败');
}

/**
 * 测试时间配置验证器
 */
export function testTimeConfigValidator() {
  console.log('\n=== 测试时间配置验证器 ===');
  
  const validator = new TimeConfigValidator();
  const template = createValidTemplate();
  
  // 测试有效配置
  let result = validator.validate(template);
  console.log('有效时间配置测试:', result.isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试无效时间类型
  const invalidTypeTemplate = {
    ...template,
    timeConfig: {
      ...template.timeConfig,
      type: 'invalid' as any
    }
  };
  result = validator.validate(invalidTypeTemplate);
  console.log('无效时间类型测试:', !result.isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试时间段缺少结束时间
  const missingEndTimeTemplate = {
    ...template,
    timeConfig: {
      ...template.timeConfig,
      type: 'timeRange' as const,
      baseTime: {
        ...template.timeConfig.baseTime,
        end: undefined
      }
    }
  };
  result = validator.validate(missingEndTimeTemplate);
  console.log('时间段缺少结束时间测试:', !result.isValid ? '✅ 通过' : '❌ 失败');
}

/**
 * 测试重复规则验证器
 */
export function testRecurrenceValidator() {
  console.log('\n=== 测试重复规则验证器 ===');
  
  const validator = new RecurrenceValidator();
  const template = createValidTemplate();
  
  // 测试有效重复规则
  let result = validator.validate(template);
  console.log('有效重复规则测试:', result.isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试无效重复类型
  const invalidRecurrenceTemplate = {
    ...template,
    timeConfig: {
      ...template.timeConfig,
      recurrence: {
        ...template.timeConfig.recurrence,
        type: 'invalid' as any
      }
    }
  };
  result = validator.validate(invalidRecurrenceTemplate);
  console.log('无效重复类型测试:', !result.isValid ? '✅ 通过' : '❌ 失败');
    // 测试无效结束条件
  const invalidEndConditionTemplate = {
    ...template,
    timeConfig: {
      ...template.timeConfig,
      recurrence: {
        ...template.timeConfig.recurrence,
        endCondition: {
          type: 'count' as const,
          count: 0 // 无效的计数
        }
      }
    }
  };
  result = validator.validate(invalidEndConditionTemplate);
  console.log('无效结束条件测试:', !result.isValid ? '✅ 通过' : '❌ 失败');
}

/**
 * 测试提醒验证器
 */
export function testReminderValidator() {
  console.log('\n=== 测试提醒验证器 ===');
  
  const validator = new ReminderValidator();
  const template = createValidTemplate();
  
  // 测试有效提醒配置
  let result = validator.validate(template);
  console.log('有效提醒配置测试:', result.isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试启用提醒但无提醒项
  const noAlertsTemplate = {
    ...template,
    
    reminder: {
      ...template.reminderConfig,
        enabled: true,
        alerts: []
      }
  };
  result = validator.validate(noAlertsTemplate);
  console.log('启用提醒但无提醒项测试:', !result.isValid ? '✅ 通过' : '❌ 失败');
    // 测试无效提醒时间
  const invalidTimingTemplate = {
    ...template,
    reminder: {
        ...template.reminderConfig,
        alerts: [{
          uuid: 'alert-1',
          timing: {
            type: 'relative' as const,
            minutesBefore: -5 // 负数无效
          },
          type: 'notification' as const
        }]
      }
  };
  result = validator.validate(invalidTimingTemplate);
  console.log('无效提醒时间测试:', !result.isValid ? '✅ 通过' : '❌ 失败');
}

/**
 * 测试元数据验证器
 */
export function testMetadataValidator() {
  console.log('\n=== 测试元数据验证器 ===');
  
  const validator = new MetadataValidator();
  const template = createValidTemplate();
  
  // 测试有效元数据
  let result = validator.validate(template);
  console.log('有效元数据测试:', result.isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试空分类
  const emptyCategoryTemplate = {
    ...template,
    metadata: {
      ...template.metadata,
      category: ''
    }
  };
  result = validator.validate(emptyCategoryTemplate);
  console.log('空分类测试:', !result.isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试无效难度
  const invalidDifficultyTemplate = {
    ...template,
    metadata: {
      ...template.metadata,
      difficulty: 6 as any
    }
  };
  result = validator.validate(invalidDifficultyTemplate);
  console.log('无效难度测试:', !result.isValid ? '✅ 通过' : '❌ 失败');
}

/**
 * 测试完整验证流程
 */
export function testFullValidation() {
  console.log('\n=== 测试完整验证流程 ===');
  
  const template = createValidTemplate();
  
  // 测试主验证器
  const result = TaskTemplateValidator.validate(template);
  console.log('完整验证测试:', result.isValid ? '✅ 通过' : '❌ 失败');
  
  if (!result.isValid) {
    console.log('错误信息:', result.errors);
  }
  
  if (result.warnings && result.warnings.length > 0) {
    console.log('警告信息:', result.warnings);
  }
  
  // 测试带上下文的验证
  const contextResult = TaskTemplateValidator.validateWithContext(template, {
    mode: 'create',
    strict: false
  });
  
  console.log('带上下文验证测试:', contextResult.isValid ? '✅ 通过' : '❌ 失败');
  console.log('验证统计:', contextResult.stats);
}

/**
 * 测试ValidationUtils工具类
 */
export function testValidationUtils() {
  console.log('\n=== 测试ValidationUtils工具类 ===');
  
  // 测试字符串长度验证
  let result = ValidationUtils.validateStringLength('测试', '字段', { min: 1, max: 10 });
  console.log('字符串长度验证测试:', result.isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试数值范围验证
  result = ValidationUtils.validateNumberRange(5, '数值', { min: 1, max: 10 });
  console.log('数值范围验证测试:', result.isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试枚举验证
  result = ValidationUtils.validateEnum('active', '状态', ['active', 'inactive']);
  console.log('枚举验证测试:', result.isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试结果合并
  const result1 = ValidationUtils.success(['警告1']);
  const result2 = ValidationUtils.failure(['错误1']);
  const merged = ValidationUtils.mergeResults(result1, result2);
  console.log('结果合并测试:', !merged.isValid && merged.warnings!.length > 0 ? '✅ 通过' : '❌ 失败');
}

/**
 * 运行所有测试
 */
export function runAllTests() {
  console.log('🧪 开始运行验证系统测试\n');
  
  try {
    testBasicInfoValidator();
    testTimeConfigValidator();
    testRecurrenceValidator();
    testReminderValidator();
    testMetadataValidator();
    testFullValidation();
    testValidationUtils();
    
    console.log('\n🎉 所有测试完成');
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  }
}

// 如果直接运行此文件，执行所有测试
if (typeof window === 'undefined') {
  // Node.js环境
  runAllTests();
}
