import type { ITaskTemplateRepository } from '../../domain/repositories/iTaskTemplateRepository';
import type { ITaskInstanceRepository } from '../../domain/repositories/iTaskInstanceRepository';
import type { ITaskMetaTemplateRepository } from '../../domain/repositories/iTaskMetaTemplateRepository';
import { TaskTemplateDatabaseRepository } from '../repositories/taskTemplateDatabaseRepository';
import { TaskInstanceDatabaseRepository } from '../repositories/taskInstanceDatabaseRepository';
import { TaskMetaTemplateDatabaseRepository } from '../repositories/taskMetaTemplateDatabaseRepository';

export class TaskContainer {
  private static instance: TaskContainer;
  private taskTemplateRepository: ITaskTemplateRepository;
  private taskInstanceRepository: ITaskInstanceRepository;
  private taskMetaTemplateRepository: ITaskMetaTemplateRepository;

  private constructor() {
    this.taskTemplateRepository = new TaskTemplateDatabaseRepository();
    this.taskInstanceRepository = new TaskInstanceDatabaseRepository();
    this.taskMetaTemplateRepository = new TaskMetaTemplateDatabaseRepository();
  }

  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  getTaskTemplateRepository(): ITaskTemplateRepository {
    return this.taskTemplateRepository;
  }

  getTaskInstanceRepository(): ITaskInstanceRepository {
    return this.taskInstanceRepository;
  }

  getTaskMetaTemplateRepository(): ITaskMetaTemplateRepository {
    return this.taskMetaTemplateRepository;
  }

  // 用于测试时替换实现
  setTaskTemplateRepository(repository: ITaskTemplateRepository): void {
    this.taskTemplateRepository = repository;
  }

  setTaskInstanceRepository(repository: ITaskInstanceRepository): void {
    this.taskInstanceRepository = repository;
  }

  setTaskMetaTemplateRepository(repository: ITaskMetaTemplateRepository): void {
    this.taskMetaTemplateRepository = repository;
  }
}