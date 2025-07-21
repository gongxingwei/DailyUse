import { AuthenticationContainer } from "../../infrastructure/di/authenticationContainer";
import { IAuthCredentialRepository, ITokenRepository } from "../../domain/repositories/authenticationRepository";
import { SqliteAuthCredentialRepository, SqliteTokenRepository } from "../../index";
import {
  AccountUuidGetterRequestedEvent,
  AccountStatusVerificationRequestedEvent,
  LoginCredentialVerificationEvent,
  LoginAttemptEvent,
  UserLoggedInEvent,
} from "../../domain/events/authenticationEvents";
import { AccountStatusVerificationResponseEvent } from "../../../Account/domain/events/accountEvents";
import { eventBus } from "../../../../shared/events/eventBus";
import { generateUUID } from "@/shared/utils/uuid";
import { AccountUuidGetterResponseEvent } from "../../../Account/index"
// domainServices
import { tokenService } from "../../domain/services/tokenService";
import { authSession } from "../../application/services/authSessionStore";
// types
import type { PasswordAuthenticationResponse, PasswordAuthenticationRequest } from "../../domain/types";


/**
 * Authentication 模块的登录服务
 */
export class AuthenticationLoginService{
  private static instance: AuthenticationLoginService | null = null;
  private authCredentialRepository: IAuthCredentialRepository;
  private tokenRepository: ITokenRepository;
  private pendingAccountUuidRequests = new Map<
    string,
    {
      resolve: (response: {
        accountUuid?: string;
      }) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  private pendingStatusVerifications = new Map<
    string,
    {
      resolve: (response: AccountStatusVerificationResponseEvent) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  constructor(authCredentialRepository: IAuthCredentialRepository, tokenRepository: ITokenRepository) {
    // 监听账号状态验证响应
    this.authCredentialRepository = authCredentialRepository;
    this.tokenRepository = tokenRepository;
    this.setupEventListeners();
  }

  /**
   * 创建服务实例
   * @param authCredentialRepository 可选的认证凭证仓库
   * @param tokenRepository 可选的令牌仓库
   * @return 返回一个新的 AuthenticationLoginService 实例
   * 可以通过依赖注入的方式传入自定义的仓库实现，默认为容器中的实现
   */
  static async createInstance(authCredentialRepository?: IAuthCredentialRepository, tokenRepository?: ITokenRepository): Promise<AuthenticationLoginService> {
    const authenticationContainer = await AuthenticationContainer.getInstance();
    authCredentialRepository = authCredentialRepository || authenticationContainer.getAuthCredentialRepository();
    tokenRepository = tokenRepository || authenticationContainer.getTokenRepository();
    console.log('[AuthLoginService] 创建实例', { authCredentialRepository, tokenRepository })
    return new AuthenticationLoginService(authCredentialRepository, tokenRepository);
  }

  static async getInstance(): Promise<AuthenticationLoginService> {
    if (!AuthenticationLoginService.instance) {
      AuthenticationLoginService.instance = await AuthenticationLoginService.createInstance();
    }
    return AuthenticationLoginService.instance;
  }

  /**
   * 处理用户登录请求
   */
  async PasswordAuthentication(request: PasswordAuthenticationRequest): Promise<TResponse<PasswordAuthenticationResponse>> {
    const { username, password, clientInfo } = request;

    console.log("🔐 [AuthLogin] 开始处理登录请求:", username);

    try {
      const { accountUuid } = await this.getAccountUuidByUsername(
        username
      );

      if (!accountUuid) {
        console.log("❌ [AuthLogin] 账号不存在:", username);
        return {
          success: false,
          message: "账号不存在",
          data: undefined
        };
        
      }

      const authCredential = await this.authCredentialRepository.findByAccountUuid(
        accountUuid
      );

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

      // 2. 验证账号状态
      const accountStatusResponse = await this.verifyAccountStatus(
        accountUuid,
        username
      );

      if (!accountStatusResponse.payload.isLoginAllowed) {
        console.log(
          "❌ [AuthLogin] 账号状态不允许登录:",
          accountStatusResponse.payload.accountStatus
        );

        // 发布登录尝试失败事件
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

      console.log("✓ [AuthLogin] 账号状态验证通过");

      // 3. 验证登录凭证（密码）
      const {success: credentialValid, token: accessToken} = authCredential.verifyPassword(password);

      
      // 如果凭证验证失败
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
      await tokenService.saveToken(accessToken,this.tokenRepository);
      console.log("✓ [AuthLogin] 密码验证通过，访问令牌已保存");
      // 3. 保存登录信息到会话存储
      authSession.setAuthInfo({
        token: accessToken.value,
        accountUuid: accountUuid,
      });
      // 4. 生成会话ID
      const sessionId = generateUUID();

      // 5. 发布凭证验证成功事件
      await this.publishCredentialVerificationEvent({
        accountUuid,
        username,
        credentialId: authCredential.uuid,
        verificationResult: "success",
        verifiedAt: new Date(),
        clientInfo,
      });

      // 6. 发布登录成功事件
      await this.publishUserLoggedInEvent({
        accountUuid,
        username,
        credentialId: authCredential.uuid,
        sessionId,
        loginAt: new Date(),
        clientInfo,
      });

      // 7. 发布登录尝试成功事件
      await this.publishLoginAttemptEvent({
        username,
        accountUuid,
        result: "success",
        attemptedAt: new Date(),
        clientInfo,
      });

      console.log("✅ [AuthLogin] 用户登录成功:", {
        username,
        accountUuid,
        sessionId,
      });
      return {
        success: true,
        message: "登录成功",
        data: {
          username,
          accountUuid,
          token: accessToken.value || null
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

  private async getAccountUuidByUsername(
    username: string
  ): Promise<{ accountUuid?: string }> {
    const requestId = generateUUID();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAccountUuidRequests.delete(requestId);
        reject(new Error("获取账号ID超时"));
      }, 10000); // 10秒超时

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
   * 验证账号状态
   */
  private async verifyAccountStatus(
    accountUuid: string,
    username: string
  ): Promise<AccountStatusVerificationResponseEvent> {
    return new Promise((resolve, reject) => {
      const requestId = generateUUID();
      const timeout = setTimeout(() => {
        this.pendingStatusVerifications.delete(requestId);
        reject(new Error("账号状态验证超时"));
      }, 10000); // 10秒超时

      // 保存pending请求
      this.pendingStatusVerifications.set(requestId, {
        resolve,
        reject,
        timeout,
      });

      // 发布账号状态验证请求事件
      const verificationRequestEvent: AccountStatusVerificationRequestedEvent =
        {
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
   * 设置事件监听器
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


  /**
   * 清理资源
   */
  destroy(): void {
    // 清理所有pending请求
    for (const [, pending] of this.pendingStatusVerifications.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("服务正在关闭"));
    }
    this.pendingStatusVerifications.clear();
  }
}
