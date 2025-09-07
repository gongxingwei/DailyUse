import { eventBus } from '@dailyuse/utils';
import { UserLoggedInEvent } from '@renderer/modules/Authentication/domain/events/authenticationEvents';
// services
import { accountLoggedService } from '@renderer/modules/Account/application/services/accountLoggedService';
export class AccountEventHandlers {
  /**
   * 注册Account模块内部事件处理器
   */
  static registerHandlers(): void {
    // 账户登录事件，监听 Authentication 模块发送的 UserLoggedIn 事件，接收 accountUuid，来向主进程获取完整账户信息
    eventBus.subscribe<UserLoggedInEvent>('UserLoggedIn', async (event) => {
      console.log('Account模块处理账户登录事件事件:', event);
      await accountLoggedService.initAccountInfo(event.payload.accountUuid)
      .then(async (response) => {
        if (response.success) {
          console.log('成功处理 UserLoggedIn 事件');
        } else {
          console.log('UserLoggedIn 事件失败');
        }
      })
    });

    // 账户更新事件 - 监听
  }
}
