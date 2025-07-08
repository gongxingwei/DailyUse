import { AccountApplicationService } from '@/modules/Account';
import { AuthenticationService } from '@/modules/Authentication';
import { SessionManagementService } from '@/modules/SessionManagement';
import type { IAccountRepository } from '@/modules/Account';
import type { ISessionRepository } from '@/modules/SessionManagement';

/**
 * 账号系统初始化工具
 * 用于设置和配置新的模块化架构
 */
export class AccountSystemInitializer {
  private static initialized = false;
  private static accountAppService: AccountApplicationService;

  /**
   * 初始化账号系统
   * @param accountRepository 账号存储库实现
   * @param sessionRepository 会话存储库实现
   */
  static initialize(
    accountRepository: IAccountRepository,
    sessionRepository: ISessionRepository
  ): AccountApplicationService {
    if (this.initialized) {
      return this.accountAppService;
    }

    // 1. 创建认证服务
    const authService = AuthenticationService.getInstance(accountRepository);

    // 2. 创建会话管理服务
    const sessionService = SessionManagementService.getInstance(sessionRepository);

    // 3. 创建账号应用服务
    this.accountAppService = AccountApplicationService.getInstance(
      authService,
      sessionService,
      accountRepository
    );

    this.initialized = true;

    console.log('账号系统初始化完成');
    return this.accountAppService;
  }

  /**
   * 获取账号应用服务实例
   */
  static getAccountApplicationService(): AccountApplicationService {
    if (!this.initialized) {
      throw new Error('账号系统尚未初始化，请先调用 initialize() 方法');
    }
    return this.accountAppService;
  }

  /**
   * 检查是否已初始化
   */
  static isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * 向后兼容的初始化函数
 * 用于将新架构注入到旧的 localUserService 中
 */
export function initializeAccountSystem(
  accountRepository: IAccountRepository,
  sessionRepository: ISessionRepository
): void {
  // 初始化新架构
  const accountAppService = AccountSystemInitializer.initialize(
    accountRepository,
    sessionRepository
  );

  // 注入到旧服务中以保持向后兼容
  const { localUserService } = require('@/modules/Account/services/localUserService');
  localUserService.setAccountApplicationService(accountAppService);

  console.log('账号系统已成功集成到现有服务中');
}
