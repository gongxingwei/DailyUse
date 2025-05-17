/**
 * 认证服务类
 * 负责处理用户认证相关的所有操作，包括：
 * - 用户注册
 * - 用户登录
 * - 用户登出
 * - 认证状态检查
 * - 密码加密
 */
import { v4 as uuidv4 } from "uuid";
import type {
  IUser,
  ILoginForm,
  IRegisterForm,
} from "@/modules/Account/types/auth";
import { localAccountStorageService } from "./localAccountStorageService";
import crypto from "crypto";
import { ValidationError } from "../errors/ValidationError";
import {
  validateUsername,
  validatePassword,
  validateEmail,
} from "../utils/validators";
class AuthService {
  // 单例实例
  private static instance: AuthService;

  /**
   * 私有构造函数，确保单例模式
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
   * 密码加密方法
   * 使用 SHA-256 算法对密码进行单向加密
   * @param password 原始密码
   * @returns 加密后的密码哈希值
   */
  private hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  /**
   * 用户注册
   * @param form 注册表单数据，包含用户名、密码和邮箱
   * @returns 注册成功的用户信息（不包含密码）
   * @throws 当用户名已存在或注册过程出错时抛出错误
   */
  async register(form: IRegisterForm): Promise<{
    success: boolean;
    data?: IUser;
    message?: string;
  }> {
    try {
      // 输入验证
      if (!form.username) {
        throw new ValidationError("用户名不能为空");
      }
      if (!form.password) {
        throw new ValidationError("密码不能为空");
      }
      if (!form.email) {
        throw new ValidationError("邮箱不能为空");
      }

      // 格式验证
      if (!validateUsername(form.username)) {
        throw new ValidationError("用户名长度必须在3-20个字符之间");
      }
      if (!validatePassword(form.password)) {
        throw new ValidationError("密码长度必须在8-20个字符之间");
      }
      if (!validateEmail(form.email)) {
        throw new ValidationError("邮箱格式不正确");
      }

      // 读取现有用户数据
      const users = await localAccountStorageService.readUsers();

      // 检查用户名是否已存在
      if (users[form.username]) {
        throw new ValidationError("用户名已存在");
      }

      const userId = uuidv4();
      const now = new Date().toISOString();

      // 创建新用户对象
      const newUser = {
        id: userId,
        username: form.username,
        email: form.email,
        passwordHash: this.hashPassword(form.password),
        createdAt: now,
        updatedAt: now,
      };

      // 保存用户数据
      users[form.username] = newUser;
      await localAccountStorageService.writeUsers(users);

      // 创建用户目录
      await localAccountStorageService.createUserDirectory(userId);

      // 返回用户信息（不包含密码）
      const { passwordHash, ...userWithoutPassword } = newUser;

      return {
        success: true,
        message: "服务端返回注册成功",
        data: userWithoutPassword,
      };
    } catch (error) {
      console.error("注册失败:", error);
      return {
        success: false,
        message: error instanceof ValidationError ? error.message : "注册失败",
      };
    }
  }

