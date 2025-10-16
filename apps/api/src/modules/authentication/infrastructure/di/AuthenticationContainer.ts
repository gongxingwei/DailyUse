import type { IAuthCredentialRepository, IAuthSessionRepository } from '@dailyuse/domain-server';
import { PrismaAuthCredentialRepository } from '../repositories/PrismaAuthCredentialRepository';
import { PrismaAuthSessionRepository } from '../repositories/PrismaAuthSessionRepository';
import prisma from '../../../../shared/db/prisma';

/**
 * Authentication 依赖注入容器
 */
export class AuthenticationContainer {
  private static credentialRepository: IAuthCredentialRepository | null = null;
  private static sessionRepository: IAuthSessionRepository | null = null;

  static getAuthCredentialRepository(): IAuthCredentialRepository {
    if (!AuthenticationContainer.credentialRepository) {
      AuthenticationContainer.credentialRepository = new PrismaAuthCredentialRepository(prisma);
    }
    return AuthenticationContainer.credentialRepository;
  }

  static getAuthSessionRepository(): IAuthSessionRepository {
    if (!AuthenticationContainer.sessionRepository) {
      AuthenticationContainer.sessionRepository = new PrismaAuthSessionRepository(prisma);
    }
    return AuthenticationContainer.sessionRepository;
  }

  // For testing purposes
  static setAuthCredentialRepository(repository: IAuthCredentialRepository): void {
    AuthenticationContainer.credentialRepository = repository;
  }

  static setAuthSessionRepository(repository: IAuthSessionRepository): void {
    AuthenticationContainer.sessionRepository = repository;
  }

  static reset(): void {
    AuthenticationContainer.credentialRepository = null;
    AuthenticationContainer.sessionRepository = null;
  }
}
