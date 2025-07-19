import { TaskMetaTemplate } from '../aggregates/taskMetaTemplate';
import type { TResponse } from '@/shared/types/response';

export interface ITaskMetaTemplateRepository {
  setCurrentUser(username: string): void;
  save(metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>>;
  findById(id: string): Promise<TResponse<TaskMetaTemplate>>;
  findAll(): Promise<TResponse<TaskMetaTemplate[]>>;
  findByCategory(category: string): Promise<TResponse<TaskMetaTemplate[]>>;
  delete(id: string): Promise<TResponse<boolean>>;
}