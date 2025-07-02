import { TaskDomainService } from "../../domain/services/taskDomainService";
import { TaskContainer } from "../../infrastructure/di/taskContainer";
import type { ITaskTemplateRepository } from "../../domain/repositories/iTaskTemplateRepository";
import type { ITaskInstanceRepository } from "../../domain/repositories/iTaskInstanceRepository";
import type { ITaskMetaTemplateRepository } from "../../domain/repositories/iTaskMetaTemplateRepository";
import { TaskTemplate } from "../../domain/entities/taskTemplate";
import { TaskInstance } from "../../domain/entities/taskInstance";
import { TaskMetaTemplate } from "../../domain/entities/taskMetaTemplate";
import { EventBus } from "@/shared/events/eventBus";
import type { TaskCompletedEvent, TaskUndoCompletedEvent } from '@/shared/domain/domainEvent';
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
import { useGoalStore } from "@/modules/Goal/stores/goalStore";
import { TaskTemplateValidator } from "@/modules/Task/validation/TaskTemplateValidator";
/**
 * 任务应用服务层
 * 负责任务相关的业务操作协调，包括任务模板、任务实例、元模板的管理
 */
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

  // === MetaTemplate 相关方法 ===

  /**
   * 获取所有元模板
   * @returns {Promise<TaskMetaTemplate[]>} 元模板数组
   */
  async getAllMetaTemplates(): Promise<TaskMetaTemplate[]> {
    const response = await this.taskMetaTemplateRepo.findAll();
    return response.success ? response.data || [] : [];
  }

  /**
   * 根据ID获取元模板
   * @param {string} id - 元模板ID
   * @returns {Promise<TaskMetaTemplate | null>} 元模板实体或null
   */
  async getMetaTemplate(id: string): Promise<TaskMetaTemplate | null> {
    const response = await this.taskMetaTemplateRepo.findById(id);
    return response.success ? response.data || null : null;
  }

  /**
   * 根据分类获取元模板
   * @param {string} category - 分类名称
   * @returns {Promise<TaskMetaTemplate[]>} 元模板数组
   */
  async getMetaTemplatesByCategory(category: string): Promise<TaskMetaTemplate[]> {
    const response = await this.taskMetaTemplateRepo.findByCategory(category);
    return response.success ? response.data || [] : [];
  }

  /**
   * 保存元模板
   * @param {TaskMetaTemplate} metaTemplate - 元模板实体
   * @returns {Promise<TResponse<TaskMetaTemplate>>} 保存响应
   */
  async saveMetaTemplate(metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>> {
    return await this.taskMetaTemplateRepo.save(metaTemplate);
  }

  /**
   * 删除元模板
   * @param {string} id - 元模板ID
   * @returns {Promise<TResponse<boolean>>} 删除响应
   */
  async deleteMetaTemplate(id: string): Promise<TResponse<boolean>> {
    return await this.taskMetaTemplateRepo.delete(id);
  }

  // === 任务模板相关操作 ===

  /**
   * 根据ID获取任务模板
   * @param {string} taskTemplateId - 任务模板ID
   * @returns {Promise<TaskTemplate | null>} 任务模板实体或null
   */
  async getTaskTemplate(taskTemplateId: string): Promise<TaskTemplate | null> {
    const response = await this.taskTemplateRepo.findById(taskTemplateId);
    return response.success ? response.data || null : null;
  }

  /**
   * 获取所有任务模板
   * @returns {Promise<TaskTemplate[]>} 任务模板数组
   */
  async getAllTaskTemplates(): Promise<TaskTemplate[]> {
    const response = await this.taskTemplateRepo.findAll();
    return response.success ? response.data || [] : [];
  }

  /**
   * 根据关键结果获取任务模板
   * @param {string} goalId - 目标ID
   * @param {string} keyResultId - 关键结果ID
   * @returns {Promise<TaskTemplate[]>} 相关任务模板数组
   */
  async getTaskTemplateForKeyResult(goalId: string, keyResultId: string): Promise<TaskTemplate[]> {
    const response = await this.taskTemplateRepo.findByKeyResult(goalId, keyResultId);
    return response.success ? response.data || [] : [];
  }

  // === 任务实例相关操作 ===

  /**
   * 根据ID获取任务实例
   * @param {string} taskInstanceId - 任务实例ID
   * @returns {Promise<TaskInstance | null>} 任务实例或null
   */
  async getTaskInstance(taskInstanceId: string): Promise<TaskInstance | null> {
    const response = await this.taskInstanceRepo.findById(taskInstanceId);
    return response.success ? response.data || null : null;
  }

  /**
   * 获取所有任务实例
   * @returns {Promise<TaskInstance[]>} 任务实例数组
   */
  async getAllTaskInstances(): Promise<TaskInstance[]> {
    const response = await this.taskInstanceRepo.findAll();
    return response.success ? response.data || [] : [];
  }

  /**
   * 获取今日任务实例
   * @returns {Promise<TaskInstance[]>} 今日任务实例数组
   */
  async getTodayTasks(): Promise<TaskInstance[]> {
    const response = await this.taskInstanceRepo.findTodayTasks();
    return response.success ? response.data || [] : [];
  }

  /**
   * 更新任务实例
   * @param {TaskInstance} taskInstance - 任务实例
   * @returns {Promise<TResponse<TaskInstance>>} 更新响应
   */
  async updateTaskInstance(taskInstance: TaskInstance): Promise<TResponse<TaskInstance>> {
    return await this.taskInstanceRepo.update(taskInstance);
  }

  // === 业务操作 ===

  /**
   * 从元模板创建任务模板
   * @param {string} metaTemplateId - 元模板ID
   * @returns {Promise<TaskTemplate>} 创建的任务模板
   * @throws {Error} 당元模板不存在时抛出错误
   */
  async createTaskTemplateFromMeta(metaTemplateId: string): Promise<TaskTemplate> {
    const response = await this.taskMetaTemplateRepo.findById(metaTemplateId);
    if (!response.success || !response.data) {
      throw new Error(`MetaTemplate with id ${metaTemplateId} not found`);
    }
    return this.taskDomainService.createTemplateFromMetaTemplate(response.data);
  }

  /**
   * 创建任务模板
   * @param {TaskTemplate} taskTemplate - 任务模板实体
   * @returns {Promise<TResponse<TaskTemplate>>} 创建响应
   */
  async createTaskTemplate(taskTemplate: TaskTemplate): Promise<TResponse<TaskTemplate>> {
    const validation = TaskTemplateValidator.validate(taskTemplate);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(", ") };
    }
    return await this.taskTemplateRepo.save(taskTemplate);
  }

  /**
   * 保存任务模板（创建或更新）
   * @param {TaskTemplate} taskTemplate - 任务模板实体
   * @returns {Promise<TResponse<TaskTemplate>>} 保存响应
   */
  async saveTaskTemplate(taskTemplate: TaskTemplate): Promise<TResponse<TaskTemplate>> {
    const createOrUpdateResponse = await this.taskTemplateRepo.findById(taskTemplate.id);
    if (createOrUpdateResponse.success && createOrUpdateResponse.data) {
      const response = await this.taskDomainService.updateTaskTemplate(
        taskTemplate,
        this.taskTemplateRepo,
        this.taskInstanceRepo
      );
      return response;
    } else {
      const response = await this.taskDomainService.createTaskTemplate(
        taskTemplate,
        this.taskTemplateRepo,
        this.taskInstanceRepo
      );
      console.log('创建的任务模板:', response.data);
      return response;
    }
  }

  /**
   * 删除任务模板
   * @param {TaskTemplate} taskTemplate - 任务模板实体
   * @returns {Promise<TResponse<void>>} 删除响应
   */
  async deleteTaskTemplate(taskTemplate: TaskTemplate): Promise<TResponse<void>> {
    const response = await this.taskTemplateRepo.findById(taskTemplate.id);
    if (!response.success || !response.data) {
      return {
        success: false,
        message: `Template with id ${taskTemplate.id} not found`,
      };
    }
    const deleteTaskTemplateResponse = await this.taskDomainService.deleteTaskTemplate(
      taskTemplate,
      this.taskTemplateRepo,
      this.taskInstanceRepo,
      true
    );
    return deleteTaskTemplateResponse;
  }

  /**
   * 更新任务模板
   * @param {TaskTemplate} taskTemplate - 任务模板实体
   * @returns {Promise<TResponse<TaskTemplate>>} 更新响应
   */
  async updateTaskTemplate(taskTemplate: TaskTemplate): Promise<TResponse<TaskTemplate>> {
    const validation = TaskTemplateValidator.validate(taskTemplate);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(", ") };
    }
    const updateResponse = await this.taskDomainService.updateTaskTemplate(
      taskTemplate,
      this.taskTemplateRepo,
      this.taskInstanceRepo
    );
    return updateResponse;
  }

  /**
   * 获取任务模板及其状态
   * @param {string} taskTemplateId - 任务模板ID
   * @returns {Promise<TResponse<TaskTemplate>>} 模板及状态响应
   */
  async getTaskTemplateWithStatus(taskTemplateId: string): Promise<TResponse<TaskTemplate>> {
    const response = await this.taskDomainService.getTaskTemplate(
      taskTemplateId,
      this.taskTemplateRepo
    );
    return response;
  }

  /**
   * 删除任务实例
   * @param {string} taskInstanceId - 任务实例ID
   * @returns {Promise<TResponse<TaskInstance["id"]>>} 删除响应
   */
  async deleteTaskInstance(taskInstanceId: string): Promise<TResponse<TaskInstance["id"]>> {
    return await this.taskDomainService.deleteTaskInstance(taskInstanceId, this.taskInstanceRepo);
  }

  /**
   * 完成任务实例
   * @param {string} taskInstanceId - 任务实例ID
   * @returns {Promise<TResponse<void>>} 完成响应
   */
  async completeTask(taskInstanceId: string): Promise<TResponse<void>> {
    const response = await this.taskInstanceRepo.findById(taskInstanceId);
    if (!response.success || !response.data) {
      console.error("Task instance not found:", taskInstanceId);
      return { success: false, message: "Task instance not found" };
    }

    const taskInstance = response.data;

    try {
      taskInstance.complete();
      const updateResponse = await this.taskInstanceRepo.update(taskInstance);
      if (!updateResponse.success) {
        console.error(`Failed to update task instance ${taskInstanceId}:`, updateResponse.message);
        return { success: false, message: updateResponse.message };
      }
      const domainEvents = taskInstance.getUncommittedDomainEvents();
      for (const event of domainEvents) {
        await EventBus.getInstance().publish(event as TaskCompletedEvent);
        console.log(`发布事件: ${event.eventType}`);
      }
      console.log(`✓ 任务实例 ${taskInstanceId} 完成成功`);
      return { success: true, message: "Task instance completed successfully" };
    } catch (error) {
      console.error(`✗ 完成任务实例 ${taskInstanceId} 失败:`, error);
      return {
        success: false,
        message: `Failed to complete task instance ${taskInstanceId}: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 撤销完成任务实例
   * @param {string} taskInstanceId - 任务实例ID
   * @returns {Promise<TResponse<void>>} 是否撤销成功
   */
  async undoCompleteTask(taskInstanceId: string): Promise<TResponse<void>> {
    const response = await this.taskInstanceRepo.findById(taskInstanceId);
    if (!response.success || !response.data) {
      throw new Error("Task instance not found");
    }

    const taskInstance = response.data;

    if (!taskInstance.isCompleted()) {
      console.warn("任务实例未完成，无法撤销");
      throw new Error("Task instance is not completed, cannot undo completion");
    }

    try {
      taskInstance.undoComplete();
      const updateResponse = await this.taskInstanceRepo.update(taskInstance);
      if (!updateResponse.success) {
        throw new Error(`Failed to update task instance ${taskInstanceId}: ${updateResponse.message}`);
      }
      const domainEvents = taskInstance.getUncommittedDomainEvents();
      for (const event of domainEvents) {
        await EventBus.getInstance().publish(event as TaskUndoCompletedEvent);
      }
      return { success: true, message: "Task instance undone successfully" };
    } catch (error) {
      console.error(`✗ 撤销任务实例 ${taskInstanceId} 完成失败:`, error);
      return {
        success: false,
        message: `Failed to undo task instance ${taskInstanceId} completion: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 开始任务实例
   * @param {string} taskInstanceId - 任务实例ID
   * @returns {Promise<boolean>} 是否开始成功
   */
  async startTask(taskInstanceId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskInstanceId);
    if (!response.success || !response.data) {
      console.error("Task instance not found:", taskInstanceId);
      return false;
    }

    try {
      response.data.start();
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task instance ${taskInstanceId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务实例 ${taskInstanceId} 开始成功`);
      return true;
    } catch (error) {
      console.error(`✗ 开始任务实例 ${taskInstanceId} 失败:`, error);
      return false;
    }
  }

  /**
   * 取消任务实例
   * @param {string} taskInstanceId - 任务实例ID
   * @returns {Promise<boolean>} 是否取消成功
   */
  async cancelTask(taskInstanceId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskInstanceId);
    if (!response.success || !response.data) {
      console.error("Task instance not found:", taskInstanceId);
      return false;
    }

    try {
      response.data.cancel();
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task instance ${taskInstanceId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务实例 ${taskInstanceId} 取消成功`);
      return true;
    } catch (error) {
      console.error(`✗ 取消任务实例 ${taskInstanceId} 失败:`, error);
      return false;
    }
  }

  /**
   * 重新安排任务实例时间
   * @param {string} taskInstanceId - 任务实例ID
   * @param {any} newScheduledTime - 新的计划时间
   * @param {any} newEndTime - 新的结束时间（可选）
   * @returns {Promise<boolean>} 是否重新安排成功
   */
  async rescheduleTask(taskInstanceId: string, newScheduledTime: any, newEndTime?: any): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskInstanceId);
    if (!response.success || !response.data) {
      console.error("Task instance not found:", taskInstanceId);
      return false;
    }

    try {
      response.data.reschedule(newScheduledTime, newEndTime);
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task instance ${taskInstanceId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务实例 ${taskInstanceId} 重新安排时间成功`);
      return true;
    } catch (error) {
      console.error(`✗ 重新安排任务实例 ${taskInstanceId} 时间失败:`, error);
      return false;
    }
  }

  // === 提醒相关操作 ===

  /**
   * 触发任务实例提醒
   * @param {string} taskInstanceId - 任务实例ID
   * @param {string} alertId - 提醒ID
   * @returns {Promise<boolean>} 是否触发成功
   */
  async triggerTaskReminder(taskInstanceId: string, alertId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskInstanceId);
    if (!response.success || !response.data) {
      console.error("Task instance not found:", taskInstanceId);
      return false;
    }

    try {
      response.data.triggerReminder(alertId);
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task instance ${taskInstanceId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务实例 ${taskInstanceId} 的提醒 ${alertId} 触发成功`);
      return true;
    } catch (error) {
      console.error(`✗ 触发任务实例 ${taskInstanceId} 的提醒失败:`, error);
      return false;
    }
  }

  /**
   * 推迟任务实例提醒
   * @param {string} taskInstanceId - 任务实例ID
   * @param {string} alertId - 提醒ID
   * @param {any} snoozeUntil - 推迟到的时间
   * @param {string} reason - 推迟原因（可选）
   * @returns {Promise<boolean>} 是否推迟成功
   */
  async snoozeTaskReminder(taskInstanceId: string, alertId: string, snoozeUntil: any, reason?: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskInstanceId);
    if (!response.success || !response.data) {
      console.error("Task instance not found:", taskInstanceId);
      return false;
    }

    try {
      response.data.snoozeReminder(alertId, snoozeUntil, reason);
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task instance ${taskInstanceId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务实例 ${taskInstanceId} 的提醒 ${alertId} 推迟成功`);
      return true;
    } catch (error) {
      console.error(`✗ 推迟任务实例 ${taskInstanceId} 的提醒失败:`, error);
      return false;
    }
  }

  /**
   * 忽略任务实例提醒
   * @param {string} taskInstanceId - 任务实例ID
   * @param {string} alertId - 提醒ID
   * @returns {Promise<boolean>} 是否忽略成功
   */
  async dismissTaskReminder(taskInstanceId: string, alertId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskInstanceId);
    if (!response.success || !response.data) {
      console.error("Task instance not found:", taskInstanceId);
      return false;
    }

    try {
      response.data.dismissReminder(alertId);
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task instance ${taskInstanceId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务实例 ${taskInstanceId} 的提醒 ${alertId} 忽略成功`);
      return true;
    } catch (error) {
      console.error(`✗ 忽略任务实例 ${taskInstanceId} 的提醒失败:`, error);
      return false;
    }
  }

  /**
   * 禁用任务实例所有提醒
   * @param {string} taskInstanceId - 任务实例ID
   * @returns {Promise<boolean>} 是否禁用成功
   */
  async disableTaskReminders(taskInstanceId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskInstanceId);
    if (!response.success || !response.data) {
      console.error("Task instance not found:", taskInstanceId);
      return false;
    }

    try {
      response.data.disableReminders();
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task instance ${taskInstanceId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务实例 ${taskInstanceId} 的提醒已禁用`);
      return true;
    } catch (error) {
      console.error(`✗ 禁用任务实例 ${taskInstanceId} 的提醒失败:`, error);
      return false;
    }
  }

  /**
   * 启用任务实例提醒
   * @param {string} taskInstanceId - 任务实例ID
   * @returns {Promise<boolean>} 是否启用成功
   */
  async enableTaskReminders(taskInstanceId: string): Promise<boolean> {
    const response = await this.taskInstanceRepo.findById(taskInstanceId);
    if (!response.success || !response.data) {
      console.error("Task instance not found:", taskInstanceId);
      return false;
    }

    try {
      response.data.enableReminders();
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task instance ${taskInstanceId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务实例 ${taskInstanceId} 的提醒已启用`);
      return true;
    } catch (error) {
      console.error(`✗ 启用任务实例 ${taskInstanceId} 的提醒失败:`, error);
      return false;
    }
  }

  // === 任务模板操作 ===

  /**
   * 激活任务模板
   * @param {string} taskTemplateId - 任务模板ID
   * @returns {Promise<boolean>} 是否激活成功
   */
  async activateTemplate(taskTemplateId: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(taskTemplateId);
    if (!response.success || !response.data) {
      console.error("Task template not found:", taskTemplateId);
      return false;
    }

    try {
      response.data.activate();
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task template ${taskTemplateId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务模板 ${taskTemplateId} 激活成功`);
      return true;
    } catch (error) {
      console.error(`✗ 激活任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 暂停任务模板
   * @param {string} taskTemplateId - 任务模板ID
   * @returns {Promise<boolean>} 是否暂停成功
   */
  async pauseTemplate(taskTemplateId: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(taskTemplateId);
    if (!response.success || !response.data) {
      console.error("Task template not found:", taskTemplateId);
      return false;
    }

    try {
      const pauseResponse = await this.taskDomainService.pauseTaskTemplate(
        response.data,
        this.taskTemplateRepo,
        this.taskInstanceRepo
      );
      return pauseResponse.success;
    } catch (error) {
      console.error(`✗ 暂停任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 恢复任务模板
   * @param {string} taskTemplateId - 任务模板ID
   * @returns {Promise<boolean>} 是否恢复成功
   */
  async resumeTemplate(taskTemplateId: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(taskTemplateId);
    if (!response.success || !response.data) {
      console.error("Task template not found:", taskTemplateId);
      return false;
    }
    try {
      const resumeResponse = await this.taskDomainService.resumeTaskTemplate(
        response.data,
        this.taskTemplateRepo,
        this.taskInstanceRepo
      );
      return resumeResponse.success;
    } catch (error) {
      console.error(`✗ 恢复任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 归档任务模板
   * @param {string} taskTemplateId - 任务模板ID
   * @returns {Promise<boolean>} 是否归档成功
   */
  async archiveTemplate(taskTemplateId: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(taskTemplateId);
    if (!response.success || !response.data) {
      console.error("Task template not found:", taskTemplateId);
      return false;
    }

    try {
      response.data.archive();
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task template ${taskTemplateId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务模板 ${taskTemplateId} 归档成功`);
      return true;
    } catch (error) {
      console.error(`✗ 归档任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 更新任务模板标题
   * @param {string} taskTemplateId - 任务模板ID
   * @param {string} title - 新标题
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateTemplateTitle(taskTemplateId: string, title: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(taskTemplateId);
    if (!response.success || !response.data) {
      console.error("Task template not found:", taskTemplateId);
      return false;
    }

    try {
      response.data.updateTitle(title);
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task template ${taskTemplateId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务模板 ${taskTemplateId} 标题更新成功`);
      return true;
    } catch (error) {
      console.error(`✗ 更新任务模板 ${taskTemplateId} 标题失败:`, error);
      return false;
    }
  }

  /**
   * 更新任务模板描述
   * @param {string} taskTemplateId - 任务模板ID
   * @param {string} description - 新描述（可选）
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateTemplateDescription(taskTemplateId: string, description?: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(taskTemplateId);
    if (!response.success || !response.data) {
      console.error("Task template not found:", taskTemplateId);
      return false;
    }

    try {
      response.data.updateDescription(description);
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task template ${taskTemplateId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务模板 ${taskTemplateId} 描述更新成功`);
      return true;
    } catch (error) {
      console.error(`✗ 更新任务模板 ${taskTemplateId} 描述失败:`, error);
      return false;
    }
  }

  /**
   * 设置任务模板优先级
   * @param {string} taskTemplateId - 任务模板ID
   * @param {1 | 2 | 3 | 4 | 5} priority - 优先级（可选）
   * @returns {Promise<boolean>} 是否设置成功
   */
  async setTemplatePriority(taskTemplateId: string, priority?: 1 | 2 | 3 | 4 | 5): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(taskTemplateId);
    if (!response.success || !response.data) {
      console.error("Task template not found:", taskTemplateId);
      return false;
    }

    try {
      response.data.setPriority(priority);
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task template ${taskTemplateId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务模板 ${taskTemplateId} 优先级설정成功`);
      return true;
    } catch (error) {
      console.error(`✗ 设置任务模板 ${taskTemplateId} 优先级失败:`, error);
      return false;
    }
  }

  /**
   * 添加任务模板标签
   * @param {string} taskTemplateId - 任务模板ID
   * @param {string} tag - 标签
   * @returns {Promise<boolean>} 是否添加成功
   */
  async addTemplateTag(taskTemplateId: string, tag: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(taskTemplateId);
    if (!response.success || !response.data) {
      console.error("Task template not found:", taskTemplateId);
      return false;
    }

    try {
      response.data.addTag(tag);
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task template ${taskTemplateId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务模板 ${taskTemplateId} 添加标签成功`);
      return true;
    } catch (error) {
      console.error(`✗ 任务模板 ${taskTemplateId} 添加标签失败:`, error);
      return false;
    }
  }

  /**
   * 移除任务模板标签
   * @param {string} taskTemplateId - 任务模板ID
   * @param {string} tag - 标签
   * @returns {Promise<boolean>} 是否移除成功
   */
  async removeTemplateTag(taskTemplateId: string, tag: string): Promise<boolean> {
    const response = await this.taskTemplateRepo.findById(taskTemplateId);
    if (!response.success || !response.data) {
      console.error("Task template not found:", taskTemplateId);
      return false;
    }

    try {
      response.data.removeTag(tag);
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      if (!updateResponse.success) {
        console.error(`Failed to update task template ${taskTemplateId}:`, updateResponse.message);
        return false;
      }
      console.log(`✓ 任务模板 ${taskTemplateId} 移除标签成功`);
      return true;
    } catch (error) {
      console.error(`✗ 任务模板 ${taskTemplateId} 移除标签失败:`, error);
      return false;
    }
  }

  // === 统计分析 ===

  /**
   * 获取目标相关的任务统计信息
   * @param {string} goalId - 目标ID
   * @returns {Promise<any>} 任务统计数据
   */
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

    const allTasks = allTasksResponse.success ? allTasksResponse.data || [] : [];
    const allTemplates = allTemplatesResponse.success ? allTemplatesResponse.data || [] : [];

    const tasks = allTasks.filter((task) => {
      const isRelatedToGoal = task.keyResultLinks?.some((link) => link.goalId === goalId);
      return (
        isRelatedToGoal &&
        task.scheduledTime.timestamp >= startTime.timestamp &&
        task.scheduledTime.timestamp <= endTime.timestamp &&
        task.scheduledTime.timestamp <= now.timestamp
      );
    });

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
      {} as Record<string, { templateId: string; title: string; total: number; completed: number; }>
    );

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
          completionRate: stats.total ? (stats.completed / stats.total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total),
    };
  }

  /**
   * 获取任务完成时间线
   * @param {string} goalId - 目标ID
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<any[]>} 任务完成时间线数据
   */
  async getTaskCompletionTimeline(goalId: string, startDate: string, endDate: string): Promise<any[]> {
    const timeline: Record<string, { total: number; completed: number; date: string; }> = {};

    const start = TimeUtils.fromISOString(new Date(startDate).toISOString());
    const end = TimeUtils.fromISOString(new Date(endDate).toISOString());

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

      const nextDay = new Date(currentDate.timestamp);
      nextDay.setDate(nextDay.getDate() + 1);
      currentDate = TimeUtils.fromTimestamp(nextDay.getTime());
    }

    const allTasksResponse = await this.taskInstanceRepo.findAll();
    const allTasks = allTasksResponse.success ? allTasksResponse.data || [] : [];

    allTasks
      .filter((task) => {
        const isRelatedToGoal = task.keyResultLinks?.some((link) => link.goalId === goalId);
        return (
          isRelatedToGoal &&
          task.scheduledTime.timestamp >= start.timestamp &&
          task.scheduledTime.timestamp <= end.timestamp
        );
      })
      .forEach((task) => {
        const dateStr = `${task.scheduledTime.date.year}-${task.scheduledTime.date.month
          .toString()
          .padStart(2, "0")}-${task.scheduledTime.date.day.toString().padStart(2, "0")}`;
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