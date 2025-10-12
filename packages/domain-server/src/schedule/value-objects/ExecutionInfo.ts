/**
 * ExecutionInfo 值对象
 * 执行信息 - 不可变值对象
 */

import { ValueObject } from '@dailyuse/utils';
import { ExecutionStatus } from '@dailyuse/contracts';

interface IExecutionInfoDTO {
  nextRunAt: number | null;
  lastRunAt: number | null;
  executionCount: number;
  lastExecutionStatus: ExecutionStatus | null;
  lastExecutionDuration: number | null;
  consecutiveFailures: number;
}

/**
 * ExecutionInfo 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class ExecutionInfo extends ValueObject implements IExecutionInfoDTO {
  public readonly nextRunAt: number | null;
  public readonly lastRunAt: number | null;
  public readonly executionCount: number;
  public readonly lastExecutionStatus: ExecutionStatus | null;
  public readonly lastExecutionDuration: number | null;
  public readonly consecutiveFailures: number;

  constructor(params: {
    nextRunAt?: number | null;
    lastRunAt?: number | null;
    executionCount?: number;
    lastExecutionStatus?: ExecutionStatus | null;
    lastExecutionDuration?: number | null;
    consecutiveFailures?: number;
  }) {
    super();

    this.nextRunAt = params.nextRunAt ?? null;
    this.lastRunAt = params.lastRunAt ?? null;
    this.executionCount = params.executionCount ?? 0;
    this.lastExecutionStatus = params.lastExecutionStatus ?? null;
    this.lastExecutionDuration = params.lastExecutionDuration ?? null;
    this.consecutiveFailures = params.consecutiveFailures ?? 0;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 执行后更新信息
   */
  public updateAfterExecution(params: {
    executedAt: number;
    status: ExecutionStatus;
    duration: number;
    nextRunAt: number | null;
  }): ExecutionInfo {
    const newConsecutiveFailures =
      params.status === ExecutionStatus.FAILED || params.status === ExecutionStatus.TIMEOUT
        ? this.consecutiveFailures + 1
        : 0;

    return new ExecutionInfo({
      nextRunAt: params.nextRunAt,
      lastRunAt: params.executedAt,
      executionCount: this.executionCount + 1,
      lastExecutionStatus: params.status,
      lastExecutionDuration: params.duration,
      consecutiveFailures: newConsecutiveFailures,
    });
  }

  /**
   * 重置失败计数
   */
  public resetFailures(): ExecutionInfo {
    return new ExecutionInfo({
      nextRunAt: this.nextRunAt,
      lastRunAt: this.lastRunAt,
      executionCount: this.executionCount,
      lastExecutionStatus: this.lastExecutionStatus,
      lastExecutionDuration: this.lastExecutionDuration,
      consecutiveFailures: 0,
    });
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      nextRunAt: number | null;
      lastRunAt: number | null;
      executionCount: number;
      lastExecutionStatus: ExecutionStatus | null;
      lastExecutionDuration: number | null;
      consecutiveFailures: number;
    }>,
  ): ExecutionInfo {
    return new ExecutionInfo({
      nextRunAt: changes.nextRunAt !== undefined ? changes.nextRunAt : this.nextRunAt,
      lastRunAt: changes.lastRunAt !== undefined ? changes.lastRunAt : this.lastRunAt,
      executionCount: changes.executionCount ?? this.executionCount,
      lastExecutionStatus:
        changes.lastExecutionStatus !== undefined
          ? changes.lastExecutionStatus
          : this.lastExecutionStatus,
      lastExecutionDuration:
        changes.lastExecutionDuration !== undefined
          ? changes.lastExecutionDuration
          : this.lastExecutionDuration,
      consecutiveFailures: changes.consecutiveFailures ?? this.consecutiveFailures,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ExecutionInfo)) {
      return false;
    }

    return (
      this.nextRunAt === other.nextRunAt &&
      this.lastRunAt === other.lastRunAt &&
      this.executionCount === other.executionCount &&
      this.lastExecutionStatus === other.lastExecutionStatus &&
      this.lastExecutionDuration === other.lastExecutionDuration &&
      this.consecutiveFailures === other.consecutiveFailures
    );
  }

  /**
   * 转换为 DTO
   */
  public toDTO(): IExecutionInfoDTO {
    return {
      nextRunAt: this.nextRunAt,
      lastRunAt: this.lastRunAt,
      executionCount: this.executionCount,
      lastExecutionStatus: this.lastExecutionStatus,
      lastExecutionDuration: this.lastExecutionDuration,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromDTO(dto: IExecutionInfoDTO): ExecutionInfo {
    return new ExecutionInfo(dto);
  }

  /**
   * 创建默认执行信息
   */
  public static createDefault(nextRunAt: number | null = null): ExecutionInfo {
    return new ExecutionInfo({
      nextRunAt,
      lastRunAt: null,
      executionCount: 0,
      lastExecutionStatus: null,
      lastExecutionDuration: null,
      consecutiveFailures: 0,
    });
  }
}
