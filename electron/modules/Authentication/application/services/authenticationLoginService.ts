import { IAuthCredentialRepository } from "../../domain/repositories/authenticationRepository";
import { SqliteAuthCredentialRepository } from "../../index";
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
// types
import type { PasswordAuthenticationResponse, PasswordAuthenticationRequest } from "../../domain/types";

/**
 * Authentication 模块的登录服务
 */
export class AuthenticationLoginService {
  private pendingAccountIdRequests = new Map<
    string,
    {
      resolve: (response: {
        accountId?: string;
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

  private authCredentialRepository: IAuthCredentialRepository;

  constructor() {
    // 监听账号状态验证响应
    this.authCredentialRepository = new SqliteAuthCredentialRepository();
    this.setupEventListeners();
  }

  /**
   * 处理用户登录请求
   */
  async PasswordAuthentication(request: PasswordAuthenticationRequest): Promise<TResponse<PasswordAuthenticationResponse>> {
    const { username, password, clientInfo } = request;

    console.log("🔐 [AuthLogin] 开始处理登录请求:", username);

    try {
      const { accountId } = await this.getAccountIdByUsername(
        username
      );

      if (!accountId) {
        console.log("❌ [AuthLogin] 账号不存在:", username);
        return {
          success: false,
          message: "账号不存在",
          data: undefined
        };
        
      }

      const authCredential = await this.authCredentialRepository.findByAccountId(
        accountId
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
        accountId,
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
          accountId,
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
      const {success: credentialValid, tokenValue} = authCredential.verifyPassword(password);

      if (!credentialValid) {
        console.log("❌ [AuthLogin] 密码验证失败");

        // 发布凭证验证失败事件
        await this.publishCredentialVerificationEvent({
          accountId,
          username,
          credentialId: authCredential.id,
          verificationResult: "failed",
          failureReason: "密码错误",
          verifiedAt: new Date(),
          clientInfo,
        });

        // 发布登录尝试失败事件
        await this.publishLoginAttemptEvent({
          username,
          accountId,
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

      console.log("✓ [AuthLogin] 密码验证通过");

      // 4. 生成会话ID
      const sessionId = generateUUID();

      // 5. 发布凭证验证成功事件
      await this.publishCredentialVerificationEvent({
        accountId,
        username,
        credentialId: authCredential.id,
        verificationResult: "success",
        verifiedAt: new Date(),
        clientInfo,
      });

      // 6. 发布登录成功事件
      await this.publishUserLoggedInEvent({
        accountId,
        username,
        credentialId: authCredential.id,
        sessionId,
        loginAt: new Date(),
        clientInfo,
      });

      // 7. 发布登录尝试成功事件
      await this.publishLoginAttemptEvent({
        username,
        accountId,
        result: "success",
        attemptedAt: new Date(),
        clientInfo,
      });

      console.log("✅ [AuthLogin] 用户登录成功:", {
        username,
        accountId,
        sessionId,
      });

      return {
        success: true,
        message: "登录成功",
        data: {
          username,
          accountId,
          token: tokenValue || null
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

  private async getAccountIdByUsername(
    username: string
  ): Promise<{ accountId?: string }> {
    const requestId = generateUUID();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAccountIdRequests.delete(requestId);
        reject(new Error("获取账号ID超时"));
      }, 10000); // 10秒超时

      this.pendingAccountIdRequests.set(requestId, {
        resolve,
        reject,
        timeout,
      });

      const event: AccountIdGetterRequestedEvent = {
        eventType: "AccountIdGetterRequested",
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
    accountId: string,
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
          aggregateId: accountId,
          occurredOn: new Date(),
          payload: {
            accountId,
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
    eventBus.subscribe('AccountIdGetterResponse', async (event: AccountIdGetterResponseEvent) => {
    const { requestId, accountId } = event.payload;
    const pending = this.pendingAccountIdRequests.get(requestId);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingAccountIdRequests.delete(requestId);
      if (!accountId) {
        pending.reject(new Error("账号不存在"));

      } else {
        pending.resolve({ accountId });
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
      aggregateId: payload.accountId,
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
      aggregateId: payload.accountId || "unknown",
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
      aggregateId: payload.accountId,
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
