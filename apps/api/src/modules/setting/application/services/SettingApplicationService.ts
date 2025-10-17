import type { ISettingRepository } from '@dailyuse/domain-server';
import { SettingContainer } from '../../infrastructure/di/SettingContainer';
import { SettingDomainService } from '@dailyuse/domain-server';
import type { SettingContracts } from '@dailyuse/contracts';

/**
 * Setting 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain ↔ Contracts）
 */
export class SettingApplicationService {
  private static instance: SettingApplicationService;
  private domainService: SettingDomainService;
  private settingRepository: ISettingRepository;

  private constructor(settingRepository: ISettingRepository) {
    this.domainService = new SettingDomainService(settingRepository);
    this.settingRepository = settingRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    settingRepository?: ISettingRepository,
  ): Promise<SettingApplicationService> {
    const container = SettingContainer.getInstance();
    const repo = settingRepository || container.getSettingRepository();

    SettingApplicationService.instance = new SettingApplicationService(repo);
    return SettingApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<SettingApplicationService> {
    if (!SettingApplicationService.instance) {
      SettingApplicationService.instance = await SettingApplicationService.createInstance();
    }
    return SettingApplicationService.instance;
  }

  // ===== Setting 管理 =====

  /**
   * 创建设置项
   */
  async createSetting(params: {
    key: string;
    name: string;
    description?: string;
    valueType: SettingContracts.SettingValueType;
    value: any;
    defaultValue: any;
    scope: SettingContracts.SettingScope;
    accountUuid?: string;
    deviceId?: string;
    groupUuid?: string;
    validation?: SettingContracts.ValidationRuleServer;
    ui?: SettingContracts.UIConfigServer;
    isEncrypted?: boolean;
    isReadOnly?: boolean;
    isSystemSetting?: boolean;
    syncConfig?: SettingContracts.SyncConfigServer;
  }): Promise<SettingContracts.SettingClientDTO> {
    // 委托给领域服务处理业务逻辑
    const setting = await this.domainService.createSetting(params);

    // 转换为 ClientDTO (API 返回给客户端)
    return setting.toClientDTO();
  }

  /**
   * 获取设置详情
   */
  async getSetting(
    uuid: string,
    options?: { includeHistory?: boolean },
  ): Promise<SettingContracts.SettingClientDTO | null> {
    // 委托给领域服务处理
    const setting = await this.domainService.getSetting(uuid, options);

    return setting ? setting.toClientDTO() : null;
  }

  /**
   * 通过 key 获取设置
   */
  async getSettingByKey(
    key: string,
    scope: SettingContracts.SettingScope,
    contextUuid?: string,
  ): Promise<SettingContracts.SettingClientDTO | null> {
    // 委托给领域服务处理
    const setting = await this.domainService.getSettingByKey(key, scope, contextUuid);

    return setting ? setting.toClientDTO() : null;
  }

  /**
   * 更新设置值
   */
  async updateSettingValue(
    uuid: string,
    newValue: any,
    operatorUuid?: string,
  ): Promise<SettingContracts.SettingClientDTO> {
    // 委托给领域服务处理业务逻辑
    const setting = await this.domainService.updateSettingValue(uuid, newValue, operatorUuid);

    return setting.toClientDTO();
  }

  /**
   * 重置设置为默认值
   */
  async resetSetting(uuid: string): Promise<SettingContracts.SettingClientDTO> {
    // 委托给领域服务处理
    const setting = await this.domainService.resetSetting(uuid);

    return setting.toClientDTO();
  }

  /**
   * 批量更新设置
   */
  async updateManySettings(
    updates: Array<{ uuid: string; value: any; operatorUuid?: string }>,
  ): Promise<SettingContracts.SettingClientDTO[]> {
    // 委托给领域服务处理
    const settings = await this.domainService.updateManySettings(updates);

    return settings.map((s) => s.toClientDTO());
  }

  /**
   * 获取作用域内的所有设置
   */
  async getSettingsByScope(
    scope: SettingContracts.SettingScope,
    contextUuid?: string,
    options?: { includeHistory?: boolean },
  ): Promise<SettingContracts.SettingClientDTO[]> {
    // 委托给领域服务处理
    const settings = await this.domainService.getSettingsByScope(scope, contextUuid, options);

    return settings.map((s) => s.toClientDTO());
  }

  /**
   * 获取用户设置
   */
  async getUserSettings(
    accountUuid: string,
    options?: { includeHistory?: boolean },
  ): Promise<SettingContracts.SettingClientDTO[]> {
    // 委托给领域服务处理
    const settings = await this.domainService.getUserSettings(accountUuid, options);

    return settings.map((s) => s.toClientDTO());
  }

  /**
   * 获取系统设置
   */
  async getSystemSettings(options?: {
    includeHistory?: boolean;
  }): Promise<SettingContracts.SettingClientDTO[]> {
    // 委托给领域服务处理
    const settings = await this.domainService.getSystemSettings(options);

    return settings.map((s) => s.toClientDTO());
  }

  /**
   * 搜索设置
   */
  async searchSettings(
    query: string,
    scope?: SettingContracts.SettingScope,
  ): Promise<SettingContracts.SettingClientDTO[]> {
    // 委托给领域服务处理
    const settings = await this.domainService.searchSettings(query, scope);

    return settings.map((s) => s.toClientDTO());
  }

  /**
   * 同步设置
   */
  async syncSetting(uuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.syncSetting(uuid);
  }

  /**
   * 删除设置
   */
  async deleteSetting(uuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.deleteSetting(uuid);
  }

  /**
   * 验证设置值
   */
  async validateSettingValue(
    uuid: string,
    value: any,
  ): Promise<{ valid: boolean; error?: string }> {
    // 委托给领域服务处理
    return await this.domainService.validateSettingValue(uuid, value);
  }

  /**
   * 导出设置配置
   */
  async exportSettings(
    scope: SettingContracts.SettingScope,
    contextUuid?: string,
  ): Promise<Record<string, any>> {
    // 委托给领域服务处理
    return await this.domainService.exportSettings(scope, contextUuid);
  }

  /**
   * 导入设置配置
   */
  async importSettings(
    scope: SettingContracts.SettingScope,
    config: Record<string, any>,
    contextUuid?: string,
    operatorUuid?: string,
  ): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.importSettings(scope, config, contextUuid, operatorUuid);
  }
}
