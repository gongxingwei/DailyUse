import { useTaskStore } from "../stores/taskStore";
import { TaskReminderService } from "./taskReminderService";
import type { TaskTemplate, ITaskInstance } from "../types/task";
import type { TResponse } from "@/shared/types/response";
import { taskTemplateService } from "./taskTemplateService";
import { taskInstanceService } from "./taskInstanceService";
/**
 * 任务领域服务 - 负责协调各个服务的复杂业务操作
 */
export class TaskDomainService {
  private static instance: TaskDomainService;
  private taskStore = useTaskStore();
  private reminderService = TaskReminderService.getInstance();

  private constructor() {}

  static getInstance(): TaskDomainService {
    if (!TaskDomainService.instance) {
      TaskDomainService.instance = new TaskDomainService();
    }
    return TaskDomainService.instance;
  }

  async addTask(template: TaskTemplate): Promise<TResponse<ITaskInstance[]>> {
    try {
      // 1. 生成任务模板
      const response = await taskTemplateService.addTaskTemplate(template);
        if (!response.success) {
            throw new Error(`添加任务模板失败: ${response.message}`);
        }
      // 2. 生成任务实例
      const instances = taskInstanceService.generateInstancesFromTemplate(template);
      if (instances.length === 0) {
        throw new Error('生成的任务实例为空，请检查模板配置');
      }

      // 3. 保存任务实例
      this.taskStore.addTaskInstances(instances);
      await this.taskStore.saveTaskInstances();

      // 4. 创建提醒
      for (const instance of instances) {
        await this.reminderService.createTaskReminders(instance, template);
      }

      console.log(`✅ 成功添加任务`, instances);

      return {
        success: true,
        message: `成功添加 ${instances.length} 个任务实例`,
        data: instances
      };

    } catch (error) {
      console.error('❌ 添加任务失败:', error);
      return {
        success: false,
        message: `添加任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
        data: undefined
      };
    }
  }

  /**
   * 删除任务模板及其所有相关数据
   * 这是一个完整的业务操作，包含：
   * 1. 取消所有相关任务实例的提醒
   * 2. 删除所有相关的任务实例
   * 3. 删除任务模板本身
   */
  async deleteTask(templateId: string): Promise<TResponse<{
    templateTitle: string;
    deletedInstances: number;
    cancelInstancesRemindersMessage: string;
  }>> {
    try {
      // 1. 验证模板存在
      const template = this.taskStore.getTaskTemplateById(templateId);
      if (!template) {
        throw new Error('任务模板不存在');
      }

      // 2. 获取所有相关的任务实例
      const relatedInstances = this.taskStore.taskInstances.filter(
        instance => instance.templateId === templateId
      );

      console.log(`📋 发现 ${relatedInstances.length} 个相关任务实例`);

      // 3. 批量取消提醒
      const { message } = await this.cancelInstancesReminders(relatedInstances);

      // 4. 删除任务实例
      const deletedInstances = this.deleteInstances(relatedInstances);

      // 5. 删除模板
      const templateDeleted = this.taskStore.deleteTaskTemplateById(templateId);
      if (!templateDeleted) {
        throw new Error('删除任务模板失败');
      }

      // 6. 保存变更
      await this.taskStore.saveTaskInstances();
      await this.taskStore.saveTaskTemplates();

      const result = {
        templateTitle: template.title,
        deletedInstances,
        cancelInstancesRemindersMessage: message,
      };

      console.log(`✅ 成功删除任务模板`, result);

      return {
        success: true,
        message: `成功删除任务模板 "${template.title}" 及其 ${deletedInstances} 个相关实例`,
        data: result
      };

    } catch (error) {
      console.error('❌ 删除任务模板失败:', error);
      return {
        success: false,
        message: `删除任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
        data: undefined
      };
    }
  }

