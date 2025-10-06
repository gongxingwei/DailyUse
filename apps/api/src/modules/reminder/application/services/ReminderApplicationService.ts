import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderContainer } from '../../infrastructure/di/ReminderContainer';
import { ReminderTemplateDomainService } from '../../domain/services/ReminderTemplateDomainService';
import { ReminderTemplateGroupDomainService } from '../../domain/services/ReminderTemplateGroupDomainService';
import type {
  IReminderTemplateAggregateRepository,
  IReminderTemplateGroupAggregateRepository,
} from '@dailyuse/domain-server';

// EventEmitter 类型（可选依赖，用于发送领域事件）
type EventEmitter = {
  emit(event: string, ...args: any[]): boolean;
};

/**
 * Reminder 应用服务
 *
 * 职责：
 * - 协调多个聚合根和领域服务
 * - 处理应用层事务
 * - 发布领域事件
 * - 应用层验证和权限检查
 */
export class ReminderApplicationService {
  private static instance: ReminderApplicationService;
  private templateDomainService: ReminderTemplateDomainService;
  private groupDomainService: ReminderTemplateGroupDomainService;
  private templateRepository: IReminderTemplateAggregateRepository;
  private groupRepository: IReminderTemplateGroupAggregateRepository;
  private eventEmitter?: EventEmitter;

  constructor(
    templateRepository: IReminderTemplateAggregateRepository,
    groupRepository: IReminderTemplateGroupAggregateRepository,
    eventEmitter?: EventEmitter,
  ) {
    this.templateRepository = templateRepository;
    this.groupRepository = groupRepository;
    this.eventEmitter = eventEmitter;
    this.templateDomainService = new ReminderTemplateDomainService(templateRepository);
    this.groupDomainService = new ReminderTemplateGroupDomainService(groupRepository);
  }

  /**
   * 创建服务实例
   */
  static async createInstance(
    templateRepository?: IReminderTemplateAggregateRepository,
    groupRepository?: IReminderTemplateGroupAggregateRepository,
  ): Promise<ReminderApplicationService> {
    const container = ReminderContainer.getInstance();
    const finalTemplateRepo =
      templateRepository || container.getReminderTemplateAggregateRepository();
    const finalGroupRepo =
      groupRepository || container.getReminderTemplateGroupAggregateRepository();

    this.instance = new ReminderApplicationService(finalTemplateRepo, finalGroupRepo);
    return this.instance;
  }

  /**
   * 获取服务实例
   */
  static async getInstance(): Promise<ReminderApplicationService> {
    if (!this.instance) {
      this.instance = await ReminderApplicationService.createInstance();
    }
    return this.instance;
  }

  // ========== ReminderTemplate 相关方法 ==========

  /**
   * 创建提醒模板
   *
   * ⚠️ 架构更改：不再自动生成实例
   * 调度由 Schedule 模块的 RecurringScheduleTask 自动处理
   */
  async createTemplate(
    accountUuid: string,
    request: ReminderContracts.CreateReminderTemplateRequest,
  ): Promise<any> {
    // 应用层验证
    if (!request.name?.trim()) {
      throw new Error('提醒模板名称不能为空');
    }

    if (!request.message?.trim()) {
      throw new Error('提醒消息不能为空');
    }

    const template = await this.templateDomainService.createReminderTemplate(accountUuid, request);

    // 发送领域事件，触发 Schedule 模块创建调度任务
    if (this.eventEmitter) {
      this.eventEmitter.emit('ReminderTemplateCreated', {
        aggregateId: template.uuid,
        payload: {
          templateUuid: template.uuid,
          accountUuid,
          template,
        },
      });
    }

    return template;
  }

  /**
   * 创建提醒模板 (别名方法，更清晰的命名)
   */
  async createReminderTemplate(
    request: ReminderContracts.CreateReminderTemplateRequest,
    accountUuid: string,
  ): Promise<any> {
    return this.createTemplate(accountUuid, request);
  }

  /**
   * 获取所有模板
   */
  async getTemplates(
    accountUuid: string,
    params?: any,
  ): Promise<{ templates: any[]; total: number }> {
    return this.templateDomainService.getAllTemplates(accountUuid, params);
  }

