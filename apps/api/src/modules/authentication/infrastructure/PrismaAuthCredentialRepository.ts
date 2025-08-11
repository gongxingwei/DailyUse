import { AuthCredential } from '@dailyuse/domain-server';
import { prisma } from '../../../config/prisma';
import type { IAuthCredentialRepository } from '@dailyuse/domain-server';

export class PrismaAuthCredentialRepository implements IAuthCredentialRepository {
  async save(credential: AuthCredential): Promise<void> {
    const passwordInfo = credential.getPasswordInfo();

    const credentialData = {
      uuid: credential.uuid,
      accountUuid: credential.accountUuid,
      passwordHash: passwordInfo.hashedValue,
      passwordSalt: passwordInfo.salt,
      passwordAlgorithm: passwordInfo.algorithm,
      passwordCreatedAt: passwordInfo.createdAt,
      passwordExpiresAt: null, // TODO: implement password expiration
      isLocked: credential.isLocked,
      lockReason: credential.isLocked ? 'Too many failed attempts' : null,
      failedAttempts: credential.failedAttempts,
      lastFailedAt: null, // TODO: implement last failed time
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    };

    await prisma.authCredential.upsert({
      where: { accountUuid: credential.accountUuid },
      update: credentialData,
      create: credentialData,
    });
  }

  async findById(uuid: string): Promise<AuthCredential | null> {
    const credentialData = await prisma.authCredential.findUnique({
      where: { uuid },
    });

    if (!credentialData) {
      return null;
    }

    return this.mapToAuthCredential(credentialData);
  }

  async findByAccountUuid(accountUuid: string): Promise<AuthCredential | null> {
    const credentialData = await prisma.authCredential.findFirst({
      where: { accountUuid },
    });

    if (!credentialData) {
      return null;
    }

    return this.mapToAuthCredential(credentialData);
  }

  async findByUsername(username: string): Promise<AuthCredential | null> {
    const credentialData = await prisma.authCredential.findFirst({
      where: {
        account: {
          username,
        },
      },
      include: {
        account: true,
      },
    });

    if (!credentialData) {
      return null;
    }

    return this.mapToAuthCredential(credentialData);
  }

  async delete(uuid: string): Promise<void> {
    await prisma.authCredential.delete({
      where: { uuid },
    });
  }

  async findAll(): Promise<AuthCredential[]> {
    const credentialsData = await prisma.authCredential.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return credentialsData.map((data) => this.mapToAuthCredential(data));
  }

  async existsByAccountUuid(accountUuid: string): Promise<boolean> {
    const count = await prisma.authCredential.count({
      where: { accountUuid },
    });

    return count > 0;
  }

  private mapToAuthCredential(data: any): AuthCredential {
    return AuthCredential.fromPersistence({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      passwordHash: data.passwordHash,
      passwordSalt: data.passwordSalt,
      failedAttempts: data.failedAttempts,
      lockedUntil: data.lockedUntil,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
