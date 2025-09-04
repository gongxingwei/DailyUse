import { Session } from '@dailyuse/domain-server';
import { prisma } from '../../../../../config/prisma';
import type { ISessionRepository } from '@dailyuse/domain-server';
import type { ClientInfo } from '@dailyuse/domain-core';
import type { UserSessionPersistenceDTO } from '@dailyuse/contracts';

/**
 * Prisma Session Repository - 处理独立的 Session 操作
 * 注意：在 DDD 中，Session 作为 AuthCredential 聚合的一部分，
 * 主要的持久化应该通过 AuthCredential 聚合根来处理。
 * 这个仓储主要用于查询和独立的 Session 操作。
 */
export class PrismaSessionRepository implements ISessionRepository {
  async save(session: Session): Promise<void> {
    const sessionData = this.mapSessionToPersistence(session);

    await prisma.userSession.upsert({
      where: { sessionId: session.token },
      update: {
        deviceInfo: sessionData.deviceInfo,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        isActive: sessionData.isActive,
        lastAccessedAt: sessionData.lastAccessedAt,
        expiresAt: sessionData.expiresAt,
      },
      create: sessionData,
    });
  }

  async findById(sessionId: string): Promise<UserSessionPersistenceDTO | null> {
    const sessionData = await prisma.userSession.findUnique({
      where: { sessionId },
    });

    if (!sessionData) {
      return null;
    }

    return this.mapToPersistenceDTO(sessionData);
  }

  async findByUuid(sessionUuid: string): Promise<Session | null> {
    const sessionData = await prisma.userSession.findUnique({
      where: { uuid: sessionUuid },
    });

    if (!sessionData) {
      return null;
    }

    return this.mapToSession(sessionData);
  }

  async findByAccountUuid(accountUuid: string): Promise<UserSessionPersistenceDTO[]> {
    return this.findAllByAccountUuid(accountUuid);
  }

  async findAllByAccountUuid(accountUuid: string): Promise<UserSessionPersistenceDTO[]> {
    const sessionsData = await prisma.userSession.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });

    return sessionsData.map((data) => this.mapToPersistenceDTO(data));
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<UserSessionPersistenceDTO[]> {
    const sessionsData = await prisma.userSession.findMany({
      where: {
        accountUuid,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastAccessedAt: 'desc' },
    });

    return sessionsData.map((data) => this.mapToPersistenceDTO(data));
  }

  async terminateSession(sessionId: string): Promise<void> {
    await prisma.userSession.update({
      where: { sessionId },
      data: {
        isActive: false,
      },
    });
  }

  async terminateAllByAccount(accountUuid: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { accountUuid },
      data: { isActive: false },
    });
  }

  async updateLastAccessed(sessionId: string): Promise<void> {
    await prisma.userSession.update({
      where: { sessionId },
      data: { lastAccessedAt: new Date() },
    });
  }

  async delete(sessionId: string): Promise<void> {
    await prisma.userSession.delete({
      where: { sessionId },
    });
  }

  async deleteByUuid(sessionUuid: string): Promise<void> {
    await prisma.userSession.delete({
      where: { uuid: sessionUuid },
    });
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { accountUuid },
    });
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isActive: false,
            createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7天前的非活跃会话
          },
        ],
      },
    });

    return result.count;
  }

  /**
   * 映射 Session 对象到持久化数据
   */
  private mapSessionToPersistence(session: Session): any {
    return {
      uuid: session.uuid,
      accountUuid: session.accountUuid,
      sessionId: session.token,
      accessToken: session.token,
      refreshToken: null, // TODO: implement refresh tokens if needed
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      isActive: session.isActive,
      createdAt: session.createdAt,
      lastAccessedAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * 将数据库原始数据映射为持久化 DTO
   * 仅负责数据格式转换，不包含业务逻辑
   */
  private mapToPersistenceDTO(data: any): UserSessionPersistenceDTO {
    return {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      sessionId: data.sessionId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      isActive: data.isActive,
      createdAt: data.createdAt,
      lastAccessedAt: data.lastAccessedAt,
      expiresAt: data.expiresAt,
    };
  }

  private mapToSession(data: any): Session {
    // 使用静态工厂方法创建 Session
    const clientInfo: ClientInfo = {
      deviceId: data.deviceInfo,
      deviceName: 'unknown',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    };

    const session = Session.create({
      accountUuid: data.accountUuid,
      clientInfo: clientInfo,
    });

    // 手动设置从数据库加载的属性
    // 注意：这种做法不是最理想的，更好的方式是在 Session 类中提供 fromPersistence 静态方法
    (session as any)._uuid = data.uuid;
    (session as any)._token = data.sessionId;
    (session as any)._createdAt = data.createdAt;
    (session as any)._lastActiveAt = data.lastAccessedAt;
    (session as any)._expiresAt = data.expiresAt;
    (session as any)._isActive = data.isActive;

    return session;
  }
}
