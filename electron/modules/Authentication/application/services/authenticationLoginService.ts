import { AuthenticationContainer } from "../../infrastructure/di/authenticationContainer";
import { IAuthCredentialRepository, ITokenRepository, ISessionRepository } from "../../domain/repositories/authenticationRepository";
import {
  AccountUuidGetterRequestedEvent,
  AccountStatusVerificationRequestedEvent,
  LoginCredentialVerificationEvent,
  LoginAttemptEvent,
  UserLoggedInEvent,
} from "../../domain/events/authenticationEvents";
import { AccountStatusVerificationResponseEvent } from "../../../Account/domain/events/accountEvents";
import { eventBus } from "../../../../shared/events/eventBus";
import { AccountUuidGetterResponseEvent } from "../../../Account/index";
import { tokenService } from "../../domain/services/tokenService";
import { authSession } from "../../application/services/authSessionStore";
import type { PasswordAuthenticationResponse, PasswordAuthenticationRequest } from "../../domain/types";
import crypto from "crypto";

// domains
import { Session } from "../../domain/entities/session";
import { Token } from "../../domain/valueObjects/token";


/**
 * AuthenticationLoginService
 * 
 * 负责处理用户登录流程、凭证验证、账号状态校验、事件发布等。
 * 支持依赖注入、事件驱动、异步处理，保证登录流程的解耦与可扩展性。
 */
export class AuthenticationLoginService {
  /**
   * 单例实例
   */
  private static instance: AuthenticationLoginService | null = null;

  /**
   * 认证凭证仓库
   */
  private authCredentialRepository: IAuthCredentialRepository;

  /**
   * 令牌仓库
   */
  private tokenRepository: ITokenRepository;

  /**
   * 会话仓库
   */
  private sessionRepository: ISessionRepository;

