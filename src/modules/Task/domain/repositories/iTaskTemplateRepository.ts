import type { TaskTemplate } from '../entities/taskTemplate';

export interface ITaskTemplateRepository {
  save(template: TaskTemplate): Promise<TResponse<TaskTemplate>>;
  saveAll(templates: TaskTemplate[]): Promise<TResponse<TaskTemplate[]>>;
  findById(id: string): Promise<TResponse<TaskTemplate>>;
  findAll(): Promise<TResponse<TaskTemplate[]>>;
  delete(id: string): Promise<TResponse<boolean>>;
  update(template: TaskTemplate): Promise<TResponse<TaskTemplate>>;
  findByKeyResult(goalId: string, keyResultId: string): Promise<TResponse<TaskTemplate[]>>;
}