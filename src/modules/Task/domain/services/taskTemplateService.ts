import { TaskTemplate } from '../entities/taskTemplate';
import { TaskMetaTemplate } from '../entities/taskMetaTemplate';
import { taskInstanceService } from './taskInstanceService';
import type { TaskTimeConfig, TaskReminderConfig, CreateTaskTemplateOptions } from '../types/task';
import { v4 as uuidv4 } from 'uuid';
import { TimeUtils } from '@/shared/utils/myDateTimeUtils';

/**
 * 任务模板领域服务 - 处理TaskTemplate实体的业务逻辑
 */
export class TaskTemplateService {
  
  /**
   * 从元模板创建任务模板
   */
  createFromMetaTemplate(
    metaTemplate: TaskMetaTemplate,
    customOptions: {
      title: string;
      timeConfig?: Partial<TaskTimeConfig>;
      reminderConfig?: Partial<TaskReminderConfig>;
    } & Partial<CreateTaskTemplateOptions>
  ): TaskTemplate {
    const now = TimeUtils.now();
    
    // 合并默认配置和自定义配置
    const mergedTimeConfig = {
      ...metaTemplate.defaultTimeConfig,
      ...customOptions.timeConfig,
      // 确保必需字段
      timezone: customOptions.timeConfig?.timezone || 
                metaTemplate.defaultTimeConfig.timezone || 
                Intl.DateTimeFormat().resolvedOptions().timeZone
    } as TaskTimeConfig;

    const mergedReminderConfig = {
      ...metaTemplate.defaultReminderConfig,
      ...customOptions.reminderConfig
    } as TaskReminderConfig;

    const mergedOptions = {
      ...metaTemplate.defaultMetadata,
      ...customOptions,
      category: customOptions.category || metaTemplate.category
    };

    // 创建新的 TaskTemplate
    const template = new TaskTemplate(
      uuidv4(),
      customOptions.title,
      mergedTimeConfig,
      mergedReminderConfig,
      mergedOptions
    );

    return template;
  }

  /**
   * 验证模板状态转换
   */
  canChangeStatus(template: TaskTemplate, newStatus: string): boolean {
    const currentStatus = template.lifecycle.status;
    
    const allowedTransitions: Record<'draft' | 'active' | 'paused' | 'archived', string[]> = {
      'draft': ['active', 'archived'],
      'active': ['paused', 'archived'],
      'paused': ['active', 'archived'],
      'archived': ['active']
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * 验证模板配置
   */
  validateConfiguration(template: TaskTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.title.trim()) {
      errors.push('模板标题不能为空');
    }

    if (template.timeConfig.baseTime.end && 
        template.timeConfig.baseTime.end.timestamp <= template.timeConfig.baseTime.start.timestamp) {
      errors.push('结束时间必须晚于开始时间');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 计算模板下一次执行时间
   */
  calculateNextExecution(template: TaskTemplate): Date | null {
    if (template.timeConfig.recurrence.type === 'none') {
      return null;
    }

    // 使用实例服务的逻辑来计算下一次执行时间
    const instances = taskInstanceService.generateInstancesFromTemplate(template, 1);
    return instances.length > 0 ? new Date(instances[0].scheduledTime.timestamp) : null;
  }

  /**
   * 克隆模板
   */
  cloneTemplate(template: TaskTemplate, newTitle?: string): TaskTemplate {
    const cloned = template.clone();
    
    if (newTitle) {
      cloned.updateTitle(newTitle);
    } else {
      cloned.updateTitle(`${template.title} (副本)`);
    }

    return cloned;
  }
}

export const taskTemplateService = new TaskTemplateService();