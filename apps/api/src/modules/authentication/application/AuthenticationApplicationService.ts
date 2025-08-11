import { AuthCredential, Session, Token, MFADevice } from '@dailyuse/domain-server';
import { TokenType } from '@dailyuse/domain-core';
import type {
  IAuthCredentialRepository,
  ISessionRepository,
  ITokenRepository,
  IMFADeviceRepository,
} from '@dailyuse/domain-server';

export interface LoginRequest {
  username: string;
  password: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  accountUuid?: string;
  requiresMFA?: boolean;
  error?: string;
}

export interface MFAVerificationRequest {
  sessionId: string;
  mfaCode: string;
}

export interface MFAVerificationResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export interface CreateMFADeviceRequest {
  accountUuid: string;
  type: string;
  name: string;
  phoneNumber?: string;
  emailAddress?: string;
}

export interface CreateMFADeviceResponse {
  success: boolean;
  device?: {
    uuid: string;
    type: string;
    name: string;
    secretKey?: string;
    qrCode?: string;
  };
  error?: string;
}

/**
 * Authentication Application Service
 * 处理认证相关的业务用例
 */
export class AuthenticationApplicationService {
  constructor(
    private authCredentialRepository: IAuthCredentialRepository,
    private sessionRepository: ISessionRepository,
    private tokenRepository: ITokenRepository,
    private mfaDeviceRepository: IMFADeviceRepository,
  ) {}

