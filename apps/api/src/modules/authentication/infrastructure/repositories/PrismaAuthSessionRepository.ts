import { PrismaClient } from '@prisma/client';
import type { IAuthSessionRepository } from '@dailyuse/domain-server';
import { AuthSession } from '@dailyuse/domain-server';

/**
 * AuthSession 聚合根 Prisma 仓储实现
 * 负责 AuthSession 及其所有子实体的完整持久化
 *
 * 聚合根包含：
 * - AuthSession (主实体)
 * - RefreshToken[] (子实体集合，JSON存储)
 * - SessionHistory[] (子实体集合，JSON存储)
 * - DeviceInfo (值对象，JSON存储)
 */
export class PrismaAuthSessionRepository implements IAuthSessionRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  private mapToEntity(data: any): AuthSession {
    return AuthSession.fromPersistenceDTO({
      uuid: data.uuid,
      account_uuid: data.accountUuid,
      access_token: data.accessToken,
      refresh_token: data.refreshTokens,
      device_info: data.deviceInfo,
      status: data.status,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      session_metadata: data.sessionMetadata,
      last_activity_at: data.lastActivityAt?.getTime() ?? null,
      expires_at: data.expiresAt?.getTime() ?? null,
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
      revoked_at: data.revokedAt?.getTime() ?? null,
      history: data.history,
    });
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  // ===== IAuthSessionRepository 接口实现 =====

  async save(session: AuthSession): Promise<void> {
    const persistence = session.toPersistenceDTO();

    await this.prisma.$transaction(async (tx) => {
      await tx.authSession.upsert({
        where: { uuid: persistence.uuid },
        create: {
          uuid: persistence.uuid,
          accountUuid: persistence.account_uuid,
          accessToken: persistence.access_token,
          refreshTokens: persistence.refresh_tokens,
          deviceInfo: persistence.device_info,
          status: persistence.status,
          ipAddress: persistence.ip_address,
          userAgent: persistence.user_agent,
          sessionMetadata: persistence.session_metadata,
          lastActivityAt: this.toDate(persistence.last_activity_at),
          expiresAt: this.toDate(persistence.expires_at),
          createdAt: this.toDate(persistence.created_at) ?? new Date(),
          updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
          revokedAt: this.toDate(persistence.revoked_at),
          history: persistence.history,
        },
        update: {
          accessToken: persistence.access_token,
          refreshTokens: persistence.refresh_tokens,
          deviceInfo: persistence.device_info,
          status: persistence.status,
          ipAddress: persistence.ip_address,
          userAgent: persistence.user_agent,
          sessionMetadata: persistence.session_metadata,
          lastActivityAt: this.toDate(persistence.last_activity_at),
          expiresAt: this.toDate(persistence.expires_at),
          updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
          revokedAt: this.toDate(persistence.revoked_at),
          history: persistence.history,
        },
      });
    });
  }

  async findByUuid(uuid: string): Promise<AuthSession | null> {
    const data = await this.prisma.authSession.findUnique({ where: { uuid } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<AuthSession[]> {
    const sessions = await this.prisma.authSession.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((s) => this.mapToEntity(s));
  }

  async findByAccessToken(accessToken: string): Promise<AuthSession | null> {
    const data = await this.prisma.authSession.findUnique({ where: { accessToken } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByRefreshToken(refreshToken: string): Promise<AuthSession | null> {
    // 需要在 JSON 字段中查找，这可能需要特殊处理
    // 简化版本：查找所有会话，然后在应用层过滤
    const sessions = await this.prisma.authSession.findMany();
    const found = sessions.find((s) => {
      const tokens = s.refreshTokens ? JSON.parse(s.refreshTokens as string) : [];
      return tokens.some((t: any) => t.token === refreshToken);
    });
    return found ? this.mapToEntity(found) : null;
  }

  async findByDeviceId(deviceId: string): Promise<AuthSession[]> {
    // 需要在 JSON 字段中查找，简化版本
    const sessions = await this.prisma.authSession.findMany();
    const filtered = sessions.filter((s) => {
      const deviceInfo = s.deviceInfo ? JSON.parse(s.deviceInfo as string) : null;
      return deviceInfo?.deviceId === deviceId;
    });
    return filtered.map((s) => this.mapToEntity(s));
  }

  async findActiveSessions(accountUuid: string): Promise<AuthSession[]> {
    const sessions = await this.prisma.authSession.findMany({
      where: {
        accountUuid,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
    return sessions.map((s) => this.mapToEntity(s));
  }

  async findAll(params?: { skip?: number; take?: number }): Promise<AuthSession[]> {
    const sessions = await this.prisma.authSession.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((s) => this.mapToEntity(s));
  }

  async findByStatus(
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED',
    params?: { skip?: number; take?: number },
  ): Promise<AuthSession[]> {
    const sessions = await this.prisma.authSession.findMany({
      where: { status },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((s) => this.mapToEntity(s));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.authSession.delete({ where: { uuid } });
  }

  async deleteByAccountUuid(accountUuid: string): Promise<number> {
    const result = await this.prisma.authSession.deleteMany({ where: { accountUuid } });
    return result.count;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.authSession.deleteMany({
      where: {
        OR: [{ status: 'EXPIRED' }, { expiresAt: { lt: new Date() } }],
      },
    });
    return result.count;
  }
}
