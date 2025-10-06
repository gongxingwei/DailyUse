/**
 * UserPreferences Core Aggregate Root
 * @description 用户偏好核心聚合根抽象类
 * @author DailyUse Team
 * @date 2024
 */

import { AggregateRoot } from '@dailyuse/utils';
import { SettingContracts } from '@dailyuse/contracts';

// 类型导入
type IUserPreferences = SettingContracts.IUserPreferences;
type IUserPreferencesClient = SettingContracts.IUserPreferencesClient;
type UserPreferencesDTO = SettingContracts.UserPreferencesDTO;
type UserPreferencesClientDTO = SettingContracts.UserPreferencesClientDTO;
type UserPreferencesPersistenceDTO = SettingContracts.UserPreferencesPersistenceDTO;

/**
 * 验证结果接口
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 用户偏好核心抽象类 - 唯一的聚合根
 *
 * 职责：
 * - 定义用户偏好的核心属性和业务规则
 * - 提供平台无关的业务方法（语言切换、主题切换等）
 * - 子类实现特定环境的方法（服务端/客户端）
 */
export abstract class UserPreferencesCore extends AggregateRoot implements IUserPreferences {
  // ========== 基础属性 ==========
  protected _uuid: string;
  protected _accountUuid: string;

  // ========== 基础偏好 ==========
  protected _language: string;
  protected _timezone: string;
  protected _locale: string;

  // ========== 主题偏好 ==========
  protected _themeMode: 'light' | 'dark' | 'system';

  // ========== 通知偏好 ==========
  protected _notificationsEnabled: boolean;
  protected _emailNotifications: boolean;
  protected _pushNotifications: boolean;

  // ========== 应用偏好 ==========
  protected _autoLaunch: boolean;
  protected _defaultModule: string;

  // ========== 隐私偏好 ==========
  protected _analyticsEnabled: boolean;
  protected _crashReportsEnabled: boolean;

  // ========== 时间戳 ==========
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(data: IUserPreferences) {
    super(data.uuid);

    this._uuid = data.uuid;
    this._accountUuid = data.accountUuid;
    this._language = data.language;
    this._timezone = data.timezone;
    this._locale = data.locale;
    this._themeMode = data.themeMode;
    this._notificationsEnabled = data.notificationsEnabled;
    this._emailNotifications = data.emailNotifications;
    this._pushNotifications = data.pushNotifications;
    this._autoLaunch = data.autoLaunch;
    this._defaultModule = data.defaultModule;
    this._analyticsEnabled = data.analyticsEnabled;
    this._crashReportsEnabled = data.crashReportsEnabled;
    this._createdAt = new Date(data.createdAt);
    this._updatedAt = new Date(data.updatedAt);
  }

  // ========== Getter 方法 ==========
  get uuid(): string {
    return this._uuid;
  }
  get accountUuid(): string {
    return this._accountUuid;
  }
  get language(): string {
    return this._language;
  }
  get timezone(): string {
    return this._timezone;
  }
  get locale(): string {
    return this._locale;
  }
  get themeMode(): 'light' | 'dark' | 'system' {
    return this._themeMode;
  }
  get notificationsEnabled(): boolean {
    return this._notificationsEnabled;
  }
  get emailNotifications(): boolean {
    return this._emailNotifications;
  }
  get pushNotifications(): boolean {
    return this._pushNotifications;
  }
  get autoLaunch(): boolean {
    return this._autoLaunch;
  }
  get defaultModule(): string {
    return this._defaultModule;
  }
  get analyticsEnabled(): boolean {
    return this._analyticsEnabled;
  }
  get crashReportsEnabled(): boolean {
    return this._crashReportsEnabled;
  }
  get createdAt(): string {
    return this._createdAt.toISOString();
  }
  get updatedAt(): string {
    return this._updatedAt.toISOString();
  }

  // ========== 抽象方法 - 由子类实现 ==========

  /**
   * 转换为 DTO（标准格式）
   */
  abstract toDTO(): UserPreferencesDTO;

  /**
   * 转换为 ClientDTO（包含 UI 属性）
   */
  abstract toClientDTO(): UserPreferencesClientDTO;

