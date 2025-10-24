/**
 * Weight Snapshot Application Service
 * 权重快照应用服务
 *
 * 负责权重快照的创建、查询和权重总和校验。
 */

import type {
  IGoalRepository,
  IWeightSnapshotRepository,
  KeyResult,
} from '@dailyuse/domain-server';
import { KeyResultWeightSnapshot } from '@dailyuse/domain-server';
import type { GoalContracts } from '@dailyuse/contracts';
import { GoalNotFoundError, KeyResultNotFoundError } from '../errors/WeightSnapshotErrors';

/**
 * 快照触发类型
 */
type SnapshotTrigger = GoalContracts.SnapshotTrigger;

/**
 * 创建快照 DTO
 */
export interface CreateSnapshotDTO {
  goalUuid: string;
  krUuid: string;
  oldWeight: number;
  newWeight: number;
  trigger: SnapshotTrigger;
  operatorUuid: string;
  reason?: string;
}

/**
 * 快照查询选项
 */
export interface SnapshotQueryOptions {
  page?: number;
  pageSize?: number;
}

/**
 * 权重快照应用服务
 *
 * **职责**:
 * - 创建权重快照记录
 * - 校验权重总和 = 100%
 * - 查询快照历史（按 Goal、KR、时间范围）
 *
 * **设计模式**: Singleton
 * **依赖注入**: GoalRepository, WeightSnapshotRepository
 */
export class WeightSnapshotApplicationService {
  private static instance: WeightSnapshotApplicationService;

