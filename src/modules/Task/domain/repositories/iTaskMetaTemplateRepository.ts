import { TaskMetaTemplate } from '@/modules/Task/domain/entities/taskMetaTemplate';

export interface ITaskMetaTemplateRepository {
  save(metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>>;
  findById(id: string): Promise<TResponse<TaskMetaTemplate>>;
  findAll(): Promise<TResponse<TaskMetaTemplate[]>>;
  findByCategory(category: string): Promise<TResponse<TaskMetaTemplate[]>>;
  delete(id: string): Promise<TResponse<boolean>>;
}