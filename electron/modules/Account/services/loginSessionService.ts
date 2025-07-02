import type { TResponse } from "@/shared/types/response";
import type { TLoginSessionData } from "@/modules/Account/types/account";
import { LoginSessionModel } from "../models/loginSessionModel";
import crypto from "crypto";
import { userService } from './userService'
/**
 * 本地会话服务类
 * 负责处理登录会话相关的业务逻辑，包括会话保存、更新、查询和管理
 * 提供记住密码、自动登录、会话历史等功能的业务逻辑封装
 */
export class LoginSessionService {
  private static instance: LoginSessionService;
  private loginSessionModel: LoginSessionModel;

  // AES加密配置
  private readonly algorithm = "aes-256-cbc";
  private readonly secretKey: string;
  private readonly keyLength = 32; // 256位密钥

  /**
   * 私有构造函数，初始化登录会话模型和加密配置
   */
  private constructor(loginSessionModel: LoginSessionModel) {
    this.loginSessionModel = loginSessionModel;
    // 使用应用程序特定的密钥，实际部署时应该从安全配置中获取
    this.secretKey = this.generateSecretKey();
  }

  /**
   * 获取 LoginSessionService 单例
   * @returns LoginSessionService 实例
   */
  public static async getInstance(): Promise<LoginSessionService> {
    if (!LoginSessionService.instance) {
      const loginSessionModel = await LoginSessionModel.create();
      LoginSessionService.instance = new LoginSessionService(loginSessionModel);
    }
    return LoginSessionService.instance;
  }

