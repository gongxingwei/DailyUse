import { Account, User } from '@dailyuse/domain-server';
import type { IAccountRepository } from '@dailyuse/domain-server';
import { AccountStatus, AccountType } from '@dailyuse/domain-core';
import { prisma } from '../../../../../config/prisma';

export class PrismaAccountRepository implements IAccountRepository {
  async save(account: Account): Promise<Account> {
    const accountData = {
      uuid: account.uuid,
      username: account.username,
      email: account.email?.value,
      phone: account.phoneNumber?.fullNumber,
      accountType: this.mapAccountTypeToString(account.accountType),
      status: account.status.toString(),
      roleIds: JSON.stringify(Array.from(account.roleIds)),
      lastLoginAt: account.lastLoginAt,
      emailVerificationToken: account.emailVerificationToken,
      phoneVerificationCode: account.phoneVerificationCode,
      emailVerified: account.isEmailVerified,
      phoneVerified: account.isPhoneVerified,
    };

    // 保存用户配置信息 - 匹配实际的UserProfile schema
    const userProfileData = {
      accountUuid: account.uuid,
      firstName: account.user.firstName || '',
      lastName: account.user.lastName || '',
      displayName: account.user.displayName,
      sex: 2, // 默认设置为 'other'，可以后续由用户更新
      avatarUrl: account.user.avatar,
      bio: account.user.bio,
      socialAccounts: JSON.stringify(account.user.socialAccounts || {}),
    };

    await prisma.$transaction(async (tx) => {
      // 使用 upsert 来处理账户的创建和更新
      await tx.account.upsert({
        where: { uuid: account.uuid },
        create: accountData,
        update: {
          username: accountData.username,
          email: accountData.email,
          phone: accountData.phone,
          accountType: accountData.accountType,
          status: accountData.status,
          roleIds: accountData.roleIds,
          lastLoginAt: accountData.lastLoginAt,
          emailVerificationToken: accountData.emailVerificationToken,
          phoneVerificationCode: accountData.phoneVerificationCode,
          emailVerified: accountData.emailVerified,
          phoneVerified: accountData.phoneVerified,
        },
      });

      // 使用 upsert 来处理用户配置的创建和更新
      await tx.userProfile.upsert({
        where: { accountUuid: account.uuid },
        create: userProfileData,
        update: {
          firstName: userProfileData.firstName,
          lastName: userProfileData.lastName,
          displayName: userProfileData.displayName,
          sex: userProfileData.sex,
          avatarUrl: userProfileData.avatarUrl,
          bio: userProfileData.bio,
          socialAccounts: userProfileData.socialAccounts,
        },
      });
    });

    return account;
  }

  async findById(id: string): Promise<Account | null> {
    const accountData = await prisma.account.findUnique({
      where: { uuid: id },
      include: {
        userProfile: true,
      },
    });

    if (!accountData || !accountData.userProfile) {
      return null;
    }

    return this.mapToAccount(accountData);
  }

  async findByEmail(email: string): Promise<Account | null> {
    const accountData = await prisma.account.findFirst({
      where: { email },
      include: {
        userProfile: true,
      },
    });

    if (!accountData || !accountData.userProfile) {
      return null;
    }

    return this.mapToAccount(accountData);
  }

  async findByUsername(username: string): Promise<Account | null> {
    const accountData = await prisma.account.findFirst({
      where: { username },
      include: {
        userProfile: true,
      },
    });

    if (!accountData || !accountData.userProfile) {
      return null;
    }

    return this.mapToAccount(accountData);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    accounts: Account[];
    total: number;
  }> {
    const offset = (page - 1) * limit;

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        skip: offset,
        take: limit,
        include: {
          userProfile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.account.count(),
    ]);

    return {
      accounts: accounts.map((account) => this.mapToAccount(account)),
      total,
    };
  }

  async findByStatus(status: AccountStatus): Promise<Account[]> {
    const accounts = await prisma.account.findMany({
      where: {
        status: status.toString(),
      },
      include: {
        userProfile: true,
      },
    });

    return accounts.map((account) => this.mapToAccount(account));
  }

  async search(query: string): Promise<Account[]> {
    const accounts = await prisma.account.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          {
            userProfile: {
              OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      include: {
        userProfile: true,
      },
    });

    return accounts.map((account) => this.mapToAccount(account));
  }

  private mapToAccount(accountData: any): Account {
    // Parse social accounts
    let socialAccounts = {};
    if (accountData.userProfile?.socialAccounts) {
      try {
        socialAccounts = JSON.parse(accountData.userProfile.socialAccounts);
      } catch (error) {
        console.warn('Failed to parse social accounts:', error);
      }
    }

    // Parse role IDs
    let roleIds: string[] = [];
    if (accountData.roleIds) {
      try {
        roleIds = JSON.parse(accountData.roleIds);
      } catch (error) {
        console.warn('Failed to parse role IDs:', error);
      }
    }

    const user = new User({
      firstName: accountData.userProfile.firstName || '',
      lastName: accountData.userProfile.lastName || '',
      avatar: accountData.userProfile.avatarUrl,
      bio: accountData.userProfile.bio,
    });

    return Account.fromDTO({
      uuid: accountData.uuid,
      username: accountData.username,
      accountType: this.mapStringToAccountType(accountData.accountType),
      user,
      email: accountData.email,
      phoneNumber: accountData.phone,
      status: this.mapAccountStatus(accountData.status),
      isEmailVerified: accountData.emailVerified,
      isPhoneVerified: accountData.phoneVerified,
      createdAt: accountData.createdAt,
      updatedAt: accountData.updatedAt,
      lastLoginAt: accountData.lastLoginAt,
      roleUuids: roleIds,
    });
  }

  private mapAccountTypeToString(type: AccountType): string {
    switch (type) {
      case AccountType.LOCAL:
        return 'local';
      case AccountType.ADMIN:
        return 'admin';
      case AccountType.GUEST:
        return 'guest';
      default:
        return 'local';
    }
  }

  private mapStringToAccountType(type: string): AccountType {
    switch (type) {
      case 'local':
        return AccountType.LOCAL;
      case 'admin':
        return AccountType.ADMIN;
      case 'guest':
        return AccountType.GUEST;
      default:
        return AccountType.LOCAL;
    }
  }

  private mapAccountStatus(status: string): AccountStatus {
    switch (status) {
      case 'active':
        return AccountStatus.ACTIVE;
      case 'disabled':
        return AccountStatus.DISABLED;
      case 'suspended':
        return AccountStatus.SUSPENDED;
      case 'pending_verification':
        return AccountStatus.PENDING_VERIFICATION;
      default:
        return AccountStatus.ACTIVE;
    }
  }
}
