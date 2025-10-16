import { ReminderDomainService } from '@dailyuse/domain-server';
import type {
  IReminderTemplateRepository,
  IReminderGroupRepository,
  IReminderStatisticsRepository,
} from '@dailyuse/domain-server';
import { ReminderContainer } from '../../infrastructure/di/ReminderContainer';
// import { ReminderDomainService } from '@dailyuse/domain-server'; // TODO: Check if exported
import type { ReminderContracts } from '@dailyuse/contracts';

// 类型别名导出（统一在顶部）
type ReminderTemplateClientDTO = ReminderContracts.ReminderTemplateClientDTO;
type ReminderStatisticsClientDTO = ReminderContracts.ReminderStatisticsClientDTO;
type ReminderType = ReminderContracts.ReminderType;
type TriggerType = ReminderContracts.TriggerType;

/**
 * Reminder 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain → ClientDTO）
 *
 * 注意：返回给客户端的数据必须使用 ClientDTO（通过 toClientDTO() 方法）
 */
export class ReminderApplicationService {
  private static instance: ReminderApplicationService;
  private domainService: ReminderDomainService;
  private reminderTemplateRepository: IReminderTemplateRepository;
  private reminderGroupRepository: IReminderGroupRepository;
  private reminderStatisticsRepository: IReminderStatisticsRepository;

  private constructor(
    reminderTemplateRepository: IReminderTemplateRepository,
    reminderGroupRepository: IReminderGroupRepository,
    reminderStatisticsRepository: IReminderStatisticsRepository,
  ) {
    this.reminderTemplateRepository = reminderTemplateRepository;
    this.reminderGroupRepository = reminderGroupRepository;
    this.reminderStatisticsRepository = reminderStatisticsRepository;
    this.domainService = new ReminderDomainService(
      reminderTemplateRepository,
      reminderGroupRepository,
      reminderStatisticsRepository,
    );
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    reminderTemplateRepository?: IReminderTemplateRepository,
    reminderGroupRepository?: IReminderGroupRepository,
    reminderStatisticsRepository?: IReminderStatisticsRepository,
  ): Promise<ReminderApplicationService> {
    const container = ReminderContainer.getInstance();
    const templateRepo = reminderTemplateRepository || container.getReminderTemplateRepository();
    const groupRepo = reminderGroupRepository || container.getReminderGroupRepository();
    const statsRepo = reminderStatisticsRepository || container.getReminderStatisticsRepository();

    ReminderApplicationService.instance = new ReminderApplicationService(
      templateRepo,
      groupRepo,
      statsRepo,
    );
    return ReminderApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<ReminderApplicationService> {
    if (!ReminderApplicationService.instance) {
      ReminderApplicationService.instance = await ReminderApplicationService.createInstance();
    }
    return ReminderApplicationService.instance;
  }

  // ===== Reminder Template 管理 =====

  /**
   * 创建提醒模板
   */
  async createReminderTemplate(params: {
    accountUuid: string;
    name: string;
    description?: string;
    targetType: ReminderType;
    triggerType: TriggerType;
    advanceMinutes?: number;
    reminderContent?: string;
    isEnabled?: boolean;
  }): Promise<ReminderTemplateClientDTO> {
    // TODO: 委托给领域服务处理业务逻辑
    // const template = await this.domainService.createReminderTemplate(params);
    // return template.toClientDTO();

    throw new Error(
      'ReminderApplicationService.createReminderTemplate() not implemented - Domain service required',
    );
  }

  /**
   * 获取提醒模板详情
   */
  async getReminderTemplate(uuid: string): Promise<ReminderTemplateClientDTO | null> {
    // TODO: 委托给领域服务处理
    // const template = await this.domainService.getReminderTemplate(uuid);
    // return template ? template.toClientDTO() : null;

    throw new Error(
      'ReminderApplicationService.getReminderTemplate() not implemented - Domain service required',
    );
  }

  /**
   * 获取用户的所有提醒模板
   */
  async getUserReminderTemplates(accountUuid: string): Promise<ReminderTemplateClientDTO[]> {
    // TODO: 委托给领域服务处理
    // const templates = await this.domainService.getUserReminderTemplates(accountUuid);
    // return templates.map((t) => t.toClientDTO());

    throw new Error(
      'ReminderApplicationService.getUserReminderTemplates() not implemented - Domain service required',
    );
  }

  /**
   * 更新提醒模板
   */
  async updateReminderTemplate(
    uuid: string,
    updates: Partial<{
      name: string;
      description: string;
      advanceMinutes: number;
      reminderContent: string;
      isEnabled: boolean;
    }>,
  ): Promise<ReminderTemplateClientDTO> {
    // TODO: 委托给领域服务处理
    // const template = await this.domainService.updateReminderTemplate(uuid, updates);
    // return template.toClientDTO();

    throw new Error(
      'ReminderApplicationService.updateReminderTemplate() not implemented - Domain service required',
    );
  }

  /**
   * 删除提醒模板
   */
  async deleteReminderTemplate(uuid: string): Promise<void> {
    // TODO: 委托给领域服务处理
    // await this.domainService.deleteReminderTemplate(uuid);

    throw new Error(
      'ReminderApplicationService.deleteReminderTemplate() not implemented - Domain service required',
    );
  }

  /**
   * 切换提醒模板启用状态
   */
  async toggleReminderTemplateStatus(uuid: string): Promise<ReminderTemplateClientDTO> {
    // TODO: 委托给领域服务处理
    // const template = await this.domainService.toggleReminderTemplateStatus(uuid);
    // return template.toClientDTO();

    throw new Error(
      'ReminderApplicationService.toggleReminderTemplateStatus() not implemented - Domain service required',
    );
  }

  /**
   * 搜索提醒模板
   */
  async searchReminderTemplates(
    accountUuid: string,
    query: string,
  ): Promise<ReminderTemplateClientDTO[]> {
    // TODO: 委托给领域服务处理
    // const templates = await this.domainService.searchReminderTemplates(accountUuid, query);
    // return templates.map((t) => t.toClientDTO());

    throw new Error(
      'ReminderApplicationService.searchReminderTemplates() not implemented - Domain service required',
    );
  }

  /**
   * 获取提醒统计
   */
  async getReminderStatistics(accountUuid: string): Promise<ReminderStatisticsClientDTO> {
    // TODO: 委托给领域服务处理
    // const stats = await this.domainService.getReminderStatistics(accountUuid);
    // return stats.toClientDTO();

    throw new Error(
      'ReminderApplicationService.getReminderStatistics() not implemented - Domain service required',
    );
  }
}
