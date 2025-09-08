/**
 * 事件调试工具
 * Event Debug Utility
 */

import { eventBus } from '@dailyuse/utils';
import { AUTH_EVENTS, publishUserLoggedInEvent } from '../../modules/authentication';

/**
 * 调试事件传递
 */
export function debugEventFlow() {
  console.log('🔍 [EventDebug] 开始调试事件传递');

  // 1. 注册一个原始监听器来查看事件数据
  const rawListener = (data: any) => {
    console.log('🔍 [EventDebug] 原始事件监听器收到数据:');
    console.log('  - 数据类型:', typeof data);
    console.log('  - 数据构造函数:', data?.constructor?.name);
    console.log('  - 数据键名:', data ? Object.keys(data) : null);
    console.log('  - 数据内容:', data);
    console.log('  - 是否有 accountUuid:', !!data?.accountUuid);
    console.log('  - accountUuid 值:', data?.accountUuid);
    console.log('  - 完整 JSON:', JSON.stringify(data, null, 2));
  };

  eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, rawListener);

  // 2. 发布一个测试事件
  const testPayload = {
    accountUuid: 'debug-test-uuid-123',
    username: 'debug_user',
    sessionUuid: 'debug-session-456',
    accessToken: 'debug-token',
    loginTime: new Date(),
  };

  console.log('🔍 [EventDebug] 发布测试事件，payload:');
  console.log('  - payload 类型:', typeof testPayload);
  console.log('  - payload 键名:', Object.keys(testPayload));
  console.log('  - payload 内容:', testPayload);
  console.log('  - payload JSON:', JSON.stringify(testPayload, null, 2));

  publishUserLoggedInEvent(testPayload);

  // 3. 测试直接使用 eventBus.send
  setTimeout(() => {
    console.log('🔍 [EventDebug] 测试直接使用 eventBus.send');
    eventBus.send(AUTH_EVENTS.USER_LOGGED_IN, testPayload);
  }, 1000);

  // 4. 清理监听器
  setTimeout(() => {
    eventBus.off(AUTH_EVENTS.USER_LOGGED_IN, rawListener);
    console.log('🔍 [EventDebug] 已清理测试监听器');
  }, 2000);
}

/**
 * 显示事件总线信息
 */
export function showEventBusInfo() {
  console.log('ℹ️ [EventDebug] EventBus 信息:');
  console.log('  - eventBus 类型:', typeof eventBus);
  console.log('  - eventBus 构造函数:', eventBus?.constructor?.name);
  console.log(
    '  - eventBus 方法:',
    eventBus ? Object.getOwnPropertyNames(Object.getPrototypeOf(eventBus)) : null,
  );
  console.log('  - send 方法类型:', typeof eventBus?.send);
  console.log('  - on 方法类型:', typeof eventBus?.on);
  console.log('  - eventBus 对象:', eventBus);
}

// 暴露到全局对象用于控制台调试
if (typeof window !== 'undefined') {
  (window as any).debugEventFlow = debugEventFlow;
  (window as any).showEventBusInfo = showEventBusInfo;
  console.log('🔍 [EventDebug] 调试工具已加载，在控制台运行:');
  console.log('  - debugEventFlow() 开始调试事件传递');
  console.log('  - showEventBusInfo() 显示事件总线信息');
}
