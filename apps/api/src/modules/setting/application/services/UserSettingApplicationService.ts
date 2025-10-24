/**
 * UserSetting Application Service
 * 用户设置应用服务
 *
 * 架构职责：
 * - 协调领域层（UserSettingServer）和基础设施层（Repository）
 * - 处理业务用例（创建、更新、查询、删除用户设置）
 * - DTO 转换（API Request ↔ Domain ↔ API Response）
 * - 事务管理
 * - 错误处理
 */

import type { IUserSettingRepository } from '@dailyuse/domain-server';
import { UserSettingServer } from '@dailyuse/domain-server';
import { SettingContainer } from '../../infrastructure/di/SettingContainer';
import type { SettingContracts } from '@dailyuse/contracts';
import { DomainError } from '@dailyuse/utils';

/**
 * UserSetting Application Service Error
 */
class UserSettingNotFoundError extends DomainError {
  constructor(identifier: string, type: 'uuid' | 'accountUuid' = 'uuid') {
    super(
      'USER_SETTING_NOT_FOUND',
      `User setting not found with ${type}: ${identifier}`,
      { identifier, type },
      404,
    );
  }
}

class UserSettingAlreadyExistsError extends DomainError {
  constructor(accountUuid: string) {
    super(
      'USER_SETTING_ALREADY_EXISTS',
      `User setting already exists for account: ${accountUuid}`,
      { accountUuid },
      409,
    );
  }
}

export class UserSettingApplicationService {
  private static instance: UserSettingApplicationService;
  private repository: IUserSettingRepository;

  private constructor(repository: IUserSettingRepository) {
    this.repository = repository;
  }

  /**
   * 私有辅助方法：获取entity或抛出NotFound错误
   */
  private async getEntityOrThrow(uuid: string): Promise<UserSettingServer> {
    const entity = await this.repository.findById(uuid);
    if (!entity) {
      throw new UserSettingNotFoundError(uuid, 'uuid');
    }
    return entity;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    repository?: IUserSettingRepository,
  ): Promise<UserSettingApplicationService> {
    const container = SettingContainer.getInstance();
    const repo = repository || container.getUserSettingRepository();

    UserSettingApplicationService.instance = new UserSettingApplicationService(repo);
    return UserSettingApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<UserSettingApplicationService> {
    if (!UserSettingApplicationService.instance) {
      UserSettingApplicationService.instance = await UserSettingApplicationService.createInstance();
    }
    return UserSettingApplicationService.instance;
  }

  // ===== 创建 =====

  /**
   * 创建用户设置
   */
  async createUserSetting(
    request: SettingContracts.CreateUserSettingRequest,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    // 检查是否已存在
    const exists = await this.repository.existsByAccountUuid(request.accountUuid);
    if (exists) {
      throw new UserSettingAlreadyExistsError(request.accountUuid);
    }

    // 创建领域实体（使用默认值）
    const entity = UserSettingServer.create({
      accountUuid: request.accountUuid,
      appearance: request.appearance,
      locale: request.locale,
      workflow: request.workflow,
      shortcuts: request.shortcuts,
      privacy: request.privacy,
      experimental: request.experimental,
    });

    // 持久化
    await this.repository.save(entity);

    // 返回 ClientDTO
    return entity.toClientDTO();
  }

  // ===== 查询 =====

  /**
   * 根据 UUID 获取用户设置
   */
  async getUserSettingByUuid(uuid: string): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.repository.findById(uuid);
    if (!entity) {
      throw new UserSettingNotFoundError(uuid, 'uuid');
    }
    return entity.toClientDTO();
  }

  /**
   * 根据账户 UUID 获取用户设置
   */
  async getUserSettingByAccountUuid(
    accountUuid: string,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.repository.findByAccountUuid(accountUuid);
    if (!entity) {
      throw new UserSettingNotFoundError(accountUuid, 'accountUuid');
    }
    return entity.toClientDTO();
  }

  /**
   * 获取或创建用户设置（确保存在）
   */
  async getOrCreateUserSetting(
    accountUuid: string,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const existing = await this.repository.findByAccountUuid(accountUuid);
    if (existing) {
      return existing.toClientDTO();
    }

    // 创建默认设置
    return this.createUserSetting({ accountUuid });
  }

  // ===== 更新 =====

