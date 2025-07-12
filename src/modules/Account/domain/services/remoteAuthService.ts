import { myaxios } from "@/shared/axios/request";
import type { TResponse } from "@/shared/types/response";
import type { TLoginData, TUser } from "../types/account";
// services
import { loginSessionService } from "./loginSessionService";
import { remoteUserService } from "./remoteUserService";
// utils
import { TokenManager } from "../../utils/tokenManagement";
// stores
import { useAccountStore } from "../../presentation/stores/accountStore";
import { UserDataInitService } from "@/shared/services/userDataInitService";
/**
 * 远程认证服务类
 * 负责处理与后端认证相关的所有 API 调用
 * 包括登录、登出、令牌刷新和快速登录等功能
 */
export class RemoteAuthService {
  /**
   * 刷新 Access Token
   * 使用有效的 Refresh Token 向后端请求新的 Access Token
   *
   * 后端处理流程：
   * 1. 验证 Refresh Token 的有效性和签名
   * 2. 检查 Token 中的用户是否仍然存在于数据库中
   * 3. 验证 Refresh Token 是否在数据库的有效令牌列表中
   * 4. 如果验证通过，生成新的 Access Token（有效期 15 分钟）
   * 5. 返回新的 Access Token
   *
   * @param refreshToken 用户的 Refresh Token，通常在登录时获得并本地保存
   * @returns Promise<TResponse<{ accessToken: string }>> 刷新结果
   * @returns TResponse.success 刷新操作是否成功
   * @returns TResponse.message 操作结果消息
   * @returns TResponse.data.accessToken 新的 Access Token（仅在成功时返回）
   *
   * @example
   * ```typescript
   * const savedRefreshToken = TokenManager.getRefreshToken();
   * const result = await RemoteAuthService.refreshToken(savedRefreshToken);
   *
   * if (result.success) {
   *   // 刷新成功，更新本地存储的 Access Token
   *   TokenManager.setAccessToken(result.data.accessToken);
   *   console.log('Token 刷新成功');
   * } else {
   *   // 刷新失败，可能需要重新登录
   *   console.error('Token 刷新失败:', result.message);
   *   // 常见失败原因：
   *   // - "用户不存在": 用户账户已被删除
   *   // - "Refresh Token 无效": Token 不在数据库白名单中或已被撤销
   *   // - "Refresh Token 无效或已过期": Token 格式错误、签名无效或已过期
   * }
   * ```
   *
   * @throws 网络错误或请求超时时抛出异常
   *
   * @see {@link TokenManager.getRefreshToken} 获取本地保存的 Refresh Token
   * @see {@link TokenManager.setAccessToken} 保存新的 Access Token
   * @see {@link TokenManager.clearTokens} 清除所有本地令牌
   */
  static async refreshToken(
    refreshToken: string
  ): Promise<TResponse<{ accessToken: string }>> {
    try {
      // 向后端发送刷新令牌请求
      // 后端会验证 refreshToken 的有效性、用户存在性和数据库白名单
      const response = await myaxios.post<TResponse>("/api/auth/refresh", {
        refreshToken,
      });

      // 返回包含新 accessToken 的响应
      // 成功时：{ success: true, message: "Token 刷新成功", data: { accessToken: "new_token" } }
      // 失败时：{ success: false, message: "具体错误信息" }
      return response as TResponse<{ accessToken: string }>;
    } catch (error) {
      // 处理网络错误、请求超时等异常情况
      console.error("Token refresh error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "刷新令牌失败",
        data: undefined,
      };
    }
  }

