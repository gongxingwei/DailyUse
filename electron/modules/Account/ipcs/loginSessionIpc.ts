import { ipcMain } from "electron";
import { loginSessionService } from "../services/loginSessionService";
import type { TResponse } from "@/shared/types/response";

/**
 * 登录会话 IPC 处理器
 * 处理渲染进程与主进程之间的会话相关通信
 * 提供会话管理、记住密码、自动登录等功能的 IPC 接口
 */

/**
 * 设置登录会话相关的 IPC 处理器
 * 在应用启动时调用此函数注册所有会话相关的 IPC 处理器
 */
export async function setupLoginSessionHandlers(): Promise<void> {
  try {
    // 确保服务实例已初始化
    const sessionService = await loginSessionService;
    ipcMain.handle(
      "session:saveSession",
      async (
        _event,
        sessionData: {
          username: string;
          password?: string;
          token?: string;
          accountType: "local" | "online";
          rememberMe: boolean;
          autoLogin: boolean;
        }
      ): Promise<TResponse> => {
        try {
          const sessionService = await loginSessionService;

          // 检查会话是否已存在
          const existingResult = await sessionService.getSession(
            sessionData.username,
            sessionData.accountType
          );

          if (existingResult.success && existingResult.data) {
            // 如果会话已存在，更新会话信息

            const updateResult = await sessionService.updateSession(
              sessionData.username,
              sessionData.accountType,
              {
                password: sessionData.password,
                token: sessionData.token,
                rememberMe: sessionData.rememberMe,
                autoLogin: sessionData.autoLogin,
                isActive: true,
              }
            );

            return {
              ...updateResult,
              message: updateResult.success
                ? "会话更新成功"
                : updateResult.message,
            };
          } else {
            const createResult = await sessionService.addSession(sessionData);

            return {
              ...createResult,
              message: createResult.success
                ? "会话创建成功"
                : createResult.message,
            };
          }
        } catch (error) {
          console.error("IPC: 保存会话异常", error);
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "保存会话失败，未知错误",
          };
        }
      }
    );
    /**
     * 快速登录
     * 使用保存的加密密码进行快速登录
     *
     * 调用方式：
     * ipcRenderer.invoke('session:quickLogin', 'username', 'local')
     */
    ipcMain.handle(
      "session:quickLogin",
      async (
        _event,
        username: string,
        accountType: string
      ): Promise<TResponse> => {
        try {
          const result = await sessionService.quickLogin(username, accountType);

          return result;
        } catch (error) {
          console.error("IPC: 快速登录异常", error);
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "快速登录失败，未知错误",
          };
        }
      }
    );
    /**
     * 创建登录会话
     * 用户登录成功后保存会话信息
     *
     * 调用方式：
     * ipcRenderer.invoke('session:create', {
     *   username: 'testuser',
     *   password: 'password123', // 可选，仅在记住密码时提供
     *   accountType: 'local',
     *   rememberMe: true,
     *   autoLogin: false
     * })
     */
    ipcMain.handle(
      "session:create",
      async (
        _event,
        sessionData: {
          username: string;
          password?: string;
          token?: string;
          accountType: "local" | "online";
          rememberMe: boolean;
          autoLogin: boolean;
        }
      ): Promise<TResponse> => {
        console.log("IPC: 创建登录会话", {
          username: sessionData.username,
          accountType: sessionData.accountType,
        });

        try {
          // 检查会话是否已存在
          const existingResult = await sessionService.getSession(
            sessionData.username,
            sessionData.accountType
          );

          if (existingResult.success && existingResult.data) {
            // 如果会话已存在，更新会话信息
            console.log("IPC: 会话已存在，执行更新操作", {
              username: sessionData.username,
              accountType: sessionData.accountType,
            });

            const updateResult = await sessionService.updateSession(
              sessionData.username,
              sessionData.accountType,
              {
                password: sessionData.password,
                token: sessionData.token,
                rememberMe: sessionData.rememberMe,
                autoLogin: sessionData.autoLogin,
                isActive: true,
              }
            );

            return {
              ...updateResult,
              message: updateResult.success
                ? "会话更新成功"
                : updateResult.message,
            };
          } else {
            // 会话不存在，创建新会话
            console.log("IPC: 会话不存在，创建新会话", {
              username: sessionData.username,
              accountType: sessionData.accountType,
            });

            const createResult = await sessionService.addSession(sessionData);

            return {
              ...createResult,
              message: createResult.success
                ? "会话创建成功"
                : createResult.message,
            };
          }
        } catch (error) {
          console.error("IPC: 创建会话异常", error);
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "创建会话失败，未知错误",
          };
        }
      }
    );

    /**
     * 更新会话信息
     * 更新指定用户的会话设置
     *
     * 调用方式：
     * ipcRenderer.invoke('session:update', 'username', 'local', {
     *   rememberMe: false,
     *   autoLogin: true
     * })
     */
    ipcMain.handle(
      "session:update",
      async (
        _event,
        username: string,
        accountType: string,
        updates: {
          rememberMe?: boolean;
          autoLogin?: boolean;
          isActive?: boolean;
          password?: string;
        }
      ): Promise<TResponse> => {
        return await sessionService.updateSession(
          username,
          accountType,
          updates
        );
      }
    );

    /**
     * 获取记住密码的用户列表
     * 用于登录页面显示历史登录用户
     *
     * 调用方式：
     * ipcRenderer.invoke('session:getRememberedUsers')
     */
    ipcMain.handle(
      "session:getRememberedUsers",
      async (_event): Promise<TResponse> => {
        return await sessionService.getRememberedUsers();
      }
    );

    /**
     * 验证记住的密码
     * 用于快速登录时验证保存的密码
     *
     * 调用方式：
     * ipcRenderer.invoke('session:validatePassword', 'username', 'local', 'password123')
     */
    ipcMain.handle(
      "session:validatePassword",
      async (
        _event,
        username: string,
        accountType: string,
        inputPassword: string
      ): Promise<TResponse> => {
        return await sessionService.validateRememberedPassword(
          username,
          accountType,
          inputPassword
        );
      }
    );

    /**
     * 获取自动登录信息
     * 应用启动时检查是否有用户设置了自动登录
     *
     * 调用方式：
     * ipcRenderer.invoke('session:getAutoLoginInfo')
     */
    ipcMain.handle(
      "session:getAutoLoginInfo",
      async (_event): Promise<TResponse> => {
        return await sessionService.getAutoLoginInfo();
      }
    );

    /**
     * 获取当前活跃会话
     * 获取当前登录的用户信息
     *
     * 调用方式：
     * ipcRenderer.invoke('session:getCurrentSession')
     */
    ipcMain.handle(
      "session:getCurrentSession",
      async (_event): Promise<TResponse> => {
        return await sessionService.getCurrentSession();
      }
    );

    /**
     * 删除指定用户的会话
     * 用于移除记住的用户信息
     *
     * 调用方式：
     * ipcRenderer.invoke('session:removeSession', 'username', 'local')
     */
    ipcMain.handle(
      "session:removeSession",
      async (
        _event,
        username: string,
        accountType: string
      ): Promise<TResponse> => {
        return await sessionService.removeSession(username, accountType);
      }
    );

    /**
     * 用户退出登录
     * 将当前活跃会话设为非活跃状态
     *
     * 调用方式：
     * ipcRenderer.invoke('session:logout', 'username', 'local', true)
     */
    ipcMain.handle(
      "session:logout",
      async (
        _event,
        username: string,
        accountType: string,
        keepRemembered: boolean = true
      ): Promise<TResponse> => {
        console.log("IPC: 用户退出登录", {
          username,
          accountType,
          keepRemembered,
        });
        return await sessionService.logout(
          username,
          accountType,
          keepRemembered
        );
      }
    );

    /**
     * 清除所有会话数据
     * 清理所有保存的登录信息，用于重置功能
     *
     * 调用方式：
     * ipcRenderer.invoke('session:clearAll')
     */
    ipcMain.handle("session:clearAll", async (_event): Promise<TResponse> => {
      return await sessionService.clearAllSessions();
    });

    /**
     * 获取登录历史记录
     * 获取所有登录会话的历史记录
     *
     * 调用方式：
     * ipcRenderer.invoke('session:getLoginHistory')
     */
    ipcMain.handle(
      "session:getLoginHistory",
      async (_event): Promise<TResponse> => {
        return await sessionService.getLoginHistory();
      }
    );
  } catch (error) {
    console.error("设置登录会话 IPC 处理器失败:", error);
    throw error;
  }
}

