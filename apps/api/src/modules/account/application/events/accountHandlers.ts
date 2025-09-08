import type {
  AccountDTO,
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
 * 账户模块的事件处理器类
 * @description 使用类实现以避免重复获取服务实例，提高性能
 */
export class AccountEventHandlers {
  private accountApplicationService: AccountApplicationService | null = null;

  constructor() {
    // 在构造函数中注册所有处理器
    this.registerEventHandlers();
  }

  /**
   * 获取账户应用服务实例（懒加载）
   */
  private async getAccountService(): Promise<AccountApplicationService> {
    if (!this.accountApplicationService) {
      this.accountApplicationService = await AccountApplicationService.getInstance();
    }
    return this.accountApplicationService;
  }

  /**
   * 注册所有账户相关的事件处理器
   */
  private async registerEventHandlers(): Promise<void> {
    console.log('[account:EventHandlers] 注册统一事件处理器...');

    const accountApplicationService = await this.getAccountService();

    // ===================== 单向事件处理 (领域事件) =====================

    // 处理账户注册事件
    eventBus.on(
      'AccountRegisteredEvent',
      createEventHandler('AccountRegisteredEvent', async (event: any) => {
        console.log(`📝 [Account] 处理账户注册事件: ${event.aggregateId}`);
        // 这里可以处理账户注册后的其他业务逻辑，如发送欢迎邮件等
        await this.publishAccountCreatedNotification(event);
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
    eventBus.handle<{ username: string }, AccountDTO | null>(
      'account.info.getByUsername',
      async (payload) => {
        console.log(`🔍 [Account] 处理获取账户请求 - 用户名: ${payload.username}`);
        const accountDTO = await accountApplicationService.getAccountByUsername(payload.username);
        return accountDTO ? accountDTO : null;
      },
    );

    // 处理通过UUID获取账户信息的请求
    eventBus.handle<{ accountUuid: string }, AccountDTO | null>(
      'account.info.getByUuid',
      async (payload) => {
        console.log(`🔍 [Account] 处理获取账户请求 - UUID: ${payload.accountUuid}`);
        const accountDTO = await accountApplicationService.getAccountById(payload.accountUuid);
        return accountDTO ? accountDTO : null;
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
   * 发送账户创建通知
   */
  private async publishAccountCreatedNotification(event: any): Promise<void> {
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
  private convertAccountToCore(account: Account): IAccountCore {
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
 * 便捷函数：初始化账户事件处理器
 * @description 兼容旧的函数调用方式
 */
export function registerAccountEventHandlers(): void {
  new AccountEventHandlers();
}
