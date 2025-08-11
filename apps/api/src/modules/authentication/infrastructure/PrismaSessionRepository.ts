import { Session } from '@dailyuse/domain-server';
import { prisma } from '../../../config/prisma';
import type { ISessionRepository } from '@dailyuse/domain-server';

export class PrismaSessionRepository implements ISessionRepository {
  async save(session: Session): Promise<void> {
    const sessionData = {
      uuid: session.uuid,
      accountUuid: session.accountUuid,
      sessionId: session.token, // SessionCore uses token as session identifier
      accessToken: session.token,
      refreshToken: null, // TODO: implement refresh tokens
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      isActive: session.isActive,
      createdAt: session.createdAt,
      lastAccessedAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
    };

    await prisma.userSession.upsert({
      where: { sessionId: session.token },
      update: sessionData,
      create: sessionData,
    });
  }

  async findById(sessionId: string): Promise<Session | null> {
    const sessionData = await prisma.userSession.findUnique({
      where: { sessionId },
    });

    if (!sessionData) {
      return null;
    }

    return this.mapToSession(sessionData);
  }

  async findByAccountUuid(accountUuid: string): Promise<Session[]> {
    const sessionsData = await prisma.userSession.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });

    return sessionsData.map((data) => this.mapToSession(data));
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<Session[]> {
    const sessionsData = await prisma.userSession.findMany({
      where: {
        accountUuid,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastAccessedAt: 'desc' },
    });

    return sessionsData.map((data) => this.mapToSession(data));
  }

  async delete(sessionId: string): Promise<void> {
    await prisma.userSession.delete({
      where: { sessionId },
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
        OR: [{ expiresAt: { lt: new Date() } }, { isActive: false }],
      },
    });

    return result.count;
  }

  private mapToSession(data: any): Session {
    // Create using the static create method
    const session = Session.create({
      accountUuid: data.accountUuid,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    // Manually set the properties that can't be set through constructor
    (session as any)._uuid = data.uuid;
    (session as any)._token = data.sessionId;
    (session as any)._createdAt = data.createdAt;
    (session as any)._lastActiveAt = data.lastAccessedAt;
    (session as any)._expiresAt = data.expiresAt;
    (session as any)._isActive = data.isActive;

    return session;
  }
}
