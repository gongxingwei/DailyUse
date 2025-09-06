import { Account, User } from '@dailyuse/domain-server';
import type { IAccountRepository } from '@dailyuse/domain-server';
import { AccountStatus, AccountType } from '@dailyuse/domain-core';
import type { AccountPersistenceDTO } from '@dailyuse/contracts';
import { prisma } from '../../../../../config/prisma';

export class PrismaAccountRepository implements IAccountRepository {
  async save(account: Account): Promise<void> {
    const rawAccountData = account.toPersistence();

    // 准备账户数据 - 移除不存在于数据库schema中的字段
    const accountData = {
      uuid: rawAccountData.uuid,
      username: rawAccountData.username,
      email: rawAccountData.email,
      phone: rawAccountData.phoneNumber,
      accountType: rawAccountData.accountType,
      status: rawAccountData.status,
      createdAt: rawAccountData.createdAt,
      updatedAt: rawAccountData.updatedAt,
      lastLoginAt: rawAccountData.lastLoginAt,
      emailVerificationToken: rawAccountData.emailVerificationToken,
      phoneVerificationCode: rawAccountData.phoneVerificationCode,
      roleIds: JSON.stringify(rawAccountData.roleUuids),
      emailVerified: rawAccountData.isEmailVerified,
      phoneVerified: rawAccountData.isPhoneVerified,
    };

    // 保存用户配置信息 - 匹配实际的UserProfile schema
    const userProfileData = {
      uuid: rawAccountData.user.uuid,
      accountUuid: account.uuid,
      firstName: rawAccountData.user.firstName || '',
      lastName: rawAccountData.user.lastName || '',
      displayName: rawAccountData.user.displayName,
      sex: rawAccountData.user.sex ?? 2, // 默认设置为 'other'，可以后续由用户更新
      avatarUrl: rawAccountData.user.avatarUrl,
      bio: rawAccountData.user.bio,
      socialAccounts: JSON.stringify(rawAccountData.user.socialAccounts || {}),
      // 如果有地址信息，将其作为location字符串存储
      location: rawAccountData.address
        ? `${rawAccountData.address.street}, ${rawAccountData.address.city}, ${rawAccountData.address.state}, ${rawAccountData.address.country} ${rawAccountData.address.postalCode}`.trim()
        : undefined,
    };

    await prisma.$transaction(async (tx) => {
      // 首先检查是否是新账户（通过uuid）还是现有账户（通过username）
      const existingAccount = await tx.account.findFirst({
        where: {
          OR: [{ uuid: account.uuid }, { username: account.username }],
        },
      });

      if (existingAccount && existingAccount.uuid !== account.uuid) {
        // 如果找到了不同uuid但相同用户名的账户，说明用户名冲突
        throw new Error(`用户名 "${account.username}" 已被使用`);
      }

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
          location: userProfileData.location,
        },
      });
    });
  }

  async findById(id: string): Promise<AccountPersistenceDTO | null> {
    const accountData = await prisma.account.findUnique({
      where: { uuid: id },
      include: {
        userProfile: true,
      },
    });

    if (!accountData || !accountData.userProfile) {
      return null;
    }

    return this.mapToPersistenceDTO(accountData);
  }

  async findByEmail(email: string): Promise<AccountPersistenceDTO | null> {
    const accountData = await prisma.account.findFirst({
      where: { email },
      include: {
        userProfile: true,
      },
    });

    if (!accountData || !accountData.userProfile) {
      return null;
    }

    return this.mapToPersistenceDTO(accountData);
  }

  async findByUsername(username: string): Promise<AccountPersistenceDTO | null> {
    const accountData = await prisma.account.findFirst({
      where: { username },
      include: {
        userProfile: true,
      },
    });

    if (!accountData || !accountData.userProfile) {
      return null;
    }

    return this.mapToPersistenceDTO(accountData);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    accounts: AccountPersistenceDTO[];
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
      accounts: accounts.map((account) => this.mapToPersistenceDTO(account)),
      total,
    };
  }

  async findByStatus(status: string): Promise<AccountPersistenceDTO[]> {
    const accounts = await prisma.account.findMany({
      where: {
        status: status,
      },
      include: {
        userProfile: true,
      },
    });

    return accounts.map((account) => this.mapToPersistenceDTO(account));
  }

  async search(query: string): Promise<AccountPersistenceDTO[]> {
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

    return accounts.map((account) => this.mapToPersistenceDTO(account));
  }

  /**
   * 将数据库原始数据映射为持久化 DTO
   * 仅负责数据格式转换，不包含业务逻辑
   */
  private mapToPersistenceDTO(accountData: any): AccountPersistenceDTO {
    return {
      uuid: accountData.uuid,
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
      createdAt: accountData.createdAt,
      updatedAt: accountData.updatedAt,
      userProfile: accountData.userProfile
        ? {
            uuid: accountData.userProfile.uuid,
            accountUuid: accountData.userProfile.accountUuid,
            firstName: accountData.userProfile.firstName,
            lastName: accountData.userProfile.lastName,
            displayName: accountData.userProfile.displayName,
            sex: accountData.userProfile.sex,
            avatarUrl: accountData.userProfile.avatarUrl,
            bio: accountData.userProfile.bio,
            socialAccounts: accountData.userProfile.socialAccounts,
            createdAt: accountData.userProfile.createdAt,
            updatedAt: accountData.userProfile.updatedAt,
          }
        : undefined,
    };
  }

  private mapAccountTypeToString(type: AccountType): string {
    switch (type) {
      case AccountType.LOCAL:
        return 'local';
      case AccountType.ONLINE:
        return 'online';
      case AccountType.GUEST:
        return 'guest';
      default:
        return 'local';
    }
  }
}
