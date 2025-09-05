import { User } from '@dailyuse/domain-server';
import type { IUserRepository } from '@dailyuse/domain-server';
import type { UserProfilePersistenceDTO } from '@dailyuse/contracts';
import { prisma } from '../../../../../config/prisma';

export class PrismaUserRepository implements IUserRepository {
  async save(user: User, accountUuid: string): Promise<void> {
    const userData = user.toPersistence(accountUuid);

    await prisma.userProfile.upsert({
      where: { uuid: user.uuid },
      update: userData,
      create: {
        ...userData,
        accountUuid,
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
      accountUuid: data.accountUuid,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: data.displayName,
      sex: data.sex,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      socialAccounts: data.socialAccounts,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
