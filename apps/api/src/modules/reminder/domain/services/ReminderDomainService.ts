import type { ReminderContracts } from '@dailyuse/contracts';
import { PrismaReminderAggregateRepository } from '../../infrastructure/repositories/prisma/PrismaReminderAggregateRepository';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

type CreateReminderTemplateRequest = ReminderContracts.CreateReminderTemplateRequest;
type UpdateReminderTemplateRequest = ReminderContracts.UpdateReminderTemplateRequest;
type CreateReminderInstanceRequest = ReminderContracts.CreateReminderInstanceRequest;
type UpdateReminderInstanceRequest = ReminderContracts.UpdateReminderInstanceRequest;
type ReminderTemplateResponse = ReminderContracts.ReminderTemplateResponse;
type ReminderInstanceResponse = ReminderContracts.ReminderInstanceResponse;
type ReminderListResponse = ReminderContracts.ReminderListResponse;

export class ReminderDomainService {
  private repository: PrismaReminderAggregateRepository;

  constructor() {
    const prisma = new PrismaClient();
    this.repository = new PrismaReminderAggregateRepository(prisma);
  }
  // ========== 聚合根管理方法 ==========

  /**
   * 获取账户的所有提醒模板聚合根
   */
  async getReminderTemplatesByAccount(accountUuid: string): Promise<any[]> {
    return this.repository.getAggregatesByAccountUuid(accountUuid);
  }

  /**
   * 创建提醒模板聚合根
   */
  async createReminderTemplate(accountUuid: string, data: any): Promise<any> {
    const templateData = {
      uuid: randomUUID(),
      accountUuid,
      name: data.name,
      description: data.description,
      message: data.message,
      enabled: data.enabled ?? true,
      category: data.category || 'general',
      tags: data.tags || [],
      priority: data.priority || 'normal',
      groupUuid: data.groupUuid || null,
      // 添加时间配置的默认值
      timeConfigType: data.timeConfig?.type || 'daily',
      timeConfigTimes: JSON.stringify(data.timeConfig?.times || ['09:00']),
      timeConfigWeekdays: JSON.stringify(data.timeConfig?.weekdays || [1, 2, 3, 4, 5]),
      timeConfigMonthDays: JSON.stringify(data.timeConfig?.monthDays || []),
    };

    const template = await this.repository.createReminderTemplate(templateData);

    // 如果模板创建时就是启用状态，自动创建实例
    if (templateData.enabled) {
      try {
        await this.createInstancesFromTemplate(template.uuid);
      } catch (error) {
        console.error('创建模板实例时出错:', error);
        // 不阻断模板创建流程
      }
    }

    return template;
  }

  /**
   * 更新提醒模板聚合根
   */
  async updateReminderTemplate(templateUuid: string, data: any): Promise<any> {
    return this.repository.updateReminderTemplate(templateUuid, data);
  }

  /**
   * 删除提醒模板聚合根
   */
  async deleteReminderTemplate(templateUuid: string): Promise<void> {
    return this.repository.deleteReminderTemplate(templateUuid);
  }

  /**
   * 获取单个提醒模板聚合根
   */
  async getReminderTemplate(templateUuid: string): Promise<any | null> {
    return this.repository.getReminderTemplate(templateUuid);
  }

  /**
   * 按分组获取提醒模板
   */
  async getReminderTemplatesByGroup(groupUuid: string): Promise<any[]> {
    return this.repository.getTemplatesByGroupUuid(groupUuid);
  }

  /**
   * 搜索提醒模板
   */
  async searchReminderTemplates(accountUuid: string, searchTerm: string): Promise<any[]> {
    return this.repository.searchReminderTemplates(accountUuid, searchTerm);
  }

