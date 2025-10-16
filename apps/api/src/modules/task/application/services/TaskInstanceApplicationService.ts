import type {
  ITaskInstanceRepository,
  ITaskTemplateRepository,
  TaskInstance,
} from '@dailyuse/domain-server';
import { TaskExpirationService } from '@dailyuse/domain-server';
import { TaskContainer } from '../../infrastructure/di/TaskContainer';
import type { TaskContracts } from '@dailyuse/contracts';

/**
 * TaskInstance 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain ↔ Contracts）
 */
export class TaskInstanceApplicationService {
  private static instance: TaskInstanceApplicationService;
  private expirationService: TaskExpirationService;
  private instanceRepository: ITaskInstanceRepository;
  private templateRepository: ITaskTemplateRepository;

  private constructor(
    instanceRepository: ITaskInstanceRepository,
    templateRepository: ITaskTemplateRepository,
  ) {
    this.expirationService = new TaskExpirationService(instanceRepository);
    this.instanceRepository = instanceRepository;
    this.templateRepository = templateRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    instanceRepository?: ITaskInstanceRepository,
    templateRepository?: ITaskTemplateRepository,
  ): Promise<TaskInstanceApplicationService> {
    const container = TaskContainer.getInstance();
    const instanceRepo = instanceRepository || container.getTaskInstanceRepository();
    const templateRepo = templateRepository || container.getTaskTemplateRepository();

    TaskInstanceApplicationService.instance = new TaskInstanceApplicationService(
      instanceRepo,
      templateRepo,
    );
    return TaskInstanceApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<TaskInstanceApplicationService> {
    if (!TaskInstanceApplicationService.instance) {
      TaskInstanceApplicationService.instance =
        await TaskInstanceApplicationService.createInstance();
    }
    return TaskInstanceApplicationService.instance;
  }

  // ===== TaskInstance 管理 =====

  /**
   * 获取任务实例详情
   */
  async getTaskInstance(uuid: string): Promise<TaskContracts.TaskInstanceServerDTO | null> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    return instance ? instance.toClientDTO() : null;
  }

  /**
   * 根据账户获取任务实例列表
   */
  async getTaskInstancesByAccount(
    accountUuid: string,
  ): Promise<TaskContracts.TaskInstanceServerDTO[]> {
    const instances = await this.instanceRepository.findByAccount(accountUuid);
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * 根据模板获取任务实例列表
   */
  async getTaskInstancesByTemplate(
    templateUuid: string,
  ): Promise<TaskContracts.TaskInstanceServerDTO[]> {
    const instances = await this.instanceRepository.findByTemplate(templateUuid);
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * 根据日期范围获取任务实例
   */
  async getTaskInstancesByDateRange(
    accountUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskContracts.TaskInstanceServerDTO[]> {
    const instances = await this.instanceRepository.findByDateRange(
      accountUuid,
      startDate,
      endDate,
    );
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * 根据状态获取任务实例
   */
  async getTaskInstancesByStatus(
    accountUuid: string,
    status: TaskContracts.TaskInstanceStatus,
  ): Promise<TaskContracts.TaskInstanceServerDTO[]> {
    const instances = await this.instanceRepository.findByStatus(accountUuid, status);
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * 开始任务实例
   */
  async startTaskInstance(uuid: string): Promise<TaskContracts.TaskInstanceServerDTO> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    if (!instance) {
      throw new Error(`TaskInstance ${uuid} not found`);
    }

    if (!instance.canStart()) {
      throw new Error('Cannot start this task instance');
    }

    instance.start();
    await this.instanceRepository.save(instance);

    return instance.toClientDTO();
  }

  /**
   * 完成任务实例
   */
  async completeTaskInstance(
    uuid: string,
    params: {
      duration?: number;
      note?: string;
      rating?: number;
    },
  ): Promise<TaskContracts.TaskInstanceServerDTO> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    if (!instance) {
      throw new Error(`TaskInstance ${uuid} not found`);
    }

    if (!instance.canComplete()) {
      throw new Error('Cannot complete this task instance');
    }

    instance.complete(params.duration, params.note, params.rating);
    await this.instanceRepository.save(instance);

    return instance.toClientDTO();
  }

  /**
   * 跳过任务实例
   */
  async skipTaskInstance(
    uuid: string,
    reason?: string,
  ): Promise<TaskContracts.TaskInstanceServerDTO> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    if (!instance) {
      throw new Error(`TaskInstance ${uuid} not found`);
    }

    if (!instance.canSkip()) {
      throw new Error('Cannot skip this task instance');
    }

    instance.skip(reason);
    await this.instanceRepository.save(instance);

    return instance.toClientDTO();
  }

  /**
   * 检查并标记过期的任务实例
   */
  async checkExpiredInstances(accountUuid: string): Promise<TaskContracts.TaskInstanceServerDTO[]> {
    const expiredInstances = await this.expirationService.checkAndMarkExpiredInstances(accountUuid);
    return expiredInstances.map((i) => i.toClientDTO());
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(uuid: string): Promise<void> {
    await this.instanceRepository.delete(uuid);
  }
}
