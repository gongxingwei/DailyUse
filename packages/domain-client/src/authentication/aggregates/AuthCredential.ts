import {
  AuthCredentialCore,
  TokenType,
  type ISessionCore,
  type IMFADeviceCore,
  type ITokenCore,
} from '@dailyuse/domain-core';
import { type IAuthCredentialClient } from '../types';
import { Password } from '../valueObjects/Password';
import { Token } from '../valueObjects/Token';
import { Session } from '../entities/Session';
import { MFADevice } from '../entities/MFADevice';

/**
 * 客户端认证凭据 - 包含UI相关的认证管理
 */
export class AuthCredential extends AuthCredentialCore implements IAuthCredentialClient {
  constructor(params: {
    uuid?: string;
    accountUuid: string;
    password: Password;
    sessions?: Map<string, Session>;
    mfaDevices?: Map<string, MFADevice>;
    tokens?: Map<string, Token>;
    failedAttempts?: number;
    lockedUntil?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    lastAuthAt?: Date;
  }) {
    // 将具体类型转换为接口类型传递给父构造函数
    const coreParams = {
      ...params,
      password: params.password,
      sessions: params.sessions || new Map(),
      mfaDevices: params.mfaDevices || new Map(),
      tokens: params.tokens || new Map(),
    };
    super(coreParams);
  }

  // ===== 实现抽象方法 =====
  authenticate(password: string): boolean {
    if (this.isLocked) {
      this.showAccountLockWarning();
      return false;
    }

    const isValid = (this.password as Password).verify(password);

    if (isValid) {
      this.resetFailedAttempts();
      this._lastAuthAt = new Date();
      this._updatedAt = new Date();
      this.cacheUserPreferences();
      return true;
    } else {
      this.incrementFailedAttempts();
      return false;
    }
  }

  changePassword(oldPassword: string, newPassword: string): void {
    const isOldValid = (this.password as Password).verify(oldPassword);
    if (!isOldValid) {
      throw new Error('Current password is incorrect');
    }

    // 显示密码强度指示器
    const tempPassword = Password.createFromParams({
      hashedValue: '',
      salt: '',
      algorithm: 'client',
    });
    tempPassword.showStrengthIndicator();

    // 创建新密码替换旧密码
    const newPasswordObj = new Password(newPassword);
    (this as any)._password = newPasswordObj;
    this._updatedAt = new Date();

    // 密码更改后终止所有会话
    this.terminateAllSessions();
  }

  createSession(deviceInfo: string, ipAddress: string): ISessionCore {
    const session = new Session({
      accountUuid: this.accountUuid,
      token: Token.generateClientValue(),
      deviceInfo,
      ipAddress,
    });

    this.sessions.set(session.uuid, session as any);
    session.saveToLocalStorage();
    this._updatedAt = new Date();

    return session;
  }

  terminateSession(sessionUuid: string): void {
    const session = this.sessions.get(sessionUuid) as Session | undefined;
    if (session) {
      session.terminate();
      // 清理本地存储
      localStorage.removeItem(`session_${sessionUuid}`);
      this._updatedAt = new Date();
    }
  }

  terminateAllSessions(): void {
    for (const [uuid, session] of this.sessions.entries()) {
      (session as Session).terminate();
      localStorage.removeItem(`session_${uuid}`);
    }
    this._updatedAt = new Date();
  }

  addMFADevice(device: IMFADeviceCore): void {
    this.mfaDevices.set(device.uuid, device);
    this._updatedAt = new Date();
  }

  removeMFADevice(deviceUuid: string): void {
    const device = this.mfaDevices.get(deviceUuid) as MFADevice | undefined;
    if (device) {
      device.clearLocalCache();
      this.mfaDevices.delete(deviceUuid);
      this._updatedAt = new Date();
    }
  }

  createToken(type: TokenType): ITokenCore {
    let token: Token;

    switch (type) {
      case TokenType.ACCESS_TOKEN:
        token = Token.createClientAccessToken(this.accountUuid);
        break;
      case TokenType.REFRESH_TOKEN:
        token = new Token({
          value: Token.generateClientValue(),
          type: TokenType.REFRESH_TOKEN,
          accountUuid: this.accountUuid,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
        });
        break;
      case TokenType.REMEMBER_ME:
        token = Token.createClientRememberMe(this.accountUuid);
        break;
      default:
        throw new Error(`Unsupported token type: ${type}`);
    }

    this.tokens.set(token.value, token as any);
    token.saveToSecureStorage();
    this._updatedAt = new Date();
    return token;
  }

  createRememberToken(deviceInfo?: string): Token {
    // 如果指定了设备信息，先撤销该设备现有的记住我令牌
    if (deviceInfo) {
      this.revokeRememberTokenForDevice(deviceInfo);
    }

    const token = Token.createClientRememberMe(this.accountUuid, deviceInfo);
    this.tokens.set(token.value, token as any);
    token.saveToSecureStorage();
    this._updatedAt = new Date();

    // 更新用户偏好，支持多设备
    const prefs = this.loadUserPreferences() || {};
    if (!prefs.rememberTokens) {
      prefs.rememberTokens = {};
    }

    const deviceKey = deviceInfo || 'default';
    prefs.rememberTokens[deviceKey] = {
      value: token.value,
      createdAt: new Date().toISOString(),
      deviceInfo,
    };

    localStorage.setItem(`user_prefs_${this.accountUuid}`, JSON.stringify(prefs));

    return token;
  }

