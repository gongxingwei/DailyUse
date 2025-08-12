import type { IRegistrationRepository } from '../../domain/repositories/IAuthRepository';
import { AuthApiClient } from '../api/ApiClient';

/**
 * Registration Repository Implementation
 * 注册仓储实现 - 基于API客户端的用户注册仓储
 */
export class RegistrationRepositoryImpl implements IRegistrationRepository {
  private readonly apiClient: AuthApiClient;

  constructor(apiClient: AuthApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * 用户注册
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }): Promise<{
    success: boolean;
    userId?: string;
    message: string;
    requiresVerification?: boolean;
  }> {
    try {
      const response = await this.apiClient.register(userData);

      return {
        success: response.success,
        userId: response.userId,
        message: response.message,
        requiresVerification: response.requiresVerification,
      };
    } catch (error) {
      console.error('Registration error in repository:', error);
      return {
        success: false,
        message: 'Registration failed due to system error',
      };
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(userId: string, code: string): Promise<boolean> {
    try {
      const response = await this.apiClient.verifyEmail(userId, code);
      return response.success;
    } catch (error) {
      console.error('Email verification error:', error);
      return false;
    }
  }

  /**
   * 重新发送验证邮件
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    try {
      const response = await this.apiClient.resendVerificationEmail(userId);

      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw error;
    }
  }

  /**
   * 检查用户名可用性
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const response = await this.apiClient.checkUsernameAvailability(username);
      return response.available;
    } catch (error) {
      console.error('Check username availability error:', error);
      return false; // 假设不可用以防止重复用户名
    }
  }

  /**
   * 检查邮箱可用性
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      const response = await this.apiClient.checkEmailAvailability(email);
      return response.available;
    } catch (error) {
      console.error('Check email availability error:', error);
      return false; // 假设不可用以防止重复邮箱
    }
  }
}
