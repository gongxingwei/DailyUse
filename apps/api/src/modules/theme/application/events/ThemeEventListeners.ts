/**
 * Theme Event Listeners
 * Theme 模块事件监听器
 *
 * @description 监听来自 Setting 模块的主题相关事件
 */

import { ThemeApplicationService } from '../services/ThemeApplicationService';
import type { ThemeModeChangedEvent } from '../../../setting/domain/events/SettingDomainEvents';
import { eventBus } from '../../../../shared/events/EventBus';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ThemeEventListeners');

export class ThemeEventListeners {
  constructor(private readonly themeService: ThemeApplicationService) {}

  /**
   * 监听主题模式变更事件
   * 当 Setting 模块的用户切换主题模式时触发
   */
  async onThemeModeChanged(event: ThemeModeChangedEvent): Promise<void> {
    logger.info('Received THEME_MODE_CHANGED event', {
      accountUuid: event.accountUuid,
      themeMode: event.themeMode,
    });

    try {
      // 调用 Theme 模块的应用服务
      await this.themeService.switchThemeMode(event.accountUuid, event.themeMode as any);

      logger.info('Theme mode synchronized successfully', {
        accountUuid: event.accountUuid,
        themeMode: event.themeMode,
      });
    } catch (error) {
      logger.error('Failed to synchronize theme mode', error, {
        accountUuid: event.accountUuid,
        themeMode: event.themeMode,
      });
      throw error;
    }
  }

  /**
   * 注册所有事件监听器到事件总线
   */
  registerListeners(): void {
    // 监听主题模式变更事件
    eventBus.on('THEME_MODE_CHANGED', this.onThemeModeChanged.bind(this));

    logger.info('Theme event listeners registered');
  }
}
