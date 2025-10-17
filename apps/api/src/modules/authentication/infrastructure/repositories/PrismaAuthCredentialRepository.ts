import { PrismaClient } from '@prisma/client';
import type { AuthCredential as PrismaAuthCredential } from '@prisma/client';
import type { IAuthCredentialRepository } from '@dailyuse/domain-server';
import { AuthCredential } from '@dailyuse/domain-server';
import type { AuthenticationContracts } from '@dailyuse/contracts';

export class PrismaAuthCredentialRepository implements IAuthCredentialRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: PrismaAuthCredential): AuthCredential {
    const { data: jsonData, metadata, history, ...rest } = data;
    const parsedData = JSON.parse(jsonData);
    const parsedMetadata = JSON.parse(metadata);

    const persistenceDTO: AuthenticationContracts.AuthCredentialPersistenceDTO = {
      ...rest,
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      type: data.type as AuthenticationContracts.CredentialType,
      password_credential: parsedData.password_credential,
      api_key_credentials: parsedData.api_key_credentials,
      remember_me_tokens: parsedData.remember_me_tokens,
      two_factor: parsedData.two_factor,
      biometric: parsedData.biometric,
      status: parsedMetadata.status,
      security: parsedMetadata.security,
      history: history,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      expiresAt: data.expiresAt?.getTime(),
      lastUsedAt: data.lastUsedAt?.getTime(),
      revokedAt: data.revokedAt?.getTime(),
    };

    return AuthCredential.fromPersistenceDTO(persistenceDTO);
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  async save(credential: AuthCredential): Promise<void> {
    const persistence = credential.toPersistenceDTO();
    const {
      uuid,
      accountUuid,
      type,
      password_credential,
      api_key_credentials,
      remember_me_tokens,
      two_factor,
      biometric,
      status,
      security,
      history,
      createdAt,
      updatedAt,
      expiresAt,
      lastUsedAt,
      revokedAt,
    } = persistence;

    const jsonData = JSON.stringify({
      password_credential,
      api_key_credentials,
      remember_me_tokens,
      two_factor,
      biometric,
    });

    const metadata = JSON.stringify({
      status,
      security,
    });

    const dataForPrisma = {
      uuid,
      accountUuid: accountUuid,
      type,
      data: jsonData,
      metadata,
      history: history,
      createdAt: this.toDate(created_at) ?? new Date(),
      updatedAt: this.toDate(updated_at) ?? new Date(),
      expiresAt: this.toDate(expires_at),
      lastUsedAt: this.toDate(last_used_at),
      revokedAt: this.toDate(revoked_at),
    };

    await this.prisma.authCredential.upsert({
      where: { uuid: persistence.uuid },
      create: dataForPrisma,
      update: {
        type: dataForPrisma.type,
        data: dataForPrisma.data,
        metadata: dataForPrisma.metadata,
        history: dataForPrisma.history,
        updatedAt: dataForPrisma.updatedAt,
        expiresAt: dataForPrisma.expiresAt,
        lastUsedAt: dataForPrisma.lastUsedAt,
        revokedAt: dataForPrisma.revokedAt,
      },
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
    const data = await this.prisma.authCredential.findFirst({
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
      where: { metadata: { contains: `"status":"${status}"` } },
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
    const result = await this.prisma.authCredential.deleteMany({
      where: { metadata: { contains: '"status":"EXPIRED"' } },
    });
    return result.count;
  }
}
