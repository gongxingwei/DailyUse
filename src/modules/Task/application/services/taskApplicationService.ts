import { TaskDomainService } from "../../domain/services/taskDomainService";
import { TaskContainer } from "../../infrastructure/di/taskContainer";
import type { ITaskTemplateRepository } from "../../domain/repositories/iTaskTemplateRepository";
import type { ITaskInstanceRepository } from "../../domain/repositories/iTaskInstanceRepository";
import type { ITaskMetaTemplateRepository } from "../../domain/repositories/iTaskMetaTemplateRepository";
import { TaskTemplate } from "../../domain/entities/taskTemplate";
import { TaskInstance } from "../../domain/entities/taskInstance";
import { TaskMetaTemplate } from "../../domain/entities/taskMetaTemplate";
import { EventBus } from "@/shared/events/eventBus";
import type {
  TaskCompletedEvent,
  TaskUndoCompletedEvent,
} from "@/shared/events/domainEvent";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
import { useGoalStore } from "@/modules/Goal/stores/goalStore";
import type {
  CreateTaskTemplateOptions,
  TaskTimeConfig,
  TaskReminderConfig,
} from "../../domain/types/task";
import { TaskTemplateValidator } from "@/modules/Task/validation/TaskTemplateValidator";
export class TaskApplicationService {
  private taskDomainService: TaskDomainService;
  private taskTemplateRepo: ITaskTemplateRepository;
  private taskInstanceRepo: ITaskInstanceRepository;
  private taskMetaTemplateRepo: ITaskMetaTemplateRepository;

  constructor() {
    const container = TaskContainer.getInstance();
    this.taskTemplateRepo = container.getTaskTemplateRepository();
    this.taskInstanceRepo = container.getTaskInstanceRepository();
    this.taskMetaTemplateRepo = container.getTaskMetaTemplateRepository();
    this.taskDomainService = new TaskDomainService();
  }

  // ✅ MetaTemplate 相关方法
  async getAllMetaTemplates(): Promise<TaskMetaTemplate[]> {
    const response = await this.taskMetaTemplateRepo.findAll();
    return response.success ? response.data || [] : [];
  }

  async getMetaTemplate(id: string): Promise<TaskMetaTemplate | null> {
    const response = await this.taskMetaTemplateRepo.findById(id);
    return response.success ? response.data || null : null;
  }

  async getMetaTemplatesByCategory(
    category: string
  ): Promise<TaskMetaTemplate[]> {
    const response = await this.taskMetaTemplateRepo.findByCategory(category);
    return response.success ? response.data || [] : [];
  }

  async saveMetaTemplate(
    metaTemplate: TaskMetaTemplate
  ): Promise<TResponse<TaskMetaTemplate>> {
    return await this.taskMetaTemplateRepo.save(metaTemplate);
  }

  async deleteMetaTemplate(id: string): Promise<TResponse<boolean>> {
    return await this.taskMetaTemplateRepo.delete(id);
  }

  // === 任务模板相关操作 ===

  async getTaskTemplate(templateId: string): Promise<TaskTemplate | null> {
    const response = await this.taskTemplateRepo.findById(templateId);
    return response.success ? response.data || null : null;
  }

  async getAllTaskTemplates(): Promise<TaskTemplate[]> {
    const response = await this.taskTemplateRepo.findAll();
    return response.success ? response.data || [] : [];
  }

  async getTaskTemplateForKeyResult(
    goalId: string,
    keyResultId: string
  ): Promise<TaskTemplate[]> {
    const response = await this.taskTemplateRepo.findByKeyResult(
      goalId,
      keyResultId
    );
    return response.success ? response.data || [] : [];
  }

  // === 任务实例相关操作 ===
  async createTaskInstance(
    instance: TaskInstance
  ): Promise<TResponse<TaskInstance>> {
    return await this.taskInstanceRepo.save(instance);
  }

  async addTaskInstances(
    instances: TaskInstance[]
  ): Promise<TResponse<TaskInstance[]>> {
    return await this.taskInstanceRepo.saveAll(instances);
  }

  async getTaskInstance(taskId: string): Promise<TaskInstance | null> {
    const response = await this.taskInstanceRepo.findById(taskId);
    return response.success ? response.data || null : null;
  }

  async getAllTaskInstances(): Promise<TaskInstance[]> {
    const response = await this.taskInstanceRepo.findAll();
    return response.success ? response.data || [] : [];
  }

  async getTodayTasks(): Promise<TaskInstance[]> {
    const response = await this.taskInstanceRepo.findTodayTasks();
    return response.success ? response.data || [] : [];
  }

