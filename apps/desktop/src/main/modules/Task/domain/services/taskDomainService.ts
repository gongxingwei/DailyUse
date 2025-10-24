import { TaskTemplate } from '../aggregates/taskTemplate';
import { TaskInstance } from '../aggregates/taskInstance';
import { taskInstanceService } from './taskInstanceService';
import { taskTemplateService } from './taskTemplateService';
import { taskMetaTemplateService } from './taskMetaTemplateService';
import { taskReminderService } from './taskReminderService';
import type { ITaskTemplateRepository } from '../repositories/iTaskTemplateRepository';
import type { ITaskInstanceRepository } from '../repositories/iTaskInstanceRepository';
import { TaskTemplateValidator } from '../../validation/TaskTemplateValidator';
import type { ITaskMetaTemplateRepository } from '../repositories/iTaskMetaTemplateRepository';
import type { ApiResponse } from '@dailyuse/contracts';

/**
 * 任务领域服务
 * 处理跨实体的复杂业务逻辑，协调任务模板和任务实例之间的关系。
 *
 * 常用场景：模板创建/更新/删除、实例批量生成、模板依赖校验、模板状态变更等。
 */
export class TaskDomainService {
  /**
   * 创建任务模板（含实例生成和提醒创建）
   * @param taskTemplate 任务模板实体
   * @param taskTemplateRepository 模板仓库
   * @param taskInstanceRepository 实例仓库
   * @param accountUuid 用户账号ID
   * @returns Promise<{ success, message, data?: TaskTemplate }>
   * @example
   * ```ts
   * const result = await domainService.createTaskTemplate(template, templateRepo, instanceRepo, accountUuid);
   * // result: { success: true, message: "...", data: TaskTemplate }
   * ```
   */
  async createTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTemplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string,
  ): Promise<ApiResponse<TaskTemplate>> {
    try {
      // 1. 验证模板
      const validation = TaskTemplateValidator.validate(taskTemplate);
      if (!validation.isValid) {
        return {
          success: false,
          message: `任务模板验证失败: ${validation.errors.join(', ')}`,
        };
      }

      // 2. 激活并保存模板
      taskTemplate.activate();
      const savedTemplate = await taskTemplateRepository.save(accountUuid, taskTemplate);

      // 3. 生成初始任务实例
      const initialInstances = taskInstanceService.generateInstancesFromTemplate(taskTemplate);
      const savedInstances = await taskInstanceRepository.saveAll(accountUuid, initialInstances);

      // 4. 为每个实例创建提醒
      for (const taskInstance of savedInstances) {
        const reminderResponse = await taskReminderService.createTaskReminders(taskInstance);
        if (!reminderResponse.success) {
          return {
            success: false,
            message: `任务实例 ${taskInstance.uuid} 的提醒创建失败: ${reminderResponse.message}`,
          };
        }
      }

      return {
        success: true,
        message: `任务模板 ${taskTemplate.title} 创建成功`,
        data: savedTemplate,
      };
    } catch (error) {
      return {
        success: false,
        message: `创建任务模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 更新任务模板（自动处理实例同步、提醒同步）
   * @param taskTemplate 任务模板实体
   * @param taskTemplateRepository 模板仓库
   * @param taskInstanceRepository 实例仓库
   * @param accountUuid 用户账号ID
   * @returns Promise<{ success, message, data?: TaskTemplate }>
   * @example
   * ```ts
   * const result = await domainService.updateTaskTemplate(template, templateRepo, instanceRepo, accountUuid);
   * ```
   */
  async updateTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTemplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string,
  ): Promise<ApiResponse<TaskTemplate>> {
    try {
      // 1. 验证
      const validation = TaskTemplateValidator.validate(taskTemplate);
      if (!validation.isValid) {
        return {
          success: false,
          message: `任务模板验证失败: ${validation.errors.join(', ')}`,
        };
      }

      // 2. 查询旧模板
      const oldTemplate = await taskTemplateRepository.findById(accountUuid, taskTemplate.uuid);
      if (!oldTemplate) {
        return {
          success: false,
          message: `任务模板 ${taskTemplate.uuid} 不存在`,
        };
      }

      // 3. 更新模板
      const updatedTemplate = await taskTemplateRepository.update(accountUuid, taskTemplate);

      // 4. 处理实例同步
      const impact = await this.handleTemplateUpdateImpact(
        taskTemplate,
        oldTemplate,
        taskInstanceRepository,
        accountUuid,
      );
      if (impact.affectedCount > 0) {
        let failedCount = 0;
        for (const taskInstance of impact.updatedInstances) {
          try {
            await taskInstanceRepository.update(accountUuid, taskInstance);
          } catch (error) {
            failedCount++;
          }
        }
        if (failedCount > 0) {
          return {
            success: true,
            message: `任务模板 ${taskTemplate.title} 更新成功，但影响了 ${impact.affectedCount} 个实例: ${impact.warnings.join(', ')}，${failedCount} 个实例更新失败`,
            data: updatedTemplate,
          };
        }
      }

      // 5. 同步提醒
      const { updatedInstances } = impact;
      for (const taskInstance of updatedInstances) {
        const reminderResponse = await taskReminderService.cancelTaskInstanceReminders(
          taskInstance.uuid,
        );
        if (!reminderResponse.success) {
          return {
            success: false,
            message: `任务实例 ${taskInstance.uuid} 的提醒更新失败: ${reminderResponse.message}`,
          };
        }
        const reReminderResponse = await taskReminderService.createTaskReminders(taskInstance);
        if (!reReminderResponse.success) {
          return {
            success: false,
            message: `任务实例 ${taskInstance.uuid} 的提醒重新创建失败: ${reReminderResponse.message}`,
          };
        }
      }

      return {
        success: true,
        message: `任务模板 ${taskTemplate.title} 更新成功`,
        data: updatedTemplate,
      };
    } catch (error) {
      return {
        success: false,
        message: `更新任务模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 删除任务模板（可强制删除所有实例）
   * @param taskTemplate 任务模板实体
   * @param taskTemplateRepository 模板仓库
   * @param taskInstanceRepository 实例仓库
   * @param force 是否强制删除（true=连同未完成实例一起删）
   * @param accountUuid 用户账号ID
   * @returns Promise<{ success, message }>
   * @example
   * ```ts
   * const result = await domainService.deleteTaskTemplate(template, templateRepo, instanceRepo, true, accountUuid);
   * ```
   */
  async deleteTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTemplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    force: boolean = false,
    accountUuid: string,
  ): Promise<ApiResponse<void>> {
    try {
      // 1. 校验依赖
      const dependencies = await this.validateTemplateDependencies(
        taskTemplate,
        taskInstanceRepository,
        accountUuid,
      );
      if (!dependencies.canDelete && !force) {
        return {
          success: false,
          message: `无法删除任务模板 ${taskTemplate.title}，存在 ${dependencies.activeInstances} 个未完成的实例`,
        };
      }

      // 2. 强制删除所有相关实例
      if (force) {
        const relatedInstances = await taskInstanceRepository.findByTemplateId(
          accountUuid,
          taskTemplate.uuid,
        );

        for (const taskInstance of relatedInstances) {
          const reminderResponse = await taskReminderService.cancelTaskInstanceReminders(
            taskInstance.uuid,
          );
          if (!reminderResponse.success) {
            return {
              success: false,
              message: `取消任务实例 ${taskInstance.uuid} 的提醒失败: ${reminderResponse.message}`,
            };
          }

          await taskInstanceRepository.delete(accountUuid, taskInstance.uuid);
        }
      }

      // 3. 删除模板
      await taskTemplateRepository.delete(accountUuid, taskTemplate.uuid);

      return {
        success: true,
        message: `任务模板 ${taskTemplate.title} 删除成功`,
      };
    } catch (error) {
      return {
        success: false,
        message: `删除任务模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 获取任务模板（带状态校验）
   * @param accountUuid 用户账号ID
   * @param taskTemplateId 模板ID
   * @param taskTemplateRepository 模板仓库
   * @returns Promise<{ success, message, data?: TaskTemplate }>
   * @example
   * ```ts
   * const result = await domainService.getTaskTemplate(accountUuid, templateId, templateRepo);
   * ```
   */
  async getTaskTemplate(
    accountUuid: string,
    taskTemplateId: string,
    taskTemplateRepository: ITaskTemplateRepository,
  ): Promise<ApiResponse<TaskTemplate>> {
    try {
      const taskTemplate = await taskTemplateRepository.findById(accountUuid, taskTemplateId);
      if (!taskTemplate) {
        return {
          success: false,
          message: `任务模板不存在`,
        };
      }

      if (!taskTemplate.isActive()) {
        return {
          success: false,
          message: `任务模板 ${taskTemplate.title} 已被暂停或归档`,
        };
      }

      return {
        success: true,
        message: `任务模板 ${taskTemplate.title} 获取成功`,
        data: taskTemplate,
      };
    } catch (error) {
      return {
        success: false,
        message: `获取任务模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 删除任务实例
   * @param accountUuid 用户账号ID
   * @param taskInstanceId 实例ID
   * @param taskInstanceRepository 实例仓库
   * @param force 是否强制删除
   * @returns Promise<{ success, message, data?: string }>
   * @example
   * ```ts
   * const result = await domainService.deleteTaskInstance(accountUuid, instanceId, instanceRepo, true);
   * ```
   */
  async deleteTaskInstance(
    accountUuid: string,
    taskInstanceId: string,
    taskInstanceRepository: ITaskInstanceRepository,
    force: boolean = false,
  ): Promise<ApiResponse<string>> {
    try {
      const taskInstance = await taskInstanceRepository.findById(accountUuid, taskInstanceId);
      if (!taskInstance) {
        return {
          success: false,
          message: `任务实例不存在`,
        };
      }

      if (taskInstance.status === 'completed' && !force) {
        return {
          success: false,
          message: `无法删除已完成的任务实例 ${taskInstance.title}，请使用强制删除选项`,
        };
      }

      const reminderResponse = await taskReminderService.cancelTaskInstanceReminders(
        taskInstance.uuid,
      );
      if (!reminderResponse.success) {
        return {
          success: false,
          message: `取消任务实例 ${taskInstance.uuid} 的提醒失败: ${reminderResponse.message}`,
        };
      }

      await taskInstanceRepository.delete(accountUuid, taskInstance.uuid);

      return {
        success: true,
        message: `任务实例 ${taskInstance.title} 删除成功`,
        data: taskInstance.uuid,
      };
    } catch (error) {
      return {
        success: false,
        message: `删除任务实例失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 批量生成任务实例并验证业务规则
   * @param taskTemplate 任务模板
   * @param taskInstanceRepository 实例仓库
   * @param options 可选参数
   *   - maxInstances: 最大生成数量
   *   - dateRange: { start, end }
   *   - skipConflicts: 跳过时间冲突
   *   - accountUuid: 用户账号ID
   * @returns Promise<TaskInstance[]>
   * @example
   * ```ts
   * const instances = await domainService.generateInstancesWithBusinessRules(template, instanceRepo, { maxInstances: 10, accountUuid });
   * ```
   */
  async generateInstancesWithBusinessRules(
    taskTemplate: TaskTemplate,
    taskInstanceRepository: ITaskInstanceRepository,
    options: {
      maxInstances?: number;
      dateRange?: { start: Date; end: Date };
      skipConflicts?: boolean;
      accountUuid?: string;
    } = {},
  ): Promise<TaskInstance[]> {
    if (!taskTemplate.isActive()) {
      throw new Error('只能从激活状态的模板生成实例');
    }
    const instances = options.dateRange
      ? taskInstanceService.generateInstancesInRange(
          taskTemplate,
          options.dateRange.start,
          options.dateRange.end,
        )
      : taskInstanceService.generateInstancesFromTemplate(taskTemplate, options.maxInstances);
    if (options.skipConflicts && options.accountUuid) {
      return await this.filterConflictingInstances(
        instances,
        taskInstanceRepository,
        options.accountUuid,
      );
    }
    return instances;
  }

  /**
   * 校验任务模板的依赖关系（如有未完成实例则不可删）
   * @param taskTemplate 任务模板
   * @param taskInstanceRepository 实例仓库
   * @param accountUuid 用户账号ID
   * @returns Promise<{ canDelete, activeInstances, warnings }>
   * @example
   * ```ts
   * const result = await domainService.validateTemplateDependencies(template, instanceRepo, accountUuid);
   * // result: { canDelete: true, activeInstances: 0, warnings: [] }
   * ```
   */
  async validateTemplateDependencies(
    taskTemplate: TaskTemplate,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string,
  ): Promise<{
    canDelete: boolean;
    activeInstances: number;
    warnings: string[];
  }> {
    try {
      const relatedInstances = await taskInstanceRepository.findByTemplateId(
        accountUuid,
        taskTemplate.uuid,
      );

      const activeInstances = relatedInstances.filter((instance: TaskInstance) =>
        ['pending', 'inProgress'].includes(instance.status),
      );

      return {
        canDelete: activeInstances.length === 0,
        activeInstances: activeInstances.length,
        warnings:
          activeInstances.length > 0 ? [`存在 ${activeInstances.length} 个未完成的实例`] : [],
      };
    } catch (error) {
      return {
        canDelete: true,
        activeInstances: 0,
        warnings: [],
      };
    }
  }

  /**
   * 执行任务模板状态变更业务流程（激活/暂停/归档）
   * @param taskTemplate 任务模板
   * @param newStatus 新状态字符串（"active"|"paused"|"archived"）
   * @param taskInstanceRepository 实例仓库
   * @param accountUuid 用户账号ID
   * @returns Promise<{ success, affectedInstances, warnings }>
   * @throws 状态不合法时抛出异常
   */
  async changeTemplateStatus(
    taskTemplate: TaskTemplate,
    newStatus: string,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string,
  ): Promise<{
    success: boolean;
    affectedInstances: TaskInstance[];
    warnings: string[];
  }> {
    if (!taskTemplateService.canChangeStatus(taskTemplate, newStatus)) {
      throw new Error(`无法从 ${taskTemplate.lifecycle.status} 状态转换到 ${newStatus} 状态`);
    }

    try {
      const relatedInstances = await taskInstanceRepository.findByTemplateId(
        accountUuid,
        taskTemplate.uuid,
      );

      const activeInstances = relatedInstances.filter((instance: TaskInstance) =>
        ['pending', 'inProgress'].includes(instance.status),
      );

      const warnings: string[] = [];
      if (newStatus === 'paused') {
        warnings.push(`暂停模板将影响 ${activeInstances.length} 个未完成的实例`);
      } else if (newStatus === 'archived') {
        warnings.push(`归档模板将停止生成新实例，现有 ${activeInstances.length} 个实例不受影响`);
      }

      switch (newStatus) {
        case 'active':
          taskTemplate.activate();
          break;
        case 'paused':
          taskTemplate.pause();
          break;
        case 'archived':
          taskTemplate.archive();
          break;
        default:
          throw new Error(`不支持的状态: ${newStatus}`);
      }

      return {
        success: true,
        affectedInstances: activeInstances,
        warnings,
      };
    } catch (error) {
      throw new Error(
        `获取相关任务实例失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 执行任务实例状态变更业务流程
   * @param taskInstance 任务实例
   * @param newStatus 新状态字符串（"inProgress"|"completed"|"cancelled"|"pending"）
   * @returns { success, warnings }
   * @throws 状态不合法时抛出异常
   */
  changeInstanceStatus(
    accountUuid: string,
    taskInstance: TaskInstance,
    newStatus: string,
  ): {
    success: boolean;
    warnings: string[];
  } {
    if (!taskInstanceService.canChangeStatus(taskInstance, newStatus)) {
      throw new Error(`无法从 ${taskInstance.status} 状态转换到 ${newStatus} 状态`);
    }
    const warnings: string[] = [];
    switch (newStatus) {
      case 'inProgress':
        taskInstance.resetToStatus('inProgress');
        break;
      case 'completed':
        taskInstance.complete(accountUuid);
        break;
      case 'cancelled':
        taskInstance.cancel();
        break;
      case 'pending':
        if (taskInstance.status === 'completed') {
          taskInstance.undoComplete(accountUuid);
        } else {
          taskInstance.resetToStatus('pending');
        }
        break;
      default:
        throw new Error(`不支持的状态: ${newStatus}`);
    }
    return {
      success: true,
      warnings,
    };
  }

  /**
   * 处理任务模板更新对任务实例的影响（如标题/时间/提醒/描述变更）
   * @param updatedTemplate 新模板
   * @param oldTemplate 旧模板
   * @param taskInstanceRepository 实例仓库
   * @param accountUuid 用户账号ID
   * @returns Promise<{ affectedCount, updatedInstances, warnings }>
   */
  async handleTemplateUpdateImpact(
    updatedTemplate: TaskTemplate,
    oldTemplate: TaskTemplate | null,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string,
  ): Promise<{
    affectedCount: number;
    updatedInstances: TaskInstance[];
    warnings: string[];
  }> {
    try {
      const relatedInstances = await taskInstanceRepository.findByTemplateId(
        accountUuid,
        updatedTemplate.uuid,
      );

      const pendingInstances = relatedInstances.filter(
        (instance: TaskInstance) => instance.status !== 'completed',
      );

      const updatedInstances: TaskInstance[] = [];
      const warnings: string[] = [];

      if (oldTemplate) {
        const titleChanged = oldTemplate.title !== updatedTemplate.title;
        const timeConfigChanged =
          JSON.stringify(oldTemplate.timeConfig) !== JSON.stringify(updatedTemplate.timeConfig);
        const reminderConfigChanged =
          JSON.stringify(oldTemplate.reminderConfig) !==
          JSON.stringify(updatedTemplate.reminderConfig);
        const descriptionChanged = oldTemplate.description !== updatedTemplate.description;

        if (titleChanged || timeConfigChanged || reminderConfigChanged || descriptionChanged) {
          warnings.push(`模板更新将影响 ${pendingInstances.length} 个未完成的实例`);
        }

        pendingInstances.forEach((taskInstance: TaskInstance) => {
          if (titleChanged && taskInstance.status === 'pending') {
            taskInstance.updateTitle(updatedTemplate.title);
            updatedInstances.push(taskInstance);
          }
          if (descriptionChanged) {
            taskInstance.updateDescription(updatedTemplate.description || '');
            updatedInstances.push(taskInstance);
          }
          if (timeConfigChanged) {
            taskInstance.updateConfig(updatedTemplate.timeConfig);
            updatedInstances.push(taskInstance);
          }
          if (reminderConfigChanged) {
            taskInstance.updateReminderStatus(
              updatedTemplate.reminderConfig.enabled,
              updatedTemplate.reminderConfig.alerts,
            );
            updatedInstances.push(taskInstance);
          }
        });
      }

      return {
        affectedCount: pendingInstances.length,
        updatedInstances,
        warnings,
      };
    } catch (error) {
      return {
        affectedCount: 0,
        updatedInstances: [],
        warnings: [],
      };
    }
  }

  /**
   * 暂停任务模板（删除所有实例并取消提醒）
   * @param taskTemplate 任务模板
   * @param taskTemplateRepository 模板仓库
   * @param taskInstanceRepository 实例仓库
   * @param accountUuid 用户账号ID
   * @returns Promise<{ success, message, data?: TaskTemplate }>
   */
  async pauseTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTemplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string,
  ): Promise<ApiResponse<TaskTemplate>> {
    try {
      if (taskTemplate.isPaused()) {
        return {
          success: false,
          message: `任务模板 ${taskTemplate.title} 已处于暂停状态`,
        };
      }

      const relatedInstances = await taskInstanceRepository.findByTemplateId(
        accountUuid,
        taskTemplate.uuid,
      );

      for (const taskInstance of relatedInstances) {
        const reminderResponse = await taskReminderService.cancelTaskInstanceReminders(
          taskInstance.uuid,
        );
        if (!reminderResponse.success) {
          return {
            success: false,
            message: `取消任务实例 ${taskInstance.uuid} 的提醒失败: ${reminderResponse.message}`,
          };
        }

        await taskInstanceRepository.delete(accountUuid, taskInstance.uuid);
      }

      taskTemplate.pause();
      const updatedTemplate = await taskTemplateRepository.update(accountUuid, taskTemplate);

      return {
        success: true,
        message: `任务模板 ${taskTemplate.title} 暂停成功`,
        data: updatedTemplate,
      };
    } catch (error) {
      return {
        success: false,
        message: `暂停任务模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 恢复任务模板（重新生成实例和提醒）
   * @param taskTemplate 任务模板
   * @param taskTemplateRepository 模板仓库
   * @param taskInstanceRepository 实例仓库
   * @param accountUuid 用户账号ID
   * @returns Promise<{ success, message, data?: TaskTemplate }>
   */
  async resumeTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTemplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string,
  ): Promise<ApiResponse<TaskTemplate>> {
    try {
      if (!taskTemplate.isPaused()) {
        return {
          success: false,
          message: `任务模板 ${taskTemplate.title} 不处于暂停状态`,
        };
      }

      const initialInstances = taskInstanceService.generateInstancesFromTemplate(taskTemplate);
      const savedInstances = await taskInstanceRepository.saveAll(accountUuid, initialInstances);

      for (const taskInstance of savedInstances) {
        const reminderResponse = await taskReminderService.createTaskReminders(taskInstance);
        if (!reminderResponse.success) {
          return {
            success: false,
            message: `任务实例 ${taskInstance.uuid} 的提醒创建失败: ${reminderResponse.message}`,
          };
        }
      }

      taskTemplate.activate();
      const updatedTemplate = await taskTemplateRepository.update(accountUuid, taskTemplate);

      return {
        success: true,
        message: `任务模板 ${taskTemplate.title} 恢复成功`,
        data: updatedTemplate,
      };
    } catch (error) {
      return {
        success: false,
        message: `恢复任务模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 过滤冲突的任务实例（如时间重叠）
   * @param taskInstances 新生成的实例数组
   * @param taskInstanceRepository 实例仓库
   * @param accountUuid 用户账号ID
   * @returns Promise<TaskInstance[]>
   */
  private async filterConflictingInstances(
    taskInstances: TaskInstance[],
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string,
  ): Promise<TaskInstance[]> {
    try {
      const allInstances = await taskInstanceRepository.findAll(accountUuid);

      const existingInstances = allInstances.filter(
        (instance: TaskInstance) =>
          instance.status !== 'completed' && instance.status !== 'cancelled',
      );

      return taskInstances.filter((newTaskInstance) => {
        const conflicts = taskInstanceService.checkTimeConflicts(
          existingInstances,
          newTaskInstance,
        );
        return conflicts.length === 0;
      });
    } catch (error) {
      return taskInstances;
    }
  }

  /**
   * 初始化系统内置元模板（代理调用 taskMetaTemplateService）
   * @param taskMetaTemplateRepository 元模板仓库
   * @param accountUuid 用户账号ID
   * @returns Promise<{ success, message }>
   */
  async initializeSystemTemplates(
    taskMetaTemplateRepository: ITaskMetaTemplateRepository,
    accountUuid: string,
  ): Promise<ApiResponse<void>> {
    try {
      const response = await taskMetaTemplateService.initializeSystemTemplates(
        taskMetaTemplateRepository,
        accountUuid,
      );
      if (!response.success) {
        return {
          success: false,
          message: `初始化系统模板失败: ${response.message}`,
        };
      }
      return { success: true, message: 'System templates initialized successfully' };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize system templates: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
