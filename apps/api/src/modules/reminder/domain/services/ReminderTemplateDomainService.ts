import type { ReminderContracts } from '@dailyuse/contracts';
import type {
  IReminderTemplateAggregateRepository,
  ReminderTemplate,
} from '@dailyuse/domain-server';
import { ReminderTemplate as ReminderTemplateAggregate } from '@dailyuse/domain-server';
import { eventBus } from '@dailyuse/utils';

/**
 * ReminderTemplate 领域服务
 *
 * 职责：
 * - 处理 ReminderTemplate 聚合根的核心业务逻辑
 * - 通过 IReminderTemplateAggregateRepository 接口操作数据
 * - 验证业务规则
 * - 管理 ReminderTemplate 及其子实体（ReminderInstance）
 *
 * 设计原则：
 * - 依赖倒置：只依赖 IReminderTemplateAggregateRepository 接口
 * - 单一职责：只处理 ReminderTemplate 相关的领域逻辑
 * - 与技术解耦：无任何基础设施细节
 */
export class ReminderTemplateDomainService {
  constructor(private readonly templateRepository: IReminderTemplateAggregateRepository) {}

  // ==================== ReminderTemplate CRUD 操作 ====================

  /**
   * 创建提醒模板
   *
   * ⚠️ 架构更改：
   * 1. 不再生成 ReminderInstance
   * 2. 调度由 Schedule 模块的 RecurringScheduleTask 自动处理
   * 3. 通过事件监听器 (ReminderTemplateScheduleSyncListener) 自动创建调度任务
   *
   * 业务逻辑：
   * 1. 创建聚合根实例
   * 2. 持久化模板
   * 3. 发布 ReminderTemplateCreated 事件（触发 Schedule 同步）
   */
  async createReminderTemplate(
    accountUuid: string,
    request: ReminderContracts.CreateReminderTemplateRequest,
  ): Promise<ReminderContracts.ReminderTemplateResponse> {
    // 创建 ReminderTemplate 聚合根实例
    const template = new ReminderTemplateAggregate({
      uuid: request.uuid,
      groupUuid: request.groupUuid,
      name: request.name,
      description: request.description,
      message: request.message,
      enabled: request.enabled ?? true,
      selfEnabled: request.selfEnabled ?? true,
      importanceLevel: request.importanceLevel,
      timeConfig: request.timeConfig,
      priority: request.priority,
      category: request.category,
      tags: request.tags,
      icon: request.icon,
      color: request.color,
      position: request.position,
      displayOrder: request.displayOrder ?? 0,
      notificationSettings: request.notificationSettings,
      snoozeConfig: request.snoozeConfig,
      lifecycle: {
        createdAt: new Date(),
        updatedAt: new Date(),
        triggerCount: 0,
      },
      analytics: {
        totalTriggers: 0,
        acknowledgedCount: 0,
        dismissedCount: 0,
        snoozeCount: 0,
      },
      version: 1,
    });

    // 持久化聚合根
    const savedTemplate = await this.templateRepository.saveTemplate(accountUuid, template);

    console.log(
      `✅ 模板 [${template.name}] 已创建，调度任务将由 Schedule 模块通过事件监听器自动管理`,
    );

    return savedTemplate.toClient();
  }

  /**
   * 创建提醒模板（旧方法，保持向后兼容）
   * @deprecated 使用 createReminderTemplate 代替
   */
  async createTemplate(
    accountUuid: string,
    request: ReminderContracts.CreateReminderTemplateRequest,
  ): Promise<ReminderContracts.ReminderTemplateResponse> {
    return this.createReminderTemplate(accountUuid, request);
  }

