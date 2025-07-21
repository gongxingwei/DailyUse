import { TaskMetaTemplate } from '../aggregates/taskMetaTemplate';
import type { TResponse } from '@/shared/types/response';

export interface ITaskMetaTemplateRepository {
  save(accountUuid: string, metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>>;
  findById(accountUuid: string, uuid: string): Promise<TResponse<TaskMetaTemplate>>;
  findAll(accountUuid: string): Promise<TResponse<TaskMetaTemplate[]>>;
  findByCategory(accountUuid: string, category: string): Promise<TResponse<TaskMetaTemplate[]>>;
  delete(accountUuid: string, uuid: string): Promise<TResponse<boolean>>;
}