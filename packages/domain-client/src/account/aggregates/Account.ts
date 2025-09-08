import { AccountCore, type IUserCore, AccountType } from '@dailyuse/domain-core';
import { type IAccountClient } from '../types';
import { User } from '../entities/User';
import { Email } from '../valueObjects/Email';
import { PhoneNumber } from '../valueObjects/PhoneNumber';
import { Address } from '../valueObjects/Address';
import { type AccountDTO } from '@dailyuse/domain-core';

/**
 * 客户端账户聚合根 - 包含UI相关的账户管理
 */
export class Account extends AccountCore implements IAccountClient {
  constructor(params: {
    uuid?: string;
    username: string;
    accountType: AccountType;
    user: User;
    email?: Email;
    phoneNumber?: PhoneNumber;
    address?: Address;
    roleUuids?: Set<string>;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    // 将具体类型转换为接口类型传递给父构造函数
    const coreParams = {
      ...params,
      email: params.email as any,
      phoneNumber: params.phoneNumber as any,
      address: params.address as any,
      user: params.user as any,
    };
    super(coreParams);
  }

  // ===== 实现抽象方法 =====
  updateEmail(emailAddress: string): void {
    const newEmail = new Email(emailAddress);
    (this as any)._email = newEmail;
    (this as any)._updatedAt = new Date();
    this.cacheAccountData();
  }

  updatePhone(phoneNumber: string, countryCode?: string): void {
    const newPhone = new PhoneNumber(phoneNumber, countryCode);
    (this as any)._phoneNumber = newPhone;
    (this as any)._updatedAt = new Date();
    this.cacheAccountData();
  }

  verifyEmail(): void {
    if (this.email) {
      (this.email as Email).showVerificationDialog().then((success) => {
        if (success) {
          (this as any)._isEmailVerified = true;
          console.log('Email verification successful');
          this.cacheAccountData();
        }
      });
    }
  }

  verifyPhone(): void {
    if (this.phoneNumber) {
      (this.phoneNumber as PhoneNumber).showVerificationDialog().then((success) => {
        if (success) {
          (this as any)._isPhoneVerified = true;
          console.log('Phone verification successful');
          this.cacheAccountData();
        }
      });
    }
  }

  // ===== IAccountClient 方法 =====
  showProfile(): void {
    // 显示用户资料界面
    console.log(`Showing profile for account: ${this.username}`);
    // 这里可以触发UI组件显示用户资料

    const profileData = {
      username: this.username,
      email: this.email?.value,
      phoneNumber: this.phoneNumber?.value,
      address: this.address ? (this.address as Address).formatForDisplay() : null,
      user: {
        uuid: this.user.uuid,
        displayName: this.user.displayName,
        avatar: (this.user as User).displayAvatar(),
      },
    };

    console.log('Profile data:', profileData);
  }

  updateProfileInUI(data: any): void {
    // 在UI中更新资料信息
    console.log('Updating profile in UI:', data);

    // 这里可以更新UI组件的显示
    if (data.email && data.email !== this.email?.value) {
      console.log('Email updated in UI');
    }

    if (data.phoneNumber && data.phoneNumber !== this.phoneNumber?.value) {
      console.log('Phone number updated in UI');
    }

    // 触发UI重新渲染
    this.cacheAccountData();
  }

  cacheAccountData(): void {
    // 缓存账户数据到本地存储
    const accountData = {
      uuid: this.uuid,
      username: this.username,
      email: this.email?.value,
      phoneNumber: this.phoneNumber?.value,
      address: this.address ? (this.address as Address).formatForDisplay() : null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      user: {
        uuid: this.user.uuid,
        displayName: this.user.displayName,
      },
    };

    localStorage.setItem(`account_${this.uuid}`, JSON.stringify(accountData));
    console.log('Account data cached');
  }

  async syncWithServer(): Promise<boolean> {
    // 与服务器同步账户信息
    try {
      console.log('Syncing account with server...');

      // 模拟与服务器同步的过程
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('Account synced successfully');
          this.cacheAccountData();
          resolve(true);
        }, 1000);
      });
    } catch (error) {
      console.error('Failed to sync with server:', error);
      return false;
    }
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 客户端特定的业务方法 =====
  getActiveUsers(): User[] {
    // AccountCore 只有一个 user 属性，不是 users 集合
    return [this.user as User];
  }

  getUserByRole(roleName: string): User[] {
    // 检查单个用户是否有指定角色
    const user = this.user as User;
    if (user.hasRole && user.hasRole(roleName)) {
      return [user];
    }
    return [];
  }

  displayAccountSummary(): string {
    const user = this.user as User;
    const userInfo = user.displayName;
    const email = this.email?.value || 'No email';

    return `账户: ${this.username} | 用户: ${userInfo} | 邮箱: ${email}`;
  }

  // ===== DTO方法
  static fromDTO(dto: AccountDTO): Account {
    const account = new Account({
      uuid: dto.uuid,
      username: dto.username,
      accountType: dto.accountType,
      roleUuids: new Set(dto.roleIds || []),
      email: dto.email ? new Email(dto.email) : undefined,
      phoneNumber: dto.phone ? new PhoneNumber(dto.phone) : undefined,
      address: undefined,
      user: User.fromDTO(dto.user),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });

    return account;
  }

  // ===== 静态工厂方法 =====
  static fromCache(uuid: string): Account | null {
    try {
      const cachedData = localStorage.getItem(`account_${uuid}`);
      if (!cachedData) return null;

      const data = JSON.parse(cachedData);

      // 这里需要完整恢复账户对象，为简化示例返回null
      // 实际实现中需要恢复所有关联对象
      console.log('Account data found in cache:', data);
      return null;
    } catch (error) {
      console.error('Failed to load account from cache:', error);
      return null;
    }
  }

  static create(params: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  }): Account {
    const email = new Email(params.email);
    const phoneNumber = params.phoneNumber ? new PhoneNumber(params.phoneNumber) : undefined;
    const address = params.address ? new Address(params.address) : undefined;

    // 创建用户
    const user = User.create({
      firstName: params.firstName,
      lastName: params.lastName,
    });

    const account = new Account({
      username: params.username,
      accountType: AccountType.LOCAL, // 默认为本地账户
      user,
      email,
      phoneNumber,
      address,
    });

    // 自动缓存新创建的账户
    account.cacheAccountData();

    return account;
  }
}
