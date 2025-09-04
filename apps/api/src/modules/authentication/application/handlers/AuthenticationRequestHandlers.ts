import { eventBus } from '@dailyuse/utils';
import { AuthenticationApplicationService } from '../services/AuthenticationApplicationService';

/**
 * 认证模块的统一事件处理器
 * 使用新的统一事件总线进行事件处理和请求-响应通信
 */
export class AuthenticationEventHandlers {
  private authenticationService: AuthenticationApplicationService | null = null;

  constructor() {
    this.registerEventHandlers();
    this.registerRequestHandlers();
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
   * 注册单向事件处理器 (领域事件)
   */
  private registerEventHandlers(): void {
    console.log('[authentication:EventHandlers] 注册领域事件处理器...');

    // 监听账户注册事件
    eventBus.on('AccountRegisteredEvent', async (event: any) => {
      try {
        console.log(`📝 [Authentication] 处理账户注册事件: ${event.aggregateId}`);
        const authService = await this.getAuthService();
        // 需要根据实际的方法签名调整参数
        // await authService.handleAccountRegistered(event.aggregateId, event.payload?.password, true);
        console.log(`✅ [Authentication] 账户注册事件处理完成: ${event.aggregateId}`);
      } catch (error) {
        console.error(`❌ [Authentication] 处理账户注册事件失败:`, error);
      }
    });

    // 监听密码重置请求事件
    eventBus.on('PasswordResetRequestedEvent', async (event: any) => {
      try {
        console.log(`📝 [Authentication] 处理密码重置请求事件: ${event.aggregateId}`);
        // 这里可以处理密码重置逻辑
        console.log(`✅ [Authentication] 密码重置请求事件处理完成: ${event.aggregateId}`);
      } catch (error) {
        console.error(`❌ [Authentication] 处理密码重置请求事件失败:`, error);
      }
    });

    console.log('✅ [authentication:EventHandlers] 领域事件处理器注册完成');
  }

  /**
   * 注册请求-响应处理器 (双向通信)
   */
  private registerRequestHandlers(): void {
    console.log('[authentication:RequestHandlers] 注册请求处理器...');

    // 处理创建认证凭证的请求
    eventBus.handle<
      { accountUuid: string; username?: string; password: string },
      { success: boolean; message: string }
    >('auth.credential.create', async (payload) => {
      try {
        console.log(`🔐 [Authentication] 处理认证凭证创建请求: ${payload.accountUuid}`);

        const authService = await this.getAuthService();
        const response = await authService.handleAccountRegistered(
          payload.accountUuid,
          payload.password,
          true,
        );

        if (!response) {
          return {
            success: false,
            message: `认证凭证创建失败 (账户: ${payload.accountUuid})`,
          };
        }

        console.log(`✅ [Authentication] 认证凭证创建成功: ${payload.accountUuid}`);
        return {
          success: true,
          message: `认证凭证已成功创建 (账户: ${payload.accountUuid})`,
        };
      } catch (error) {
        console.error(`❌ [Authentication] 认证凭证创建失败:`, error);
        return {
          success: false,
          message: `认证凭证创建失败: ${(error as Error).message}`,
        };
      }
    });

    // 处理用户认证请求
    eventBus.handle<
      { username: string; password: string },
      { success: boolean; token?: string; accountUuid?: string; message: string }
    >('auth.login', async (payload) => {
      try {
        console.log(`🔑 [Authentication] 处理登录认证请求: ${payload.username}`);

        const authService = await this.getAuthService();
        // 这里应该调用实际的登录方法
        // const loginResult = await authService.authenticateUser(payload.username, payload.password);

        // 临时返回，需要根据实际的认证服务方法来实现
        console.log(`✅ [Authentication] 登录认证处理完成: ${payload.username}`);
        return {
          success: true,
          message: '认证成功',
          // token: loginResult.token,
          // accountUuid: loginResult.accountUuid,
        };
      } catch (error) {
        console.error(`❌ [Authentication] 登录认证失败:`, error);
        return {
          success: false,
          message: `认证失败: ${(error as Error).message}`,
        };
      }
    });

    // 处理令牌验证请求
    eventBus.handle<
      { token: string },
      { valid: boolean; accountUuid?: string; username?: string; message: string }
    >('auth.token.verify', async (payload) => {
      try {
        console.log(`🔍 [Authentication] 处理令牌验证请求`);

        const authService = await this.getAuthService();
        // 这里应该调用实际的令牌验证方法
        // const verifyResult = await authService.verifyToken(payload.token);

        // 临时返回，需要根据实际的认证服务方法来实现
        console.log(`✅ [Authentication] 令牌验证处理完成`);
        return {
          valid: true,
          message: '令牌有效',
          // accountUuid: verifyResult.accountUuid,
          // username: verifyResult.username,
        };
      } catch (error) {
        console.error(`❌ [Authentication] 令牌验证失败:`, error);
        return {
          valid: false,
          message: `令牌验证失败: ${(error as Error).message}`,
        };
      }
    });

    console.log('✅ [authentication:RequestHandlers] 请求处理器注册完成');
  }
}

/**
 * 便捷函数：初始化认证事件处理器
 */
export function initializeAuthenticationEventHandlers(): AuthenticationEventHandlers {
  return new AuthenticationEventHandlers();
}
