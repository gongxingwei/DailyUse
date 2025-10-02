import type { ReminderContracts } from '@dailyuse/contracts';
import { ImportanceLevel } from '@dailyuse/contracts';
import { ReminderTemplate } from '../aggregates/ReminderTemplate';
import { ReminderInstance } from '../entities/ReminderInstance';
import type { IReminderAggregateRepository } from '../repositories/IReminderAggregateRepository';

/**
 * 提醒聚合服务 - 实现聚合根控制模式的核心服务
 *
 * 聚合根控制模式的特点：
 * 1. 所有对聚合内实体的操作都通过聚合根进行
 * 2. 确保业务不变量在聚合边界内得到维护
 * 3. 统一管理聚合的生命周期和状态变化
 * 4. 提供事务一致性保证
 */
export class ReminderAggregateService {
  constructor(private readonly reminderAggregateRepository: IReminderAggregateRepository) {}

  // ===== 聚合根创建和管理 =====

  /**
   * 创建新的提醒模板聚合根
   */
  async createReminderTemplate(
    accountUuid: string,
    templateData: ReminderContracts.CreateReminderTemplateRequest,
  ): Promise<ReminderTemplate> {
    // 通过聚合根工厂方法创建
    const aggregate = new ReminderTemplate({
      name: templateData.name,
      description: templateData.description,
      message: templateData.message,
      timeConfig: templateData.timeConfig,
      priority: templateData.priority || ('normal' as ReminderContracts.ReminderPriority),
      category: templateData.category || 'general',
      tags: templateData.tags || [],
      enabled: templateData.enabled ?? true,
      groupUuid: templateData.groupUuid,
    });

    // 保存聚合根（包含所有业务规则验证）
    await this.reminderAggregateRepository.saveAggregate(aggregate);

    return aggregate;
  }

  /**
   * 获取提醒模板聚合根
   */
  async getReminderTemplate(uuid: string): Promise<ReminderTemplate | null> {
    return await this.reminderAggregateRepository.getAggregateById(uuid);
  }

  /**
   * 更新提醒模板聚合根
   */
  async updateReminderTemplate(
    uuid: string,
    updateData: ReminderContracts.UpdateReminderTemplateRequest,
  ): Promise<ReminderTemplate> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(uuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根方法更新，确保业务规则
    aggregate.updateBasicInfo({
      name: updateData.name,
      description: updateData.description,
      message: updateData.message,
      category: updateData.category,
      tags: updateData.tags,
    });

    if (updateData.timeConfig !== undefined) {
      aggregate.updateTimeConfig(updateData.timeConfig);
    }
    if (updateData.priority !== undefined || updateData.enabled !== undefined) {
      aggregate.batchUpdateStatus({
        priority: updateData.priority,
        enabled: updateData.enabled,
        context: { accountUuid: 'system', batchId: `update-${Date.now()}` },
      });
    }
    // Note: groupUuid cannot be updated after creation

    // 保存聚合根变更
    await this.reminderAggregateRepository.saveAggregate(aggregate);

    return aggregate;
  }

  /**
   * 删除提醒模板聚合根
   */
  async deleteReminderTemplate(uuid: string): Promise<void> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(uuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根方法删除，确保级联删除规则
    await this.reminderAggregateRepository.deleteAggregate(uuid);
  }

  // ===== 聚合根实例管理 =====

  /**
   * 通过聚合根创建提醒实例
   */
  async createReminderInstance(
    templateUuid: string,
    instanceData: {
      title?: string;
      message?: string;
      scheduledTime: Date;
      priority?: ReminderContracts.ReminderPriority;
      metadata?: {
        category?: string;
        tags?: string[];
        sourceType?: 'template' | 'task' | 'goal' | 'manual';
        sourceId?: string;
      };
    },
  ): Promise<ReminderInstance> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(templateUuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根创建实例，确保业务规则
    const instanceUuid = aggregate.createInstance(instanceData.scheduledTime, {
      title: instanceData.title,
      message: instanceData.message,
    });

    // 获取创建的实例
    const instance = aggregate.getInstance(instanceUuid);
    if (!instance) {
      throw new Error('创建实例失败');
    }

    // 保存聚合根变更
    await this.reminderAggregateRepository.saveAggregate(aggregate);

    return instance;
  }

