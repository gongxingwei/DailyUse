import { User } from '@dailyuse/domain-server';
import type { IUserRepository } from '@dailyuse/domain-server';
import { AccountContracts } from '@dailyuse/contracts';
import { prisma } from '../../../../../config/prisma';

type UserProfilePersistenceDTO = AccountContracts.UserProfilePersistenceDTO;

export class PrismaUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    const userData = user.toPersistence();

    await prisma.userProfile.upsert({
      where: { uuid: user.uuid },
      update: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: userData.displayName,
        sex: userData.sex,
        avatarUrl: userData.avatarUrl,
        bio: userData.bio,
        socialAccounts: userData.socialAccounts,
        updatedAt: new Date(userData.updatedAt),
      },
      create: {
        uuid: userData.uuid,
        account: {
          connect: { uuid: (user as any).accountUuid || '' }, // Connect to existing account
        },
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        displayName: userData.displayName,
        sex: userData.sex || 0,
        avatarUrl: userData.avatarUrl,
        bio: userData.bio,
        socialAccounts: userData.socialAccounts,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.updatedAt),
      },
    });
  }

  async findById(uuid: string): Promise<UserProfilePersistenceDTO | null> {
    const userData = await prisma.userProfile.findUnique({
      where: { uuid },
    });

    if (!userData) {
      return null;
    }

    return this.mapToPersistenceDTO(userData);
  }

  async findByAccountUuid(accountUuid: string): Promise<UserProfilePersistenceDTO | null> {
    const userData = await prisma.userProfile.findUnique({
      where: { accountUuid },
    });

    if (!userData) {
      return null;
    }

    return this.mapToPersistenceDTO(userData);
  }

  async findAll(): Promise<UserProfilePersistenceDTO[]> {
    const usersData = await prisma.userProfile.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return usersData.map((data) => this.mapToPersistenceDTO(data));
  }

  async delete(uuid: string): Promise<void> {
    await prisma.userProfile.delete({
      where: { uuid },
    });
  }

  /**
   * 将数据库原始数据映射为持久化 DTO
   * 仅负责数据格式转换，不包含业务逻辑
   */
  private mapToPersistenceDTO(data: any): UserProfilePersistenceDTO {
    return {
      uuid: data.uuid,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: data.displayName,
      sex: data.sex,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      socialAccounts: data.socialAccounts,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : data.createdAt.getTime(),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : data.updatedAt.getTime(),
    };
  }
}
