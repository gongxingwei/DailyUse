import { Token } from '@dailyuse/domain-server';
import { prisma } from '../../../../../config/prisma';
import type { ITokenRepository } from '@dailyuse/domain-server';
import type { AuthTokenPersistenceDTO } from '@dailyuse/contracts';
import { generateUUID } from '@dailyuse/utils';

/**
 * Prisma Token Repository - 处理独立的 Token 操作
 * 注意：在 DDD 中，Token 作为 AuthCredential 聚合的一部分，
 * 主要的持久化应该通过 AuthCredential 聚合根来处理。
 * 这个仓储主要用于查询和独立的 Token 操作。
 */
export class PrismaTokenRepository implements ITokenRepository {
  async save(token: Token): Promise<void> {
    const tokenData = this.mapTokenToPersistence(token);

    await prisma.authToken.upsert({
      where: { tokenValue: token.value },
      update: {
        tokenType: tokenData.tokenType,
        expiresAt: tokenData.expiresAt,
        isRevoked: tokenData.isRevoked,
        revokeReason: tokenData.revokeReason,
        metadata: tokenData.metadata,
      },
      create: tokenData,
    });
  }

  async findById(tokenUuid: string): Promise<Token | null> {
    const tokenData = await prisma.authToken.findUnique({
      where: { uuid: tokenUuid },
    });

    if (!tokenData) {
      return null;
    }

    return this.mapToToken(tokenData);
  }

  async findByValue(tokenValue: string): Promise<AuthTokenPersistenceDTO | null> {
    const tokenData = await prisma.authToken.findFirst({
      where: { tokenValue },
    });

    if (!tokenData) {
      return null;
    }

    return this.mapToPersistenceDTO(tokenData);
  }

  async findByAccountUuid(accountUuid: string): Promise<AuthTokenPersistenceDTO[]> {
    const tokensData = await prisma.authToken.findMany({
      where: {
        accountUuid,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return tokensData.map((data) => this.mapToPersistenceDTO(data));
  }

  async findByType(tokenType: string): Promise<AuthTokenPersistenceDTO[]> {
    const tokensData = await prisma.authToken.findMany({
      where: {
        tokenType: tokenType.toLowerCase(),
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return tokensData.map((data) => this.mapToPersistenceDTO(data));
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<AuthTokenPersistenceDTO[]> {
    return this.findByAccountUuid(accountUuid); // 已经过滤了有效的令牌
  }

  async findActiveByAccountUuidAndType(accountUuid: string, tokenType: string): Promise<Token[]> {
    const tokensData = await prisma.authToken.findMany({
      where: {
        accountUuid,
        tokenType: tokenType.toLowerCase(),
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return tokensData.map((data) => this.mapToToken(data));
  }

  async markAsUsed(tokenValue: string): Promise<void> {
    await this.revokeToken(tokenValue, 'Used');
  }

  async revokeToken(tokenValue: string, reason: string = 'Manually revoked'): Promise<void> {
    await prisma.authToken.update({
      where: { tokenValue },
      data: {
        isRevoked: true,
        revokeReason: reason,
      },
    });
  }

  async revokeAllTokensByAccount(
    accountUuid: string,
    reason: string = 'Account revoked all tokens',
  ): Promise<void> {
    await prisma.authToken.updateMany({
      where: { accountUuid },
      data: {
        isRevoked: true,
        revokeReason: reason,
      },
    });
  }

  async delete(tokenUuid: string): Promise<void> {
    await prisma.authToken.delete({
      where: { uuid: tokenUuid },
    });
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    await prisma.authToken.deleteMany({
      where: { accountUuid },
    });
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await prisma.authToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isRevoked: true,
            issuedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30天前的已撤销令牌
          },
        ],
      },
    });

    return result.count;
  }

  /**
   * 映射 Token 对象到持久化数据
   */
  private mapTokenToPersistence(token: Token): any {
    return {
      uuid: generateUUID(),
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
   * 将数据库原始数据映射为持久化 DTO
   * 仅负责数据格式转换，不包含业务逻辑
   */
  private mapToPersistenceDTO(data: any): AuthTokenPersistenceDTO {
    return {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      tokenValue: data.tokenValue,
      tokenType: data.tokenType,
      issuedAt: data.issuedAt,
      expiresAt: data.expiresAt,
      isRevoked: data.isRevoked,
      revokeReason: data.revokeReason,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapToToken(data: any): Token {
    const metadata = data.metadata ? JSON.parse(data.metadata) : {};

    return Token.fromPersistence({
      value: data.tokenValue,
      type: data.tokenType.toUpperCase(), // 转换回枚举格式
      accountUuid: data.accountUuid,
      issuedAt: data.issuedAt,
      expiresAt: data.expiresAt,
      deviceInfo: metadata.deviceInfo || data.metadata, // 兼容旧数据格式
      isRevoked: data.isRevoked,
    });
  }
}
