import { IUser, ILoginForm, IRegisterForm } from "../types/auth";
import { userDataInitializationService } from "./userDataInitializationService";
import type { TResponse } from "../types/response";
/**
 * 认证服务类
 * 负责处理用户认证相关的操作，包括注册、登录、登出和认证状态检查
 */
class AuthService {
  // 单例实例
  private static instance: AuthService;

  /**
   * 私有构造函数，确保只能通过 getInstance 方法创建实例
   */
  private constructor() {}

  /**
   * 获取 AuthService 的单例实例
   * @returns AuthService 实例
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * 用户注册
   * @param form - 注册表单数据
   * @returns 注册成功的用户信息
   * @throws 注册失败时抛出错误
   */
  async register(form: IRegisterForm): Promise<TResponse> {
    try {
      // 创建一个可序列化的对象
      const registrationData = {
        username: form.username,
        password: form.password,
        email: form.email,
        // 只包含必要的基本类型数据
      };
      // 调用后端 API 进行注册
      const response = await window.shared.ipcRenderer.invoke(
        "auth:register",
        registrationData
      );
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "注册失败",
        data: null,
      };
    }
  }

  /**
   * 用户登录
   * @param credentials - 登录凭证
   * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise:
   * ```typescript
   * {
   *   success: boolean;      // 登录是否成功
   *   message: string;      // 信息（错误信息 || 成功信息）
   *   data?: IUser;         // 用户信息（可选）
   *   token?: string;       // JWT token（可选）
   * }
   * ```
   * @throws 登录失败时抛出错误
   */
  async login(credentials: ILoginForm): Promise<TResponse> {
    try {
      // 创建一个可序列化的对象
      const loginData = {
        username: credentials.username,
        password: credentials.password,
        remember: credentials.remember,
        // 只包含必要的基本类型数据
      };
      // 调用后端 API 进行登录验证
      const response = await window.shared.ipcRenderer.invoke(
        "auth:login",
        loginData
      );

      return response;
    } catch (error) {
      console.error("登录失败:", error);
      throw error;
    }
  }

  /**
   * 使用 JWT token 登录
   * @param userName - 用户名
   * @param token - JWT token
   * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise:
   * ```typescript
   * {
   *   success: boolean;      // 登录是否成功
   *   message: string;      // 信息（错误信息 || 成功信息）
   *   data?: userWithoutPassword; // 用户信息（可选）
   *   token?: string;       // JWT token（可选）
   * }
   * ```
   * @throws 登录失败时抛出错误
   */
  async loginWithToken(userName: string, token: string): Promise<TResponse> {
    try {
      // 调用后端 API 进行登录验证
      const response = await window.shared.ipcRenderer.invoke(
        "auth:login-with-token",
        userName,
        token
      );
      return response;
    } catch (error) {
      console.error("登录失败:", error);
      throw error;
    }
  }

  /**
   * 用户登出
   * @param userId - 要登出的用户ID
   * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise:
   * ```typescript
   * {
   *   success: boolean;      // 登出是否成功
   *   message: string;      // 信息（错误信息 || 成功信息）
   * }
   * ```
   * @throws 登出失败时抛出错误
   */
  async logout(userId: string): Promise<TResponse> {
    try {
      // 传递 userId 到后端进行登出操作
      const response = await window.shared.ipcRenderer.invoke(
        "auth:logout",
        userId
      );
      if (response.success) {
        // 登出时清除所有用户数据
        await userDataInitializationService.clearUserData();
        return {
          success: true,
          message: "登出成功",
        };
      } else {
        return {
          success: false,
          message: response.error || response.message || "登出失败",
        };
      }
    } catch (error) {
      console.error("登出失败:", error);
      throw error;
    }
  }

  /**
   * 检查用户认证状态
   * @param userId - 要登出的用户ID
   * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise:
   * ```typescript
   * {
   *   success: boolean;      // 是否认证
   *    message: string;      // 信息（错误信息 || 成功信息）
   *   data?: userWithoutPassword     // 用户数据，如果认证成功则返回
   * }
   * ```
   */
  async checkAuth(userId: string): Promise<TResponse> {
    try {
      const response = await window.shared.ipcRenderer.invoke(
        "auth:check",
        userId
      );
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "认证失败",
        data: null,
      };
    }
  }
}

// 导出 AuthService 的单例实例
export const authService = AuthService.getInstance();
