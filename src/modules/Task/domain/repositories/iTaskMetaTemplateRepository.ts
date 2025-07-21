import { TaskMetaTemplate } from '@/modules/Task/domain/aggregates/taskMetaTemplate';
import type { TResponse } from '@/shared/types/response';

export interface ITaskMetaTemplateRepository {
  setCurrentUser(username: string): void;
  save(metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>>;
  findById(uuid: string): Promise<TResponse<TaskMetaTemplate>>;
  findAll(): Promise<TResponse<TaskMetaTemplate[]>>;
  findByCategory(category: string): Promise<TResponse<TaskMetaTemplate[]>>;
  delete(uuid: string): Promise<TResponse<boolean>>;
}