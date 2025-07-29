import { DateTime } from "../../../../shared/types/myDateTime";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";

/**
 * 会话实体
 * 管理用户登录会话的生命周期
 */
export class Session {
  private _uuid: string;
  private _accountUuUuid: string;
  private _deviceInfo: string;
  private _ipAddress: string;
  private _userAgent?: string;
  private _createdAt: DateTime;
  private _lastActiveAt: DateTime;
  private _expiresAt: DateTime;
  private _isActive: boolean;
  private _terminatedAt?: DateTime;
  private _terminationReason?: string;

  constructor(
    uuid: string,
    accountUuid: string,
    deviceInfo: string,
    ipAddress: string,
    userAgent?: string,
    sessionDurationInMinutes: number = 60 * 24 // 默认24小时
  ) {
    this._uuid = uuid;
    this._accountUuUuid = accountUuid;
    this._deviceInfo = deviceInfo;
    this._ipAddress = ipAddress;
    this._userAgent = userAgent;
    this._createdAt = TimeUtils.now();
    this._lastActiveAt = this._createdAt;
    this._expiresAt = TimeUtils.add(this._createdAt, sessionDurationInMinutes, 'minutes');
    this._isActive = true;
  }

  // Getters
  get uuid(): string {
    return this._uuid;
  }

  get accountUuid(): string {
    return this._accountUuUuid;
  }

  get deviceInfo(): string {
    return this._deviceInfo;
  }

  get ipAddress(): string {
    return this._ipAddress;
  }

  get userAgent(): string | undefined {
    return this._userAgent;
  }

  get createdAt(): DateTime {
    return this._createdAt;
  }

  get lastActiveAt(): DateTime {
    return this._lastActiveAt;
  }

  get expiresAt(): DateTime {
    return this._expiresAt;
  }

  get isActive(): boolean {
    return this._isActive && !this.isExpired();
  }

  get terminatedAt(): DateTime | undefined {
    return this._terminatedAt;
  }

  get terminationReason(): string | undefined {
    return this._terminationReason;
  }

  /**
   * 检查会话是否已过期
   */
  isExpired(): boolean {
    const now = TimeUtils.now();
    return now.getTime() > this._expiresAt.getTime();
  }

  /**
   * 刷新会话活跃时间
   */
  refresh(extendMinutes: number = 60): void {
    if (!this._isActive) {
      throw new Error('Cannot refresh inactive session');
    }

    if (this.isExpired()) {
      throw new Error('Cannot refresh expired session');
    }

    this._lastActiveAt = TimeUtils.now();
    this._expiresAt = TimeUtils.add(this._lastActiveAt, extendMinutes, 'minutes');
  }

  /**
   * 终止会话
   */
  terminate(reason: string = 'User logout'): void {
    this._isActive = false;
    this._terminatedAt = TimeUtils.now();
    this._terminationReason = reason;
  }

  /**
   * 强制终止会话（由于安全原因）
   */
  forceTerminate(reason: string): void {
    this.terminate(`FORCED: ${reason}`);
  }

  /**
   * 检查会话是否即将过期
   */
  isNearExpiry(thresholdMinutes: number = 10): boolean {
    const now = TimeUtils.now();
    const timeToExpiry = this._expiresAt.getTime() - now.getTime();
    const thresholdMilliseconds = thresholdMinutes * 60 * 1000;
    
    return timeToExpiry < thresholdMilliseconds && timeToExpiry > 0;
  }

  /**
   * 获取会话剩余时间（分钟）
   */
  getRemainingMinutes(): number {
    const now = TimeUtils.now();
    const remainingMilliseconds = Math.max(0, this._expiresAt.getTime() - now.getTime());
    return Math.floor(remainingMilliseconds / (60 * 1000));
  }

  /**
   * 获取会话持续时间（分钟）
   */
  getDurationMinutes(): number {
    const endTime = this._terminatedAt || TimeUtils.now();
    const durationMilliseconds = endTime.getTime() - this._createdAt.getTime();
    return Math.floor(durationMilliseconds / (60 * 1000));
  }

  /**
   * 检查IP地址是否发生变化（安全检查）
   */
  checkIPChange(currentIP: string): boolean {
    return this._ipAddress !== currentIP;
  }

  /**
   * 更新会话的IP地址（用于处理动态IP）
   */
  updateIPAddress(newIP: string, _reason: string = 'IP address changed'): void {
    if (this._ipAddress !== newIP) {
      this._ipAddress = newIP;
      this._lastActiveAt = TimeUtils.now();
      // 这里可以记录IP变化日志
    }
  }

  /**
   * 转换为DTO对象
   */
  toDTO(): {
    uuid: string;
    accountUuid: string;
    deviceInfo: string;
    ipAddress: string;
    userAgent?: string;
    createdAt: string;
    lastActiveAt: string;
    expiresAt: string;
    isActive: boolean;
    terminatedAt?: string;
    terminationReason?: string;
  } {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuUuid,
      deviceInfo: this._deviceInfo,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
      createdAt: this._createdAt.toISOString(),
      lastActiveAt: this._lastActiveAt.toISOString(),
      expiresAt: this._expiresAt.toISOString(),
      isActive: this._isActive,
      terminatedAt: this._terminatedAt?.toISOString(),
      terminationReason: this._terminationReason
    };
  }

  /**
   * 从数据库数据创建会话实例
   */
  static fromDatabase(data: {
    uuid: string;
    account_uuid: string;
    device_info: string;
    ip_address: string;
    user_agent?: string;
    created_at: number;
    last_active_at: number;
    expires_at: number;
    is_active: boolean;
  }): Session {
    const session = Object.create(Session.prototype);
    session._uuid = data.uuid;
    session._accountUuUuid = data.account_uuid;
    session._deviceInfo = data.device_info;
    session._ipAddress = data.ip_address;
    session._userAgent = data.user_agent;
    session._createdAt = new Date(data.created_at);
    session._lastActiveAt = new Date(data.last_active_at);
    session._expiresAt = new Date(data.expires_at);
    session._isActive = data.is_active;
    
    return session;
  }

  /**
   * 转换为数据库格式
   */
  toDatabaseFormat(): {
    uuid: string;
    account_uuid: string;
    device_info: string;
    ip_address: string;
    user_agent?: string;
    created_at: number;
    last_active_at: number;
    expires_at: number;
    is_active: boolean;
  } {
    return {
      uuid: this._uuid,
      account_uuid: this._accountUuUuid,
      device_info: this._deviceInfo,
      ip_address: this._ipAddress,
      user_agent: this._userAgent,
      created_at: this._createdAt.getTime(),
      last_active_at: this._lastActiveAt.getTime(),
      expires_at: this._expiresAt.getTime(),
      is_active: this._isActive
    };
  }
}
