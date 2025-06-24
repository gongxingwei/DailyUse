import type { ITaskTemplateRepository } from '../../domain/repositories/iTaskTemplateRepository';
import type { ITaskInstanceRepository } from '../../domain/repositories/iTaskInstanceRepository';
import type { ITaskMetaTemplateRepository } from '../../domain/repositories/iTaskMetaTemplateRepository';
import { TaskTemplateStoreRepository } from '../repositories/taskTemplateStoreRepository';
import { TaskInstanceStoreRepository } from '../repositories/taskInstanceStoreRepository';
import { TaskMetaTemplateStoreRepository } from '../repositories/taskMetaTemplateStoreRepository';
export class TaskContainer {
  private static instance: TaskContainer;
  private taskTemplateRepository: ITaskTemplateRepository;
  private taskInstanceRepository: ITaskInstanceRepository;
  private taskMetaTemplateRepository: ITaskMetaTemplateRepository; // 如果需要，可以添加元模板仓库

  private constructor() {
    this.taskTemplateRepository = new TaskTemplateStoreRepository();
    this.taskInstanceRepository = new TaskInstanceStoreRepository();
    this.taskMetaTemplateRepository = new TaskMetaTemplateStoreRepository(); // 初始化元模板仓库
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