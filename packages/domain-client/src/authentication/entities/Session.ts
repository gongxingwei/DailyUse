import { SessionCore } from '@dailyuse/domain-core';
import { type ISessionClient } from '../types';

/**
 * 客户端会话实体 - 包含UI相关的会话管理
 */
export class Session extends SessionCore implements ISessionClient {
  // ===== ISessionClient 方法 =====
  saveToLocalStorage(): void {
    const sessionData = {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      token: this.token,
      deviceInfo: this.deviceInfo,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      createdAt: this.createdAt.toISOString(),
      lastActiveAt: this.lastActiveAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      isActive: this.isActive,
      terminatedAt: this.terminatedAt?.toISOString(),
      terminationReason: this.terminationReason,
    };

    localStorage.setItem(`session_${this.uuid}`, JSON.stringify(sessionData));
  }

  loadFromLocalStorage(): ISessionClient | null {
    try {
      const sessionData = localStorage.getItem(`session_${this.uuid}`);
      if (!sessionData) return null;

      const data = JSON.parse(sessionData);
      return Session.fromPersistence({
        uuid: data.uuid,
        accountUuid: data.accountUuid,
        token: data.token,
        deviceInfo: data.deviceInfo,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        createdAt: new Date(data.createdAt),
        lastActiveAt: new Date(data.lastActiveAt),
        expiresAt: new Date(data.expiresAt),
        isActive: data.isActive,
        terminatedAt: data.terminatedAt ? new Date(data.terminatedAt) : undefined,
        terminationReason: data.terminationReason,
      });
    } catch (error) {
      console.error('Failed to load session from localStorage:', error);
      return null;
    }
  }

  displayExpiryWarning(): void {
    const remainingMinutes = this.getRemainingMinutes();
    if (remainingMinutes <= 5 && remainingMinutes > 0) {
      // 显示会话即将过期的警告
      console.log(`Session will expire in ${remainingMinutes} minutes`);
      // 这里可以触发 UI 组件显示警告
    }
  }

  async autoRefresh(): Promise<boolean> {
    if (this.isNearExpiry(10)) {
      try {
        // 客户端自动刷新会话逻辑
        this.refresh(60); // 延长60分钟
        this.saveToLocalStorage();
        return true;
      } catch (error) {
        console.error('Failed to auto refresh session:', error);
        return false;
      }
    }
    return false;
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 静态工厂方法 =====
  static fromPersistence(params: {
    uuid: string;
    accountUuid: string;
    token: string;
    deviceInfo: string;
    ipAddress: string;
    userAgent?: string;
    createdAt: Date;
    lastActiveAt: Date;
    expiresAt: Date;
    isActive: boolean;
    terminatedAt?: Date;
    terminationReason?: string;
  }): Session {
    // 使用 SessionCore 的构造函数创建基本会话
    const session = new Session({
      uuid: params.uuid,
      accountUuid: params.accountUuid,
      token: params.token,
      deviceInfo: params.deviceInfo,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    // 手动设置时间相关的私有属性
    (session as any)._createdAt = params.createdAt;
    (session as any)._lastActiveAt = params.lastActiveAt;
    (session as any)._expiresAt = params.expiresAt;
    (session as any)._isActive = params.isActive;
    (session as any)._terminatedAt = params.terminatedAt;
    (session as any)._terminationReason = params.terminationReason;

    return session;
  }
}
