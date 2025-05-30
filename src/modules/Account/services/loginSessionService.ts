import type { TResponse } from "@/shared/types/response";

/**
 * 渲染进程本地会话服务类
 * 负责处理渲染进程中的登录会话相关操作
 * 通过 IPC 与主进程的 LoginSessionService 通信
 */
export class LoginSessionService {
  private static instance: LoginSessionService;

  /**
   * 私有构造函数，实现单例模式
   */
  private constructor() {}

  /**
   * 获取 LoginSessionService 单例
   * @returns LoginSessionService 实例
   */
  public static getInstance(): LoginSessionService {
    if (!LoginSessionService.instance) {
      LoginSessionService.instance = new LoginSessionService();
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
  public async createSession(sessionData: {
    username: string;
    password?: string; // 用于本地用户
    token?: string; // 用于在线账户
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

      const result = await window.shared.ipcRenderer.invoke(
        "session:create",
        sessionData
      );
      return result;
    } catch (error) {
      console.error("创建登录会话失败:", error);
      return {
        success: false,
        message: "创建会话失败，请重试",
      };
    }
  }

  /**
   * 获取指定用户的会话信息
   * 用于检查用户是否已登录或获取会话详情
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @returns TResponse 会话信息
   * @returns TResponse.success 操作是否成功
   * @returns TResponse.message 操作结果消息
   * @returns TResponse.data 会话数据对象
   * @returns TResponse.data.username 用户名
   * @returns TResponse.data.token 会话令牌（可选，仅在线账户使用）
   * @returns TResponse.data.accountType 账户类型（'local' | 'online'）
   * @returns TResponse.data.rememberMe 是否记住密码（0: 否, 1: 是）
   * @returns TResponse.data.lastLoginTime 最后登录时间戳
   * @returns TResponse.data.autoLogin 是否自动登录（0: 否, 1: 是）
   * @returns TResponse.data.isActive 会话是否活跃（0: 否, 1: 是）
   *
   * @example
   * ```typescript
   * const result = await loginSessionService.getSession('testuser', 'local');
   * if (result.success) {
   *   const sessionData = result.data;
   *   console.log('用户名:', sessionData.username);
   *   console.log('是否记住密码:', sessionData.rememberMe === 1);
   *   console.log('是否自动登录:', sessionData.autoLogin === 1);
   *   console.log('会话是否活跃:', sessionData.isActive === 1);
   * }
   * ```
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

      const result = await window.shared.ipcRenderer.invoke(
        "session:getSession",
        username,
        accountType
      );
      return result;
    } catch (error) {
      console.error("获取会话失败:", error);
      return {
        success: false,
        message: "获取会话失败，请重试",
      };
    }
  }
  /**
   * 智能保存会话
   * 自动判断是创建还是更新，并处理各种边界情况
   */
  public async saveSession(sessionData: {
    username: string;
    password?: string;
    token?: string;
    accountType: "local" | "online";
    rememberMe: boolean;
    autoLogin: boolean;
  }): Promise<TResponse> {
    try {
      const result = await window.shared.ipcRenderer.invoke(
        "session:saveSession",
        sessionData
      );
      return result;
    } catch (error) {
      console.error("保存会话失败:", error);
      return {
        success: false,
        message: "保存会话失败，请重试",
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
      lastLoginTime?: number;
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

      const result = await window.shared.ipcRenderer.invoke(
        "session:update",
        username,
        accountType,
        updates
      );
      return result;
    } catch (error) {
      console.error("更新会话失败:", error);
      return {
        success: false,
        message: "更新会话失败，请重试",
      };
    }
  }

  /**
   * 获取记住登录凭证（勾选了remember）的用户列表
   * 用于登录页面显示历史登录用户
   *
   * ipc接口返回的数据结构：
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
   * @returns 直接返回 ipcRenderer.invoke 的结果
   */
  public async getRememberedUsers(): Promise<TResponse> {
    try {
      const result = await window.shared.ipcRenderer.invoke(
        "session:getRememberedUsers"
      );
      return result;
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

      const result = await window.shared.ipcRenderer.invoke(
        "session:validatePassword",
        username,
        accountType,
        inputPassword
      );
      return result;
    } catch (error) {
      console.error("验证记住的密码失败:", error);
      return {
        success: false,
        message: "密码验证失败，请重试",
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
      const result = await window.shared.ipcRenderer.invoke(
        "session:getAutoLoginInfo"
      );
      return result;
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
      const result = await window.shared.ipcRenderer.invoke(
        "session:getCurrentSession"
      );
      return result;
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

      const result = await window.shared.ipcRenderer.invoke(
        "session:removeSession",
        username,
        accountType
      );
      return result;
    } catch (error) {
      console.error("删除会话失败:", error);
      return {
        success: false,
        message: "删除会话失败，请重试",
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

      const result = await window.shared.ipcRenderer.invoke(
        "session:logout",
        username,
        accountType,
        keepRemembered
      );
      return result;
    } catch (error) {
      console.error("退出登录失败:", error);
      return {
        success: false,
        message: "退出登录失败，请重试",
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
      const result = await window.shared.ipcRenderer.invoke("session:clearAll");
      return result;
    } catch (error) {
      console.error("清除所有会话失败:", error);
      return {
        success: false,
        message: "清除会话失败，请重试",
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
      const result = await window.shared.ipcRenderer.invoke(
        "session:getLoginHistory"
      );
      return result;
    } catch (error) {
      console.error("获取登录历史失败:", error);
      return {
        success: false,
        message: "获取登录历史失败",
      };
    }
  }

  /**
   * 监听会话事件
   * 设置会话相关事件的监听器
   *
   * @param callback 事件回调函数
   * @returns 移除监听器的函数
   */
  public onSessionEvent(
    callback: (event: {
      type:
        | "session-created"
        | "session-updated"
        | "session-removed"
        | "user-logout";
      data: any;
      timestamp: number;
    }) => void
  ): () => void {
    const removeListener = window.shared.ipcRenderer.on(
      "session:event",
      callback
    );
    return removeListener;
  }

  /**
   * 快速登录
   * 使用记住的密码进行快速登录
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
      // 验证参数
      if (!username || !accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空",
        };
      }
      // 调用主进程的快速登录IPC
      const result = await window.shared.ipcRenderer.invoke(
        "session:quickLogin",
        username,
        accountType
      );
      return result;
    } catch (error) {
      console.error("快速登录失败:", error);
      return {
        success: false,
        message: "快速登录失败，请重试",
      };
    }
  }

  /**
   * 检查用户是否已记住密码
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @returns 是否已记住密码
   */
  public async isPasswordRemembered(
    username: string,
    accountType: string
  ): Promise<boolean> {
    try {
      const result = await this.getRememberedUsers();
      if (!result.success) {
        return false;
      }

      const rememberedUsers = result.data || [];
      return rememberedUsers.some(
        (user: any) =>
          user.username === username && user.accountType === accountType
      );
    } catch (error) {
      console.error("检查密码记住状态失败:", error);
      return false;
    }
  }

  /**
   * 设置自动登录
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @param enable 是否启用自动登录
   * @returns 操作结果
   */
  public async setAutoLogin(
    username: string,
    accountType: string,
    enable: boolean
  ): Promise<TResponse> {
    try {
      const result = await this.updateSession(username, accountType, {
        autoLogin: enable,
      });
      return result;
    } catch (error) {
      console.error("设置自动登录失败:", error);
      return {
        success: false,
        message: "设置自动登录失败，请重试",
      };
    }
  }

  /**
   * 批量删除会话
   * 删除多个用户的会话信息
   *
   * @param sessions 要删除的会话列表
   * @returns 操作结果
   */
  public async batchRemoveSessions(
    sessions: Array<{
      username: string;
      accountType: string;
    }>
  ): Promise<TResponse> {
    try {
      const results = await Promise.all(
        sessions.map((session) =>
          this.removeSession(session.username, session.accountType)
        )
      );

      const successCount = results.filter((result) => result.success).length;
      const totalCount = results.length;

      if (successCount === totalCount) {
        return {
          success: true,
          message: `成功删除 ${successCount} 个会话`,
        };
      } else {
        return {
          success: false,
          message: `删除会话部分失败，成功 ${successCount}/${totalCount}`,
        };
      }
    } catch (error) {
      console.error("批量删除会话失败:", error);
      return {
        success: false,
        message: "批量删除会话失败，请重试",
      };
    }
  }
}

// 导出单例实例
export const loginSessionService = LoginSessionService.getInstance();

// 导出类型定义
export interface SessionUser {
  username: string;
  accountType: "local" | "online";
  lastLoginTime: number;
  autoLogin: boolean;
}

export interface CurrentSession {
  username: string;
  accountType: "local" | "online";
  lastLoginTime: number;
  autoLogin: boolean;
  rememberMe: boolean;
}

export interface AutoLoginInfo {
  username: string;
  accountType: "local" | "online";
  lastLoginTime: number;
  hasPassword: boolean;
}

export interface LoginHistoryItem {
  username: string;
  accountType: "local" | "online";
  lastLoginTime: number;
  isActive: boolean;
  rememberMe: boolean;
  autoLogin: boolean;
  createdAt: number;
}