  /**
   * 用户登录
   * 向后端发送用户凭据进行身份验证
   *
   * @param loginForm 登录表单数据
   * @param loginForm.username 用户名
   * @param loginForm.password 密码
   * @param loginForm.remember 是否记住登录状态
   * @returns Promise<TResponse> 登录结果，包含用户信息和令牌
   *
   * 成功登录后的处理流程：
   * 1. 将 accessToken 和 refreshToken 保存到本地存储
   * 2. 创建本地登录会话记录，保存用户偏好设置
   * 3. 如果用户选择"记住我"，则保存 refreshToken 用于快速登录
   */
  static async login(loginForm: TLoginData): Promise<
    TResponse<{
      userWithoutPassword: Omit<TUser, "password">;
      accessToken: string;
      refreshToken: string;
    }>
  > {
    try {
      const response = await myaxios.post<TResponse>("/api/login", loginForm);
      if (response.success) {
        // 登录成功，保存令牌到本地存储
        TokenManager.setTokens(
          response.data.accessToken,
          response.data.refreshToken
        );
        localStorage.setItem("accountType", "remote"); // 标记为在线账户
        // 创建本地登录会话，用于快速登录和用户偏好管理

        try {
          await loginSessionService.createSession({
            username: response.data.userWithoutPassword.username,
            accountType: "online", // 标记为在线账户
            rememberMe: loginForm.remember, // 用户的记住密码偏好
            token: response.data.refreshToken, // 保存 refreshToken 用于快速登录
            autoLogin: false, // 默认不自动登录
          });
        } catch (error) {
          console.error("创建登录会话失败:", error);
        }

        // 初始化用户数据
        try {
          await UserDataInitService.initUserData(
            response.data.userWithoutPassword.username
          );
        } catch (error) {
          console.error("用户数据初始化失败:", error);
        }
      }
      return response as TResponse;
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "登录失败",
        data: undefined,
      };
    }
  }

  /**
   * 快速登录
   * 使用本地保存的 Refresh Token 实现免密码登录
   *
   * 快速登录流程：
   * 1. 从本地会话存储中获取用户的 Refresh Token
   * 2. 调用 refreshToken API 获取新的 Access Token
   * 3. 使用新的 Access Token 获取用户信息
   * 4. 更新本地令牌存储和会话状态
   *
   * @param username 要进行快速登录的用户名
   * @param accountType 账户类型，此方法仅支持 "online" 类型
   * @returns Promise<TResponse> 快速登录结果
   *
   * @example
   * ```typescript
   * const result = await RemoteAuthService.quickLogin('john_doe', 'online');
   *
   * if (result.success) {
   *   // 快速登录成功，用户已通过身份验证
   *   const { userWithoutPassword, accessToken, refreshToken } = result.data;
   *   console.log('欢迎回来，', userWithoutPassword.username);
   * } else {
   *   // 快速登录失败，需要用户重新输入密码
   *   console.log('请重新登录：', result.message);
   * }
   * ```
   */
  static async quickLogin(
    username: string,
    accountType: "local" | "online"
  ): Promise<TResponse> {
    // 参数验证
    if (!username || !accountType) {
      return {
        success: false,
        message: "用户名或账户类型不能为空",
        data: undefined,
      };
    }

    // 此方法仅适用于在线账户
    if (accountType !== "online") {
      return {
        success: false,
        message: "此功能仅适用于在线账户",
        data: undefined,
      };
    }

    try {
      // 步骤1：获取本地保存的 Refresh Token
      // 从登录会话服务中查找指定用户的令牌信息
      const response_forToken = await loginSessionService.getSession(
        username,
        accountType
      );

      // 检查是否找到有效的 Refresh Token
      if (!response_forToken.success || !response_forToken.data.token) {
        return {
          success: false,
          message: "未找到该账号的快速登录凭证，请使用账号密码登录",
          data: undefined,
        };
      }

      const refreshToken = response_forToken.data.token;

      // 步骤2：使用 Refresh Token 获取新的 Access Token
      // 调用后端 /api/auth/refresh 接口
      const response_accessToken = await this.refreshToken(refreshToken);

      // 检查令牌刷新是否成功
      if (
        !response_accessToken.success ||
        !response_accessToken.data?.accessToken
      ) {
        // Refresh Token 可能已过期或被撤销，需要重新登录
        return {
          success: false,
          message: "快速登录凭证已失效，请重新登录",
          data: undefined,
        };
      }

      // 步骤3：使用新的 Access Token 获取用户信息
      // 先更新本地令牌存储，然后获取用户详细信息
      TokenManager.setTokens(
        response_accessToken.data.accessToken,
        refreshToken
      );

      const response_currentUserInfo = await remoteUserService.getCurrentUser();

      if (!response_currentUserInfo.success) {
        return {
          success: false,
          message:
            response_currentUserInfo.message || "获取用户信息失败，请重新登录",
          data: undefined,
        };
      }

      // 步骤4：快速登录成功，返回完整的登录信息,更新本地会话记录
      localStorage.setItem("accountType", "remote"); // 标记为远程账户
      await loginSessionService.updateSession(username, "online", {
        token: refreshToken, // 保持原有的 Refresh Token
        lastLoginTime: Date.now(), // 更新最后登录时间
        isActive: true, // 标记为活跃状态
      });

      // 初始化用户数据
      try {
        await UserDataInitService.initUserData(
          response_currentUserInfo.data.username
        );
      } catch (error) {
        console.error("用户数据初始化失败:", error);
      }

      return {
        success: true,
        message: "快速登录成功",
        data: {
          userWithoutPassword: response_currentUserInfo.data,
          accessToken: response_accessToken.data.accessToken,
          refreshToken: refreshToken, // 继续使用原有的 Refresh Token
        },
      };
    } catch (error) {
      console.error("Quick login error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "快速登录失败",
        data: undefined,
      };
    }
  }

  /**
   * 用户登出
   * 向后端发送登出请求，清理服务器端的会话状态
   *
   * 注意：此方法只负责通知后端清理会话，不处理本地存储清理
   * 本地令牌和会话清理应该在调用此方法后单独处理
   *
   * @returns Promise<TResponse> 登出结果
   *
   * @example
   * ```typescript
   * const result = await RemoteAuthService.logout();
   *
   * // 无论后端登出是否成功，都应该清理本地数据
   * TokenManager.clearTokens();
   * await loginSessionService.logout(username, 'online');
   *
   * if (result.success) {
   *   console.log('成功登出');
   * } else {
   *   console.log('登出请求失败，但本地数据已清理');
   * }
   * ```
   */
  static async logout(): Promise<TResponse> {
    try {
      // 向后端发送登出请求
      // 后端会清理该用户的 Refresh Token 和会话信息
      const accountStore = useAccountStore();
      const userId = accountStore.currentUser?.id;
      if (!userId) {
        return {
          success: false,
          message: "用户未登录或信息不完整",
          data: null,
        };
      }
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        return {
          success: false,
          message: "未找到有效的 Refresh Token",
          data: null,
        };
      }
      const response = await myaxios.post("/api/logout", {
        userId,
        refreshToken,
      });
      return response as TResponse;
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "登出失败",
        data: null,
      };
    }
  }
}

// 导出服务实例，供其他模块使用
export const remoteAuthService = RemoteAuthService;