  /**
   * 切换模板启用状态
   */
  async toggleReminderTemplateEnabled(templateUuid: string, enabled: boolean): Promise<void> {
    await this.repository.toggleTemplateEnabled(templateUuid, enabled);

    // 如果启用模板，自动创建实例和调度
    if (enabled) {
      await this.createInstancesFromTemplate(templateUuid);
    } else {
      // 如果禁用模板，取消未来的实例
      await this.cancelFutureInstances(templateUuid);
    }
  }

  /**
   * 批量启用模板
   */
  async batchEnableReminderTemplates(templateUuids: string[]): Promise<void> {
    return this.repository.batchUpdateTemplateStatus(templateUuids, true);
  }

  /**
   * 批量禁用模板
   */
  async batchDisableReminderTemplates(templateUuids: string[]): Promise<void> {
    return this.repository.batchUpdateTemplateStatus(templateUuids, false);
  }

  /**
   * 创建提醒实例
   */
  async createReminderInstance(templateUuid: string, accountUuid: string, data: any): Promise<any> {
    const instanceData = {
      uuid: randomUUID(),
      templateUuid,
      accountUuid,
      title: data.title || null,
      message: data.message,
      scheduledTime: new Date(data.scheduledTime),
      status: data.status || 'pending',
      priority: data.priority || 'normal',
      category: data.category || 'general',
      tags: data.tags || [],
    };

    return this.repository.createReminderInstance(instanceData);
  }

  /**
   * 批量更新实例状态
   */
  async batchUpdateInstanceStatus(
    templateUuid: string,
    status: string,
    instanceUuids?: string[],
  ): Promise<void> {
    return this.repository.batchUpdateInstanceStatus(templateUuid, status, instanceUuids);
  }

  /**
   * 获取模板统计信息
   */
  async getReminderTemplateStats(templateUuid: string): Promise<any> {
    const template = await this.repository.getReminderTemplate(templateUuid);

    if (!template) {
      throw new Error('模板不存在');
    }

    return {
      templateUuid,
      totalInstances: template.instances?.length || 0,
      pendingInstances: template.instances?.filter((i: any) => i.status === 'pending').length || 0,
      completedInstances:
        template.instances?.filter((i: any) => i.status === 'acknowledged').length || 0,
      triggeredCount: template.instances?.filter((i: any) => i.status === 'triggered').length || 0,
      lastTriggered:
        template.instances?.length > 0
          ? template.instances.reduce((latest: any, instance: any) =>
              new Date(instance.triggeredTime || 0) > new Date(latest.triggeredTime || 0)
                ? instance
                : latest,
            ).triggeredTime
          : null,
    };
  }

  /**
   * 获取账户统计信息
   */
  async getAccountStats(accountUuid: string): Promise<any> {
    const templates = await this.repository.getAggregatesByAccountUuid(accountUuid);

    const totalInstances = templates.reduce(
      (sum, template) => sum + (template.instances?.length || 0),
      0,
    );
    const pendingInstances = templates.reduce(
      (sum, template) =>
        sum + (template.instances?.filter((i: any) => i.status === 'pending').length || 0),
      0,
    );

    return {
      accountUuid,
      totalTemplates: templates.length,
      enabledTemplates: templates.filter((t) => t.enabled).length,
      totalInstances,
      pendingInstances,
      completedInstances: templates.reduce(
        (sum, template) =>
          sum + (template.instances?.filter((i: any) => i.status === 'acknowledged').length || 0),
        0,
      ),
    };
  }

