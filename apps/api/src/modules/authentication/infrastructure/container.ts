import { AuthenticationApplicationService } from '../application/AuthenticationApplicationService';
import { AuthenticationController } from '../presentation/AuthenticationController';
import {
  PrismaAuthCredentialRepository,
  PrismaSessionRepository,
  PrismaTokenRepository,
  PrismaMFADeviceRepository,
} from './repositories/prisma';
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
  private authenticationService!: AuthenticationApplicationService;
  private authenticationController!: AuthenticationController;

  constructor() {
    this.prismaClient = new PrismaClient();
    this.initializeRepositories();
    this.initializeServices();
    this.initializeControllers();
  }

  private initializeRepositories(): void {
    this.authCredentialRepository = new PrismaAuthCredentialRepository();
    this.sessionRepository = new PrismaSessionRepository();
    this.tokenRepository = new PrismaTokenRepository();
    this.mfaDeviceRepository = new PrismaMFADeviceRepository();
  }

  private initializeServices(): void {
    this.authenticationService = new AuthenticationApplicationService(
      this.authCredentialRepository,
      this.sessionRepository,
      this.tokenRepository,
      this.mfaDeviceRepository,
    );
  }

  private initializeControllers(): void {
    this.authenticationController = new AuthenticationController(this.authenticationService);
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
      case 'authenticationService':
        return this.authenticationService;
      case 'authenticationController':
        return this.authenticationController;
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
