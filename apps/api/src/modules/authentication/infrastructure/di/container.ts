import { AuthenticationController } from '../../interface/http/controller';
import {
  PrismaAuthCredentialRepository,
  PrismaSessionRepository,
  PrismaTokenRepository,
  PrismaMFADeviceRepository,
} from '../repositories/prisma';
import { PrismaClient } from '@prisma/client';

/**
 * Authentication Module Dependency Injection Container
 * 认证模块的依赖注入容器
 */
class AuthenticationContainer {
  private prismaClient: PrismaClient;
  private authCredentialRepository!: PrismaAuthCredentialRepository;
  private sessionRepository!: PrismaSessionRepository;
  private tokenRepository!: PrismaTokenRepository;
  private mfaDeviceRepository!: PrismaMFADeviceRepository;
  private authenticationController!: AuthenticationController;

  constructor() {
    this.prismaClient = new PrismaClient();
    this.initializeRepositories();
  }

  private initializeRepositories(): void {
    this.authCredentialRepository = new PrismaAuthCredentialRepository();
    this.sessionRepository = new PrismaSessionRepository();
    this.tokenRepository = new PrismaTokenRepository();
    this.mfaDeviceRepository = new PrismaMFADeviceRepository();
  }

  resolve(serviceName: string): any {
    switch (serviceName) {
      case 'prismaClient':
        return this.prismaClient;
      case 'authCredentialRepository':
        return this.authCredentialRepository;
      case 'sessionRepository':
        return this.sessionRepository;
      case 'tokenRepository':
        return this.tokenRepository;
      case 'mfaDeviceRepository':
        return this.mfaDeviceRepository;
      default:
        throw new Error(`Service ${serviceName} not found in container`);
    }
  }

  async dispose(): Promise<void> {
    await this.prismaClient.$disconnect();
  }
}

// 导出单例容器实例
export const authenticationContainer = new AuthenticationContainer();
