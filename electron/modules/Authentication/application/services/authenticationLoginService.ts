import { AuthenticationContainer } from "../../infrastructure/di/authenticationContainer";
import {
  IAuthCredentialRepository,
  ITokenRepository,
  ISessionRepository,
} from "../../domain/repositories/authenticationRepository";
import {
  AccountInfoGetterRequestedEvent,
  AccountUuidGetterRequestedEvent,
  AccountStatusVerificationRequestedEvent,
  LoginCredentialVerificationEvent,
  LoginAttemptEvent,
  UserLoggedInEvent,
} from "../../domain/events/authenticationEvents";
import {
  AccountStatusVerificationResponseEvent,
  AccountUuidGetterResponseEvent,
  AccountInfoGetterResponseEvent,
} from "../../../Account/domain/events/accountEvents";
import { eventBus } from "../../../../shared/events/eventBus";
import { tokenService } from "../../domain/services/tokenService";
import { authSession } from "../../application/services/authSessionStore";
import type {
  PasswordAuthenticationResponse,
  PasswordAuthenticationRequest,
  RememberMeTokenAuthenticationResponse,
  RememberMeTokenAuthenticationRequest,
} from "../../domain/types";
import crypto from "crypto";
import { TokenType } from "@common/modules/authentication/types/authentication";
import { AccountDTO } from "../../../Account/index";
import { Token } from "../../domain/valueObjects/token";

/**
 * AuthenticationLoginService
 * 
 * 负责处理用户登录流程、凭证验证、账号状态校验、事件发布等。
 * 支持依赖注入、事件驱动、异步处理，保证登录流程的解耦与可扩展性。
 */
export class AuthenticationLoginService {
  private static instance: AuthenticationLoginService | null = null;

  private authCredentialRepository: IAuthCredentialRepository;
  private tokenRepository: ITokenRepository;
  private sessionRepository: ISessionRepository;

