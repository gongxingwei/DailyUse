import { authenticationEventRequester } from '../events/EventRequester';
import { AccountContracts } from '@dailyuse/contracts';

type IAccountCore = AccountContracts.IAccountCore;

/**
 * 演示如何使用新的 EventEmitter 请求-响应模式的认证服务
 */
export class AuthenticationServiceEventDemo {
  /**
   * 用户登录示例 - 使用 EventEmitter invoke/handle 模式
   * @param username 用户名
   * @param password 密码
   */
  async loginUser(
    username: string,
    password: string,
  ): Promise<{ success: boolean; account?: IAccountCore; message: string }> {
    try {
      console.log(`🔐 [AuthenticationServiceEventDemo] 开始登录流程 - 用户名: ${username}`);

      // 1. 通过用户名获取账户信息（使用新的 EventEmitter 模式）
      const account = await authenticationEventRequester.getAccountByUsername(username);

      if (!account) {
        return {
          success: false,
          message: '用户不存在',
        };
      }

      console.log(`👤 [AuthenticationServiceEventDemo] 找到账户: ${account.uuid}`);

      // 2. 验证账户状态（使用新的 EventEmitter 模式）
      const statusCheck = await authenticationEventRequester.verifyAccountStatus(account.uuid);

      if (!statusCheck.isValid) {
        return {
          success: false,
          message: `账户状态异常: ${statusCheck.status}`,
        };
      }

      console.log(`✅ [AuthenticationServiceEventDemo] 账户状态正常: ${statusCheck.status}`);

      // 3. 这里可以添加密码验证逻辑
      // const isPasswordValid = await this.verifyPassword(password, account.passwordHash);

      return {
        success: true,
        account,
        message: '登录成功',
      };
    } catch (error) {
      console.error(`❌ [AuthenticationServiceEventDemo] 登录失败:`, error);
      return {
        success: false,
        message: '登录过程中发生错误',
      };
    }
  }

  /**
   * 获取用户详细信息示例
   * @param accountUuid 账户UUID
   */
  async getUserDetails(accountUuid: string): Promise<IAccountCore | null> {
    try {
      console.log(`🔍 [AuthenticationServiceEventDemo] 获取用户详细信息 - UUID: ${accountUuid}`);

      // 使用新的 EventEmitter 模式获取账户信息
      const account = await authenticationEventRequester.getAccountByUuid(accountUuid);

      if (account) {
        console.log(`✅ [AuthenticationServiceEventDemo] 成功获取用户信息: ${account.username}`);
      } else {
        console.log(`❌ [AuthenticationServiceEventDemo] 用户不存在: ${accountUuid}`);
      }

      return account;
    } catch (error) {
      console.error(`❌ [AuthenticationServiceEventDemo] 获取用户详细信息失败:`, error);
      return null;
    }
  }
}

/**
 * 全局演示服务实例
 */
export const authenticationServiceEventDemo = new AuthenticationServiceEventDemo();
