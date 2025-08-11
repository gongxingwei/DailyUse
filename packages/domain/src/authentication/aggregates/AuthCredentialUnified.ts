import { AggregateRoot } from '@dailyuse/utils';
import { Password } from '../valueObjects/Password';

/**
 * AuthCredential 聚合根
 * 前后端共享的认证凭据对象
 */
export class AuthCredential extends AggregateRoot {
  private _accountUuid: string;
  private _password: Password;
  private _failedAttempts: number;
  private _lockedUntil?: Date;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    password: Password;
    failedAttempts?: number;
    lockedUntil?: Date;
  }) {
    super(params.uuid);
    this._accountUuid = params.accountUuid;
    this._password = params.password;
    this._failedAttempts = params.failedAttempts || 0;
    this._lockedUntil = params.lockedUntil;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // ===== 共享属性和计算方法 =====
  get accountUuid(): string {
    return this._accountUuid;
  }
  get failedAttempts(): number {
    return this._failedAttempts;
  }
  get lockedUntil(): Date | undefined {
    return this._lockedUntil;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isLocked(): boolean {
    return this._lockedUntil !== undefined && this._lockedUntil > new Date();
  }

  get lockTimeRemaining(): number {
    if (!this._lockedUntil) return 0;
    return Math.max(0, this._lockedUntil.getTime() - Date.now());
  }

  // ===== 后端专用业务方法 =====
  verifyPassword(plainPassword: string): { success: boolean; shouldLock: boolean } {
    if (typeof window !== 'undefined') {
      throw new Error('verifyPassword is server-side only');
    }

    if (this.isLocked) {
      throw new Error('Account is locked');
    }

    const isValid = this._password.verify(plainPassword);

    if (!isValid) {
      this._failedAttempts++;
      if (this._failedAttempts >= 5) {
        this._lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30分钟
        return { success: false, shouldLock: true };
      }
    } else {
      this._failedAttempts = 0;
      this._lockedUntil = undefined;
    }

    this._updatedAt = new Date();
    return { success: isValid, shouldLock: false };
  }

  changePassword(oldPassword: string, newPassword: string): void {
    if (typeof window !== 'undefined') {
      throw new Error('changePassword is server-side only');
    }

    if (!this._password.verify(oldPassword)) {
      throw new Error('Invalid current password');
    }

    this._password = new Password(newPassword);
    this._updatedAt = new Date();
  }

  // ===== 前端专用计算方法 =====
  getDisplayStatus(): 'active' | 'locked' | 'expired' {
    if (typeof window === 'undefined') {
      // 服务端也可以用，但主要为前端设计
      console.warn('getDisplayStatus is primarily for client-side use');
    }

    if (this.isLocked) return 'locked';
    return 'active';
  }

  getLockStatusText(): string {
    if (typeof window === 'undefined') {
      return 'Unknown';
    }

    if (!this.isLocked) return 'Active';

    const remaining = Math.ceil(this.lockTimeRemaining / 1000 / 60);
    return `Locked for ${remaining} minutes`;
  }

  canAttemptLogin(): boolean {
    return !this.isLocked && this._failedAttempts < 5;
  }
}
