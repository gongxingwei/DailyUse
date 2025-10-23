/**
 * TaskDependency Domain Service
 * 任务依赖关系领域服务
 *
 * 职责：
 * - 循环依赖检测
 * - 依赖状态计算
 * - 依赖关系管理
 */

import { TaskContracts } from '@dailyuse/contracts';
import type { ITaskDependencyRepository } from '../repositories/ITaskDependencyRepository';
import type { ITaskTemplateRepository } from '../repositories/ITaskTemplateRepository';

// Type aliases for easier usage
type TaskDependencyServerDTO = TaskContracts.TaskDependencyServerDTO;
type CreateTaskDependencyRequest = TaskContracts.CreateTaskDependencyRequest;
type CircularDependencyValidationResult = TaskContracts.CircularDependencyValidationResult;
type DependencyStatus = TaskContracts.DependencyStatus;
type ValidateDependencyRequest = TaskContracts.ValidateDependencyRequest;
type ValidateDependencyResponse = TaskContracts.ValidateDependencyResponse;
type DependencyChainServerDTO = TaskContracts.DependencyChainServerDTO;

export class TaskDependencyService {
  constructor(
    private readonly dependencyRepo: ITaskDependencyRepository,
    private readonly taskRepo: ITaskTemplateRepository,
  ) {}

  /**
   * 检测是否会形成循环依赖
   * 使用深度优先搜索（DFS）算法
   * 时间复杂度：O(V + E)，其中 V = 任务数，E = 依赖关系数
   *
   * @param predecessorUuid 前置任务 UUID
   * @param successorUuid 后续任务 UUID
   * @returns 验证结果，包含是否有效和循环路径
   */
  async detectCircularDependency(
    predecessorUuid: string,
    successorUuid: string,
  ): Promise<CircularDependencyValidationResult> {
    // 如果添加这个依赖，检查是否存在从 successor 到 predecessor 的路径
    // 如果存在，说明会形成循环
    const visited = new Set<string>();
    const path: string[] = [];

    const hasCycle = await this.dfsDetectCycle(
      successorUuid,
      predecessorUuid,
      visited,
      path,
    );

    if (hasCycle) {
      return {
        isValid: false,
        cycle: [...path, predecessorUuid],
        message: `创建此依赖会形成循环依赖: ${[...path, predecessorUuid].join(' → ')}`,
      };
    }

    return { isValid: true };
  }

  /**
   * 深度优先搜索检测循环
   * @private
   */
  private async dfsDetectCycle(
    current: string,
    target: string,
    visited: Set<string>,
    path: string[],
  ): Promise<boolean> {
    // 找到目标，说明存在循环
    if (current === target) {
      return true;
    }

    // 已访问过，避免重复
    if (visited.has(current)) {
      return false;
    }

    visited.add(current);
    path.push(current);

    // 获取当前任务的所有后续任务
    const dependencies = await this.dependencyRepo.findByPredecessor(current);

    for (const dep of dependencies) {
      if (await this.dfsDetectCycle(dep.successorTaskUuid, target, visited, path)) {
        return true;
      }
    }

    path.pop();
    return false;
  }

  /**
   * 计算任务的依赖状态
   *
   * @param taskUuid 任务 UUID
   * @returns 依赖状态
   */
  async calculateDependencyStatus(taskUuid: string): Promise<{
    status: DependencyStatus;
    isBlocked: boolean;
    blockingReason?: string;
  }> {
    // 获取此任务的所有前置依赖
    const dependencies = await this.dependencyRepo.findBySuccessor(taskUuid);

    if (dependencies.length === 0) {
      return {
        status: 'NONE' as DependencyStatus,
        isBlocked: false,
      };
    }

    // 获取所有前置任务的状态
    const predecessorTasks = await Promise.all(
      dependencies.map(dep => this.taskRepo.findByUuid(dep.predecessorTaskUuid)),
    );

    // 检查是否有任务未找到
    const notFound = predecessorTasks.some(task => task === null);
    if (notFound) {
      return {
        status: 'BLOCKED' as DependencyStatus,
        isBlocked: true,
        blockingReason: '部分前置任务不存在',
      };
    }

    // 过滤掉 null 值
    const tasks = predecessorTasks.filter(Boolean) as any[];

    // 检查是否有前置任务被阻塞
    const anyBlocked = tasks.some((task: any) => task.isBlocked === true);
    if (anyBlocked) {
      const blockedTasks = tasks
        .filter((task: any) => task.isBlocked)
        .map((task: any) => task.title)
        .join(', ');
      return {
        status: 'BLOCKED' as DependencyStatus,
        isBlocked: true,
        blockingReason: `前置任务被阻塞: ${blockedTasks}`,
      };
    }

    // 检查是否所有前置任务都已完成
    const allCompleted = tasks.every((task: any) => task.status === 'COMPLETED');
    if (allCompleted) {
      return {
        status: 'READY' as DependencyStatus,
        isBlocked: false,
      };
    }

    // 否则处于等待状态
    const waitingFor = tasks
      .filter((task: any) => task.status !== 'COMPLETED')
      .map((task: any) => task.title)
      .join(', ');

    return {
      status: 'WAITING' as DependencyStatus,
      isBlocked: true,
      blockingReason: `等待前置任务完成: ${waitingFor}`,
    };
  }

