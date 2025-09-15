import type { ReminderContracts } from '@dailyuse/contracts';
import type { ReminderTemplate } from '@dailyuse/domain-server';
import type { ReminderInstance } from '@dailyuse/domain-server';
import type { IReminderAggregateRepository } from '@dailyuse/domain-server';

type CreateReminderTemplateRequest = ReminderContracts.CreateReminderTemplateRequest;
type UpdateReminderTemplateRequest = ReminderContracts.UpdateReminderTemplateRequest;
type ReminderQueryParamsDTO = ReminderContracts.ReminderQueryParamsDTO;

/**
 * 提醒聚合应用服务
 * 这是应用层的聚合根服务，用于API层
 * 它依赖于domain-server包中的聚合根服务
 */
export class ReminderAggregateService {
  constructor(private readonly reminderAggregateRepository: IReminderAggregateRepository) {}

  // ===== 聚合根创建和管理 =====

  /**
   * 创建新的提醒模板聚合根
   */
  async createReminderTemplate(
    accountUuid: string,
    templateData: CreateReminderTemplateRequest,
  ): Promise<ReminderTemplate> {
    // 使用domain-server包中的ReminderTemplate聚合根
    const { ReminderTemplate } = await import('@dailyuse/domain-server');

    const aggregate = new ReminderTemplate({
      accountUuid,
      name: templateData.name,
      description: templateData.description,
      message: templateData.message,
      timeConfig: templateData.timeConfig,
      priority: templateData.priority || ('normal' as ReminderContracts.ReminderPriority),
      category: templateData.category || 'general',
      tags: templateData.tags || [],
      groupUuid: templateData.groupUuid,
    });

    // 保存聚合根
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
    updateData: UpdateReminderTemplateRequest,
  ): Promise<ReminderTemplate> {
    const aggregate = await this.reminderAggregateRepository.getAggregateById(uuid);
    if (!aggregate) {
      throw new Error('提醒模板不存在');
    }

    // 通过聚合根方法更新
    if (updateData.name !== undefined) {
      aggregate.setName(updateData.name);
    }
    if (updateData.description !== undefined) {
      aggregate.setDescription(updateData.description);
    }
    if (updateData.message !== undefined) {
      aggregate.setMessage(updateData.message);
    }
    if (updateData.timeConfig !== undefined) {
      aggregate.updateTimeConfig(updateData.timeConfig);
    }
    if (updateData.priority !== undefined) {
      aggregate.setPriority(updateData.priority);
    }
    if (updateData.category !== undefined) {
      aggregate.setCategory(updateData.category);
    }
    if (updateData.tags !== undefined) {
      aggregate.setTags(updateData.tags);
    }
    if (updateData.groupUuid !== undefined) {
      aggregate.setGroupUuid(updateData.groupUuid);
    }

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

    // 通过聚合根方法删除
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

    // 通过聚合根创建实例
    const instance = aggregate.createReminderInstance({
      title: instanceData.title,
      message: instanceData.message,
      scheduledTime: instanceData.scheduledTime,
      priority: instanceData.priority,
      metadata: instanceData.metadata,
    });

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
    await aggregate.scheduleInstance(instanceUuid);

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
    await aggregate.triggerInstance(instanceUuid);

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
    await aggregate.processInstanceResponse(instanceUuid, response);

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
    aggregate.snoozeInstance(instanceUuid, snoozeUntil, reason);

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
    aggregate.cancelInstanceSnooze(instanceUuid);

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
    const instances = await aggregate.createRecurringInstances(config);

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
      aggregate.updateInstanceStatus(instanceUuid, status);
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
   * 搜索提醒模板聚合根
   */
  async searchReminderTemplates(
    accountUuid: string,
    query: ReminderQueryParamsDTO,
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
    aggregate.toggleEnabled();

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
}
