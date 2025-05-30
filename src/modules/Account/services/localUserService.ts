import { TLoginData, TRegisterData } from "../types/account";
import { userDataInitializationService } from "./userDataInitializationService";
import type { TResponse } from "../../../shared/types/response";
/**
 * 认证服务类
 * 负责处理用户认证相关的操作，包括注册、登录、登出和认证状态检查
 */
class UserService {
  // 单例实例
  private static instance: UserService;

  /**
   * 私有构造函数，确保只能通过 getInstance 方法创建实例
   */
  private constructor() {}

  /**
   * 获取 UserService 的单例实例
   * @returns UserService 实例
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * 用户注册
   * @param form - 注册表单数据
   * @returns 注册成功的用户信息
   * @throws 注册失败时抛出错误
   */
  async register(form: TRegisterData): Promise<TResponse> {
    try {
      // 创建一个可序列化的对象
      const registrationData = {
        username: form.username,
        password: form.password,
        confirmPassword: form.confirmPassword,
        email: form.email,
        // 只包含必要的基本类型数据
      };
      // 调用后端 API 进行注册
      const response = await window.shared.ipcRenderer.invoke(
        "user:register",
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
   *   data: TUser;         // 用户信息
   * }
   * ```
   * @throws 登录失败时抛出错误
   */
  async login(credentials: TLoginData): Promise<TResponse> {
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
        "user:login",
        loginData
      );

      return response;
    } catch (error) {
      console.error("登录失败:", error);
      throw error;
    }
  }

  /**
   * 用户注销
   * @param username - 要注销的用户名
   * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise:
   * ```typescript
   * {
   *   success: boolean;      // 注销是否成功
   *   message: string;      // 信息（错误信息 || 成功信息）
   * }
   * ```
   * @throws 注销失败时抛出错误
   */
  async deregistration(username: string): Promise<TResponse> {
    try {
      // 调用后端 API 进行注销
      const response = await window.shared.ipcRenderer.invoke(
        "user:deregistration",
        username
      );
      return response;
    } catch (error) {
      console.error("注销失败:", error);
      throw error;
    }
  }

  /**
   * 获取所有用户信息
   * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise:
   * ```typescript
   * {
   *   success: boolean;      // 是否成功
   *   message: string;      // 信息（错误信息 || 成功信息）
   *   data?: userWithoutPassword[]; // 用户信息列表（可选）
   * }
   * ```
   * @throws 获取用户列表失败时抛出错误
   */
  async getAllUsers(): Promise<TResponse> {
    try {
      // 调用后端 API 获取所有用户信息
      const response = await window.shared.ipcRenderer.invoke(
        "user:get-all-users"
      );
      return response;
    } catch (error) {
      console.error("获取用户列表失败:", error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   * @param username - 要更新的用户名
   * @param newData - 新的用户数据
   * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise:
   * ```typescript
   * {
   *  success: boolean;      // 更新是否成功
   *  message: string;      // 信息（错误信息 || 成功信息）
   *  data?: userWithoutPassword; // 更新后的用户信息（可选）
   * }
   * ```
   * @throws 更新用户信息失败时抛出错误
   */
  async updateUserInfo(
    username: string,
    newData: Partial<TLoginData>
  ): Promise<TResponse> {
    try {
      // 调用后端 API 进行更新用户信息
      const response = await window.shared.ipcRenderer.invoke(
        "user:update",
        username,
        newData
      );
      return response;
    } catch (error) {
      console.error("更新用户信息失败:", error);
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
  async logout(username: string, accountType: string): Promise<TResponse> {
    try {
      // 传递 userId 到后端进行登出操作
      const response = await window.shared.ipcRenderer.invoke(
        "session:logout",
        username,
        accountType,
        true
      );
      if (response.success) {
        // 登出时清除所有用户数据
        await userDataInitializationService.clearUserData();
        return response;
      } else {
        return response;
      }
    } catch (error) {
      console.error("登出失败:", error);
      throw error;
    }
  }

}

// 导出 UserService 的单例实例
export const localUserService = UserService.getInstance();
