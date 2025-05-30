import { ipcMain } from "electron";
import type {
  TLoginData,
  TRegisterData,
  TUser,
} from "@/modules/Account/types/account";
import type { TResponse } from "@/shared/types/response";
import { userService } from "../services/userService";

/**
 * 用户相关 IPC 处理器
 * 处理渲染进程与主进程之间的用户账户相关通信
 * 提供注册、登录、用户信息管理等功能的 IPC 接口
 */

/**
 * 设置用户相关的 IPC 处理器
 * 在应用启动时调用此函数注册所有用户相关的 IPC 处理器
 */
export async function setupUserHandlers(): Promise<void> {
  try {
    // 确保服务实例已初始化
    const service = await userService;

    /**
     * 用户注册
     * 处理新用户的注册请求
     * 
     * 调用方式：
     * ipcRenderer.invoke('user:register', {
     *   username: 'testuser',
     *   email: 'test@example.com',
     *   password: 'password123',
     *   confirmPassword: 'password123'
     * })
     */
    ipcMain.handle("user:register", async (_event, form: TRegisterData): Promise<TResponse> => {

      try {
        const response = await service.register(form);

        return response;
      } catch (error) {
        console.error('IPC: 注册异常', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "注册失败，未知错误",
        };
      }
    });

    /**
     * 用户登录
     * 验证用户凭证并返回用户信息
     * 
     * 调用方式：
     * ipcRenderer.invoke('user:login', {
     *   username: 'testuser',
     *   password: 'password123',
     *   remember: true
     * })
     */
    ipcMain.handle("user:login", async (_event, credentials: TLoginData): Promise<TResponse> => {

      try {
        const response = await service.login(credentials);

        return response;
      } catch (error) {
        console.error('IPC: 登录异常', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "登录失败，未知错误",
        };
      }
    });

    /**
     * 获取用户信息
     * 根据用户名获取用户详细信息
     * 
     * 调用方式：
     * ipcRenderer.invoke('user:getUserInfo', 'username')
     */
    ipcMain.handle("user:getUserInfo", async (_event, username: string): Promise<TResponse> => {

      try {
        const response = await service.getUserInfo(username);

        return response;
      } catch (error) {
        console.error('IPC: 获取用户信息异常', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "获取用户信息失败，未知错误",
        };
      }
    });

    /**
     * 更新用户信息
     * 更新指定用户的信息
     * 
     * 调用方式：
     * ipcRenderer.invoke('user:update', 'username', {
     *   email: 'newemail@example.com',
     *   phone: '1234567890'
     * })
     */
    ipcMain.handle("user:update", async (
      _event, 
      username: string, 
      newData: Partial<TUser>
    ): Promise<TResponse> => {

      try {
        const response = await service.updateUserInfo(username, newData);

        return response;
      } catch (error) {
        console.error('IPC: 更新用户信息异常', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "更新用户信息失败，未知错误",
        };
      }
    });

    /**
     * 删除用户账号（注销）
     * 删除指定的用户账号
     * 
     * 调用方式：
     * ipcRenderer.invoke('user:deregistration', 'username')
     */
    ipcMain.handle("user:deregistration", async (_event, username: string): Promise<TResponse> => {

      try {
        const response = await service.deleteUser(username);

        return response;
      } catch (error) {
        console.error('IPC: 删除用户账号异常', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "删除账号失败，未知错误",
        };
      }
    });

    /**
     * 升级为在线账号
     * 将本地账号升级为在线账号
     * 
     * 调用方式：
     * ipcRenderer.invoke('user:upgradeToOnline', 'username', 'onlineId')
     */
    ipcMain.handle("user:upgradeToOnline", async (
      _event, 
      username: string, 
      onlineId: string
    ): Promise<TResponse> => {

      try {
        const response = await service.upgradeToOnlineAccount(username, onlineId);

        return response;
      } catch (error) {
        console.error('IPC: 升级为在线账号异常', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "升级账号失败，未知错误",
        };
      }
    });

    /**
     * 获取所有用户列表
     * 获取系统中所有用户的信息列表（管理员功能）
     * 
     * 调用方式：
     * ipcRenderer.invoke('user:getAllUsers')
     */
    ipcMain.handle("user:getAllUsers", async (_event): Promise<TResponse> => {

      try {
        const response = await service.getAllUsers();
        console.log('IPC: 获取用户列表结果', { 
          success: response.success, 
          userCount: response.data?.length || 0 
        });
        return response;
      } catch (error) {
        console.error('IPC: 获取用户列表异常', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "获取用户列表失败，未知错误",
        };
      }
    });

    /**
     * 验证用户密码
     * 验证用户当前密码是否正确（用于敏感操作前的确认）
     * 
     * 调用方式：
     * ipcRenderer.invoke('user:verifyPassword', 'username', 'currentPassword')
     */
    ipcMain.handle("user:verifyPassword", async (
      _event, 
      username: string, 
      password: string
    ): Promise<TResponse> => {

      try {
        // 使用登录方法来验证密码
        const response = await service.login({ username, password, remember: false });
        
        if (response.success) {
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
      } catch (error) {
        console.error('IPC: 验证密码异常', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "密码验证失败，未知错误",
        };
      }
    });

    /**
     * 修改用户密码
     * 更改用户密码（需要提供当前密码）
     * 
     * 调用方式：
     * ipcRenderer.invoke('user:changePassword', 'username', 'oldPassword', 'newPassword')
     */
    ipcMain.handle("user:changePassword", async (
      _event, 
      username: string, 
      oldPassword: string, 
      newPassword: string
    ): Promise<TResponse> => {

      try {
        // 首先验证旧密码
        const verifyResult = await service.login({ username, password: oldPassword, remember: false });
        
        if (!verifyResult.success) {
          return {
            success: false,
            message: "当前密码验证失败",
          };
        }

        // 更新为新密码
        const updateResult = await service.updateUserInfo(username, { password: newPassword });
        
        if (updateResult.success) {

          return {
            success: true,
            message: "密码修改成功",
          };
        } else {
          return updateResult;
        }
      } catch (error) {
        console.error('IPC: 修改密码异常', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "修改密码失败，未知错误",
        };
      }
    });


  } catch (error) {
    console.error('设置用户 IPC 处理器失败:', error);
    throw error;
  }
}

/**
 * 移除用户相关的 IPC 处理器
 * 在应用关闭时调用此函数清理 IPC 处理器
 */
export function removeUserHandlers(): void {
  try {
    // 移除所有用户相关的 IPC 处理器
    ipcMain.removeHandler('user:register');
    ipcMain.removeHandler('user:login');
    ipcMain.removeHandler('user:getUserInfo');
    ipcMain.removeHandler('user:update');
    ipcMain.removeHandler('user:deregistration');
    ipcMain.removeHandler('user:upgradeToOnline');
    ipcMain.removeHandler('user:getAllUsers');
    ipcMain.removeHandler('user:verifyPassword');
    ipcMain.removeHandler('user:changePassword');


  } catch (error) {
    console.error('移除用户 IPC 处理器失败:', error);
  }
}

/**
 * 用户事件发送器
 * 用于主动向渲染进程发送用户相关事件
 */
export class UserEventEmitter {
  /**
   * 发送用户状态变更事件
   * 
   * @param webContents 目标窗口的 webContents
   * @param _eventType 事件类型
   * @param data 事件数据
   */
  static sendUserEvent(
    webContents: Electron.WebContents,
    _eventType: 'user-registered' | 'user-updated' | 'user-deleted' | 'user-upgraded',
    data: any
  ): void {
    try {
      webContents.send('user:_event', {
        type: _eventType,
        data,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('发送用户事件失败:', error);
    }
  }

  /**
   * 通知所有窗口用户信息已更新
   * 
   * @param username 用户名
   * @param updateType 更新类型
   */
  static notifyUserUpdate(username: string, updateType: string): void {

  }
}

// 导出类型定义，供渲染进程使用
export interface UserIpcChannels {
  'user:register': (form: TRegisterData) => Promise<TResponse>;
  'user:login': (credentials: TLoginData) => Promise<TResponse>;
  'user:getUserInfo': (username: string) => Promise<TResponse>;
  'user:update': (username: string, newData: Partial<TUser>) => Promise<TResponse>;
  'user:deregistration': (username: string) => Promise<TResponse>;
  'user:upgradeToOnline': (username: string, onlineId: string) => Promise<TResponse>;
  'user:getAllUsers': () => Promise<TResponse>;
  'user:verifyPassword': (username: string, password: string) => Promise<TResponse>;
  'user:changePassword': (username: string, oldPassword: string, newPassword: string) => Promise<TResponse>;
}

// 导出事件类型定义
export interface UserEvents {
  'user:_event': {
    type: 'user-registered' | 'user-updated' | 'user-deleted' | 'user-upgraded';
    data: any;
    timestamp: number;
  };
}