  /**
   * 更新用户设置（批量更新）
   */
  async updateUserSetting(
    uuid: string,
    request: SettingContracts.UpdateUserSettingRequest,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.getEntityOrThrow(uuid);

    // 更新各个部分 (使用 as any 处理字符串字面量与枚举的类型兼容性)
    if (request.appearance) {
      entity.updateAppearance(request.appearance as any);
    }
    if (request.locale) {
      entity.updateLocale(request.locale as any);
    }
    if (request.workflow) {
      entity.updateWorkflow(request.workflow as any);
    }
    if (request.privacy) {
      entity.updatePrivacy(request.privacy as any);
    }
    if (request.shortcuts?.custom) {
      Object.entries(request.shortcuts.custom).forEach(([action, shortcut]) => {
        entity.updateShortcut(action, shortcut);
      });
    }
    if (request.experimental?.features) {
      request.experimental.features.forEach((feature) => {
        entity.enableExperimentalFeature(feature);
      });
    }

    // 持久化
    await this.repository.save(entity);

    return entity.toClientDTO();
  }

  /**
   * 更新外观设置
   */
  async updateAppearance(
    uuid: string,
    request: SettingContracts.UpdateAppearanceRequest,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.getEntityOrThrow(uuid);

    entity.updateAppearance(request as any);
    await this.repository.save(entity);

    return entity.toClientDTO();
  }

  /**
   * 更新主题
   */
  async updateTheme(
    uuid: string,
    theme: SettingContracts.ThemeMode,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.getEntityOrThrow(uuid);
    entity.updateTheme(theme);
    await this.repository.save(entity);

    return entity.toClientDTO();
  }

  /**
   * 更新语言区域设置
   */
  async updateLocale(
    uuid: string,
    request: SettingContracts.UpdateLocaleRequest,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.getEntityOrThrow(uuid);

    entity.updateLocale(request as any);
    await this.repository.save(entity);

    return entity.toClientDTO();
  }

  /**
   * 更新语言
   */
  async updateLanguage(
    uuid: string,
    language: string,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.getEntityOrThrow(uuid);

    entity.updateLanguage(language);
    await this.repository.save(entity);

    return entity.toClientDTO();
  }

  /**
   * 更新时区
   */
  async updateTimezone(
    uuid: string,
    timezone: string,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.getEntityOrThrow(uuid);

    entity.updateTimezone(timezone);
    await this.repository.save(entity);

    return entity.toClientDTO();
  }

  /**
   * 更新快捷键
   */
  async updateShortcut(
    uuid: string,
    request: SettingContracts.UpdateShortcutRequest,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.getEntityOrThrow(uuid);

    entity.updateShortcut(request.action, request.shortcut);
    await this.repository.save(entity);

    return entity.toClientDTO();
  }

  /**
   * 删除快捷键
   */
  async removeShortcut(
    uuid: string,
    action: string,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.getEntityOrThrow(uuid);

    entity.removeShortcut(action);
    await this.repository.save(entity);

    return entity.toClientDTO();
  }

  /**
   * 启用实验性功能
   */
  async enableExperimentalFeature(
    uuid: string,
    feature: string,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.getEntityOrThrow(uuid);

    entity.enableExperimentalFeature(feature);
    await this.repository.save(entity);

    return entity.toClientDTO();
  }

  /**
   * 禁用实验性功能
   */
  async disableExperimentalFeature(
    uuid: string,
    feature: string,
  ): Promise<SettingContracts.UserSettingClientDTO> {
    const entity = await this.getEntityOrThrow(uuid);

    entity.disableExperimentalFeature(feature);
    await this.repository.save(entity);

    return entity.toClientDTO();
  }

  // ===== 删除 =====

  /**
   * 删除用户设置
   */
  async deleteUserSetting(uuid: string): Promise<void> {
    const exists = await this.repository.exists(uuid);
    if (!exists) {
      throw new UserSettingNotFoundError(uuid, 'uuid');
    }

    await this.repository.delete(uuid);
  }

  // ===== 辅助方法 =====

  /**
   * 获取或创建用户设置
   * 确保用户设置存在
   */
  async getOrCreate(accountUuid: string): Promise<SettingContracts.UserSettingClientDTO> {
    const existing = await this.repository.findByAccountUuid(accountUuid);
    if (existing) {
      return existing.toClientDTO();
    }

    // 创建默认设置
    return this.createUserSetting({ accountUuid });
  }
}
