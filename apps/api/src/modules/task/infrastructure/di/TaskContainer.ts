import type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
  ITaskMetaTemplateRepository,
  ITaskStatsRepository,
} from '@dailyuse/domain-server';
import { PrismaTaskTemplateRepository } from '../repositories/prisma/PrismaTaskTemplateRepository';
import { PrismaTaskInstanceRepository } from '../repositories/prisma/PrismaTaskInstanceRepository';
import { PrismaTaskMetaTemplateRepository } from '../repositories/prisma/PrismaTaskMetaTemplateRepository';
import { prisma } from '@/config/prisma';

export class TaskContainer {
  private static instance: TaskContainer;
  private taskTemplateRepository?: ITaskTemplateRepository;
  private taskInstanceRepository?: ITaskInstanceRepository;
  private taskMetaTemplateRepository?: ITaskMetaTemplateRepository;

  private constructor() {}

  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  /**
   * 获取 TaskTemplate Prisma 仓库实例
   */
  async getPrismaTaskTemplateRepository(): Promise<ITaskTemplateRepository> {
    if (!this.taskTemplateRepository) {
      this.taskTemplateRepository = new PrismaTaskTemplateRepository(prisma);
    }
    return this.taskTemplateRepository;
  }

  /**
   * 获取 TaskInstance Prisma 仓库实例
   */
  async getPrismaTaskInstanceRepository(): Promise<ITaskInstanceRepository> {
    if (!this.taskInstanceRepository) {
      this.taskInstanceRepository = new PrismaTaskInstanceRepository(prisma);
    }
    return this.taskInstanceRepository;
  }

  /**
   * 获取 TaskMetaTemplate Prisma 仓库实例
   */
  async getPrismaTaskMetaTemplateRepository(): Promise<ITaskMetaTemplateRepository> {
    if (!this.taskMetaTemplateRepository) {
      this.taskMetaTemplateRepository = new PrismaTaskMetaTemplateRepository(prisma);
    }
    return this.taskMetaTemplateRepository;
  }

  /**
   * 获取 TaskStats 仓库实例 (临时实现)
   */
  async getPrismaTaskStatsRepository(): Promise<ITaskStatsRepository> {
    // TODO: 实现 TaskStats 仓库
    throw new Error('TaskStats repository not implemented yet');
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
