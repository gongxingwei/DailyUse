import { requestResponseEventBus } from '../../../../../../../common/shared/events';
import type { IAccountCore } from '@dailyuse/contracts';

/**
 * 认证模块的事件请求客户端
 * 使用 Node.js EventEmitter 的 invoke 模式
 */
export class AuthenticationEventClient {
  /**
   * 通过用户名获取账户信息
   * @param username 用户名
   * @returns Promise<IAccountCore | null>
   */
  async getAccountByUsername(username: string): Promise<IAccountCore | null> {
    try {
      console.log(`📤 [AuthenticationEventClient] 请求获取账户信息 - 用户名: ${username}`);

      const account = await requestResponseEventBus.invoke<IAccountCore | null>(
        'AccountInfoGetterByUsername',
        { username },
        { timeout: 5000 },
      );

      console.log(`📨 [AuthenticationEventClient] 收到账户信息响应:`, account?.uuid);
      return account;
    } catch (error) {
      console.error(`❌ [AuthenticationEventClient] 获取账户信息失败:`, error);
      return null;
    }
  }

  /**
   * 通过UUID获取账户信息
   * @param accountUuid 账户UUID
   * @returns Promise<IAccountCore | null>
   */
  async getAccountByUuid(accountUuid: string): Promise<IAccountCore | null> {
    try {
      console.log(`📤 [AuthenticationEventClient] 请求获取账户信息 - UUID: ${accountUuid}`);

      const account = await requestResponseEventBus.invoke<IAccountCore | null>(
        'AccountInfoGetterByUuid',
        { accountUuid },
        { timeout: 5000 },
      );

      console.log(`📨 [AuthenticationEventClient] 收到账户信息响应:`, account?.uuid);
      return account;
    } catch (error) {
      console.error(`❌ [AuthenticationEventClient] 获取账户信息失败:`, error);
      return null;
    }
  }

  /**
   * 验证账户状态
   * @param accountUuid 账户UUID
   * @returns Promise<{ isValid: boolean; status: string }>
   */
  async verifyAccountStatus(accountUuid: string): Promise<{ isValid: boolean; status: string }> {
    try {
      console.log(`📤 [AuthenticationEventClient] 请求验证账户状态 - UUID: ${accountUuid}`);

      const result = await requestResponseEventBus.invoke<{ isValid: boolean; status: string }>(
        'AccountStatusVerification',
        { accountUuid },
        { timeout: 5000 },
      );

      console.log(`📨 [AuthenticationEventClient] 收到状态验证响应:`, result);
      return result;
    } catch (error) {
      console.error(`❌ [AuthenticationEventClient] 验证账户状态失败:`, error);
      return { isValid: false, status: 'error' };
    }
  }
}

/**
 * 全局认证事件客户端实例
 */
export const authenticationEventClient = new AuthenticationEventClient();
