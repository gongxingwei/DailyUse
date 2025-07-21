import { IAccountRepository } from "../../domain/repositories/accountRepository";
import { 
  AccountDeactivationVerificationRequestedEvent,
  AccountDeactivationConfirmedEvent
} from "../../../Authentication/domain/events/authenticationEvents";
import { eventBus } from "../../../../shared/events/eventBus";
import { generateUUID } from "@/shared/utils/uuid";

/**
 * 账号注销请求数据
 */
export interface AccountDeactivationRequest {
  accountUuid: string;
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
  accountUuid?: string;
  username?: string;
  message: string;
  requiresVerification: boolean;
  errorCode?: 'ACCOUNT_NOT_FOUND' | 'ALREADY_DEACTIVATED' | 'PERMISSION_DENIED' | 'SYSTEM_ERROR';
}

/**
 * Account 模块的账号注销服务
 */
export class AccountDeactivationService {
  private pendingDeactivationRequests = new Map<string, {
    request: AccountDeactivationRequest;
    resolve: (result: AccountDeactivationResult) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
    timestamp: Date;
  }>();

  constructor(
    private accountRepository: IAccountRepository
  ) {
    this.setupEventListeners();
  }

  /**
   * 处理账号注销请求
   */
  async requestAccountDeactivation(request: AccountDeactivationRequest): Promise<AccountDeactivationResult> {
    const { accountUuid, username, requestedBy, reason, clientInfo } = request;

    try {
      // 1. 验证账号是否存在
      const account = await this.accountRepository.findById(accountUuid);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          requiresVerification: false,
          errorCode: 'ACCOUNT_NOT_FOUND'
        };
      }

      // 2. 检查账号是否已经被注销
      if (account.status === 'disabled') {
        return {
          success: false,
          accountUuid,
          username: account.username,
          message: '账号已经被注销',
          requiresVerification: false,
          errorCode: 'ALREADY_DEACTIVATED'
        };
      }

      // 3. 权限检查（用户只能注销自己的账号）
      if (requestedBy === 'user' && accountUuid !== account.uuid) {
        return {
          success: false,
          message: '没有权限注销此账号',
          requiresVerification: false,
          errorCode: 'PERMISSION_DENIED'
        };
      }

      // 4. 生成验证请求ID
      const requestId = generateUUID();

      // 5. 发布账号注销验证请求事件
      const verificationEvent: AccountDeactivationVerificationRequestedEvent = {
        aggregateId: accountUuid,
        eventType: 'AccountDeactivationVerificationRequested',
        occurredOn: new Date(),
        payload: {
          accountUuid,
          username: account.username,
          requestId,
          requestedBy,
          reason,
          requestedAt: new Date(),
          clientInfo
        }
      };

      // 6. 等待Authentication模块的验证响应
      const verificationResult = await this.waitForVerificationResponse(requestId, request);

      return verificationResult;

    } catch (error) {
      console.error('账号注销请求处理失败:', error);
      return {
        success: false,
        accountUuid,
        username,
        message: '账号注销请求处理失败',
        requiresVerification: false,
        errorCode: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * 等待Authentication模块的验证响应
   */
  private waitForVerificationResponse(
    requestId: string, 
    request: AccountDeactivationRequest
  ): Promise<AccountDeactivationResult> {
    return new Promise((resolve, reject) => {
      // 设置30秒超时
      const timeout = setTimeout(() => {
        this.pendingDeactivationRequests.delete(requestId);
        resolve({
          success: false,
          requestId,
          accountUuid: request.accountUuid,
          message: '验证超时，请重试',
          requiresVerification: false,
          errorCode: 'SYSTEM_ERROR'
        });
      }, 30000);

      // 存储待处理的请求
      this.pendingDeactivationRequests.set(requestId, {
        request,
        resolve,
        reject,
        timeout,
        timestamp: new Date()
      });

      // 发布验证请求事件
      eventBus.publish<AccountDeactivationVerificationRequestedEvent>({
        aggregateId: request.accountUuid,
        eventType: 'AccountDeactivationVerificationRequested',
        occurredOn: new Date(),
        payload: {
          accountUuid: request.accountUuid,
          username: request.username || '',
          requestId,
          requestedBy: request.requestedBy,
          reason: request.reason,
          requestedAt: new Date(),
          clientInfo: request.clientInfo
        }
      });
    });
  }

  /**
   * 处理账号注销确认事件
   */
  private async handleAccountDeactivationConfirmed(event: AccountDeactivationConfirmedEvent): Promise<void> {
    const { accountUuid, username, deactivatedBy, reason, deactivatedAt } = event.payload;

    try {
      // 1. 查找账号
      const account = await this.accountRepository.findById(accountUuid);
      if (!account) {
        console.error('账号注销确认处理失败: 账号不存在', accountUuid);
        return;
      }

      // 2. 执行账号注销（设置为禁用状态）
      account.disable();

      // 3. 保存账号状态更改
      await this.accountRepository.save(account);

      console.log('✅ [AccountDeactivation] 账号注销完成:', {
        accountUuid,
        username,
        deactivatedBy,
        reason,
        deactivatedAt
      });

    } catch (error) {
      console.error('❌ [AccountDeactivation] 账号注销确认处理失败:', error);
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听账号注销确认事件
    eventBus.subscribe<AccountDeactivationConfirmedEvent>(
      'AccountDeactivationConfirmed',
      this.handleAccountDeactivationConfirmed.bind(this)
    );

    console.log('✅ [AccountDeactivation] Event listeners setup completed');
  }

  /**
   * 管理员强制注销账号
   */
  async forceDeactivateAccount(
    accountUuid: string, 
    adminId: string, 
    reason: string
  ): Promise<AccountDeactivationResult> {
    return await this.requestAccountDeactivation({
      accountUuid,
      requestedBy: 'admin',
      reason: `管理员强制注销: ${reason} (操作员: ${adminId})`,
      clientInfo: {
        userAgent: `Admin: ${adminId}`,
        deviceId: `admin-${adminId}`
      }
    });
  }

  /**
   * 系统自动注销账号（如违规行为）
   */
  async systemDeactivateAccount(
    accountUuid: string, 
    reason: string
  ): Promise<AccountDeactivationResult> {
    return await this.requestAccountDeactivation({
      accountUuid,
      requestedBy: 'system',
      reason: `系统自动注销: ${reason}`,
      clientInfo: {
        userAgent: 'System',
        deviceId: 'system-auto'
      }
    });
  }

  /**
   * 清理过期的验证请求
   */
  private cleanupExpiredRequests(): void {
    const now = new Date();
    const expiredThreshold = 5 * 60 * 1000; // 5分钟

    for (const [requestId, pendingRequest] of this.pendingDeactivationRequests.entries()) {
      if (now.getTime() - pendingRequest.timestamp.getTime() > expiredThreshold) {
        clearTimeout(pendingRequest.timeout);
        this.pendingDeactivationRequests.delete(requestId);
      }
    }
  }

  /**
   * 销毁服务，清理资源
   */
  destroy(): void {
    // 清理所有待处理的请求
    for (const [, pendingRequest] of this.pendingDeactivationRequests.entries()) {
      clearTimeout(pendingRequest.timeout);
    }
    this.pendingDeactivationRequests.clear();

    console.log('🧹 [AccountDeactivation] Service destroyed');
  }
}
