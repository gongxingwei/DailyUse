import { requestResponseEventBus } from '../../../../../../../common/shared/events';
import { AuthenticationApplicationService } from '../services/AuthenticationApplicationService';
import bcrypt from 'bcryptjs';

/**
 * 认证模块的请求-响应事件处理器
 * 使用 Node.js EventEmitter 的 invoke/handle 模式
 */
export class AuthenticationRequestHandlers {
    private authenticationService: AuthenticationApplicationService | null = null;

  constructor() {
    this.registerHandlers();
  }

  /**
   * 获取认证应用服务实例
   */
  private async getAuthService(): Promise<AuthenticationApplicationService> {
    if (!this.authenticationService) {
      this.authenticationService = await AuthenticationApplicationService.getInstance();
    }
    return this.authenticationService;
  }

  /**
   * 注册所有请求处理器
   */
  private registerHandlers(): void {
    // 处理创建认证凭证的请求
    requestResponseEventBus.handle<
      { accountUuid: string; password: string },
      { success: boolean; message: string }
    >(
      'CreateAuthCredentialRequest',
      async (payload: { accountUuid: string; password: string }) => {
        try {
          const authService = await this.getAuthService();
          const response = await authService.handleAccountRegistered(
            payload.accountUuid,
            payload.password,
            true
          );
          if (!response) {
            return {
              success: false,
              message: `认证凭证创建失败 (账户: ${payload.accountUuid})`,
            };
          }
          return {
              success: true,
              message: `认证凭证已成功创建 (账户: ${payload.accountUuid})`,
            };
        } catch (error) {
          console.error(`❌ [AuthenticationRequestHandlers] 认证凭证生成失败:`, error);

          return {
            success: false,
            message: `认证凭证创建失败: ${(error as Error).message}`,
          };
        }
      },
    );

    console.log(`✅ [AuthenticationRequestHandlers] 已注册所有认证请求处理器`);
  }
}

/**
 * 便捷函数：初始化认证请求处理器
 */
export function initializeAuthenticationRequestHandlers(): AuthenticationRequestHandlers {
  return new AuthenticationRequestHandlers();
}
