import type { IAccountRepository } from '@dailyuse/domain-server';
import { AccountDomainService } from '@dailyuse/domain-server';
import { AccountContainer } from '../../infrastructure/di/AccountContainer';
import type { AccountContracts } from '@dailyuse/contracts';

// 类型别名导出（统一在顶部）
type AccountClientDTO = AccountContracts.AccountClientDTO;
type SubscriptionClientDTO = AccountContracts.SubscriptionClientDTO;
type AccountHistoryClientDTO = AccountContracts.AccountHistoryClientDTO;
type AccountStatus = AccountContracts.AccountStatus;
type SubscriptionPlan = AccountContracts.SubscriptionPlan;
type ThemeType = AccountContracts.ThemeType;
type ProfileVisibility = AccountContracts.ProfileVisibility;
type Gender = AccountContracts.Gender;

/**
 * Account 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain → ClientDTO）
 *
 * 注意：返回给客户端的数据必须使用 ClientDTO（通过 toClientDTO() 方法）
 */
export class AccountApplicationService {
  private static instance: AccountApplicationService;
  private domainService: AccountDomainService;
  private accountRepository: IAccountRepository;

  private constructor(accountRepository: IAccountRepository) {
    this.accountRepository = accountRepository;
    this.domainService = new AccountDomainService(accountRepository);
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    accountRepository?: IAccountRepository,
  ): Promise<AccountApplicationService> {
    const container = AccountContainer.getInstance();
    const repo = accountRepository || container.getAccountRepository();

    AccountApplicationService.instance = new AccountApplicationService(repo);
    return AccountApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<AccountApplicationService> {
    if (!AccountApplicationService.instance) {
      AccountApplicationService.instance = await AccountApplicationService.createInstance();
    }
    return AccountApplicationService.instance;
  }

  // ===== Account 管理 =====

  /**
   * 创建账户
   */
  async createAccount(params: {
    email: string;
    username: string;
    displayName: string;
    timezone?: string;
    language?: string;
  }): Promise<AccountClientDTO> {
    const account = await this.domainService.createAccount(params);
    return account.toClientDTO();
  }

  /**
   * 获取账户详情
   */
  async getAccount(uuid: string): Promise<AccountClientDTO | null> {
    try {
      const account = await this.domainService.getAccount(uuid);
      return account.toClientDTO();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 通过邮箱获取账户
   */
  async getAccountByEmail(email: string): Promise<AccountClientDTO | null> {
    try {
      const account = await this.domainService.getAccountByEmail(email);
      return account.toClientDTO();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 通过用户名获取账户
   */
  async getAccountByUsername(username: string): Promise<AccountClientDTO | null> {
    try {
      const account = await this.domainService.getAccountByUsername(username);
      return account.toClientDTO();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 更新账户资料
   */
  async updateAccountProfile(
    uuid: string,
    profile: {
      displayName?: string;
      avatarUrl?: string;
      bio?: string;
      dateOfBirth?: number;
      gender?: Gender;
      country?: string;
      city?: string;
      timezone?: string;
      language?: string;
    },
  ): Promise<AccountClientDTO> {
    const account = await this.domainService.updateAccountProfile(uuid, profile);
    return account.toClientDTO();
  }

  /**
   * 更新邮箱
   */
  async updateEmail(uuid: string, newEmail: string): Promise<AccountClientDTO> {
    const account = await this.domainService.updateEmail(uuid, newEmail);
    return account.toClientDTO();
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(uuid: string): Promise<AccountClientDTO> {
    const account = await this.domainService.verifyEmail(uuid);
    return account.toClientDTO();
  }

  /**
   * 记录登录
   */
  async recordLogin(uuid: string): Promise<AccountClientDTO> {
    const account = await this.domainService.recordLogin(uuid);
    return account.toClientDTO();
  }

  /**
   * 停用账户
   */
  async deactivateAccount(uuid: string): Promise<AccountClientDTO> {
    const account = await this.domainService.deactivateAccount(uuid);
    return account.toClientDTO();
  }

  /**
   * 删除账户
   */
  async deleteAccount(uuid: string): Promise<void> {
    await this.domainService.deleteAccount(uuid);
  }

  /**
   * 列出所有账户
   */
  async listAccounts(options?: {
    page?: number;
    pageSize?: number;
    status?: AccountStatus;
  }): Promise<{ accounts: AccountClientDTO[]; total: number }> {
    const result = await this.domainService.listAccounts(options);
    return {
      accounts: result.accounts.map((account) => account.toClientDTO()),
      total: result.total,
    };
  }
}