  /**
   * 用户登录
   * @param credentials 登录凭证，包含用户名和密码
   * @returns 登录成功的用户信息（不包含密码）
   * @throws 当用户名或密码错误时抛出错误
   */
  async login(credentials: ILoginForm): Promise<{
    success: boolean;
    message: string;
    data?: IUser;
    token?: string;
  }> {
    try {
      console.log(credentials, "credentials");
      // 输入验证
      if (!credentials.username) {
        throw new ValidationError("用户名不能为空");
      }
      if (!credentials.password) {
        throw new ValidationError("密码不能为空");
      }

      const users = await localAccountStorageService.readUsers();
      const user = users[credentials.username];

      if (!user) {
        throw new ValidationError("用户不存在");
      }

      const hashedPassword = this.hashPassword(credentials.password);
      if (user.passwordHash !== hashedPassword) {
        throw new ValidationError("密码错误");
      }

      // 生成登录token
      const token = crypto
        .createHash("sha256")
        .update(user.id + new Date().getTime().toString())
        .digest("hex");

      // 更新用户最后登录时间
      user.lastLoginAt = new Date().toISOString();
      users[credentials.username] = user;
      await localAccountStorageService.writeUsers(users);

      // 存储token
      const response = await localAccountStorageService.saveAuthToken(
        token,
        user.id
      );
      if (!response.success) {
        throw new ValidationError("保存登录状态失败");
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return {
        success: true,
        message: "登录成功",
        data: userWithoutPassword,
        token,
      };
    } catch (error) {
      console.error("后端显示登录失败:", error);
      return {
        success: false,
        message: error instanceof ValidationError ? error.message : "登录失败",
      };
    }
  }

  /**
   * 使用token和用户名进行快速登录
   * @param username - 用户名
   * @param token - 登录token
   * @returns 登录结果，包含用户信息和新token
   */
  async loginWithToken(
    username: string,
    token: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: IUser;
    token?: string;
  }> {
    try {
      // 读取用户数据
      const users = await localAccountStorageService.readUsers();
      const user = users[username];

      if (!user) {
        throw new ValidationError("用户不存在");
      }

      // 验证token
      const response = await localAccountStorageService.getAuthToken(user.id);
      if (!response.success) {
        throw new ValidationError("获取token失败");
      }
      console.log("savedAuth", response);
      if (!response.data.token || response.data.token !== token) {
        throw new ValidationError("登录信息已失效，请重新登录");
      }

      // 生成新token
      const newToken = crypto
        .createHash("sha256")
        .update(user.id + new Date().getTime().toString())
        .digest("hex");

      // 更新用户最后登录时间
      user.lastLoginAt = new Date().toISOString();
      users[username] = user;
      await localAccountStorageService.writeUsers(users);

      // 更新token
      await localAccountStorageService.saveAuthToken(newToken, user.id);

      const { passwordHash, ...userWithoutPassword } = user;
      return {
        success: true,
        message: "快速登录成功",
        data: userWithoutPassword,
        token: newToken,
      };
    } catch (error) {
      console.error("快速登录失败:", error);
      return {
        success: false,
        message:
          error instanceof ValidationError ? error.message : "快速登录失败",
      };
    }
  }

  /**
   * 清除用户认证状态
   * 清除存储的token和用户信息
   * @param userId - 用户ID
   * @returns 清除成功的状态
   */
  async logout(
    userId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 清除存储的认证token
      await localAccountStorageService.clearAuthToken(userId);
      return { success: true, message: "登出成功" };
    } catch (error) {
      console.error("登出失败:", error);
      return {
        success: false,
        message: "登出失败",
      };
    }
  }

  /**
   * 检查用户认证状态
   * @returns 当前登录的用户信息，如果未登录则返回 null
   * TODO: 实现持久化存储的认证状态检查
   */
  async checkAuth(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: IUser;
  }> {
    try {
      // 从存储中获取token和用户ID
      const response = await localAccountStorageService.getAuthToken(userId);

      if (!response.success) {
        return {
          success: false,
          message: "获取token失败",
        };
      }

      const { token, userId: storedUserId } = response.data;
      if (!token || !storedUserId) {
        return {
          success: false,
          message: "token已经过期或不存在",
        };
      }

      // 获取用户信息
      const users = await localAccountStorageService.readUsers();
      const user = Object.values(users).find((u) => u.id === userId);

      // 如果用户不存在，清除存储的token
      if (!user) {
        await localAccountStorageService.clearAuthToken(user.id);
        return {
          success: false,
          message: "用户不存在",
        };
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return {
        success: true,
        message: "认证检查成功",
        data: userWithoutPassword,
      };
    } catch (error) {
      console.error("认证检查失败:", error);
      return {
        success: false,
        message: "认证检查失败",
      };
    }
  }
}

// 导出 AuthService 的单例实例
export const authService = AuthService.getInstance();
