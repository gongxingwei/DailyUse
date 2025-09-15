/**
 * Extended Task Instance Repository Interface
 * 扩展的任务实例仓储接口 - 支持聚合根操作
 */

import { TaskContracts } from '@dailyuse/contracts';
import type { ITaskInstanceRepository } from './ITaskInstanceRepository';

type TaskInstanceDTO = TaskContracts.TaskInstanceDTO;
type TaskInstanceListResponse = TaskContracts.TaskInstanceListResponse;

/**
 * 批量实例操作结果
 */
export interface BatchInstanceOperationResult {
  successful: string[]; // 成功处理的实例UUID
  failed: Array<{
    uuid: string;
    error: string;
  }>;
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

/**
 * 实例聚合查询结果
 */
export interface InstanceAggregateQuery {
  templateUuid: string;
  instances: TaskInstanceDTO[];
  stats: {
    total: number;
    byStatus: Record<string, number>;
    completionRate: number;
    averageDuration?: number;
  };
}

/**
 * 扩展的任务实例仓储接口
 * 通过组合方式添加聚合根操作支持，避免方法签名冲突
 */
export interface ITaskInstanceAggregateRepository {
  // ===== 继承基础仓储的所有方法（除了冲突的方法） =====

  // 基本 CRUD 操作
  findById(uuid: string): Promise<TaskInstanceDTO | null>;
  findByAccountUuid(accountUuid: string): Promise<TaskInstanceDTO[]>;
  save(accountUuid: string, instance: TaskContracts.CreateTaskInstanceRequest): Promise<void>;
  update(uuid: string, instance: TaskContracts.UpdateTaskInstanceRequest): Promise<void>;
  delete(uuid: string): Promise<void>;

  // 状态查询
  findByStatus(accountUuid: string, status: string): Promise<TaskInstanceDTO[]>;
  findPending(accountUuid: string): Promise<TaskInstanceDTO[]>;
  findInProgress(accountUuid: string): Promise<TaskInstanceDTO[]>;
  findCompleted(accountUuid: string): Promise<TaskInstanceDTO[]>;
  findOverdue(accountUuid: string): Promise<TaskInstanceDTO[]>;

  // 时间查询
  findByDateRange(accountUuid: string, startDate: Date, endDate: Date): Promise<TaskInstanceDTO[]>;
  findToday(accountUuid: string): Promise<TaskInstanceDTO[]>;
  findThisWeek(accountUuid: string): Promise<TaskInstanceDTO[]>;
  findUpcoming(accountUuid: string, days?: number): Promise<TaskInstanceDTO[]>;

  // ===== 聚合根感知的查询方法 =====

  /**
   * 按模板UUID查询实例（返回结构化结果）
   * 覆盖基础接口中的同名方法，返回更详细的结果
   * @param templateUuid 模板UUID
   * @returns 结构化的查询结果
   */
  findByTemplateUuid(templateUuid: string): Promise<TaskInstanceListResponse>;

  /**
   * 批量按模板UUID查询实例
   * @param templateUuids 模板UUID列表
   * @returns 按模板分组的实例映射
   */
  findByTemplateUuids(templateUuids: string[]): Promise<Map<string, TaskInstanceDTO[]>>;

  /**
   * 聚合查询 - 同时返回实例和统计信息
   * @param templateUuid 模板UUID
   * @param options 查询选项
   * @returns 包含实例和统计信息的聚合结果
   */
  findAggregateByTemplate(
    templateUuid: string,
    options?: {
      includeCompleted?: boolean;
      dateRange?: {
        from: Date;
        to: Date;
      };
      limit?: number;
      offset?: number;
    },
  ): Promise<InstanceAggregateQuery>;

  // ===== 原子性批量操作方法 =====

  /**
   * 原子性批量保存实例
   * 在单个事务中保存多个实例
   * @param templateUuid 关联的模板UUID
   * @param instances 要保存的实例列表
   * @returns 批量操作结果
   */
  atomicBatchSave(
    templateUuid: string,
    instances: TaskInstanceDTO[],
  ): Promise<BatchInstanceOperationResult>;

  /**
   * 原子性批量更新实例
   * 在单个事务中更新多个实例
   * @param updates 更新操作列表
   * @returns 批量操作结果
   */
  atomicBatchUpdate(
    updates: Array<{
      uuid: string;
      changes: Partial<TaskInstanceDTO>;
    }>,
  ): Promise<BatchInstanceOperationResult>;

