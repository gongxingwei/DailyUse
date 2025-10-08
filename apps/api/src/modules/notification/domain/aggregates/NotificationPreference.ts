import { NotificationType, NotificationChannel } from '@dailyuse/contracts';

/**
 * 渠道偏好设置
 */
export interface ChannelPreference {
  enabled: boolean;
  types?: NotificationType[];
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };
  settings?: {
    showPreview?: boolean;
    playSound?: boolean;
    soundFile?: string;
    vibrate?: boolean;
    displayDuration?: number;
  };
}

/**
 * NotificationPreference 聚合根
 *
 * 职责：
 * - 管理用户的通知偏好设置
 * - 控制哪些类型的通知可以发送
 * - 管理各渠道的具体设置
 * - 处理免打扰时段
 */
export class NotificationPreference {
  private _channelPreferences: Map<NotificationChannel, ChannelPreference> = new Map();

  private constructor(
    private _uuid: string,
    private _accountUuid: string,
    private _enabledTypes: NotificationType[],
    private _maxNotifications: number = 100,
    private _autoArchiveDays: number = 30,
    private _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this._uuid || this._uuid.trim().length === 0) {
      throw new Error('Preference uuid cannot be empty');
    }

    if (!this._accountUuid || this._accountUuid.trim().length === 0) {
      throw new Error('Preference accountUuid cannot be empty');
    }

    if (this._maxNotifications <= 0) {
      throw new Error('Max notifications must be greater than 0');
    }

    if (this._autoArchiveDays < 0) {
      throw new Error('Auto archive days cannot be negative');
    }

