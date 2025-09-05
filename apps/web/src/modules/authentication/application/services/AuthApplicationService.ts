import {
  type AuthByPasswordForm,
  type AuthResponseDTO,
  type AuthByPasswordRequestDTO,
  type SuccessResponse,
  type ApiResponse,
} from '@dailyuse/contracts';
import type { IAuthRepository, IRegistrationRepository } from '@dailyuse/domain-client';
import { AccountType } from '@dailyuse/domain-client';
import { AuthApiService } from '../../infrastructure/api/ApiClient';

/**
 * Authentication Application Service
 * 认证应用服务 - 协调领域对象和基础设施，实现认证相关用例
 */
export class AuthApplicationService {
  private static instance: AuthApplicationService | null = null;
  // private readonly authRepository: IAuthRepository | null = null;
  // private readonly registrationRepository: IRegistrationRepository | null = null;

  private constructor() {
    // 不再需要实例化ApiClient，直接使用静态方法
  }

  static async createInstance(
    authRepository?: IAuthRepository,
    registrationRepository?: IRegistrationRepository,
  ): Promise<AuthApplicationService> {
    if (!AuthApplicationService.instance) {
      AuthApplicationService.instance = new AuthApplicationService();
    }
    return AuthApplicationService.instance;
  }

  static async getInstance(): Promise<AuthApplicationService> {
    if (!AuthApplicationService.instance) {
      AuthApplicationService.instance = new AuthApplicationService();
    }
    return AuthApplicationService.instance;
  }

  // ===== Login Use Cases =====

  /**
   * User Login
   * 用户登录用例
   */
  async login(request: AuthByPasswordForm): Promise<SuccessResponse<AuthResponseDTO | null>> {
    try {
      const authRequest: AuthByPasswordRequestDTO = {
        ...request,
        accountType: AccountType.GUEST,
      };
      const response = await AuthApiService.loginCompat(authRequest);
      if (!response.success) {
        throw new Error(response.message);
      }
      console.log('登录成功，你好', response.data);
      return {
        status: 'SUCCESS',
        success: true,
        message: 'Login successful',
        data: response.data,
        metadata: {
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      // 返回错误响应，但保持类型一致
      throw error; // 让调用者处理错误
    }
  }
}
