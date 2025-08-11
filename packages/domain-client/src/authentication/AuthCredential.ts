import { AuthCredentialCore } from '@dailyuse/domain-core';

/**
 * 客户端认证凭据 - 专注于UI展示和客户端逻辑
 * 不包含敏感的密码验证等服务端逻辑
 */
export class AuthCredential extends AuthCredentialCore {
  // ===== UI 专用方法 =====
  getDisplayStatus(): 'active' | 'locked' | 'warning' {
    if (this.isLocked) return 'locked';
    if (this.failedAttempts >= 3) return 'warning';
    return 'active';
  }

  getStatusMessage(): string {
    if (this.isLocked) {
      const minutes = Math.ceil(this.lockTimeRemaining / 1000 / 60);
      return `Account locked. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
    }

    if (this.failedAttempts >= 3) {
      const remaining = 5 - this.failedAttempts;
      return `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account locks.`;
    }

    return 'Account active';
  }

  getStatusColor(): 'success' | 'warning' | 'error' {
    const status = this.getDisplayStatus();
    switch (status) {
      case 'active':
        return 'success';
      case 'warning':
        return 'warning';
      case 'locked':
        return 'error';
    }
  }

  // ===== 表单验证帮助方法 =====
  canShowLoginForm(): boolean {
    return this.canAttemptLogin;
  }

  shouldShowCaptcha(): boolean {
    return this.failedAttempts >= 3;
  }

  getFormValidationRules(): {
    minPasswordLength: number;
    requiresUppercase: boolean;
    requiresLowercase: boolean;
    requiresNumbers: boolean;
    requiresSpecialChars: boolean;
  } {
    return {
      minPasswordLength: 8,
      requiresUppercase: true,
      requiresLowercase: true,
      requiresNumbers: true,
      requiresSpecialChars: true,
    };
  }

  // ===== 进度和状态指示器 =====
  getSecurityLevel(): 'low' | 'medium' | 'high' {
    // 基于失败次数和其他因素计算安全级别
    if (this.failedAttempts === 0) return 'high';
    if (this.failedAttempts <= 2) return 'medium';
    return 'low';
  }

  getLockProgress(): number {
    // 返回 0-100，表示距离锁定的进度
    return Math.min(100, (this.failedAttempts / 5) * 100);
  }

  // ===== 时间格式化 =====
  getFormattedCreatedAt(): string {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(this.createdAt);
  }

  getFormattedLockTime(): string | null {
    if (!this.lockedUntil) return null;

    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(this.lockedUntil);
  }

  // ===== 响应式状态 =====
  getReactiveState() {
    return {
      isLocked: this.isLocked,
      canAttemptLogin: this.canAttemptLogin,
      displayStatus: this.getDisplayStatus(),
      statusMessage: this.getStatusMessage(),
      statusColor: this.getStatusColor(),
      lockProgress: this.getLockProgress(),
      securityLevel: this.getSecurityLevel(),
      shouldShowCaptcha: this.shouldShowCaptcha(),
      formattedCreatedAt: this.getFormattedCreatedAt(),
      formattedLockTime: this.getFormattedLockTime(),
    };
  }

  // ===== 客户端专用工厂方法 =====
  static fromDTO(dto: {
    uuid: string;
    accountUuid: string;
    failedAttempts: number;
    lockedUntil?: string;
    createdAt: string;
    updatedAt: string;
  }): AuthCredential {
    return new AuthCredential({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      failedAttempts: dto.failedAttempts,
      lockedUntil: dto.lockedUntil ? new Date(dto.lockedUntil) : undefined,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ===== 客户端缓存方法 =====
  getCacheKey(): string {
    return `auth_credential_${this.accountUuid}`;
  }

  shouldRefresh(): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.updatedAt < fiveMinutesAgo;
  }
}
