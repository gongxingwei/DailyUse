import type { 
  TaskResponse,

  TaskStats,
  TaskTimeline,
  ITaskTemplate,
  ITaskInstance,
  ITaskMetaTemplate
} from '@/modules/Task/domain/types/task';

/**
 * 任务模块 IPC 客户端
 * 负责与主进程的 IPC 通信，只处理数据传输，不涉及业务逻辑
 */
export class TaskIpcClient {
  
  // === MetaTemplate IPC 调用 ===

  /**
   * 获取所有元模板
   */
  async getAllMetaTemplates(): Promise<TaskResponse<ITaskMetaTemplate[]>> {
    return await window.shared.ipcRenderer.invoke('task:meta-templates:get-all');
  }

  /**
   * 根据ID获取元模板
   */
  async getMetaTemplate(id: string): Promise<TaskResponse<ITaskMetaTemplate>> {
    return await window.shared.ipcRenderer.invoke('task:meta-templates:get-by-id', id);
  }

  /**
   * 根据分类获取元模板
   */
  async getMetaTemplatesByCategory(category: string): Promise<TaskResponse<ITaskMetaTemplate[]>> {
    return await window.shared.ipcRenderer.invoke('task:meta-templates:get-by-category', category);
  }

  /**
   * 保存元模板
   */
  async saveMetaTemplate(metaTemplateData: any): Promise<TaskResponse<ITaskMetaTemplate>> {
    return await window.shared.ipcRenderer.invoke('task:meta-templates:save', metaTemplateData);
  }

  /**
   * 删除元模板
   */
  async deleteMetaTemplate(id: string): Promise<TaskResponse<boolean>> {
    return await window.shared.ipcRenderer.invoke('task:meta-templates:delete', id);
  }

  // === TaskTemplate IPC 调用 ===

  /**
   * 根据ID获取任务模板
   */
  async getTaskTemplate(taskTemplateId: string): Promise<TaskResponse<ITaskTemplate>> {
    return await window.shared.ipcRenderer.invoke('task:templates:get-by-id', taskTemplateId);
  }

  /**
   * 获取所有任务模板
   */
  async getAllTaskTemplates(): Promise<TaskResponse<ITaskTemplate[]>> {
    return await window.shared.ipcRenderer.invoke('task:templates:get-all');
  }

  /**
   * 根据关键结果获取任务模板
   */
  async getTaskTemplateForKeyResult(goalId: string, keyResultId: string): Promise<TaskResponse<ITaskTemplate[]>> {
    return await window.shared.ipcRenderer.invoke('task:templates:get-by-key-result', goalId, keyResultId);
  }

