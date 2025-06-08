 // src/modules/Task/utils/taskTemplateFactory.ts
import { TimeUtils } from './timeUtils';
import type { TaskTemplate, CreateTaskTemplateOptions } from '../types/task';
import { v4 as uuidv4 } from 'uuid';

export class TaskTemplateFactory {
  /**
   * 创建新的空白任务模板
   */
  static createEmpty(options: CreateTaskTemplateOptions = {}): TaskTemplate {
    const now = TimeUtils.now();
    const today = TimeUtils.createDateTime(
      now.date.year,
      now.date.month,
      now.date.day,
      {
        hour: 0,
        minute: 0
      }
    );

    return {
      id: uuidv4(),
      title: options.title || '',
      description: options.description || '',

      timeConfig: {
        type: 'timed', // 默认指定时间
        baseTime: {
          start: today,
          end: TimeUtils.addMinutes(today, 60) // 默认1小时
        },
        recurrence: {
          type: 'none', // 默认不重复
          interval: 1,
          endCondition: {
            type: 'never'
          }
        },
        reminder: {
          enabled: false,
          alerts: [],
          snooze: {
            enabled: false,
            interval: 5, // 默认5分钟
            maxCount: 1 // 默认最多1次
          }
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },

      schedulingPolicy: {
        allowReschedule: true,
        maxDelayDays: 3,
        skipWeekends: false,
        skipHolidays: false,
        workingHoursOnly: false
      },

      metadata: {
        category: options.category || 'general',
        tags: [],
        estimatedDuration: 60, // 默认60分钟
        difficulty: options.priority || 2,
        location: ''
      },

      lifecycle: {
        status: 'draft',
        createdAt: now,
        updatedAt: now
      },

      analytics: {
        totalInstances: 0,
        completedInstances: 0,
        successRate: 0
      },

      keyResultLinks: options.keyResultLinks || [],
      priority: options.priority || 2,
      createdAt: now,
      updatedAt: now,
      version: 1
    };
  }

  /**
   * 从现有模板创建副本
   */
  static createFromTemplate(template: TaskTemplate): TaskTemplate {
    const now = TimeUtils.now();
    
    return {
      ...template,
      id: uuidv4(),
      title: `${template.title} - 副本`,
      lifecycle: {
        ...template.lifecycle,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        activatedAt: undefined,
        pausedAt: undefined
      },
      analytics: {
        totalInstances: 0,
        completedInstances: 0,
        averageCompletionTime: undefined,
        successRate: 0,
        lastInstanceDate: undefined
      },
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 根据模板类型创建预配置的任务模板
   */
  static createByType(templateType: string, options: CreateTaskTemplateOptions = {}): TaskTemplate {
    switch (templateType) {
      case 'empty':
        return this.createEmpty(options);
      case 'habit':
        return this.createHabitTemplate(options);
      default:
        return this.createEmpty(options);
    }
  }

  /**
   * 习惯养成模板
   */
  static createHabitTemplate(options: CreateTaskTemplateOptions = {}): TaskTemplate {
    const template = this.createEmpty(options);
    
    return {
      ...template,
      title: options.title || '新习惯',
      timeConfig: {
        ...template.timeConfig,
        type: 'timed',
        recurrence: {
          type: 'daily',
          interval: 1,
          endCondition: {
            type: 'count',
            count: 21 // 21天习惯养成
          }
        },
        reminder: {
          enabled: true,
          alerts: [{
            id: uuidv4(),
            timing: {
              type: 'relative',
              minutesBefore: 15
            },
            type: 'notification',
            message: '是时候培养好习惯了！'
          }],
          snooze: {
            enabled: true,
            interval: 5,
            maxCount: 3
          }
        }
      },
      metadata: {
        ...template.metadata,
        category: 'habit',
        tags: ['习惯', '自我提升'],
        estimatedDuration: 30
      }
    };
  }
  

  /**
   * 验证模板数据
   */
  static validate(template: TaskTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.title.trim()) {
      errors.push('任务标题不能为空');
    }

    if (template.timeConfig.type === 'timed' || template.timeConfig.type === 'timeRange') {
      if (!template.timeConfig.baseTime.start) {
        errors.push('必须设置开始时间');
      }
      
      if (template.timeConfig.type === 'timeRange' && !template.timeConfig.baseTime.end) {
        errors.push('时间段模式下必须设置结束时间');
      }

      if (template.timeConfig.baseTime.start && template.timeConfig.baseTime.end) {
        if (template.timeConfig.baseTime.end.timestamp <= template.timeConfig.baseTime.start.timestamp) {
          errors.push('结束时间必须晚于开始时间');
        }
      }
    }

    if (template.timeConfig.recurrence.type !== 'none') {
      if (template.timeConfig.recurrence.endCondition.type === 'date' && 
          !template.timeConfig.recurrence.endCondition.endDate) {
        errors.push('重复任务必须设置结束日期');
      }

      if (template.timeConfig.recurrence.endCondition.type === 'count' && 
          (!template.timeConfig.recurrence.endCondition.count || 
           template.timeConfig.recurrence.endCondition.count <= 0)) {
        errors.push('重复次数必须大于0');
      }
    }

    // 验证关键结果链接
    if (template.keyResultLinks) {
      template.keyResultLinks.forEach((link, index) => {
        if (!link.goalId) {
          errors.push(`第${index + 1}个关联缺少目标ID`);
        }
        if (!link.keyResultId) {
          errors.push(`第${index + 1}个关联缺少关键结果ID`);
        }
        if (link.incrementValue <= 0) {
          errors.push(`第${index + 1}个关联的增加值必须大于0`);
        }
      });
    }


    
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}