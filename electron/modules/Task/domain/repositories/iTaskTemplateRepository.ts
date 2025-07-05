import type { TaskTemplate } from '../entities/taskTemplate';
import type { TResponse } from '@/shared/types/response';

export interface ITaskTemplateRepository {
  setCurrentUser(username: string): void;
  save(template: TaskTemplate): Promise<TResponse<TaskTemplate>>;
  saveAll(templates: TaskTemplate[]): Promise<TResponse<TaskTemplate[]>>;
  findById(id: string): Promise<TResponse<TaskTemplate>>;
  findAll(): Promise<TResponse<TaskTemplate[]>>;
  delete(id: string): Promise<TResponse<boolean>>;
  update(template: TaskTemplate): Promise<TResponse<TaskTemplate>>;
  findByKeyResult(goalId: string, keyResultId: string): Promise<TResponse<TaskTemplate[]>>;
}