  // 异步事件请求的 pending 控制器
  private pendingAccountRequests = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void; timeout: NodeJS.Timeout; }>();
  private pendingAccountUuidRequests = new Map<string, { resolve: (response: { accountUuid?: string }) => void; reject: (error: Error) => void; timeout: NodeJS.Timeout; }>();
  private pendingStatusVerifications = new Map<string, { resolve: (response: AccountStatusVerificationResponseEvent) => void; reject: (error: Error) => void; timeout: NodeJS.Timeout; }>();

  /**
   * 构造函数
   * @param authCredentialRepository 认证凭证仓库
   * @param tokenRepository 令牌仓库
   * @param sessionRepository 会话仓库
   */
  constructor(
    authCredentialRepository: IAuthCredentialRepository,
    tokenRepository: ITokenRepository,
    sessionRepository: ISessionRepository
  ) {
    this.authCredentialRepository = authCredentialRepository;
    this.tokenRepository = tokenRepository;
    this.sessionRepository = sessionRepository;
    this.setupEventListeners();
  }

  /**
   * 创建服务实例（支持依赖注入）
   * @param authCredentialRepository 可选的认证凭证仓库
   * @param tokenRepository 可选的令牌仓库
   * @param sessionRepository 可选的会话仓库
   * @returns AuthenticationLoginService 实例
   */
  static async createInstance(
    authCredentialRepository?: IAuthCredentialRepository,
    tokenRepository?: ITokenRepository,
    sessionRepository?: ISessionRepository
  ): Promise<AuthenticationLoginService> {
    const authenticationContainer = await AuthenticationContainer.getInstance();
    authCredentialRepository =
      authCredentialRepository ||
      authenticationContainer.getAuthCredentialRepository();
    tokenRepository =
      tokenRepository || authenticationContainer.getTokenRepository();
    sessionRepository =
      sessionRepository || authenticationContainer.getSessionRepository();

    return new AuthenticationLoginService(
      authCredentialRepository,
      tokenRepository,
      sessionRepository
    );
  }

  /**
   * 获取单例实例（全局唯一）
   * @returns AuthenticationLoginService 实例
   */
  static async getInstance(): Promise<AuthenticationLoginService> {
    if (!AuthenticationLoginService.instance) {
      AuthenticationLoginService.instance =
        await AuthenticationLoginService.createInstance();
    }
    return AuthenticationLoginService.instance;
  }

  // ===================== 业务主流程 =====================

  /**
   * 用户名密码登录
   * @param request 登录请求参数
   * @returns 登录响应对象
   * @example
   * const resp = await service.PasswordAuthentication({
   *   username: "user1",
   *   password: "pass",
   *   remember: true,
   *   clientInfo: { deviceId: "dev1", userAgent: "UA" }
   * });
   * // resp: { success: true, message: "登录成功", data: { username, accountUuid, token, sessionUuid } }
   */
  async PasswordAuthentication(
    request: PasswordAuthenticationRequest
  ): Promise<TResponse<PasswordAuthenticationResponse>> {
    const { username, password, remember, clientInfo } = request;
    try {
      // 1. 获取账号UUID（异步事件驱动）
      const { accountUuid } = await this.getAccountUuidByUsername(username);
      if (!accountUuid) {
        return {
          success: false,
          message: "账号不存在",
          data: undefined,
        };
      }

      // 2. 查询认证凭证
      const authCredential =
        await this.authCredentialRepository.findByAccountUuid(accountUuid);
      if (!authCredential) {
        await this.publishLoginAttemptEvent({
          username,
          result: "account_not_found",
          failureReason: "账号不存在",
          attemptedAt: new Date(),
          clientInfo,
        });
        return {
          success: false,
          message: "账号不存在",
          data: undefined,
        };
      }

      // 3. 验证账号状态（异步事件驱动）
      const accountStatusResponse = await this.verifyAccountStatus(
        accountUuid,
        username
      );
      if (!accountStatusResponse.payload.isLoginAllowed) {
        await this.publishLoginAttemptEvent({
          username,
          accountUuid,
          result: accountStatusResponse.payload.accountStatus as any,
          failureReason:
            accountStatusResponse.payload.statusMessage || "账号状态异常",
          attemptedAt: new Date(),
          clientInfo,
        });
        return {
          success: false,
          message:
            accountStatusResponse.payload.statusMessage ||
            "账号状态异常，无法登录",
        };
      }

      // 4. 验证登录凭证（密码）
      const { success: credentialValid, accessToken } =
        authCredential.verifyPassword(password);
      if (!credentialValid || !accessToken) {
        await this.publishCredentialVerificationEvent({
          accountUuid,
          username,
          credentialId: authCredential.uuid,
          verificationResult: "failed",
          failureReason: "密码错误",
          verifiedAt: new Date(),
          clientInfo,
        });
        await this.publishLoginAttemptEvent({
          username,
          accountUuid,
          result: "invalid_credentials",
          failureReason: "密码错误",
          attemptedAt: new Date(),
          clientInfo,
        });
        return {
          success: false,
          message: "用户名或密码错误",
        };
      }

      // 5. 记住我令牌
      if (remember) {
        const rememberToken = authCredential.createRememberToken(
          clientInfo?.deviceId || "unknown-device"
        );
        await this.tokenRepository.save(rememberToken);
      }

      // 6. 保存访问令牌
      await tokenService.saveToken(accessToken, this.tokenRepository);

      // 7. 保存登录信息到会话存储
      const newAuthSession = authCredential.createSession(
        accessToken.value,
        clientInfo?.deviceId || "unknown-device",
        clientInfo?.country || "unknown",
        clientInfo?.userAgent
      );
      await this.sessionRepository.save(newAuthSession);

      authSession.setAuthInfo({
        username: username,
        token: accessToken.value,
        accountUuid: accountUuid,
        sessionUuid: newAuthSession.uuid,
      });

      // 8. 发布相关事件
      await this.publishCredentialVerificationEvent({
        accountUuid,
        username,
        credentialId: authCredential.uuid,
        verificationResult: "success",
        verifiedAt: new Date(),
        clientInfo,
      });
      await this.publishUserLoggedInEvent({
        accountUuid,
        username,
        credentialId: authCredential.uuid,
        sessionUuid: newAuthSession.uuid,
        loginAt: new Date(),
        clientInfo,
      });
      await this.publishLoginAttemptEvent({
        username,
        accountUuid,
        result: "success",
        attemptedAt: new Date(),
        clientInfo,
      });

      // 9. 返回登录结果
      return {
        success: true,
        message: "登录成功",
        data: {
          username,
          accountUuid,
          token: accessToken.value || "",
          sessionUuid: newAuthSession.uuid,
        },
      };
    } catch (error) {
      await this.publishLoginAttemptEvent({
        username,
        result: "failed",
        failureReason: error instanceof Error ? error.message : "系统异常",
        attemptedAt: new Date(),
        clientInfo,
      });
      return {
        success: false,
        message: "登录失败，请稍后重试",
      };
    }
  }

  /**
   * 获取本地可快速登录的账号列表
   * @returns { success, message, data } data为账号数组
   * @example
   * const resp = await service.getQuickLoginAccounts();
   * // resp: { success: true, message: "获取快速登录账号列表成功", data: [{ accountUuid, username, token }] }
   */
  async getQuickLoginAccounts(): Promise<
    TResponse<Array<{ accountUuid: string; username: string; token: string }>>
  > {
    try {
      const tokens: Array<Token> = await this.tokenRepository.findByType(
        TokenType.REMEMBER_ME
      );
      const accounts = [];
      for (const t of tokens) {
        if (t.isExpired()) continue;
        const { accountDTO } = await this.getAccountByAccountUuid(
          t.accountUuid
        );
        if (accountDTO) {
          accounts.push({
            accountUuid: t.accountUuid,
            username: accountDTO.username,
            token: t.value,
          });
        }
      }
      return {
        success: true,
        message: "获取快速登录账号列表成功",
        data: accounts,
      };
    } catch (error) {
      return {
        success: false,
        message: "获取快速登录账号失败，请稍后重试",
        data: [],
      };
    }
  }

  /**
   * 记住我令牌登录（快速登录）
   * @param request RememberMeTokenAuthenticationRequest
   * @returns 登录响应对象
   * @example
   * const resp = await service.rememberMeTokenAuthentication({
   *   username: "user1",
   *   accountUuid: "uuid",
   *   rememberMeToken: "token",
   *   clientInfo: { deviceId: "dev1", userAgent: "UA" }
   * });
   * // resp: { success: true, message: "登录成功", data: { accountUuid, username, sessionUuid, token } }
   */
  async rememberMeTokenAuthentication(
    request: RememberMeTokenAuthenticationRequest
  ): Promise<TResponse<RememberMeTokenAuthenticationResponse>> {
    const { username, accountUuid, rememberMeToken, clientInfo } = request;

    // 1. 验证账号状态
    const accountStatusResponse = await this.verifyAccountStatus(
      accountUuid,
      username
    );
    if (!accountStatusResponse.payload.isLoginAllowed) {
      await this.publishLoginAttemptEvent({
        username,
        accountUuid,
        result: accountStatusResponse.payload.accountStatus as any,
        failureReason:
          accountStatusResponse.payload.statusMessage || "账号状态异常",
        attemptedAt: new Date(),
        clientInfo,
      });
      return {
        success: false,
        message:
          accountStatusResponse.payload.statusMessage ||
          "账号状态异常，无法登录",
      };
    }

    // 2. 验证 rememberMeToken
    const authCredential =
      await this.authCredentialRepository.findByAccountUuid(accountUuid);
    if (!authCredential) {
      return {
        success: false,
        message: "账号认证凭证不存在",
      };
    }
    const { success: isRememberMeTokenValid, accessToken } =
      authCredential.verifyRememberToken(rememberMeToken);
    if (!isRememberMeTokenValid) {
      return {
        success: false,
        message: "无效的记住我令牌",
      };
    }

    // 3. 创建新的会话
    const newSession = authCredential.createSession(
      rememberMeToken,
      clientInfo?.deviceId || "unknown-device",
      clientInfo?.country || "unknown",
      clientInfo?.userAgent
    );
    await this.sessionRepository.save(newSession);
    authSession.setAuthInfo({
      username: username,
      token: accessToken!.value,
      accountUuid: accountUuid,
      sessionUuid: newSession.uuid,
    });

    // 4. 返回成功响应
    return {
      success: true,
      message: "登录成功",
      data: {
        accountUuid,
        username,
        sessionUuid: newSession.uuid,
        token: accessToken?.value || "",
      },
    };
  }

  /**
   * 销毁服务，清理资源
   * 用于关闭服务时释放所有pending请求
   */
  destroy(): void {
    for (const [, pending] of this.pendingStatusVerifications.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("服务正在关闭"));
    }
    this.pendingStatusVerifications.clear();
  }

  // ===================== 私有方法（事件/异步/内部工具） =====================

  /**
   * 通过 accountUuid 异步获取账号信息（事件驱动，带超时）
   * @param accountUuid 账号UUID
   * @returns Promise<{ accountDTO: AccountDTO }>
   * @example
   * const { accountDTO } = await service.getAccountByAccountUuid("uuid");
   * // accountDTO: { username, ... }
   */
  private async getAccountByAccountUuid(
    accountUuid: string
  ): Promise<{ accountDTO: AccountDTO }> {
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAccountRequests.delete(requestId);
        reject(new Error("获取账号信息超时"));
      }, 10000);
      this.pendingAccountRequests.set(requestId, { resolve, reject, timeout });
      const event: AccountInfoGetterRequestedEvent = {
        eventType: "AccountInfoGetterRequested",
        aggregateId: accountUuid,
        occurredOn: new Date(),
        payload: {
          accountUuid: accountUuid,
          requestedAt: new Date(),
          requestId,
        },
      };
      eventBus.publish(event);
    });
  }

  /**
   * 通过用户名异步获取账号UUID（事件驱动，带超时）
   * @param username 用户名
   * @returns Promise<{ accountUuid?: string }>
   * @example
   * const { accountUuid } = await service.getAccountUuidByUsername("user1");
   */
  private async getAccountUuidByUsername(
    username: string
  ): Promise<{ accountUuid?: string }> {
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAccountUuidRequests.delete(requestId);
        reject(new Error("获取账号ID超时"));
      }, 10000);
      this.pendingAccountUuidRequests.set(requestId, {
        resolve,
        reject,
        timeout,
      });
      const event: AccountUuidGetterRequestedEvent = {
        eventType: "AccountUuidGetterRequested",
        aggregateId: username,
        occurredOn: new Date(),
        payload: {
          username,
          requestedAt: new Date(),
          requestId,
        },
      };
      eventBus.publish(event);
    });
  }

  /**
   * 异步验证账号状态（事件驱动，带超时）
   * @param accountUuid 账号UUID
   * @param username 用户名
   * @returns Promise<AccountStatusVerificationResponseEvent>
   * @example
   * const resp = await service.verifyAccountStatus("uuid", "user1");
   */
  private async verifyAccountStatus(
    accountUuid: string,
    username: string
  ): Promise<AccountStatusVerificationResponseEvent> {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const timeout = setTimeout(() => {
        this.pendingStatusVerifications.delete(requestId);
        reject(new Error("账号状态验证超时"));
      }, 10000);
      this.pendingStatusVerifications.set(requestId, {
        resolve,
        reject,
        timeout,
      });
      const verificationRequestEvent: AccountStatusVerificationRequestedEvent = {
        eventType: "AccountStatusVerificationRequested",
        aggregateId: accountUuid,
        occurredOn: new Date(),
        payload: {
          accountUuid,
          username,
          requestedAt: new Date(),
          requestId,
        },
      };
      eventBus.publish(verificationRequestEvent);
    });
  }

  /**
   * 注册事件监听器（账号状态验证响应、账号ID获取响应）
   * 负责异步Promise的resolve/reject
   */
  private setupEventListeners(): void {
    eventBus.subscribe(
      "AccountInfoGetterResponse",
      async (event: AccountInfoGetterResponseEvent) => {
        const { requestId, accountDTO } = event.payload;
        const pending = this.pendingAccountRequests.get(requestId);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingAccountRequests.delete(requestId);
          pending.resolve({ accountDTO });
        }
      }
    );
    eventBus.subscribe(
      "AccountStatusVerificationResponse",
      async (event: AccountStatusVerificationResponseEvent) => {
        const requestId = event.payload.requestId;
        const pending = this.pendingStatusVerifications.get(requestId);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingStatusVerifications.delete(requestId);
          pending.resolve(event);
        }
      }
    );
    eventBus.subscribe(
      "AccountUuidGetterResponse",
      async (event: AccountUuidGetterResponseEvent) => {
        const { requestId, accountUuid } = event.payload;
        const pending = this.pendingAccountUuidRequests.get(requestId);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingAccountUuidRequests.delete(requestId);
          if (!accountUuid) {
            pending.reject(new Error("账号不存在"));
          } else {
            pending.resolve({ accountUuid });
          }
        }
      }
    );
  }

  /**
   * 发布登录凭证验证事件
   * @param payload 事件负载
   */
  private async publishCredentialVerificationEvent(
    payload: LoginCredentialVerificationEvent["payload"]
  ): Promise<void> {
    const event: LoginCredentialVerificationEvent = {
      eventType: "LoginCredentialVerification",
      aggregateId: payload.accountUuid,
      occurredOn: new Date(),
      payload,
    };
    await eventBus.publish(event);
  }

  /**
   * 发布登录尝试事件
   * @param payload 事件负载
   */
  private async publishLoginAttemptEvent(
    payload: LoginAttemptEvent["payload"]
  ): Promise<void> {
    const event: LoginAttemptEvent = {
      eventType: "LoginAttempt",
      aggregateId: payload.accountUuid || "unknown",
      occurredOn: new Date(),
      payload,
    };
    await eventBus.publish(event);
  }

  /**
   * 发布用户登录成功事件
   * @param payload 事件负载
   */
  private async publishUserLoggedInEvent(
    payload: UserLoggedInEvent["payload"]
  ): Promise<void> {
    const event: UserLoggedInEvent = {
      eventType: "UserLoggedIn",
      aggregateId: payload.accountUuid,
      occurredOn: new Date(),
      payload,
    };
    await eventBus.publish(event);
  }
}

/**
 * TResponse<T> 结构示例
 * {
 *   success: boolean,
 *   message: string,
 *   data?: T
 * }
 */