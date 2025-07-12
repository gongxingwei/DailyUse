import { ipcMain } from "electron";
import { AuthenticationLoginService} from "../../application/services/authenticationLoginService";
import { AuthenticationLogoutService} from "../../application/services/authenticationLogoutService";
import type { PasswordAuthenticationRequest, PasswordAuthenticationResponse } from "../../domain/types";


/**
 * Authentication 模块的 IPC 处理器
 * 处理来自渲染进程的认证相关请求
 */
export class AuthenticationIpcHandler {
  private static instance: AuthenticationIpcHandler | null = null;
  private loginService: AuthenticationLoginService;
  private logoutService: AuthenticationLogoutService;

  constructor(logoutService: AuthenticationLogoutService) {
    this.logoutService = logoutService;
    this.loginService = new AuthenticationLoginService();

    this.setupIpcHandlers();
  }

  static async createInstance(): Promise<AuthenticationIpcHandler> {
    const logoutService = await AuthenticationLogoutService.getInstance();
    return new AuthenticationIpcHandler(logoutService);
  }
  static async getInstance(): Promise<AuthenticationIpcHandler> {
    if (!AuthenticationIpcHandler.instance) {
      AuthenticationIpcHandler.instance = await AuthenticationIpcHandler.createInstance();
    }
    return AuthenticationIpcHandler.instance;
  }

  static async registerIpcHandlers(): Promise<AuthenticationIpcHandler> { 
    const instance = await AuthenticationIpcHandler.createInstance();
    return instance;
  }

  /**
   * 设置IPC处理器
   */
  private setupIpcHandlers(): void {
    // 处理登录请求
    console.log('🚀 [AuthenticationIpc] 启动登录请求处理');
    ipcMain.handle('authentication:password-authentication', async (_event, request: PasswordAuthenticationRequest): Promise<TResponse<PasswordAuthenticationResponse>> => {
      try {
        console.log('🔐 [AuthIpc] 收到登录请求:', request.username);
        
        const result = await this.loginService.PasswordAuthentication(request);
        
        console.log('📤 [AuthIpc] 登录处理完成:', {
          username: request.username,
          success: result.success
        });
        
        return result;
      } catch (error) {
        console.error('❌ [AuthIpc] 登录处理异常:', error);
        
        return {
          success: false,
          message: '登录处理异常，请稍后重试'
        };
      }
    });

    // 处理登出请求
    ipcMain.handle('authentication:logout', async (_event, sessionId: string): Promise<{ success: boolean; message: string }> => {
      try {
        console.log('🔐 [AuthIpc] 收到登出请求:', sessionId);
        
        // TODO: 实现登出逻辑
        // 1. 清除会话
        // 2. 发布登出事件
        // 3. 通知SessionLogging模块
        
        return {
          success: true,
          message: '登出成功'
        };
      } catch (error) {
        console.error('❌ [AuthIpc] 登出处理异常:', error);
        
        return {
          success: false,
          message: '登出失败'
        };
      }
    });

    // 验证会话状态
    ipcMain.handle('authentication:verify-session', async (_event, sessionId: string): Promise<{ valid: boolean; accountId?: string }> => {
      try {
        console.log('🔐 [AuthIpc] 验证会话状态:', sessionId);
        
        // TODO: 实现会话验证逻辑
        // 1. 查找会话
        // 2. 检查过期时间
        // 3. 返回验证结果
        
        return {
          valid: false, // 暂时返回false，需要实现具体逻辑
          accountId: undefined
        };
      } catch (error) {
        console.error('❌ [AuthIpc] 会话验证异常:', error);
        
        return {
          valid: false
        };
      }
    });

    console.log('✅ [AuthIpc] Authentication IPC handlers registered');
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 移除IPC监听器
    ipcMain.removeHandler('authentication:login');
    ipcMain.removeHandler('authentication:logout');
    ipcMain.removeHandler('authentication:verify-session');
    
    // 清理登录服务
    this.loginService.destroy();
    
    console.log('🧹 [AuthIpc] Authentication IPC handlers cleaned up');
  }
}
