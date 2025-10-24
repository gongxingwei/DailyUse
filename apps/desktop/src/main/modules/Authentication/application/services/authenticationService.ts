import { AuthenticationContainer } from '../../infrastructure/di/authenticationContainer';
import {
  IAuthCredentialRepository,
  ITokenRepository,
  ISessionRepository,
} from '../../domain/repositories/authenticationRepository';

/**
 * AuthenticationService
 *
 * 负责处理用户登录流程、凭证验证、账号状态校验、事件发布等。
 * 支持依赖注入、事件驱动、异步处理，保证登录流程的解耦与可扩展性。
 */
export class AuthenticationService {
  private static instance: AuthenticationService | null = null;

  private authCredentialRepository: IAuthCredentialRepository;
  private tokenRepository: ITokenRepository;
  private sessionRepository: ISessionRepository; /**
   * 构造函数
   * @param authCredentialRepository 认证凭证仓库
   * @param tokenRepository 令牌仓库
   * 构造时自动注册事件监听器
   */
  constructor(
    authCredentialRepository: IAuthCredentialRepository,
    tokenRepository: ITokenRepository,
    sessionRepository: ISessionRepository,
  ) {
    this.authCredentialRepository = authCredentialRepository;
    this.tokenRepository = tokenRepository;
    this.sessionRepository = sessionRepository;
  }

  // ===================== 静态方法（单例/工厂） =====================

  /**
   * 创建服务实例（支持依赖注入）
   * @param authCredentialRepository 可选的认证凭证仓库
   * @param tokenRepository 可选的令牌仓库
   * @returns AuthenticationService 实例
   */
  static async createInstance(
    authCredentialRepository?: IAuthCredentialRepository,
    tokenRepository?: ITokenRepository,
    sessionRepository?: ISessionRepository,
  ): Promise<AuthenticationService> {
    const authenticationContainer = await AuthenticationContainer.getInstance();
    authCredentialRepository =
      authCredentialRepository || authenticationContainer.getAuthCredentialRepository();
    tokenRepository = tokenRepository || authenticationContainer.getTokenRepository();
    sessionRepository = sessionRepository || authenticationContainer.getSessionRepository();

    return new AuthenticationService(authCredentialRepository, tokenRepository, sessionRepository);
  }

  /**
   * 获取单例实例（全局唯一）
   */
  static async getInstance(): Promise<AuthenticationService> {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = await AuthenticationService.createInstance();
    }
    return AuthenticationService.instance;
  }

  // ===================== 实例方法（业务主流程） =====================

  async function() {
    void this.authCredentialRepository;
    void this.tokenRepository;
    void this.sessionRepository;
  }
}
