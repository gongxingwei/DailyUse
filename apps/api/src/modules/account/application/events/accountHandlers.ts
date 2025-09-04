import type {
  AccountInfoGetterByUsernameRequested,
  AccountInfoGetterByUuidRequested,
  AccountStatusVerificationRequested,
} from '@dailyuse/contracts';
import type { IAccountCore, AccountStatus } from '@dailyuse/contracts';
// services
import { AccountApplicationService } from '../services/AccountApplicationService';
import { Account } from '@dailyuse/domain-server';
// utils
import { eventBus } from '@dailyuse/utils';

/**
 * 注册所有账户相关的事件处理器
 * @description 使用新的统一事件总线统一管理账户模块的所有事件订阅和请求处理
 */
export async function registerAccountEventHandlers(): Promise<void> {
  console.log('[account:EventHandlers] 注册统一事件处理器...');

  const accountApplicationService = await AccountApplicationService.getInstance();

  // ===================== 单向事件处理 (领域事件) =====================

  // 处理账户注册事件
  eventBus.on(
    'AccountRegisteredEvent',
    createEventHandler('AccountRegisteredEvent', async (event: any) => {
      console.log(`📝 [Account] 处理账户注册事件: ${event.aggregateId}`);
      // 这里可以处理账户注册后的其他业务逻辑，如发送欢迎邮件等
      await publishAccountCreatedNotification(event);
    }),
  );

  // 处理账户状态变更事件
  eventBus.on(
    'AccountStatusChangedEvent',
    createEventHandler('AccountStatusChangedEvent', async (event: any) => {
      console.log(`📝 [Account] 处理账户状态变更事件: ${event.aggregateId}`);
      // 处理状态变更后的逻辑
    }),
  );

  // ===================== 双向请求处理 (invoke/handle) =====================

  // 处理通过用户名获取账户信息的请求
  eventBus.handle<{ username: string }, IAccountCore | null>(
    'account.info.getByUsername',
    async (payload) => {
      console.log(`🔍 [Account] 处理获取账户请求 - 用户名: ${payload.username}`);
      const account = await accountApplicationService.getAccountByUsername(payload.username);
      return account ? convertAccountToCore(account) : null;
    },
  );

  // 处理通过UUID获取账户信息的请求
  eventBus.handle<{ accountUuid: string }, IAccountCore | null>(
    'account.info.getByUuid',
    async (payload) => {
      console.log(`🔍 [Account] 处理获取账户请求 - UUID: ${payload.accountUuid}`);
      const account = await accountApplicationService.getAccountById(payload.accountUuid);
      return account ? convertAccountToCore(account) : null;
    },
  );

  // 处理账户状态验证请求
  eventBus.handle<{ accountUuid: string }, { isValid: boolean; status: AccountStatus | null }>(
    'account.status.verify',
    async (payload) => {
      console.log(`🔍 [Account] 处理账户状态验证 - UUID: ${payload.accountUuid}`);
      return await accountApplicationService.handleAccountStatusVerification(payload.accountUuid);
    },
  );

  console.log('✅ [account:EventHandlers] 所有统一事件处理器注册成功');
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

/**
 * 发送账户创建通知
 */
async function publishAccountCreatedNotification(event: any): Promise<void> {
  try {
    // 发送通知事件
    eventBus.send('notification.account.created', {
      accountUuid: event.aggregateId,
      username: event.payload?.username,
      timestamp: new Date(),
    });

    console.log(`📢 [Account] 账户创建通知已发送: ${event.aggregateId}`);
  } catch (error) {
    console.error(`❌ [Account] 发送账户创建通知失败:`, error);
  }
}

/**
 * 将 Account 实体转换为 IAccountCore 接口
 */
function convertAccountToCore(account: Account): IAccountCore {
  return {
    uuid: account.uuid,
    username: account.username,
    email: account.email
      ? {
          value: account.email.toString(),
          isVerified: account.isEmailVerified || false,
        }
      : undefined,
    accountType: account.accountType,
    status: account.status,
    user: {
      uuid: account.user?.uuid || account.uuid,
      firstName: account.user?.firstName,
      lastName: account.user?.lastName,
      sex: account.user?.sex || { value: 0 },
      avatar: account.user?.avatar,
      bio: account.user?.bio,
      socialAccounts: account.user?.socialAccounts || {},
      createdAt: account.user?.createdAt || account.createdAt,
      updatedAt: account.user?.updatedAt || account.updatedAt,
    },
    roleIds: new Set(account.roleIds || []),
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    lastLoginAt: account.lastLoginAt,
    emailVerificationToken: account.emailVerificationToken,
    phoneVerificationCode: account.phoneVerificationCode,
    isEmailVerified: account.isEmailVerified,
    isPhoneVerified: account.isPhoneVerified,
  };
}
