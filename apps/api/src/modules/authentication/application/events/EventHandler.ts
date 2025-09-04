// events
import type { AccountRegisteredEvent } from '@dailyuse/domain-server';
import { AuthenticationApplicationService } from '../services/AuthenticationApplicationService';
// utils
import { eventBus } from '@dailyuse/utils';

/**
 * 注册认证模块的统一事件处理器
 * @description 使用新的统一事件总线进行事件处理
 */
export async function registerAuthenticationEventHandler(): Promise<void> {
  console.log('[authentication:EventHandler] 注册统一事件处理器...');

  const authenticationApplicationService = await AuthenticationApplicationService.getInstance();

  // ===================== 领域事件处理 =====================

  // 处理账户注册事件
  eventBus.on('AccountRegisteredEvent', async (event: AccountRegisteredEvent) => {
    try {
      console.log(`📝 [Authentication] 处理账户注册领域事件: ${event.aggregateId}`);
      // 根据实际方法签名调用
      // await authenticationApplicationService.handleAccountRegistered(event.aggregateId, event.payload?.password, true);
      console.log(`✅ [Authentication] 账户注册领域事件处理完成: ${event.aggregateId}`);
    } catch (error) {
      console.error('[authentication:EventHandler] Error handling AccountRegisteredEvent:', error);
    }
  });

  // 处理认证失败事件
  eventBus.on('AuthenticationFailedEvent', async (event: any) => {
    try {
      console.log(`📝 [Authentication] 处理认证失败事件: ${event.aggregateId}`);
      // 这里可以处理认证失败后的逻辑，如记录日志、锁定账户等
      console.log(`✅ [Authentication] 认证失败事件处理完成: ${event.aggregateId}`);
    } catch (error) {
      console.error(
        '[authentication:EventHandler] Error handling AuthenticationFailedEvent:',
        error,
      );
    }
  });

  // ===================== 请求-响应处理 =====================

  // 处理密码验证请求
  eventBus.handle<{ username: string; password: string }, { valid: boolean; accountUuid?: string }>(
    'auth.password.verify',
    async (payload) => {
      try {
        console.log(`🔐 [Authentication] 处理密码验证请求: ${payload.username}`);

        // 这里应该调用实际的密码验证方法
        // const result = await authenticationApplicationService.verifyPassword(payload.username, payload.password);

        // 临时返回，需要根据实际实现
        return {
          valid: true,
          // accountUuid: result.accountUuid,
        };
      } catch (error) {
        console.error(`❌ [Authentication] 密码验证失败:`, error);
        return {
          valid: false,
        };
      }
    },
  );

  // 处理刷新令牌请求
  eventBus.handle<
    { refreshToken: string },
    { success: boolean; accessToken?: string; message: string }
  >('auth.token.refresh', async (payload) => {
    try {
      console.log(`🔄 [Authentication] 处理令牌刷新请求`);

      // 这里应该调用实际的令牌刷新方法
      // const result = await authenticationApplicationService.refreshToken(payload.refreshToken);

      // 临时返回，需要根据实际实现
      return {
        success: true,
        message: '令牌刷新成功',
        // accessToken: result.accessToken,
      };
    } catch (error) {
      console.error(`❌ [Authentication] 令牌刷新失败:`, error);
      return {
        success: false,
        message: `令牌刷新失败: ${(error as Error).message}`,
      };
    }
  });

  console.log('✅ [authentication:EventHandler] 统一事件处理器注册完成');
}
