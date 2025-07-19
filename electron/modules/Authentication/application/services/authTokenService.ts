import { AuthCredential } from "../../domain/aggregates/authCredential";
import { AuthenticationContainer } from "../../infrastructure/di/authenticationContainer";
import { IAuthCredentialRepository, ITokenRepository } from "../../domain/repositories/authenticationRepository";
import { SqliteAuthCredentialRepository, SqliteTokenRepository } from "../../index";
import {
  AccountIdGetterRequestedEvent,
  AccountStatusVerificationRequestedEvent,
  LoginCredentialVerificationEvent,
  LoginAttemptEvent,
  UserLoggedInEvent,
} from "../../domain/events/authenticationEvents";
import { AccountStatusVerificationResponseEvent } from "../../../Account/domain/events/accountEvents";
import { eventBus } from "../../../../shared/events/eventBus";
import { generateUUID } from "@/shared/utils/uuid";
import { AccountIdGetterResponseEvent } from "../../../Account/index"
// domainServices
import { tokenService } from "../../domain/services/tokenService";
// types
import type { PasswordAuthenticationResponse, PasswordAuthenticationRequest } from "../../domain/types";


export class AuthTokenService {
  private static instance: AuthTokenService;
  private tokenRepository: ITokenRepository;
  private authCredentialRepository: IAuthCredentialRepository;

  constructor(
    authCredentialRepository: IAuthCredentialRepository,
    tokenRepository: ITokenRepository
  ) {
    this.authCredentialRepository = authCredentialRepository;
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
    const authCredentialRepository: IAuthCredentialRepository = authenticationContainer.getAuthCredentialRepository();
    const tokenRepository: ITokenRepository = authenticationContainer.getTokenRepository();
    return new AuthTokenService(authCredentialRepository, tokenRepository);
  }

    /**
     * 验证 Token 是否有效
     * @param tokenValue Token 字符串
     * @returns 如果有效返回 true，否则 false
     */
    public static async validateToken(accountId: string, tokenValue: string): Promise<boolean> {
        const result = tokenService.isTokenValid(accountId, tokenValue, this.instance.tokenRepository);
        if (!result) {
            return false;
        }
        return true;
    }

    
}

export function withAuth(
  handler: (event: Electron.IpcMainInvokeEvent, args: any[], auth: { token?: string; account_uuid?: string }) => Promise<any>
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
    const { token, account_uuid } = auth as { token?: string; account_uuid?: string };
    if (!token || !account_uuid || !(await AuthTokenService.validateToken(account_uuid, token))) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    // 通过鉴权，继续执行业务
    return handler(event, realArgs, auth);
  };
}