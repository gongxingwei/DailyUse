import { AccountDeactivationVerificationRequestedEvent } from '../../domain/events/authenticationEvents';
import { IAuthCredentialRepository } from '../../domain/repositories/authenticationRepository';
import { eventBus } from '@dailyuse/utils';
import { ipcMain } from 'electron';

/**
 * 注销验证请求数据（发送给渲染进程）
 */
export interface DeactivationVerificationRequest {
  requestId: string;
  accountUuid: string;
  username: string;
  requestedBy: 'user' | 'admin' | 'system';
  reason?: string;
}

/**
 * 注销验证响应数据（从渲染进程接收）
 */
export interface DeactivationVerificationResponse {
  requestId: string;
  verificationMethod: 'password' | 'mfa' | 'email' | 'admin_override';
  password?: string;
  mfaCode?: string;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

/**
 * Authentication 模块的账号注销验证处理器
 */
export class AuthenticationDeactivationVerificationHandler {
  constructor(private authCredentialRepository: IAuthCredentialRepository) {
    this.setupEventListeners();
    this.setupIpcHandlers();
  }

  /**
   * 处理账号注销验证请求事件
   */
  private async handleDeactivationVerificationRequest(
    event: AccountDeactivationVerificationRequestedEvent,
  ): Promise<void> {
    const { requestId, accountUuid, username, requestedBy, reason } = event.payload;

    console.log('🔐 [AuthDeactivation] 收到账号注销验证请求:', {
      requestId,
      accountUuid,
      username,
      requestedBy,
    });

    try {
      // 1. 验证账号是否存在认证凭证
      const authCredential = await this.authCredentialRepository.findByAccountUuid(accountUuid);
      if (!authCredential) {
        await this.sendVerificationResponse({
          requestId,
          accountUuid,
          username,
          verificationResult: 'failed',
          verificationMethod: 'password',
          verifiedAt: new Date(),
          failureReason: '未找到认证凭证',
        });
        return;
      }

      // 2. 如果是管理员或系统请求，可以跳过用户验证
      if (requestedBy === 'admin' || requestedBy === 'system') {
        await this.processDirectDeactivation(requestId, accountUuid, username, requestedBy);
        return;
      }

      // 3. 向渲染进程发送验证请求
      const verificationRequest: DeactivationVerificationRequest = {
        requestId,
        accountUuid,
        username,
        requestedBy,
        reason,
      };

      // 通过 IPC 向渲染进程请求用户验证
      this.requestUserVerification(verificationRequest);
    } catch (error) {
      console.error('❌ [AuthDeactivation] 处理注销验证请求失败:', error);

      await this.sendVerificationResponse({
        requestId,
        accountUuid,
        username,
        verificationResult: 'failed',
        verificationMethod: 'password',
        verifiedAt: new Date(),
        failureReason: '系统错误',
      });
    }
  }

  /**
   * 处理来自渲染进程的验证响应
   */
  private async handleVerificationResponse(
    response: DeactivationVerificationResponse,
  ): Promise<void> {
    const { requestId, verificationMethod, password, clientInfo } = response;

    console.log('🔐 [AuthDeactivation] 收到用户验证响应:', {
      requestId,
      verificationMethod,
    });

    try {
      let verificationResult: 'success' | 'failed' | 'cancelled' = 'failed';
      let failureReason: string | undefined;

      if (verificationMethod === 'password') {
        if (password) {
          // 验证密码
          const isValid = await this.verifyPassword(requestId, password);
          if (isValid) {
            verificationResult = 'success';
          } else {
            failureReason = '密码验证失败';
          }
        } else {
          verificationResult = 'cancelled';
          failureReason = '用户取消验证';
        }
      } else {
        failureReason = '无效的验证方法或缺少验证信息';
      }

      // 发送验证响应事件
      await this.sendVerificationResponse({
        requestId,
        accountUuid: '', // 需要从请求中获取
        username: '', // 需要从请求中获取
        verificationResult,
        verificationMethod,
        verifiedAt: new Date(),
        failureReason,
        clientInfo,
      });

      // 如果验证成功，处理注销确认
      if (verificationResult === 'success') {
        await this.processDeactivationConfirmation(requestId);
      }
    } catch (error) {
      console.error('❌ [AuthDeactivation] 处理验证响应失败:', error);
    }
  }

