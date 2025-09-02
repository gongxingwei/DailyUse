import { AuthCredential } from '@dailyuse/domain-server';
import { prisma } from '../../../../../config/prisma';
import type { IAuthCredentialRepository } from '@dailyuse/domain-server';
import type { Session } from '@dailyuse/domain-server';
import type { Token } from '@dailyuse/domain-server';
import type { MFADevice } from '@dailyuse/domain-server';

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
      await tx.mfaDevice.findMany({
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
      await tx.mfaDevice.deleteMany({
        where: { uuid: { in: devicesToDelete } },
      });
    }

    // upsert 聚合中的所有 MFA 设备
    for (const device of mfaDevices) {
      const deviceData = this.mapMFADeviceToPersistence(device as any);
      await tx.mfaDevice.upsert({
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
    // 创建基本的 AuthCredential
    const credential = AuthCredential.fromPersistence({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      passwordHash: data.passwordHash,
      passwordSalt: data.passwordSalt,
      failedAttempts: data.failedAttempts,
      lockedUntil: data.lockedUntil,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    // 如果有关联的账户数据，重建子实体
    if (data.account) {
      // 重建 Sessions
      if (data.account.sessions) {
        for (const sessionData of data.account.sessions) {
          const session = this.mapToSession(sessionData);
          credential.sessions.set(session.uuid, session as any);
        }
      }

      // 重建 Tokens
      if (data.account.tokens) {
        for (const tokenData of data.account.tokens) {
          const token = this.mapToToken(tokenData);
          credential.tokens.set(token.value, token as any);
        }
      }

      // 重建 MFA Devices
      if (data.account.mfaDevices) {
        for (const deviceData of data.account.mfaDevices) {
          const device = this.mapToMFADevice(deviceData);
          credential.mfaDevices.set(device.uuid, device as any);
        }
      }
    }

    return credential;
  }

  /**
   * 从持久化数据重建 Session 对象
   */
  private mapToSession(data: any): Session {
    // 由于我们需要导入 Session，先创建一个临时实现
    // 实际中需要根据 Session 的具体构造函数调整
    return {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      token: data.sessionId,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      isActive: data.isActive,
      createdAt: data.createdAt,
      lastActiveAt: data.lastAccessedAt,
      expiresAt: data.expiresAt,
    } as any;
  }

  /**
   * 从持久化数据重建 Token 对象
   */
  private mapToToken(data: any): Token {
    // 使用 Token.fromPersistence 方法
    return {
      value: data.tokenValue,
      type: data.tokenType,
      accountUuid: data.accountUuid,
      issuedAt: data.issuedAt,
      expiresAt: data.expiresAt,
      deviceInfo: data.metadata ? JSON.parse(data.metadata).deviceInfo : undefined,
      isRevoked: data.isRevoked,
    } as any;
  }

  /**
   * 从持久化数据重建 MFADevice 对象
   */
  private mapToMFADevice(data: any): MFADevice {
    return {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      type: data.type,
      name: data.name,
      secretKey: data.secretKey,
      phoneNumber: data.phoneNumber,
      emailAddress: data.emailAddress,
      backupCodes: data.backupCodes ? JSON.parse(data.backupCodes) : undefined,
      isVerified: data.isVerified,
      isEnabled: data.isEnabled,
      verificationAttempts: data.verificationAttempts,
      maxAttempts: data.maxAttempts,
      createdAt: data.createdAt,
      lastUsedAt: data.lastUsedAt,
    } as any;
  }
}
