import type { TResponse } from "@/shared/types/response";
import type {
  TRegisterData,
  TLoginData,
  TUser,
} from "@/modules/Account/types/user";

import { UserModel } from "../models/userModel";
import bcrypt from "bcrypt";

/**
 * 用户服务类
 * 处理与用户账户相关的业务逻辑
 */
export class UserService {
  private static instance: UserService;
  private userModel: UserModel;

  /**
   * 私有构造函数，初始化用户数据模型
   */
  private constructor(userModel: UserModel) {
    this.userModel = userModel;
  }


  /**
   * 获取UserService单例
   * @returns UserService实例
   */
  public static async getInstance(): Promise<UserService> {
    if (!UserService.instance) {
      const userModel = await UserModel.create();
      UserService.instance = new UserService(userModel);
    }
    return UserService.instance;
  }

  /**
   * 用户注册
   * @param data 注册数据
   * @returns 响应结果
   */
  public async register(data: TRegisterData): Promise<TResponse> {
    try {
      // 验证输入数据
      if (!data.username || !data.password) {
        return {
          success: false,
          message: "用户名和密码不能为空",
        };
      }
      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          message: "两次输入的密码不一致",
        };
      }

      // 检查用户是否已存在
      const existingUser = await this.userModel.findUserByUsername(data.username);
      if (existingUser) {
        return {
          success: false,
          message: "用户名已存在",
        };
      }

      // 密码加密
      const hashedPassword = await this.hashPassword(data.password);

      // 构造用户数据
      const userData: TUser = {
        username: data.username,
        password: hashedPassword,
        email: data.email,
        phone: data.phone,
        accountType: "local",
        createdAt: Date.now(),
      };

