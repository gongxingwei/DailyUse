import { Account, User } from '@dailyuse/domain-server';
import type { IAccountRepository } from '@dailyuse/domain-server';
import { PrismaAccountRepository } from '../infrastructure/PrismaAccountRepository';
import { EmailService } from '../domain/EmailService';
import { AccountValidationService } from '../infrastructure/AccountValidationService';
import { AccountStatus } from '@dailyuse/domain-core';

export interface CreateAccountDto {
  username: string;
  accountType: any;
  user: any;
  email?: any;
  phoneNumber?: any;
  password?: string;
}

export interface UpdateAccountDto {
  email?: string;
  phoneNumber?: string;
  address?: any;
  userProfile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
}

export interface AccountResponseDto {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  status: any;
  accountType: any;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    socialAccounts: { [key: string]: string };
  };
  roleIds: string[];
}

export class AccountApplicationService {
  constructor(
    private readonly accountRepository: PrismaAccountRepository,
    private readonly emailService: EmailService,
    private readonly validationService: AccountValidationService,
  ) {}

  /**
   * 创建新账户
   */
  async createAccount(createDto: CreateAccountDto): Promise<AccountResponseDto> {
    // 验证数据
    await this.validationService.validateAccountCreation(createDto);

    // 创建账户聚合
    const account = Account.register({
      username: createDto.username,
      accountType: createDto.accountType,
      email: createDto.email,
      phoneNumber: createDto.phoneNumber,
      password: createDto.password,
    });

    // 保存到数据库
    const savedAccount = await this.accountRepository.save(account);

    // 发送欢迎邮件
    if (savedAccount.email) {
      await this.emailService.sendWelcomeEmail(savedAccount);
    }

    return this.toResponseDto(savedAccount);
  }

  /**
   * 根据ID获取账户
   */
  async getAccountById(id: string): Promise<AccountResponseDto | null> {
    const account = await this.accountRepository.findById(id);
    return account ? this.toResponseDto(account) : null;
  }

  /**
   * 根据邮箱获取账户
   */
  async getAccountByEmail(email: string): Promise<AccountResponseDto | null> {
    const account = await this.accountRepository.findByEmail(email);
    return account ? this.toResponseDto(account) : null;
  }

  /**
   * 根据用户名获取账户
   */
  async getAccountByUsername(username: string): Promise<AccountResponseDto | null> {
    const account = await this.accountRepository.findByUsername(username);
    return account ? this.toResponseDto(account) : null;
  }

  /**
   * 更新账户信息
   */
  async updateAccount(id: string, updateDto: UpdateAccountDto): Promise<AccountResponseDto | null> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      return null;
    }

    // 验证更新数据
    await this.validationService.validateAccountUpdate(updateDto, account);

    // 更新账户信息
    if (updateDto.email && updateDto.email !== account.email?.value) {
      account.updateEmail(updateDto.email);
      // 邮箱变更需要重新验证
      await this.emailService.sendVerificationEmail(account);
    }

    if (updateDto.phoneNumber) {
      account.updatePhone(updateDto.phoneNumber);
    }

    if (updateDto.address) {
      account.updateAddress(updateDto.address);
    }

    if (updateDto.userProfile) {
      // 更新用户信息 - 使用User实体的更新方法
      const user = account.user as User;

      if (
        updateDto.userProfile.firstName ||
        updateDto.userProfile.lastName ||
        updateDto.userProfile.bio
      ) {
        user.updateProfile(
          updateDto.userProfile.firstName,
          updateDto.userProfile.lastName,
          updateDto.userProfile.bio,
        );
      }

      if (updateDto.userProfile.avatar) {
        user.updateAvatar(updateDto.userProfile.avatar);
      }
    }

    const updatedAccount = await this.accountRepository.save(account);
    return this.toResponseDto(updatedAccount);
  }

  /**
   * 激活账户
   */
  async activateAccount(id: string): Promise<boolean> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      return false;
    }

    account.enable();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 停用账户
   */
  async deactivateAccount(id: string): Promise<boolean> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      return false;
    }

    account.disable();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 暂停账户
   */
  async suspendAccount(id: string): Promise<boolean> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      return false;
    }

    account.suspend();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(id: string, token: string): Promise<boolean> {
    const account = await this.accountRepository.findById(id);
    if (!account || account.emailVerificationToken !== token) {
      return false;
    }

    account.verifyEmail();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 验证手机号
   */
  async verifyPhone(id: string, code: string): Promise<boolean> {
    const account = await this.accountRepository.findById(id);
    if (!account || account.phoneVerificationCode !== code) {
      return false;
    }

    account.verifyPhone();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 为账户添加角色
   */
  async addRole(accountId: string, roleId: string): Promise<boolean> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      return false;
    }

    account.addRole(roleId);
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 移除账户角色
   */
  async removeRole(accountId: string, roleId: string): Promise<boolean> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      return false;
    }

    account.removeRole(roleId);
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 获取所有账户（分页）
   */
  async getAllAccounts(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    accounts: AccountResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { accounts, total } = await this.accountRepository.findAll(page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      accounts: accounts.map((account) => this.toResponseDto(account)),
      total,
      page,
      totalPages,
    };
  }

  /**
   * 根据状态获取账户
   */
  async getAccountsByStatus(status: AccountStatus): Promise<AccountResponseDto[]> {
    const accounts = await this.accountRepository.findByStatus(status);
    return accounts.map((account) => this.toResponseDto(account));
  }

  /**
   * 搜索账户
   */
  async searchAccounts(query: string): Promise<AccountResponseDto[]> {
    const accounts = await this.accountRepository.search(query);
    return accounts.map((account) => this.toResponseDto(account));
  }

  /**
   * 删除账户（软删除）
   */
  async deleteAccount(id: string): Promise<boolean> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      return false;
    }

    // 执行软删除
    account.disable();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 转换为响应DTO
   */
  private toResponseDto(account: Account): AccountResponseDto {
    return {
      id: account.uuid,
      username: account.username,
      email: account.email?.value,
      phoneNumber: account.phoneNumber?.fullNumber,
      status: account.status,
      accountType: account.accountType,
      isEmailVerified: account.isEmailVerified,
      isPhoneVerified: account.isPhoneVerified,
      lastLoginAt: account.lastLoginAt?.toISOString(),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      user: {
        id: account.user.uuid,
        firstName: account.user.firstName,
        lastName: account.user.lastName,
        displayName: account.user.displayName,
        avatar: account.user.avatar,
        bio: account.user.bio,
        socialAccounts: account.user.socialAccounts,
      },
      roleIds: Array.from(account.roleIds),
    };
  }
}