  /**
   * 创建任务模板
   */
  async createTaskTemplate(dto: ITaskTemplate): Promise<TaskResponse<ITaskTemplate>> {
    return await window.shared.ipcRenderer.invoke('task:templates:create', dto);
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(dto: ITaskTemplate): Promise<TaskResponse<ITaskTemplate>> {
    return await window.shared.ipcRenderer.invoke('task:templates:update', dto);
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(taskTemplateId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:templates:delete', taskTemplateId);
  }

  /**
   * 激活任务模板
   */
  async activateTaskTemplate(taskTemplateId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:templates:activate', taskTemplateId);
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(taskTemplateId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:templates:pause', taskTemplateId);
  }

  /**
   * 恢复任务模板
   */
  async resumeTaskTemplate(taskTemplateId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:templates:resume', taskTemplateId);
  }

  /**
   * 归档任务模板
   */
  async archiveTaskTemplate(taskTemplateId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:templates:archive', taskTemplateId);
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
  ): Promise<TaskResponse<ITaskTemplate>> {
    return await window.shared.ipcRenderer.invoke(
      'task:templates:create-from-meta-template', 
      metaTemplateId, 
      title, 
      customOptions
    );
  }

  /**
   * 保存任务模板（创建或更新）
   */
  async saveTaskTemplate(taskTemplateData: any): Promise<TaskResponse<ITaskTemplate>> {
    return await window.shared.ipcRenderer.invoke('task:templates:save', taskTemplateData);
  }

  // === TaskInstance IPC 调用 ===

  /**
   * 根据ID获取任务实例
   */
  async getTaskInstance(taskInstanceId: string): Promise<TaskResponse<ITaskInstance>> {
    return await window.shared.ipcRenderer.invoke('task:instances:get-by-id', taskInstanceId);
  }

  /**
   * 获取所有任务实例
   */
  async getAllTaskInstances(): Promise<TaskResponse<ITaskInstance[]>> {
    return await window.shared.ipcRenderer.invoke('task:instances:get-all');
  }

  /**
   * 获取今日任务
   */
  async getTodayTasks(): Promise<TaskResponse<ITaskInstance[]>> {
    return await window.shared.ipcRenderer.invoke('task:instances:get-today');
  }

  /**
   * 创建任务实例
   */
  async createTaskInstance(dto: ITaskInstance): Promise<TaskResponse<ITaskInstance>> {
    return await window.shared.ipcRenderer.invoke('task:instances:create', dto);
  }

  /**
   * 开始执行任务实例
   */
  async startTaskInstance(taskInstanceId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:instances:start', taskInstanceId);
  }

  /**
   * 完成任务实例
   */
  async completeTaskInstance(taskInstanceId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:instances:complete', taskInstanceId);
  }

  /**
   * 撤销完成任务实例
   */
  async undoCompleteTaskInstance(taskInstanceId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:instances:undo-complete', taskInstanceId);
  }

  /**
   * 取消任务实例
   */
  async cancelTaskInstance(taskInstanceId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:instances:cancel', taskInstanceId);
  }

  /**
   * 延期任务实例
   */
  async rescheduleTaskInstance(taskInstanceId: string, newScheduledTime: string, newEndTime?: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:instances:reschedule', taskInstanceId, newScheduledTime, newEndTime);
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(taskInstanceId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:instances:delete', taskInstanceId);
  }

  // === 提醒相关 IPC 调用 ===

  /**
   * 初始化任务提醒系统
   */
  async initializeTaskReminders(): Promise<TaskResponse<boolean>> {
    return await window.shared.ipcRenderer.invoke('task:reminders:initialize');
  }

  /**
   * 刷新任务提醒
   */
  async refreshTaskReminders(): Promise<TaskResponse<boolean>> {
    return await window.shared.ipcRenderer.invoke('task:reminders:refresh');
  }

  /**
   * 触发提醒
   */
  async triggerReminder(instanceId: string, alertId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:instances:trigger-reminder', instanceId, alertId);
  }

  /**
   * 延迟提醒
   */
  async snoozeReminder(instanceId: string, alertId: string, snoozeUntil: string, reason?: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:instances:snooze-reminder', instanceId, alertId, snoozeUntil, reason);
  }

  /**
   * 忽略提醒
   */
  async dismissReminder(instanceId: string, alertId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:instances:dismiss-reminder', instanceId, alertId);
  }

  /**
   * 启用提醒
   */
  async enableReminders(instanceId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:instances:enable-reminders', instanceId);
  }

  /**
   * 禁用提醒
   */
  async disableReminders(instanceId: string): Promise<TaskResponse<void>> {
    return await window.shared.ipcRenderer.invoke('task:instances:disable-reminders', instanceId);
  }

  // === 统计分析相关 IPC 调用 ===

  /**
   * 获取目标下的任务统计
   */
  async getTaskStatsForGoal(goalId: string): Promise<TaskResponse<TaskStats>> {
    return await window.shared.ipcRenderer.invoke('task:stats:get-for-goal', goalId);
  }

  /**
   * 获取任务完成时间线
   */
  async getTaskCompletionTimeline(goalId: string, startDate: string, endDate: string): Promise<TaskResponse<TaskTimeline[]>> {
    return await window.shared.ipcRenderer.invoke('task:stats:get-completion-timeline', goalId, startDate, endDate);
  }
}

export const taskIpcClient = new TaskIpcClient();
