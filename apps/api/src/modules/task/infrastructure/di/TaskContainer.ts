import type {
  ITaskTemplateAggregateRepository,
  ITaskMetaTemplateAggregateRepository,
  ITaskStatsAggregateRepository,
} from '@dailyuse/domain-server';
import { PrismaTaskTemplateAggregateRepository } from '../repositories/prisma/PrismaTaskTemplateAggregateRepository';
import { PrismaTaskMetaTemplateAggregateRepository } from '../repositories/prisma/PrismaTaskMetaTemplateAggregateRepository';
import { PrismaTaskStatsRepository } from '../repositories/prisma/PrismaTaskStatsAggregateRepository';
import { prisma } from '@/config/prisma';

export class TaskContainer {
  private static instance: TaskContainer;
  private taskTemplateRepository?: ITaskTemplateAggregateRepository;
  private taskMetaTemplateRepository?: ITaskMetaTemplateAggregateRepository;
  private taskStatsRepository?: ITaskStatsAggregateRepository;

  private constructor() {}

  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  /**
   * 获取 TaskTemplate Aggregate Prisma 仓库实例
   */
  async getPrismaTaskTemplateRepository(): Promise<ITaskTemplateAggregateRepository> {
    if (!this.taskTemplateRepository) {
      this.taskTemplateRepository = new PrismaTaskTemplateAggregateRepository(prisma);
    }
    return this.taskTemplateRepository;
  }

  /**
   * 获取 TaskMetaTemplate Aggregate Prisma 仓库实例
   */
  async getPrismaTaskMetaTemplateRepository(): Promise<ITaskMetaTemplateAggregateRepository> {
    if (!this.taskMetaTemplateRepository) {
      this.taskMetaTemplateRepository = new PrismaTaskMetaTemplateAggregateRepository(prisma);
    }
    return this.taskMetaTemplateRepository;
  }

  /**
   * 获取 TaskStats Aggregate 仓库实例
   */
  async getPrismaTaskStatsRepository(): Promise<ITaskStatsAggregateRepository> {
    if (!this.taskStatsRepository) {
      this.taskStatsRepository = new PrismaTaskStatsRepository(prisma);
    }
    return this.taskStatsRepository;
  }

  // 用于测试时替换实现
  setTaskTemplateRepository(repository: ITaskTemplateAggregateRepository): void {
    this.taskTemplateRepository = repository;
  }

  setTaskMetaTemplateRepository(repository: ITaskMetaTemplateAggregateRepository): void {
    this.taskMetaTemplateRepository = repository;
  }

  setTaskStatsRepository(repository: ITaskStatsAggregateRepository): void {
    this.taskStatsRepository = repository;
  }
}