  async updateTaskInstance(
    instance: TaskInstance
  ): Promise<TResponse<TaskInstance>> {
    return await this.taskInstanceRepo.update(instance);
  }

  // === 业务操作 ===

  /**
   * 使用模板创建的 template 对象（使用领域服务协调）
   */
  async createTaskTemplateFromMeta(
    metaTemplateId: string,
    customOptions: {
      title: string;
      timeConfig?: Partial<TaskTimeConfig>;
      reminderConfig?: Partial<TaskReminderConfig>;
    } & Partial<CreateTaskTemplateOptions>
  ): Promise<TaskTemplate> {
    const response = await this.taskMetaTemplateRepo.findById(metaTemplateId);
    if (!response.success || !response.data) {
      throw new Error(`MetaTemplate with id ${metaTemplateId} not found`);
    }

    // ✅ 使用领域服务协调元模板和模板服务
    return this.taskDomainService.createTemplateFromMetaTemplate(
      response.data,
      customOptions
    );
  }

  async createTaskTemplate(
    template: TaskTemplate
  ): Promise<TResponse<TaskTemplate>> {
    // ✅ 验证模板
    const validation = TaskTemplateValidator.validate(template);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(", ") };
    }

    // ✅ 使用领域服务保存模板
    return await this.taskTemplateRepo.save(template);
  }

  async saveTaskTemplate(
    template: TaskTemplate
  ): Promise<TResponse<TaskTemplate>> {
    const createOrUpdateResponse = await this.taskTemplateRepo.findById(
      template.id
    );
    if (createOrUpdateResponse.success && createOrUpdateResponse.data) {
      // 如果模板已存在，使用 update 方法更新
      const response = await this.taskDomainService.updateTaskTemplate(
        template,
        this.taskTemplateRepo,
        this.taskInstanceRepo
      );

      return response;
    } else {
      // 如果模板不存在，使用 create 方法创建
      return await this.taskDomainService.createTaskTemplate(
        template,
        this.taskTemplateRepo,
        this.taskInstanceRepo
      );
    }
  }

  async deleteTaskTemplate(templateId: string): Promise<TResponse<boolean>> {
    const response = await this.taskTemplateRepo.findById(templateId);
    if (!response.success || !response.data) {
      return {
        success: false,
        message: `Template with id ${templateId} not found`,
      };
    }
    // ✅ 使用领域服务删除模板
    return await this.taskTemplateRepo.delete(templateId);
  }

  async updateTaskTemplate(
    template: TaskTemplate
  ): Promise<TResponse<TaskTemplate>> {
    // ✅ 验证模板
    const validation = TaskTemplateValidator.validate(template);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(", ") };
    }
    // ✅ 使用领域服务更新模板
    return await this.taskTemplateRepo.update(template);
  }

  async getTaskTemplateWithStatus(
    taskTemplateId: string
  ): Promise<TResponse<TaskTemplate>> {
    const response = await this.taskDomainService.getTaskTemplate(
      taskTemplateId,
      this.taskTemplateRepo
    );
    return response;
  }

  async deleteTaskInstance(taskId: string): Promise<TResponse<TaskInstance['id']>> {
    return await this.taskDomainService.deleteTaskInstance(
      taskId,
      this.taskInstanceRepo
    );
  }

  // ✅ 修复后的完成任务方法
  async completeTask(taskId: string): Promise<TResponse<void>> {
    const response = await this.taskInstanceRepo.findById(taskId);
    if (!response.success || !response.data) {
      console.error("Task not found:", taskId);
      return { success: false, message: "Task not found" };
    }

    const taskInstance = response.data;

    try {
      // ✅ 直接调用 TaskInstance 的 complete() 方法
      taskInstance.complete();

      // 保存更新后的实例
      const updateResponse = await this.taskInstanceRepo.update(taskInstance);
      if (!updateResponse.success) {
        console.error(
          `Failed to update task ${taskId}:`,
          updateResponse.message
        );
        return { success: false, message: updateResponse.message };
      }

      // 发布领域事件
      if (taskInstance.keyResultLinks?.length) {
        const now = TimeUtils.now();
        const event: TaskCompletedEvent = {
          eventType: "TaskCompleted",
          aggregateId: taskId,
          occurredOn: new Date(now.timestamp),
          data: {
            taskId,
            keyResultLinks: taskInstance.keyResultLinks,
            completedAt: new Date(now.timestamp),
          },
        };
        await EventBus.getInstance().publish(event);
      }

      console.log(`✓ 任务 ${taskId} 完成成功`);
      return {success:true, message: "Task completed successfully"};
    } catch (error) {
      console.error(`✗ 完成任务 ${taskId} 失败:`, error);
      return { success: false, message: `Failed to complete task ${taskId}: ${error instanceof Error ? error.message : 'weizhi'}` };
    }
  }

  // ✅ 修复后的撤销完成方法
  async undoCompleteTask(taskId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskId);
    if (!response.success || !response.data) {
      console.error("Task not found:", taskId);
      return false;
    }

    const taskInstance = response.data;

    if (!taskInstance.isCompleted()) {
      console.warn("任务未完成，无法撤销");
      return false;
    }

    try {
      // ✅ 直接调用 TaskInstance 的 undoComplete() 方法
      taskInstance.undoComplete();

      // 保存更新后的实例
      const updateResponse = await this.taskInstanceRepo.update(taskInstance);
      if (!updateResponse.success) {
        console.error(
          `Failed to update task ${taskId}:`,
          updateResponse.message
        );
        return false;
      }

      // 发布领域事件
      if (taskInstance.keyResultLinks?.length) {
        const event: TaskUndoCompletedEvent = {
          eventType: "TaskUndoCompleted",
          aggregateId: taskId,
          occurredOn: new Date(),
          data: {
            taskId,
            keyResultLinks: taskInstance.keyResultLinks,
            undoAt: new Date(),
          },
        };
        await EventBus.getInstance().publish(event);
      }

      console.log(`✓ 任务 ${taskId} 撤销完成成功`);
      return true;
    } catch (error) {
      console.error(`✗ 撤销任务 ${taskId} 完成失败:`, error);
      return false;
    }
  }

  // ✅ 添加更多业务操作方法
  async startTask(taskId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskId);
    if (!response.success || !response.data) {
      console.error("Task not found:", taskId);
      return false;
    }

    try {
      response.data.start();
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update task ${taskId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 任务 ${taskId} 开始成功`);
      return true;
    } catch (error) {
      console.error(`✗ 开始任务 ${taskId} 失败:`, error);
      return false;
    }
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskId);
    if (!response.success || !response.data) {
      console.error("Task not found:", taskId);
      return false;
    }

    try {
      response.data.cancel();
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update task ${taskId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 任务 ${taskId} 取消成功`);
      return true;
    } catch (error) {
      console.error(`✗ 取消任务 ${taskId} 失败:`, error);
      return false;
    }
  }

  async rescheduleTask(
    taskId: string,
    newScheduledTime: any,
    newEndTime?: any
  ): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskId);
    if (!response.success || !response.data) {
      console.error("Task not found:", taskId);
      return false;
    }

    try {
      response.data.reschedule(newScheduledTime, newEndTime);
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update task ${taskId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 任务 ${taskId} 重新安排时间成功`);
      return true;
    } catch (error) {
      console.error(`✗ 重新安排任务 ${taskId} 时间失败:`, error);
      return false;
    }
  }

  // ✅ 提醒相关操作
  async triggerTaskReminder(taskId: string, alertId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskId);
    if (!response.success || !response.data) {
      console.error("Task not found:", taskId);
      return false;
    }

    try {
      response.data.triggerReminder(alertId);
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update task ${taskId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 任务 ${taskId} 的提醒 ${alertId} 触发成功`);
      return true;
    } catch (error) {
      console.error(`✗ 触发任务 ${taskId} 的提醒失败:`, error);
      return false;
    }
  }

  async snoozeTaskReminder(
    taskId: string,
    alertId: string,
    snoozeUntil: any,
    reason?: string
  ): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskId);
    if (!response.success || !response.data) {
      console.error("Task not found:", taskId);
      return false;
    }

    try {
      response.data.snoozeReminder(alertId, snoozeUntil, reason);
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update task ${taskId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 任务 ${taskId} 的提醒 ${alertId} 推迟成功`);
      return true;
    } catch (error) {
      console.error(`✗ 推迟任务 ${taskId} 的提醒失败:`, error);
      return false;
    }
  }

  async dismissTaskReminder(taskId: string, alertId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskId);
    if (!response.success || !response.data) {
      console.error("Task not found:", taskId);
      return false;
    }

    try {
      response.data.dismissReminder(alertId);
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update task ${taskId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 任务 ${taskId} 的提醒 ${alertId} 忽略成功`);
      return true;
    } catch (error) {
      console.error(`✗ 忽略任务 ${taskId} 的提醒失败:`, error);
      return false;
    }
  }

  async disableTaskReminders(taskId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskId);
    if (!response.success || !response.data) {
      console.error("Task not found:", taskId);
      return false;
    }

    try {
      response.data.disableReminders();
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update task ${taskId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 任务 ${taskId} 的提醒已禁用`);
      return true;
    } catch (error) {
      console.error(`✗ 禁用任务 ${taskId} 的提醒失败:`, error);
      return false;
    }
  }

  async enableTaskReminders(taskId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskId);
    if (!response.success || !response.data) {
      console.error("Task not found:", taskId);
      return false;
    }

    try {
      response.data.enableReminders();
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update task ${taskId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 任务 ${taskId} 的提醒已启用`);
      return true;
    } catch (error) {
      console.error(`✗ 启用任务 ${taskId} 的提醒失败:`, error);
      return false;
    }
  }

  // ✅ 模板操作
  async activateTemplate(templateId: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(templateId);
    if (!response.success || !response.data) {
      console.error("Template not found:", templateId);
      return false;
    }

    try {
      response.data.activate();
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update template ${templateId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 模板 ${templateId} 激活成功`);
      return true;
    } catch (error) {
      console.error(`✗ 激活模板 ${templateId} 失败:`, error);
      return false;
    }
  }

  async pauseTemplate(templateId: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(templateId);
    if (!response.success || !response.data) {
      console.error("Template not found:", templateId);
      return false;
    }

    try {
      response.data.pause();
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update template ${templateId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 模板 ${templateId} 暂停成功`);
      return true;
    } catch (error) {
      console.error(`✗ 暂停模板 ${templateId} 失败:`, error);
      return false;
    }
  }

  async archiveTemplate(templateId: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(templateId);
    if (!response.success || !response.data) {
      console.error("Template not found:", templateId);
      return false;
    }

    try {
      response.data.archive();
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update template ${templateId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 模板 ${templateId} 归档成功`);
      return true;
    } catch (error) {
      console.error(`✗ 归档模板 ${templateId} 失败:`, error);
      return false;
    }
  }

  async updateTemplateTitle(
    templateId: string,
    title: string
  ): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(templateId);
    if (!response.success || !response.data) {
      console.error("Template not found:", templateId);
      return false;
    }

    try {
      response.data.updateTitle(title);
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update template ${templateId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 模板 ${templateId} 标题更新成功`);
      return true;
    } catch (error) {
      console.error(`✗ 更新模板 ${templateId} 标题失败:`, error);
      return false;
    }
  }

  async updateTemplateDescription(
    templateId: string,
    description?: string
  ): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(templateId);
    if (!response.success || !response.data) {
      console.error("Template not found:", templateId);
      return false;
    }

    try {
      response.data.updateDescription(description);
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update template ${templateId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 模板 ${templateId} 描述更新成功`);
      return true;
    } catch (error) {
      console.error(`✗ 更新模板 ${templateId} 描述失败:`, error);
      return false;
    }
  }

  async setTemplatePriority(
    templateId: string,
    priority?: 1 | 2 | 3 | 4 | 5
  ): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(templateId);
    if (!response.success || !response.data) {
      console.error("Template not found:", templateId);
      return false;
    }

    try {
      response.data.setPriority(priority);
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update template ${templateId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 模板 ${templateId} 优先级设置成功`);
      return true;
    } catch (error) {
      console.error(`✗ 设置模板 ${templateId} 优先级失败:`, error);
      return false;
    }
  }

  async addTemplateTag(templateId: string, tag: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(templateId);
    if (!response.success || !response.data) {
      console.error("Template not found:", templateId);
      return false;
    }

    try {
      response.data.addTag(tag);
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update template ${templateId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 模板 ${templateId} 添加标签成功`);
      return true;
    } catch (error) {
      console.error(`✗ 模板 ${templateId} 添加标签失败:`, error);
      return false;
    }
  }

  async removeTemplateTag(templateId: string, tag: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(templateId);
    if (!response.success || !response.data) {
      console.error("Template not found:", templateId);
      return false;
    }

    try {
      response.data.removeTag(tag);
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(
          `Failed to update template ${templateId}:`,
          updateResponse.message
        );
        return false;
      }
      console.log(`✓ 模板 ${templateId} 移除标签成功`);
      return true;
    } catch (error) {
      console.error(`✗ 模板 ${templateId} 移除标签失败:`, error);
      return false;
    }
  }

  // === 统计分析 ===
  async getTaskStatsForGoal(goalId: string): Promise<any> {
    const goalStore = useGoalStore();
    const goal = goalStore.getGoalById(goalId);

    if (!goal) {
      console.error("Goal not found");
      return {
        overall: {
          total: 0,
          completed: 0,
          incomplete: 0,
          completionRate: 0,
          missedTasks: 0,
        },
        taskDetails: [],
      };
    }

    const startTime = TimeUtils.fromISOString(goal.startTime);
    const endTime = TimeUtils.fromISOString(goal.endTime);
    const now = TimeUtils.now();

    const allTasksResponse = await this.taskInstanceRepo.findAll();
    const allTemplatesResponse = await this.taskTemplateRepo.findAll();

    const allTasks = allTasksResponse.success
      ? allTasksResponse.data || []
      : [];
    const allTemplates = allTemplatesResponse.success
      ? allTemplatesResponse.data || []
      : [];

    const tasks = allTasks.filter((task) => {
      const isRelatedToGoal = task.keyResultLinks?.some(
        (link) => link.goalId === goalId
      );

      return (
        isRelatedToGoal &&
        task.scheduledTime.timestamp >= startTime.timestamp &&
        task.scheduledTime.timestamp <= endTime.timestamp &&
        task.scheduledTime.timestamp <= now.timestamp
      );
    });

    // 按任务模板分组统计
    const tasksByTemplate = tasks.reduce(
      (acc, task) => {
        const templateId = task.templateId;
        const template = allTemplates.find((t) => t.id === templateId);

        if (!acc[templateId]) {
          acc[templateId] = {
            templateId,
            title: template?.title || "未知任务",
            total: 0,
            completed: 0,
          };
        }

        acc[templateId].total++;
        if (task.isCompleted()) {
          acc[templateId].completed++;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          templateId: string;
          title: string;
          total: number;
          completed: number;
        }
      >
    );

    // 计算总体统计
    const overallStats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.isCompleted()).length,
      incomplete: tasks.filter((t) => !t.isCompleted()).length,
      completionRate: tasks.length
        ? (tasks.filter((t) => t.isCompleted()).length / tasks.length) * 100
        : 0,
      missedTasks: tasks.filter(
        (t) => !t.isCompleted() && t.scheduledTime.timestamp < now.timestamp
      ).length,
    };

    return {
      overall: overallStats,
      taskDetails: Object.values(tasksByTemplate)
        .map((stats) => ({
          ...stats,
          completionRate: stats.total
            ? (stats.completed / stats.total) * 100
            : 0,
        }))
        .sort((a, b) => b.total - a.total),
    };
  }

  async getTaskCompletionTimeline(
    goalId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const timeline: Record<
      string,
      {
        total: number;
        completed: number;
        date: string;
      }
    > = {};

    const start = TimeUtils.fromISOString(new Date(startDate).toISOString());
    const end = TimeUtils.fromISOString(new Date(endDate).toISOString());

    // 创建日期条目
    let currentDate = start;
    while (currentDate.timestamp <= end.timestamp) {
      const dateStr = `${currentDate.date.year}-${currentDate.date.month
        .toString()
        .padStart(2, "0")}-${currentDate.date.day.toString().padStart(2, "0")}`;
      timeline[dateStr] = {
        total: 0,
        completed: 0,
        date: dateStr,
      };

      // 移动到下一天
      const nextDay = new Date(currentDate.timestamp);
      nextDay.setDate(nextDay.getDate() + 1);
      currentDate = TimeUtils.fromTimestamp(nextDay.getTime());
    }

    // 填充任务数据
    const allTasksResponse = await this.taskInstanceRepo.findAll();
    const allTasks = allTasksResponse.success
      ? allTasksResponse.data || []
      : [];

    allTasks
      .filter((task) => {
        const isRelatedToGoal = task.keyResultLinks?.some(
          (link) => link.goalId === goalId
        );
        return (
          isRelatedToGoal &&
          task.scheduledTime.timestamp >= start.timestamp &&
          task.scheduledTime.timestamp <= end.timestamp
        );
      })
      .forEach((task) => {
        const dateStr = `${
          task.scheduledTime.date.year
        }-${task.scheduledTime.date.month
          .toString()
          .padStart(2, "0")}-${task.scheduledTime.date.day
          .toString()
          .padStart(2, "0")}`;
        if (timeline[dateStr]) {
          timeline[dateStr].total++;
          if (task.isCompleted()) {
            timeline[dateStr].completed++;
          }
        }
      });

    return Object.values(timeline);
  }
}
