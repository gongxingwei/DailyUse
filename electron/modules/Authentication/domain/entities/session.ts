import { Entity } from "@common/shared/domain/entity";
import { ISession, ISessionDTO } from "@common/modules/authentication/types/authentication";
import { isValid } from "date-fns";

/**
 * 会话实体
 * 管理用户登录会话的生命周期
 */
export class Session extends Entity implements ISession {
  private _accountUuid: string;
  private _token: string;
  private _deviceInfo: string;
  private _ipAddress: string;
  private _userAgent?: string;
  private _createdAt: Date;
  private _lastActiveAt: Date;
  private _expiresAt: Date;
  private _isActive: boolean;
  private _terminatedAt?: Date;
  private _terminationReason?: string;

  constructor(params: {
    uuid?: string,
    accountUuid: string,
    token: string,
    deviceInfo: string,
    ipAddress: string,
    userAgent?: string,
    sessionDurationInMinutes?: number // 默认24小时
  }) {
    super(params.uuid || Session.generateId());
    this._accountUuid = params.accountUuid;
    this._token = params.token;
    this._deviceInfo = params.deviceInfo;
    this._ipAddress = params.ipAddress;
    this._userAgent = params.userAgent;
    this._createdAt = new Date();
    this._lastActiveAt = this._createdAt;
    const sessionDurationInMinutes = params.sessionDurationInMinutes ?? 60 * 24;
    this._expiresAt = new Date(this._createdAt.getTime() + sessionDurationInMinutes * 60 * 1000);
    this._isActive = true;
  }

  // Getters
  get uuid(): string {
    return this._uuid;
  }

  get accountUuid(): string {
    return this._accountUuid;
  }

  get token(): string {
    return this._token;
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

  get createdAt(): Date {
    return this._createdAt;
  }

  set createdAt(value: Date) {
    this._createdAt = value;
  }

  get lastActiveAt(): Date {
    return this._lastActiveAt;
  }

  set lastActiveAt(value: Date) {
    this._lastActiveAt = value;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  set expiresAt(value: Date) {
    this._expiresAt = value;
  }

  get isActive(): boolean {
    return this._isActive && !this.isExpired();
  }

  get terminatedAt(): Date | undefined {
    return this._terminatedAt;
  }

  set terminatedAt(value: Date | undefined) {
    this._terminatedAt = value;
  }

  get terminationReason(): string | undefined {
    return this._terminationReason;
  }

  set terminationReason(value: string | undefined) {
    this._terminationReason = value;
  }

  /**
   * 检查会话是否已过期
   */
  isExpired(): boolean {
    const now = new Date();
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

    this._lastActiveAt = new Date();
    this._expiresAt = new Date(this._lastActiveAt.getTime() + extendMinutes * 60 * 1000);
  }

  /**
   * 终止会话
   */
  terminate(reason: string = 'User logout'): void {
    this._isActive = false;
    this._terminatedAt = new Date();
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
    const now = new Date();
    const timeToExpiry = this._expiresAt.getTime() - now.getTime();
    const thresholdMilliseconds = thresholdMinutes * 60 * 1000;
    
    return timeToExpiry < thresholdMilliseconds && timeToExpiry > 0;
  }

  /**
   * 获取会话剩余时间（分钟）
   */
  getRemainingMinutes(): number {
    const now = new Date();
    const remainingMilliseconds = Math.max(0, this._expiresAt.getTime() - now.getTime());
    return Math.floor(remainingMilliseconds / (60 * 1000));
  }

  /**
   * 获取会话持续时间（分钟）
   */
  getDurationMinutes(): number {
    const endTime = this._terminatedAt || new Date();
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
      this._lastActiveAt = new Date();
      // 这里可以记录IP变化日志
    }
  }

  /**
   * 转换为DTO对象
   */
  toDTO(): ISessionDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      token: this._token,
      deviceInfo: this._deviceInfo,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
      createdAt: this._createdAt.getTime(),
      lastActiveAt: this._lastActiveAt.getTime(),
      expiresAt: this._expiresAt.getTime(),
      isActive: this._isActive,
      terminatedAt: this._terminatedAt?.getTime(),
      terminationReason: this._terminationReason
    };
  }

  static fromDTO(dto: ISessionDTO): Session {
    const session = new Session({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      token: dto.token,
      deviceInfo: dto.deviceInfo,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      sessionDurationInMinutes: 60 * 24 // 默认24小时
    });
    session.createdAt = isValid(dto.createdAt) ? new Date(dto.createdAt) : new Date();
    session.lastActiveAt = isValid(dto.lastActiveAt) ? new Date(dto.lastActiveAt) : new Date();
    session.expiresAt = isValid(dto.expiresAt) ? new Date(dto.expiresAt) : new Date();
    session.terminatedAt = dto.terminatedAt && isValid(dto.terminatedAt) ? new Date(dto.terminatedAt) : undefined;
    return session;
  }

}
