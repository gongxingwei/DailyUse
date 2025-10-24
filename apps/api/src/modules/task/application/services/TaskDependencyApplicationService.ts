/**
 * TaskDependency Application Service
 * 任务依赖关系应用服务
 *
 * 职责：
 * - 协调领域服务和仓储
 * - 处理依赖关系业务用例
 * - DTO 转换
 */

import type {
  ITaskDependencyRepository,
  ITaskTemplateRepository,
  TaskDependencyService,
} from '@dailyuse/domain-server';
import { TaskContainer } from '../../infrastructure/di/TaskContainer';
import { TaskContracts } from '@dailyuse/contracts';

type TaskDependencyServerDTO = TaskContracts.TaskDependencyServerDTO;
type CreateTaskDependencyRequest = TaskContracts.CreateTaskDependencyRequest;
type UpdateTaskDependencyRequest = TaskContracts.UpdateTaskDependencyRequest;
type ValidateDependencyRequest = TaskContracts.ValidateDependencyRequest;
type ValidateDependencyResponse = TaskContracts.ValidateDependencyResponse;
type DependencyChainServerDTO = TaskContracts.DependencyChainServerDTO;

export class TaskDependencyApplicationService {
  private static instance: TaskDependencyApplicationService;
  private dependencyService: TaskDependencyService;
  private dependencyRepository: ITaskDependencyRepository;
  private taskRepository: ITaskTemplateRepository;

  private constructor(
    dependencyService: TaskDependencyService,
    dependencyRepository: ITaskDependencyRepository,
    taskRepository: ITaskTemplateRepository,
  ) {
    this.dependencyService = dependencyService;
    this.dependencyRepository = dependencyRepository;
    this.taskRepository = taskRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    dependencyService?: TaskDependencyService,
    dependencyRepository?: ITaskDependencyRepository,
    taskRepository?: ITaskTemplateRepository,
  ): Promise<TaskDependencyApplicationService> {
    const container = TaskContainer.getInstance();
    const depRepo = dependencyRepository || container.getTaskDependencyRepository();
    const taskRepo = taskRepository || container.getTaskTemplateRepository();

    // 创建领域服务实例
    const domainService = dependencyService || container.getTaskDependencyService();

    TaskDependencyApplicationService.instance = new TaskDependencyApplicationService(
      domainService,
      depRepo,
      taskRepo,
    );
    return TaskDependencyApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<TaskDependencyApplicationService> {
    if (!TaskDependencyApplicationService.instance) {
      TaskDependencyApplicationService.instance =
        await TaskDependencyApplicationService.createInstance();
    }
    return TaskDependencyApplicationService.instance;
  }

  /**
   * 创建依赖关系
   */
  async createDependency(request: CreateTaskDependencyRequest): Promise<TaskDependencyServerDTO> {
    return await this.dependencyService.createDependency(request);
  }

  /**
   * 获取任务的所有前置依赖
   */
  async getDependencies(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    return await this.dependencyService.getDependencies(taskUuid);
  }

  /**
   * 获取依赖此任务的所有任务
   */
  async getDependents(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    return await this.dependencyService.getDependents(taskUuid);
  }

  /**
   * 删除依赖关系
   */
  async deleteDependency(uuid: string): Promise<void> {
    await this.dependencyService.deleteDependency(uuid);
  }

  /**
   * 验证依赖关系（不实际创建）
   */
  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<ValidateDependencyResponse> {
    return await this.dependencyService.validateDependency(request);
  }

  /**
   * 获取依赖链信息
   */
  async getDependencyChain(taskUuid: string): Promise<DependencyChainServerDTO> {
    return await this.dependencyService.getDependencyChain(taskUuid);
  }

  /**
   * 更新依赖关系
   */
  async updateDependency(
    uuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<TaskDependencyServerDTO> {
    return await this.dependencyRepository.update(uuid, request);
  }
}