  /**
   * 验证模板不变量
   */
  async validateReminderTemplateInvariants(
    templateUuid: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const template = await this.repository.getReminderTemplate(templateUuid);

    if (!template) {
      return {
        valid: false,
        errors: ['模板不存在'],
      };
    }

    const errors: string[] = [];

    // 验证基本字段
    if (!template.name || template.name.trim().length === 0) {
      errors.push('模板名称不能为空');
    }

    if (!template.message || template.message.trim().length === 0) {
      errors.push('提醒消息不能为空');
    }

    if (!template.category || template.category.trim().length === 0) {
      errors.push('分类不能为空');
    }

    if (!['low', 'normal', 'high', 'urgent'].includes(template.priority)) {
      errors.push('优先级值无效');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ========== DDD Contract 接口实现 ==========

  // 提醒模板相关方法
  async createTemplate(request: CreateReminderTemplateRequest): Promise<ReminderTemplateResponse> {
    // 映射contracts到内部数据结构
    const templateData = {
      name: request.name,
      description: request.description,
      message: request.message,
      enabled: true, // 默认启用
      category: request.category,
      tags: request.tags,
      priority: request.priority,
      groupUuid: request.groupUuid || null,
    };

    // 需要传入accountUuid，这里暂时用占位符
    const accountUuid = 'current-account-uuid'; // TODO: 从认证中间件获取
    const template = await this.createReminderTemplate(accountUuid, templateData);

    // 映射到response格式
    return {
      uuid: template.uuid,
      groupUuid: template.groupUuid,
      name: template.name,
      description: template.description,
      message: template.message,
      enabled: template.enabled,
      selfEnabled: template.enabled,
      timeConfig: request.timeConfig,
      priority: template.priority,
      category: template.category,
      tags: template.tags,
      displayOrder: 0,
      lifecycle: {
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        triggerCount: 0,
      },
      analytics: {
        totalTriggers: 0,
        acknowledgedCount: 0,
        dismissedCount: 0,
        snoozeCount: 0,
      },
      version: template.version,
    };
  }

  async getTemplates(queryParams: any): Promise<ReminderTemplateResponse[]> {
    const templates = await this.getReminderTemplatesByAccount(queryParams.accountUuid);

    return templates.map((template) => ({
      uuid: template.uuid,
      groupUuid: template.groupUuid,
      name: template.name,
      description: template.description,
      message: template.message,
      enabled: template.enabled,
      selfEnabled: template.enabled,
      timeConfig: {
        type: 'daily' as const,
        times: ['09:00'],
      },
      priority: template.priority,
      category: template.category,
      tags: template.tags,
      displayOrder: 0,
      lifecycle: {
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        triggerCount: 0,
      },
      analytics: {
        totalTriggers: 0,
        acknowledgedCount: 0,
        dismissedCount: 0,
        snoozeCount: 0,
      },
      version: template.version,
    }));
  }

  async getTemplateById(id: string): Promise<ReminderTemplateResponse | null> {
    const template = await this.getReminderTemplate(id);

    if (!template) return null;

    return {
      uuid: template.uuid,
      groupUuid: template.groupUuid,
      name: template.name,
      description: template.description,
      message: template.message,
      enabled: template.enabled,
      selfEnabled: template.enabled,
      timeConfig: {
        type: 'daily' as const,
        times: ['09:00'],
      },
      priority: template.priority,
      category: template.category,
      tags: template.tags,
      displayOrder: 0,
      lifecycle: {
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        triggerCount: 0,
      },
      analytics: {
        totalTriggers: 0,
        acknowledgedCount: 0,
        dismissedCount: 0,
        snoozeCount: 0,
      },
      version: template.version,
    };
  }

  async updateTemplate(
    id: string,
    request: UpdateReminderTemplateRequest,
  ): Promise<ReminderTemplateResponse> {
    const template = await this.updateReminderTemplate(id, request);

    return {
      uuid: template.uuid,
      groupUuid: template.groupUuid,
      name: template.name,
      description: template.description,
      message: template.message,
      enabled: template.enabled,
      selfEnabled: template.enabled,
      timeConfig: request.timeConfig || {
        type: 'daily' as const,
        times: ['09:00'],
      },
      priority: template.priority,
      category: template.category,
      tags: template.tags,
      displayOrder: 0,
      lifecycle: {
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        triggerCount: 0,
      },
      analytics: {
        totalTriggers: 0,
        acknowledgedCount: 0,
        dismissedCount: 0,
        snoozeCount: 0,
      },
      version: template.version,
    };
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.deleteReminderTemplate(id);
  }

  async activateTemplate(id: string): Promise<ReminderTemplateResponse> {
    await this.toggleReminderTemplateEnabled(id, true);
    const template = await this.getReminderTemplate(id);

    return {
      uuid: template.uuid,
      groupUuid: template.groupUuid,
      name: template.name,
      description: template.description,
      message: template.message,
      enabled: template.enabled,
      selfEnabled: template.enabled,
      timeConfig: {
        type: 'daily' as const,
        times: ['09:00'],
      },
      priority: template.priority,
      category: template.category,
      tags: template.tags,
      displayOrder: 0,
      lifecycle: {
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        triggerCount: 0,
      },
      analytics: {
        totalTriggers: 0,
        acknowledgedCount: 0,
        dismissedCount: 0,
        snoozeCount: 0,
      },
      version: template.version,
    };
  }

  async pauseTemplate(id: string): Promise<ReminderTemplateResponse> {
    await this.toggleReminderTemplateEnabled(id, false);
    const template = await this.getReminderTemplate(id);

    return {
      uuid: template.uuid,
      groupUuid: template.groupUuid,
      name: template.name,
      description: template.description,
      message: template.message,
      enabled: template.enabled,
      selfEnabled: template.enabled,
      timeConfig: {
        type: 'daily' as const,
        times: ['09:00'],
      },
      priority: template.priority,
      category: template.category,
      tags: template.tags,
      displayOrder: 0,
      lifecycle: {
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        triggerCount: 0,
      },
      analytics: {
        totalTriggers: 0,
        acknowledgedCount: 0,
        dismissedCount: 0,
        snoozeCount: 0,
      },
      version: template.version,
    };
  }

  // 提醒实例相关方法
  async createInstance(request: CreateReminderInstanceRequest): Promise<ReminderInstanceResponse> {
    // TODO: 获取账户UUID
    const accountUuid = 'current-account-uuid';

    const instanceData = {
      title: null,
      message: request.message || 'Default message',
      scheduledTime: request.scheduledTime,
      priority: request.priority || 'normal',
      category: request.metadata?.category || 'general',
      tags: request.metadata?.tags || [],
    };

    const instance = await this.createReminderInstance(
      request.templateUuid,
      accountUuid,
      instanceData,
    );

    return {
      uuid: instance.uuid,
      templateUuid: instance.templateUuid,
      title: instance.title,
      message: instance.message,
      scheduledTime: instance.scheduledTime.toISOString(),
      status: instance.status,
      priority: instance.priority,
      metadata: {
        category: instance.category,
        tags: JSON.parse(instance.tags || '[]'),
        sourceType: request.metadata?.sourceType,
        sourceId: request.metadata?.sourceId,
      },
      snoozeHistory: [],
      version: instance.version,
    };
  }

  async getInstances(queryParams: any): Promise<ReminderListResponse> {
    // TODO: 实现获取提醒实例列表逻辑
    return {
      reminders: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  async getInstanceById(id: string): Promise<ReminderInstanceResponse | null> {
    // TODO: 实现根据ID获取提醒实例逻辑
    return null;
  }

  async updateInstance(
    id: string,
    request: UpdateReminderInstanceRequest,
  ): Promise<ReminderInstanceResponse> {
    // TODO: 实现更新提醒实例逻辑
    throw new Error('Method not implemented');
  }

  async deleteInstance(id: string): Promise<void> {
    // TODO: 实现删除提醒实例逻辑
    throw new Error('Method not implemented');
  }

  // 提醒操作方法
  async triggerReminder(id: string): Promise<ReminderInstanceResponse> {
    // TODO: 实现触发提醒逻辑
    throw new Error('Method not implemented');
  }

  async snoozeReminder(
    id: string,
    snoozeUntil: Date,
    reason?: string,
  ): Promise<ReminderInstanceResponse> {
    // TODO: 实现稍后提醒逻辑
    throw new Error('Method not implemented');
  }

  async dismissReminder(id: string): Promise<ReminderInstanceResponse> {
    // TODO: 实现忽略提醒逻辑
    throw new Error('Method not implemented');
  }

  async acknowledgeReminder(id: string): Promise<ReminderInstanceResponse> {
    // TODO: 实现确认提醒逻辑
    throw new Error('Method not implemented');
  }

  // 批量操作方法
  async batchDismissReminders(ids: string[]): Promise<void> {
    // TODO: 实现批量忽略提醒逻辑
    throw new Error('Method not implemented');
  }

  async batchSnoozeReminders(ids: string[], snoozeUntil: Date): Promise<void> {
    // TODO: 实现批量稍后提醒逻辑
    throw new Error('Method not implemented');
  }

  // 查询方法
  async getActiveReminders(accountUuid: string): Promise<ReminderListResponse> {
    // TODO: 实现获取活跃提醒逻辑
    return {
      reminders: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  async getPendingReminders(accountUuid: string): Promise<ReminderListResponse> {
    // TODO: 实现获取待处理提醒逻辑
    return {
      reminders: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  async getOverdueReminders(accountUuid: string): Promise<ReminderListResponse> {
    // TODO: 实现获取过期提醒逻辑
    return {
      reminders: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  async getUpcomingReminders(accountUuid: string, hours?: number): Promise<ReminderListResponse> {
    // TODO: 实现获取即将到来的提醒逻辑
    return {
      reminders: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  async getReminderHistory(
    accountUuid: string,
    from?: Date,
    to?: Date,
  ): Promise<ReminderListResponse> {
    // TODO: 实现获取提醒历史逻辑
    return {
      reminders: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  async searchReminders(queryParams: any): Promise<ReminderListResponse> {
    // TODO: 实现搜索提醒逻辑
    return {
      reminders: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  // 统计方法
  async getReminderStats(queryParams: any): Promise<any> {
    // TODO: 实现获取提醒统计逻辑
    return {
      total: 0,
      pending: 0,
      triggered: 0,
      acknowledged: 0,
      dismissed: 0,
      snoozed: 0,
      expired: 0,
      avgResponseTime: 0,
      acknowledgmentRate: 0,
      dailyStats: [],
    };
  }

  // ===== 分组管理方法 =====

  /**
   * 创建提醒模板分组
   */
  async createReminderTemplateGroup(accountUuid: string, data: any): Promise<any> {
    const groupData = {
      uuid: this.generateUUID(),
      accountUuid,
      ...data,
    };
    return this.repository.createReminderTemplateGroup(groupData);
  }

  /**
   * 更新提醒模板分组
   */
  async updateReminderTemplateGroup(groupUuid: string, data: any): Promise<any> {
    return this.repository.updateReminderTemplateGroup(groupUuid, data);
  }

  /**
   * 删除提醒模板分组
   */
  async deleteReminderTemplateGroup(groupUuid: string): Promise<void> {
    return this.repository.deleteReminderTemplateGroup(groupUuid);
  }

  /**
   * 获取单个提醒模板分组
   */
  async getReminderTemplateGroup(groupUuid: string): Promise<any | null> {
    return this.repository.getReminderTemplateGroup(groupUuid);
  }

  /**
   * 获取账户的所有分组
   */
  async getReminderTemplateGroupsByAccount(accountUuid: string): Promise<any[]> {
    return this.repository.getGroupsByAccountUuid(accountUuid);
  }

  /**
   * 切换分组启用状态
   */
  async toggleReminderTemplateGroupEnabled(groupUuid: string, enabled: boolean): Promise<void> {
    return this.repository.toggleGroupEnabled(groupUuid, enabled);
  }

  /**
   * 根据模板创建实例和调度
   */
  private async createInstancesFromTemplate(templateUuid: string): Promise<void> {
    const template = await this.repository.getReminderTemplate(templateUuid);
    if (!template) {
      throw new Error('模板不存在');
    }

    // 根据模板的时间配置创建未来7天的实例
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后

    const instances = this.generateInstancesFromTimeConfig(template, now, endDate);

    // 批量创建实例
    for (const instanceData of instances) {
      await this.repository.createReminderInstance(instanceData);
    }

    // TODO: 创建调度记录 - 需要在仓储中实现 createReminderSchedule 方法
    console.log(`已为模板 ${template.name} 创建 ${instances.length} 个实例`);
  }

  /**
   * 手动为模板生成实例和调度（公共方法）
   */
  async generateInstancesAndSchedulesForTemplate(
    templateUuid: string,
    options?: { days?: number; regenerate?: boolean },
  ): Promise<{ instanceCount: number; scheduleCount: number }> {
    const { days = 7, regenerate = false } = options || {};

    const template = await this.repository.getReminderTemplate(templateUuid);
    if (!template) {
      throw new Error('模板不存在');
    }

    if (!template.enabled) {
      throw new Error('模板未启用，无法生成实例');
    }

    // 如果需要重新生成，先取消现有的实例
    if (regenerate) {
      await this.cancelFutureInstances(templateUuid);
    }

    // 生成指定天数的实例
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const instances = this.generateInstancesFromTimeConfig(template, now, endDate);

    // 批量创建实例
    let instanceCount = 0;
    let scheduleCount = 0;

    for (const instanceData of instances) {
      try {
        await this.repository.createReminderInstance(instanceData);
        instanceCount++;

        // 同时创建调度记录（如果仓储支持）
        try {
          const scheduleData = {
            uuid: randomUUID(),
            instanceUuid: instanceData.uuid,
            scheduledTime: instanceData.scheduledTime,
            status: 'pending',
            retryCount: 0,
            maxRetries: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // 这里需要调用schedule模块的服务来创建队列任务
          // 暂时先创建调度记录
          // await this.repository.createReminderSchedule(scheduleData);
          console.log('创建调度记录:', scheduleData);
          scheduleCount++;
        } catch (scheduleError) {
          console.warn(`为实例 ${instanceData.uuid} 创建调度失败:`, scheduleError);
        }
      } catch (instanceError) {
        console.error(`创建实例失败:`, instanceError);
      }
    }

    console.log(
      `为模板 "${template.name}" 生成了 ${instanceCount} 个实例和 ${scheduleCount} 个调度`,
    );

    return { instanceCount, scheduleCount };
  }

  /**
   * 根据时间配置生成实例数据
   */
  private generateInstancesFromTimeConfig(template: any, startDate: Date, endDate: Date): any[] {
    const instances = [];
    const times = JSON.parse(template.timeConfigTimes || '["09:00"]');
    const weekdays = JSON.parse(template.timeConfigWeekdays || '[1,2,3,4,5]'); // 周一到周五

    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ...

      // 检查是否在允许的星期内
      if (weekdays.includes(dayOfWeek)) {
        for (const timeStr of times) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const scheduledTime = new Date(current);
          scheduledTime.setHours(hours, minutes, 0, 0);

          // 只创建未来的实例
          if (scheduledTime > new Date()) {
            instances.push({
              uuid: randomUUID(),
              templateUuid: template.uuid,
              accountUuid: template.accountUuid,
              title: template.name,
              message: template.message,
              scheduledTime,
              status: 'pending',
              priority: template.priority || 'normal',
              category: template.category || 'general',
              tags: template.tags || '[]',
              sourceType: 'template',
              sourceId: template.uuid,
              snoozeHistory: '[]',
              currentSnoozeCount: 0,
              version: 1,
            });
          }
        }
      }

      // 移到下一天
      current.setDate(current.getDate() + 1);
    }

    return instances;
  }

  /**
   * 取消未来的实例
   */
  private async cancelFutureInstances(templateUuid: string): Promise<void> {
    await this.repository.batchUpdateInstanceStatus(templateUuid, 'cancelled');
  }

  /**
   * 生成UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