  /**
   * 删除单个任务实例及其提醒
   */
  async deleteTaskInstance(taskId: string): Promise<TResponse<{
    taskTitle: string;
    cancelInstancesRemindersMessage: string;
  }>> {
    try {
      // 1. 验证实例存在
      const instance = this.taskStore.getTaskInstanceById(taskId);
      if (!instance) {
        return {
          success: false,
          message: '任务实例不存在',
          data: undefined
        };
      }

      console.log(`🗑️ 开始删除任务实例: ${instance.title}`);

      // 2. 取消提醒
      const { message } = await this.cancelInstanceReminders(instance);

      // 3. 删除实例
      const instanceDeleted = this.taskStore.deleteTaskInstanceById(taskId);
      if (!instanceDeleted) {
        throw new Error('删除任务实例失败');
      }

      // 4. 保存变更
      await this.taskStore.saveTaskInstances();

      const result = {
        taskTitle: instance.title,
        cancelInstancesRemindersMessage: message,
      };

      console.log(`✅ 成功删除任务实例`, result);

      return {
        success: true,
        message: `成功删除任务实例 "${instance.title}"`,
        data: result
      };

    } catch (error) {
      console.error('❌ 删除任务实例失败:', error);
      return {
        success: false,
        message: `删除任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`,
        data: undefined
      };
    }
  }

  /**
   * 批量删除任务实例
   */
  async batchDeleteTaskInstances(taskIds: string[]): Promise<TResponse<{
    successCount: number;
    failedCount: number;
    totalCancelledReminders: number;
    results: Array<{ taskId: string; success: boolean; error?: string }>;
  }>> {
    const results: Array<{ taskId: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    let failedCount = 0;
    let totalCancelledReminders = 0;

    console.log(`🗑️ 开始批量删除 ${taskIds.length} 个任务实例`);

    for (const taskId of taskIds) {
      try {
        const result = await this.deleteTaskInstance(taskId);
        if (result.success) {
          successCount++;
          results.push({ taskId, success: true });
        } else {
          failedCount++;
          results.push({ taskId, success: false, error: result.message });
        }
      } catch (error) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        results.push({ taskId, success: false, error: errorMessage });
      }
    }

    const data = {
      successCount,
      failedCount,
      totalCancelledReminders,
      results
    };

    console.log(`✅ 批量删除完成`, data);

    return {
      success: failedCount === 0,
      message: `批量删除完成：成功 ${successCount} 个，失败 ${failedCount} 个`,
      data
    };
  }

  // ========== 私有辅助方法 ==========

  /**
   * 取消多个任务实例的提醒
   */
  private async cancelInstancesReminders(instances: ITaskInstance[]): Promise<TResponse<{ cancelledCount: number; failedCount: number }>> {
    let failedCount = 0;
    let totalCancelled = 0;
    for (const instance of instances) {
      totalCancelled++;
      try {
        const response = await this.cancelInstanceReminders(instance);
        if (!response.success) {
          console.warn(`取消任务实例 ${instance.id} 的提醒失败: ${response.message}`);
          failedCount++;
        }
      } catch (error) {
        console.warn(`取消任务实例 ${instance.id} 的提醒失败:`, error);
      }
    }

    return {
      success: true,
      message: `成功取消 ${totalCancelled - failedCount} 个任务实例的提醒，失败 ${failedCount} 个`,
      data: {
        cancelledCount: totalCancelled - failedCount,
        failedCount
      }
    }
  }

  /**
   * 取消单个任务实例的提醒
   */
  private async cancelInstanceReminders(instance: ITaskInstance): Promise<TResponse<void>> {
    try {
      const result = await this.reminderService.cancelTaskInstanceReminders(instance.id);
      if (!result.success) {
        throw new Error(result.message);
      }
      return {
        success: true,
        message: `成功取消任务实例 ${instance.id} 的提醒`,
        data: undefined
      }
    } catch (error) {
      console.warn(`取消任务实例 ${instance.id} 的提醒失败:`, error);
      return {
        success: false,
        message: `取消任务实例 ${instance.id} 的提醒失败: ${error instanceof Error ? error.message : '未知错误'}`,
        data: undefined
      };
    }
  }

  /**
   * 删除多个任务实例（仅数据删除，不处理提醒）
   */
  private deleteInstances(instances: ITaskInstance[]): number {
    let deletedCount = 0;

    for (const instance of instances) {
      const success = this.taskStore.deleteTaskInstanceById(instance.id);
      if (success) {
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

export const taskDomainService = TaskDomainService.getInstance();