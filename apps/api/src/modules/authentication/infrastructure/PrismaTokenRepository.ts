import { Token } from '@dailyuse/domain-server';
import { prisma } from '../../../config/prisma';
import type { ITokenRepository } from '@dailyuse/domain-server';
import { generateUUID } from '@dailyuse/utils';

export class PrismaTokenRepository implements ITokenRepository {
  async save(token: Token): Promise<void> {
    // Generate UUID for database storage
    const tokenId = generateUUID();

    const tokenData = {
      uuid: tokenId,
      accountUuid: token.accountUuid,
      tokenValue: token.value,
      tokenType: token.type,
      issuedAt: token.issuedAt,
      expiresAt: token.expiresAt,
      isRevoked: token.isRevoked,
      metadata: token.deviceInfo || null,
    };

    await prisma.authToken.upsert({
      where: { tokenValue: token.value },
      update: tokenData,
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

  async findByValue(tokenValue: string): Promise<Token | null> {
    const tokenData = await prisma.authToken.findFirst({
      where: { tokenValue },
    });

    if (!tokenData) {
      return null;
    }

    return this.mapToToken(tokenData);
  }

  async findByAccountUuid(accountUuid: string): Promise<Token[]> {
    const tokensData = await prisma.authToken.findMany({
      where: { accountUuid },
      orderBy: { issuedAt: 'desc' },
    });

    return tokensData.map((data) => this.mapToToken(data));
  }

  async findByType(tokenType: string): Promise<Token[]> {
    const tokensData = await prisma.authToken.findMany({
      where: { tokenType },
      orderBy: { issuedAt: 'desc' },
    });

    return tokensData.map((data) => this.mapToToken(data));
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<Token[]> {
    const tokensData = await prisma.authToken.findMany({
      where: {
        accountUuid,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return tokensData.map((data) => this.mapToToken(data));
  }

  async findActiveByAccountUuidAndType(accountUuid: string, tokenType: string): Promise<Token[]> {
    const tokensData = await prisma.authToken.findMany({
      where: {
        accountUuid,
        tokenType,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return tokensData.map((data) => this.mapToToken(data));
  }

  async markAsUsed(tokenValue: string): Promise<void> {
    await prisma.authToken.update({
      where: { tokenValue },
      data: {
        isRevoked: true,
        revokeReason: 'Used',
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
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });

    return result.count;
  }

  private mapToToken(data: any): Token {
    return Token.fromPersistence({
      value: data.tokenValue,
      type: data.tokenType,
      accountUuid: data.accountUuid,
      issuedAt: data.issuedAt,
      expiresAt: data.expiresAt,
      deviceInfo: data.metadata,
      isRevoked: data.isRevoked,
    });
  }
}
