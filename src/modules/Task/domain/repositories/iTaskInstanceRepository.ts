import type { TaskInstance } from '../aggregates/taskInstance';
import type { DateTime } from '@/shared/types/myDateTime';
import type { TResponse } from '@/shared/types/response';

export interface ITaskInstanceRepository {
  setCurrentUser(username: string): void;
  save(instance: TaskInstance): Promise<TResponse<TaskInstance>>;
  saveAll(instances: TaskInstance[]): Promise<TResponse<TaskInstance[]>>;
  findById(uuid: string): Promise<TResponse<TaskInstance>>;
  findAll(): Promise<TResponse<TaskInstance[]>>;
  findByDateRange(start: DateTime, end: DateTime): Promise<TResponse<TaskInstance[]>>;
  findTodayTasks(): Promise<TResponse<TaskInstance[]>>;
  findByGoal(goalUuid: string): Promise<TResponse<TaskInstance[]>>;
  delete(uuid: string): Promise<TResponse<boolean>>;
  update(instance: TaskInstance): Promise<TResponse<TaskInstance>>;
  findByTemplateId(templateId: string): Promise<TResponse<TaskInstance[]>>;
}