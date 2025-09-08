/**
 * 事件系统测试用例
 * Event System Test Cases
 *
 * 用于测试跨模块事件通信是否正常工作
 */

import { eventBus } from '@dailyuse/utils';
import {
  publishUserLoggedInEvent,
  AUTH_EVENTS,
  type UserLoggedInEventPayload,
} from '../../modules/authentication';
import { AccountEventHandlers } from '../../modules/account';
import { AppInitializationManager } from '../initialization/AppInitializationManager';

/**
 * 测试事件系统
 */
export class EventSystemTester {
  /**
   * 测试用户登录事件流程
   */
  static async testLoginEventFlow(): Promise<void> {
    console.log('🧪 [EventSystemTester] 开始测试用户登录事件流程');

    try {
      // 1. 确保应用已经初始化
      if (!AppInitializationManager.isInitialized()) {
        console.log('🔄 [EventSystemTester] 初始化应用...');
        await AppInitializationManager.initializeApp();
      }

      // 2. 模拟登录成功的数据
      const mockLoginData: UserLoggedInEventPayload = {
        accountUuid: 'test-account-uuid-123',
        username: 'testuser',
        sessionUuid: 'test-session-uuid-456',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        loginTime: new Date(),
      };

      // 3. 发布登录成功事件
      publishUserLoggedInEvent(mockLoginData);
      console.log('📤 [EventSystemTester] 登录事件已发布');

      // 4. 模拟用户会话初始化
      await AppInitializationManager.initializeUserSession(mockLoginData.accountUuid);
      console.log('🎯 [EventSystemTester] 用户会话初始化完成');

      // 5. 等待一段时间让事件处理完成
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('✅ [EventSystemTester] 用户登录事件流程测试完成');
    } catch (error) {
      console.error('❌ [EventSystemTester] 用户登录事件流程测试失败', error);
      throw error;
    }
  }

  /**
   * 测试事件总线基本功能
   */
  static async testEventBusBasics(): Promise<void> {
    console.log('🧪 [EventSystemTester] 开始测试事件总线基本功能');

    try {
      // 测试计数器
      let eventReceived = false;
      const testEventType = 'test:basic-event';
      const testPayload = { message: 'Hello Event Bus!', timestamp: Date.now() };

      // 注册监听器
      const testListener = (payload: any) => {
        console.log('📥 [EventSystemTester] 收到测试事件:', payload);
        eventReceived = true;
      };

      eventBus.on(testEventType, testListener);

      // 发送测试事件
      eventBus.send(testEventType, testPayload);

      // 等待事件处理
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 验证结果
      if (eventReceived) {
        console.log('✅ [EventSystemTester] 事件总线基本功能测试通过');
      } else {
        throw new Error('事件未能正确接收');
      }

      // 清理监听器
      eventBus.off(testEventType, testListener);
    } catch (error) {
      console.error('❌ [EventSystemTester] 事件总线基本功能测试失败', error);
      throw error;
    }
  }

  /**
   * 测试双向通信功能
   */
  static async testRequestResponsePattern(): Promise<void> {
    console.log('🧪 [EventSystemTester] 开始测试双向通信功能');

    try {
      const requestType = 'test:get-user-info';
      const mockUserInfo = {
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      // 注册请求处理器
      eventBus.handle(requestType, async (payload: { userId: string }) => {
        console.log('📥 [EventSystemTester] 处理获取用户信息请求:', payload);

        // 模拟异步处理
        await new Promise((resolve) => setTimeout(resolve, 100));

        return mockUserInfo;
      });

      // 发送请求
      const response = await eventBus.invoke(requestType, { userId: 'test-user-123' });
      console.log('📤 [EventSystemTester] 收到响应:', response);

      // 验证响应
      if (response && response.id === mockUserInfo.id) {
        console.log('✅ [EventSystemTester] 双向通信功能测试通过');
      } else {
        throw new Error('响应数据不匹配');
      }

      // 清理处理器
      eventBus.removeHandler(requestType);
    } catch (error) {
      console.error('❌ [EventSystemTester] 双向通信功能测试失败', error);
      throw error;
    }
  }

  /**
   * 运行所有测试
   */
  static async runAllTests(): Promise<void> {
    console.log('🚀 [EventSystemTester] 开始运行所有事件系统测试');

    try {
      await EventSystemTester.testEventBusBasics();
      await EventSystemTester.testRequestResponsePattern();
      await EventSystemTester.testLoginEventFlow();

      console.log('🎉 [EventSystemTester] 所有测试通过！');
    } catch (error) {
      console.error('💥 [EventSystemTester] 测试失败', error);
      throw error;
    }
  }

  /**
   * 获取事件总线统计信息
   */
  static getEventBusStats(): any {
    const stats = eventBus.getStats();
    console.log('📊 [EventSystemTester] 事件总线统计信息:', stats);
    return stats;
  }

  /**
   * 获取初始化管理器状态
   */
  static getInitializationManagerStatus(): any {
    const manager = AppInitializationManager.getManager();
    const allTasks = AppInitializationManager.listAllTasks();

    const status = {
      isAppInitialized: AppInitializationManager.isInitialized(),
      totalTasks: allTasks.length,
      tasksByPhase: allTasks.reduce(
        (acc, task) => {
          acc[task.phase] = (acc[task.phase] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      completedTasks: allTasks
        .filter((task) => AppInitializationManager.isTaskCompleted(task.name))
        .map((task) => task.name),
      runningTasks: allTasks
        .filter((task) => manager.isTaskRunning(task.name))
        .map((task) => task.name),
      allTaskNames: allTasks.map((task) => task.name),
    };

    console.log('🔧 [EventSystemTester] 初始化管理器状态:', status);
    return status;
  }
}

// 开发环境下自动运行测试（可选）
if (import.meta.env.DEV) {
  // 延迟运行测试，确保应用初始化完成
  setTimeout(() => {
    EventSystemTester.runAllTests().catch(console.error);
  }, 2000);
}
