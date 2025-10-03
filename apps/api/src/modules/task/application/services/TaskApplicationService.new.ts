import type { TaskContracts } from '@dailyuse/contracts';
import { type ITaskRepository, UserDataInitializationService } from '@dailyuse/domain-server';
import { TaskDomainService } from '../../domain/services/TaskDomainService';
import { TaskContainer } from '../../infrastructure/di/TaskContainer';

export class TaskApplicationService {
  private static instance: TaskApplicationService;
  private domainService: TaskDomainService;
  private userInitService: UserDataInitializationService;
  private TaskRepository: ITaskRepository;

  constructor(TaskRepository: ITaskRepository) {
    this.domainService = new TaskDomainService(TaskRepository);
    this.userInitService = new UserDataInitializationService(TaskRepository);
    this.TaskRepository = TaskRepository;
  }

  static async createInstance(TaskRepository?: ITaskRepository): Promise<TaskApplicationService> {
    const taskContainer = TaskContainer.getInstance();
    TaskRepository = TaskRepository || (await taskContainer.getPrismaTaskRepository());
    this.instance = new TaskApplicationService(TaskRepository);
    return this.instance;
  }

  static async getInstance(): Promise<TaskApplicationService> {
    if (!this.instance) {
      TaskApplicationService.instance = await TaskApplicationService.createInstance();
    }
    return this.instance;
  }

  // ===== 用户数据初始化 =====

  /**
   * 初始化用户目标模块数据
   * 在用户首次登录或访问目标模块时调用
   */
  async initializeUserData(accountUuid: string): Promise<void> {
    await this.userInitService.initializeUserTaskData(accountUuid);
  }

  /**
   * 确保默认目录存在
   * 用于修复缺失的系统目录
   */
  async ensureDefaultDirectories(accountUuid: string): Promise<void> {
    await this.userInitService.ensureDefaultDirectories(accountUuid);
  }

  /**
   * 获取用户的默认目录（全部目标）
   */
  async getDefaultDirectory(accountUuid: string): Promise<TaskContracts.TaskDirDTO> {
    return await this.userInitService.getDefaultDirectory(accountUuid);
  }

  // ===== Task 管理 =====

  async createTask(
    accountUuid: string,
    request: TaskContracts.CreateTaskRequest,
  ): Promise<TaskContracts.TaskResponse> {
    // 委托给领域服务处理业务逻辑
    return await this.domainService.createTask(accountUuid, request);
  }

  // 注意：createTaskAggregate 私有方法已移至 TaskDomainService

  async getTasks(
    accountUuid: string,
    queryParams: any, // Use any since req.query provides strings
  ): Promise<TaskContracts.TaskListResponse> {
    // Parse query parameters properly
    const parsedParams: TaskContracts.TaskQueryParams = {
      page: queryParams.page ? parseInt(queryParams.page, 10) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 10,
      offset: queryParams.offset ? parseInt(queryParams.offset, 10) : undefined,
      search: queryParams.search,
      status: queryParams.status,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
      dirUuid: queryParams.dirUuid,
      tags: queryParams.tags
        ? Array.isArray(queryParams.tags)
          ? queryParams.tags
          : [queryParams.tags]
        : undefined,
      category: queryParams.category,
      importanceLevel: queryParams.importanceLevel,
      urgencyLevel: queryParams.urgencyLevel,
      startTime: queryParams.startTime ? parseInt(queryParams.startTime, 10) : undefined,
      endTime: queryParams.endTime ? parseInt(queryParams.endTime, 10) : undefined,
    };

    // 委托给领域服务处理
    return await this.domainService.getTasks(accountUuid, parsedParams);
  }

  async getTaskById(
    accountUuid: string,
    uuid: string,
  ): Promise<TaskContracts.TaskClientDTO | null> {
    // 委托给领域服务处理
    return await this.domainService.getTaskById(accountUuid, uuid);
  }

  async updateTask(
    accountUuid: string,
    uuid: string,
    request: TaskContracts.UpdateTaskRequest,
  ): Promise<TaskContracts.TaskClientDTO> {
    // 委托给领域服务处理业务逻辑
    return await this.domainService.updateTask(accountUuid, uuid, request);
  }

  // 注意：updateTaskAggregate 私有方法已移至 TaskDomainService

