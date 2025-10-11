/**
 * UserPreferencesApplicationService
 * 用户偏好应用服务
 *
 * @description 协调领域服务、仓储和事件发布
 */

import { SettingDomainService } from '../../domain/services/SettingDomainService';
import type { IUserPreferencesRepository, UserPreferences } from '@dailyuse/domain-server';
import { SettingContracts } from '@dailyuse/contracts';
import type { SettingDomainEvent } from '../../domain/events/SettingDomainEvents';
import type { IEventPublisher } from '../interfaces/IEventPublisher';
import { createLogger } from '@dailyuse/utils';

type UserPreferencesDTO = SettingContracts.UserPreferencesDTO;

const logger = createLogger('UserPreferencesApplicationService');

export class UserPreferencesApplicationService {
  private static instance: UserPreferencesApplicationService;
  private readonly domainService: SettingDomainService;
  private eventPublisher?: IEventPublisher;

  constructor(private readonly repository: IUserPreferencesRepository) {
    this.domainService = new SettingDomainService();
  }

  /**
   * 创建服务实例
   */
  static createInstance(repository: IUserPreferencesRepository): UserPreferencesApplicationService {
    UserPreferencesApplicationService.instance = new UserPreferencesApplicationService(repository);
    return UserPreferencesApplicationService.instance;
  }

  /**
   * 获取单例实例
   */
  static getInstance(): UserPreferencesApplicationService {
    if (!UserPreferencesApplicationService.instance) {
      throw new Error(
        'UserPreferencesApplicationService not initialized. Call createInstance() first.',
      );
    }
    return UserPreferencesApplicationService.instance;
  }

  /**
   * 设置事件发布器
   */
  setEventPublisher(publisher: IEventPublisher): void {
    this.eventPublisher = publisher;
  }

  /**
   * 获取用户偏好
   * 如果不存在，创建默认偏好
   */
  async getUserPreferences(accountUuid: string): Promise<UserPreferencesDTO> {
    logger.info('Getting user preferences', { accountUuid });

    let preferences = await this.repository.findByAccountUuid(accountUuid);

    if (!preferences) {
      logger.info('No preferences found, creating default', { accountUuid });
      preferences = this.domainService.createDefaultPreferences(accountUuid);
      preferences = await this.repository.save(preferences);
    }

    return preferences.toDTO();
  }

  /**
   * 切换主题模式
   * 发布 THEME_MODE_CHANGED 事件给 Theme 模块
   */
  async switchThemeMode(
    accountUuid: string,
    mode: 'light' | 'dark' | 'system',
  ): Promise<UserPreferencesDTO> {
    logger.info('Switching theme mode', { accountUuid, mode });

    let preferences = await this.repository.findByAccountUuid(accountUuid);

    if (!preferences) {
      preferences = this.domainService.createDefaultPreferences(accountUuid);
    }

    // 调用领域服务，生成事件
    const { preferences: updatedPreferences, event } = this.domainService.switchThemeMode(
      preferences,
      mode,
    );

    // 保存到数据库
    const saved = await this.repository.save(updatedPreferences);

    // 发布事件到事件总线
    if (this.eventPublisher) {
      await this.eventPublisher.publish(event);
      logger.info('Published THEME_MODE_CHANGED event', { accountUuid, mode });
    }

    return saved.toDTO();
  }

  /**
   * 更改语言
   */
  async changeLanguage(accountUuid: string, language: string): Promise<UserPreferencesDTO> {
    logger.info('Changing language', { accountUuid, language });

    let preferences = await this.repository.findByAccountUuid(accountUuid);

    if (!preferences) {
      preferences = this.domainService.createDefaultPreferences(accountUuid);
    }

    const { preferences: updatedPreferences, event } = this.domainService.changeLanguage(
      preferences,
      language,
    );

    const saved = await this.repository.save(updatedPreferences);

    if (this.eventPublisher) {
      await this.eventPublisher.publish(event);
      logger.info('Published LANGUAGE_CHANGED event', { accountUuid, language });
    }

    return saved.toDTO();
  }

  /**
   * 更新通知偏好
   */
  async updateNotificationPreferences(
    accountUuid: string,
    config: {
      notificationsEnabled?: boolean;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
    },
  ): Promise<UserPreferencesDTO> {
    logger.info('Updating notification preferences', { accountUuid, config });

    let preferences = await this.repository.findByAccountUuid(accountUuid);

    if (!preferences) {
      preferences = this.domainService.createDefaultPreferences(accountUuid);
    }

    const { preferences: updatedPreferences, event } =
      this.domainService.updateNotificationPreferences(preferences, config);

    const saved = await this.repository.save(updatedPreferences);

    if (this.eventPublisher) {
      await this.eventPublisher.publish(event);
      logger.info('Published NOTIFICATION_PREFERENCES_CHANGED event', { accountUuid });
    }

    return saved.toDTO();
  }

  /**
   * 批量更新偏好
   */
  async updatePreferences(
    accountUuid: string,
    updates: Partial<UserPreferencesDTO>,
  ): Promise<UserPreferencesDTO> {
    logger.info('Updating user preferences', { accountUuid, updates });

    let preferences = await this.repository.findByAccountUuid(accountUuid);

    if (!preferences) {
      preferences = this.domainService.createDefaultPreferences(accountUuid);
    }

    preferences.updatePreferences(updates);

    const saved = await this.repository.save(preferences);

    logger.info('User preferences updated successfully', { accountUuid });

    return saved.toDTO();
  }

  /**
   * 重置为默认偏好
   */
  async resetToDefault(accountUuid: string): Promise<UserPreferencesDTO> {
    logger.info('Resetting preferences to default', { accountUuid });

    const preferences = this.domainService.createDefaultPreferences(accountUuid);
    const saved = await this.repository.save(preferences);

    logger.info('Preferences reset successfully', { accountUuid });

    return saved.toDTO();
  }
}