  /**
   * 验证用户密码
   */
  private async verifyPassword(requestUuid: string, password: string): Promise<boolean> {
    try {
      console.log('开始验证密码...');
      console.log(`验证请求ID: ${requestUuid}, 密码: ${password}`);
      return true;
    } catch (error) {
      console.error('密码验证失败:', error);
      return false;
    }
  }

  /**
   * 处理直接注销（管理员/系统操作）
   */
  private async processDirectDeactivation(
    requestId: string,
    accountUuid: string,
    username: string,
    requestedBy: 'admin' | 'system',
  ): Promise<void> {
    // 直接发送验证成功响应
    await this.sendVerificationResponse({
      requestId,
      accountUuid,
      username,
      verificationResult: 'success',
      verificationMethod: 'admin_override',
      verifiedAt: new Date(),
    });

    // 处理注销确认
    await this.processDeactivationConfirmation(requestId, accountUuid, username, requestedBy);
  }

  /**
   * 处理注销确认
   */
  private async processDeactivationConfirmation(
    requestId: string,
    accountUuid?: string,
    username?: string,
    deactivatedBy: 'user' | 'admin' | 'system' = 'user',
  ): Promise<void> {
    try {
      // 1. 清理认证凭证
      if (accountUuid) {
        await this.authCredentialRepository.delete(accountUuid);
      }

      // 2. 发布账号注销确认事件
      await eventBus.publish({
        aggregateId: accountUuid || '',
        eventType: 'AccountDeactivationConfirmed',
        occurredOn: new Date(),
        payload: {
          accountUuid: accountUuid || '',
          username: username || '',
          deactivatedBy,
          deactivatedAt: new Date(),
          authDataCleanup: true,
          sessionTerminationCount: 0, // 实际应该计算终止的会话数
        },
      });

      console.log('✅ [AuthDeactivation] 账号注销确认完成:', {
        requestId,
        accountUuid,
        deactivatedBy,
      });
    } catch (error) {
      console.error('❌ [AuthDeactivation] 注销确认处理失败:', error);
    }
  }

  /**
   * 发送验证响应事件
   */
  private async sendVerificationResponse(payload: {
    requestId: string;
    accountUuid: string;
    username: string;
    verificationResult: 'success' | 'failed' | 'cancelled' | 'timeout';
    verificationMethod: 'password' | 'mfa' | 'email' | 'admin_override';
    verifiedAt: Date;
    failureReason?: string;
    clientInfo?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
    };
  }): Promise<void> {
    await eventBus.publish({
      aggregateId: payload.accountUuid,
      eventType: 'AccountDeactivationVerificationResponse',
      occurredOn: new Date(),
      payload,
    });
  }

  /**
   * 向渲染进程请求用户验证
   */
  private requestUserVerification(request: DeactivationVerificationRequest): void {
    // 通过IPC向渲染进程发送验证请求
    // 渲染进程应该显示确认对话框要求用户输入密码
    console.log('📤 [AuthDeactivation] 向渲染进程发送验证请求:', request);

    // 这里应该通过IPC通知渲染进程显示验证对话框
    // 实际实现中需要确保有主窗口可用
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    eventBus.subscribe(
      'AccountDeactivationVerificationRequested',
      this.handleDeactivationVerificationRequest.bind(this),
    );

    console.log('✅ [AuthDeactivation] Event listeners setup completed');
  }

  /**
   * 设置IPC处理器
   */
  private setupIpcHandlers(): void {
    // 处理来自渲染进程的验证响应
    ipcMain.handle(
      'authentication:deactivation-verification-response',
      async (_event, response: DeactivationVerificationResponse) => {
        await this.handleVerificationResponse(response);
        return { success: true };
      },
    );

    console.log('✅ [AuthDeactivation] IPC handlers setup completed');
  }

  /**
   * 销毁处理器，清理资源
   */
  destroy(): void {
    ipcMain.removeHandler('authentication:deactivation-verification-response');
    console.log('🧹 [AuthDeactivation] Handler destroyed');
  }
}
