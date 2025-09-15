import type { ReminderContracts } from '@dailyuse/contracts';
import { ImportanceLevel } from '@dailyuse/contracts';
import { ReminderTemplate } from '../aggregates/ReminderTemplate';
import { ReminderInstance } from '../entities/ReminderInstance';

/**
 * 提醒模板聚合根仓储接口 - 支持聚合根管理模式
 *
 * 聚合根仓储的特点：
 * 1. 通过聚合根管理整个聚合的生命周期
 * 2. 确保业务不变量在聚合边界内得到维护
 * 3. 统一管理聚合内的所有实体和值对象
 * 4. 提供事务一致性保证
 */
export interface IReminderAggregateRepository {
  // ===== 聚合根生命周期管理 =====

  /**
   * 获取提醒模板聚合根（包含所有关联的提醒实例）
   */
  getAggregateById(uuid: string): Promise<ReminderTemplate | null>;

  /**
   * 获取账户下的所有提醒模板聚合根
   */
  getAggregatesByAccountUuid(accountUuid: string): Promise<ReminderTemplate[]>;

  /**
   * 保存提醒模板聚合根（包含所有关联实体的变更）
   */
  saveAggregate(aggregate: ReminderTemplate): Promise<void>;

  /**
   * 删除提醒模板聚合根（级联删除所有关联实体）
   */
  deleteAggregate(uuid: string): Promise<void>;

  // ===== 聚合根查询操作 =====

  /**
   * 按分组获取聚合根
   */
  getAggregatesByGroupUuid(groupUuid: string): Promise<ReminderTemplate[]>;

  /**
   * 按类别获取聚合根
   */
  getAggregatesByCategory(accountUuid: string, category: string): Promise<ReminderTemplate[]>;

  /**
   * 按优先级获取聚合根
   */
  getAggregatesByPriority(
    accountUuid: string,
    priority: ReminderContracts.ReminderPriority,
  ): Promise<ReminderTemplate[]>;

  /**
   * 按标签获取聚合根
   */
  getAggregatesByTags(accountUuid: string, tags: string[]): Promise<ReminderTemplate[]>;

  /**
   * 获取启用的聚合根
   */
  getEnabledAggregates(accountUuid: string): Promise<ReminderTemplate[]>;

  /**
   * 搜索聚合根
   */
  searchAggregates(
    accountUuid: string,
    query: ReminderContracts.ReminderQueryParamsDTO,
  ): Promise<ReminderTemplate[]>;

  // ===== 聚合根状态管理 =====

  /**
   * 启用/禁用聚合根及其所有实例
   */
  toggleAggregateEnabled(uuid: string): Promise<void>;

  /**
   * 批量启用聚合根
   */
  batchEnableAggregates(uuids: string[]): Promise<void>;

  /**
   * 批量禁用聚合根
   */
  batchDisableAggregates(uuids: string[]): Promise<void>;

  // ===== 聚合根实例管理 =====

  /**
   * 通过聚合根创建新的提醒实例
   */
  createInstanceThroughAggregate(
    templateUuid: string,
    instanceData: Partial<ReminderContracts.IReminderInstance>,
  ): Promise<ReminderInstance>;

  /**
   * 通过聚合根更新提醒实例状态
   */
  updateInstanceStatusThroughAggregate(
    templateUuid: string,
    instanceUuid: string,
    status: ReminderContracts.ReminderStatus,
    timestamp?: Date,
  ): Promise<void>;

  /**
   * 通过聚合根处理实例响应
   */
  processInstanceResponseThroughAggregate(
    templateUuid: string,
    instanceUuid: string,
    response: {
      operation: 'acknowledge' | 'dismiss' | 'snooze' | 'delete';
      snoozeUntil?: Date;
      reason?: string;
    },
  ): Promise<void>;

  /**
   * 通过聚合根批量创建重复实例
   */
  createRecurringInstancesThroughAggregate(
    templateUuid: string,
    config: {
      startDate: Date;
      endDate: Date;
      recurrenceRule: ReminderContracts.RecurrenceRule;
      maxInstances?: number;
    },
  ): Promise<ReminderInstance[]>;

  // ===== 聚合根统计和分析 =====

  /**
   * 获取聚合根统计信息（包含实例统计）
   */
  getAggregateStats(uuid: string): Promise<{
    template: ReminderContracts.ReminderTemplateResponse;
    instanceStats: {
      total: number;
      pending: number;
      triggered: number;
      acknowledged: number;
      dismissed: number;
      cancelled: number;
      snoozed: number;
    };
    performanceMetrics: {
      averageResponseTime: number;
      acknowledgmentRate: number;
      dismissalRate: number;
      snoozeRate: number;
    };
  }>;

  /**
   * 获取账户级别的聚合统计
   */
  getAccountAggregateStats(accountUuid: string): Promise<{
    totalTemplates: number;
    enabledTemplates: number;
    totalInstances: number;
    instancesByStatus: Record<ReminderContracts.ReminderStatus, number>;
    categoryDistribution: Record<string, number>;
    priorityDistribution: Record<ReminderContracts.ReminderPriority, number>;
  }>;

  // ===== 聚合根事件处理 =====

  /**
   * 获取聚合根的领域事件
   */
  getAggregateEvents(
    uuid: string,
    since?: Date,
  ): Promise<
    Array<{
      eventType: string;
      aggregateId: string;
      occurredOn: Date;
      payload: any;
    }>
  >;

  /**
   * 清除已处理的聚合根事件
   */
  clearProcessedEvents(uuid: string, eventIds: string[]): Promise<void>;

  // ===== 聚合根一致性检查 =====

  /**
   * 验证聚合根的业务不变量
   */
  validateAggregateInvariants(uuid: string): Promise<{
    isValid: boolean;
    violations: string[];
  }>;

  /**
   * 修复聚合根的数据一致性问题
   */
  repairAggregateConsistency(uuid: string): Promise<{
    repaired: boolean;
    issues: string[];
    actions: string[];
  }>;

  // ===== 聚合根快照和恢复 =====

  /**
   * 创建聚合根快照
   */
  createAggregateSnapshot(uuid: string): Promise<{
    snapshotId: string;
    timestamp: Date;
    version: number;
  }>;

  /**
   * 从快照恢复聚合根
   */
  restoreFromSnapshot(uuid: string, snapshotId: string): Promise<void>;

  /**
   * 获取聚合根的所有快照
   */
  getAggregateSnapshots(uuid: string): Promise<
    Array<{
      snapshotId: string;
      timestamp: Date;
      version: number;
      description?: string;
    }>
  >;
}
