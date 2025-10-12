/**
 * UserPreferences Client Implementation
 * @description 用户偏好客户端实现 - 继承自Core层，提供UI相关功能
 * @author DailyUse Team
 * @date 2024-10-06
 */

import { UserPreferencesCore } from '@dailyuse/domain-core';
import { SettingContracts } from '@dailyuse/contracts';

// 类型导入
type IUserPreferences = SettingContracts.IUserPreferences;
type IUserPreferencesClient = SettingContracts.IUserPreferencesClient;
type UserPreferencesDTO = SettingContracts.UserPreferencesDTO;
type UserPreferencesClientDTO = SettingContracts.UserPreferencesClientDTO;
type UserPreferencesPersistenceDTO = SettingContracts.UserPreferencesPersistenceDTO;

/**
 * 用户偏好客户端实现
 *
 * 职责：
 * - 实现客户端特定的 DTO 转换逻辑
 * - 提供 UI 相关的计算属性（languageText, themeModeIcon等）
 * - 提供客户端工厂方法
 * - 实现本地化和格式化功能
 */
export class UserPreferences extends UserPreferencesCore implements IUserPreferencesClient {
  // ========== UI 计算属性 ==========

  /**
   * 语言显示文本（中文）
   */
  get languageText(): string {
    const languageMap: Record<string, string> = {
      'zh-CN': '简体中文',
      'en-US': 'English',
      'ja-JP': '日本語',
      'ko-KR': '한국어',
    };
    return languageMap[this._language] || this._language;
  }

  /**
   * 时区显示文本
   */
  get timezoneText(): string {
    const timezoneMap: Record<string, string> = {
      'Asia/Shanghai': 'GMT+8 上海',
      'Asia/Tokyo': 'GMT+9 东京',
      'Asia/Seoul': 'GMT+9 首尔',
      'America/New_York': 'GMT-5 纽约',
      'America/Los_Angeles': 'GMT-8 洛杉矶',
      'Europe/London': 'GMT+0 伦敦',
      'Europe/Paris': 'GMT+1 巴黎',
    };
    return timezoneMap[this._timezone] || this._timezone;
  }

  /**
   * 主题模式图标（Material Design Icons）
   */
  get themeModeIcon(): string {
    const iconMap: Record<string, string> = {
      light: 'mdi-white-balance-sunny',
      dark: 'mdi-weather-night',
      system: 'mdi-theme-light-dark',
    };
    return iconMap[this._themeMode];
  }

  /**
   * 主题模式显示文本
   */
  get themeModeText(): string {
    const modeMap: Record<string, string> = {
      light: '浅色',
      dark: '深色',
      system: '跟随系统',
    };
    return modeMap[this._themeMode];
  }

  /**
   * 是否可以更改主题
   * （客户端可以添加额外的业务规则，如权限检查）
   */
  get canChangeTheme(): boolean {
    // 客户端始终允许更改主题
    // 如果需要权限检查，可以在这里实现
    return true;
  }

  /**
   * 是否已启用邮件通知
   */
  get hasEmailEnabled(): boolean {
    return this._emailNotifications;
  }

  /**
   * 是否已启用推送通知
   */
  get hasPushEnabled(): boolean {
    return this._pushNotifications;
  }

  /**
   * 格式化的创建时间
   */
  get formattedCreatedAt(): string {
    return this.formatDateTime(this._createdAt);
  }

  /**
   * 格式化的更新时间
   */
  get formattedUpdatedAt(): string {
    return this.formatDateTime(this._updatedAt);
  }

  // ========== 实现抽象方法 ==========

  /**
   * 转换为标准 DTO
   */
  public toDTO(): UserPreferencesDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      language: this._language,
      timezone: this._timezone,
      locale: this._locale,
      themeMode: this._themeMode,
      notificationsEnabled: this._notificationsEnabled,
      emailNotifications: this._emailNotifications,
      pushNotifications: this._pushNotifications,
      autoLaunch: this._autoLaunch,
      defaultModule: this._defaultModule,
      analyticsEnabled: this._analyticsEnabled,
      crashReportsEnabled: this._crashReportsEnabled,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  /**
   * 转换为客户端 DTO（包含 UI 计算属性）
   */
  public toClientDTO(): UserPreferencesClientDTO {
    return {
      ...this.toDTO(),
      // UI 计算属性
      languageText: this.languageText,
      timezoneText: this.timezoneText,
      themeModeIcon: this.themeModeIcon,
      themeModeText: this.themeModeText,
      canChangeTheme: this.canChangeTheme,
      hasEmailEnabled: this.hasEmailEnabled,
      hasPushEnabled: this.hasPushEnabled,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
    };
  }

  /**
   * 转换为持久化 DTO
   * 注意：客户端通常不直接操作持久化层，此方法主要用于兼容性
   */
  public toPersistence(): UserPreferencesPersistenceDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      language: this._language,
      timezone: this._timezone,
      locale: this._locale,
      themeMode: this._themeMode,
      notificationsEnabled: this._notificationsEnabled,
      emailNotifications: this._emailNotifications,
      pushNotifications: this._pushNotifications,
      autoLaunch: this._autoLaunch,
      defaultModule: this._defaultModule,
      analyticsEnabled: this._analyticsEnabled,
      crashReportsEnabled: this._crashReportsEnabled,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ========== 工厂方法 ==========

