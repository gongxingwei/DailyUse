import type { ITaskInstanceRepository, ITaskTemplateRepository } from '@dailyuse/domain-server';
import { PrismaTaskInstanceRepository } from '../repositories/PrismaTaskInstanceRepository';
import { PrismaTaskTemplateRepository } from '../repositories/PrismaTaskTemplateRepository';
import { prisma } from '@/config/prisma';

/**
 * Task Module DI Container
 * 管理 Task 模块的所有仓储实例
 */
export class TaskContainer {
  private static instance: TaskContainer;
  private taskInstanceRepository: ITaskInstanceRepository | null = null;
  private taskTemplateRepository: ITaskTemplateRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  /**
   * 获取 TaskInstance 仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getTaskInstanceRepository(): ITaskInstanceRepository {
    if (!this.taskInstanceRepository) {
      this.taskInstanceRepository = new PrismaTaskInstanceRepository(prisma);
    }
    return this.taskInstanceRepository!;
  }

  /**
   * 设置 TaskInstance 仓储（用于测试）
   */
  setTaskInstanceRepository(repository: ITaskInstanceRepository): void {
    this.taskInstanceRepository = repository;
  }

  /**
   * 获取 TaskTemplate 仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getTaskTemplateRepository(): ITaskTemplateRepository {
    if (!this.taskTemplateRepository) {
      this.taskTemplateRepository = new PrismaTaskTemplateRepository(prisma);
    }
    return this.taskTemplateRepository!;
  }

  /**
   * 设置 TaskTemplate 仓储（用于测试）
   */
  setTaskTemplateRepository(repository: ITaskTemplateRepository): void {
    this.taskTemplateRepository = repository;
  }
}