  /**
   * 获取所有模板
   */
  async getAllTemplates(
    accountUuid: string,
    params?: {
      groupUuid?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: 'name' | 'usageCount' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ templates: ReminderContracts.ReminderTemplateClientDTO[]; total: number }> {
    const result = await this.templateRepository.getAllTemplates(accountUuid, params);

    return {
      templates: result.templates.map((t: ReminderTemplate) => t.toClient()),
      total: result.total,
    };
  }

  /**
   * 根据 UUID 获取模板
   */
  async getTemplateByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<ReminderContracts.ReminderTemplateClientDTO | null> {
    const template = await this.templateRepository.getTemplateByUuid(accountUuid, uuid);
    return template ? template.toClient() : null;
  }

  /**
   * 更新模板
   */
  async updateTemplate(
    accountUuid: string,
    uuid: string,
    request: ReminderContracts.UpdateReminderTemplateRequest,
  ): Promise<ReminderContracts.ReminderTemplateClientDTO> {
    // 获取现有模板
    const template = await this.templateRepository.getTemplateByUuid(accountUuid, uuid);
    if (!template) {
      throw new Error(`Template ${uuid} not found`);
    }

    // 更新基本信息
    if (
      request.name !== undefined ||
      request.description !== undefined ||
      request.message !== undefined ||
      request.category !== undefined ||
      request.tags !== undefined ||
      request.icon !== undefined ||
      request.color !== undefined ||
      request.position !== undefined ||
      request.displayOrder !== undefined
    ) {
      template.updateBasicInfo({
        name: request.name,
        description: request.description,
        message: request.message,
        category: request.category,
        tags: request.tags,
        icon: request.icon,
        color: request.color,
        position: request.position,
        displayOrder: request.displayOrder,
      });
    }

    // 更新时间配置
    if (request.timeConfig !== undefined) {
      template.updateTimeConfig(request.timeConfig);
    }

    // 更新通知设置
    if (request.notificationSettings !== undefined) {
      template.updateNotificationSettings(request.notificationSettings);
    }

    // 更新延迟配置
    if (request.snoozeConfig !== undefined) {
      template.updateSnoozeConfig(request.snoozeConfig);
    }

    // 更新启用状态
    if (request.enabled !== undefined) {
      template.toggleEnabled(request.enabled, { accountUuid });
    }

    // 更新自身启用状态
    if (request.selfEnabled !== undefined) {
      template.toggleSelfEnabled(request.selfEnabled, { accountUuid });
    }

    // 更新分组（直接修改私有属性，因为核心类没有提供 setter）
    if (request.groupUuid !== undefined) {
      (template as any)._groupUuid = request.groupUuid;
    }

    // 更新优先级
    if (request.priority !== undefined) {
      (template as any)._priority = request.priority;
    }

    // 更新重要性级别
    if (request.importanceLevel !== undefined) {
      (template as any)._importanceLevel = request.importanceLevel;
    }

    // 持久化更新
    const updatedTemplate = await this.templateRepository.saveTemplate(accountUuid, template);

    return updatedTemplate.toClient();
  }

  /**
   * 删除模板
   */
  async deleteTemplate(accountUuid: string, uuid: string): Promise<boolean> {
    return await this.templateRepository.deleteTemplate(accountUuid, uuid);
  }

  /**
   * 搜索模板
   */
  async searchTemplates(
    accountUuid: string,
    keyword: string,
    params?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<{ templates: ReminderContracts.ReminderTemplateClientDTO[]; total: number }> {
    // 获取所有模板
    const result = await this.templateRepository.getAllTemplates(accountUuid, params);

    // 在应用层进行关键词过滤（临时方案，生产环境应该在数据库层过滤）
    const keyword_lower = keyword.toLowerCase();
    const filteredTemplates = result.templates.filter((template) => {
      return (
        template.name.toLowerCase().includes(keyword_lower) ||
        template.message?.toLowerCase().includes(keyword_lower) ||
        template.description?.toLowerCase().includes(keyword_lower) ||
        template.tags.some((tag) => tag.toLowerCase().includes(keyword_lower)) ||
        template.category.toLowerCase().includes(keyword_lower)
      );
    });

    return {
      templates: filteredTemplates.map((t) => t.toClient()),
      total: filteredTemplates.length,
    };
  }

  // ==================== 业务逻辑方法 ====================

  /**
   * 切换模板启用状态
   */
  /**
   * 更新模板自身的启用状态（用户直接修改）
   */
  async updateTemplateSelfEnabled(
    accountUuid: string,
    uuid: string,
    selfEnabled: boolean,
  ): Promise<ReminderContracts.ReminderTemplateClientDTO> {
    const template = await this.templateRepository.getTemplateByUuid(accountUuid, uuid);
    if (!template) {
      throw new Error(`Template ${uuid} not found`);
    }

    const oldEnabled = template.enabled;

    // 使用新的 updateSelfEnabled 方法
    template.updateSelfEnabled(selfEnabled, { accountUuid });

    // 持久化更新
    const updatedTemplate = await this.templateRepository.saveTemplate(accountUuid, template);

    // 🔥 手动发布领域事件（因为 Repository 没有集成 EventBus）
    if (oldEnabled !== updatedTemplate.enabled) {
      await eventBus.publish({
        eventType: 'ReminderTemplateStatusChanged',
        aggregateId: uuid,
        occurredOn: new Date(),
        payload: {
          templateUuid: uuid,
          templateName: updatedTemplate.name,
          oldEnabled,
          newEnabled: updatedTemplate.enabled,
          template: updatedTemplate.toClient(),
          accountUuid,
        },
      });
    }

    return updatedTemplate.toClient();
  }

  /**
   * @deprecated 使用 updateTemplateSelfEnabled 代替
   */
  async toggleTemplateEnabled(
    accountUuid: string,
    uuid: string,
    enabled: boolean,
  ): Promise<ReminderContracts.ReminderTemplateClientDTO> {
    return this.updateTemplateSelfEnabled(accountUuid, uuid, enabled);
  }
}