  /**
   * 通过聚合根调度提醒实例
   */
  async scheduleReminderInstance(templateUuid: string, instanceUuid: string): Promise<void> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(templateUuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根调度实例
    // 通过获取实例来调度
    const instance = aggregate.getInstance(instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    // 实际的调度逻辑需要与外部调度系统集成
    // 这里只是确保实例处于正确状态
    // await scheduleService.schedule(instance);

    // 保存聚合根变更
    await this.reminderAggregateRepository.saveAggregate(aggregate);
  }

  /**
   * 通过聚合根触发提醒实例
   */
  async triggerReminderInstance(templateUuid: string, instanceUuid: string): Promise<void> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(templateUuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根触发实例
    // 触发实例
    const instance = aggregate.getInstance(instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    instance.trigger();

    // 保存聚合根变更
    await this.reminderAggregateRepository.saveAggregate(aggregate);
  }

  /**
   * 通过聚合根处理用户响应
   */
  async processUserResponse(
    templateUuid: string,
    instanceUuid: string,
    response: {
      operation: 'acknowledge' | 'dismiss' | 'snooze' | 'delete';
      snoozeUntil?: Date;
      reason?: string;
    },
  ): Promise<void> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(templateUuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根处理用户响应
    const instance = aggregate.getInstance(instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    // 根据响应类型处理
    switch (response.operation) {
      case 'acknowledge':
        instance.acknowledge();
        break;
      case 'dismiss':
        instance.dismiss();
        break;
      case 'snooze':
        if (response.snoozeUntil) {
          const minutes = Math.round((response.snoozeUntil.getTime() - Date.now()) / (1000 * 60));
          instance.snooze(Math.max(1, minutes));
        }
        break;
      case 'delete':
        instance.cancel();
        break;
      default:
        throw new Error(`未知的响应类型: ${response.operation}`);
    }

    // 保存聚合根变更
    await this.reminderAggregateRepository.saveAggregate(aggregate);
  }

  /**
   * 通过聚合根稍后提醒
   */
  async snoozeReminderInstance(
    templateUuid: string,
    instanceUuid: string,
    snoozeUntil: Date,
    reason?: string,
  ): Promise<void> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(templateUuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根稍后提醒
    const instance = aggregate.getInstance(instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    const minutes = Math.round((snoozeUntil.getTime() - Date.now()) / (1000 * 60));
    instance.snooze(Math.max(1, minutes), undefined, reason);

    // 保存聚合根变更
    await this.reminderAggregateRepository.saveAggregate(aggregate);
  }

  /**
   * 通过聚合根取消稍后提醒
   */
  async cancelSnooze(templateUuid: string, instanceUuid: string): Promise<void> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(templateUuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根取消稍后提醒
    const instance = aggregate.getInstance(instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    // 取消延迟可以通过重新调度实现
    const now = new Date();
    instance.reschedule(now);

    // 保存聚合根变更
    await this.reminderAggregateRepository.saveAggregate(aggregate);
  }

  // ===== 聚合根批量操作 =====

  /**
   * 通过聚合根批量创建重复实例
   */
  async createRecurringInstances(
    templateUuid: string,
    config: {
      startDate: Date;
      endDate: Date;
      recurrenceRule: ReminderContracts.RecurrenceRule;
      maxInstances?: number;
    },
  ): Promise<ReminderInstance[]> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(templateUuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根创建重复实例
    // 根据配置创建多个实例
    const instances: ReminderInstance[] = [];
    const maxInstances = config.maxInstances || 10;
    let currentDate = new Date(config.startDate);

    for (let i = 0; i < maxInstances && currentDate <= config.endDate; i++) {
      const instanceUuid = aggregate.createInstance(currentDate, {
        title: `定时提醒 ${i + 1}`,
      });

      const instance = aggregate.getInstance(instanceUuid);
      if (instance) {
        instances.push(instance);
      }

      // 根据重复规则计算下一个触发时间
      // 这里简化处理，实际应该根据recurrenceRule计算
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // 每天
    }

    // 保存聚合根变更
    await this.reminderAggregateRepository.saveAggregate(aggregate);

    return instances;
  }

  /**
   * 通过聚合根批量更新实例状态
   */
  async batchUpdateInstanceStatus(
    templateUuid: string,
    instanceUuids: string[],
    status: ReminderContracts.ReminderStatus,
  ): Promise<void> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(templateUuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根批量更新实例状态
    for (const instanceUuid of instanceUuids) {
      const instance = aggregate.getInstance(instanceUuid);
      if (!instance) {
        throw new Error('提醒实例不存在');
      }

      // 根据状态调用相应方法
      switch (status) {
        case 'acknowledged':
          instance.acknowledge();
          break;
        case 'dismissed':
          instance.dismiss();
          break;
        case 'cancelled':
          instance.cancel();
          break;
        case 'expired':
          instance.expire();
          break;
        default:
          throw new Error(`不支持的状态: ${status}`);
      }
    }

    // 保存聚合根变更
    await this.reminderAggregateRepository.saveAggregate(aggregate);
  }

  // ===== 聚合根查询操作 =====

  /**
   * 获取账户下的所有提醒模板聚合根
   */
  async getReminderTemplatesByAccount(accountUuid: string): Promise<ReminderTemplate[]> {
    return await this.reminderAggregateRepository.getAggregatesByAccountUuid(accountUuid);
  }

  /**
   * 按分组获取提醒模板聚合根
   */
  async getReminderTemplatesByGroup(groupUuid: string): Promise<ReminderTemplate[]> {
    return await this.reminderAggregateRepository.getAggregatesByGroupUuid(groupUuid);
  }

  /**
   * 按类别获取提醒模板聚合根
   */
  async getReminderTemplatesByCategory(
    accountUuid: string,
    category: string,
  ): Promise<ReminderTemplate[]> {
    return await this.reminderAggregateRepository.getAggregatesByCategory(accountUuid, category);
  }

  /**
   * 按优先级获取提醒模板聚合根
   */
  async getReminderTemplatesByPriority(
    accountUuid: string,
    priority: ReminderContracts.ReminderPriority,
  ): Promise<ReminderTemplate[]> {
    return await this.reminderAggregateRepository.getAggregatesByPriority(accountUuid, priority);
  }

  /**
   * 搜索提醒模板聚合根
   */
  async searchReminderTemplates(
    accountUuid: string,
    query: ReminderContracts.ReminderQueryParamsDTO,
  ): Promise<ReminderTemplate[]> {
    return await this.reminderAggregateRepository.searchAggregates(accountUuid, query);
  }

  /**
   * 获取启用的提醒模板聚合根
   */
  async getEnabledReminderTemplates(accountUuid: string): Promise<ReminderTemplate[]> {
    return await this.reminderAggregateRepository.getEnabledAggregates(accountUuid);
  }

  // ===== 聚合根状态管理 =====

  /**
   * 启用/禁用提醒模板聚合根
   */
  async toggleReminderTemplateEnabled(uuid: string): Promise<void> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(uuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根切换状态
    aggregate.toggleEnabled(!aggregate.enabled);

    // 保存聚合根变更
    await this.reminderAggregateRepository.saveAggregate(aggregate);
  }

  /**
   * 批量启用提醒模板聚合根
   */
  async batchEnableReminderTemplates(uuids: string[]): Promise<void> {
    await this.reminderAggregateRepository.batchEnableAggregates(uuids);
  }

  /**
   * 批量禁用提醒模板聚合根
   */
  async batchDisableReminderTemplates(uuids: string[]): Promise<void> {
    await this.reminderAggregateRepository.batchDisableAggregates(uuids);
  }

  // ===== 聚合根统计和分析 =====

  /**
   * 获取提醒模板聚合根统计
   */
  async getReminderTemplateStats(uuid: string): Promise<{
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
  }> {
    return await this.reminderAggregateRepository.getAggregateStats(uuid);
  }

  /**
   * 获取账户级别的聚合统计
   */
  async getAccountStats(accountUuid: string): Promise<{
    totalTemplates: number;
    enabledTemplates: number;
    totalInstances: number;
    instancesByStatus: Record<ReminderContracts.ReminderStatus, number>;
    categoryDistribution: Record<string, number>;
    priorityDistribution: Record<ReminderContracts.ReminderPriority, number>;
  }> {
    return await this.reminderAggregateRepository.getAccountAggregateStats(accountUuid);
  }

  // ===== 聚合根一致性管理 =====

  /**
   * 验证聚合根业务不变量
   */
  async validateReminderTemplateInvariants(uuid: string): Promise<{
    isValid: boolean;
    violations: string[];
  }> {
    return await this.reminderAggregateRepository.validateAggregateInvariants(uuid);
  }

  /**
   * 修复聚合根数据一致性
   */
  async repairReminderTemplateConsistency(uuid: string): Promise<{
    repaired: boolean;
    issues: string[];
    actions: string[];
  }> {
    return await this.reminderAggregateRepository.repairAggregateConsistency(uuid);
  }

  // ===== 聚合根快照管理 =====

  /**
   * 创建聚合根快照
   */
  async createReminderTemplateSnapshot(uuid: string): Promise<{
    snapshotId: string;
    timestamp: Date;
    version: number;
  }> {
    return await this.reminderAggregateRepository.createAggregateSnapshot(uuid);
  }

  /**
   * 从快照恢复聚合根
   */
  async restoreReminderTemplateFromSnapshot(uuid: string, snapshotId: string): Promise<void> {
    await this.reminderAggregateRepository.restoreFromSnapshot(uuid, snapshotId);
  }

  /**
   * 获取聚合根快照列表
   */
  async getReminderTemplateSnapshots(uuid: string): Promise<
    Array<{
      snapshotId: string;
      timestamp: Date;
      version: number;
      description?: string;
    }>
  > {
    return await this.reminderAggregateRepository.getAggregateSnapshots(uuid);
  }

  // ===== 聚合根事件管理 =====

  /**
   * 获取聚合根领域事件
   */
  async getReminderTemplateEvents(
    uuid: string,
    since?: Date,
  ): Promise<
    Array<{
      eventType: string;
      aggregateId: string;
      occurredOn: Date;
      payload: any;
    }>
  > {
    return await this.reminderAggregateRepository.getAggregateEvents(uuid, since);
  }

  /**
   * 清除已处理的聚合根事件
   */
  async clearProcessedReminderTemplateEvents(uuid: string, eventIds: string[]): Promise<void> {
    await this.reminderAggregateRepository.clearProcessedEvents(uuid, eventIds);
  }
}
