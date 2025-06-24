// 实体，用于类型检查和业务逻辑
import { TaskMetaTemplate } from "../entities/taskMetaTemplate";
// 实体服务
import { taskInstanceService } from "./taskInstanceService";
import { taskTemplateService } from "./taskTemplateService";
import { taskMetaTemplateService } from "./taskMetaTemplateService";
// services
import { taskReminderService } from "./taskReminderService";
// stores
import { useTaskStore } from "@/modules/Task/presentation/stores/taskStore";
import type {
  TaskTimeConfig,
  TaskReminderConfig,
  CreateTaskTemplateOptions,
} from "../types/task";
import { ensureTaskInstance } from "@/modules/Task/presentation/stores/taskStore";
import type { ITaskTemplateRepository } from "../repositories/iTaskTemplateRepository";
import type { ITaskInstanceRepository } from "../repositories/iTaskInstanceRepository";
// utils
import { TaskTemplateValidator } from "../../validation/TaskTemplateValidator";
import { Task } from "electron";
/**
 * 任务领域服务 - 处理跨实体的复杂业务逻辑
 */
export class TaskDomainService {
  async createTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTmeplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository
  ): Promise<TResponse<any>> {
    // 1. 验证输入
    const validation = TaskTemplateValidator.validate(taskTemplate);
    if (!validation.isValid) {
      return {
        success: false,
        message: `任务模板验证失败: ${validation.errors.join(", ")}`,
      };
    }

    const response = await taskTmeplateRepository.save(taskTemplate);
    if (!response.success) {
      return {
        success: false,
        message: `任务模板保存失败: ${response.message}`,
      };
    }

    // 2. 生成初始实例
    const initialInstances =
      taskInstanceService.generateInstancesFromTemplate(taskTemplate);

    // 3. 保存初始实例
    const instanceResponses = await taskInstanceRepository.saveAll(
      initialInstances
    );
    if (!instanceResponses.success) {
      return {
        success: false,
        message: `初始任务实例保存失败: ${instanceResponses.message}`,
      };
    }

    // 4. 初始化提醒
    for (const instance of initialInstances) {
      const reminderResponse = await taskReminderService.createTaskReminders(
        instance
      );
      if (!reminderResponse.success) {
        return {
          success: false,
          message: `任务实例 ${instance.id} 的提醒创建失败: ${reminderResponse.message}`,
        };
      }
    }

    // 3. 返回结果
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
    taskTmeplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository
  ): Promise<TResponse<any>> {
    // 1. 验证输入
    const validation = TaskTemplateValidator.validate(taskTemplate);
    if (!validation.isValid) {
      return {
        success: false,
        message: `任务模板验证失败: ${validation.errors.join(", ")}`,
      };
    }

    // 验证模板状态
    const oldTemplate = await taskTmeplateRepository.findById(taskTemplate.id);
    if (!oldTemplate.success || !oldTemplate.data) {
      return {
        success: false,
        message: `任务模板 ${taskTemplate.id} 不存在`,
      };
    }

    // 2. 更新模板
    const response = await taskTmeplateRepository.update(taskTemplate);
    if (!response.success) {
      return {
        success: false,
        message: `任务模板更新失败: ${response.message}`,
      };
    }

    // 3. 处理更新对实例的影响

    const impact = this.handleTemplateUpdateImpact(
      taskTemplate,
      oldTemplate.data
    );
    if (impact.affectedCount > 0) {
      // 如果有影响，更新相关实例
      let failedCount = 0;
      for (const instance of impact.updatedInstances) {
        const response = await taskInstanceRepository.update(instance);
        if (!response.success) {
          failedCount++;
        }
      }

      // 添加警告信息
      return {
        success: true,
        message: `任务模板 ${
          taskTemplate.title
        } 更新成功，${failedCount} 个实例更新失败，但影响了 ${
          impact.affectedCount
        } 个实例: ${impact.warnings.join(", ")}`,
        data: taskTemplate,
      };
    }

    const { updatedInstances } = impact;
    for (const instance of updatedInstances) {
      // 4. 更新实例的提醒状态
      const reminderResponse =
        await taskReminderService.cancelTaskInstanceReminders(instance.id);
      if (!reminderResponse.success) {
        return {
          success: false,
          message: `任务实例 ${instance.id} 的提醒更新失败: ${reminderResponse.message}`,
        };
      }
      const reReminderResponse = await taskReminderService.createTaskReminders(
        instance
      );
      if (!reReminderResponse.success) {
        return {
          success: false,
          message: `任务实例 ${instance.id} 的提醒重新创建失败: ${reReminderResponse.message}`,
        };
      }
    }

    // 3. 返回结果
    return {
      success: true,
      message: `任务模板 ${taskTemplate.title} 更新成功
`,
      data: taskTemplate,
    };
  }
  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(
    taskTemplate: TaskTemplate,
    taskTmeplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    force: boolean = false
  ): Promise<TResponse<any>> {
    // 1. 验证模板依赖
    const dependencies = this.validateTemplateDependencies(taskTemplate);
    if (!dependencies.canDelete && !force) {
      return {
        success: false,
        message: `无法删除任务模板 ${taskTemplate.title}，存在 ${dependencies.activeInstances} 个未完成的实例`,
      };
    }

    // 如果强制删除，先取消所有相关实例
    if (force) {
      const relatedInstances = await taskInstanceRepository.findByTemplateId(
        taskTemplate.id
      );
      if (!relatedInstances.success || !relatedInstances.data) {
        return {
          success: false,
          message: `获取相关任务实例失败: ${relatedInstances.message}`,
        };
      }

      for (const instance of relatedInstances.data) {
        // 取消实例的提醒
        const reminderResponse =
          await taskReminderService.cancelTaskInstanceReminders(instance.id);
        if (!reminderResponse.success) {
          return {
            success: false,
            message: `取消任务实例 ${instance.id} 的提醒失败: ${reminderResponse.message}`,
          };
        }

        const response = await taskInstanceRepository.delete(instance.id);
        if (!response.success) {
          return {
            success: false,
            message: `删除实例 ${instance.id} 失败: ${response.message}`,
          };
        }
      }
    }
    // 2. 删除模板
    const response = await taskTmeplateRepository.delete(taskTemplate.id);
    if (!response.success) {
      return {
        success: false,
        message: `任务模板删除失败: ${response.message}`,
      };
    }
    // 3. 返回结果
    return {
      success: true,
      message: `任务模板 ${taskTemplate.title} 删除成功
`,
      data: taskTemplate.id,
    };
  }

  /**
   * 获取任务模板
   */
  async getTaskTemplate(
    templateId: string,
    taskTmeplateRepository: ITaskTemplateRepository
  ): Promise<TResponse<TaskTemplate>> {
    // 1. 获取模板
    const response = await taskTmeplateRepository.findById(templateId);
    if (!response.success || !response.data) {
      return {
        success: false,
        message: `获取任务模板失败: ${response.message}`,
      };
    }
    const taskTemplate = response.data;
    // 2. 验证模板状态
    if (!taskTemplate.isActive()) {
      return {
        success: false,
        message: `任务模板 ${taskTemplate.title} 已被暂停或归档`,
      };
    }
    // 3. 返回结果
    return {
      success: true,
      message: `任务模板 ${taskTemplate.title} 获取成功
`,
      data: taskTemplate,
    };
  }

  async deleteTaskInstance(
    instanceId: string,
    taskInstanceRepository: ITaskInstanceRepository,
    force: boolean = false
  ): Promise<TResponse<TaskInstance['id']>> {
    // 1. 获取实例
    const response = await taskInstanceRepository.findById(instanceId);
    if (!response.success || !response.data) {
      return {
        success: false,
        message: `获取任务实例失败: ${response.message}`,
      };
    }
    const taskInstance = response.data;
    // 2. 验证实例状态
    if (taskInstance.status === "completed" && !force) {
      return {
        success: false,
        message: `无法删除已完成的任务实例 ${taskInstance.title}，请使用强制删除选项`,
      };
    }
    // 3. 取消实例的提醒
    const reminderResponse =
      await taskReminderService.cancelTaskInstanceReminders(taskInstance.id);
    if (!reminderResponse.success) {
      return {
        success: false,
        message: `取消任务实例 ${taskInstance.id} 的提醒失败: ${reminderResponse.message}`,
      };
    }
    // 4. 删除实例
    const deleteResponse = await taskInstanceRepository.delete(taskInstance.id);
    if (!deleteResponse.success) {
      return {
        success: false,
        message: `删除任务实例 ${taskInstance.title} 失败: ${deleteResponse.message}`,
      };
    }
    // 5. 返回结果
    return {
      success: true,
      message: `任务实例 ${taskInstance.title} 删除成功
`,
      data: taskInstance.id,
    };
  }

  /**
   * 从元模板创建任务模板（协调元模板服务和模板服务）
   */
  createTemplateFromMetaTemplate(
    metaTemplate: TaskMetaTemplate,
    customOptions: {
      title: string;
      timeConfig?: Partial<TaskTimeConfig>;
      reminderConfig?: Partial<TaskReminderConfig>;
    } & Partial<CreateTaskTemplateOptions>
  ): TaskTemplate {
    // 使用元模板服务验证配置
    const validation =
      taskMetaTemplateService.validateConfiguration(metaTemplate);
    if (!validation.valid) {
      throw new Error(`元模板配置无效: ${validation.errors.join(", ")}`);
    }

    // 使用模板服务创建模板
    return taskTemplateService.createFromMetaTemplate(
      metaTemplate,
      customOptions
    );
  }

  /**
   * 批量生成实例并验证业务规则
   */
  generateInstancesWithBusinessRules(
    template: TaskTemplate,
    options: {
      maxInstances?: number;
      dateRange?: { start: DateTime; end: DateTime };
      skipConflicts?: boolean;
    } = {}
  ): TaskInstance[] {
    // 1. 检查模板状态
    if (!template.isActive()) {
      throw new Error("只能从激活状态的模板生成实例");
    }

    // 2. 生成实例
    const instances = options.dateRange
      ? taskInstanceService.generateInstancesInRange(
          template,
          options.dateRange.start,
          options.dateRange.end
        )
      : taskInstanceService.generateInstancesFromTemplate(
          template,
          options.maxInstances
        );

    // 3. 业务规则验证
    if (options.skipConflicts) {
      return this.filterConflictingInstances(instances);
    }

    return instances;
  }

  /**
   * 检查任务模板的依赖关系
   */
  validateTemplateDependencies(template: TaskTemplate): {
    canDelete: boolean;
    activeInstances: number;
    warnings: string[];
  } {
    const taskStore = useTaskStore();
    const activeInstances = taskStore.taskInstances.filter(
      (instance) =>
        instance.templateId === template.id &&
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
   * 执行模板状态变更业务流程
   */
  changeTemplateStatus(
    template: TaskTemplate,
    newStatus: string
  ): {
    success: boolean;
    affectedInstances: TaskInstance[];
    warnings: string[];
  } {
    // 使用模板服务验证状态转换
    if (!taskTemplateService.canChangeStatus(template, newStatus)) {
      throw new Error(
        `无法从 ${template.lifecycle.status} 状态转换到 ${newStatus} 状态`
      );
    }

    const taskStore = useTaskStore();
    const relatedInstances = taskStore.taskInstances
      .filter(
        (instance) =>
          instance.templateId === template.id &&
          ["pending", "inProgress"].includes(instance.status)
      )
      .map(ensureTaskInstance);

    const warnings: string[] = [];

    // 根据新状态处理相关实例
    if (newStatus === "paused") {
      warnings.push(`暂停模板将影响 ${relatedInstances.length} 个未完成的实例`);
    } else if (newStatus === "archived") {
      warnings.push(
        `归档模板将停止生成新实例，现有 ${relatedInstances.length} 个实例不受影响`
      );
    }

    // 执行状态变更
    switch (newStatus) {
      case "active":
        template.activate();
        break;
      case "paused":
        template.pause();
        break;
      case "archived":
        template.archive();
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
   * 执行实例状态变更业务流程
   */
  changeInstanceStatus(
    instance: TaskInstance,
    newStatus: string
  ): {
    success: boolean;
    warnings: string[];
  } {
    // 使用实例服务验证状态转换
    if (!taskInstanceService.canChangeStatus(instance, newStatus)) {
      throw new Error(`无法从 ${instance.status} 状态转换到 ${newStatus} 状态`);
    }

    const warnings: string[] = [];

    // 执行状态变更
    switch (newStatus) {
      case "inProgress":
        instance.start();
        break;
      case "completed":
        instance.complete();
        break;
      case "cancelled":
        instance.cancel();
        break;
      case "pending":
        if (instance.status === "completed") {
          instance.undoComplete();
        } else {
          // 从其他状态恢复到pending
          instance.pending();
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
   * 处理模板更新对实例的影响
   */
  handleTemplateUpdateImpact(
    updatedTemplate: TaskTemplate,
    oldTemplate: TaskTemplate | null
  ): {
    affectedCount: number;
    updatedInstances: TaskInstance[];
    warnings: string[];
  } {
    const taskStore = useTaskStore();
    const relatedInstances = taskStore.taskInstances
      .filter(
        (instance) =>
          instance.templateId === updatedTemplate.id &&
          instance.status !== "completed"
      )
      .map(ensureTaskInstance);

    const updatedInstances: TaskInstance[] = [];
    const warnings: string[] = [];

    // 检查影响范围
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

      // 根据变更类型更新实例
      relatedInstances.forEach((instance) => {
        if (titleChanged && instance.status === "pending") {
          // 只更新未开始的实例标题
          instance.updateTitle(updatedTemplate.title);
          updatedInstances.push(instance);
        }

        if (descriptionChanged) {
          // 更新描述
          instance.updateDescription(updatedTemplate.description || "");
          updatedInstances.push(instance);
        }

        if (timeConfigChanged) {
          // 更新时间配置
          instance.updateTimeConfig(updatedTemplate.timeConfig);
          updatedInstances.push(instance);
        }

        if (reminderConfigChanged) {
          // 更新提醒配置
          instance.updateReminderStatus(
            updatedTemplate.reminderConfig.enabled,
            updatedTemplate.reminderConfig.alerts
          );
          updatedInstances.push(instance);
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
   * 过滤冲突的实例
   */
  private filterConflictingInstances(
    instances: TaskInstance[]
  ): TaskInstance[] {
    const taskStore = useTaskStore();
    const existingInstances = taskStore.taskInstances
      .filter(
        (instance) =>
          instance.status !== "completed" && instance.status !== "cancelled"
      )
      .map(ensureTaskInstance);

    return instances.filter((newInstance) => {
      const conflicts = taskInstanceService.checkTimeConflicts(
        existingInstances,
        newInstance
      );
      return conflicts.length === 0;
    });
  }
}
