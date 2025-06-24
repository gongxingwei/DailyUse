import { TaskMetaTemplate } from '../entities/taskMetaTemplate';
import type { TaskTimeConfig, TaskReminderConfig } from '../types/task';

/**
 * 任务元模板领域服务 - 处理TaskMetaTemplate实体的业务逻辑
 */
export class TaskMetaTemplateService {
  /**
   * 合并元模板配置
   */
  mergeWithCustomConfig(
    metaTemplate: TaskMetaTemplate,
    customTimeConfig?: Partial<TaskTimeConfig>,
    customReminderConfig?: Partial<TaskReminderConfig>
  ): {
    timeConfig: TaskTimeConfig;
    reminderConfig: TaskReminderConfig;
  } {
    const mergedTimeConfig = {
      ...metaTemplate.defaultTimeConfig,
      ...customTimeConfig,
      timezone: customTimeConfig?.timezone || 
                metaTemplate.defaultTimeConfig.timezone || 
                Intl.DateTimeFormat().resolvedOptions().timeZone
    } as TaskTimeConfig;

    const mergedReminderConfig = {
      ...metaTemplate.defaultReminderConfig,
      ...customReminderConfig
    } as TaskReminderConfig;

    return {
      timeConfig: mergedTimeConfig,
      reminderConfig: mergedReminderConfig
    };
  }

  /**
   * 检查元模板是否可以删除
   */
  canDelete(metaTemplate: TaskMetaTemplate, activeTemplateCount: number): { canDelete: boolean; reason?: string } {
    if (activeTemplateCount > 0) {
      return {
        canDelete: false,
        reason: `仍有 ${activeTemplateCount} 个活跃的任务模板基于此元模板`
      };
    }

    return { canDelete: true };
  }

  /**
   * 获取元模板使用统计
   */
  getUsageStats(metaTemplate: TaskMetaTemplate, templateCount: number, instanceCount: number) {
    return {
      templatesCreated: templateCount,
      instancesGenerated: instanceCount,
      lastUsed: metaTemplate.lifecycle.updatedAt || metaTemplate.lifecycle.createdAt,
      category: metaTemplate.category
    };
  }

  /**
   * 验证元模板配置
   */
  validateConfiguration(metaTemplate: TaskMetaTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!metaTemplate.name.trim()) {
      errors.push('元模板标题不能为空');
    }

    if (!metaTemplate.category.trim()) {
      errors.push('元模板必须指定分类');
    }

    if (!metaTemplate.defaultTimeConfig) {
      errors.push('元模板必须包含默认时间配置');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const taskMetaTemplateService = new TaskMetaTemplateService();