      // 保存用户
      const success = await this.userModel.addUser(userData);
      if (success) {
        return {
          success: true,
          message: "注册成功",
          data: {
            username: userData.username,
            avatar: userData.avatar,
            email: userData.email,
            phone: userData.phone,
            accountType: userData.accountType,
            createdAt: userData.createdAt,
          },
        };
      } else {
        return {
          success: false,
          message: "注册失败，请重试",
        };
      }
    } catch (error) {
      console.error("注册过程中发生错误:", error);
      return {
        success: false,
        message: "注册失败，服务器错误",
      };
    }
  }

  /**
   * 用户登录
   * @param data 登录数据
   * @returns 响应结果
   */
  public async login(data: TLoginData): Promise<TResponse> {
    try {
      // 验证输入数据
      if (!data.username || !data.password) {
        return {
          success: false,
          message: "用户名和密码不能为空",
        };
      }

      // 查找用户
      const user = await this.userModel.findUserByUsername(data.username);
      if (!user) {
        return {
          success: false,
          message: "用户不存在",
        };
      }

      // 验证密码
      const isPasswordValid = await this.verifyPassword(data.password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: "密码错误",
        };
      }

      // 登录成功，返回用户信息（不包含密码）
      return {
        success: true,
        message: "登录成功",
        data: {
          username: user.username,
          avatar: user.avatar,
          email: user.email,
          phone: user.phone,
          accountType: user.accountType,
          onlineId: user.onlineId,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      console.error("登录过程中发生错误:", error);
      return {
        success: false,
        message: "登录失败，服务器错误",
      };
    }
  }

  /**
   * 获取用户信息
   * @param username 用户名
   * @returns 响应结果
   */
  public async getUserInfo(username: string): Promise<TResponse> {
    try {
      if (!username) {
        return {
          success: false,
          message: "用户名不能为空",
        };
      }

      const user = await this.userModel.findUserByUsername(username);

      if (!user) {
        return {
          success: false,
          message: "用户不存在",
        };
      }

      // 返回用户信息（不包含密码）
      return {
        success: true,
        message: "获取用户信息成功",
        data: {
          username: user.username,
          avatar: user.avatar,
          email: user.email,
          phone: user.phone,
          accountType: user.accountType,
          onlineId: user.onlineId,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      console.error("获取用户信息失败:", error);
      return {
        success: false,
        message: "获取用户信息失败",
      };
    }
  }

  /**
   * 更新用户信息
   * @param username 用户名
   * @param data 更新数据
   * @returns 响应结果
   */
  public async updateUserInfo(
    username: string,
    data: Partial<TUser>
  ): Promise<TResponse> {
    try {
      if (!username) {
        return {
          success: false,
          message: "用户名不能为空",
        };
      }
      // 检查用户是否存在
      const existingUser = await this.userModel.findUserByUsername(username);
      if (!existingUser) {
        return {
          success: false,
          message: "用户不存在",
        };
      }

      // 如果要更新密码，需要加密
      if (data.password) {
        data.password = await this.hashPassword(data.password);
      }

      // 更新用户信息
      const success = await this.userModel.updateUser(username, data);
      if (success) {
        return {
          success: true,
          message: "更新成功",
        };
      } else {
        return {
          success: false,
          message: "更新失败",
        };
      }
    } catch (error) {
      console.error("更新用户信息失败:", error);
      return {
        success: false,
        message: "更新失败，服务器错误",
      };
    }
  }

  /**
   * 删除用户账号
   * @param username 用户名
   * @returns 响应结果
   */
  public async deleteUser(username: string): Promise<TResponse> {
    try {
      if (!username) {
        return {
          success: false,
          message: "用户名不能为空",
        };
      }

      // 检查用户是否存在
      const existingUser = await this.userModel.findUserByUsername(username);
      if (!existingUser) {
        return {
          success: false,
          message: "用户不存在",
        };
      }

      // 删除用户
      const success = await this.userModel.removeUser(username);
      if (success) {
        return {
          success: true,
          message: "账号删除成功",
        };
      } else {
        return {
          success: false,
          message: "删除失败",
        };
      }
    } catch (error) {
      console.error("删除用户失败:", error);
      return {
        success: false,
        message: "删除失败，服务器错误",
      };
    }
  }

  /**
   * 升级为在线账号
   * @param username 用户名
   * @param onlineId 在线ID
   * @returns 响应结果
   */
  public async upgradeToOnlineAccount(username: string, onlineId: string): Promise<TResponse> {
    try {
      if (!username || !onlineId) {
        return {
          success: false,
          message: "参数不能为空",
        };
      }
      // 检查用户是否存在
      const existingUser = await this.userModel.findUserByUsername(username);
      if (!existingUser) {
        return {
          success: false,
          message: "用户不存在",
        };
      }

      // 升级账号
      const success = await this.userModel.updateUserOnlineStatus(username, onlineId);
      if (success) {
        return {
          success: true,
          message: "升级为在线账号成功",
        };
      } else {
        return {
          success: false,
          message: "升级失败",
        };
      }
    } catch (error) {
      console.error("升级账号失败:", error);
      return {
        success: false,
        message: "升级失败，服务器错误",
      };
    }
  }

  /**
   * 获取所有用户列表
   * @returns 响应结果
   */
  public async getAllUsers(): Promise<TResponse> {
    try {

      const users = await this.userModel.getAllUsers();

      // 移除密码字段
      const safeUsers = users.map(user => ({
        username: user.username,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        accountType: user.accountType,
        onlineId: user.onlineId,
        createdAt: user.createdAt,
      }));

      return {
        success: true,
        message: "获取用户列表成功",
        data: safeUsers,
      };
    } catch (error) {
      console.error("获取用户列表失败:", error);
      return {
        success: false,
        message: "获取用户列表失败",
      };
    }
  }

  /**
   * 密码哈希加密
   * @param password 原始密码
   * @returns 加密后的密码
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   * @param password 输入的原始密码
   * @param hashedPassword 数据库中的加密密码
   * @returns 密码是否匹配
   */
  private async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}

export const userService = UserService.getInstance();