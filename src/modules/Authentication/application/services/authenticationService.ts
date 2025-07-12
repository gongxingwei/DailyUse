import type {
  PasswordAuthenticationRequest,
  PasswordAuthenticationResponse,
} from "../../domain/types";
import { useAuthenticationStore } from "../../presentation/stores/authenticationStore";
import { authenticationIpcClient } from "../../infrastructure/ipcs/authenticationIpcClient";
// 事件系统
import { eventBus } from "../../../../shared/events/eventBus";
import type { UserLoggedInEvent, UserLoggedInEventPayload } from "../../domain/events/authenticationEvents";
/**
 * 认证服务
 * 负责用户认证相关的业务逻辑
 */
export class AuthenticationService {
  private static instance: AuthenticationService;
  private _authenticationStore: ReturnType<
    typeof useAuthenticationStore
  > | null = null;

  constructor() {}

  private get authenticationStore() {
    if (!this._authenticationStore) {
      this._authenticationStore = useAuthenticationStore();
    }
    return this._authenticationStore;
  }

  public static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  /**
   * 用户登录(用密码)
   */
  async passwordAuthentication(
    credentials: PasswordAuthenticationRequest
  ): Promise<TResponse<PasswordAuthenticationResponse>> {
    console.log('[authenticationService]: passwordAuthentication 函数调用')
    try {
      const response = await authenticationIpcClient.passwordAuthentication(
        credentials
      );
      if (response.success && response.data) {
        this.authenticationStore.$patch({
          token: response.data.token,
          accountId: response.data.accountId,
        });
        console.log("登录成功,开始发送用户登录事件")
        await this.publishUserLoggedInEvent(response.data);
      }
      return response;
    } catch (error) {
      console.error("登录失败:", error);
      return {
        success: false,
        message: "登录失败，请稍后重试",
        data: {
          token: null,
          username: "",
          accountId: "",
        },
      };
    }
  }

  private async publishUserLoggedInEvent(eventData: UserLoggedInEventPayload) {
   const event: UserLoggedInEvent = {
     eventType: "UserLoggedIn",
     aggregateId: eventData.accountId,
     occurredOn: new Date(),
     payload: eventData,
   };
   await eventBus.publish(event);
  }
}
