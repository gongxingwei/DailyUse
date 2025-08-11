import { TaskTemplate } from '../aggregates/TaskTemplate';
import { TaskInstance } from '../aggregates/TaskInstance';
import { TaskStatus } from '../types';

export interface ITaskTemplateRepository {
  findById(id: string): Promise<TaskTemplate | null>;
  findByUserId(userId: string): Promise<TaskTemplate[]>;
  findByCategory(category: string): Promise<TaskTemplate[]>;
  findActive(): Promise<TaskTemplate[]>;
  save(taskTemplate: TaskTemplate): Promise<void>;
  delete(taskTemplateId: string): Promise<void>;
}

export interface ITaskInstanceRepository {
  findById(id: string): Promise<TaskInstance | null>;
  findByTemplateId(templateId: string): Promise<TaskInstance[]>;
  findByStatus(status: TaskStatus): Promise<TaskInstance[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<TaskInstance[]>;
  findOverdueTasks(): Promise<TaskInstance[]>;
  findDueSoon(minutes: number): Promise<TaskInstance[]>;
  save(taskInstance: TaskInstance): Promise<void>;
  delete(taskInstanceId: string): Promise<void>;
  markCompleted(taskInstanceId: string): Promise<void>;
}
