import { User } from '@dailyuse/domain-server';
import type { IUserRepository } from '@dailyuse/domain-server';
import { prisma } from '../../../../../config/prisma';

export class PrismaUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    const userData = {
      uuid: user.uuid,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      displayName: user.displayName,
      sex: 2, // 默认设置为 'other'
      avatarUrl: user.avatar,
      bio: user.bio,
      socialAccounts: JSON.stringify(user.socialAccounts || {}),
    };

    await prisma.userProfile.upsert({
      where: { uuid: user.uuid },
      update: userData,
      create: {
        ...userData,
        accountUuid: user.uuid, // 假设 User uuid 和 Account uuid 相同，实际情况可能需要调整
      },
    });
  }

  async findById(uuid: string): Promise<User | null> {
    const userData = await prisma.userProfile.findUnique({
      where: { uuid },
    });

    if (!userData) {
      return null;
    }

    return this.mapToUser(userData);
  }

  async findByAccountUuid(accountUuid: string): Promise<User | null> {
    const userData = await prisma.userProfile.findUnique({
      where: { accountUuid },
    });

    if (!userData) {
      return null;
    }

    return this.mapToUser(userData);
  }

  async findAll(): Promise<User[]> {
    const usersData = await prisma.userProfile.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return usersData.map((data) => this.mapToUser(data));
  }

  async delete(uuid: string): Promise<void> {
    await prisma.userProfile.delete({
      where: { uuid },
    });
  }

  private mapToUser(data: any): User {
    // Parse social accounts
    let socialAccounts = {};
    if (data.socialAccounts) {
      try {
        socialAccounts = JSON.parse(data.socialAccounts);
      } catch (error) {
        console.warn('Failed to parse social accounts:', error);
      }
    }

    return new User({
      uuid: data.uuid,
      firstName: data.firstName,
      lastName: data.lastName,
      avatar: data.avatarUrl,
      bio: data.bio,
      socialAccounts,
    });
  }
}