  /**
   * 创建登录会话
   * 用户登录成功后调用此方法保存会话信息
   *
   * @param sessionData 会话数据
   * @param sessionData.username 用户名
   * @param sessionData.password 原始密码（如果记住密码）
   * @param sessionData.accountType 账户类型
   * @param sessionData.rememberMe 是否记住密码
   * @param sessionData.autoLogin 是否自动登录
   * @returns 操作结果
   */
  public async addSession(sessionData: {
    username: string;
    password?: string;
    token?: string; // 可选，在线账户可能使用token
    accountType: "local" | "online";
    rememberMe: boolean;
    autoLogin: boolean;
  }): Promise<TResponse> {
    try {
      // 验证必要参数
      if (!sessionData.username || !sessionData.accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空",
        };
      }

      // 如果需要记住密码，首先验证密码是否正确
      let encryptedPassword: string | undefined;
      // if (sessionData.rememberMe && sessionData.password) {
      //   // 验证密码是否正确
      //   const { userService } = await import('./userService');
      //   const service = await userService;

      //   const loginResult = await service.login({
      //     username: sessionData.username,
      //     password: sessionData.password,
      //     remember: true
      //   });

      //   if (!loginResult.success) {
      //     return {
      //       success: false,
      //       message: "密码验证失败，无法保存会话",
      //     };
      //   }

      //   // 密码正确，进行AES加密

      // }
      if (sessionData.rememberMe && sessionData.password) {
        encryptedPassword = await this.encryptPassword(sessionData.password);
      }
      // 构造会话数据，确保类型兼容SQLite
      const loginSessionData: Omit<
        TLoginSessionData,
        "id" | "createdAt" | "updatedAt"
      > = {
        username: sessionData.username,
        password: encryptedPassword,
        token: sessionData.token,
        accountType: sessionData.accountType,
        rememberMe: sessionData.rememberMe ? 1 : 0,
        lastLoginTime: Date.now(),
        autoLogin: sessionData.autoLogin ? 1 : 0,
        isActive: 1, // 使用数字而不是布尔值
      };

      const success = await this.loginSessionModel.addLoginSession(
        loginSessionData
      );

      if (success) {
        return {
          success: true,
          message: "会话创建成功",
          data: {
            username: sessionData.username,
            accountType: sessionData.accountType,
            rememberMe: sessionData.rememberMe,
            autoLogin: sessionData.autoLogin,
          },
        };
      } else {
        return {
          success: false,
          message: "会话创建失败",
        };
      }
    } catch (error) {
      console.error("创建登录会话失败:", error);
      return {
        success: false,
        message: "创建会话失败，服务器错误",
      };
    }
  }

  /**
   * 获取登录会话
   * 根据用户名和账户类型获取会话信息
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @returns 会话数据
   */
  public async getSession(
    username: string,
    accountType: string
  ): Promise<TResponse> {
    try {
      if (!username || !accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空",
        };
      }

      const session = await this.loginSessionModel.getSession(
        username,
        accountType
      );

      if (session) {
        // 返回会话数据，隐藏敏感信息
        const { password, ...sessionData } = session;
        return {
          success: true,
          message: "获取会话成功",
          data: sessionData,
        };
      } else {
        return {
          success: false,
          message: "未找到会话信息",
        };
      }
    } catch (error) {
      console.error("获取登录会话失败:", error);
      return {
        success: false,
        message: "获取会话失败，服务器错误",
      };
    }
  }

  /**
   * 快速登录
   * 使用保存的加密密码进行快速登录
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @returns 登录结果
   */
  public async quickLogin(
    username: string,
    accountType: string
  ): Promise<TResponse> {
    try {
      if (!username || !accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空",
        };
      }

      // 获取记住的会话信息
      const sessions = await this.loginSessionModel.getRememberedSessions();
      const targetSession = sessions.find(
        (session) =>
          session.username === username && session.accountType === accountType
      );

      if (!targetSession || !targetSession.password) {
        return {
          success: false,
          message: "未找到保存的登录信息",
        };
      }

      try {
        // 解密保存的密码
        const decryptedPassword = await this.decryptPassword(
          targetSession.password
        );

        // 使用解密后的密码进行真正的登录验证
        const service = await userService;
        const loginResult = await service.login({
          username,
          password: decryptedPassword,
          remember: true,
        });

        if (loginResult.success) {

          // 登录成功，更新会话状态
          await this.loginSessionModel.updateSession(username, accountType, {
            lastLoginTime: Date.now(),
            isActive: 1,
          });

          return {
            success: true,
            message: "快速登录成功",
            data: loginResult.data,
          };
        } else {
          // 密码验证失败，可能用户密码已更改，清除保存的密码
          await this.loginSessionModel.updateSession(username, accountType, {
            password: undefined,
            rememberMe: 0,
            isActive: 0,
          });

          return {
            success: false,
            message: "保存的密码已失效，请重新登录",
          };
        }
      } catch (decryptError) {
        // 解密失败，可能数据损坏，清除保存的密码
        console.error("解密密码失败:", decryptError);

        await this.loginSessionModel.updateSession(username, accountType, {
          password: undefined,
          rememberMe: 0,
          isActive: 0,
        });

        return {
          success: false,
          message: "登录信息已损坏，请重新登录",
        };
      }
    } catch (error) {
      console.error("快速登录失败:", error);
      return {
        success: false,
        message: "快速登录失败，服务器错误",
      };
    }
  }

  /**
   * 更新会话信息
   * 更新指定用户的会话数据
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @param updates 要更新的字段
   * @returns 操作结果
   */
  public async updateSession(
    username: string,
    accountType: string,
    updates: {
      rememberMe?: boolean;
      autoLogin?: boolean;
      isActive?: boolean;
      password?: string;
      token?: string; 
    }
  ): Promise<TResponse> {
    try {
      if (!username || !accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空",
        };
      }

      // 转换布尔值为数字，确保SQLite兼容性
      const updateData: any = { ...updates };
      if (typeof updateData.rememberMe === "boolean") {
        updateData.rememberMe = updateData.rememberMe ? 1 : 0;
      }
      if (typeof updateData.autoLogin === "boolean") {
        updateData.autoLogin = updateData.autoLogin ? 1 : 0;
      }
      if (typeof updateData.isActive === "boolean") {
        updateData.isActive = updateData.isActive ? 1 : 0;
      }

      // 如果需要更新密码，先加密
      if (updates.password) {
        updateData.password = await this.encryptPassword(updates.password);
      }

      // 更新最后登录时间
      updateData.lastLoginTime = Date.now();

      const success = await this.loginSessionModel.updateSession(
        username,
        accountType,
        updateData
      );

      if (success) {
        return {
          success: true,
          message: "会话更新成功",
        };
      } else {
        return {
          success: false,
          message: "会话不存在或更新失败",
        };
      }
    } catch (error) {
      console.error("更新会话失败:", error);
      return {
        success: false,
        message: "更新会话失败，服务器错误",
      };
    }
  }

  /**
   * 获取记住密码的用户列表
   * 用于登录页面显示历史登录用户
   *
   * @returns 记住密码的用户列表（消除了敏感信息）
   * ```typescript
   * {
   *   success: boolean;      // 操作是否成功
   *   message: string;      // 信息（错误信息 || 成功信息）
   *   data: Array<{
   *     username: string;    // 用户名
   *     accountType: string;  // 账户类型
   *     lastLoginTime: number; // 最后登录时间
   *     autoLogin: boolean;    // 是否启用自动登录
   *  }>;
   * ```
   */
  public async getRememberedUsers(): Promise<TResponse> {
    try {
      const sessions = await this.loginSessionModel.getRememberedSessions();

      // 构造返回数据，隐藏敏感信息
      const userList = sessions.map((session) => ({
        username: session.username,
        accountType: session.accountType,
        lastLoginTime: session.lastLoginTime,
        autoLogin: !!session.autoLogin,
      }));

      return {
        success: true,
        message: "获取记住的用户列表成功",
        data: userList,
      };
    } catch (error) {
      console.error("获取记住的用户失败:", error);
      return {
        success: false,
        message: "获取用户列表失败",
      };
    }
  }

  /**
   * 验证记住的密码
   * 用于快速登录时验证保存的密码
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @param inputPassword 用户输入的密码
   * @returns 验证结果
   */
  public async validateRememberedPassword(
    username: string,
    accountType: string,
    inputPassword: string
  ): Promise<TResponse> {
    try {
      if (!username || !accountType || !inputPassword) {
        return {
          success: false,
          message: "参数不能为空",
        };
      }

      const sessions = await this.loginSessionModel.getRememberedSessions();
      const targetSession = sessions.find(
        (session) =>
          session.username === username && session.accountType === accountType
      );

      if (!targetSession || !targetSession.password) {
        return {
          success: false,
          message: "未找到保存的密码信息",
        };
      }

      try {
        // 解密保存的密码进行比较
        const decryptedPassword = await this.decryptPassword(
          targetSession.password
        );

        if (inputPassword === decryptedPassword) {
          // 密码匹配，更新最后登录时间
          await this.loginSessionModel.updateSession(username, accountType, {
            lastLoginTime: Date.now(),
            isActive: 1,
          });

          return {
            success: true,
            message: "密码验证成功",
          };
        } else {
          return {
            success: false,
            message: "密码验证失败",
          };
        }
      } catch (decryptError) {
        console.error("解密密码失败:", decryptError);
        return {
          success: false,
          message: "密码信息已损坏，请重新登录",
        };
      }
    } catch (error) {
      console.error("验证记住的密码失败:", error);
      return {
        success: false,
        message: "密码验证失败，服务器错误",
      };
    }
  }

  /**
   * 获取自动登录信息
   * 应用启动时检查是否有用户设置了自动登录
   *
   * @returns 自动登录信息
   */
  public async getAutoLoginInfo(): Promise<TResponse> {
    try {
      const session = await this.loginSessionModel.getAutoLoginSession();

      if (session) {
        return {
          success: true,
          message: "找到自动登录信息",
          data: {
            username: session.username,
            accountType: session.accountType,
            lastLoginTime: session.lastLoginTime,
            hasPassword: !!session.password,
          },
        };
      } else {
        return {
          success: false,
          message: "未设置自动登录",
        };
      }
    } catch (error) {
      console.error("获取自动登录信息失败:", error);
      return {
        success: false,
        message: "获取自动登录信息失败",
      };
    }
  }

  /**
   * 获取当前活跃会话
   * 获取当前登录的用户信息
   *
   * @returns 当前活跃会话信息
   */
  public async getCurrentSession(): Promise<TResponse> {
    try {
      const session = await this.loginSessionModel.getActiveSession();

      if (session) {
        return {
          success: true,
          message: "获取当前会话成功",
          data: {
            username: session.username,
            accountType: session.accountType,
            lastLoginTime: session.lastLoginTime,
            autoLogin: !!session.autoLogin,
            rememberMe: !!session.rememberMe,
          },
        };
      } else {
        return {
          success: false,
          message: "当前无活跃会话",
        };
      }
    } catch (error) {
      console.error("获取当前会话失败:", error);
      return {
        success: false,
        message: "获取当前会话失败",
      };
    }
  }

  /**
   * 删除指定用户的会话
   * 用于移除记住的用户信息
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @returns 操作结果
   */
  public async removeSession(
    username: string,
    accountType: string
  ): Promise<TResponse> {
    try {
      if (!username || !accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空",
        };
      }

      const success = await this.loginSessionModel.deleteSession(
        username,
        accountType
      );

      if (success) {
        return {
          success: true,
          message: "会话删除成功",
        };
      } else {
        return {
          success: false,
          message: "会话不存在或删除失败",
        };
      }
    } catch (error) {
      console.error("删除会话失败:", error);
      return {
        success: false,
        message: "删除会话失败，服务器错误",
      };
    }
  }

  /**
   * 用户退出登录
   * 将当前活跃会话设为非活跃状态
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @param keepRemembered 是否保留记住密码信息
   * @returns 操作结果
   */
  public async logout(
    username: string,
    accountType: string,
    keepRemembered: boolean = true
  ): Promise<TResponse> {
    try {
      if (!username || !accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空",
        };
      }

      if (keepRemembered) {
        // 保留记住密码信息，只设为非活跃
        const success = await this.loginSessionModel.updateSession(
          username,
          accountType,
          {
            isActive: 0,
            autoLogin: 0, // 退出时取消自动登录
          }
        );

        if (success) {
          return {
            success: true,
            message: "退出登录成功",
          };
        } else {
          return {
            success: false,
            message: "退出登录失败",
          };
        }
      } else {
        // 完全删除会话信息
        return await this.removeSession(username, accountType);
      }
    } catch (error) {
      console.error("退出登录失败:", error);
      return {
        success: false,
        message: "退出登录失败，服务器错误",
      };
    }
  }

  /**
   * 清除所有会话数据
   * 清理所有保存的登录信息，用于重置功能
   *
   * @returns 操作结果
   */
  public async clearAllSessions(): Promise<TResponse> {
    try {
      const success = await this.loginSessionModel.clearAllSessions();

      if (success) {
        return {
          success: true,
          message: "清除所有会话成功",
        };
      } else {
        return {
          success: false,
          message: "清除会话失败",
        };
      }
    } catch (error) {
      console.error("清除所有会话失败:", error);
      return {
        success: false,
        message: "清除会话失败，服务器错误",
      };
    }
  }

  /**
   * 获取登录历史记录
   * 获取所有登录会话的历史记录
   *
   * @returns 登录历史列表
   */
  public async getLoginHistory(): Promise<TResponse> {
    try {
      const sessions = await this.loginSessionModel.getAllLoginSessions();

      // 构造返回数据，隐藏密码信息
      const history = sessions.map((session) => ({
        username: session.username,
        accountType: session.accountType,
        lastLoginTime: session.lastLoginTime,
        isActive: !!session.isActive,
        rememberMe: !!session.rememberMe,
        autoLogin: !!session.autoLogin,
      }));

      return {
        success: true,
        message: "获取登录历史成功",
        data: history,
      };
    } catch (error) {
      console.error("获取登录历史失败:", error);
      return {
        success: false,
        message: "获取登录历史失败",
      };
    }
  }

  /**
   * 生成应用程序密钥
   * 基于应用程序特定信息生成密钥
   *
   * @returns 32字节密钥
   * @private
   */
  private generateSecretKey(): string {
    // 实际部署时应该从配置文件或环境变量中获取
    const appSecret = "DailyUse-App-Secret-Key-2024";
    return crypto
      .scryptSync(appSecret, "session-salt", this.keyLength)
      .toString("hex");
  }

  /**
   * AES密码加密
   * 使用AES-256-CBC算法对密码进行可逆加密
   *
   * @param password 原始密码
   * @returns 加密后的密码（包含IV）
   * @private
   */
  private async encryptPassword(password: string): Promise<string> {
    try {
      // 生成随机初始化向量
      const iv = crypto.randomBytes(16);

      // 将密钥从hex转换为Buffer
      const key = Buffer.from(this.secretKey, "hex");

      // 创建加密器
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      // cipher.setAutoPadding(true);

      // 加密密码
      let encrypted = cipher.update(password, "utf8", "hex");
      encrypted += cipher.final("hex");

      // 将IV和加密数据组合
      const result = iv.toString("hex") + ":" + encrypted;

      return result;
    } catch (error) {
      console.error("密码加密失败:", error);
      throw new Error("密码加密失败");
    }
  }

  /**
   * AES密码解密
   * 解密使用AES-256-CBC算法加密的密码
   *
   * @param encryptedData 加密的密码数据（包含IV）
   * @returns 解密后的原始密码
   * @private
   */
  private async decryptPassword(encryptedData: string): Promise<string> {
    try {
      // 分离IV和加密数据
      const parts = encryptedData.split(":");
      if (parts.length !== 2) {
        throw new Error("加密数据格式错误");
      }

      const iv = Buffer.from(parts[0], "hex");
      const encrypted = parts[1];

      // 将密钥从hex转换为Buffer
      const key = Buffer.from(this.secretKey, "hex");

      // 创建解密器
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      // decipher.setAutoPadding(true);

      // 解密密码
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("密码解密失败:", error);
      throw new Error("密码解密失败");
    }
  }
}

// 导出服务实例
export const loginSessionService = LoginSessionService.getInstance();
