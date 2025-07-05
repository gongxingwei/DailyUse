import { TaskTemplate, TaskTemplateMapper } from '@/modules/Task/domain/entities/taskTemplate';
import { TaskInstance, TaskInstanceMapper } from '@/modules/Task/domain/entities/taskInstance';
import { taskIpcClient } from '@/modules/Task/infrastructure/ipc/taskIpcClient';
import type { 
    ITaskTemplate,
    ITaskInstance,

  TaskStats,
  TaskTimeline
} from '@/modules/Task/domain/types/task';

/**
 * 任务应用服务 - 符合 DDD 架构
 * 位于 Application 层，负责协调业务操作、数据转换和 IPC 通信
 * 
 * 职责：
 * 1. 调用基础设施层的 IPC 客户端
 * 2. 使用 Mapper 自动转换 DTO 为领域对象
 * 3. 为 UI 层提供简洁的业务接口
 * 4. 处理错误和异常情况
 */
export class TaskDomainApplicationService {

  // === MetaTemplate 相关操作 ===

  /**
   * 获取所有元模板
   */
  async getAllMetaTemplates() {
    try {
      const response = await taskIpcClient.getAllMetaTemplates();
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error('Failed to get meta templates:', error);
      return [];
    }
  }

  /**
   * 根据ID获取元模板
   */
  async getMetaTemplate(id: string) {
    try {
      const response = await taskIpcClient.getMetaTemplate(id);
      return response.success ? response.data || null : null;
    } catch (error) {
      console.error('Failed to get meta template:', error);
      return null;
    }
  }

  /**
   * 根据分类获取元模板
   */
  async getMetaTemplatesByCategory(category: string) {
    try {
      const response = await taskIpcClient.getMetaTemplatesByCategory(category);
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error('Failed to get meta templates by category:', error);
      return [];
    }
  }

  // === TaskTemplate 相关操作 ===

  /**
   * 根据ID获取任务模板（返回领域对象）
   */
  async getTaskTemplate(taskTemplateId: string): Promise<TaskTemplate | null> {
    try {
      const response = await taskIpcClient.getTaskTemplate(taskTemplateId);
      if (response.success && response.data) {
        return TaskTemplateMapper.fromDTO(response.data);
      }
      return null;
    } catch (error) {
      console.error('Failed to get task template:', error);
      return null;
    }
  }

  /**
   * 获取所有任务模板（返回领域对象数组）
   */
  async getAllTaskTemplates(): Promise<TaskTemplate[]> {
    try {
      const response = await taskIpcClient.getAllTaskTemplates();
      if (response.success && response.data) {
        return TaskTemplateMapper.fromDTOArray(response.data);
      }
      return [];
    } catch (error) {
      console.error('Failed to get all task templates:', error);
      return [];
    }
  }

  /**
   * 根据关键结果获取任务模板（返回领域对象数组）
   */
  async getTaskTemplateForKeyResult(goalId: string, keyResultId: string): Promise<TaskTemplate[]> {
    try {
      const response = await taskIpcClient.getTaskTemplateForKeyResult(goalId, keyResultId);
      if (response.success && response.data) {
        return TaskTemplateMapper.fromDTOArray(response.data);
      }
      return [];
    } catch (error) {
      console.error('Failed to get task templates for key result:', error);
      return [];
    }
  }

