import {
  IAuthCredentialRepository,
  ISessionRepository,
} from "../../domain/repositories/authenticationRepository";
import { eventBus } from "../../../../shared/events/eventBus";
import { AuthenticationContainer } from "../../infrastructure/di/authenticationContainer";
import {
  AccountDeactivationVerificationRequestedEvent,
  AccountDeactivationConfirmedEvent,
} from "../../domain/events/authenticationEvents";
import { authSession } from "../../application/services/authSessionStore";

/**
 * 账号注销服务
 * 负责发起注销流程、处理注销确认、发布相关事件
 */
export class AuthenticationDeactivationService {
  private static instance: AuthenticationDeactivationService;
  private authCredentialRepository: IAuthCredentialRepository;
  private sessionRepository: ISessionRepository;

  constructor(
    authCredentialRepository: IAuthCredentialRepository,
    sessionRepository: ISessionRepository
  ) {
    this.authCredentialRepository = authCredentialRepository;
    this.sessionRepository = sessionRepository;
  }

  static async createInstance(
    authCredentialRepository?: IAuthCredentialRepository,
    sessionRepository?: ISessionRepository
  ): Promise<AuthenticationDeactivationService> {
    const authenticationContainer = await AuthenticationContainer.getInstance();
    const authCredentialRepo =
      authCredentialRepository ||
      authenticationContainer.getAuthCredentialRepository();
    const sessionRepo =
      sessionRepository || authenticationContainer.getSessionRepository();
    return new AuthenticationDeactivationService(
      authCredentialRepo,
      sessionRepo
    );
  }

  static async getInstance(): Promise<AuthenticationDeactivationService> {
    if (!AuthenticationDeactivationService.instance) {
      AuthenticationDeactivationService.instance = await this.createInstance();
    }
    return AuthenticationDeactivationService.instance;
  }

  /**
   * 发起账号注销验证流程
   * @param accountUuid 账号ID
   * @param username 用户名
   * @param requestedBy 操作来源
   * @param reason 注销原因
   */
  async requestDeactivationVerification(
    accountUuid: string,
    username: string,
    requestedBy: "user" | "admin" | "system" = "user",
    reason?: string
  ): Promise<{ requestId: string }> {
    const requestId = crypto.randomUUID();
    const event: AccountDeactivationVerificationRequestedEvent = {
      eventType: "AccountDeactivationVerificationRequested",
      aggregateId: accountUuid,
      occurredOn: new Date(),
      payload: {
        accountUuid,
        username,
        requestId,
        requestedBy,
        reason,
        requestedAt: new Date(),
        clientInfo: undefined,
      },
    };
    await eventBus.publish(event);
    return { requestId };
  }

  /**
   * 处理账号注销确认（被验证通过后调用）
   */
  async confirmDeactivation(
    accountUuid: string,
    username: string,
    deactivatedBy: "user" | "admin" | "system" = "user",
    reason?: string
  ): Promise<void> {
    // 1. 清理认证凭证
    await this.authCredentialRepository.delete(accountUuid);

    // 2. 删除所有会话
    await this.sessionRepository.deleteByAccountUuid(accountUuid);

    // 3. 清除当前认证信息（如果是当前用户）

    authSession.clearAuthInfo();

    // 4. 发布账号注销确认事件
    const event: AccountDeactivationConfirmedEvent = {
      eventType: "AccountDeactivationConfirmed",
      aggregateId: accountUuid,
      occurredOn: new Date(),
      payload: {
        accountUuid,
        username,
        deactivatedBy,
        reason,
        deactivatedAt: new Date(),
        authDataCleanup: true,
        sessionTerminationCount: 0, // 可根据实际统计
      },
    };
    await eventBus.publish(event);
  }
}
