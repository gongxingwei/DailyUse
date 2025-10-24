import { AuthenticationContainer } from '../../infrastructure/di/authenticationContainer';
import { ITokenRepository } from '../../domain/repositories/authenticationRepository';

// domainServices
import { tokenService } from '../../domain/services/tokenService';

export class AuthTokenService {
  private static instance: AuthTokenService;
  private tokenRepository: ITokenRepository;

  constructor(tokenRepository: ITokenRepository) {
    this.tokenRepository = tokenRepository;
  }
  public static async getInstance(): Promise<AuthTokenService> {
    if (!AuthTokenService.instance) {
      AuthTokenService.instance = await AuthTokenService.createInstance();
    }
    return AuthTokenService.instance;
  }

  public static async createInstance(): Promise<AuthTokenService> {
    const authenticationContainer = await AuthenticationContainer.getInstance();
    const tokenRepository: ITokenRepository = authenticationContainer.getTokenRepository();
    return new AuthTokenService(tokenRepository);
  }

  /**
   * 验证 Token 是否有效
   * @param tokenValue Token 字符串
   * @returns 如果有效返回 true，否则 false
   */
  public static async validateToken(accountUuid: string, tokenValue: string): Promise<boolean> {
    const instance = await AuthTokenService.getInstance();
    const result = await tokenService.isTokenValid(
      accountUuid,
      tokenValue,
      instance.tokenRepository,
    );
    if (!result) {
      return false;
    }
    return true;
  }
}

export function withAuth(
  handler: (
    event: Electron.IpcMainInvokeEvent,
    args: any[],
    auth: { token?: string; accountUuid?: string },
  ) => Promise<any>,
) {
  return async (event: Electron.IpcMainInvokeEvent, ...args: any[]) => {
    const lastArg = args[args.length - 1];
    let auth = {};
    let realArgs = args;
    if (lastArg && typeof lastArg === 'object' && lastArg.auth) {
      auth = lastArg.auth;
      realArgs = args.slice(0, -1);
    }
    // 统一鉴权
    const { token, accountUuid } = auth as { token?: string; accountUuid?: string };
    if (!token || !accountUuid || !(await AuthTokenService.validateToken(accountUuid, token))) {
      console.log('Auth failed:', { token, accountUuid });
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    // 通过鉴权，继续执行业务
    return handler(event, realArgs, auth);
  };
}
