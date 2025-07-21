import { TaskTemplate } from "../aggregates/taskTemplate";
import { TaskMetaTemplate } from "../aggregates/taskMetaTemplate";
import { TaskInstance } from "../aggregates/taskInstance";
import { taskInstanceService } from "./taskInstanceService";
import { taskTemplateService } from "./taskTemplateService";
import { taskMetaTemplateService } from "./taskMetaTemplateService";
import { taskReminderService } from "./taskReminderService";
import type { ITaskTemplateRepository } from "../repositories/iTaskTemplateRepository";
import type { ITaskInstanceRepository } from "../repositories/iTaskInstanceRepository";
import { TaskTemplateValidator } from "../../validation/TaskTemplateValidator";
import type { DateTime } from "@/shared/types/myDateTime";
import type { ITaskMetaTemplateRepository } from "../repositories/iTaskMetaTemplateRepository";

/**
 * 任务领域服务
 * 处理跨实体的复杂业务逻辑，协调任务模板和任务实例之间的关系
 */
export class TaskDomainService {
  /**
   * 创建任务模板
   */
  async createTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTemplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string
  ): Promise<TResponse<TaskTemplate>> {
    const validation = TaskTemplateValidator.validate(taskTemplate);
    if (!validation.isValid) {
      return {
        success: false,
        message: `任务模板验证失败: ${validation.errors.join(", ")}`,
      };
    }

    taskTemplate.activate();
    const response = await taskTemplateRepository.save(accountUuid, taskTemplate);

    if (!response.success) {
      return {
        success: false,
        message: `任务模板保存失败: ${response.message}`,
      };
    }

    const initialInstances = taskInstanceService.generateInstancesFromTemplate(taskTemplate);

    const instanceResponses = await taskInstanceRepository.saveAll(accountUuid, initialInstances);
    if (!instanceResponses.success) {
      return {
        success: false,
        message: `初始任务实例保存失败: ${instanceResponses.message}`,
      };
    }

    for (const taskInstance of initialInstances) {
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
      data: taskTemplate,
    };
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTemplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string
  ): Promise<TResponse<TaskTemplate>> {
    const validation = TaskTemplateValidator.validate(taskTemplate);
    if (!validation.isValid) {
      return {
        success: false,
        message: `任务模板验证失败: ${validation.errors.join(", ")}`,
      };
    }

    const oldTemplate = await taskTemplateRepository.findById(accountUuid, taskTemplate.uuid);
    if (!oldTemplate.success || !oldTemplate.data) {
      return {
        success: false,
        message: `任务模板 ${taskTemplate.uuid} 不存在`,
      };
    }

    const response = await taskTemplateRepository.update(accountUuid, taskTemplate);
    if (!response.success) {
      return {
        success: false,
        message: `任务模板更新失败: ${response.message}`,
      };
    }

    const impact = await this.handleTemplateUpdateImpact(taskTemplate, oldTemplate.data, taskInstanceRepository, accountUuid);
    if (impact.affectedCount > 0) {
      let failedCount = 0;
      for (const taskInstance of impact.updatedInstances) {
        const response = await taskInstanceRepository.update(accountUuid, taskInstance);
        if (!response.success) {
          failedCount++;
        }
      }

      if (failedCount > 0) {
        return {
          success: true,
          message: `任务模板 ${taskTemplate.title} 更新成功，但影响了 ${impact.affectedCount} 个实例: ${impact.warnings.join(", ")}，${failedCount} 个实例更新失败`,
          data: taskTemplate,
        };
      }
    }

    const { updatedInstances } = impact;
    for (const taskInstance of updatedInstances) {
      const reminderResponse = await taskReminderService.cancelTaskInstanceReminders(taskInstance.uuid);
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
      data: taskTemplate,
    };
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTemplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    force: boolean = false,
    accountUuid: string
  ): Promise<TResponse<void>> {
    const dependencies = await this.validateTemplateDependencies(taskTemplate, taskInstanceRepository, accountUuid);
    if (!dependencies.canDelete && !force) {
      return {
        success: false,
        message: `无法删除任务模板 ${taskTemplate.title}，存在 ${dependencies.activeInstances} 个未完成的实例`,
      };
    }

    if (force) {
      const relatedInstances = await taskInstanceRepository.findByTemplateId(accountUuid, taskTemplate.uuid);
      if (!relatedInstances.success || !relatedInstances.data) {
        return {
          success: false,
          message: `获取相关任务实例失败: ${relatedInstances.message}`,
        };
      }

      for (const taskInstance of relatedInstances.data) {
        const reminderResponse = await taskReminderService.cancelTaskInstanceReminders(taskInstance.uuid);
        if (!reminderResponse.success) {
          return {
            success: false,
            message: `取消任务实例 ${taskInstance.uuid} 的提醒失败: ${reminderResponse.message}`,
          };
        }

        const response = await taskInstanceRepository.delete(accountUuid, taskInstance.uuid);
        if (!response.success) {
          return {
            success: false,
            message: `删除实例 ${taskInstance.uuid} 失败: ${response.message}`,
          };
        }
      }
    }

    const response = await taskTemplateRepository.delete(accountUuid, taskTemplate.uuid);
    if (!response.success) {
      return {
        success: false,
        message: `任务模板删除失败: ${response.message}`,
      };
    }

    return {
      success: true,
      message: `任务模板 ${taskTemplate.title} 删除成功`,
    };
  }

  /**
   * 获取任务模板
   */
  async getTaskTemplate(
    accountUuid: string,
    taskTemplateId: string,
    taskTemplateRepository: ITaskTemplateRepository
  ): Promise<TResponse<TaskTemplate>> {
    const response = await taskTemplateRepository.findById(accountUuid, taskTemplateId);
    if (!response.success || !response.data) {
      return {
        success: false,
        message: `获取任务模板失败: ${response.message}`,
      };
    }

    const taskTemplate = response.data;
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
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(
    accountUuid: string,
    taskInstanceId: string,
    taskInstanceRepository: ITaskInstanceRepository,
    force: boolean = false
  ): Promise<TResponse<string>> {
    const response = await taskInstanceRepository.findById(accountUuid, taskInstanceId);
    if (!response.success || !response.data) {
      return {
        success: false,
        message: `获取任务实例失败: ${response.message}`,
      };
    }

    const taskInstance = response.data;
    if (taskInstance.status === "completed" && !force) {
      return {
        success: false,
        message: `无法删除已完成的任务实例 ${taskInstance.title}，请使用强制删除选项`,
      };
    }

    const reminderResponse = await taskReminderService.cancelTaskInstanceReminders(taskInstance.uuid);
    if (!reminderResponse.success) {
      return {
        success: false,
        message: `取消任务实例 ${taskInstance.uuid} 的提醒失败: ${reminderResponse.message}`,
      };
    }

    const deleteResponse = await taskInstanceRepository.delete(accountUuid, taskInstance.uuid);
    if (!deleteResponse.success) {
      return {
        success: false,
        message: `删除任务实例 ${taskInstance.title} 失败: ${deleteResponse.message}`,
      };
    }

    return {
      success: true,
      message: `任务实例 ${taskInstance.title} 删除成功`,
      data: taskInstance.uuid,
    };
  }

  /**
   * 从元模板创建任务模板
   */
  createTemplateFromMetaTemplate(metaTemplate: TaskMetaTemplate): TaskTemplate {
    const validation = taskMetaTemplateService.validateConfiguration(metaTemplate);
    if (!validation.valid) {
      throw new Error(`元模板配置无效: ${validation.errors.join(", ")}`);
    }

    const taskTemplate = taskTemplateService.createFromMetaTemplate(metaTemplate);
    console.log("创建的任务模板:", taskTemplate);
    return taskTemplate;
  }

  /**
   * 批量生成任务实例并验证业务规则
   */
  async generateInstancesWithBusinessRules(
    taskTemplate: TaskTemplate,
    taskInstanceRepository: ITaskInstanceRepository,
    options: {
      maxInstances?: number;
      dateRange?: { start: DateTime; end: DateTime };
      skipConflicts?: boolean;
      accountUuid?: string;
    } = {}
  ): Promise<TaskInstance[]> {
    if (!taskTemplate.isActive()) {
      throw new Error("只能从激活状态的模板生成实例");
    }

    const instances = options.dateRange
      ? taskInstanceService.generateInstancesInRange(
          taskTemplate,
          options.dateRange.start,
          options.dateRange.end
        )
      : taskInstanceService.generateInstancesFromTemplate(
          taskTemplate,
          options.maxInstances
        );

    if (options.skipConflicts && options.accountUuid) {
      return await this.filterConflictingInstances(instances, taskInstanceRepository, options.accountUuid);
    }

    return instances;
  }

  /**
   * 检查任务模板的依赖关系
   */
  async validateTemplateDependencies(
    taskTemplate: TaskTemplate,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string
  ): Promise<{
    canDelete: boolean;
    activeInstances: number;
    warnings: string[];
  }> {
    const relatedInstancesResponse = await taskInstanceRepository.findByTemplateId(accountUuid, taskTemplate.uuid);
    if (!relatedInstancesResponse.success || !relatedInstancesResponse.data) {
      return {
        canDelete: true,
        activeInstances: 0,
        warnings: [],
      };
    }

    const activeInstances = relatedInstancesResponse.data.filter(
      (instance) =>
        ["pending", "inProgress"].includes(instance.status)
    );

    return {
      canDelete: activeInstances.length === 0,
      activeInstances: activeInstances.length,
      warnings:
        activeInstances.length > 0
          ? [`存在 ${activeInstances.length} 个未完成的实例`]
          : [],
    };
  }

  /**
   * 执行任务模板状态变更业务流程
   */
  async changeTemplateStatus(
    taskTemplate: TaskTemplate,
    newStatus: string,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string
  ): Promise<{
    success: boolean;
    affectedInstances: TaskInstance[];
    warnings: string[];
  }> {
    if (!taskTemplateService.canChangeStatus(taskTemplate, newStatus)) {
      throw new Error(
        `无法从 ${taskTemplate.lifecycle.status} 状态转换到 ${newStatus} 状态`
      );
    }

    const relatedInstancesResponse = await taskInstanceRepository.findByTemplateId(accountUuid, taskTemplate.uuid);
    if (!relatedInstancesResponse.success || !relatedInstancesResponse.data) {
      throw new Error(`获取相关任务实例失败: ${relatedInstancesResponse.message}`);
    }

    const relatedInstances = relatedInstancesResponse.data.filter(
      (instance: TaskInstance) =>
        ["pending", "inProgress"].includes(instance.status)
    );

    const warnings: string[] = [];

    if (newStatus === "paused") {
      warnings.push(`暂停模板将影响 ${relatedInstances.length} 个未完成的实例`);
    } else if (newStatus === "archived") {
      warnings.push(
        `归档模板将停止生成新实例，现有 ${relatedInstances.length} 个实例不受影响`
      );
    }

    switch (newStatus) {
      case "active":
        taskTemplate.activate();
        break;
      case "paused":
        taskTemplate.pause();
        break;
      case "archived":
        taskTemplate.archive();
        break;
      default:
        throw new Error(`不支持的状态: ${newStatus}`);
    }

    return {
      success: true,
      affectedInstances: relatedInstances,
      warnings,
    };
  }

  /**
   * 执行任务实例状态变更业务流程
   */
  changeInstanceStatus(
    taskInstance: TaskInstance,
    newStatus: string
  ): {
    success: boolean;
    warnings: string[];
  } {
    if (!taskInstanceService.canChangeStatus(taskInstance, newStatus)) {
      throw new Error(`无法从 ${taskInstance.status} 状态转换到 ${newStatus} 状态`);
    }

    const warnings: string[] = [];

    switch (newStatus) {
      case "inProgress":
        taskInstance.start();
        break;
      case "completed":
        taskInstance.complete();
        break;
      case "cancelled":
        taskInstance.cancel();
        break;
      case "pending":
        if (taskInstance.status === "completed") {
          taskInstance.undoComplete();
        } else {
          taskInstance.pending();
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
   * 处理任务模板更新对任务实例的影响
   */
  async handleTemplateUpdateImpact(
    updatedTemplate: TaskTemplate,
    oldTemplate: TaskTemplate | null,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string
  ): Promise<{
    affectedCount: number;
    updatedInstances: TaskInstance[];
    warnings: string[];
  }> {
    const relatedInstancesResponse = await taskInstanceRepository.findByTemplateId(accountUuid, updatedTemplate.uuid);
    if (!relatedInstancesResponse.success || !relatedInstancesResponse.data) {
      return {
        affectedCount: 0,
        updatedInstances: [],
        warnings: [],
      };
    }

    const relatedInstances = relatedInstancesResponse.data.filter(
      (instance: TaskInstance) => instance.status !== "completed"
    );

    const updatedInstances: TaskInstance[] = [];
    const warnings: string[] = [];

    if (oldTemplate) {
      const titleChanged = oldTemplate.title !== updatedTemplate.title;
      const timeConfigChanged =
        JSON.stringify(oldTemplate.timeConfig) !==
        JSON.stringify(updatedTemplate.timeConfig);
      const reminderConfigChanged =
        JSON.stringify(oldTemplate.reminderConfig) !==
        JSON.stringify(updatedTemplate.reminderConfig);
      const descriptionChanged =
        oldTemplate.description !== updatedTemplate.description;

      if (
        titleChanged ||
        timeConfigChanged ||
        reminderConfigChanged ||
        descriptionChanged
      ) {
        warnings.push(
          `模板更新将影响 ${relatedInstances.length} 个未完成的实例`
        );
      }

      relatedInstances.forEach((taskInstance: TaskInstance) => {
        if (titleChanged && taskInstance.status === "pending") {
          taskInstance.updateTitle(updatedTemplate.title);
          updatedInstances.push(taskInstance);
        }

        if (descriptionChanged) {
          taskInstance.updateDescription(updatedTemplate.description || "");
          updatedInstances.push(taskInstance);
        }

        if (timeConfigChanged) {
          taskInstance.updateTimeConfig(updatedTemplate.timeConfig);
          updatedInstances.push(taskInstance);
        }

        if (reminderConfigChanged) {
          taskInstance.updateReminderStatus(
            updatedTemplate.reminderConfig.enabled,
            updatedTemplate.reminderConfig.alerts
          );
          updatedInstances.push(taskInstance);
        }
      });
    }

    return {
      affectedCount: relatedInstances.length,
      updatedInstances,
      warnings,
    };
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTemplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string
  ): Promise<TResponse<TaskTemplate>> {
    if (taskTemplate.isPaused()) {
      return {
        success: false,
        message: `任务模板 ${taskTemplate.title} 已处于暂停状态`,
      };
    }

    const relatedInstances = await taskInstanceRepository.findByTemplateId(accountUuid, taskTemplate.uuid);
    if (!relatedInstances.success || !relatedInstances.data) {
      return {
        success: false,
        message: `获取相关任务实例失败: ${relatedInstances.message}`,
      };
    }

    for (const taskInstance of relatedInstances.data) {
      const reminderResponse = await taskReminderService.cancelTaskInstanceReminders(taskInstance.uuid);
      if (!reminderResponse.success) {
        return {
          success: false,
          message: `取消任务实例 ${taskInstance.uuid} 的提醒失败: ${reminderResponse.message}`,
        };
      }

      const response = await taskInstanceRepository.delete(accountUuid, taskInstance.uuid);
      if (!response.success) {
        return {
          success: false,
          message: `删除实例 ${taskInstance.uuid} 失败: ${response.message}`,
        };
      }
    }

    taskTemplate.pause();
    const response = await taskTemplateRepository.update(accountUuid, taskTemplate);
    if (!response.success) {
      return {
        success: false,
        message: `任务模板 ${taskTemplate.title} 暂停失败: ${response.message}`,
      };
    }

    return {
      success: true,
      message: `任务模板 ${taskTemplate.title} 暂停成功`,
      data: taskTemplate,
    };
  }

  /**
   * 恢复任务模板
   */
  async resumeTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTemplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string
  ): Promise<TResponse<TaskTemplate>> {
    if (!taskTemplate.isPaused()) {
      return {
        success: false,
        message: `任务模板 ${taskTemplate.title} 不处于暂停状态`,
      };
    }

    const initialInstances = taskInstanceService.generateInstancesFromTemplate(taskTemplate);

    const instanceResponses = await taskInstanceRepository.saveAll(accountUuid, initialInstances);
    if (!instanceResponses.success) {
      return {
        success: false,
        message: `初始任务实例保存失败: ${instanceResponses.message}`,
      };
    }

    for (const taskInstance of initialInstances) {
      const reminderResponse = await taskReminderService.createTaskReminders(taskInstance);
      if (!reminderResponse.success) {
        return {
          success: false,
          message: `任务实例 ${taskInstance.uuid} 的提醒创建失败: ${reminderResponse.message}`,
        };
      }
    }

    taskTemplate.activate();
    const response = await taskTemplateRepository.update(accountUuid, taskTemplate);
    if (!response.success) {
      return {
        success: false,
        message: `任务模板 ${taskTemplate.title} 恢复失败: ${response.message}`,
      };
    }

    return {
      success: true,
      message: `任务模板 ${taskTemplate.title} 恢复成功`,
      data: taskTemplate,
    };
  }

  /**
   * 过滤冲突的任务实例
   */
  private async filterConflictingInstances(
    taskInstances: TaskInstance[],
    taskInstanceRepository: ITaskInstanceRepository,
    accountUuid: string
  ): Promise<TaskInstance[]> {
    const allInstancesResponse = await taskInstanceRepository.findAll(accountUuid);
    if (!allInstancesResponse.success || !allInstancesResponse.data) {
      return taskInstances;
    }

    const existingInstances = allInstancesResponse.data.filter(
      (instance: TaskInstance) =>
        instance.status !== "completed" && instance.status !== "cancelled"
    );

    return taskInstances.filter((newTaskInstance) => {
      const conflicts = taskInstanceService.checkTimeConflicts(
        existingInstances,
        newTaskInstance
      );
      return conflicts.length === 0;
    });
  }

  async initializeSystemTemplates(
    taskMetaTemplateRepository: ITaskMetaTemplateRepository,
    accountUuid: string
  ): Promise<TResponse<void>> {
    try {
      const response = await taskMetaTemplateService.initializeSystemTemplates(
        taskMetaTemplateRepository,
        accountUuid
      );
      if (!response.success) {
        return {
          success: false,
          message: `初始化系统模板失败: ${response.message}`,
        };
      }
      return { success: true, message: "System templates initialized successfully" };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize system templates: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}