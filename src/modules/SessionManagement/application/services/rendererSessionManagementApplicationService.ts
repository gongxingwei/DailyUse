import { UserSession, SessionStatus } from '../../domain/types';
import type { TResponse } from '@/shared/types/response';
import { ElectronAPI } from '@/types/electron';

/**
 * 渲染进程会话管理应用服务
 * 负责处理会话相关的业务逻辑和与主进程的通信
 */
export class RendererSessionManagementApplicationService {
  private static instance: RendererSessionManagementApplicationService;
  private electronAPI: ElectronAPI;

  constructor() {
    this.electronAPI = (window as any).electronAPI;
    this.setupEventListeners();
  }

  public static getInstance(): RendererSessionManagementApplicationService {
    if (!RendererSessionManagementApplicationService.instance) {
      RendererSessionManagementApplicationService.instance = new RendererSessionManagementApplicationService();
    }
    return RendererSessionManagementApplicationService.instance;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听会话状态变化
    this.electronAPI.onSessionStatusChanged((session: UserSession) => {
      this.handleSessionStatusChange(session);
    });

    // 监听会话过期
    this.electronAPI.onSessionExpired((sessionId: string) => {
      this.handleSessionExpired(sessionId);
    });

    // 监听会话刷新
    this.electronAPI.onSessionRefreshed((session: UserSession) => {
      this.handleSessionRefreshed(session);
    });

    // 监听自动登录状态变化
    this.electronAPI.onAutoLoginStateChanged((enabled: boolean) => {
      this.handleAutoLoginStateChange(enabled);
    });
  }

  /**
   * 获取当前会话
   */
  async getCurrentSession(): Promise<TResponse<UserSession>> {
    try {
      const result = await this.electronAPI.sessionGetCurrent();
      return result;
    } catch (error) {
      console.error('获取当前会话失败:', error);
      return {
        success: false,
        message: '获取当前会话失败',
        data: undefined
      };
    }
  }

  /**
   * 验证会话
   */
  async validateSession(token: string): Promise<TResponse<UserSession>> {
    try {
      const result = await this.electronAPI.sessionValidate(token);
      return result;
    } catch (error) {
      console.error('验证会话失败:', error);
      return {
        success: false,
        message: '验证会话失败',
        data: undefined
      };
    }
  }

  /**
   * 刷新会话
   */
  async refreshSession(refreshToken: string): Promise<TResponse<UserSession>> {
    try {
      const result = await this.electronAPI.sessionRefresh(refreshToken);
      return result;
    } catch (error) {
      console.error('刷新会话失败:', error);
      return {
        success: false,
        message: '刷新会话失败',
        data: undefined
      };
    }
  }

  /**
   * 销毁会话（登出）
   */
  async destroySession(token?: string): Promise<TResponse> {
    try {
      const result = await this.electronAPI.sessionDestroy(token);
      return result;
    } catch (error) {
      console.error('销毁会话失败:', error);
      return {
        success: false,
        message: '销毁会话失败',
        data: undefined
      };
    }
  }

  /**
   * 销毁所有会话
   */
  async destroyAllSessions(): Promise<TResponse> {
    try {
      const result = await this.electronAPI.sessionDestroyAll();
      return result;
    } catch (error) {
      console.error('销毁所有会话失败:', error);
      return {
        success: false,
        message: '销毁所有会话失败',
        data: undefined
      };
    }
  }

  /**
   * 获取用户活动会话列表
   */
  async getUserActiveSessions(): Promise<TResponse<UserSession[]>> {
    try {
      const result = await this.electronAPI.sessionGetActiveSessions();
      return result;
    } catch (error) {
      console.error('获取活动会话失败:', error);
      return {
        success: false,
        message: '获取活动会话失败',
        data: undefined
      };
    }
  }

  /**
   * 检查是否有活动会话
   */
  async hasActiveSession(): Promise<boolean> {
    try {
      const result = await this.getCurrentSession();
      return result.success && result.data?.status === SessionStatus.ACTIVE;
    } catch (error) {
      console.error('检查活动会话失败:', error);
      return false;
    }
  }

  /**
   * 获取自动登录状态
   */
  async getAutoLoginState(): Promise<boolean> {
    try {
      const result = await this.electronAPI.sessionGetAutoLoginState();
      return result;
    } catch (error) {
      console.error('获取自动登录状态失败:', error);
      return false;
    }
  }

  /**
   * 设置自动登录状态
   */
  async setAutoLoginState(enabled: boolean): Promise<TResponse> {
    try {
      const result = await this.electronAPI.sessionSetAutoLoginState(enabled);
      return result;
    } catch (error) {
      console.error('设置自动登录状态失败:', error);
      return {
        success: false,
        message: '设置自动登录状态失败',
        data: undefined
      };
    }
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<TResponse> {
    try {
      const result = await this.electronAPI.sessionCleanupExpired();
      return result;
    } catch (error) {
      console.error('清理过期会话失败:', error);
      return {
        success: false,
        message: '清理过期会话失败',
        data: undefined
      };
    }
  }

  /**
   * 处理会话状态变化
   */
  private handleSessionStatusChange(session: UserSession): void {
    console.log('会话状态变化:', session);
    
    // 可以在这里触发全局状态更新
    // 例如：更新 Pinia store 或触发自定义事件
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('session-status-changed', {
      detail: { session }
    }));
  }

  /**
   * 处理会话过期
   */
  private handleSessionExpired(sessionId: string): void {
    console.log('会话过期:', sessionId);
    
    // 可以在这里处理会话过期逻辑
    // 例如：显示通知、重定向到登录页等
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('session-expired', {
      detail: { sessionId }
    }));
  }

  /**
   * 处理会话刷新
   */
  private handleSessionRefreshed(session: UserSession): void {
    console.log('会话已刷新:', session);
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('session-refreshed', {
      detail: { session }
    }));
  }

  /**
   * 处理自动登录状态变化
   */
  private handleAutoLoginStateChange(enabled: boolean): void {
    console.log('自动登录状态变化:', enabled);
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('auto-login-state-changed', {
      detail: { enabled }
    }));
  }
}

// 导出单例实例
export const rendererSessionManagementApplicationService = RendererSessionManagementApplicationService.getInstance();
