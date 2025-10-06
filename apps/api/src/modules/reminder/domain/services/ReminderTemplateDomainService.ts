import type { ReminderContracts } from '@dailyuse/contracts';
import type {
  IReminderTemplateAggregateRepository,
  ReminderTemplate,
} from '@dailyuse/domain-server';
import { ReminderTemplate as ReminderTemplateAggregate } from '@dailyuse/domain-server';

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
   */
  async createTemplate(
    accountUuid: string,
    request: ReminderContracts.CreateReminderTemplateRequest,
  ): Promise<ReminderContracts.ReminderTemplateResponse> {
    // TODO: 使用聚合根工厂方法创建
    // const template = ReminderTemplateAggregate.create({...});

    // 暂时抛出错误，等待实现
    throw new Error('ReminderTemplateDomainService.createTemplate not yet implemented');
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

    // TODO: 使用聚合根方法更新
    // template.updateBasicInfo({...});

    throw new Error('ReminderTemplateDomainService.updateTemplate not yet implemented');
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
    // TODO: 需要在仓储接口添加 findByKeyword 方法
    // const result = await this.templateRepository.findByKeyword(accountUuid, keyword, params);

    // 暂时返回空结果
    return {
      templates: [],
      total: 0,
    };
  }

  // ==================== 业务逻辑方法 ====================

  /**
   * 切换模板启用状态
   */
  async toggleTemplateEnabled(
    accountUuid: string,
    uuid: string,
    enabled: boolean,
  ): Promise<ReminderContracts.ReminderTemplateClientDTO> {
    const template = await this.templateRepository.getTemplateByUuid(accountUuid, uuid);
    if (!template) {
      throw new Error(`Template ${uuid} not found`);
    }

    // TODO: 使用聚合根方法
    // template.setEnabled(enabled);

    throw new Error('ReminderTemplateDomainService.toggleTemplateEnabled not yet implemented');
  }
}
