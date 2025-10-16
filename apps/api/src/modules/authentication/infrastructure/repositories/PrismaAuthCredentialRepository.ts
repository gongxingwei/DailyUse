import { PrismaClient } from '@prisma/client';
import type { IAuthCredentialRepository } from '@dailyuse/domain-server';
import { AuthCredential } from '@dailyuse/domain-server';

/**
 * AuthCredential 聚合根 Prisma 仓储实现
 * 负责 AuthCredential 及其所有子实体的完整持久化
 *
 * 聚合根包含：
 * - AuthCredential (主实体)
 * - PasswordCredential (子实体，可选，JSON存储)
 * - ApiKeyCredential[] (子实体集合，JSON存储)
 * - RememberMeToken[] (子实体集合，JSON存储)
 * - CredentialHistory[] (子实体集合，JSON存储)
 */
export class PrismaAuthCredentialRepository implements IAuthCredentialRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 AuthCredential 聚合根实体
   */
  private mapToEntity(data: any): AuthCredential {
    // 使用领域实体的 fromPersistenceDTO 方法创建实体
    const credential = AuthCredential.fromPersistenceDTO({
      uuid: data.uuid,
      account_uuid: data.accountUuid,
      type: data.type,
      password_credential: data.passwordCredential,
      api_key_credentials: data.apiKeyCredentials,
      remember_me_tokens: data.rememberMeTokens,
      two_factor: data.twoFactor,
      biometric: data.biometric,
      status: data.status,
      security: data.security,
      history: data.history,
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
    });

    return credential;
  }

  /**
   * 转换时间戳为 Date 对象
   */
  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  // ===== IAuthCredentialRepository 接口实现 =====

  async save(credential: AuthCredential): Promise<void> {
    const persistence = credential.toPersistenceDTO();

    await this.prisma.$transaction(async (tx) => {
      // Upsert AuthCredential 主实体
      await tx.authCredential.upsert({
        where: { uuid: persistence.uuid },
        create: {
          uuid: persistence.uuid,
          accountUuid: persistence.account_uuid,
          type: persistence.type,
          passwordCredential: persistence.password_credential,
          apiKeyCredentials: persistence.api_key_credentials,
          rememberMeTokens: persistence.remember_me_tokens,
          twoFactor: persistence.two_factor,
          biometric: persistence.biometric,
          status: persistence.status,
          security: persistence.security,
          history: persistence.history,
          createdAt: this.toDate(persistence.created_at) ?? new Date(),
          updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
        },
        update: {
          type: persistence.type,
          passwordCredential: persistence.password_credential,
          apiKeyCredentials: persistence.api_key_credentials,
          rememberMeTokens: persistence.remember_me_tokens,
          twoFactor: persistence.two_factor,
          biometric: persistence.biometric,
          status: persistence.status,
          security: persistence.security,
          history: persistence.history,
          updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
        },
      });
    });
  }

  async findByUuid(uuid: string): Promise<AuthCredential | null> {
    const data = await this.prisma.authCredential.findUnique({
      where: { uuid },
    });

    if (!data) {
      return null;
    }

    return this.mapToEntity(data);
  }

  async findByAccountUuid(accountUuid: string): Promise<AuthCredential | null> {
    const data = await this.prisma.authCredential.findUnique({
      where: { accountUuid },
    });

    if (!data) {
      return null;
    }

    return this.mapToEntity(data);
  }

  async findAll(params?: { skip?: number; take?: number }): Promise<AuthCredential[]> {
    const data = await this.prisma.authCredential.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });

    return data.map((item) => this.mapToEntity(item));
  }

  async findByStatus(
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED',
    params?: { skip?: number; take?: number },
  ): Promise<AuthCredential[]> {
    const data = await this.prisma.authCredential.findMany({
      where: { status },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });

    return data.map((item) => this.mapToEntity(item));
  }

  async findByType(
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY',
    params?: { skip?: number; take?: number },
  ): Promise<AuthCredential[]> {
    const data = await this.prisma.authCredential.findMany({
      where: { type },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });

    return data.map((item) => this.mapToEntity(item));
  }

  async existsByAccountUuid(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.authCredential.count({
      where: { accountUuid },
    });
    return count > 0;
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.authCredential.delete({
      where: { uuid },
    });
  }

  async deleteExpired(): Promise<number> {
    // 查找状态为 EXPIRED 的凭证并删除
    const result = await this.prisma.authCredential.deleteMany({
      where: { status: 'EXPIRED' },
    });
    return result.count;
  }
}
