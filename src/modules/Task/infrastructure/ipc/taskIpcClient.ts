import type { 
  TaskResponse,
  TaskStats,
  TaskTimeline,
  ITaskTemplate,
  ITaskInstance,
  ITaskMetaTemplate
} from '@/modules/Task/domain/types/task';
import { serializeForIpc, deepSerializeForIpc } from '@/shared/utils/ipcSerialization';
import { ipcInvokeWithAuth } from '@/shared/utils/ipcInvokeWithAuth';

/**
 * 任务模块 IPC 客户端
 * 负责与主进程的 IPC 通信，只处理数据传输，不涉及业务逻辑
 */
export class TaskIpcClient {
  
  // === MetaTemplate IPC 调用 ===

  async getAllMetaTemplates(): Promise<TaskResponse<ITaskMetaTemplate[]>> {
    return await ipcInvokeWithAuth('task:meta-templates:get-all');
  }

  async getMetaTemplate(uuid: string): Promise<TaskResponse<ITaskMetaTemplate>> {
    return await ipcInvokeWithAuth('task:meta-templates:get-by-id', uuid);
  }

  async getMetaTemplatesByCategory(category: string): Promise<TaskResponse<ITaskMetaTemplate[]>> {
    return await ipcInvokeWithAuth('task:meta-templates:get-by-category', category);
  }

  async saveMetaTemplate(metaTemplateData: any): Promise<TaskResponse<ITaskMetaTemplate>> {
    return await ipcInvokeWithAuth('task:meta-templates:save', serializeForIpc(metaTemplateData));
  }

  async deleteMetaTemplate(uuid: string): Promise<TaskResponse<boolean>> {
    return await ipcInvokeWithAuth('task:meta-templates:delete', uuid);
  }

  // === TaskTemplate IPC 调用 ===

  async getTaskTemplate(taskTemplateId: string): Promise<TaskResponse<ITaskTemplate>> {
    return await ipcInvokeWithAuth('task:templates:get-by-id', taskTemplateId);
  }

  async getAllTaskTemplates(): Promise<TaskResponse<ITaskTemplate[]>> {
    return await ipcInvokeWithAuth('task:templates:get-all');
  }

  async getTaskTemplateForKeyResult(goalUuid: string, keyResultId: string): Promise<TaskResponse<ITaskTemplate[]>> {
    return await ipcInvokeWithAuth('task:templates:get-by-key-result', goalUuid, keyResultId);
  }

  async createTaskTemplate(dto: ITaskTemplate): Promise<TaskResponse<ITaskTemplate>> {
    const deepSerializedDto = deepSerializeForIpc(serializeForIpc(dto));
    return await ipcInvokeWithAuth('task:templates:create', deepSerializedDto);
  }

  async updateTaskTemplate(dto: ITaskTemplate): Promise<TaskResponse<ITaskTemplate>> {
    return await ipcInvokeWithAuth('task:templates:update', deepSerializeForIpc(dto));
  }

  async deleteTaskTemplate(taskTemplateId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:delete', taskTemplateId);
  }

  async deleteAllTaskTemplates(): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:delete-all');
  }

  async activateTaskTemplate(taskTemplateId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:activate', taskTemplateId);
  }

  async pauseTaskTemplate(taskTemplateId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:pause', taskTemplateId);
  }

  async resumeTaskTemplate(taskTemplateId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:resume', taskTemplateId);
  }

  async archiveTaskTemplate(taskTemplateId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:archive', taskTemplateId);
  }

  async createTaskTemplateFromMetaTemplate(
    metaTemplateId: string, 
    title: string, 
    customOptions?: {
      description?: string;
      priority?: number;
      tags?: string[];
    }
  ): Promise<TaskResponse<ITaskTemplate>> {
    return await ipcInvokeWithAuth(
      'task:templates:create-from-meta-template', 
      metaTemplateId, 
      title, 
      serializeForIpc(customOptions)
    );
  }

  async saveTaskTemplate(taskTemplateData: any): Promise<TaskResponse<ITaskTemplate>> {
    return await ipcInvokeWithAuth('task:templates:save', serializeForIpc(taskTemplateData));
  }

  // === TaskInstance IPC 调用 ===

  async getTaskInstance(taskInstanceId: string): Promise<TaskResponse<ITaskInstance>> {
    return await ipcInvokeWithAuth('task:instances:get-by-id', taskInstanceId);
  }

  async getAllTaskInstances(): Promise<TaskResponse<ITaskInstance[]>> {
    return await ipcInvokeWithAuth('task:instances:get-all');
  }

  async getTodayTasks(): Promise<TaskResponse<ITaskInstance[]>> {
    return await ipcInvokeWithAuth('task:instances:get-today');
  }

  async createTaskInstance(dto: ITaskInstance): Promise<TaskResponse<ITaskInstance>> {
    return await ipcInvokeWithAuth('task:instances:create', serializeForIpc(dto));
  }

  async startTaskInstance(taskInstanceId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:start', taskInstanceId);
  }

  async completeTaskInstance(taskInstanceId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:complete', taskInstanceId);
  }

  async undoCompleteTaskInstance(taskInstanceId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:undo-complete', taskInstanceId);
  }

  async cancelTaskInstance(taskInstanceId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:cancel', taskInstanceId);
  }

  async rescheduleTaskInstance(taskInstanceId: string, newScheduledTime: string, newEndTime?: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:reschedule', taskInstanceId, newScheduledTime, newEndTime);
  }

  async deleteTaskInstance(taskInstanceId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:delete', taskInstanceId);
  }

  // === 提醒相关 IPC 调用 ===

  async initializeTaskReminders(): Promise<TaskResponse<boolean>> {
    return await ipcInvokeWithAuth('task:reminders:initialize');
  }

  async refreshTaskReminders(): Promise<TaskResponse<boolean>> {
    return await ipcInvokeWithAuth('task:reminders:refresh');
  }

  async triggerReminder(instanceId: string, alertId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:trigger-reminder', instanceId, alertId);
  }

  async snoozeReminder(instanceId: string, alertId: string, snoozeUntil: string, reason?: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:snooze-reminder', instanceId, alertId, snoozeUntil, reason);
  }

  async dismissReminder(instanceId: string, alertId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:dismiss-reminder', instanceId, alertId);
  }

  async enableReminders(instanceId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:enable-reminders', instanceId);
  }

  async disableReminders(instanceId: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:disable-reminders', instanceId);
  }

  // === 统计分析相关 IPC 调用 ===

  async getTaskStatsForGoal(goalUuid: string): Promise<TaskResponse<TaskStats>> {
    return await ipcInvokeWithAuth('task:stats:get-for-goal', goalUuid);
  }

  async getTaskCompletionTimeline(goalUuid: string, startDate: string, endDate: string): Promise<TaskResponse<TaskTimeline[]>> {
    return await ipcInvokeWithAuth('task:stats:get-completion-timeline', goalUuid, startDate, endDate);
  }
}

export const taskIpcClient = new TaskIpcClient();