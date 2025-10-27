/**
 * Registration Application Service
 * 注册应用服务 - 负责用户注册相关的用例
 */

import type { AuthenticationContracts } from '@dailyuse/contracts';
import { useAuthStore } from '../../presentation/stores/authStore';
import { authApiClient } from '../../infrastructure/api/authApiClient';

export class RegistrationApplicationService {
  private static instance: RegistrationApplicationService;

  private constructor() {}

  /**
   * 创建应用服务实例
   */
  static createInstance(): RegistrationApplicationService {
    RegistrationApplicationService.instance = new RegistrationApplicationService();
    return RegistrationApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): RegistrationApplicationService {
    if (!RegistrationApplicationService.instance) {
      RegistrationApplicationService.instance = RegistrationApplicationService.createInstance();
    }
    return RegistrationApplicationService.instance;
  }

  /**
   * 懒加载获取 Auth Store
   */
  private get authStore(): ReturnType<typeof useAuthStore> {
    return useAuthStore();
  }

  // ============ 注册用例 ============

  /**
   * 用户注册
   */
  async register(
    request: AuthenticationContracts.RegisterRequestDTO,
  ): Promise<AuthenticationContracts.LoginResponseDTO> {
    try {
      this.authStore.setLoading(true);
      this.authStore.clearError();

      const response = await authApiClient.register(request);

      // 注册成功后自动保存tokens和会话信息
      this.authStore.setAccessToken(response.accessToken);
      this.authStore.setRefreshToken(response.refreshToken);
      this.authStore.setCurrentSessionId(response.sessionId);
      this.authStore.setTokenExpiresAt(response.accessTokenExpiresAt);

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      this.authStore.setError('Registration failed');
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }
}

// 导出单例
export const registrationApplicationService = RegistrationApplicationService.getInstance();