  /**
   * 根据 UUID 获取模板
   */
  async getTemplateById(accountUuid: string, uuid: string): Promise<any | null> {
    return this.templateDomainService.getTemplateByUuid(accountUuid, uuid);
  }

  /**
   * 更新模板
   */
  async updateTemplate(
    accountUuid: string,
    uuid: string,
    request: ReminderContracts.UpdateReminderTemplateRequest,
  ): Promise<any> {
    const template = await this.templateDomainService.updateTemplate(accountUuid, uuid, request);

    // 发送领域事件，触发 Schedule 模块更新调度任务
    if (this.eventEmitter) {
      this.eventEmitter.emit('ReminderTemplateUpdated', {
        aggregateId: template.uuid,
        payload: {
          templateUuid: template.uuid,
          accountUuid,
          template,
        },
      });
    }

    return template;
  }

  /**
   * 更新提醒模板 (别名方法，更清晰的命名)
   */
  async updateReminderTemplate(
    uuid: string,
    request: ReminderContracts.UpdateReminderTemplateRequest,
    accountUuid: string,
  ): Promise<any> {
    return this.updateTemplate(accountUuid, uuid, request);
  }

  /**
   * 删除模板
   */
  async deleteTemplate(accountUuid: string, uuid: string): Promise<boolean> {
    const result = await this.templateDomainService.deleteTemplate(accountUuid, uuid);

    // 发送领域事件，触发 Schedule 模块删除调度任务
    if (this.eventEmitter && result) {
      this.eventEmitter.emit('ReminderTemplateDeleted', {
        aggregateId: uuid,
        payload: {
          templateUuid: uuid,
          accountUuid,
        },
      });
    }

    return result;
  }

  /**
   * 删除提醒模板 (别名方法，更清晰的命名)
   */
  async deleteReminderTemplate(uuid: string, accountUuid: string): Promise<boolean> {
    return this.deleteTemplate(accountUuid, uuid);
  }

  /**
   * 搜索模板
   */
  async searchTemplates(
    accountUuid: string,
    keyword: string,
    params?: any,
  ): Promise<{ templates: any[]; total: number }> {
    return this.templateDomainService.searchTemplates(accountUuid, keyword, params);
  }

  // ========== ReminderTemplateGroup 相关方法 ==========

  /**
   * 创建模板分组
   */
  async createGroup(
    accountUuid: string,
    request: ReminderContracts.CreateReminderTemplateGroupRequest,
  ): Promise<any> {
    // 应用层验证
    if (!request.name?.trim()) {
      throw new Error('分组名称不能为空');
    }

    return this.groupDomainService.createGroup(accountUuid, request);
  }

  /**
   * 获取所有分组
   */
  async getGroups(accountUuid: string, params?: any): Promise<{ groups: any[]; total: number }> {
    return this.groupDomainService.getAllGroups(accountUuid, params);
  }

  /**
   * 根据 UUID 获取分组
   */
  async getGroupById(accountUuid: string, uuid: string): Promise<any | null> {
    return this.groupDomainService.getGroupByUuid(accountUuid, uuid);
  }

  /**
   * 更新分组
   */
  async updateGroup(
    accountUuid: string,
    uuid: string,
    request: ReminderContracts.UpdateReminderTemplateGroupRequest,
  ): Promise<any> {
    return this.groupDomainService.updateGroup(accountUuid, uuid, request);
  }

  /**
   * 删除分组
   */
  async deleteGroup(accountUuid: string, uuid: string): Promise<boolean> {
    return this.groupDomainService.deleteGroup(accountUuid, uuid);
  }

  /**
   * 更新分组排序
   */
  async updateGroupOrder(
    accountUuid: string,
    groupOrders: Array<{ uuid: string; order: number }>,
  ): Promise<boolean> {
    return this.groupDomainService.updateGroupOrder(accountUuid, groupOrders);
  }

  // TODO: 添加 Instance 相关方法
  // TODO: 添加统计和查询方法
}