  /**
   * 创建依赖关系（带验证）
   *
   * @param request 创建请求
   * @returns 创建的依赖关系
   */
  async createDependency(
    request: CreateTaskDependencyRequest,
  ): Promise<TaskDependencyServerDTO> {
    // 1. 验证任务存在
    const [predecessor, successor] = await Promise.all([
      this.taskRepo.findByUuid(request.predecessorTaskUuid),
      this.taskRepo.findByUuid(request.successorTaskUuid),
    ]);

    if (!predecessor) {
      throw new Error(`前置任务不存在: ${request.predecessorTaskUuid}`);
    }

    if (!successor) {
      throw new Error(`后续任务不存在: ${request.successorTaskUuid}`);
    }

    // 2. 检查是否是同一个任务
    if (request.predecessorTaskUuid === request.successorTaskUuid) {
      throw new Error('任务不能依赖自己');
    }

    // 3. 检查循环依赖
    const validation = await this.detectCircularDependency(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
    );

    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    // 4. 检查是否已存在
    const existing = await this.dependencyRepo.findByPredecessorAndSuccessor(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
    );

    if (existing) {
      throw new Error('依赖关系已存在');
    }

    // 5. 创建依赖关系
    const dependency = await this.dependencyRepo.create(request);

    // 6. 更新后续任务的依赖状态
    const newStatus = await this.calculateDependencyStatus(request.successorTaskUuid);
    // TODO: Update task status in repository
    // await this.taskRepo.updateDependencyStatus(request.successorTaskUuid, newStatus);

    return dependency;
  }

  /**
   * 验证依赖关系（不实际创建）
   */
  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<ValidateDependencyResponse> {
    const errors: string[] = [];

    // 验证任务存在
    const [predecessor, successor] = await Promise.all([
      this.taskRepo.findByUuid(request.predecessorTaskUuid),
      this.taskRepo.findByUuid(request.successorTaskUuid),
    ]);

    if (!predecessor) {
      errors.push('前置任务不存在');
    }

    if (!successor) {
      errors.push('后续任务不存在');
    }

    // 验证不是同一个任务
    if (request.predecessorTaskUuid === request.successorTaskUuid) {
      errors.push('任务不能依赖自己');
    }

    // 检查循环依赖
    const validation = await this.detectCircularDependency(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
    );

    if (!validation.isValid) {
      return {
        isValid: false,
        errors: [validation.message!],
        wouldCreateCycle: true,
        cyclePath: validation.cycle,
        message: validation.message,
      };
    }

    // 检查是否已存在
    const existing = await this.dependencyRepo.findByPredecessorAndSuccessor(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
    );

    if (existing) {
      errors.push('依赖关系已存在');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: true,
      message: '依赖关系有效，可以创建',
    };
  }

  /**
   * 删除依赖关系
   */
  async deleteDependency(uuid: string): Promise<void> {
    const dependency = await this.dependencyRepo.findByUuid(uuid);

    if (!dependency) {
      throw new Error('依赖关系不存在');
    }

    await this.dependencyRepo.delete(uuid);

    // 更新后续任务的状态
    const newStatus = await this.calculateDependencyStatus(dependency.successorTaskUuid);
    // TODO: Update task status
    // await this.taskRepo.updateDependencyStatus(dependency.successorTaskUuid, newStatus);
  }

  /**
   * 获取任务的所有依赖
   */
  async getDependencies(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    return this.dependencyRepo.findBySuccessor(taskUuid);
  }

  /**
   * 获取依赖此任务的所有任务
   */
  async getDependents(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    return this.dependencyRepo.findByPredecessor(taskUuid);
  }

  /**
   * 获取依赖链信息
   */
  async getDependencyChain(taskUuid: string): Promise<DependencyChainServerDTO> {
    const [allPredecessors, allSuccessors] = await Promise.all([
      this.dependencyRepo.findAllPredecessors(taskUuid),
      this.dependencyRepo.findAllSuccessors(taskUuid),
    ]);

    // 计算深度（从根任务到此任务的最长路径）
    const depth = await this.calculateDepth(taskUuid);

    // TODO: 实现关键路径判断
    const isOnCriticalPath = false;

    return {
      taskUuid,
      allPredecessors,
      allSuccessors,
      depth,
      isOnCriticalPath,
    };
  }

  /**
   * 计算任务深度
   * @private
   */
  private async calculateDepth(taskUuid: string): Promise<number> {
    const dependencies = await this.dependencyRepo.findBySuccessor(taskUuid);

    if (dependencies.length === 0) {
      return 0; // 根任务
    }

    const depths = await Promise.all(
      dependencies.map(dep => this.calculateDepth(dep.predecessorTaskUuid)),
    );

    return Math.max(...depths) + 1;
  }

  /**
   * 拓扑排序（用于关键路径分析）
   * @param taskUuids 任务 UUID 列表
   * @returns 排序后的任务 UUID 列表
   */
  async topologicalSort(taskUuids: string[]): Promise<string[]> {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // 初始化
    for (const uuid of taskUuids) {
      graph.set(uuid, []);
      inDegree.set(uuid, 0);
    }

    // 构建图
    for (const uuid of taskUuids) {
      const dependencies = await this.dependencyRepo.findBySuccessor(uuid);
      for (const dep of dependencies) {
        if (taskUuids.includes(dep.predecessorTaskUuid)) {
          graph.get(dep.predecessorTaskUuid)?.push(uuid);
          inDegree.set(uuid, (inDegree.get(uuid) || 0) + 1);
        }
      }
    }

    // Kahn 算法
    const queue: string[] = [];
    const result: string[] = [];

    // 找到所有入度为 0 的节点
    for (const [uuid, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(uuid);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = graph.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // 如果结果长度不等于输入长度，说明有循环
    if (result.length !== taskUuids.length) {
      throw new Error('检测到循环依赖，无法进行拓扑排序');
    }

    return result;
  }
}