  private constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly snapshotRepository: IWeightSnapshotRepository,
  ) {}

  /**
   * 获取单例实例
   */
  public static getInstance(
    goalRepository: IGoalRepository,
    snapshotRepository: IWeightSnapshotRepository,
  ): WeightSnapshotApplicationService {
    if (!WeightSnapshotApplicationService.instance) {
      WeightSnapshotApplicationService.instance = new WeightSnapshotApplicationService(
        goalRepository,
        snapshotRepository,
      );
    }
    return WeightSnapshotApplicationService.instance;
  }

  /**
   * 创建权重快照
   *
   * **流程**:
   * 1. 验证 Goal 存在
   * 2. 验证 KR 存在于该 Goal 中
   * 3. 创建 KeyResultWeightSnapshot 值对象
   * 4. 保存到仓储
   *
   * @param dto - 快照创建数据
   * @returns 创建的快照实例
   * @throws {GoalNotFoundError} Goal 不存在
   * @throws {KeyResultNotFoundError} KR 不存在于该 Goal
   *
   * @example
   * ```typescript
   * const snapshot = await service.createSnapshot({
   *   goalUuid: 'goal-123',
   *   krUuid: 'kr-456',
   *   oldWeight: 30,
   *   newWeight: 50,
   *   trigger: 'manual',
   *   operatorUuid: 'user-789',
   *   reason: 'Adjusted based on Q1 feedback'
   * });
   * ```
   */
  async createSnapshot(dto: CreateSnapshotDTO): Promise<KeyResultWeightSnapshot> {
    // 1. 验证 Goal 存在
    const goal = await this.goalRepository.findById(dto.goalUuid, { includeChildren: true });
    if (!goal) {
      throw new GoalNotFoundError(dto.goalUuid);
    }

    // 2. 验证 KR 存在于该 Goal
    const kr = goal.keyResults.find((k: KeyResult) => k.uuid === dto.krUuid);
    if (!kr) {
      throw new KeyResultNotFoundError(dto.krUuid);
    }

    // 3. 创建快照值对象（使用 UUID 生成）
    const snapshot = new KeyResultWeightSnapshot(
      crypto.randomUUID(),
      dto.goalUuid,
      dto.krUuid,
      dto.oldWeight,
      dto.newWeight,
      Date.now(),
      dto.trigger,
      dto.operatorUuid,
      dto.reason,
      Date.now(), // createdAt
    );

    // 4. 保存快照
    await this.snapshotRepository.save(snapshot);

    return snapshot;
  }

  /**
   * 校验 Goal 中所有 KR 的权重总和是否为 100%
   *
   * **业务规则**: 所有 KeyResult 的权重之和必须等于 100%
   * **浮点精度**: 使用 0.01 的误差范围（避免浮点数精度问题）
   *
   * **注意**: 当前 KeyResult 实体暂无 `weight` 属性，此方法需要传入权重 map
   *
   * @param goalUuid - Goal UUID
   * @param weights - KR UUID → weight 映射 (如果不传则从 Goal 获取)
   * @returns true 如果总和 = 100%, false 否则
   * @throws {GoalNotFoundError} Goal 不存在
   *
   * @example
   * ```typescript
   * const weights = {
   *   'kr-1': 30,
   *   'kr-2': 40,
   *   'kr-3': 30
   * };
   * const isValid = await service.validateWeightSum('goal-123', weights);
   * if (!isValid) {
   *   throw new InvalidWeightSumError(...);
   * }
   * ```
   */
  async validateWeightSum(goalUuid: string, weights: Record<string, number>): Promise<boolean> {
    // 验证 Goal 存在
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new GoalNotFoundError(goalUuid);
    }

    // 计算权重总和
    const totalWeight = Object.values(weights).reduce(
      (sum: number, weight: number) => sum + weight,
      0,
    );

    // 浮点数精度处理: 允许 ±0.01 的误差
    return Math.abs(totalWeight - 100) < 0.01;
  }

  /**
   * 获取 Goal 中所有 KR 的权重分布
   *
   * 用于错误报告和调试。
   *
   * **注意**: 当前需要从外部传入权重数据，未来 KeyResult 实体添加 weight 属性后可直接查询
   *
   * @param goalUuid - Goal UUID
   * @param weights - KR UUID → weight 映射
   * @returns Record<KR_UUID, weight> 和总和
   * @throws {GoalNotFoundError} Goal 不存在
   */
  async getWeightDistribution(
    goalUuid: string,
    weights: Record<string, number>,
  ): Promise<{ weights: Record<string, number>; total: number }> {
    // 验证 Goal 存在
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new GoalNotFoundError(goalUuid);
    }

    const total = Object.values(weights).reduce((sum: number, weight: number) => sum + weight, 0);

    return { weights, total };
  }

  /**
   * 查询 Goal 的所有权重快照
   *
   * **排序**: 按时间倒序（最新的在前）
   * **分页**: 支持 page 和 pageSize 参数
   *
   * @param goalUuid - Goal UUID
   * @param options - 查询选项 (分页)
   * @returns 快照列表和总数
   *
   * @example
   * ```typescript
   * const { snapshots, total } = await service.getSnapshotsByGoal('goal-123', {
   *   page: 1,
   *   pageSize: 20
   * });
   * ```
   */
  async getSnapshotsByGoal(
    goalUuid: string,
    options: SnapshotQueryOptions = {},
  ): Promise<{ snapshots: KeyResultWeightSnapshot[]; total: number }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const result = await this.snapshotRepository.findByGoal(goalUuid, page, pageSize);

    return result;
  }

  /**
   * 查询 KeyResult 的所有权重快照
   *
   * **排序**: 按时间倒序（最新的在前）
   * **分页**: 支持 page 和 pageSize 参数
   *
   * @param krUuid - KeyResult UUID
   * @param options - 查询选项 (分页)
   * @returns 快照列表和总数
   *
   * @example
   * ```typescript
   * const { snapshots, total } = await service.getSnapshotsByKeyResult('kr-456', {
   *   page: 1,
   *   pageSize: 10
   * });
   * ```
   */
  async getSnapshotsByKeyResult(
    krUuid: string,
    options: SnapshotQueryOptions = {},
  ): Promise<{ snapshots: KeyResultWeightSnapshot[]; total: number }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const result = await this.snapshotRepository.findByKeyResult(krUuid, page, pageSize);

    return result;
  }

  /**
   * 查询时间范围内的权重快照
   *
   * **排序**: 按时间排序
   * **分页**: 支持 page 和 pageSize 参数
   * **用途**: 用于分析特定时期的权重变更趋势
   *
   * @param startTime - 开始时间戳 (ms)
   * @param endTime - 结束时间戳 (ms)
   * @param options - 查询选项 (分页)
   * @returns 快照列表和总数
   *
   * @example
   * ```typescript
   * const startOfMonth = Date.parse('2025-10-01');
   * const endOfMonth = Date.parse('2025-10-31');
   *
   * const { snapshots, total } = await service.getSnapshotsByTimeRange(
   *   startOfMonth,
   *   endOfMonth,
   *   { page: 1, pageSize: 50 }
   * );
   * ```
   */
  async getSnapshotsByTimeRange(
    startTime: number,
    endTime: number,
    options: SnapshotQueryOptions = {},
  ): Promise<{ snapshots: KeyResultWeightSnapshot[]; total: number }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const result = await this.snapshotRepository.findByTimeRange(
      startTime,
      endTime,
      page,
      pageSize,
    );

    return result;
  }
}
