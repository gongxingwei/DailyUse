import type {
  IScheduleTaskRepository,
  IScheduleStatisticsRepository,
  IScheduleRepository,
} from '@dailyuse/domain-server';
import { PrismaScheduleTaskRepository } from '../repositories/PrismaScheduleTaskRepository';
import { PrismaScheduleStatisticsRepository } from '../repositories/PrismaScheduleStatisticsRepository';
import { PrismaScheduleRepository } from '../repositories/PrismaScheduleRepository';
import { prisma } from '@/config/prisma';

/**
 * Schedule Module DI Container
 * 管理 Schedule 模块的所有仓储实例
 */
export class ScheduleContainer {
  private static instance: ScheduleContainer;
  private scheduleTaskRepository: IScheduleTaskRepository | null = null;
  private scheduleStatisticsRepository: IScheduleStatisticsRepository | null = null;
  private scheduleRepository: IScheduleRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): ScheduleContainer {
    if (!ScheduleContainer.instance) {
      ScheduleContainer.instance = new ScheduleContainer();
    }
    return ScheduleContainer.instance;
  }

  /**
   * 获取 ScheduleTask 聚合根仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getScheduleTaskRepository(): IScheduleTaskRepository {
    if (!this.scheduleTaskRepository) {
      this.scheduleTaskRepository = new PrismaScheduleTaskRepository(prisma);
    }
    return this.scheduleTaskRepository;
  }

  /**
   * 设置 ScheduleTask 聚合根仓储（用于测试）
   */
  setScheduleTaskRepository(repository: IScheduleTaskRepository): void {
    this.scheduleTaskRepository = repository;
  }

  /**
   * 获取 ScheduleStatistics 仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getScheduleStatisticsRepository(): IScheduleStatisticsRepository {
    if (!this.scheduleStatisticsRepository) {
      this.scheduleStatisticsRepository = new PrismaScheduleStatisticsRepository(prisma);
    }
    return this.scheduleStatisticsRepository;
  }

  /**
   * 设置 ScheduleStatistics 仓储（用于测试）
   */
  setScheduleStatisticsRepository(repository: IScheduleStatisticsRepository): void {
    this.scheduleStatisticsRepository = repository;
  }

  /**
   * 获取用户日程（calendar schedule）仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getScheduleRepository(): IScheduleRepository {
    if (!this.scheduleRepository) {
      this.scheduleRepository = new PrismaScheduleRepository(prisma);
    }
    return this.scheduleRepository;
  }

  /**
   * 设置 Schedule 仓储（用于测试或运行时注入）
   */
  setScheduleRepository(repository: IScheduleRepository): void {
    this.scheduleRepository = repository;
  }
}