  async deleteTask(accountUuid: string, uuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.deleteTask(accountUuid, uuid);
  }

  // ===== Task 状态管理 =====

  async activateTask(accountUuid: string, uuid: string): Promise<TaskContracts.TaskClientDTO> {
    // 委托给领域服务处理
    return await this.domainService.activateTask(accountUuid, uuid);
  }

  async pauseTask(accountUuid: string, uuid: string): Promise<TaskContracts.TaskClientDTO> {
    // 委托给领域服务处理
    return await this.domainService.pauseTask(accountUuid, uuid);
  }

  async completeTask(accountUuid: string, uuid: string): Promise<TaskContracts.TaskClientDTO> {
    // 委托给领域服务处理
    return await this.domainService.completeTask(accountUuid, uuid);
  }

  async archiveTask(accountUuid: string, uuid: string): Promise<TaskContracts.TaskClientDTO> {
    // 委托给领域服务处理
    return await this.domainService.archiveTask(accountUuid, uuid);
  }

  // 注意：updateTaskStatus 私有方法已移至 TaskDomainService

  // ===== 搜索和过滤 =====

  async searchTasks(
    accountUuid: string,
    queryParams: any, // Use any since req.query provides strings
  ): Promise<TaskContracts.TaskListResponse> {
    // 委托给 getTasks（它会委托给领域服务）
    return this.getTasks(accountUuid, queryParams);
  }

  // ===== DDD 聚合根控制方法 - 关键结果管理 =====

  /**
   * 通过聚合根创建关键结果
   * 体现DDD原则：所有子实体操作必须通过聚合根
   */
  async createInstance(
    accountUuid: string,
    TaskUuid: string,
    request: {
      name: string;
      description?: string;
      startValue: number;
      targetValue: number;
      currentValue?: number;
      unit: string;
      weight: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
    },
  ): Promise<TaskContracts.InstanceClientDTO> {
    return this.domainService.createInstanceForTask(accountUuid, TaskUuid, request);
  }

  /**
   * 通过聚合根更新关键结果
   */
  async updateInstanceForTask(
    accountUuid: string,
    TaskUuid: string,
    InstanceUuid: string,
    request: {
      name?: string;
      description?: string;
      currentValue?: number;
      weight?: number;
      status?: 'active' | 'completed' | 'archived';
    },
  ): Promise<TaskContracts.InstanceClientDTO> {
    return this.domainService.updateInstanceForTask(accountUuid, TaskUuid, InstanceUuid, request);
  }

  /**
   * 通过聚合根删除关键结果
   */
  async removeInstanceFromTask(
    accountUuid: string,
    TaskUuid: string,
    InstanceUuid: string,
  ): Promise<void> {
    return this.domainService.removeInstanceFromTask(accountUuid, TaskUuid, InstanceUuid);
  }

  // ===== DDD 聚合根控制方法 - 目标记录管理 =====

  /**
   * 通过聚合根创建目标记录
   */
  async createRecordForTask(
    accountUuid: string,
    TaskUuid: string,
    request: {
      InstanceUuid: string;
      value: number;
      note?: string;
    },
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    return this.domainService.createRecordForTask(accountUuid, TaskUuid, request);
  }

  // ===== DDD 聚合根控制方法 - 目标复盘管理 =====

  /**
   * 通过聚合根创建目标复盘
   */
  async createTaskMeta(
    accountUuid: string,
    TaskUuid: string,
    request: {
      title: string;
      type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'custom';
      content: {
        achievements: string;
        challenges: string;
        learnings: string;
        nextSteps: string;
        adjustments?: string;
      };
      rating: {
        progressSatisfaction: number;
        executionEfficiency: number;
        TaskReasonableness: number;
      };
      reviewDate?: Date;
    },
  ): Promise<TaskContracts.TaskMetaClientDTO> {
    return this.domainService.createReviewForTask(accountUuid, TaskUuid, request);
  }

  // ===== 聚合根完整视图 =====

  /**
   * 获取完整的聚合根视图
   * 包含目标及所有相关子实体
   */
  async getTaskAggregateView(
    accountUuid: string,
    TaskUuid: string,
  ): Promise<TaskContracts.TaskAggregateViewResponse> {
    return this.domainService.getTaskAggregateView(accountUuid, TaskUuid);
  }
}
