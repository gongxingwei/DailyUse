import type { TaskTemplate } from '../aggregates/taskTemplate';
import type { TResponse } from '@/shared/types/response';

export interface ITaskTemplateRepository {
  save(accountUuid: string, template: TaskTemplate): Promise<TResponse<TaskTemplate>>;
  saveAll(accountUuid: string, templates: TaskTemplate[]): Promise<TResponse<TaskTemplate[]>>;
  findById(accountUuid: string, uuid: string): Promise<TResponse<TaskTemplate>>;
  findAll(accountUuid: string): Promise<TResponse<TaskTemplate[]>>;
  delete(accountUuid: string, uuid: string): Promise<TResponse<boolean>>;
  update(accountUuid: string, template: TaskTemplate): Promise<TResponse<TaskTemplate>>;
  findByKeyResult(accountUuid: string, goalUuid: string, keyResultId: string): Promise<TResponse<TaskTemplate[]>>;
}