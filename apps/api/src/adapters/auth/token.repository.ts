import { prisma } from '../../config/prisma';
import type { AuthTokenRepositoryPort } from '@dailyuse/domain';

export class PrismaAuthTokenRepository implements AuthTokenRepositoryPort {
  async save(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.authToken.create({
      data: { userId, value: token, type: 'refresh_token', expiresAt },
    });
  }

  async exists(userId: string, token: string): Promise<boolean> {
    const row = await prisma.authToken.findFirst({
      where: {
        userId,
        value: token,
        type: 'refresh_token',
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });
    return !!row;
  }

  async revoke(userId: string, token: string): Promise<void> {
    await prisma.authToken.updateMany({
      where: { userId, value: token, type: 'refresh_token', isRevoked: false },
      data: { isRevoked: true, revokeReason: 'logout' },
    });
  }
}