    // 验证免打扰时间格式
    this._channelPreferences.forEach((pref, channel) => {
      if (pref.quietHours?.enabled) {
        if (!this.isValidTimeFormat(pref.quietHours.startTime)) {
          throw new Error(`Invalid quiet hours start time for ${channel}`);
        }
        if (!this.isValidTimeFormat(pref.quietHours.endTime)) {
          throw new Error(`Invalid quiet hours end time for ${channel}`);
        }
      }
    });
  }

  private isValidTimeFormat(time: string): boolean {
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timePattern.test(time);
  }

  // ========== Getters ==========

  get uuid(): string {
    return this._uuid;
  }

  get accountUuid(): string {
    return this._accountUuid;
  }

  get enabledTypes(): NotificationType[] {
    return [...this._enabledTypes];
  }

  get maxNotifications(): number {
    return this._maxNotifications;
  }

  get autoArchiveDays(): number {
    return this._autoArchiveDays;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get channelPreferences(): Map<NotificationChannel, ChannelPreference> {
    return new Map(this._channelPreferences);
  }

  // ========== 静态工厂方法 ==========

  /**
   * 创建默认偏好设置
   */
  static createDefault(params: { uuid: string; accountUuid: string }): NotificationPreference {
    const preference = new NotificationPreference(
      params.uuid,
      params.accountUuid,
      Object.values(NotificationType), // 默认启用所有类型
      100,
      30,
    );

    // 设置默认渠道偏好
    preference._channelPreferences.set(NotificationChannel.IN_APP, {
      enabled: true,
      settings: {
        showPreview: true,
        displayDuration: 5000,
      },
    });

    preference._channelPreferences.set(NotificationChannel.SSE, {
      enabled: true,
    });

    return preference;
  }

  static create(params: {
    uuid: string;
    accountUuid: string;
    enabledTypes: NotificationType[];
    maxNotifications?: number;
    autoArchiveDays?: number;
  }): NotificationPreference {
    return new NotificationPreference(
      params.uuid,
      params.accountUuid,
      params.enabledTypes,
      params.maxNotifications ?? 100,
      params.autoArchiveDays ?? 30,
    );
  }

  static fromPersistence(data: {
    uuid: string;
    accountUuid: string;
    enabledTypes: NotificationType[];
    channelPreferences: Map<NotificationChannel, ChannelPreference>;
    maxNotifications: number;
    autoArchiveDays: number;
    createdAt: Date;
    updatedAt: Date;
  }): NotificationPreference {
    const preference = new NotificationPreference(
      data.uuid,
      data.accountUuid,
      data.enabledTypes,
      data.maxNotifications,
      data.autoArchiveDays,
      data.createdAt,
      data.updatedAt,
    );

    preference._channelPreferences = new Map(data.channelPreferences);

    return preference;
  }

  // ========== 业务方法 ==========

  /**
   * 检查是否应该发送指定类型的通知
   */
  shouldReceiveType(type: NotificationType): boolean {
    return this._enabledTypes.includes(type);
  }

  /**
   * 检查渠道是否启用
   */
  isChannelEnabled(channel: NotificationChannel): boolean {
    const pref = this._channelPreferences.get(channel);
    return pref?.enabled ?? false;
  }

  /**
   * 检查渠道是否允许指定类型
   */
  isTypeAllowedOnChannel(channel: NotificationChannel, type: NotificationType): boolean {
    const pref = this._channelPreferences.get(channel);
    if (!pref?.enabled) return false;

    // 如果没有指定类型限制，则允许所有启用的类型
    if (!pref.types || pref.types.length === 0) {
      return this.shouldReceiveType(type);
    }

    return pref.types.includes(type) && this.shouldReceiveType(type);
  }

  /**
   * 检查当前是否在免打扰时段
   */
  isInQuietHours(channel: NotificationChannel, now: Date = new Date()): boolean {
    const pref = this._channelPreferences.get(channel);
    if (!pref?.quietHours?.enabled) return false;

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const { startTime, endTime } = pref.quietHours;

    // 处理跨午夜的情况（如 22:00 - 08:00）
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * 获取应该使用的渠道列表
   */
  getAllowedChannels(type: NotificationType): NotificationChannel[] {
    const allowed: NotificationChannel[] = [];

    this._channelPreferences.forEach((pref, channel) => {
      if (this.isTypeAllowedOnChannel(channel, type) && !this.isInQuietHours(channel)) {
        allowed.push(channel);
      }
    });

    return allowed;
  }

  /**
   * 启用通知类型
   */
  enableType(type: NotificationType): void {
    if (!this._enabledTypes.includes(type)) {
      this._enabledTypes.push(type);
      this._updatedAt = new Date();
    }
  }

  /**
   * 禁用通知类型
   */
  disableType(type: NotificationType): void {
    const index = this._enabledTypes.indexOf(type);
    if (index > -1) {
      this._enabledTypes.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  /**
   * 设置渠道偏好
   */
  setChannelPreference(channel: NotificationChannel, preference: ChannelPreference): void {
    this._channelPreferences.set(channel, preference);
    this._updatedAt = new Date();
    this.validate();
  }

  /**
   * 启用渠道
   */
  enableChannel(channel: NotificationChannel): void {
    const pref = this._channelPreferences.get(channel) || { enabled: false };
    pref.enabled = true;
    this._channelPreferences.set(channel, pref);
    this._updatedAt = new Date();
  }

  /**
   * 禁用渠道
   */
  disableChannel(channel: NotificationChannel): void {
    const pref = this._channelPreferences.get(channel);
    if (pref) {
      pref.enabled = false;
      this._updatedAt = new Date();
    }
  }

  /**
   * 设置免打扰时段
   */
  setQuietHours(
    channel: NotificationChannel,
    startTime: string,
    endTime: string,
    enabled: boolean = true,
  ): void {
    if (!this.isValidTimeFormat(startTime) || !this.isValidTimeFormat(endTime)) {
      throw new Error('Invalid time format. Use HH:mm');
    }

    const pref = this._channelPreferences.get(channel) || { enabled: true };
    pref.quietHours = { enabled, startTime, endTime };
    this._channelPreferences.set(channel, pref);
    this._updatedAt = new Date();
  }

  /**
   * 更新设置
   */
  updateSettings(params: { maxNotifications?: number; autoArchiveDays?: number }): void {
    if (params.maxNotifications !== undefined) {
      this._maxNotifications = params.maxNotifications;
    }
    if (params.autoArchiveDays !== undefined) {
      this._autoArchiveDays = params.autoArchiveDays;
    }

    this._updatedAt = new Date();
    this.validate();
  }

  /**
   * 转换为普通对象
   */
  toPlainObject() {
    const channelPrefs: Record<string, ChannelPreference> = {};
    this._channelPreferences.forEach((pref, channel) => {
      channelPrefs[channel] = pref;
    });

    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      enabledTypes: this._enabledTypes,
      channelPreferences: channelPrefs,
      maxNotifications: this._maxNotifications,
      autoArchiveDays: this._autoArchiveDays,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
