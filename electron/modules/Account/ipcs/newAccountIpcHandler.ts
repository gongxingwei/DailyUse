import { ipcMain } from "electron";
import { MainAccountSystemInitializer } from "../initialization/mainAccountSystemInitializer";
import type { TResponse } from "@/shared/types/response";

/**
 * 新的账号 IPC 处理器
 * 使用新的 DDD 架构处理渲染进程的账号相关请求
 */
export class NewAccountIpcHandler {
  /**
   * 注册所有 IPC 处理器
   */
  public static register(): void {
    console.log('🔄 [主进程-IPC] 注册新的账号 IPC 处理器');

    // 确保账号系统已初始化
    const accountService = MainAccountSystemInitializer.initialize();

    // 用户注册（密码处理已迁移到 Authentication 模块）
    ipcMain.handle('account:register', async (_event, registerData: {
      username: string;
      email?: string;
    }): Promise<TResponse> => {
      try {
        console.log('🔄 [主进程-IPC] 处理注册请求:', registerData.username);
        console.log('⚠️ [主进程-IPC] 注册功能需要与 Authentication 模块集成');

        // TODO: 需要重构为与 Authentication 模块协作
        return {
          success: false,
          message: '注册功能正在重构中，请使用 Authentication 模块的注册接口',
          data: undefined
        };

        /*
        const result = await accountService.register({
          username: registerData.username,
          email: registerData.email
        });

        console.log('✅ [主进程-IPC] 注册请求处理完成');
        return result;
        */

      } catch (error) {
        console.error('❌ [主进程-IPC] 注册异常:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "注册功能正在重构中",
          data: null
        };
      }
    });

    // 用户登录（密码验证已迁移到 Authentication 模块）
    ipcMain.handle('account:login', async (_event, loginData: {
      username: string;
      remember: boolean;
    }): Promise<TResponse> => {
      try {
        console.log('🔄 [主进程-IPC] 处理登录请求:', loginData.username);
        console.log('⚠️ [主进程-IPC] 登录功能需要与 Authentication 模块集成');

        // TODO: 需要重构为与 Authentication 模块协作
        return {
          success: false,
          message: '登录功能正在重构中，请使用 Authentication 模块的登录接口',
          data: null
        };

        /*
        const result = await accountService.login({
          username: loginData.username,
          remember: loginData.remember
        });

        console.log('✅ [主进程-IPC] 登录请求处理完成');
        return result;
        */

      } catch (error) {
        console.error('❌ [主进程-IPC] 登录异常:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "登录失败，未知错误",
          data: null
        };
      }
    });

    // 用户登出（已迁移到 Authentication 模块）
    ipcMain.handle('account:logout', async (_event, _token: string): Promise<TResponse> => {
      try {
        console.log('🔄 [主进程-IPC] 处理登出请求');
        console.log('⚠️ [主进程-IPC] 登出功能已迁移到 Authentication 模块');

        return {
          success: false,
          message: '登出功能已迁移到 Authentication 模块，请使用 AuthenticationApplicationService.logout()',
          data: null
        };

      } catch (error) {
        console.error('❌ [主进程-IPC] 登出异常:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "登出功能正在重构中",
          data: null
        };
      }
    });

    // 验证会话（已迁移到 Authentication 模块）
    ipcMain.handle('account:validate-session', async (_event, _token: string): Promise<TResponse> => {
      try {
        console.log('🔄 [主进程-IPC] 处理会话验证请求');
        console.log('⚠️ [主进程-IPC] 会话验证功能已迁移到 Authentication 模块');

        return {
          success: false,
          message: '会话验证功能已迁移到 Authentication 模块',
          data: null
        };

      } catch (error) {
        console.error('❌ [主进程-IPC] 会话验证异常:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "验证功能正在重构中",
          data: null
        };
      }
    });

    // 获取所有用户
    ipcMain.handle('account:get-all-users', async (): Promise<TResponse> => {
      try {
        console.log('🔄 [主进程-IPC] 处理获取用户列表请求');

        const result = await accountService.getAllUsers();

        if (result.success && result.data) {
          console.log('✅ [主进程-IPC] 获取用户列表成功，数量:', result.data.length);
          const users = result.data.map(account => ({
            id: account.id,
            username: account.username,
            email: account.email?.value,
            accountType: account.accountType,
            status: account.status,
            createdAt: account.createdAt.getTime(),
            lastLoginAt: account.lastLoginAt?.getTime()
          }));

          return {
            success: true,
            message: result.message,
            data: users
          };
        }

        console.log('❌ [主进程-IPC] 获取用户列表失败:', result.message);
        return {
          success: false,
          message: result.message,
          data: null
        };

      } catch (error) {
        console.error('❌ [主进程-IPC] 获取用户列表异常:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "获取失败，未知错误",
          data: null
        };
      }
    });

    // 更新用户信息
    ipcMain.handle('account:update-info', async (_event, data: {
      accountId: string;
      updateData: {
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
        bio?: string;
        avatar?: string;
      };
    }): Promise<TResponse> => {
      try {
        console.log('🔄 [主进程-IPC] 处理更新用户信息请求:', data.accountId);

        const result = await accountService.updateAccountInfo(data.accountId, data.updateData);

        if (result.success && result.data) {
          console.log('✅ [主进程-IPC] 更新用户信息成功');
          return {
            success: true,
            message: result.message,
            data: {
              id: result.data.id,
              username: result.data.username,
              email: result.data.email?.value,
              accountType: result.data.accountType
            }
          };
        }

        console.log('❌ [主进程-IPC] 更新用户信息失败:', result.message);
        return {
          success: false,
          message: result.message,
          data: null
        };

      } catch (error) {
        console.error('❌ [主进程-IPC] 更新用户信息异常:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "更新失败，未知错误",
          data: null
        };
      }
    });

    // 注销账号（禁用账号）
    ipcMain.handle('account:deregister', async (_event, accountId: string): Promise<TResponse> => {
      try {
        console.log('🔄 [主进程-IPC] 处理注销账号请求:', accountId);

        const result = await accountService.disableAccount(accountId);

        console.log(result.success ? '✅ [主进程-IPC] 注销账号成功' : '❌ [主进程-IPC] 注销账号失败:', result.message);
        return result;

      } catch (error) {
        console.error('❌ [主进程-IPC] 注销账号异常:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "注销失败，未知错误",
          data: null
        };
      }
    });

    // 修改密码
    ipcMain.handle('account:change-password', async (_event, data: {
      accountId: string;
      oldPassword: string;
      newPassword: string;
    }): Promise<TResponse> => {
      try {
        console.log('🔄 [主进程-IPC] 处理修改密码请求:', data.accountId);
        console.log('⚠️ [主进程-IPC] 密码修改功能已迁移到 Authentication 模块');

        // TODO: 需要重构为与 Authentication 模块协作
        return {
          success: false,
          message: '密码修改功能已迁移到 Authentication 模块，请使用 AuthenticationApplicationService.changePassword()',
          data: null
        };

      } catch (error) {
        console.error('❌ [主进程-IPC] 修改密码异常:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "密码修改功能正在重构中",
          data: null
        };
      }
    });

    console.log('✅ [主进程-IPC] 新的账号 IPC 处理器注册完成');
  }

  /**
   * 注销所有 IPC 处理器
   */
  public static unregister(): void {
    console.log('🔄 [主进程-IPC] 注销账号 IPC 处理器');
    
    ipcMain.removeAllListeners('account:register');
    ipcMain.removeAllListeners('account:login');
    ipcMain.removeAllListeners('account:logout');
    ipcMain.removeAllListeners('account:validate-session');
    ipcMain.removeAllListeners('account:get-all-users');
    ipcMain.removeAllListeners('account:update-info');
    ipcMain.removeAllListeners('account:deregister');
    ipcMain.removeAllListeners('account:change-password');
    
    console.log('✅ [主进程-IPC] 账号 IPC 处理器注销完成');
  }
}