/**
 * 移除登录会话相关的 IPC 处理器
 * 在应用关闭时调用此函数清理 IPC 处理器
 */
export function removeLoginSessionHandlers(): void {
  try {
    // 移除所有会话相关的 IPC 处理器
    ipcMain.removeHandler("session:quickLogin");
    ipcMain.removeHandler("session:create");
    ipcMain.removeHandler("session:update");
    ipcMain.removeHandler("session:getRememberedUsers");
    ipcMain.removeHandler("session:validatePassword");
    ipcMain.removeHandler("session:getAutoLoginInfo");
    ipcMain.removeHandler("session:getCurrentSession");
    ipcMain.removeHandler("session:removeSession");
    ipcMain.removeHandler("session:logout");
    ipcMain.removeHandler("session:clearAll");
    ipcMain.removeHandler("session:getLoginHistory");
  } catch (error) {
    console.error("移除登录会话 IPC 处理器失败:", error);
  }
}

/**
 * 会话事件发送器
 * 用于主动向渲染进程发送会话相关事件
 */
export class SessionEventEmitter {
  /**
   * 发送会话状态变更事件
   *
   * @param webContents 目标窗口的 webContents
   * @param eventType 事件类型
   * @param data 事件数据
   */
  static sendSessionEvent(
    webContents: Electron.WebContents,
    eventType:
      | "session-created"
      | "session-updated"
      | "session-removed"
      | "user-logout",
    data: any
  ): void {
    try {
      webContents.send("session:event", {
        type: eventType,
        data,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("发送会话事件失败:", error);
    }
  }
}

// 导出类型定义，供渲染进程使用
export interface SessionIpcChannels {
  "session:quickLogin": (
    username: string,
    accountType: string
  ) => Promise<TResponse>;
  "session:create": (sessionData: {
    username: string;
    password?: string;
    accountType: "local" | "online";
    rememberMe: boolean;
    autoLogin: boolean;
  }) => Promise<TResponse>;

  "session:update": (
    username: string,
    accountType: string,
    updates: {
      rememberMe?: boolean;
      autoLogin?: boolean;
      isActive?: boolean;
      password?: string;
    }
  ) => Promise<TResponse>;

  "session:getRememberedUsers": () => Promise<TResponse>;
  "session:validatePassword": (
    username: string,
    accountType: string,
    inputPassword: string
  ) => Promise<TResponse>;
  "session:getAutoLoginInfo": () => Promise<TResponse>;
  "session:getCurrentSession": () => Promise<TResponse>;
  "session:removeSession": (
    username: string,
    accountType: string
  ) => Promise<TResponse>;
  "session:logout": (
    username: string,
    accountType: string,
    keepRemembered?: boolean
  ) => Promise<TResponse>;
  "session:clearAll": () => Promise<TResponse>;
  "session:getLoginHistory": () => Promise<TResponse>;
}

// 导出事件类型定义
export interface SessionEvents {
  "session:event": {
    type:
      | "session-created"
      | "session-updated"
      | "session-removed"
      | "user-logout";
    data: any;
    timestamp: number;
  };
}
