import type { TaskTemplate } from '../aggregates/taskTemplate';

export interface ITaskTemplateRepository {
  save(accountUuid: string, template: TaskTemplate): Promise<TaskTemplate>;
  saveAll(accountUuid: string, templates: TaskTemplate[]): Promise<boolean>;
  findById(accountUuid: string, uuid: string): Promise<TaskTemplate>;
  findAll(accountUuid: string): Promise<TaskTemplate[]>;
  delete(accountUuid: string, uuid: string): Promise<boolean>;
  update(accountUuid: string, template: TaskTemplate): Promise<TaskTemplate>;
  findByKeyResult(accountUuid: string, goalUuid: string, keyResultId: string): Promise<TaskTemplate[]>;
}
