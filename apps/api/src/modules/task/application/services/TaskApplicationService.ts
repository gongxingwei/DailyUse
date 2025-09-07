import type { TaskContracts } from '@dailyuse/contracts';
import {
  TaskDomainService,
  type ITaskTemplateRepository,
  type ITaskInstanceRepository,
} from '../../domain/index.js';

type CreateTaskTemplateRequest = TaskContracts.CreateTaskTemplateRequest;
type UpdateTaskTemplateRequest = TaskContracts.UpdateTaskTemplateRequest;
type CreateTaskInstanceRequest = TaskContracts.CreateTaskInstanceRequest;
type UpdateTaskInstanceRequest = TaskContracts.UpdateTaskInstanceRequest;
type CompleteTaskRequest = TaskContracts.CompleteTaskRequest;
type RescheduleTaskRequest = TaskContracts.RescheduleTaskRequest;
type TaskTemplateResponse = TaskContracts.TaskTemplateResponse;
type TaskInstanceResponse = TaskContracts.TaskInstanceResponse;
type TaskListResponse = TaskContracts.TaskListResponse;

export class TaskApplicationService {
  private taskDomainService: TaskDomainService;

  constructor() {
    this.taskDomainService = new TaskDomainService();
  }

  // 任务模板相关方法
  async createTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplateResponse> {
    return this.taskDomainService.createTemplate(request);
  }

  async getTemplates(queryParams: any): Promise<TaskTemplateResponse[]> {
    return this.taskDomainService.getTemplates(queryParams);
  }

  async getTemplateById(id: string): Promise<TaskTemplateResponse | null> {
    return this.taskDomainService.getTemplateById(id);
  }

  async updateTemplate(
    id: string,
    request: UpdateTaskTemplateRequest,
  ): Promise<TaskTemplateResponse> {
    return this.taskDomainService.updateTemplate(id, request);
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.taskDomainService.deleteTemplate(id);
  }

  async activateTemplate(id: string): Promise<TaskTemplateResponse> {
    return this.taskDomainService.activateTemplate(id);
  }

  async pauseTemplate(id: string): Promise<TaskTemplateResponse> {
    return this.taskDomainService.pauseTemplate(id);
  }

  // 任务实例相关方法
  async createInstance(request: CreateTaskInstanceRequest): Promise<TaskInstanceResponse> {
    return this.taskDomainService.createInstance(request);
  }

  async getInstances(queryParams: any): Promise<TaskListResponse> {
    return this.taskDomainService.getInstances(queryParams);
  }

  async getInstanceById(id: string): Promise<TaskInstanceResponse | null> {
    return this.taskDomainService.getInstanceById(id);
  }

  async updateInstance(
    id: string,
    request: UpdateTaskInstanceRequest,
  ): Promise<TaskInstanceResponse> {
    return this.taskDomainService.updateInstance(id, request);
  }

  async deleteInstance(id: string): Promise<void> {
    return this.taskDomainService.deleteInstance(id);
  }

  async completeTask(id: string, request: CompleteTaskRequest): Promise<TaskInstanceResponse> {
    return this.taskDomainService.completeTask(id, request);
  }

  async undoCompleteTask(id: string, accountUuid: string): Promise<TaskInstanceResponse> {
    return this.taskDomainService.undoCompleteTask(id, accountUuid);
  }

  async rescheduleTask(id: string, request: RescheduleTaskRequest): Promise<TaskInstanceResponse> {
    return this.taskDomainService.rescheduleTask(id, request);
  }

  async cancelTask(id: string): Promise<TaskInstanceResponse> {
    return this.taskDomainService.cancelTask(id);
  }

  // 提醒相关方法
  async triggerReminder(taskId: string, alertId: string): Promise<void> {
    return this.taskDomainService.triggerReminder(taskId, alertId);
  }

  async snoozeReminder(
    taskId: string,
    alertId: string,
    snoozeUntil: Date,
    reason?: string,
  ): Promise<void> {
    return this.taskDomainService.snoozeReminder(taskId, alertId, snoozeUntil, reason);
  }

  async dismissReminder(taskId: string, alertId: string): Promise<void> {
    return this.taskDomainService.dismissReminder(taskId, alertId);
  }

  // 统计和查询方法
  async getTaskStats(queryParams: any): Promise<any> {
    return this.taskDomainService.getTaskStats(queryParams);
  }

  async getTaskTimeline(queryParams: any): Promise<any> {
    return this.taskDomainService.getTaskTimeline(queryParams);
  }

  async searchTasks(queryParams: any): Promise<TaskListResponse> {
    return this.taskDomainService.searchTasks(queryParams);
  }

  async getUpcomingTasks(queryParams: any): Promise<TaskListResponse> {
    return this.taskDomainService.getUpcomingTasks(queryParams);
  }

  async getOverdueTasks(queryParams: any): Promise<TaskListResponse> {
    return this.taskDomainService.getOverdueTasks(queryParams);
  }
}
