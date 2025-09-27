import { ScheduleDomainService } from '../../domain/services/ScheduleDomainService';
import { ScheduleApplicationService } from '../../application/services/ScheduleApplicationService';
import { PrismaScheduleTaskRepository } from '../repositories/PrismaScheduleTaskRepository';
import { PrismaClient } from '@prisma/client';

/**
 * Schedule Module Dependency Injection Container
 * 调度模块依赖注入容器
 */
export class ScheduleContainer {
  private static instance: ScheduleContainer;
  private _prismaClient: PrismaClient;
  private _scheduleRepository?: PrismaScheduleTaskRepository;
  private _scheduleDomainService?: ScheduleDomainService;
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

  get scheduleDomainService(): ScheduleDomainService {
    if (!this._scheduleDomainService) {
      this._scheduleDomainService = new ScheduleDomainService(this.scheduleRepository);
    }
    return this._scheduleDomainService;
  }

  get scheduleApplicationService(): ScheduleApplicationService {
    if (!this._scheduleApplicationService) {
      this._scheduleApplicationService = new ScheduleApplicationService(this.scheduleDomainService);
    }
    return this._scheduleApplicationService;
  }
}
