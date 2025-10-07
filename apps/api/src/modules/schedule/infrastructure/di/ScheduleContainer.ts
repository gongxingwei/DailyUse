import { ScheduleDomainService } from '../../domain/services/ScheduleDomainService';
import { ScheduleApplicationService } from '../../application/services/ScheduleApplicationService';
import { PrismaScheduleTaskRepository } from '../repositories/PrismaScheduleTaskRepository';
import { RecurringScheduleTaskRepository } from '../repositories/RecurringScheduleTaskRepository';
import { ScheduleTaskRepository } from '../repositories/ScheduleTaskRepository';
import {
  RecurringScheduleTaskDomainService,
  ScheduleTaskDomainService,
} from '@dailyuse/domain-server';
import { PrismaClient } from '@prisma/client';
import type { RecurringScheduleTask, ScheduleTask } from '@dailyuse/domain-core';

// Mock SchedulerService for testing - 避免测试环境中的 NestJS 依赖
class MockSchedulerService {
  private tasks: Map<string, RecurringScheduleTask | ScheduleTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  async onModuleInit() {}
  async onModuleDestroy() {}
  async registerTask(task: RecurringScheduleTask | ScheduleTask): Promise<void> {}
  async unregisterTask(taskUuid: string): Promise<void> {}
  async updateTask(task: RecurringScheduleTask | ScheduleTask): Promise<void> {}
  async pauseTask(taskUuid: string): Promise<void> {}
  async resumeTask(taskUuid: string): Promise<void> {}
  async enableTask(taskUuid: string): Promise<void> {}
  async disableTask(taskUuid: string): Promise<void> {}
  async executeTask(taskUuid: string): Promise<void> {}
  getTask(taskUuid: string): RecurringScheduleTask | ScheduleTask | undefined {
    return undefined;
  }
  getAllTasks(): Array<RecurringScheduleTask | ScheduleTask> {
    return [];
  }
  getTasksStatus(): any[] {
    return [];
  }
  calculateNextRunTime(cronExpression: string, from?: Date): Date {
    return new Date();
  }
  private scheduleTask(task: RecurringScheduleTask | ScheduleTask): Promise<void> {
    return Promise.resolve();
  }
  private stopAllTasks(): void {}
}

/**
 * Schedule Module Dependency Injection Container
 * 调度模块依赖注入容器
 */
export class ScheduleContainer {
  private static instance: ScheduleContainer;
  private _prismaClient: PrismaClient;
  private _scheduleRepository?: PrismaScheduleTaskRepository;
  private _recurringScheduleTaskRepository?: RecurringScheduleTaskRepository;
  private _scheduleTaskRepository?: ScheduleTaskRepository;
  private _scheduleDomainService?: ScheduleDomainService;
  private _schedulerService?: MockSchedulerService;
  private _recurringScheduleTaskDomainService?: RecurringScheduleTaskDomainService;
  private _scheduleTaskDomainService?: ScheduleTaskDomainService;
  private _scheduleApplicationService?: ScheduleApplicationService;

  constructor(prismaClient: PrismaClient) {
    this._prismaClient = prismaClient;
  }

  static getInstance(prismaClient: PrismaClient): ScheduleContainer {
    if (!this.instance) {
      this.instance = new ScheduleContainer(prismaClient);
    }
    return this.instance;
  }

  get prismaClient(): PrismaClient {
    return this._prismaClient;
  }

  get scheduleRepository(): PrismaScheduleTaskRepository {
    if (!this._scheduleRepository) {
      this._scheduleRepository = new PrismaScheduleTaskRepository(this._prismaClient);
    }
    return this._scheduleRepository;
  }

  get recurringScheduleTaskRepository(): RecurringScheduleTaskRepository {
    if (!this._recurringScheduleTaskRepository) {
      this._recurringScheduleTaskRepository = new RecurringScheduleTaskRepository(
        this._prismaClient,
      );
    }
    return this._recurringScheduleTaskRepository;
  }

  get scheduleTaskRepository(): ScheduleTaskRepository {
    if (!this._scheduleTaskRepository) {
      this._scheduleTaskRepository = new ScheduleTaskRepository(this._prismaClient);
    }
    return this._scheduleTaskRepository;
  }

  get schedulerService(): MockSchedulerService {
    if (!this._schedulerService) {
      this._schedulerService = new MockSchedulerService();
    }
    return this._schedulerService;
  }

  get scheduleDomainService(): ScheduleDomainService {
    if (!this._scheduleDomainService) {
      this._scheduleDomainService = new ScheduleDomainService(this.scheduleRepository);
    }
    return this._scheduleDomainService;
  }

  get recurringScheduleTaskDomainService(): RecurringScheduleTaskDomainService {
    if (!this._recurringScheduleTaskDomainService) {
      this._recurringScheduleTaskDomainService = new RecurringScheduleTaskDomainService(
        this.recurringScheduleTaskRepository,
        this.schedulerService as any, // 使用类型断言避免 Mock 与真实类型的私有属性冲突
      );
    }
    return this._recurringScheduleTaskDomainService;
  }

  get scheduleTaskDomainService(): ScheduleTaskDomainService {
    if (!this._scheduleTaskDomainService) {
      this._scheduleTaskDomainService = new ScheduleTaskDomainService(
        this.scheduleTaskRepository,
        this.schedulerService as any,
      );
    }
    return this._scheduleTaskDomainService;
  }

  get scheduleApplicationService(): ScheduleApplicationService {
    if (!this._scheduleApplicationService) {
      this._scheduleApplicationService = new ScheduleApplicationService(
        this.scheduleDomainService,
        this.recurringScheduleTaskDomainService, // ✅ 注入周期性任务服务
      );
    }
    return this._scheduleApplicationService;
  }
}
