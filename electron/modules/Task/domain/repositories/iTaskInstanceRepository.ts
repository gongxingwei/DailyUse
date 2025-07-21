import type { TaskInstance } from '../aggregates/taskInstance';
import type { DateTime } from '@/shared/types/myDateTime';
import type { TResponse } from '@/shared/types/response';

export interface ITaskInstanceRepository {
  save(accountUuid: string, instance: TaskInstance): Promise<TResponse<TaskInstance>>;
  saveAll(accountUuid: string, instances: TaskInstance[]): Promise<TResponse<TaskInstance[]>>;
  findById(accountUuid: string, uuid: string): Promise<TResponse<TaskInstance>>;
  findAll(accountUuid: string): Promise<TResponse<TaskInstance[]>>;
  findByDateRange(accountUuid: string, start: DateTime, end: DateTime): Promise<TResponse<TaskInstance[]>>;
  findTodayTasks(accountUuid: string): Promise<TResponse<TaskInstance[]>>;
  findByGoal(accountUuid: string, goalUuid: string): Promise<TResponse<TaskInstance[]>>;
  delete(accountUuid: string, uuid: string): Promise<TResponse<boolean>>;
  update(accountUuid: string, instance: TaskInstance): Promise<TResponse<TaskInstance>>;
  findByTemplateId(accountUuid: string, templateId: string): Promise<TResponse<TaskInstance[]>>;
}