import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import type { User } from './types/user';

// Map DB user row to API User shape
function mapUser(u: any): User {
  return {
    id: u.id,
    username: u.username,
    password: u.password,
    avatar: u.avatar ?? undefined,
    email: u.email ?? undefined,
    phone: u.phone ?? undefined,
    created_at: u.createdAt,
  };
}

export class UserModel {
  static async findByUsername(username: string): Promise<User | undefined> {
    const u = await prisma.user.findUnique({ where: { username } });
    return u ? mapUser(u) : undefined;
  }

  static async findById(id: string): Promise<User | undefined> {
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? mapUser(u) : undefined;
  }

  static async createUser(username: string, password: string, email?: string): Promise<string> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const u = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email ?? null,
      },
    });
    return u.id;
  }

  static async updateUser(
    id: string,
    data: { avatar?: string; email?: string; phone?: string },
  ): Promise<boolean> {
    const u = await prisma.user.update({
      where: { id },
      data: {
        avatar: data.avatar ?? undefined,
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
      },
    });
    return !!u;
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAllUsers(): Promise<User[]> {
    const rows = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
        email: true,
        phone: true,
        createdAt: true,
        password: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapUser);
  }

  static async deleteUser(id: string): Promise<boolean> {
    await prisma.user.delete({ where: { id } });
    return true;
  }

  // Token helpers using auth_tokens table via Prisma
  static async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.authToken.create({
      data: {
        userId,
        value: refreshToken,
        type: 'refresh_token',
        expiresAt,
      },
    });
  }

  static async verifyRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const token = await prisma.authToken.findFirst({
      where: {
        userId,
        value: refreshToken,
        type: 'refresh_token',
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });
    return !!token;
  }

  static async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await prisma.authToken.updateMany({
      where: { userId, value: refreshToken, type: 'refresh_token', isRevoked: false },
      data: { isRevoked: true, revokeReason: 'logout' },
    });
  }
}
