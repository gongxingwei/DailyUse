import type {
  ITaskTemplateAggregateRepository,
  ITaskMetaTemplateAggregateRepository,
} from '@dailyuse/domain-server';
import { PrismaTaskTemplateAggregateRepository } from '../repositories/prisma/PrismaTaskTemplateAggregateRepository';
import { PrismaTaskMetaTemplateAggregateRepository } from '../repositories/prisma/PrismaTaskMetaTemplateAggregateRepository';
import { prisma } from '@/config/prisma';

export class TaskContainer {
  private static instance: TaskContainer;
  private taskTemplateRepository?: ITaskTemplateAggregateRepository;
  private taskMetaTemplateRepository?: ITaskMetaTemplateAggregateRepository;

  private constructor() {}

  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  /**
   * 获取 TaskTemplate Aggregate Prisma 仓库实例
   * TaskTemplate 仓储现在包含统计方法（原 TaskStats 聚合根功能已合并）
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

  // 用于测试时替换实现
  setTaskTemplateRepository(repository: ITaskTemplateAggregateRepository): void {
    this.taskTemplateRepository = repository;
  }

  setTaskMetaTemplateRepository(repository: ITaskMetaTemplateAggregateRepository): void {
    this.taskMetaTemplateRepository = repository;
  }
}