  /**
   * 原子性批量状态变更
   * 在单个事务中变更多个实例的状态
   * @param templateUuid 模板UUID（用于聚合根一致性）
   * @param operations 状态变更操作
   * @returns 批量操作结果
   */
  atomicBatchStatusChange(
    templateUuid: string,
    operations: Array<{
      instanceUuid: string;
      newStatus: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue';
      metadata?: {
        reason?: string;
        notes?: string;
        actualDuration?: number;
      };
    }>,
  ): Promise<BatchInstanceOperationResult>;

  /**
   * 原子性级联删除
   * 删除模板时级联删除所有相关实例
   * @param templateUuid 模板UUID
   * @param options 删除选项
   * @returns 删除结果统计
   */
  atomicCascadeDelete(
    templateUuid: string,
    options?: {
      preserveCompleted?: boolean; // 是否保留已完成的实例
      dryRun?: boolean; // 模拟运行
    },
  ): Promise<{
    deletedCount: number;
    preservedCount: number;
    deletedUuids: string[];
  }>;

  // ===== 聚合根一致性支持 =====

  /**
   * 验证实例与模板的一致性
   * @param templateUuid 模板UUID
   * @returns 一致性检查结果
   */
  validateTemplateConsistency(templateUuid: string): Promise<{
    consistent: boolean;
    issues: Array<{
      instanceUuid: string;
      issue: string;
      severity: 'warning' | 'error';
    }>;
  }>;

  /**
   * 同步实例与模板的关联关系
   * 修复可能存在的关联不一致问题
   * @param templateUuid 模板UUID
   * @param dryRun 是否为模拟运行
   * @returns 同步结果
   */
  syncTemplateAssociations(
    templateUuid: string,
    dryRun?: boolean,
  ): Promise<{
    synchronized: boolean;
    changes: string[];
    affectedInstances: string[];
  }>;

  // ===== 聚合根统计和分析 =====

  /**
   * 获取模板级别的实例统计
   * @param templateUuid 模板UUID
   * @param timeRange 时间范围
   * @returns 详细统计信息
   */
  getTemplateInstanceStatistics(
    templateUuid: string,
    timeRange?: {
      from: Date;
      to: Date;
    },
  ): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byTimeRange: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
    performance: {
      completionRate: number;
      averageDuration?: number;
      overdueRate: number;
    };
    trends: {
      creationTrend: Array<{
        date: string;
        count: number;
      }>;
      completionTrend: Array<{
        date: string;
        completed: number;
        total: number;
      }>;
    };
  }>;

  /**
   * 获取实例的生命周期分析
   * @param templateUuid 模板UUID
   * @param limit 分析的实例数量限制
   * @returns 生命周期分析结果
   */
  getInstanceLifecycleAnalysis(
    templateUuid: string,
    limit?: number,
  ): Promise<{
    averageLifecycle: {
      creationToStart?: number; // 毫秒
      startToCompletion?: number; // 毫秒
      totalDuration?: number; // 毫秒
    };
    statusTransitions: Array<{
      from: string;
      to: string;
      count: number;
      averageDuration: number;
    }>;
    commonPatterns: string[];
  }>;

  // ===== 实例关系管理 =====

  /**
   * 查找实例的依赖关系
   * @param instanceUuid 实例UUID
   * @returns 依赖关系图
   */
  findInstanceDependencies(instanceUuid: string): Promise<{
    dependencies: string[]; // 依赖的实例UUID
    dependents: string[]; // 依赖此实例的UUID
    level: number; // 在依赖树中的层级
  }>;

  /**
   * 批量更新实例依赖关系
   * @param dependencies 依赖关系映射
   * @returns 更新结果
   */
  updateInstanceDependencies(
    dependencies: Array<{
      instanceUuid: string;
      dependsOn: string[];
    }>,
  ): Promise<{
    updated: number;
    errors: Array<{
      instanceUuid: string;
      error: string;
    }>;
  }>;

  // ===== 实例版本控制 =====

  /**
   * 获取实例的变更历史
   * @param instanceUuid 实例UUID
   * @param limit 历史记录数量限制
   * @returns 变更历史
   */
  getInstanceChangeHistory(
    instanceUuid: string,
    limit?: number,
  ): Promise<
    Array<{
      version: number;
      timestamp: Date;
      changeType: 'created' | 'updated' | 'status_changed' | 'deleted';
      changes: Record<string, any>;
      metadata?: {
        user?: string;
        reason?: string;
      };
    }>
  >;

  /**
   * 回滚实例到指定版本
   * @param instanceUuid 实例UUID
   * @param targetVersion 目标版本号
   * @param reason 回滚原因
   * @returns 回滚结果
   */
  rollbackInstanceToVersion(
    instanceUuid: string,
    targetVersion: number,
    reason?: string,
  ): Promise<{
    success: boolean;
    previousVersion: number;
    currentVersion: number;
    changes: Record<string, any>;
  }>;
}
