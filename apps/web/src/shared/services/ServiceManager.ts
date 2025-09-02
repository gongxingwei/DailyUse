import { AuthApplicationService } from '@/modules/authentication/application/services/AuthApplicationService';

/**
 * 全局服务管理器
 * 用于管理需要异步初始化的服务实例
 */
class ServiceManager {
  private static instance: ServiceManager;
  private authService: AuthApplicationService | null = null;
  private authServicePromise: Promise<AuthApplicationService> | null = null;

  private constructor() {}

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * 获取认证服务实例
   * 如果尚未初始化，则进行初始化
   */
  async getAuthService(): Promise<AuthApplicationService> {
    if (this.authService) {
      return this.authService;
    }

    if (this.authServicePromise) {
      return this.authServicePromise;
    }

    this.authServicePromise = AuthApplicationService.getInstance();
    this.authService = await this.authServicePromise;
    return this.authService;
  }

  /**
   * 检查认证服务是否已准备就绪
   */
  isAuthServiceReady(): boolean {
    return this.authService !== null;
  }

  /**
   * 重置服务实例（用于测试或重新初始化）
   */
  reset(): void {
    this.authService = null;
    this.authServicePromise = null;
  }
}

export const serviceManager = ServiceManager.getInstance();
