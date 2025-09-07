import { ipcMain } from "electron";
import { AuthenticationLoginService } from "../../application/services/authenticationLoginService";
import { AuthenticationLogoutService } from "../../application/services/authenticationLogoutService";
import type {
  PasswordAuthenticationRequest,
  PasswordAuthenticationResponse,
  AuthInfo,
  LogoutResult,
  LogoutRequest,
  RememberMeTokenAuthenticationRequest,
  RememberMeTokenAuthenticationResponse,
} from "../../domain/types";
import { authSession } from "../../application/services/authSessionStore";

/**
 * Authentication 模块的 IPC 处理器
 * 处理来自渲染进程的认证相关请求
 */
export class AuthenticationIpcHandler {
  private static instance: AuthenticationIpcHandler | null = null;
  private loginService: AuthenticationLoginService;
  private logoutService: AuthenticationLogoutService;

  constructor(
    loginService: AuthenticationLoginService,
    logoutService: AuthenticationLogoutService
  ) {
    this.loginService = loginService;
    this.logoutService = logoutService;
    this.setupIpcHandlers();
  }

  static async createInstance(): Promise<AuthenticationIpcHandler> {
    const loginService = await AuthenticationLoginService.getInstance();
    const logoutService = await AuthenticationLogoutService.getInstance();
    return new AuthenticationIpcHandler(loginService, logoutService);
  }
  static async getInstance(): Promise<AuthenticationIpcHandler> {
    if (!AuthenticationIpcHandler.instance) {
      AuthenticationIpcHandler.instance =
        await AuthenticationIpcHandler.createInstance();
    }
    return AuthenticationIpcHandler.instance;
  }

  static async registerIpcHandlers(): Promise<AuthenticationIpcHandler> {
    const instance = await AuthenticationIpcHandler.createInstance();
    return instance;
  }

  /**
   * 设置IPC处理器
   */
  private setupIpcHandlers(): void {
    ipcMain.handle(
      "authentication:get-login-info",
      async (_event): Promise<ApiResponse<AuthInfo>> => {
        const authInfo = authSession.getAuthInfo();
        if (authInfo) {
          return { success: true, message: "获取登录信息成功", data: authInfo };
        }
        return { success: false, message: "未登录" };
      }
    );

    ipcMain.handle(
      "authentication:password-authentication",
      async (
        _event,
        request: PasswordAuthenticationRequest
      ): Promise<ApiResponse<PasswordAuthenticationResponse>> => {
        try {
          const result = await this.loginService.PasswordAuthentication(
            request
          );

          console.log("📤 [AuthIpc] 登录处理完成:", {
            username: request.username,
            success: result.success,
          });

          return result;
        } catch (error) {
          console.error("❌ [AuthIpc] 登录处理异常:", error);

          return {
            success: false,
            message: "登录处理异常，请稍后重试",
          };
        }
      }
    );

    ipcMain.handle(
      "authentication:get-quick-login-accounts",
      async (
        _event
      ): Promise<
        ApiResponse<
          Array<{ accountUuid: string; username: string; token: string }>
        >
      > => {
        try {
          console.log("📥 [AuthIpc] 收到登出请求");
          const response = await this.loginService.getQuickLoginAccounts();
          return response;
        } catch (error) {
          console.error("❌ [AuthIpc] 获取快速登录账户列表异常:", error);
          return {
            success: false,
            message: "获取快速登录账户列表失败，请稍后重试",
            data: [],
          };
        }
      }
    );
    ipcMain.handle(
      "authentication:remember-me-token-authentication",
      async (
        _event,
        request: RememberMeTokenAuthenticationRequest
      ): Promise<ApiResponse<RememberMeTokenAuthenticationResponse>> => {
        try {
          const response =
            await this.loginService.rememberMeTokenAuthentication(request);
          return response;
        } catch (error) {
          console.error("❌ [AuthIpc] 获取快速登录账户列表异常:", error);
          return { success: false, message: "获取快速登录账户列表异常" };
        }
      }
    );
    // 处理登出请求
    ipcMain.handle(
      "authentication:logout",
      async (_event, request: LogoutRequest): Promise<LogoutResult> => {
        try {
          return await this.logoutService.logout(request);
        } catch (error) {
          console.error("❌ [AuthIpc] 登出处理异常:", error);
          return { success: false, message: "登出处理异常，请稍后重试" };
        }
      }
    );

    // 验证会话状态
    ipcMain.handle(
      "authentication:verify-session",
      async (
        _event,
        sessionUuid: string
      ): Promise<{ valid: boolean; accountUuid?: string }> => {
        try {
          console.log("🔐 [AuthIpc] 验证会话状态:", sessionUuid);

          // TODO: 实现会话验证逻辑
          // 1. 查找会话
          // 2. 检查过期时间
          // 3. 返回验证结果

          return {
            valid: false, // 暂时返回false，需要实现具体逻辑
            accountUuid: undefined,
          };
        } catch (error) {
          console.error("❌ [AuthIpc] 会话验证异常:", error);

          return {
            valid: false,
          };
        }
      }
    );

    console.log("✅ [AuthIpc] Authentication IPC handlers registered");
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 移除IPC监听器
    ipcMain.removeHandler("authentication:login");
    ipcMain.removeHandler("authentication:logout");
    ipcMain.removeHandler("authentication:verify-session");

    // 清理登录服务
    this.loginService.destroy();

    console.log("🧹 [AuthIpc] Authentication IPC handlers cleaned up");
  }
}
