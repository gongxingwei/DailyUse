/**
 * Account Application Service
 * 账户应用服务（协调器）
 *
 * 职责：
 * - 协调各个账户相关的应用服务
 * - 提供统一的账户操作接口
 * - 处理跨服务的业务流程
 *
 * 注意：这是一个协调器服务，实际业务逻辑委托给：
 * - RegistrationApplicationService（账户注册）
 * - AccountProfileApplicationService（资料管理）
 * - AccountStatusApplicationService（状态管理）
 * - AccountEmailApplicationService（邮箱管理）
 */

import { RegistrationApplicationService } from './RegistrationApplicationService';
import { AccountProfileApplicationService } from './AccountProfileApplicationService';
import { AccountStatusApplicationService } from './AccountStatusApplicationService';
import { AccountEmailApplicationService } from './AccountEmailApplicationService';
import type {
  CreateAccountRequest,
  AccountResponse,
  ListAccountsRequest,
  ListAccountsResponse,
  UpdateProfileRequest,
} from '@dailyuse/contracts';

export class AccountApplicationService {
  private static instance: AccountApplicationService;

  private registrationService: RegistrationApplicationService;
  private profileService: AccountProfileApplicationService;
  private statusService: AccountStatusApplicationService;
  private emailService: AccountEmailApplicationService;

  private constructor() {
    this.registrationService = new RegistrationApplicationService();
    this.profileService = new AccountProfileApplicationService();
    this.statusService = new AccountStatusApplicationService();
    this.emailService = new AccountEmailApplicationService();
  }

  /**
   * 获取单例实例
   */
  static async getInstance(): Promise<AccountApplicationService> {
    if (!AccountApplicationService.instance) {
      AccountApplicationService.instance = new AccountApplicationService();
    }
    return AccountApplicationService.instance;
  }

  /**
   * 创建账户 - 委托给 RegistrationApplicationService
   */
  async createAccount(request: CreateAccountRequest): Promise<AccountResponse> {
    return this.registrationService.registerAccount(request);
  }

  /**
   * 获取账户详情 - 委托给 ProfileApplicationService
   */
  async getAccount(accountUuid: string): Promise<AccountResponse> {
    return this.profileService.getProfile(accountUuid);
  }

  /**
   * 列出账户 - 委托给 ProfileApplicationService
   */
  async listAccounts(request: ListAccountsRequest): Promise<ListAccountsResponse> {
    // TODO: implement proper list accounts logic
    // For now, return empty list
    return {
      accounts: [],
      total: 0,
      page: request.page || 1,
      pageSize: request.pageSize || 20,
    };
  }

  /**
   * 更新账户资料 - 委托给 ProfileApplicationService
   */
  async updateProfile(request: UpdateProfileRequest): Promise<AccountResponse> {
    return this.profileService.updateProfile(request);
  }

  /**
   * 验证邮箱 - 委托给 EmailApplicationService
   */
  async verifyEmail(accountUuid: string): Promise<void> {
    return this.emailService.verifyEmail({ accountUuid });
  }

  /**
   * 停用账户 - 委托给 StatusApplicationService
   */
  async deactivateAccount(accountUuid: string): Promise<void> {
    return this.statusService.deactivateAccount({ accountUuid });
  }

  /**
   * 删除账户 - 委托给 StatusApplicationService
   */
  async deleteAccount(accountUuid: string): Promise<void> {
    return this.statusService.deleteAccount({ accountUuid, isHardDelete: true });
  }
}
