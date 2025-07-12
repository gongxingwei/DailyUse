/**
 * 账号注销请求数据
 */
export interface AccountDeactivationRequest {
  accountId: string;
  username?: string;
  requestedBy: 'user' | 'admin' | 'system';
  reason?: string;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

/**
 * 账号注销结果
 */
export interface AccountDeactivationResult {
  success: boolean;
  requestId?: string;
  accountId?: string;
  username?: string;
  message: string;
  requiresVerification: boolean;
  errorCode?: 'ACCOUNT_NOT_FOUND' | 'ALREADY_DEACTIVATED' | 'PERMISSION_DENIED' | 'SYSTEM_ERROR';
}

/**
 * 渲染进程的账号服务
 */
export class RendererAccountService {
  /**
   * 请求账号注销
   */
  async requestAccountDeactivation(request: AccountDeactivationRequest): Promise<AccountDeactivationResult> {
    try {
      const result = await window.electronAPI.invoke(
        'account:request-deactivation',
        request
      );
      return result;
    } catch (error) {
      console.error('账号注销请求失败:', error);
      return {
        success: false,
        message: '账号注销请求失败',
        requiresVerification: false,
        errorCode: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * 管理员强制注销账号
   */
  async forceDeactivateAccount(
    accountId: string,
    adminId: string,
    reason: string
  ): Promise<AccountDeactivationResult> {
    try {
      const result = await window.electronAPI.invoke(
        'account:force-deactivation',
        { accountId, adminId, reason }
      );
      return result;
    } catch (error) {
      console.error('管理员强制注销失败:', error);
      return {
        success: false,
        message: '管理员强制注销失败',
        requiresVerification: false,
        errorCode: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * 获取账号信息
   */
  async getAccountInfo(accountId: string): Promise<{
    success: boolean;
    account?: any;
    message: string;
  }> {
    try {
      const result = await window.electronAPI.invoke(
        'account:get-info',
        accountId
      );
      return result;
    } catch (error) {
      console.error('获取账号信息失败:', error);
      return {
        success: false,
        message: '获取账号信息失败'
      };
    }
  }
}

// 导出单例实例
export const rendererAccountService = new RendererAccountService();