  /**
   * 创建任务模板
   */
  async createTaskTemplate(dto: ITaskTemplate): Promise<{ 
    success: boolean; 
    template?: TaskTemplate; 
    message?: string; 
  }> {
    try {
      const response = await taskIpcClient.createTaskTemplate(dto);
      return {
        success: response.success,
        template: response.success && response.data ? TaskTemplateMapper.fromDTO(response.data) : undefined,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to create task template:', error);
      return { success: false, message: 'Failed to create task template' };
    }
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(dto: ITaskTemplate): Promise<{ 
    success: boolean; 
    template?: TaskTemplate; 
    message?: string; 
  }> {
    try {
      const response = await taskIpcClient.updateTaskTemplate(dto);
      return {
        success: response.success,
        template: response.success && response.data ? TaskTemplateMapper.fromDTO(response.data) : undefined,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to update task template:', error);
      return { success: false, message: 'Failed to update task template' };
    }
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(taskTemplateId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.deleteTaskTemplate(taskTemplateId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to delete task template:', error);
      return { success: false, message: 'Failed to delete task template' };
    }
  }

  /**
   * 激活任务模板
   */
  async activateTaskTemplate(taskTemplateId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.activateTaskTemplate(taskTemplateId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to activate task template:', error);
      return { success: false, message: 'Failed to activate task template' };
    }
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(taskTemplateId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.pauseTaskTemplate(taskTemplateId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to pause task template:', error);
      return { success: false, message: 'Failed to pause task template' };
    }
  }

  /**
   * 恢复任务模板
   */
  async resumeTaskTemplate(taskTemplateId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.resumeTaskTemplate(taskTemplateId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to resume task template:', error);
      return { success: false, message: 'Failed to resume task template' };
    }
  }

  /**
   * 归档任务模板
   */
  async archiveTaskTemplate(taskTemplateId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.archiveTaskTemplate(taskTemplateId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to archive task template:', error);
      return { success: false, message: 'Failed to archive task template' };
    }
  }

  /**
   * 从元模板创建任务模板（新架构推荐方式）
   * 主进程返回完整的任务模板对象，渲染进程只需要修改和展示
   */
  async createTaskTemplateFromMetaTemplate(
    metaTemplateId: string, 
    title: string, 
    customOptions?: {
      description?: string;
      priority?: number;
      tags?: string[];
    }
  ): Promise<TaskTemplate> {
    try {
      const response = await taskIpcClient.createTaskTemplateFromMetaTemplate(
        metaTemplateId, 
        title, 
        customOptions
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create task template from meta template');
      }

      return TaskTemplateMapper.fromDTO(response.data);
    } catch (error) {
      console.error('Error creating task template from meta template:', error);
      throw error;
    }
  }

  // === TaskInstance 相关操作 ===

  /**
   * 根据ID获取任务实例（返回领域对象）
   */
  async getTaskInstance(taskInstanceId: string): Promise<TaskInstance | null> {
    try {
      const response = await taskIpcClient.getTaskInstance(taskInstanceId);
      if (response.success && response.data) {
        return TaskInstanceMapper.fromDTO(response.data);
      }
      return null;
    } catch (error) {
      console.error('Failed to get task instance:', error);
      return null;
    }
  }

  /**
   * 获取所有任务实例（返回领域对象数组）
   */
  async getAllTaskInstances(): Promise<TaskInstance[]> {
    try {
      const response = await taskIpcClient.getAllTaskInstances();
      if (response.success && response.data) {
        return TaskInstanceMapper.fromDTOArray(response.data);
      }
      return [];
    } catch (error) {
      console.error('Failed to get all task instances:', error);
      return [];
    }
  }

  /**
   * 获取今日任务（返回领域对象数组）
   */
  async getTodayTasks(): Promise<TaskInstance[]> {
    try {
      const response = await taskIpcClient.getTodayTasks();
      if (response.success && response.data) {
        return TaskInstanceMapper.fromDTOArray(response.data);
      }
      return [];
    } catch (error) {
      console.error('Failed to get today tasks:', error);
      return [];
    }
  }

  /**
   * 创建任务实例
   */
  async createTaskInstance(dto: ITaskInstance): Promise<{ 
    success: boolean; 
    instance?: TaskInstance; 
    message?: string; 
  }> {
    try {
      const response = await taskIpcClient.createTaskInstance(dto);
      return {
        success: response.success,
        instance: response.success && response.data ? TaskInstanceMapper.fromDTO(response.data) : undefined,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to create task instance:', error);
      return { success: false, message: 'Failed to create task instance' };
    }
  }

  /**
   * 开始执行任务实例
   */
  async startTaskInstance(taskInstanceId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.startTaskInstance(taskInstanceId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to start task instance:', error);
      return { success: false, message: 'Failed to start task instance' };
    }
  }

  /**
   * 完成任务实例
   */
  async completeTaskInstance(taskInstanceId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.completeTaskInstance(taskInstanceId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to complete task instance:', error);
      return { success: false, message: 'Failed to complete task instance' };
    }
  }

  /**
   * 撤销完成任务实例
   */
  async undoCompleteTaskInstance(taskInstanceId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.undoCompleteTaskInstance(taskInstanceId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to undo complete task instance:', error);
      return { success: false, message: 'Failed to undo complete task instance' };
    }
  }

  /**
   * 取消任务实例
   */
  async cancelTaskInstance(taskInstanceId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.cancelTaskInstance(taskInstanceId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to cancel task instance:', error);
      return { success: false, message: 'Failed to cancel task instance' };
    }
  }

  /**
   * 延期任务实例
   */
  async rescheduleTaskInstance(taskInstanceId: string, newScheduledTime: string, newEndTime?: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.rescheduleTaskInstance(taskInstanceId, newScheduledTime, newEndTime);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to reschedule task instance:', error);
      return { success: false, message: 'Failed to reschedule task instance' };
    }
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(taskInstanceId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.deleteTaskInstance(taskInstanceId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to delete task instance:', error);
      return { success: false, message: 'Failed to delete task instance' };
    }
  }

  // === 提醒相关操作 ===

  /**
   * 触发提醒
   */
  async triggerReminder(instanceId: string, alertId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.triggerReminder(instanceId, alertId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to trigger reminder:', error);
      return { success: false, message: 'Failed to trigger reminder' };
    }
  }

  /**
   * 延迟提醒
   */
  async snoozeReminder(instanceId: string, alertId: string, snoozeUntil: string, reason?: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.snoozeReminder(instanceId, alertId, snoozeUntil, reason);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
      return { success: false, message: 'Failed to snooze reminder' };
    }
  }

  /**
   * 忽略提醒
   */
  async dismissReminder(instanceId: string, alertId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.dismissReminder(instanceId, alertId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to dismiss reminder:', error);
      return { success: false, message: 'Failed to dismiss reminder' };
    }
  }

  /**
   * 启用提醒
   */
  async enableReminders(instanceId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.enableReminders(instanceId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to enable reminders:', error);
      return { success: false, message: 'Failed to enable reminders' };
    }
  }

  /**
   * 禁用提醒
   */
  async disableReminders(instanceId: string): Promise<{ success: boolean; message?: string; }> {
    try {
      const response = await taskIpcClient.disableReminders(instanceId);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to disable reminders:', error);
      return { success: false, message: 'Failed to disable reminders' };
    }
  }

  /**
   * 初始化任务提醒系统
   */
  async initializeTaskReminders(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.initializeTaskReminders();
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to initialize task reminders:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '初始化提醒失败'
      };
    }
  }

  /**
   * 刷新任务提醒
   */
  async refreshTaskReminders(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.refreshTaskReminders();
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to refresh task reminders:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '刷新提醒失败'
      };
    }
  }

  // === 统计分析相关操作 ===

  /**
   * 获取目标下的任务统计
   */
  async getTaskStatsForGoal(goalId: string): Promise<TaskStats | null> {
    try {
      const response = await taskIpcClient.getTaskStatsForGoal(goalId);
      return response.success ? response.data || null : null;
    } catch (error) {
      console.error('Failed to get task stats for goal:', error);
      return null;
    }
  }

  /**
   * 获取任务完成时间线
   */
  async getTaskCompletionTimeline(goalId: string, startDate: string, endDate: string): Promise<TaskTimeline[]> {
    try {
      const response = await taskIpcClient.getTaskCompletionTimeline(goalId, startDate, endDate);
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error('Failed to get task completion timeline:', error);
      return [];
    }
  }
}

export const taskDomainApplicationService = new TaskDomainApplicationService();
