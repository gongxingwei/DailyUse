import { AccountStatusVerificationRequestedEvent } from "../../../Authentication/domain/events/authenticationEvents";
import { AccountStatusVerificationResponseEvent } from "../../domain/events/accountEvents";
import { IAccountRepository } from "../../domain/repositories/accountRepository";
import { AccountStatus } from "../../domain/types/account";
import { eventBus } from "../../../../shared/events/eventBus";
import { MainAccountApplicationService } from "../services/mainAccountApplicationService";
/**
 * Account 模块的状态验证事件处理器
 * 负责处理来自 Authentication 模块的账号状态验证请求
 */
export class AccountStatusVerificationHandler {
  static registerHandlers(): void {
    const mainAccountApplicationService = MainAccountApplicationService.getMainAccountApplicationService();
    eventBus.subscribe<AccountStatusVerificationRequestedEvent>(
      'AccountStatusVerificationRequested',
      async (event: AccountStatusVerificationRequestedEvent) => {
        try {
      console.log('🔍 [Account] 处理账号状态验证请求:', event.payload.username);

      const { accountId, username, requestId } = event.payload;

      // 查找账号
      const response = await mainAccountApplicationService.getAccountIdByUsername(username);
      const account = response.data;
      let accountStatus: AccountStatusVerificationResponseEvent['payload']['accountStatus'];
      let isLoginAllowed = false;
      let statusMessage = '';

      if (!account) {
        // 账号不存在
        accountStatus = 'not_found';
        isLoginAllowed = false;
        statusMessage = '账号不存在';
        console.log('❌ [Account] 账号不存在:', accountId);
      } else {
        // 检查账号状态
        switch (account.status) {
          case AccountStatus.ACTIVE:
            accountStatus = 'active';
            isLoginAllowed = true;
            statusMessage = '账号状态正常';
            break;
          case AccountStatus.PENDING_VERIFICATION:
            accountStatus = 'inactive';
            isLoginAllowed = false;
            statusMessage = '账号待验证';
            break;
          case AccountStatus.DISABLED:
            accountStatus = 'inactive';
            isLoginAllowed = false;
            statusMessage = '账号已禁用';
            break;
          case AccountStatus.SUSPENDED:
            accountStatus = 'suspended';
            isLoginAllowed = false;
            statusMessage = '账号已被暂停';
            break;
          default:
            accountStatus = 'inactive';
            isLoginAllowed = false;
            statusMessage = '账号状态异常';
        }

        console.log('✓ [Account] 账号状态检查完成:', {
          accountId,
          username,
          status: accountStatus,
          loginAllowed: isLoginAllowed
        });
      }

      // 发布状态验证响应事件
      const responseEvent: AccountStatusVerificationResponseEvent = {
        eventType: 'AccountStatusVerificationResponse',
        aggregateId: accountId,
        occurredOn: new Date(),
        payload: {
          accountId,
          username,
          requestId,
          accountStatus,
          isLoginAllowed,
          statusMessage,
          verifiedAt: new Date()
        }
      };

      await eventBus.publish(responseEvent);
      console.log('📤 [Account] 已发送账号状态验证响应:', requestId);

    } catch (error) {
      console.error('❌ [Account] 处理账号状态验证请求失败:', error);
      
      // 发送错误响应
      const errorResponseEvent: AccountStatusVerificationResponseEvent = {
        eventType: 'AccountStatusVerificationResponse',
        aggregateId: event.payload.accountId,
        occurredOn: new Date(),
        payload: {
          accountId: event.payload.accountId,
          username: event.payload.username,
          requestId: event.payload.requestId,
          accountStatus: 'not_found',
          isLoginAllowed: false,
          statusMessage: '系统异常，无法验证账号状态',
          verifiedAt: new Date()
        }
      };

      await eventBus.publish(errorResponseEvent);
    }
      }
    )
  }

}
