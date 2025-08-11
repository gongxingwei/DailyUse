import { ISessionLoggingRepository } from '../../domain/repositories/sessionLoggingRepository';
import { SessionLog } from '../../domain/aggregates/sessionLog';
import { IPLocation } from '../../domain/valueObjects/ipLocation';
import { generateUUID } from '@/shared/utils/uuid';
import { sessionLoggingContainer } from '../../infrastructure/di/sessionLoggingContainer';
import {
  OperationType,
  OperationStatus,
  RiskLevel,
} from '@common/modules/sessionLog/types/sessionLog';
/**
 * SessionLogging 应用服务
 * 负责处理认证相关的会话日志记录逻辑
 */
export class SessionLoggingApplicationService {
  private static instance: SessionLoggingApplicationService;
  private sessionLoggingRepository: ISessionLoggingRepository;
  constructor() {
    this.sessionLoggingRepository = sessionLoggingContainer.getSessionLoggingRepository();
  }

  public static getSessionLoggingApplicationService(): SessionLoggingApplicationService {
    if (!SessionLoggingApplicationService.instance) {
      SessionLoggingApplicationService.instance = new SessionLoggingApplicationService();
    }
    return SessionLoggingApplicationService.instance;
  }

  /**
   * 处理登录尝试事件
   */
  async handleLoginAttemptEvent(event: any): Promise<void> {
    try {
      const { accountUuid, result, failureReason, clientInfo } = event.payload;

      const deviceInfo = clientInfo?.deviceId || 'unknown-device';
      const userAgent = clientInfo?.userAgent;
      const ipAddress = clientInfo?.ipAddress || 'unknown';

      const ipLocation = await IPLocation.fromIPAddress(ipAddress);
      const operationType = OperationType.LOGIN;

      let sessionLog: SessionLog;

      if (result === 'success') {
        sessionLog = new SessionLog({
          uuid: generateUUID(),
          accountUuid,
          operationType,
          operationStatus: OperationStatus.SUCCESS,
          deviceInfo,
          ipLocation,
          userAgent,
        });
      } else {
        sessionLog = new SessionLog({
          uuid: generateUUID(),
          accountUuid,
          operationType,
          operationStatus: OperationStatus.FAILURE,
          deviceInfo,
          ipLocation,
          userAgent,
        });

        sessionLog.addAuditTrail(
          OperationType.LOGIN,
          `登录失败: ${failureReason || 'Unknown reason'}`,
          RiskLevel.MEDIUM,
        );
      }
      await this.sessionLoggingRepository.save(sessionLog);
    } catch (error) {
      console.error('❌ [SessionLogging] 记录登录尝试日志失败:', error);
    }
  }

  /**
   * 处理凭证验证事件
   */
  async handleCredentialVerificationEvent(event: any): Promise<void> {
    try {
      const { accountUuid, verificationResult, failureReason, clientInfo } = event.payload;

      const deviceInfo = clientInfo?.deviceId || 'unknown-device';
      const userAgent = clientInfo?.userAgent;
      const ipAddress = clientInfo?.ipAddress || 'unknown';

      const ipLocation = await IPLocation.fromIPAddress(ipAddress);
      const operationType = OperationType.LOGIN;
      let sessionLog: SessionLog;

      if (verificationResult === 'success') {
        sessionLog = new SessionLog({
          uuid: generateUUID(),
          accountUuid,
          operationType,
          operationStatus: OperationStatus.SUCCESS,
          deviceInfo,
          ipLocation,
          userAgent,
        });
      } else {
        sessionLog = new SessionLog({
          uuid: generateUUID(),
          accountUuid,
          operationType,
          operationStatus: OperationStatus.FAILURE,
          deviceInfo,
          ipLocation,
          userAgent,
        });

        sessionLog.addAuditTrail(
          OperationType.LOGIN,
          `凭证验证失败: ${failureReason || 'Unknown reason'}`,
          RiskLevel.HIGH,
        );
      }
      await this.sessionLoggingRepository.save(sessionLog);
    } catch (error) {
      console.error('❌ [SessionLogging] 记录凭证验证日志失败:', error);
    }
  }

  /**
   * 处理用户登录成功事件
   */
  async handleUserLoggedInEvent(event: any): Promise<void> {
    try {
      const { accountUuid, sessionId, clientInfo } = event.payload;

      const deviceInfo = clientInfo?.deviceId || 'unknown-device';
      const userAgent = clientInfo?.userAgent;
      const ipAddress = clientInfo?.ipAddress || 'unknown';

      const ipLocation = await IPLocation.fromIPAddress(ipAddress);
      const operationType = OperationType.LOGIN;

      const sessionLog = new SessionLog({
        uuid: generateUUID(),
        accountUuid,
        sessionUuid: sessionId,
        operationType,
        operationStatus: OperationStatus.SUCCESS,
        deviceInfo,
        ipLocation,
        userAgent,
      });

      sessionLog.addAuditTrail(
        OperationType.LOGIN,
        `用户登录成功，会话ID: ${sessionId}`,
        RiskLevel.LOW,
      );

      await this.sessionLoggingRepository.save(sessionLog);
    } catch (error) {
      console.error('❌ [SessionLogging] 记录登录成功日志失败:', error);
    }
  }
}
