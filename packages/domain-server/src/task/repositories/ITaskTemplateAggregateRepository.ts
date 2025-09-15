/**
 * Extended Task Template Repository Interface
 * 扩展的任务模板仓储接口 - 支持聚合根操作
 */

import { TaskContracts, ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import type { ITaskTemplateRepository } from './ITaskTemplateRepository';

type TaskTemplateDTO = TaskContracts.TaskTemplateDTO;
type TaskInstanceDTO = TaskContracts.TaskInstanceDTO;
type TaskTemplateListResponse = TaskContracts.TaskTemplateListResponse;
type TaskInstanceListResponse = TaskContracts.TaskInstanceListResponse;

/**
 * 聚合根加载结果
 */
export interface TaskTemplateAggregateResult {
  template: TaskTemplateDTO;
  instances: TaskInstanceDTO[];
}

/**
 * 聚合根变更追踪
 */
export interface TaskTemplateAggregateChanges {
  template?: {
    original: TaskTemplateDTO;
    updated: TaskTemplateDTO;
  };
  instances: {
    created: TaskInstanceDTO[];
    updated: Array<{
      original: TaskInstanceDTO;
      updated: TaskInstanceDTO;
    }>;
    deleted: string[]; // UUIDs of deleted instances
  };
}

/**
 * 聚合根原子性操作请求
 */
export interface TaskTemplateAtomicUpdateRequest {
  templateChanges?: Partial<TaskTemplateDTO>;
  instanceChanges: {
    create?: TaskInstanceDTO[];
    update?: Array<{
      uuid: string;
      changes: Partial<TaskInstanceDTO>;
    }>;
    delete?: string[];
  };
}

/**
 * 扩展的任务模板仓储接口
 * 在原有接口基础上添加聚合根操作支持
 */
export interface ITaskTemplateAggregateRepository extends ITaskTemplateRepository {
  // ===== 聚合根加载方法 =====

  /**
   * 加载任务模板聚合根（包含所有关联的实例）
   * @param templateUuid 模板UUID
   * @returns 包含模板和所有实例的聚合根数据
   */
  loadAggregate(templateUuid: string): Promise<TaskTemplateAggregateResult | null>;

  /**
   * 批量加载多个聚合根
   * @param templateUuids 模板UUID列表
   * @returns 聚合根数据映射表
   */
  loadAggregates(templateUuids: string[]): Promise<Map<string, TaskTemplateAggregateResult>>;

  /**
   * 按账户加载所有聚合根
   * @param accountUuid 账户UUID
   * @param options 加载选项
   * @returns 账户下所有聚合根
   */
  loadAccountAggregates(
    accountUuid: string,
    options?: {
      includeArchived?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskTemplateAggregateResult[]>;

  // ===== 聚合根原子性操作 =====

  /**
   * 原子性保存聚合根
   * 在单个事务中保存模板和所有关联的实例变更
   * @param templateUuid 模板UUID
   * @param aggregateData 完整的聚合根数据
   */
  saveAggregate(templateUuid: string, aggregateData: TaskTemplateAggregateResult): Promise<void>;

  /**
   * 原子性更新聚合根
   * 基于变更追踪进行增量更新
   * @param templateUuid 模板UUID
   * @param changes 变更内容
   */
  updateAggregate(templateUuid: string, changes: TaskTemplateAggregateChanges): Promise<void>;

  /**
   * 原子性批量更新聚合根
   * 在单个事务中执行多项变更
   * @param templateUuid 模板UUID
   * @param request 原子性更新请求
   */
  atomicUpdate(templateUuid: string, request: TaskTemplateAtomicUpdateRequest): Promise<void>;

  /**
   * 原子性删除聚合根
   * 删除模板及其所有关联的实例
   * @param templateUuid 模板UUID
   * @param cascade 是否级联删除（默认true）
   */
  deleteAggregate(templateUuid: string, cascade?: boolean): Promise<void>;

  // ===== 聚合根一致性检查 =====

  /**
   * 验证聚合根一致性
   * 检查模板和实例之间的数据一致性
   * @param templateUuid 模板UUID
   * @returns 一致性检查结果
   */
  validateAggregateConsistency(templateUuid: string): Promise<{
    isConsistent: boolean;
    issues: string[];
    suggestions: string[];
  }>;

  /**
   * 修复聚合根一致性
   * 自动修复发现的一致性问题
   * @param templateUuid 模板UUID
   * @param dryRun 是否为模拟运行（不实际修改数据）
   */
  repairAggregateConsistency(
    templateUuid: string,
    dryRun?: boolean,
  ): Promise<{
    repaired: boolean;
    changes: string[];
  }>;

  // ===== 聚合根查询扩展 =====

  /**
   * 查询聚合根的统计信息
   * @param templateUuid 模板UUID
   * @returns 聚合根级别的统计数据
   */
  getAggregateStatistics(templateUuid: string): Promise<{
    templateStats: TaskContracts.TaskStatsDTO;
    instanceStats: {
      total: number;
      byStatus: Record<string, number>;
      byTimeRange: Record<string, number>;
      completionRate: number;
      averageDuration?: number;
    };
    lastActivity?: Date;
  }>;

  /**
   * 搜索聚合根
   * 基于模板和实例的复合条件进行搜索
   * @param accountUuid 账户UUID
   * @param query 聚合根搜索条件
   */
  searchAggregates(
    accountUuid: string,
    query: {
      templateTitle?: string;
      instanceStatus?: string[];
      dateRange?: {
        from: Date;
        to: Date;
      };
      properties?: {
        importance?: ImportanceLevel[];
        urgency?: UrgencyLevel[];
        tags?: string[];
      };
      includeEmpty?: boolean; // 是否包含没有实例的模板
    },
  ): Promise<TaskTemplateAggregateResult[]>;

  // ===== 聚合根版本控制 =====

  /**
   * 获取聚合根版本信息
   * @param templateUuid 模板UUID
   * @returns 版本信息
   */
  getAggregateVersion(templateUuid: string): Promise<{
    templateVersion: number;
    lastModified: Date;
    instanceCount: number;
    checksum: string;
  }>;

  /**
   * 检查聚合根是否存在并发修改
   * @param templateUuid 模板UUID
   * @param expectedVersion 期望的版本号
   * @returns 是否存在并发修改
   */
  checkConcurrentModification(templateUuid: string, expectedVersion: number): Promise<boolean>;

  // ===== 聚合根事件支持 =====

  /**
   * 获取聚合根的领域事件
   * @param templateUuid 模板UUID
   * @param sinceVersion 从指定版本开始获取事件
   * @returns 领域事件列表
   */
  getAggregateEvents(
    templateUuid: string,
    sinceVersion?: number,
  ): Promise<
    Array<{
      eventId: string;
      eventType: string;
      eventData: any;
      version: number;
      timestamp: Date;
    }>
  >;
}