  /**
   * 从 DTO 创建实例（客户端常用）
   */
  static fromDTO(data: UserPreferencesDTO): UserPreferences {
    return new UserPreferences({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      language: data.language,
      timezone: data.timezone,
      locale: data.locale,
      themeMode: data.themeMode,
      notificationsEnabled: data.notificationsEnabled,
      emailNotifications: data.emailNotifications,
      pushNotifications: data.pushNotifications,
      autoLaunch: data.autoLaunch,
      defaultModule: data.defaultModule,
      analyticsEnabled: data.analyticsEnabled,
      crashReportsEnabled: data.crashReportsEnabled,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * 从 ClientDTO 创建实例
   * 注意：忽略 UI 计算属性，只使用基础数据
   */
  static fromClientDTO(data: UserPreferencesClientDTO): UserPreferences {
    return UserPreferences.fromDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      language: data.language,
      timezone: data.timezone,
      locale: data.locale,
      themeMode: data.themeMode,
      notificationsEnabled: data.notificationsEnabled,
      emailNotifications: data.emailNotifications,
      pushNotifications: data.pushNotifications,
      autoLaunch: data.autoLaunch,
      defaultModule: data.defaultModule,
      analyticsEnabled: data.analyticsEnabled,
      crashReportsEnabled: data.crashReportsEnabled,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * 创建默认用户偏好（客户端版本）
   */
  static createDefault(accountUuid: string, uuid?: string): UserPreferences {
    const now = new Date();
    const preferencesUuid = uuid || UserPreferences.generateUUID();

    return new UserPreferences({
      uuid: preferencesUuid,
      accountUuid,
      language: this.detectBrowserLanguage(),
      timezone: this.detectBrowserTimezone(),
      locale: this.detectBrowserLanguage(),
      themeMode: this.detectSystemTheme(),
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: this.checkPushSupport(),
      autoLaunch: false,
      defaultModule: 'goal',
      analyticsEnabled: true,
      crashReportsEnabled: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  // ========== 客户端特定辅助方法 ==========

  /**
   * 格式化日期时间
   * @param date Date 对象
   * @returns 格式化后的字符串
   */
  private formatDateTime(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    try {
      return new Intl.DateTimeFormat(this._locale, options).format(date);
    } catch (error) {
      // 降级为 ISO 字符串
      return date.toISOString();
    }
  }

  /**
   * 检测浏览器语言
   */
  private static detectBrowserLanguage(): string {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language;
      // 映射到支持的语言
      if (browserLang.startsWith('zh')) return 'zh-CN';
      if (browserLang.startsWith('en')) return 'en-US';
      if (browserLang.startsWith('ja')) return 'ja-JP';
      if (browserLang.startsWith('ko')) return 'ko-KR';
    }
    return 'zh-CN'; // 默认简体中文
  }

  /**
   * 检测浏览器时区
   */
  private static detectBrowserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
    } catch (error) {
      return 'Asia/Shanghai';
    }
  }

  /**
   * 检测系统主题偏好
   */
  private static detectSystemTheme(): 'light' | 'dark' | 'system' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      // 检测系统是否支持主题偏好
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'system'; // 默认跟随系统
  }

  /**
   * 检查浏览器推送支持
   */
  private static checkPushSupport(): boolean {
    if (typeof window !== 'undefined') {
      return 'Notification' in window && 'serviceWorker' in navigator;
    }
    return false;
  }

  /**
   * 获取当前实际应用的主题（解析 system 模式）
   */
  public getEffectiveTheme(): 'light' | 'dark' {
    if (this._themeMode === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light'; // 默认浅色
    }
    return this._themeMode as 'light' | 'dark';
  }

  /**
   * 监听系统主题变化（仅在 themeMode 为 system 时有效）
   */
  public watchSystemThemeChange(callback: (theme: 'light' | 'dark') => void): () => void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return () => {}; // 空清理函数
    }

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (this._themeMode === 'system') {
        callback(e.matches ? 'dark' : 'light');
      }
    };

    // 兼容不同浏览器
    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener('change', handleChange);
      return () => darkModeQuery.removeEventListener('change', handleChange);
    } else {
      // 旧版浏览器
      darkModeQuery.addListener(handleChange as any);
      return () => darkModeQuery.removeListener(handleChange as any);
    }
  }

  /**
   * 检查通知权限
   */
  public async checkNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * 请求通知权限
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.setNotifications(true);
      }
      return permission;
    }

    return Notification.permission;
  }

  /**
   * 生成 UUID
   */
  static override generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // 降级方案
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ========== 客户端特定业务方法 ==========

  /**
   * 获取默认模块的显示文本
   */
  public getDefaultModuleText(): string {
    const moduleMap: Record<string, string> = {
      goal: '目标管理',
      task: '任务管理',
      editor: '编辑器',
      schedule: '日程安排',
    };
    return moduleMap[this._defaultModule] || this._defaultModule;
  }

  /**
   * 获取默认模块的图标
   */
  public getDefaultModuleIcon(): string {
    const iconMap: Record<string, string> = {
      goal: 'mdi-target',
      task: 'mdi-check-circle',
      editor: 'mdi-file-document-edit',
      schedule: 'mdi-calendar',
    };
    return iconMap[this._defaultModule] || 'mdi-apps';
  }

  /**
   * 预览主题模式（不保存，仅用于UI预览）
   */
  public previewThemeMode(mode: 'light' | 'dark' | 'system'): 'light' | 'dark' {
    if (mode === 'system') {
      return this.getEffectiveTheme();
    }
    return mode;
  }

  /**
   * 导出为本地存储格式
   */
  public toLocalStorage(): string {
    return JSON.stringify(this.toDTO());
  }

  /**
   * 从本地存储恢复
   */
  static fromLocalStorage(json: string): UserPreferences | null {
    try {
      const data = JSON.parse(json) as UserPreferencesDTO;
      return UserPreferences.fromDTO(data);
    } catch (error) {
      console.error('Failed to parse UserPreferences from localStorage:', error);
      return null;
    }
  }
}
