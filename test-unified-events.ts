import { eventBus } from './packages/utils/src/domain/eventBus';
import { UnifiedEventBus } from './packages/utils/src/domain/UnifiedEventBus';

/**
 * 统一事件系统测试
 */
async function testUnifiedEventSystem() {
  console.log('🧪 开始统一事件系统测试...\n');

  // ===================== 测试单向通信 (send/on) =====================
  console.log('📤 测试单向通信 (send/on)');

  // 订阅测试事件
  eventBus.on('test.message', (payload) => {
    console.log(`  收到消息: ${payload.message}`);
  });

  // 发送测试事件
  eventBus.send('test.message', { message: 'Hello from unified event system!' });

  console.log('');

  // ===================== 测试双向通信 (invoke/handle) =====================
  console.log('📨 测试双向通信 (invoke/handle)');

  // 注册请求处理器
  eventBus.handle('math.add', async (payload: { a: number; b: number }) => {
    console.log(`  处理加法请求: ${payload.a} + ${payload.b}`);
    return payload.a + payload.b;
  });

  // 发送请求
  try {
    const result = await eventBus.invoke<number>('math.add', { a: 10, b: 20 });
    console.log(`  收到结果: ${result}`);
  } catch (error) {
    console.error(`  请求失败:`, error);
  }

  console.log('');

  // ===================== 测试错误处理 =====================
  console.log('❌ 测试错误处理');

  // 注册会抛出错误的处理器
  eventBus.handle('test.error', async () => {
    throw new Error('故意抛出的测试错误');
  });

  try {
    await eventBus.invoke('test.error');
  } catch (error) {
    console.log(`  成功捕获错误: ${error instanceof Error ? error.message : error}`);
  }

  console.log('');

  // ===================== 测试超时 =====================
  console.log('⏰ 测试请求超时');

  // 注册会超时的处理器（不响应）
  eventBus.handle('test.timeout', async () => {
    console.log('  处理器收到请求但不响应...');
    // 不返回任何内容，导致超时
    await new Promise(() => {}); // 永远不resolve
  });

  try {
    await eventBus.invoke('test.timeout', null, { timeout: 2000 });
  } catch (error) {
    console.log(`  成功检测到超时: ${error instanceof Error ? error.message : error}`);
  }

  console.log('');

  // ===================== 测试统计信息 =====================
  console.log('📊 系统统计信息');
  const stats = eventBus.getStats();
  console.log(`  处理器数量: ${stats.handlersCount}`);
  console.log(`  监听器数量: ${stats.listenersCount}`);
  console.log(`  待处理请求: ${stats.pendingRequestsCount}`);
  console.log(`  注册的处理器: ${stats.registeredHandlers.join(', ')}`);
  console.log(
    `  监听的事件: ${stats.registeredEvents.slice(0, 5).join(', ')}${stats.registeredEvents.length > 5 ? '...' : ''}`,
  );

  console.log('');

  // ===================== 测试兼容性接口 =====================
  console.log('🔄 测试向后兼容接口');

  // 使用旧的 subscribe 方法
  eventBus.subscribeEvent('legacy.test', async (event) => {
    console.log(`  收到兼容事件: ${event.eventType}`);
  });

  // 使用旧的 publishMany 方法
  await eventBus.publishMany([
    {
      aggregateId: 'test-1',
      eventType: 'legacy.test',
      occurredOn: new Date(),
      payload: { message: 'Legacy event 1' },
    },
  ]);

  console.log('\n✅ 统一事件系统测试完成!');
}

// 运行测试
testUnifiedEventSystem().catch(console.error);
