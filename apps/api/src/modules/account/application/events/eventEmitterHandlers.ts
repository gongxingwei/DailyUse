import { AccountApplicationService } from '../services/AccountApplicationService';
import { initializeAccountRequestHandlers } from '../handlers/AccountRequestHandlers';

/**
 * 使用 EventEmitter 模式注册账户模块的事件处理器
 */
export async function registerAccountRequestHandlers(): Promise<void> {
  console.log('[account:RequestHandlers] Registering EventEmitter request handlers...');

  try {
    // 获取账户应用服务实例
    const accountApplicationService = await AccountApplicationService.getInstance();

    // 初始化请求处理器
    const requestHandlers = initializeAccountRequestHandlers(accountApplicationService);

    console.log('✅ Account EventEmitter request handlers registered successfully');
  } catch (error) {
    console.error('❌ Failed to register account request handlers:', error);
    throw error;
  }
}
