import type { TaskTemplate } from '../aggregates/taskTemplate';
import type { TResponse } from '@/shared/types/response';

export interface ITaskTemplateRepository {
  setCurrentUser(username: string): void;
  save(template: TaskTemplate): Promise<TResponse<TaskTemplate>>;
  saveAll(templates: TaskTemplate[]): Promise<TResponse<TaskTemplate[]>>;
  findById(uuid: string): Promise<TResponse<TaskTemplate>>;
  findAll(): Promise<TResponse<TaskTemplate[]>>;
  delete(uuid: string): Promise<TResponse<boolean>>;
  update(template: TaskTemplate): Promise<TResponse<TaskTemplate>>;
  findByKeyResult(goalUuid: string, keyResultId: string): Promise<TResponse<TaskTemplate[]>>;
}