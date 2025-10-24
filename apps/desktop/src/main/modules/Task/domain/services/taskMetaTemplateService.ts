import { TaskMetaTemplate } from '../aggregates/taskMetaTemplate';
import { ITaskMetaTemplateRepository } from '../repositories/iTaskMetaTemplateRepository';
import type { TaskTimeConfig, TaskReminderConfig } from '@common/modules/task/types/task';
import { TaskMetaTemplateFactory } from '../utils/taskMetaTemplateFactory';
import type { ApiResponse } from '@dailyuse/contracts';

/**
 * 任务元模板领域服务
 * 处理 TaskMetaTemplate 实体的业务逻辑，如配置合并、校验、统计、系统模板初始化等。
 */
export class TaskMetaTemplateService {
  /**
   * 合并元模板的默认配置与自定义配置
   * @param metaTemplate 元模板对象
   * @param customTimeConfig 可选，自定义时间配置（部分字段覆盖）
   * @param customReminderConfig 可选，自定义提醒配置（部分字段覆盖）
   * @returns 合并后的配置对象
   * @example
   * ```ts
   * const { timeConfig, reminderConfig } = service.mergeWithCustomConfig(meta, { startTime: '08:00' });
   * ```
   * 返回示例：
   * {
   *   timeConfig: { ... },
   *   reminderConfig: { ... }
   * }
   */
  mergeWithCustomConfig(
    metaTemplate: TaskMetaTemplate,
    customTimeConfig?: Partial<TaskTimeConfig>,
    customReminderConfig?: Partial<TaskReminderConfig>,
  ): {
    timeConfig: TaskTimeConfig;
    reminderConfig: TaskReminderConfig;
  } {
    const mergedTimeConfig = {
      ...metaTemplate.defaultTimeConfig,
      ...customTimeConfig,
      timezone:
        customTimeConfig?.timezone ||
        metaTemplate.defaultTimeConfig.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    } as TaskTimeConfig;

    const mergedReminderConfig = {
      ...metaTemplate.defaultReminderConfig,
      ...customReminderConfig,
    } as TaskReminderConfig;

    return {
      timeConfig: mergedTimeConfig,
      reminderConfig: mergedReminderConfig,
    };
  }

  /**
   * 获取元模板的使用统计信息
   * @param metaTemplate 元模板对象
   * @param taskTemplateCount 该元模板下的任务模板数量
   * @param taskInstanceCount 该元模板下的任务实例数量
   * @returns 统计信息对象
   * @example
   * ```ts
   * const stats = service.getUsageStats(meta, 5, 20);
   * ```
   * 返回示例：
   * {
   *   templatesCreated: 5,
   *   instancesGenerated: 20,
   *   lastUsed: '2024-07-23T12:00:00.000Z',
   *   category: 'habit'
   * }
   */
  getUsageStats(
    metaTemplate: TaskMetaTemplate,
    taskTemplateCount: number,
    taskInstanceCount: number,
  ): {
    templatesCreated: number;
    instancesGenerated: number;
    lastUsed: Date;
    category: string;
  } {
    return {
      templatesCreated: taskTemplateCount,
      instancesGenerated: taskInstanceCount,
      lastUsed: metaTemplate.lifecycle.updatedAt || metaTemplate.lifecycle.createdAt,
      category: metaTemplate.category,
    };
  }

  /**
   * 校验元模板配置的有效性
   * @param metaTemplate 元模板对象
   * @returns 校验结果对象，包含 valid（是否有效）和 errors（错误信息数组）
   * @example
   * ```ts
   * const result = service.validateConfiguration(meta);
   * if (!result.valid) { alert(result.errors.join('\n')); }
   * ```
   * 返回示例：
   * {
   *   valid: false,
   *   errors: ['元模板标题不能为空', '元模板必须指定分类']
   * }
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
      errors,
    };
  }

  /**
   * 初始化系统内置元模板（如首次启动时调用）
   * @param metaTemplateRepository 元模板仓库实例
   * @param accountUuid 用户账号ID
   * @returns Promise<{ success: boolean, message: string }>
   * @example
   * ```ts
   * const result = await service.initializeSystemTemplates(repo, accountUuid);
   * if (result.success) { ... }
   * ```
   * 返回示例：
   * { success: true, message: "成功初始化 5 个系统模板" }
   */
  async initializeSystemTemplates(
    metaTemplateRepository: ITaskMetaTemplateRepository,
    accountUuid: string,
  ): Promise<ApiResponse<void>> {
    try {
      // 检查是否已经初始化过
      const existingTemplates = await metaTemplateRepository.findAll(accountUuid);
      if (existingTemplates && existingTemplates.length > 0) {
        return {
          success: true,
          message: '系统模板已存在，跳过初始化',
        };
      }

      // 创建系统预设模板
      const systemTemplates = [
        TaskMetaTemplateFactory.createEmpty(),
        TaskMetaTemplateFactory.createHabit(),
        TaskMetaTemplateFactory.createEvent(),
        TaskMetaTemplateFactory.createDeadline(),
        TaskMetaTemplateFactory.createMeeting(),
      ];

      // 批量保存
      for (const template of systemTemplates) {
        try {
          await metaTemplateRepository.save(accountUuid, template);
        } catch (error) {
          console.error(
            `保存模板失败: ${template.name}`,
            error instanceof Error ? error.message : 'Unknown error',
          );
        }
      }

      return {
        success: true,
        message: `成功初始化 ${systemTemplates.length} 个系统模板`,
      };
    } catch (error) {
      return {
        success: false,
        message: `初始化系统模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
}

/**
 * 单例导出，方便直接使用
 * @example
 * import { taskMetaTemplateService } from '.../taskMetaTemplateService'
 * taskMetaTemplateService.mergeWithCustomConfig(...)
 */
export const taskMetaTemplateService = new TaskMetaTemplateService();