  /**
   * 待处理的账号ID请求（requestId -> Promise控制器）
   */
  private pendingAccountUuidRequests = new Map<
    string,
    {
      resolve: (response: { accountUuid?: string }) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  /**
   * 待处理的账号状态验证请求（requestId -> Promise控制器）
   */
  private pendingStatusVerifications = new Map<
    string,
    {
      resolve: (response: AccountStatusVerificationResponseEvent) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  /**
   * 构造函数
   * @param authCredentialRepository 认证凭证仓库
   * @param tokenRepository 令牌仓库
   * 构造时自动注册事件监听器
   */
  constructor(authCredentialRepository: IAuthCredentialRepository, tokenRepository: ITokenRepository, sessionRepository: ISessionRepository) {
    this.authCredentialRepository = authCredentialRepository;
    this.tokenRepository = tokenRepository;
    this.sessionRepository = sessionRepository;
    this.setupEventListeners();
  }

  // ===================== 静态方法（单例/工厂） =====================

  /**
   * 创建服务实例（支持依赖注入）
   * @param authCredentialRepository 可选的认证凭证仓库
   * @param tokenRepository 可选的令牌仓库
   * @returns AuthenticationLoginService 实例
   */
  static async createInstance(
    authCredentialRepository?: IAuthCredentialRepository,
    tokenRepository?: ITokenRepository,
    sessionRepository?: ISessionRepository
  ): Promise<AuthenticationLoginService> {
    const authenticationContainer = await AuthenticationContainer.getInstance();
    authCredentialRepository = authCredentialRepository || authenticationContainer.getAuthCredentialRepository();
    tokenRepository = tokenRepository || authenticationContainer.getTokenRepository();
    sessionRepository = sessionRepository || authenticationContainer.getSessionRepository();

    return new AuthenticationLoginService(authCredentialRepository, tokenRepository, sessionRepository);
  }

  /**
   * 获取单例实例（全局唯一）
   */
  static async getInstance(): Promise<AuthenticationLoginService> {
    if (!AuthenticationLoginService.instance) {
      AuthenticationLoginService.instance = await AuthenticationLoginService.createInstance();
    }
    return AuthenticationLoginService.instance;
  }

  // ===================== 实例方法（业务主流程） =====================

  /**
   * 处理用户登录请求（主入口）
   * @param request 登录请求参数
   * @returns 登录响应（成功/失败）
   */
  async PasswordAuthentication(request: PasswordAuthenticationRequest): Promise<TResponse<PasswordAuthenticationResponse>> {
    const { username, password, clientInfo } = request;
    console.log("🔐 [AuthLogin] 开始处理登录请求:", username);
    try {
      // 1. 获取账号UUID（异步事件驱动）
      const { accountUuid } = await this.getAccountUuidByUsername(username);
      if (!accountUuid) {
        console.log("❌ [AuthLogin] 账号不存在:", username);
        return {
          success: false,
          message: "账号不存在",
          data: undefined
        };
      }

      // 2. 查询认证凭证
      const authCredential = await this.authCredentialRepository.findByAccountUuid(accountUuid);
      if (!authCredential) {
        console.log("❌ [AuthLogin] 找不到用户认证凭证:", username);
        // 发布登录尝试失败事件
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
      const accountStatusResponse = await this.verifyAccountStatus(accountUuid, username);
      if (!accountStatusResponse.payload.isLoginAllowed) {
        console.log("❌ [AuthLogin] 账号状态不允许登录:", accountStatusResponse.payload.accountStatus);
        // 发布登录尝试失败事件
        await this.publishLoginAttemptEvent({
          username,
          accountUuid,
          result: accountStatusResponse.payload.accountStatus as any,
          failureReason: accountStatusResponse.payload.statusMessage || "账号状态异常",
          attemptedAt: new Date(),
          clientInfo,
        });
        return {
          success: false,
          message: accountStatusResponse.payload.statusMessage || "账号状态异常，无法登录",
        };
      }
      console.log("✓ [AuthLogin] 账号状态验证通过");

      // 4. 验证登录凭证（密码）
      const { success: credentialValid, token: accessToken } = authCredential.verifyPassword(password);
      if (!credentialValid || !accessToken) {
        console.log("❌ [AuthLogin] 密码验证失败");
        // 发布凭证验证失败事件
        await this.publishCredentialVerificationEvent({
          accountUuid,
          username,
          credentialId: authCredential.uuid,
          verificationResult: "failed",
          failureReason: "密码错误",
          verifiedAt: new Date(),
          clientInfo,
        });
        // 发布登录尝试失败事件
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
      console.log("✓ [AuthLogin] 密码验证通过，生成访问令牌");
      // 5. 保存令牌
      await tokenService.saveToken(accessToken, this.tokenRepository);
      console.log("✓ [AuthLogin] 密码验证通过，访问令牌已保存");
      // 6. 保存登录信息到会话存储
      const newAuthSession =authCredential.createSession(accessToken.value,clientInfo?.deviceId || "unknown-device", clientInfo?.country || "unknown", clientInfo?.userAgent);

      await this.sessionRepository.save(newAuthSession);

      authSession.setAuthInfo({
        username: username,
        token: accessToken.value,
        accountUuid: accountUuid,
        sessionUuid: newAuthSession.uuid,
      });
      // 7. 生成会话ID
      const sessionId = crypto.randomUUID();
      // 8. 发布凭证验证成功事件
      await this.publishCredentialVerificationEvent({
        accountUuid,
        username,
        credentialId: authCredential.uuid,
        verificationResult: "success",
        verifiedAt: new Date(),
        clientInfo,
      });
      // 9. 发布登录成功事件
      await this.publishUserLoggedInEvent({
        accountUuid,
        username,
        credentialId: authCredential.uuid,
        sessionUuid: newAuthSession.uuid,
        loginAt: new Date(),
        clientInfo,
      });
      // 10. 发布登录尝试成功事件
      await this.publishLoginAttemptEvent({
        username,
        accountUuid,
        result: "success",
        attemptedAt: new Date(),
        clientInfo,
      });
      console.log("✅ [AuthLogin] 用户登录成功:", { username, accountUuid, sessionId });
      return {
        success: true,
        message: "登录成功",
        data: {
          username,
          accountUuid,
          token: accessToken.value || null,
          sessionUuid: newAuthSession.uuid,
        },
      };
    } catch (error) {
      console.error("❌ [AuthLogin] 登录处理异常:", error);
      // 发布登录尝试失败事件
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
   * 销毁服务，清理资源
   * 用于关闭服务时释放所有pending请求
   */
  destroy(): void {
    // 清理所有pending账号状态验证请求
    for (const [, pending] of this.pendingStatusVerifications.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("服务正在关闭"));
    }
    this.pendingStatusVerifications.clear();
  }

  // ===================== 私有方法（事件/异步/内部工具） =====================

  /**
   * 通过用户名异步获取账号UUID（事件驱动，带超时）
   * @param username 用户名
   * @returns Promise<{ accountUuid?: string }>
   */
  private async getAccountUuidByUsername(username: string): Promise<{ accountUuid?: string }> {
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAccountUuidRequests.delete(requestId);
        reject(new Error("获取账号ID超时"));
      }, 10000); // 10秒超时
      this.pendingAccountUuidRequests.set(requestId, { resolve, reject, timeout });
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
   */
  private async verifyAccountStatus(accountUuid: string, username: string): Promise<AccountStatusVerificationResponseEvent> {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const timeout = setTimeout(() => {
        this.pendingStatusVerifications.delete(requestId);
        reject(new Error("账号状态验证超时"));
      }, 10000); // 10秒超时
      // 保存pending请求
      this.pendingStatusVerifications.set(requestId, { resolve, reject, timeout });
      // 发布账号状态验证请求事件
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
      console.log("📤 [AuthLogin] 已发送账号状态验证请求:", requestId);
    });
  }

  /**
   * 注册事件监听器（账号状态验证响应、账号ID获取响应）
   * 负责异步Promise的resolve/reject
   */
  private setupEventListeners(): void {
    // 监听账号状态验证响应
    eventBus.subscribe(
      "AccountStatusVerificationResponse",
      async (event: AccountStatusVerificationResponseEvent) => {
        const requestId = event.payload.requestId;
        const pending = this.pendingStatusVerifications.get(requestId);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingStatusVerifications.delete(requestId);
          pending.resolve(event);
          console.log("📥 [AuthLogin] 收到账号状态验证响应:", requestId);
        }
      }
    );
    // 监听账号ID获取响应
    eventBus.subscribe('AccountUuidGetterResponse', async (event: AccountUuidGetterResponseEvent) => {
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
    });
  }

  /**
   * 发布登录凭证验证事件
   * @param payload 事件负载
   */
  private async publishCredentialVerificationEvent(payload: LoginCredentialVerificationEvent["payload"]): Promise<void> {
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
  private async publishLoginAttemptEvent(payload: LoginAttemptEvent["payload"]): Promise<void> {
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
  private async publishUserLoggedInEvent(payload: UserLoggedInEvent["payload"]): Promise<void> {
    const event: UserLoggedInEvent = {
      eventType: "UserLoggedIn",
      aggregateId: payload.accountUuid,
      occurredOn: new Date(),
      payload,
    };
    await eventBus.publish(event);
  }
}
