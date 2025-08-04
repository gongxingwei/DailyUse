import { TaskMetaTemplate } from '../aggregates/taskMetaTemplate';

export interface ITaskMetaTemplateRepository {
  save(accountUuid: string, metaTemplate: TaskMetaTemplate): Promise<TaskMetaTemplate>;
  findById(accountUuid: string, uuid: string): Promise<TaskMetaTemplate>;
  findAll(accountUuid: string): Promise<TaskMetaTemplate[]>;
  findByCategory(accountUuid: string, category: string): Promise<TaskMetaTemplate[]>;
  delete(accountUuid: string, uuid: string): Promise<boolean>;
}