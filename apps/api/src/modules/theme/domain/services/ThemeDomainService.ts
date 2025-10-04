/**
 * ThemeDomainService
 * 主题领域服务
 *
 * @description 处理主题相关的业务逻辑，不依赖基础设施
 */

import { UserThemePreference } from '../entities/UserThemePreference';
import { ThemeContracts } from '@dailyuse/contracts';
import { generateUUID } from '@dailyuse/utils';

export class ThemeDomainService {
  /**
   * 创建用户主题偏好
   */
  createUserPreference(
    accountUuid: string,
    mode: ThemeContracts.ThemeMode = ThemeContracts.ThemeMode.SYSTEM,
  ): UserThemePreference {
    const now = Date.now();

    // 根据模式设置默认主题
    let defaultThemeUuid = 'system_light';
    if (mode === ThemeContracts.ThemeMode.DARK) {
      defaultThemeUuid = 'system_dark';
    }

    return new UserThemePreference({
      uuid: generateUUID(),
      accountUuid,
      currentThemeUuid: defaultThemeUuid,
      preferredMode: mode,
      autoSwitch: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 切换主题模式
   */
  switchThemeMode(
    preference: UserThemePreference,
    mode: ThemeContracts.ThemeMode,
  ): UserThemePreference {
    // 业务规则验证
    if (preference.preferredMode === mode) {
      throw new Error('Already in the requested theme mode');
    }

    preference.switchMode(mode);

    // 根据新模式更新当前主题
    if (mode === ThemeContracts.ThemeMode.LIGHT) {
      preference.setCurrentTheme('system_light');
    } else if (mode === ThemeContracts.ThemeMode.DARK) {
      preference.setCurrentTheme('system_dark');
    } else if (mode === ThemeContracts.ThemeMode.SYSTEM) {
      // SYSTEM 模式：检测系统主题
      const systemIsDark = this.detectSystemTheme();
      preference.setCurrentTheme(systemIsDark ? 'system_dark' : 'system_light');
    }

    return preference;
  }

  /**
   * 应用自定义主题
   */
  applyCustomTheme(preference: UserThemePreference, themeUuid: string): UserThemePreference {
    // 业务规则：自定义主题需要有效的 UUID
    if (!themeUuid || themeUuid.trim() === '') {
      throw new Error('Theme UUID cannot be empty');
    }

    preference.setCurrentTheme(themeUuid);
    return preference;
  }

  /**
   * 配置自动切换
   */
  configureAutoSwitch(
    preference: UserThemePreference,
    enabled: boolean,
    scheduleStart?: number,
    scheduleEnd?: number,
  ): UserThemePreference {
    if (enabled) {
      // 业务规则：启用自动切换需要提供时间范围
      if (scheduleStart === undefined || scheduleEnd === undefined) {
        throw new Error('Auto-switch requires both start and end times');
      }

      // 验证时间范围（0-23）
      if (scheduleStart < 0 || scheduleStart > 23 || scheduleEnd < 0 || scheduleEnd > 23) {
        throw new Error('Schedule times must be between 0 and 23');
      }

      preference.enableAutoSwitch(scheduleStart, scheduleEnd);
    } else {
      preference.disableAutoSwitch();
    }

    return preference;
  }

  /**
   * 检查是否需要自动切换主题
   */
  checkAutoSwitch(preference: UserThemePreference): {
    shouldSwitch: boolean;
    targetTheme: string | null;
  } {
    if (!preference.shouldSwitchTheme()) {
      return { shouldSwitch: false, targetTheme: null };
    }

    const currentHour = new Date().getHours();
    const isInLightPeriod =
      preference.scheduleStart !== undefined &&
      preference.scheduleEnd !== undefined &&
      ((preference.scheduleStart < preference.scheduleEnd &&
        currentHour >= preference.scheduleStart &&
        currentHour < preference.scheduleEnd) ||
        (preference.scheduleStart > preference.scheduleEnd &&
          (currentHour >= preference.scheduleStart || currentHour < preference.scheduleEnd)));

    const targetTheme = isInLightPeriod ? 'system_light' : 'system_dark';

    return {
      shouldSwitch: preference.currentThemeUuid !== targetTheme,
      targetTheme,
    };
  }

  /**
   * 检测系统主题（浏览器环境）
   * 注意：服务端无法直接检测，需要客户端传递
   */
  private detectSystemTheme(): boolean {
    // 服务端默认返回 false（浅色）
    // 实际检测应该由客户端完成
    return false;
  }

  /**
   * 验证主题偏好设置
   */
  validatePreference(preference: UserThemePreference): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!preference.accountUuid) {
      errors.push('Account UUID is required');
    }

    if (!preference.currentThemeUuid) {
      errors.push('Current theme UUID is required');
    }

    if (preference.autoSwitch) {
      if (preference.scheduleStart === undefined || preference.scheduleEnd === undefined) {
        errors.push('Auto-switch schedule is incomplete');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
