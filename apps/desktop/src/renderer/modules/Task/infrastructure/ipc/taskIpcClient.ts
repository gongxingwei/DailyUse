import type {
  TaskResponse,
  TaskStats,
  TaskTimeline,
  ITaskTemplateDTO,
  ITaskInstanceDTO,
  ITaskMetaTemplateDTO,
} from '@common/modules/task/types/task';
import { serializeForIpc, deepSerializeForIpc } from '@renderer/shared/utils/ipcSerialization';
import { ipcInvokeWithAuth } from '@renderer/shared/utils/ipcInvokeWithAuth';

/**
 * 任务模块 IPC 客户端
 * 负责与主进程的 IPC 通信，只处理数据传输，不涉及业务逻辑
 */
export class TaskIpcClient {
  // === MetaTemplate IPC 调用 ===

  async getAllMetaTemplates(): Promise<TaskResponse<ITaskMetaTemplateDTO[]>> {
    return await ipcInvokeWithAuth('task:meta-templates:get-all');
  }

  async getMetaTemplate(uuid: string): Promise<TaskResponse<ITaskMetaTemplateDTO>> {
    return await ipcInvokeWithAuth('task:meta-templates:get-by-id', uuid);
  }

  async getMetaTemplatesByCategory(
    category: string,
  ): Promise<TaskResponse<ITaskMetaTemplateDTO[]>> {
    return await ipcInvokeWithAuth('task:meta-templates:get-by-category', category);
  }

  async saveMetaTemplate(metaTemplateData: any): Promise<TaskResponse<ITaskMetaTemplateDTO>> {
    return await ipcInvokeWithAuth('task:meta-templates:save', serializeForIpc(metaTemplateData));
  }

  async deleteMetaTemplate(uuid: string): Promise<TaskResponse<boolean>> {
    return await ipcInvokeWithAuth('task:meta-templates:delete', uuid);
  }

  // === TaskTemplate IPC 调用 ===

  async getTaskTemplate(taskTemplateUuid: string): Promise<TaskResponse<ITaskTemplateDTO>> {
    return await ipcInvokeWithAuth('task:templates:get-by-id', taskTemplateUuid);
  }

  async getAllTaskTemplates(): Promise<TaskResponse<ITaskTemplateDTO[]>> {
    return await ipcInvokeWithAuth('task:templates:get-all');
  }

  async getTaskTemplateForKeyResult(
    goalUuid: string,
    keyResultId: string,
  ): Promise<TaskResponse<ITaskTemplateDTO[]>> {
    return await ipcInvokeWithAuth('task:templates:get-by-key-result', goalUuid, keyResultId);
  }

  async createTaskTemplate(dto: ITaskTemplateDTO): Promise<TaskResponse<ITaskTemplateDTO>> {
    const deepSerializedDto = deepSerializeForIpc(serializeForIpc(dto));
    return await ipcInvokeWithAuth('task:templates:create', deepSerializedDto);
  }

  async updateTaskTemplate(dto: ITaskTemplateDTO): Promise<TaskResponse<ITaskTemplateDTO>> {
    return await ipcInvokeWithAuth('task:templates:update', deepSerializeForIpc(dto));
  }

  async deleteTaskTemplate(taskTemplateUuid: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:delete', taskTemplateUuid);
  }

  async deleteAllTaskTemplates(): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:delete-all');
  }

  async activateTaskTemplate(taskTemplateUuid: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:activate', taskTemplateUuid);
  }

  async pauseTaskTemplate(taskTemplateUuid: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:pause', taskTemplateUuid);
  }

  async resumeTaskTemplate(taskTemplateUuid: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:resume', taskTemplateUuid);
  }

  async archiveTaskTemplate(taskTemplateUuid: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:templates:archive', taskTemplateUuid);
  }

  async createTaskTemplateFromMetaTemplate(
    metaTemplateId: string,
    title: string,
    customOptions?: {
      description?: string;
      priority?: number;
      tags?: string[];
    },
  ): Promise<TaskResponse<ITaskTemplateDTO>> {
    return await ipcInvokeWithAuth(
      'task:templates:create-from-meta-template',
      metaTemplateId,
      title,
      serializeForIpc(customOptions),
    );
  }

  async saveTaskTemplate(
    taskTemplateDTO: ITaskTemplateDTO,
  ): Promise<TaskResponse<ITaskTemplateDTO>> {
    return await ipcInvokeWithAuth('task:templates:save', serializeForIpc(taskTemplateDTO));
  }

  // === TaskInstance IPC 调用 ===

  async getTaskInstance(taskInstanceUuid: string): Promise<TaskResponse<ITaskInstanceDTO>> {
    return await ipcInvokeWithAuth('task:instances:get-by-id', taskInstanceUuid);
  }

  async getAllTaskInstances(): Promise<TaskResponse<ITaskInstanceDTO[]>> {
    return await ipcInvokeWithAuth('task:instances:get-all');
  }

  async getTodayTasks(): Promise<TaskResponse<ITaskInstanceDTO[]>> {
    return await ipcInvokeWithAuth('task:instances:get-today');
  }

  async createTaskInstance(dto: ITaskInstanceDTO): Promise<TaskResponse<ITaskInstanceDTO>> {
    return await ipcInvokeWithAuth('task:instances:create', serializeForIpc(dto));
  }

  async startTaskInstance(taskInstanceUuid: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:start', taskInstanceUuid);
  }

  async completeTaskInstance(taskInstanceUuid: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:complete', taskInstanceUuid);
  }

  async undoCompleteTaskInstance(taskInstanceUuid: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:undo-complete', taskInstanceUuid);
  }

  async cancelTaskInstance(taskInstanceUuid: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:cancel', taskInstanceUuid);
  }

  async rescheduleTaskInstance(
    taskInstanceUuid: string,
    newScheduledTime: string,
    newEndTime?: string,
  ): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth(
      'task:instances:reschedule',
      taskInstanceUuid,
      newScheduledTime,
      newEndTime,
    );
  }

  async deleteTaskInstance(taskInstanceUuid: string): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth('task:instances:delete', taskInstanceUuid);
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

  async snoozeReminder(
    instanceId: string,
    alertId: string,
    snoozeUntil: string,
    reason?: string,
  ): Promise<TaskResponse<void>> {
    return await ipcInvokeWithAuth(
      'task:instances:snooze-reminder',
      instanceId,
      alertId,
      snoozeUntil,
      reason,
    );
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

  async getTaskCompletionTimeline(
    goalUuid: string,
    startDate: string,
    endDate: string,
  ): Promise<TaskResponse<TaskTimeline[]>> {
    return await ipcInvokeWithAuth(
      'task:stats:get-completion-timeline',
      goalUuid,
      startDate,
      endDate,
    );
  }
}

export const taskIpcClient = new TaskIpcClient();