  private revokeRememberTokenForDevice(deviceInfo: string): void {
    for (const token of this._tokens.values()) {
      if (
        token.type === TokenType.REMEMBER_ME &&
        token.isValid() &&
        token.deviceInfo === deviceInfo
      ) {
        (token as Token).revoke();
        (token as Token).removeFromSecureStorage();
      }
    }

    // 同时清理用户偏好中的记录
    const prefs = this.loadUserPreferences() || {};
    if (prefs.rememberTokens) {
      const deviceKey = deviceInfo || 'default';
      delete prefs.rememberTokens[deviceKey];
      localStorage.setItem(`user_prefs_${this.accountUuid}`, JSON.stringify(prefs));
    }
  }

  revokeToken(tokenValue: string): void {
    const token = this.tokens.get(tokenValue) as Token | undefined;
    if (token) {
      token.revoke();
      token.removeFromSecureStorage();
      this._updatedAt = new Date();
    }
  }

  // ===== IAuthCredentialClient 方法 =====
  async showLoginForm(): Promise<boolean> {
    // 显示登录表单的客户端逻辑
    return new Promise((resolve) => {
      console.log('Showing login form for account:', this.accountUuid);
      // 这里可以触发UI组件显示登录表单
      // 模拟用户输入和验证
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  }

  async displayMFAPrompt(): Promise<string> {
    // 显示MFA验证提示
    return new Promise((resolve) => {
      console.log('Displaying MFA prompt');
      // 这里可以显示MFA设备选择和验证UI
      // 模拟用户输入验证码
      setTimeout(() => {
        resolve('123456');
      }, 1000);
    });
  }

  cacheUserPreferences(): void {
    // 缓存用户偏好设置
    const preferences = {
      accountUuid: this.accountUuid,
      lastAuthAt: this.lastAuthAt?.toISOString(),
      preferredMFADevices: Array.from(this.mfaDevices.keys()),
      rememberLogin: true,
    };

    localStorage.setItem(`user_prefs_${this.accountUuid}`, JSON.stringify(preferences));
  }

  showAccountLockWarning(): void {
    // 显示账户锁定警告
    const remainingTime = Math.ceil(this.lockTimeRemaining / (1000 * 60));
    console.log(`Account is locked. Time remaining: ${remainingTime} minutes`);
    // 这里可以显示账户锁定的UI提示
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 客户端特定的业务方法 =====
  getActiveMFADevices(): MFADevice[] {
    return Array.from(this.mfaDevices.values()).filter(
      (device) => (device as MFADevice).isEnabled && (device as MFADevice).isVerified,
    ) as MFADevice[];
  }

  getRememberTokensForDisplay(): Array<{
    deviceInfo?: string;
    token: Token;
    createdAt: Date;
    expiresAt: Date;
    status: 'valid' | 'expiring' | 'expired';
  }> {
    const rememberTokens: Token[] = [];
    for (const token of this._tokens.values()) {
      if (token.type === TokenType.REMEMBER_ME && token.isValid()) {
        rememberTokens.push(token as Token);
      }
    }

    return rememberTokens.map((token) => ({
      deviceInfo: token.deviceInfo,
      token,
      createdAt: token.issuedAt,
      expiresAt: token.expiresAt,
      status: token.getExpiryStatus(),
    }));
  }

  getCurrentDeviceRememberToken(): Token | undefined {
    // 获取当前设备的记住我令牌
    const currentDeviceInfo = this.getCurrentDeviceInfo();

    for (const token of this._tokens.values()) {
      if (
        token.type === TokenType.REMEMBER_ME &&
        token.isValid() &&
        token.deviceInfo === currentDeviceInfo
      ) {
        return token as Token;
      }
    }
    return undefined;
  }

  private getCurrentDeviceInfo(): string {
    // 生成当前设备的唯一标识
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;

    // 简单的设备指纹（生产环境建议使用更复杂的算法）
    return btoa(`${userAgent}-${platform}-${language}`).substring(0, 16);
  }

  loadUserPreferences(): any {
    const prefsData = localStorage.getItem(`user_prefs_${this.accountUuid}`);
    if (prefsData) {
      try {
        return JSON.parse(prefsData);
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }
    }
    return null;
  }

  // ===== 静态工厂方法 =====
  static async createWithLogin(params: {
    accountUuid: string;
    plainPassword: string;
  }): Promise<AuthCredential> {
    const password = new Password(params.plainPassword);

    const authCredential = new AuthCredential({
      accountUuid: params.accountUuid,
      password,
    });

    // 显示登录表单
    await authCredential.showLoginForm();

    return authCredential;
  }

  static fromLocalStorage(accountUuid: string): AuthCredential | null {
    try {
      const prefsData = localStorage.getItem(`user_prefs_${accountUuid}`);
      if (!prefsData) return null;

      // 这里应该从本地存储恢复完整的认证凭据
      // 为简化示例，返回基本实例
      return null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }
}
