import { prisma } from '../../config/prisma';
import type { Account, AccountRepositoryPort } from '@dailyuse/domain';

export class AccountRepository implements AccountRepositoryPort {
  async findById(id: string): Promise<Account | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? toAccount(u) : null;
  }
  async findByUsername(username: string): Promise<Account | null> {
    const u = await prisma.user.findUnique({ where: { username } });
    return u ? toAccount(u) : null;
  }
  async create(input: {
    username: string;
    passwordHash: string;
    email?: string;
    phone?: string;
  }): Promise<Account> {
    const u = await prisma.user.create({
      data: {
        username: input.username,
        password: input.passwordHash,
        email: input.email,
        phone: input.phone,
      },
    });
    return toAccount(u);
  }
}

type UserRow = {
  id: string;
  username: string;
  password: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
};
function toAccount(u: UserRow): Account {
  return {
    id: u.id,
    uuid: u.id,
    username: u.username,
    passwordHash: u.password,
    email: u.email ?? undefined,
    phone: u.phone ?? undefined,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    status: 'active' as any,
    accountType: 'local' as any,
    isEmailVerified: !!u.email,
    isPhoneVerified: !!u.phone,
    user: {},
  };
}
