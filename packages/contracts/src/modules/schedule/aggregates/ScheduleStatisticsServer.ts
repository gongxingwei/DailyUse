/**
 * ScheduleStatistics Aggregate Root - Server Interface
 * 调度统计聚合根 - 服务端接口
 */

import type { ScheduleTaskStatus, SourceModule, ExecutionStatus } from '../enums';
import type { ModuleStatisticsServerDTO } from '../value-objects';

// ============ DTO 定义 ============

/**
 * ScheduleStatistics Server DTO
 */
export interface ScheduleStatisticsServerDTO {
  accountUuid: string;

  // 任务统计
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  failedTasks: number;

  // 执行统计
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  timeoutExecutions: number;

  // 性能统计
  avgExecutionDuration: number; // 毫秒
  minExecutionDuration: number; // 毫秒
  maxExecutionDuration: number; // 毫秒

  // 模块统计（按来源模块分组）
  moduleStatistics: Record<string, ModuleStatisticsServerDTO>;

  // 时间戳
  lastUpdatedAt: number; // epoch ms
  createdAt: number; // epoch ms
}

/**
 * ScheduleStatistics Persistence DTO (数据库映射)
 */
export interface ScheduleStatisticsPersistenceDTO {
  id?: number; // 自增主键（可选）
  account_uuid: string;

  // 任务统计
  total_tasks: number;
  active_tasks: number;
  paused_tasks: number;
  completed_tasks: number;
  cancelled_tasks: number;
  failed_tasks: number;

  // 执行统计
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  skipped_executions: number;
  timeout_executions: number;

  // 性能统计
  avg_execution_duration: number;
  min_execution_duration: number;
  max_execution_duration: number;

  // 模块统计（JSON string）
  module_statistics: string;

  // 时间戳
  last_updated_at: number;
  created_at: number;
}

// ============ 领域事件 ============

/**
 * 统计数据创建事件
 */
export interface ScheduleStatisticsCreatedEvent {
  type: 'schedule.statistics.created';
  aggregateId: string; // accountUuid
  timestamp: number; // epoch ms
  payload: {
    accountUuid: string;
  };
}

/**
 * 统计数据更新事件
 */
export interface ScheduleStatisticsUpdatedEvent {
  type: 'schedule.statistics.updated';
  aggregateId: string;
  timestamp: number;
  payload: {
    accountUuid: string;
    changes: string[];
    previousData: Partial<ScheduleStatisticsServerDTO>;
    newData: Partial<ScheduleStatisticsServerDTO>;
  };
}

/**
 * 任务计数变更事件
 */
export interface ScheduleStatisticsTaskCountChangedEvent {
  type: 'schedule.statistics.task.count.changed';
  aggregateId: string;
  timestamp: number;
  payload: {
    status: ScheduleTaskStatus;
    delta: number; // +1 or -1
    totalTasks: number;
  };
}

/**
 * 执行统计更新事件
 */
export interface ScheduleStatisticsExecutionRecordedEvent {
  type: 'schedule.statistics.execution.recorded';
  aggregateId: string;
  timestamp: number;
  payload: {
    status: ExecutionStatus;
    duration: number;
    sourceModule: SourceModule;
    totalExecutions: number;
  };
}

/**
 * 模块统计更新事件
 */
export interface ScheduleStatisticsModuleUpdatedEvent {
  type: 'schedule.statistics.module.updated';
  aggregateId: string;
  timestamp: number;
  payload: {
    moduleName: string;
    moduleStats: ModuleStatisticsServerDTO;
  };
}

/**
 * ScheduleStatistics 领域事件联合类型
 */
export type ScheduleStatisticsDomainEvent =
  | ScheduleStatisticsCreatedEvent
  | ScheduleStatisticsUpdatedEvent
  | ScheduleStatisticsTaskCountChangedEvent
  | ScheduleStatisticsExecutionRecordedEvent
  | ScheduleStatisticsModuleUpdatedEvent;

// ============ 实体接口 ============

/**
 * ScheduleStatistics 聚合根 - Server 接口
 */
export interface ScheduleStatisticsServer {
  // 基础属性
  id: number;
  accountUuid: string;

  // 任务统计
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  failedTasks: number;

  // 执行统计
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  timeoutExecutions: number;

  // 性能统计
  avgExecutionDuration: number;
  minExecutionDuration: number;
  maxExecutionDuration: number;

  // 模块统计
  moduleStatistics: Record<string, ModuleStatisticsServerDTO>;

  // 时间戳
  lastUpdatedAt: number;
  createdAt: number;

  // ===== 业务方法 =====

  // 任务计数管理
  incrementTaskCount(status: ScheduleTaskStatus): void;
  decrementTaskCount(status: ScheduleTaskStatus): void;
  updateTaskStatus(oldStatus: ScheduleTaskStatus, newStatus: ScheduleTaskStatus): void;

  // 执行统计管理
  recordExecution(status: ExecutionStatus, duration: number, sourceModule: SourceModule): void;
  updateExecutionStats(duration: number): void;

  // 模块统计管理
  updateModuleStats(
    moduleName: SourceModule,
    tasksDelta: number,
    activeTasksDelta: number,
    executionsDelta: number,
    successDelta: number,
    failureDelta: number,
    durationMs: number,
  ): void;
  getModuleStats(moduleName: SourceModule): ModuleStatisticsServerDTO | null;
  getAllModuleStats(): ModuleStatisticsServerDTO[];

  // 计算方法
  calculateSuccessRate(): number;
  calculateFailureRate(): number;
  calculateAverageDuration(): number;

  // 重置方法
  reset(): void;
  resetModuleStats(moduleName: SourceModule): void;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ScheduleStatisticsServerDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): ScheduleStatisticsPersistenceDTO;
}

/**
 * ScheduleStatistics 静态工厂方法接口
 */
export interface ScheduleStatisticsServerStatic {
  /**
   * 创建新的 ScheduleStatistics 聚合根（静态工厂方法）
   */
  create(params: { accountUuid: string }): ScheduleStatisticsServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: ScheduleStatisticsServerDTO): ScheduleStatisticsServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: ScheduleStatisticsPersistenceDTO): ScheduleStatisticsServer;
}
