/**
 * UserPreferences Aggregate Root
 * 用户偏好设置聚合根
 *
 * @description 统一管理用户级别的通用偏好设置
 * 包括语言、时区、主题模式、通知等
 */

export interface IUserPreferences {
  uuid: string;
  accountUuid: string;

  // 基础偏好
  language: string; // 'zh-CN' | 'en-US'
  timezone: string; // 时区，如 'Asia/Shanghai'
  locale: string; // 地区设置

  // 主题偏好（引用 Theme 模块）
  themeMode: 'light' | 'dark' | 'system';

  // 通知偏好
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;

  // 应用偏好
  autoLaunch: boolean; // 开机自启动
  defaultModule: string; // 默认打开的模块，如 'goal' | 'task' | 'editor'

  // 隐私偏好
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;

  // 时间戳
  createdAt: number;
  updatedAt: number;
}

export class UserPreferences implements IUserPreferences {
  uuid: string;
  accountUuid: string;
  language: string;
  timezone: string;
  locale: string;
  themeMode: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  autoLaunch: boolean;
  defaultModule: string;
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;
  createdAt: number;
  updatedAt: number;

  constructor(props: IUserPreferences) {
    this.uuid = props.uuid;
    this.accountUuid = props.accountUuid;
    this.language = props.language;
    this.timezone = props.timezone;
    this.locale = props.locale;
    this.themeMode = props.themeMode;
    this.notificationsEnabled = props.notificationsEnabled;
    this.emailNotifications = props.emailNotifications;
    this.pushNotifications = props.pushNotifications;
    this.autoLaunch = props.autoLaunch;
    this.defaultModule = props.defaultModule;
    this.analyticsEnabled = props.analyticsEnabled;
    this.crashReportsEnabled = props.crashReportsEnabled;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  // ========== 基础偏好方法 ==========

  /**
   * 更改语言
   */
  changeLanguage(language: string): void {
    if (!this.isValidLanguage(language)) {
      throw new Error(`Invalid language: ${language}`);
    }
    this.language = language;
    this.updatedAt = Date.now();
  }

  /**
   * 更改时区
   */
  changeTimezone(timezone: string): void {
    this.timezone = timezone;
    this.updatedAt = Date.now();
  }

  // ========== 主题偏好方法 ==========

  /**
   * 切换主题模式
   */
  switchThemeMode(mode: 'light' | 'dark' | 'system'): void {
    this.themeMode = mode;
    this.updatedAt = Date.now();
  }

  // ========== 通知偏好方法 ==========

  /**
   * 启用/禁用通知
   */
  setNotifications(enabled: boolean): void {
    this.notificationsEnabled = enabled;
    if (!enabled) {
      // 禁用所有通知时，同时禁用子选项
      this.emailNotifications = false;
      this.pushNotifications = false;
    }
    this.updatedAt = Date.now();
  }

  /**
   * 设置邮件通知
   */
  setEmailNotifications(enabled: boolean): void {
    if (enabled && !this.notificationsEnabled) {
      throw new Error('Cannot enable email notifications when notifications are disabled');
    }
    this.emailNotifications = enabled;
    this.updatedAt = Date.now();
  }

  /**
   * 设置推送通知
   */
  setPushNotifications(enabled: boolean): void {
    if (enabled && !this.notificationsEnabled) {
      throw new Error('Cannot enable push notifications when notifications are disabled');
    }
    this.pushNotifications = enabled;
    this.updatedAt = Date.now();
  }

  // ========== 应用偏好方法 ==========

  /**
   * 设置开机自启动
   */
  setAutoLaunch(enabled: boolean): void {
    this.autoLaunch = enabled;
    this.updatedAt = Date.now();
  }

  /**
   * 设置默认模块
   */
  setDefaultModule(module: string): void {
    this.defaultModule = module;
    this.updatedAt = Date.now();
  }

  // ========== 隐私偏好方法 ==========

  /**
   * 设置分析数据收集
   */
  setAnalytics(enabled: boolean): void {
    this.analyticsEnabled = enabled;
    this.updatedAt = Date.now();
  }

  /**
   * 设置崩溃报告
   */
  setCrashReports(enabled: boolean): void {
    this.crashReportsEnabled = enabled;
    this.updatedAt = Date.now();
  }

  // ========== 辅助方法 ==========

  /**
   * 验证语言代码
   */
  private isValidLanguage(language: string): boolean {
    const validLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];
    return validLanguages.includes(language);
  }

  /**
   * 批量更新偏好
   */
  updatePreferences(updates: Partial<IUserPreferences>): void {
    if (updates.language !== undefined) this.changeLanguage(updates.language);
    if (updates.timezone !== undefined) this.changeTimezone(updates.timezone);
    if (updates.themeMode !== undefined) this.switchThemeMode(updates.themeMode);
    if (updates.notificationsEnabled !== undefined)
      this.setNotifications(updates.notificationsEnabled);
    if (updates.emailNotifications !== undefined)
      this.setEmailNotifications(updates.emailNotifications);
    if (updates.pushNotifications !== undefined)
      this.setPushNotifications(updates.pushNotifications);
    if (updates.autoLaunch !== undefined) this.setAutoLaunch(updates.autoLaunch);
    if (updates.defaultModule !== undefined) this.setDefaultModule(updates.defaultModule);
    if (updates.analyticsEnabled !== undefined) this.setAnalytics(updates.analyticsEnabled);
    if (updates.crashReportsEnabled !== undefined)
      this.setCrashReports(updates.crashReportsEnabled);
  }

  /**
   * 转换为纯对象
   */
  toObject(): IUserPreferences {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      language: this.language,
      timezone: this.timezone,
      locale: this.locale,
      themeMode: this.themeMode,
      notificationsEnabled: this.notificationsEnabled,
      emailNotifications: this.emailNotifications,
      pushNotifications: this.pushNotifications,
      autoLaunch: this.autoLaunch,
      defaultModule: this.defaultModule,
      analyticsEnabled: this.analyticsEnabled,
      crashReportsEnabled: this.crashReportsEnabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 创建默认偏好
   */
  static createDefault(accountUuid: string, uuid: string): UserPreferences {
    const now = Date.now();
    return new UserPreferences({
      uuid,
      accountUuid,
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      locale: 'zh-CN',
      themeMode: 'system',
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      autoLaunch: false,
      defaultModule: 'goal',
      analyticsEnabled: true,
      crashReportsEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
  }
}
