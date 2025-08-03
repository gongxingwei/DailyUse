import type {
  PasswordAuthenticationRequest,
  PasswordAuthenticationResponse,
  AuthInfo,
  LogoutResult,
  RememberMeTokenAuthenticationRequest,
  RememberMeTokenAuthenticationResponse,
} from "../../domain/types";
import { useAuthenticationStore } from "../../presentation/stores/authenticationStore";
import { authenticationIpcClient } from "../../infrastructure/ipcs/authenticationIpcClient";
// 事件系统
import { eventBus } from "@common/shared/events/eventBus";
import type { UserLoggedInEvent, UserLoggedInEventPayload,  } from "../../domain/events/authenticationEvents";

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
          username: response.data.username,
          sessionUuid: response.data.sessionUuid,
          token: response.data.token,
          accountUuid: response.data.accountUuid,
        });
        console.log("登录成功")
        await authenticationIpcClient.loginSuccessEvent();
        
      }
      return response;
    } catch (error) {
      console.error("登录失败:", error);
      return {
        success: false,
        message: "登录失败，请稍后重试",
      };
    }
  }

  async getQuickLoginAccounts(): Promise<Array<{ accountUuid: string; username: string; token: string }>> {
    try {
      const response = await authenticationIpcClient.getQuickLoginAccounts();
      return response.data || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  /**
   * 用户登录（记住我令牌）
   * @returns 
   */
  async rememberMeTokenAuthentication(
    request: RememberMeTokenAuthenticationRequest
  ): Promise<TResponse<RememberMeTokenAuthenticationResponse>> {
    try {
      const response = await authenticationIpcClient.rememberMeTokenAuthentication(
        request
      );
      if (response.success && response.data && response.data.token && response.data.accountUuid) {
        this.authenticationStore.$patch({
          username: response.data.username,
          accountUuid: response.data.accountUuid,
          token: response.data.token,
          sessionUuid: response.data.sessionUuid,
        });
        await authenticationIpcClient.loginSuccessEvent();
        await this.publishUserLoggedInEvent({
          accountUuid: response.data.accountUuid as string,
          username: response.data.username as string,
          token: response.data.token as string,
        });
      }
      return response;
    } catch (error) {
      console.error("登录失败:", error);
      return {
        success: false,
        message: "登录失败，请稍后重试",
      };
    }
  }

  async getAuthInfo(): Promise<TResponse<AuthInfo>> {
    try {
      const response = await authenticationIpcClient.getLoginInfo();
      if (response.success && response.data) {
        this.authenticationStore.$patch({
          username: response.data.username,
          accountUuid: response.data.accountUuid,
          token: response.data.token,
          sessionUuid: response.data.sessionUuid,
        });
        await this.publishUserLoggedInEvent(response.data);
      }
      return response;
    } catch (error) {
      console.error("获取认证信息失败:", error);
      return {
        success: false,
        message: "获取认证信息失败，请稍后重试",
        data: undefined,
      };
    }
  }

  async logout(): Promise<TResponse<LogoutResult>> {
    try {
      const response = await authenticationIpcClient.logout({
        username: this.authenticationStore.username!,
        token: this.authenticationStore.token!,
        sessionUuid: this.authenticationStore.sessionUuid!,
        accountUuid: this.authenticationStore.accountUuid!,
        logoutType: 'manual',
        reason: "用户主动注销",
      });
      if (response.success) {
        this.authenticationStore.$reset();
        await authenticationIpcClient.logoutEvent();
      }
      return response;
    } catch (error) {
      console.error("注销失败:", error);
      return {
        success: false,
        message: "注销失败，请稍后重试",
        data: undefined,
      };
    }
  }

  private async publishUserLoggedInEvent(eventData: UserLoggedInEventPayload) {
   const event: UserLoggedInEvent = {
     eventType: "UserLoggedIn",
     aggregateId: eventData.accountUuid,
     occurredOn: new Date(),
     payload: eventData,
   };
   await eventBus.publish(event);
  }
}

export const authenticationService = AuthenticationService.getInstance();