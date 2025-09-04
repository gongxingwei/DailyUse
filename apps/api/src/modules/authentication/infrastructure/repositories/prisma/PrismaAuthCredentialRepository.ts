import { AuthCredential } from '@dailyuse/domain-server';
import { prisma } from '../../../../../config/prisma';
import type { IAuthCredentialRepository } from '@dailyuse/domain-server';
import type { Session } from '@dailyuse/domain-server';
import type { Token } from '@dailyuse/domain-server';
import type { MFADevice } from '@dailyuse/domain-server';
import type { AuthCredentialPersistenceDTO } from '@dailyuse/contracts';

export class PrismaAuthCredentialRepository implements IAuthCredentialRepository {
  async save(credential: AuthCredential): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. 保存聚合根 AuthCredential
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

      await tx.authCredential.upsert({
        where: { accountUuid: credential.accountUuid },
        update: credentialData,
        create: credentialData,
      });

      // 2. 同步保存 Sessions（聚合子实体）
      await this.saveSessions(tx, credential);

      // 3. 同步保存 Tokens（聚合子实体）
      await this.saveTokens(tx, credential);

      // 4. 同步保存 MFA Devices（聚合子实体）
      await this.saveMFADevices(tx, credential);
    });
  }

  /**
   * 在事务中保存会话数据，保持与聚合状态一致
   */
  private async saveSessions(tx: any, credential: AuthCredential): Promise<void> {
    const sessions = Array.from(credential.sessions.values());

    // 获取数据库中已存在的会话
    const existingSessionIds = (
      await tx.userSession.findMany({
        where: { accountUuid: credential.accountUuid },
        select: { sessionId: true },
      })
    ).map((s: any) => s.sessionId);

    // 当前聚合中的会话 ID
    const currentSessionIds = sessions.map((s) => (s as any).token);

    // 删除数据库中已不存在于聚合中的会话
    const sessionsToDelete = existingSessionIds.filter(
      (id: string) => !currentSessionIds.includes(id),
    );
    if (sessionsToDelete.length > 0) {
      await tx.userSession.deleteMany({
        where: { sessionId: { in: sessionsToDelete } },
      });
    }

    // upsert 聚合中的所有会话
    for (const session of sessions) {
      const sessionData = this.mapSessionToPersistence(session as any);
      await tx.userSession.upsert({
        where: { sessionId: sessionData.sessionId },
        update: sessionData,
        create: sessionData,
      });
    }
  }

  /**
   * 在事务中保存令牌数据，保持与聚合状态一致
   */
  private async saveTokens(tx: any, credential: AuthCredential): Promise<void> {
    const tokens = Array.from(credential.tokens.values());

    // 获取数据库中已存在的令牌
    const existingTokenValues = (
      await tx.authToken.findMany({
        where: { accountUuid: credential.accountUuid },
        select: { tokenValue: true },
      })
    ).map((t: any) => t.tokenValue);

    // 当前聚合中的令牌值
    const currentTokenValues = tokens.map((t) => (t as any).value);

    // 删除数据库中已不存在于聚合中的令牌
    const tokensToDelete = existingTokenValues.filter(
      (value: string) => !currentTokenValues.includes(value),
    );
    if (tokensToDelete.length > 0) {
      await tx.authToken.deleteMany({
        where: { tokenValue: { in: tokensToDelete } },
      });
    }

    // upsert 聚合中的所有令牌
    for (const token of tokens) {
      const tokenData = this.mapTokenToPersistence(token as any);
      await tx.authToken.upsert({
        where: { tokenValue: tokenData.tokenValue },
        update: tokenData,
        create: tokenData,
      });
    }
  }

  /**
   * 在事务中保存 MFA 设备数据，保持与聚合状态一致
   */
  private async saveMFADevices(tx: any, credential: AuthCredential): Promise<void> {
    const mfaDevices = Array.from(credential.mfaDevices.values());

    // 获取数据库中已存在的 MFA 设备
    const existingDeviceUuids = (
      await tx.MFADevice.findMany({
        where: { accountUuid: credential.accountUuid },
        select: { uuid: true },
      })
    ).map((d: any) => d.uuid);

    // 当前聚合中的 MFA 设备 UUID
    const currentDeviceUuids = mfaDevices.map((d) => d.uuid);

    // 删除数据库中已不存在于聚合中的设备
    const devicesToDelete = existingDeviceUuids.filter(
      (uuid: string) => !currentDeviceUuids.includes(uuid),
    );
    if (devicesToDelete.length > 0) {
      await tx.MFADevice.deleteMany({
        where: { uuid: { in: devicesToDelete } },
      });
    }

    // upsert 聚合中的所有 MFA 设备
    for (const device of mfaDevices) {
      const deviceData = this.mapMFADeviceToPersistence(device as any);
      await tx.MFADevice.upsert({
        where: { uuid: deviceData.uuid },
        update: deviceData,
        create: deviceData,
      });
    }
  }

  /**
   * 映射会话对象到持久化数据
   */
  private mapSessionToPersistence(session: Session): any {
    return {
      uuid: session.uuid,
      accountUuid: session.accountUuid,
      sessionId: (session as any).token,
      accessToken: (session as any).token,
      refreshToken: null, // TODO: implement refresh token
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      userAgent: (session as any).userAgent || null,
      isActive: session.isActive,
      createdAt: session.createdAt,
      lastAccessedAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * 映射令牌对象到持久化数据
   */
  private mapTokenToPersistence(token: Token): any {
    return {
      uuid: crypto.randomUUID(), // 生成新的 UUID，因为 Token 使用 value 作为主键
      accountUuid: token.accountUuid,
      tokenValue: token.value,
      tokenType: token.type.toLowerCase(),
      issuedAt: token.issuedAt,
      expiresAt: token.expiresAt,
      isRevoked: token.isRevoked,
      revokeReason: token.isRevoked ? 'User revoked' : null,
      metadata: JSON.stringify({
        deviceInfo: token.deviceInfo,
      }),
    };
  }

  /**
   * 映射 MFA 设备对象到持久化数据
   */
  private mapMFADeviceToPersistence(device: MFADevice): any {
    return {
      uuid: device.uuid,
      accountUuid: (device as any).accountUuid,
      type: (device as any).type,
      name: (device as any).name,
      secretKey: (device as any).secretKey || null,
      phoneNumber: (device as any).phoneNumber || null,
      emailAddress: (device as any).emailAddress || null,
      backupCodes: (device as any).backupCodes ? JSON.stringify((device as any).backupCodes) : null,
      isVerified: (device as any).isVerified || false,
      isEnabled: (device as any).isEnabled || false,
      verificationAttempts: (device as any).verificationAttempts || 0,
      maxAttempts: (device as any).maxAttempts || 5,
      createdAt: (device as any).createdAt || new Date(),
      lastUsedAt: (device as any).lastUsedAt || null,
    };
  }

  async findById(uuid: string): Promise<AuthCredentialPersistenceDTO | null> {
    const credentialData = await prisma.authCredential.findUnique({
      where: { uuid },
      include: {
        account: {
          include: {
            sessions: {
              where: { isActive: true },
            },
            tokens: {
              where: {
                isRevoked: false,
                expiresAt: { gt: new Date() },
              },
            },
            mfaDevices: true,
          },
        },
      },
    });

    if (!credentialData) {
      return null;
    }

    return this.mapToPersistenceDTO(credentialData);
  }

  async findByAccountUuid(accountUuid: string): Promise<AuthCredentialPersistenceDTO | null> {
    const credentialData = await prisma.authCredential.findFirst({
      where: { accountUuid },
      include: {
        account: {
          include: {
            sessions: {
              where: { isActive: true },
            },
            tokens: {
              where: {
                isRevoked: false,
                expiresAt: { gt: new Date() },
              },
            },
            mfaDevices: true,
          },
        },
      },
    });

    if (!credentialData) {
      return null;
    }

    return this.mapToPersistenceDTO(credentialData);
  }

  async findByUsername(username: string): Promise<AuthCredentialPersistenceDTO | null> {
    const credentialData = await prisma.authCredential.findFirst({
      where: {
        account: {
          username,
        },
      },
      include: {
        account: {
          include: {
            sessions: {
              where: { isActive: true },
            },
            tokens: {
              where: {
                isRevoked: false,
                expiresAt: { gt: new Date() },
              },
            },
            mfaDevices: true,
          },
        },
      },
    });

    if (!credentialData) {
      return null;
    }

    return this.mapToPersistenceDTO(credentialData);
  }

  async delete(uuid: string): Promise<void> {
    await prisma.authCredential.delete({
      where: { uuid },
    });
  }

  async findAll(): Promise<AuthCredentialPersistenceDTO[]> {
    const credentialsData = await prisma.authCredential.findMany({
      include: {
        account: {
          include: {
            sessions: {
              where: { isActive: true },
            },
            tokens: {
              where: {
                isRevoked: false,
                expiresAt: { gt: new Date() },
              },
            },
            mfaDevices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return credentialsData.map((data) => this.mapToPersistenceDTO(data));
  }

  async existsByAccountUuid(accountUuid: string): Promise<boolean> {
    const count = await prisma.authCredential.count({
      where: { accountUuid },
    });

    return count > 0;
  }

  /**
   * 将数据库原始数据映射为持久化 DTO
   * 仅负责数据格式转换，不包含业务逻辑
   */
  private mapToPersistenceDTO(data: any): AuthCredentialPersistenceDTO {
    return {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      passwordHash: data.passwordHash,
      passwordSalt: data.passwordSalt,
      passwordAlgorithm: data.passwordAlgorithm,
      passwordCreatedAt: data.passwordCreatedAt,
      passwordExpiresAt: data.passwordExpiresAt,
      isLocked: data.isLocked,
      lockReason: data.lockReason,
      failedAttempts: data.failedAttempts,
      lastFailedAt: data.lastFailedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      sessions:
        data.account?.sessions?.map((sessionData: any) => ({
          uuid: sessionData.uuid,
          accountUuid: sessionData.accountUuid,
          sessionId: sessionData.sessionId,
          accessToken: sessionData.accessToken,
          refreshToken: sessionData.refreshToken,
          deviceInfo: sessionData.deviceInfo,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
          isActive: sessionData.isActive,
          createdAt: sessionData.createdAt,
          lastAccessedAt: sessionData.lastAccessedAt,
          expiresAt: sessionData.expiresAt,
        })) || [],
      tokens:
        data.account?.tokens?.map((tokenData: any) => ({
          uuid: tokenData.uuid,
          accountUuid: tokenData.accountUuid,
          tokenValue: tokenData.tokenValue,
          tokenType: tokenData.tokenType,
          issuedAt: tokenData.issuedAt,
          expiresAt: tokenData.expiresAt,
          isRevoked: tokenData.isRevoked,
          revokeReason: tokenData.revokeReason,
          metadata: tokenData.metadata,
          createdAt: tokenData.createdAt,
          updatedAt: tokenData.updatedAt,
        })) || [],
      mfaDevices:
        data.account?.mfaDevices?.map((deviceData: any) => ({
          uuid: deviceData.uuid,
          accountUuid: deviceData.accountUuid,
          type: deviceData.type,
          name: deviceData.name,
          secretKey: deviceData.secretKey,
          phoneNumber: deviceData.phoneNumber,
          emailAddress: deviceData.emailAddress,
          backupCodes: deviceData.backupCodes,
          isVerified: deviceData.isVerified,
          isEnabled: deviceData.isEnabled,
          verificationAttempts: deviceData.verificationAttempts,
          maxAttempts: deviceData.maxAttempts,
          createdAt: deviceData.createdAt,
          lastUsedAt: deviceData.lastUsedAt,
        })) || [],
    };
  }
}
