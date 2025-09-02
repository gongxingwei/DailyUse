import type {
  AccountInfoGetterByUsernameRequested,
  AccountInfoGetterByUuidRequested,
  AccountStatusVerificationRequested,
} from '@dailyuse/contracts';
// services
import { AccountApplicationService } from '../services/AccountApplicationService';
import { Account } from '@dailyuse/domain-server';
// utils
import { eventBus } from '@dailyuse/utils';

/**
 * 注册所有账户相关的事件处理器
 * @description 统一管理账户模块的所有事件订阅
 */
export async function registerAccountEventHandlers(): Promise<void> {
  console.log('[account:EventHandlers] Registering event handlers...');

  const accountApplicationService = await AccountApplicationService.getInstance();

  // 处理通过用户名获取账户信息的请求事件
  eventBus.subscribe(
    'AccountInfoGetterByUsernameRequested',
    createEventHandler(
      'AccountInfoGetterByUsernameRequested',
      async (event: AccountInfoGetterByUsernameRequested) => {
        await accountApplicationService.handleAccountInfoGetterByUsernameEvent(event);
      },
    ),
  );

  eventBus.subscribe(
    'AccountInfoGetterByUuidRequested',
    createEventHandler(
      'AccountInfoGetterByUuidRequested',
      async (event: AccountInfoGetterByUuidRequested) => {
        await accountApplicationService.handleAccountInfoGetterByUuidEvent(event);
      },
    ),
  );

  // 处理账户状态验证请求事件
  eventBus.subscribe(
    'AccountStatusVerificationRequested',
    createEventHandler(
      'AccountStatusVerificationRequested',
      async (event: AccountStatusVerificationRequested) => {
        await accountApplicationService.handleAccountStatusVerificationEvent(event);
      },
    ),
  );

  console.log('[account:EventHandlers] All handlers registered successfully');
}

/**
 * 创建带错误处理的事件处理器
 * @param eventType 事件类型
 * @param handler 实际的处理函数
 * @returns 包装后的事件处理器
 */
function createEventHandler<T>(eventType: string, handler: (event: T) => Promise<void>) {
  return async (event: T) => {
    try {
      await handler(event);
    } catch (error) {
      console.error(`[account:EventHandlers] Error handling ${eventType}:`, error);
      // 可以添加更多错误处理逻辑，如：
      // - 记录到日志系统
      // - 发送错误通知
      // - 重试机制等
    }
  };
}
