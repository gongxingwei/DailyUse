import type { TaskInstance } from '../aggregates/taskInstance';

export interface ITaskInstanceRepository {
  save(accountUuid: string, instance: TaskInstance): Promise<TaskInstance>;
  saveAll(accountUuid: string, instances: TaskInstance[]): Promise<TaskInstance[]>;
  findById(accountUuid: string, uuid: string): Promise<TaskInstance>;
  findAll(accountUuid: string): Promise<TaskInstance[]>;
  findByDateRange(accountUuid: string, start: Date, end: Date): Promise<TaskInstance[]>;
  findByGoal(accountUuid: string, goalUuid: string): Promise<TaskInstance[]>;
  delete(accountUuid: string, uuid: string): Promise<boolean>;
  update(accountUuid: string, instance: TaskInstance): Promise<TaskInstance>;
  findByTemplateId(accountUuid: string, templateId: string): Promise<TaskInstance[]>;
}
