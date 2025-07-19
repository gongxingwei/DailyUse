import { TaskMetaTemplate } from '../aggregates/taskMetaTemplate';
import { ITaskMetaTemplateRepository } from '../repositories/iTaskMetaTemplateRepository';
import type { TaskTimeConfig, TaskReminderConfig } from '../types/task';
import { TaskMetaTemplateFactory } from '../utils/taskMetaTemplateFactory';
/**
 * 任务元模板领域服务
 * 处理TaskMetaTemplate实体的业务逻辑
 */
export class TaskMetaTemplateService {
  /**
   * 合并元模板配置
   * @param {TaskMetaTemplate} metaTemplate - 元模板
   * @param {Partial<TaskTimeConfig>} customTimeConfig - 自定义时间配置（可选）
   * @param {Partial<TaskReminderConfig>} customReminderConfig - 自定义提醒配置（可选）
   * @returns {object} 合并后的配置对象
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

  // /**
  //  * 检查元模板是否可以删除
  //  * @param {TaskMetaTemplate} metaTemplate - 元模板
  //  * @param {number} activeTaskTemplateCount - 活跃的任务模板数量
  //  * @returns {object} 删除检查结果，包含是否可删除和原因
  //  */
  // canDelete(metaTemplate: TaskMetaTemplate, activeTaskTemplateCount: number): { canDelete: boolean; reason?: string } {
  //   if (activeTaskTemplateCount > 0) {
  //     return {
  //       canDelete: false,
  //       reason: `仍有 ${activeTaskTemplateCount} 个活跃的任务模板基于此元模板`
  //     };
  //   }

  //   return { canDelete: true };
  // }

  /**
   * 获取元模板使用统计
   * @param {TaskMetaTemplate} metaTemplate - 元模板
   * @param {number} taskTemplateCount - 任务模板数量
   * @param {number} taskInstanceCount - 任务实例数量
   * @returns {object} 使用统计信息
   */
  getUsageStats(metaTemplate: TaskMetaTemplate, taskTemplateCount: number, taskInstanceCount: number) {
    return {
      templatesCreated: taskTemplateCount,
      instancesGenerated: taskInstanceCount,
      lastUsed: metaTemplate.lifecycle.updatedAt || metaTemplate.lifecycle.createdAt,
      category: metaTemplate.category
    };
  }

  /**
   * 验证元模板配置
   * @param {TaskMetaTemplate} metaTemplate - 元模板
   * @returns {object} 验证结果，包含是否有效和错误信息
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

  async initializeSystemTemplates(metaTemplateRepository: ITaskMetaTemplateRepository): Promise<TResponse<void>> {
    try {
      // 检查是否已经初始化过
      const existingTemplates = await metaTemplateRepository.findAll();
      if (existingTemplates.data && existingTemplates.data.length > 0) {
        return {
          success: true,
          message: '系统模板已存在，跳过初始化'
        };
      }

      // 创建系统预设模板
      const systemTemplates = [
        TaskMetaTemplateFactory.createEmpty(),
        TaskMetaTemplateFactory.createHabit(),
        TaskMetaTemplateFactory.createEvent(),
        TaskMetaTemplateFactory.createDeadline(),
        TaskMetaTemplateFactory.createMeeting()
      ];

      // 批量保存
      for (const template of systemTemplates) {
        const result = await metaTemplateRepository.save(template);
        if (!result.success) {
          console.error(`保存模板失败: ${template.name}`, result.message);
        }
      }

      return {
        success: true,
        message: `成功初始化 ${systemTemplates.length} 个系统模板`
      };
    } catch (error) {
      return {
        success: false,
        message: `初始化系统模板失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}

export const taskMetaTemplateService = new TaskMetaTemplateService();