  /**
   * 转换为持久化格式
   */
  abstract toPersistence(): UserPreferencesPersistenceDTO;

  // ========== 核心业务方法 ==========

  /**
   * 更改语言
   * @param language 语言代码 ('zh-CN', 'en-US', 'ja-JP', 'ko-KR')
   */
  public changeLanguage(language: string): void {
    const validation = this.validateLanguage(language);
    if (!validation.isValid) {
      throw new Error(`语言设置无效: ${validation.errors.join(', ')}`);
    }

    this._language = language;
    this.touch();
  }

  /**
   * 切换主题模式
   * @param mode 主题模式 ('light', 'dark', 'system')
   */
  public switchThemeMode(mode: 'light' | 'dark' | 'system'): void {
    const validation = this.validateThemeMode(mode);
    if (!validation.isValid) {
      throw new Error(`主题模式无效: ${validation.errors.join(', ')}`);
    }

    this._themeMode = mode;
    this.touch();
  }

  /**
   * 更改时区
   * @param timezone 时区标识符 (IANA timezone)
   */
  public changeTimezone(timezone: string): void {
    const validation = this.validateTimezone(timezone);
    if (!validation.isValid) {
      throw new Error(`时区设置无效: ${validation.errors.join(', ')}`);
    }

    this._timezone = timezone;
    this.touch();
  }

  /**
   * 设置通知开关
   * @param enabled 是否启用通知
   * @param includeSubOptions 是否同时设置子选项（邮件、推送）
   */
  public setNotifications(enabled: boolean, includeSubOptions: boolean = false): void {
    this._notificationsEnabled = enabled;

    // 如果关闭总开关，强制关闭子选项
    if (!enabled) {
      this._emailNotifications = false;
      this._pushNotifications = false;
    }
    // 如果开启总开关且需要同时设置子选项
    else if (includeSubOptions) {
      this._emailNotifications = true;
      this._pushNotifications = true;
    }

    this.touch();
  }

  /**
   * 设置邮件通知
   * @param enabled 是否启用邮件通知
   */
  public setEmailNotifications(enabled: boolean): void {
    // 如果总开关关闭，不允许开启邮件通知
    if (enabled && !this._notificationsEnabled) {
      throw new Error('请先启用通知总开关');
    }

    this._emailNotifications = enabled;
    this.touch();
  }

  /**
   * 设置推送通知
   * @param enabled 是否启用推送通知
   */
  public setPushNotifications(enabled: boolean): void {
    // 如果总开关关闭，不允许开启推送通知
    if (enabled && !this._notificationsEnabled) {
      throw new Error('请先启用通知总开关');
    }

    this._pushNotifications = enabled;
    this.touch();
  }

  /**
   * 设置自动启动
   * @param enabled 是否开机自启动
   */
  public setAutoLaunch(enabled: boolean): void {
    this._autoLaunch = enabled;
    this.touch();
  }

  /**
   * 设置默认模块
   * @param module 默认打开的模块 ('goal', 'task', 'editor', 'schedule')
   */
  public setDefaultModule(module: string): void {
    const validation = this.validateDefaultModule(module);
    if (!validation.isValid) {
      throw new Error(`默认模块设置无效: ${validation.errors.join(', ')}`);
    }

    this._defaultModule = module;
    this.touch();
  }

  /**
   * 设置数据分析
   * @param enabled 是否启用数据分析
   */
  public setAnalytics(enabled: boolean): void {
    this._analyticsEnabled = enabled;
    this.touch();
  }

  /**
   * 设置崩溃报告
   * @param enabled 是否启用崩溃报告
   */
  public setCrashReports(enabled: boolean): void {
    this._crashReportsEnabled = enabled;
    this.touch();
  }

