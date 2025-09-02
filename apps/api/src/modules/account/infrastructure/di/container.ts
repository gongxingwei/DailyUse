import { PrismaAccountRepository, PrismaUserRepository } from '../repositories/prisma';
import { PrismaClient } from '@prisma/client';

/**
 * Account Module Dependency Injection Container
 * 账户模块的依赖注入容器
 *
 * 提供账户模块所需的所有依赖项的单例管理，包括：
 * - 仓储层实现（Account, User）
 *
 */
class AccountContainer {
  private prismaClient: PrismaClient;
  private accountRepository!: PrismaAccountRepository;
  private userRepository!: PrismaUserRepository;

  // TODO: 未来扩展的仓储
  // private roleRepository!: PrismaRoleRepository;
  // private permissionRepository!: PrismaPermissionRepository;

  constructor() {
    this.prismaClient = new PrismaClient();
    this.initializeRepositories();
  }

  private initializeRepositories(): void {
    this.accountRepository = new PrismaAccountRepository();
    this.userRepository = new PrismaUserRepository();
  }


  /**
   * 解析依赖项
   * @param serviceName 服务名称
   * @returns 请求的服务实例
   * @throws Error 如果服务不存在
   */
  resolve(serviceName: string): any {
    switch (serviceName) {
      case 'prismaClient':
        return this.prismaClient;
      case 'accountRepository':
        return this.accountRepository;
      case 'userRepository':
        return this.userRepository;
      default:
        throw new Error(`Service ${serviceName} not found in container`);
    }
  }

  /**
   * 获取所有可用服务的名称列表
   * @returns 服务名称数组
   */
  getAvailableServices(): string[] {
    return [
      'prismaClient',
      'accountRepository',
      'userRepository',
    ];
  }

  /**
   * 检查服务是否存在
   * @param serviceName 服务名称
   * @returns boolean
   */
  hasService(serviceName: string): boolean {
    return this.getAvailableServices().includes(serviceName);
  }

  /**
   * 释放资源，断开数据库连接
   */
  async dispose(): Promise<void> {
    await this.prismaClient.$disconnect();
  }

  /**
   * 获取容器状态信息（用于调试）
   */
  getContainerInfo(): {
    servicesCount: number;
    availableServices: string[];
    prismaConnected: boolean;
  } {
    return {
      servicesCount: this.getAvailableServices().length,
      availableServices: this.getAvailableServices(),
      prismaConnected: !!this.prismaClient,
    };
  }
}

// 导出单例容器实例
export const accountContainer = new AccountContainer();
