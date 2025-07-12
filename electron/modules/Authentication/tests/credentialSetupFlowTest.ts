import { AccountRegisteredEvent } from "../../Account/domain/events/accountEvents";
import { eventBus } from "../../../shared/services/eventBus";

/**
 * 认证凭证设置流程测试脚本
 * 演示当 Account 注册事件触发时，Authentication 模块如何通过 IPC 请求用户设置密码
 */
export class CredentialSetupFlowTest {
  
  /**
   * 模拟账号注册事件，测试认证凭证设置流程
   */
  static async simulateAccountRegistrationFlow(): Promise<void> {
    console.log('🔄 [Test] 开始模拟账号注册流程');

    try {
      // 1. 模拟创建一个账号注册事件
      const testEvent: AccountRegisteredEvent = {
        eventType: 'AccountRegistered',
        aggregateId: 'test-account-123',
        occurredOn: new Date(),
        payload: {
          accountId: 'test-account-123',
          username: 'testuser',
          email: 'test@example.com',
          accountType: 'regular',
          userId: 'test-user-123',
          userProfile: {
            firstName: 'Test',
            lastName: 'User',
            avatar: undefined,
            bio: 'Test user bio'
          },
          status: 'active',
          createdAt: new Date(),
          requiresAuthentication: true // 需要创建认证凭证
        }
      };

      console.log('📤 [Test] 发布账号注册事件:', testEvent.payload);

      // 2. 通过事件总线发布事件（这会触发 Authentication 模块的事件处理器）
      await eventBus.publish(testEvent);

      console.log('✅ [Test] 账号注册事件已发布，等待认证凭证设置...');
      console.log('📋 [Test] 接下来的流程:');
      console.log('   1. Authentication 模块收到事件');
      console.log('   2. 检查是否已存在认证凭证');
      console.log('   3. 向渲染进程发送 IPC 请求');
      console.log('   4. 渲染进程显示密码设置界面');
      console.log('   5. 用户输入密码后，渲染进程发送响应');
      console.log('   6. 主进程收到密码，创建认证凭证');
      console.log('   7. 通知渲染进程认证凭证创建结果');

    } catch (error) {
      console.error('❌ [Test] 模拟账号注册流程失败:', error);
    }
  }

  /**
   * 模拟用户取消认证凭证设置的情况
   */
  static async simulateUserCancelFlow(): Promise<void> {
    console.log('🔄 [Test] 开始模拟用户取消认证凭证设置流程');

    try {
      const testEvent: AccountRegisteredEvent = {
        eventType: 'AccountRegistered',
        aggregateId: 'test-account-cancel-123',
        occurredOn: new Date(),
        payload: {
          accountId: 'test-account-cancel-123',
          username: 'canceluser',
          email: 'cancel@example.com',
          accountType: 'regular',
          userId: 'test-user-cancel-123',
          userProfile: {
            firstName: 'Cancel',
            lastName: 'User',
            avatar: undefined,
            bio: 'User who will cancel setup'
          },
          status: 'active',
          createdAt: new Date(),
          requiresAuthentication: true
        }
      };

      await eventBus.publish(testEvent);

      console.log('✅ [Test] 用户取消场景事件已发布');
      console.log('📋 [Test] 预期流程: 用户会看到密码设置界面，然后点击取消按钮');

    } catch (error) {
      console.error('❌ [Test] 模拟用户取消流程失败:', error);
    }
  }

  /**
   * 模拟不需要认证的账号注册
   */
  static async simulateNoAuthRequiredFlow(): Promise<void> {
    console.log('🔄 [Test] 开始模拟无需认证的账号注册流程');

    try {
      const testEvent: AccountRegisteredEvent = {
        eventType: 'AccountRegistered',
        aggregateId: 'test-account-noauth-123',
        occurredOn: new Date(),
        payload: {
          accountId: 'test-account-noauth-123',
          username: 'noauthuser',
          email: 'noauth@example.com',
          accountType: 'guest',
          userId: 'test-user-noauth-123',
          userProfile: {
            firstName: 'NoAuth',
            lastName: 'User',
            avatar: undefined,
            bio: 'Guest user without authentication'
          },
          status: 'active',
          createdAt: new Date(),
          requiresAuthentication: false // 不需要认证凭证
        }
      };

      await eventBus.publish(testEvent);

      console.log('✅ [Test] 无需认证场景事件已发布');
      console.log('📋 [Test] 预期流程: Authentication 模块会跳过凭证创建');

    } catch (error) {
      console.error('❌ [Test] 模拟无需认证流程失败:', error);
    }
  }
}

/**
 * 导出测试函数供开发时使用
 */
export function runCredentialSetupTests(): void {
  console.log('🧪 [CredentialSetupTest] 开始运行认证凭证设置流程测试');
  
  // 可以在主进程的开发环境中调用这些测试函数
  // CredentialSetupFlowTest.simulateAccountRegistrationFlow();
  // CredentialSetupFlowTest.simulateUserCancelFlow();
  // CredentialSetupFlowTest.simulateNoAuthRequiredFlow();
}