  /**
   * 批量更新偏好设置
   * @param updates 要更新的字段
   */
  public updatePreferences(updates: {
    language?: string;
    timezone?: string;
    locale?: string;
    themeMode?: 'light' | 'dark' | 'system';
    notificationsEnabled?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    autoLaunch?: boolean;
    defaultModule?: string;
    analyticsEnabled?: boolean;
    crashReportsEnabled?: boolean;
  }): void {
    // 验证所有字段
    if (updates.language !== undefined) {
      const validation = this.validateLanguage(updates.language);
      if (!validation.isValid) {
        throw new Error(`语言设置无效: ${validation.errors.join(', ')}`);
      }
    }

    if (updates.themeMode !== undefined) {
      const validation = this.validateThemeMode(updates.themeMode);
      if (!validation.isValid) {
        throw new Error(`主题模式无效: ${validation.errors.join(', ')}`);
      }
    }

    if (updates.timezone !== undefined) {
      const validation = this.validateTimezone(updates.timezone);
      if (!validation.isValid) {
        throw new Error(`时区设置无效: ${validation.errors.join(', ')}`);
      }
    }

    if (updates.defaultModule !== undefined) {
      const validation = this.validateDefaultModule(updates.defaultModule);
      if (!validation.isValid) {
        throw new Error(`默认模块设置无效: ${validation.errors.join(', ')}`);
      }
    }

    // 应用更新
    if (updates.language !== undefined) this._language = updates.language;
    if (updates.timezone !== undefined) this._timezone = updates.timezone;
    if (updates.locale !== undefined) this._locale = updates.locale;
    if (updates.themeMode !== undefined) this._themeMode = updates.themeMode;
    if (updates.notificationsEnabled !== undefined) {
      this._notificationsEnabled = updates.notificationsEnabled;
      // 如果关闭总开关，强制关闭子选项
      if (!updates.notificationsEnabled) {
        this._emailNotifications = false;
        this._pushNotifications = false;
      }
    }
    if (updates.emailNotifications !== undefined) {
      if (updates.emailNotifications && !this._notificationsEnabled) {
        throw new Error('请先启用通知总开关');
      }
      this._emailNotifications = updates.emailNotifications;
    }
    if (updates.pushNotifications !== undefined) {
      if (updates.pushNotifications && !this._notificationsEnabled) {
        throw new Error('请先启用通知总开关');
      }
      this._pushNotifications = updates.pushNotifications;
    }
    if (updates.autoLaunch !== undefined) this._autoLaunch = updates.autoLaunch;
    if (updates.defaultModule !== undefined) this._defaultModule = updates.defaultModule;
    if (updates.analyticsEnabled !== undefined) this._analyticsEnabled = updates.analyticsEnabled;
    if (updates.crashReportsEnabled !== undefined)
      this._crashReportsEnabled = updates.crashReportsEnabled;

    this.touch();
  }

  // ========== 验证方法 ==========

  /**
   * 验证语言代码
   */
  protected validateLanguage(language: string): ValidationResult {
    const supportedLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];
    const errors: string[] = [];

    if (!language || language.trim() === '') {
      errors.push('语言代码不能为空');
    } else if (!supportedLanguages.includes(language)) {
      errors.push(`不支持的语言代码: ${language}。支持的语言: ${supportedLanguages.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证主题模式
   */
  protected validateThemeMode(mode: string): ValidationResult {
    const validModes = ['light', 'dark', 'system'];
    const errors: string[] = [];

    if (!mode || mode.trim() === '') {
      errors.push('主题模式不能为空');
    } else if (!validModes.includes(mode)) {
      errors.push(`无效的主题模式: ${mode}。有效值: ${validModes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证时区
   */
  protected validateTimezone(timezone: string): ValidationResult {
    const errors: string[] = [];

    if (!timezone || timezone.trim() === '') {
      errors.push('时区不能为空');
    }
    // 基础格式验证（IANA timezone 格式）
    else if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(timezone)) {
      errors.push('时区格式无效，应为 Area/Location 格式（如 Asia/Shanghai）');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证默认模块
   */
  protected validateDefaultModule(module: string): ValidationResult {
    const validModules = ['goal', 'task', 'editor', 'schedule'];
    const errors: string[] = [];

    if (!module || module.trim() === '') {
      errors.push('默认模块不能为空');
    } else if (!validModules.includes(module)) {
      errors.push(`无效的模块: ${module}。有效值: ${validModules.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ========== 辅助方法 ==========

  /**
   * 更新时间戳
   */
  protected touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * 转换为JSON（用于序列化）
   */
  public toJSON(): UserPreferencesDTO {
    return this.toDTO();
  }
}
