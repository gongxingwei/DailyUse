/**
 * ThemeApplicationService
 * 主题应用服务
 *
 * @description 协调领域服务和仓储，处理主题相关的应用逻辑
 */

import { ThemeDomainService } from '../../domain/services/ThemeDomainService';
import type { IUserThemePreferenceRepository } from '../../domain/repositories/IUserThemePreferenceRepository';
import { ThemeContracts } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ThemeApplicationService');

export class ThemeApplicationService {
  private readonly domainService: ThemeDomainService;

  constructor(private readonly preferenceRepository: IUserThemePreferenceRepository) {
    this.domainService = new ThemeDomainService();
  }

  /**
   * 获取用户主题偏好
   * 如果不存在，创建默认偏好
   */
  async getUserPreference(accountUuid: string): Promise<ThemeContracts.IUserThemePreference> {
    logger.info('Getting user theme preference', { accountUuid });

    let preference = await this.preferenceRepository.findByAccountUuid(accountUuid);

    if (!preference) {
      logger.info('No preference found, creating default', { accountUuid });
      preference = this.domainService.createUserPreference(accountUuid);
      preference = await this.preferenceRepository.save(preference);
    }

    return preference.toObject();
  }

  /**
   * 切换主题模式
   */
  async switchThemeMode(
    accountUuid: string,
    mode: ThemeContracts.ThemeMode,
  ): Promise<ThemeContracts.IUserThemePreference> {
    logger.info('Switching theme mode', { accountUuid, mode });

    let preference = await this.preferenceRepository.findByAccountUuid(accountUuid);

    if (!preference) {
      // 如果不存在，创建新的偏好
      preference = this.domainService.createUserPreference(accountUuid, mode);
    } else {
      // 切换模式
      preference = this.domainService.switchThemeMode(preference, mode);
    }

    preference = await this.preferenceRepository.save(preference);

    logger.info('Theme mode switched successfully', {
      accountUuid,
      mode,
      currentTheme: preference.currentThemeUuid,
    });

    return preference.toObject();
  }

  /**
   * 应用自定义主题
   */
  async applyCustomTheme(
    accountUuid: string,
    themeUuid: string,
  ): Promise<ThemeContracts.IUserThemePreference> {
    logger.info('Applying custom theme', { accountUuid, themeUuid });

    let preference = await this.preferenceRepository.findByAccountUuid(accountUuid);

    if (!preference) {
      preference = this.domainService.createUserPreference(accountUuid);
    }

    preference = this.domainService.applyCustomTheme(preference, themeUuid);
    preference = await this.preferenceRepository.save(preference);

    logger.info('Custom theme applied successfully', { accountUuid, themeUuid });

    return preference.toObject();
  }

  /**
   * 配置自动切换
   */
  async configureAutoSwitch(
    accountUuid: string,
    config: {
      enabled: boolean;
      scheduleStart?: number;
      scheduleEnd?: number;
    },
  ): Promise<ThemeContracts.IUserThemePreference> {
    logger.info('Configuring auto-switch', { accountUuid, config });

    let preference = await this.preferenceRepository.findByAccountUuid(accountUuid);

    if (!preference) {
      preference = this.domainService.createUserPreference(accountUuid);
    }

    preference = this.domainService.configureAutoSwitch(
      preference,
      config.enabled,
      config.scheduleStart,
      config.scheduleEnd,
    );

    preference = await this.preferenceRepository.save(preference);

    logger.info('Auto-switch configured successfully', { accountUuid, enabled: config.enabled });

    return preference.toObject();
  }

  /**
   * 检查并执行自动切换
   */
  async checkAndAutoSwitch(accountUuid: string): Promise<{ switched: boolean; theme?: string }> {
    logger.debug('Checking auto-switch', { accountUuid });

    const preference = await this.preferenceRepository.findByAccountUuid(accountUuid);

    if (!preference) {
      return { switched: false };
    }

    const { shouldSwitch, targetTheme } = this.domainService.checkAutoSwitch(preference);

    if (shouldSwitch && targetTheme) {
      preference.setCurrentTheme(targetTheme);
      await this.preferenceRepository.save(preference);

      logger.info('Auto-switched theme', { accountUuid, targetTheme });

      return { switched: true, theme: targetTheme };
    }

    return { switched: false };
  }

  /**
   * 重置为默认偏好
   */
  async resetToDefault(accountUuid: string): Promise<ThemeContracts.IUserThemePreference> {
    logger.info('Resetting theme preference to default', { accountUuid });

    const preference = this.domainService.createUserPreference(accountUuid);
    const saved = await this.preferenceRepository.save(preference);

    logger.info('Theme preference reset successfully', { accountUuid });

    return saved.toObject();
  }

  /**
   * 删除用户主题偏好
   */
  async deleteUserPreference(accountUuid: string): Promise<void> {
    logger.info('Deleting user theme preference', { accountUuid });

    await this.preferenceRepository.delete(accountUuid);

    logger.info('User theme preference deleted successfully', { accountUuid });
  }
}
