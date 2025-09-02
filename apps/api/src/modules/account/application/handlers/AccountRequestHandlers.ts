import { requestResponseEventBus } from '../../../../../../../common/shared/events';
import  { type IAccountCore, AccountStatus } from '@dailyuse/contracts';
import {
  AccountApplicationService,
  type AccountResponseDto,
} from '../services/AccountApplicationService';
import { Account } from '@dailyuse/domain-server';

/**
 * 账户模块的请求-响应事件处理器注册
 * 使用新的 invoke/handle 模式
 */
export class AccountRequestHandlers {
  constructor(private readonly accountService: AccountApplicationService) {
    this.registerHandlers();
  }

  /**
   * 注册所有请求处理器
   */
  private registerHandlers(): void {
    // 处理通过用户名获取账户信息的请求
    requestResponseEventBus.handle<{ username: string }, IAccountCore | null>(
      'AccountInfoGetterByUsername',
      async (payload: { username: string }) => {
        console.log(`🔍 [AccountRequestHandlers] 处理获取账户请求 - 用户名: ${payload.username}`);
        const account = await this.accountService.getAccountByUsername(payload.username);
        return account ? this.convertAccountToCore(account) : null;
      },
    );

    // 处理通过UUID获取账户信息的请求
    requestResponseEventBus.handle<{ accountUuid: string }, IAccountCore | null>(
      'AccountInfoGetterByUuid',
      async (payload: { accountUuid: string }) => {
        console.log(`🔍 [AccountRequestHandlers] 处理获取账户请求 - UUID: ${payload.accountUuid}`);
        const account = await this.accountService.getAccountById(payload.accountUuid);
        return account ? this.convertAccountToCore(account) : null;
      },
    );

    // 处理账户状态验证的请求
    requestResponseEventBus.handle<{ accountUuid: string }, { isValid: boolean; status: AccountStatus | null }>(
      'AccountStatusVerification',
      async (payload: { accountUuid: string }) => {
        console.log(`🔍 [AccountRequestHandlers] 处理账户状态验证 - UUID: ${payload.accountUuid}`);
        return await this.accountService.handleAccountStatusVerification(payload.accountUuid);
      },
    );

    console.log(`✅ [AccountRequestHandlers] 已注册所有账户请求处理器`);
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
 * 便捷函数：初始化账户请求处理器
 */
export function initializeAccountRequestHandlers(
  accountService: AccountApplicationService,
): AccountRequestHandlers {
  return new AccountRequestHandlers(accountService);
}