  /**
   * 用户登录
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // 1. 查找认证凭据
      const authCredential = await this.authCredentialRepository.findByUsername(request.username);
      if (!authCredential) {
        return {
          success: false,
          error: 'Invalid username or password',
        };
      }

      // 2. 验证密码
      const isPasswordValid = authCredential.authenticate(request.password);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid username or password',
        };
      }

      // 3. 检查是否需要MFA
      const mfaDevices = await this.mfaDeviceRepository.findEnabledByAccountUuid(
        authCredential.accountUuid,
      );
      const requiresMFA = mfaDevices.length > 0;

      if (requiresMFA) {
        // 创建临时会话，等待MFA验证
        const tempSession = Session.create({
          accountUuid: authCredential.accountUuid,
          deviceInfo: request.deviceInfo || 'Unknown device',
          ipAddress: request.ipAddress || '0.0.0.0',
          userAgent: request.userAgent,
        });

        // 标记为需要MFA验证
        (tempSession as any)._requiresMFA = true;

        await this.sessionRepository.save(tempSession);

        return {
          success: true,
          sessionId: tempSession.token,
          accountUuid: authCredential.accountUuid,
          requiresMFA: true,
        };
      }

      // 4. 如果不需要MFA，直接创建完整会话和令牌
      return await this.createAuthenticatedSession(
        authCredential.accountUuid,
        request.deviceInfo,
        request.ipAddress,
        request.userAgent,
      );
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * MFA验证
   */
  async verifyMFA(request: MFAVerificationRequest): Promise<MFAVerificationResponse> {
    try {
      // 1. 查找临时会话
      const session = await this.sessionRepository.findById(request.sessionId);
      if (!session || !(session as any)._requiresMFA) {
        return {
          success: false,
          error: 'Invalid or expired session',
        };
      }

      // 2. 获取MFA设备
      const mfaDevices = await this.mfaDeviceRepository.findEnabledByAccountUuid(
        session.accountUuid,
      );
      if (mfaDevices.length === 0) {
        return {
          success: false,
          error: 'No MFA devices available',
        };
      }

      // 3. 验证MFA代码（尝试所有启用的设备）
      let isValidMFA = false;
      for (const device of mfaDevices) {
        if (device.verify(request.mfaCode)) {
          isValidMFA = true;
          // 更新设备最后使用时间
          await this.mfaDeviceRepository.save(device);
          break;
        }
      }

      if (!isValidMFA) {
        return {
          success: false,
          error: 'Invalid MFA code',
        };
      }

      // 4. 删除临时会话
      await this.sessionRepository.delete(request.sessionId);

      // 5. 创建完整的认证会话
      const loginResponse = await this.createAuthenticatedSession(
        session.accountUuid,
        session.deviceInfo,
        session.ipAddress,
        session.userAgent,
      );

      return {
        success: loginResponse.success,
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
        error: loginResponse.error,
      };
    } catch (error) {
      console.error('MFA verification error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * 注销
   */
  async logout(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 删除会话
      await this.sessionRepository.delete(sessionId);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(refreshTokenValue: string): Promise<LoginResponse> {
    try {
      // 1. 验证刷新令牌
      const refreshToken = await this.tokenRepository.findByValue(refreshTokenValue);
      if (!refreshToken || !refreshToken.isValid()) {
        return {
          success: false,
          error: 'Invalid or expired refresh token',
        };
      }

      // 2. 撤销旧的刷新令牌
      refreshToken.revoke();
      await this.tokenRepository.save(refreshToken);

      // 3. 创建新的访问令牌和刷新令牌
      const accessToken = Token.createAccessToken(refreshToken.accountUuid);
      const newRefreshToken = Token.createRefreshToken(refreshToken.accountUuid);

      await this.tokenRepository.save(accessToken);
      await this.tokenRepository.save(newRefreshToken);

      return {
        success: true,
        accessToken: accessToken.value,
        refreshToken: newRefreshToken.value,
        accountUuid: refreshToken.accountUuid,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * 创建MFA设备
   */
  async createMFADevice(request: CreateMFADeviceRequest): Promise<CreateMFADeviceResponse> {
    try {
      // 创建新设备
      const device = new MFADevice({
        accountUuid: request.accountUuid,
        type: request.type as any,
        name: request.name,
        maxAttempts: 5,
      });

      // 根据设备类型设置特定属性
      if (request.type === 'totp') {
        // 生成TOTP密钥
        const secretKey = this.generateTOTPSecret();
        device.setTOTPSecret(secretKey);
      } else if (request.type === 'sms' && request.phoneNumber) {
        device.setSMSPhoneNumber(request.phoneNumber);
      } else if (request.type === 'email' && request.emailAddress) {
        device.setEmailAddress(request.emailAddress);
      }

      await this.mfaDeviceRepository.save(device);

      const response: CreateMFADeviceResponse = {
        success: true,
        device: {
          uuid: device.uuid,
          type: device.type,
          name: device.name,
        },
      };

      // 为TOTP设备添加密钥和二维码
      if (request.type === 'totp' && device.secretKey) {
        response.device!.secretKey = device.secretKey;
        response.device!.qrCode = this.generateQRCode(
          device.secretKey,
          request.accountUuid,
          request.name,
        );
      }

      return response;
    } catch (error) {
      console.error('Create MFA device error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * 获取账户的MFA设备列表
   */
  async getMFADevices(accountUuid: string): Promise<{
    success: boolean;
    devices?: Array<{
      uuid: string;
      type: string;
      name: string;
      isVerified: boolean;
      isEnabled: boolean;
      createdAt: Date;
      lastUsedAt?: Date;
    }>;
    error?: string;
  }> {
    try {
      const devices = await this.mfaDeviceRepository.findByAccountUuid(accountUuid);

      return {
        success: true,
        devices: devices.map((device) => ({
          uuid: device.uuid,
          type: device.type,
          name: device.name,
          isVerified: device.isVerified,
          isEnabled: device.isEnabled,
          createdAt: device.createdAt,
          lastUsedAt: device.lastUsedAt,
        })),
      };
    } catch (error) {
      console.error('Get MFA devices error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * 私有方法：创建完整的认证会话
   */
  private async createAuthenticatedSession(
    accountUuid: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponse> {
    // 创建会话
    const session = Session.create({
      accountUuid,
      deviceInfo: deviceInfo || 'Unknown device',
      ipAddress: ipAddress || '0.0.0.0',
      userAgent,
    });

    // 创建访问令牌和刷新令牌
    const accessToken = Token.createAccessToken(accountUuid);
    const refreshToken = Token.createRefreshToken(accountUuid);

    // 保存到数据库
    await this.sessionRepository.save(session);
    await this.tokenRepository.save(accessToken);
    await this.tokenRepository.save(refreshToken);

    return {
      success: true,
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      sessionId: session.token,
      accountUuid,
    };
  }

  /**
   * 私有方法：生成TOTP密钥
   */
  private generateTOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 私有方法：生成TOTP二维码URL
   */
  private generateQRCode(secretKey: string, accountUuid: string, deviceName: string): string {
    const issuer = 'DailyUse';
    const label = `${issuer}:${deviceName}`;
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${secretKey}&issuer=${encodeURIComponent(issuer)}`;
  }
}
