import { eventBus } from './packages/utils/src/domain/eventBus';

/**
 * 跨平台事件系统测试
 * 可在 Node.js 和浏览器环境中运行
 */
async function testCrossPlatformEventSystem() {
  console.log('🧪 开始跨平台事件系统测试...\n');

  // 检测运行环境
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  console.log(`🌍 运行环境: ${isNode ? 'Node.js' : isBrowser ? 'Browser' : 'Unknown'}`);
  console.log('');

  // ===================== 测试单向通信 =====================
  console.log('📤 测试单向通信 (send/on)');

  eventBus.on('test.crossplatform', (payload) => {
    console.log(`  收到跨平台消息: ${payload.message} (运行环境: ${payload.env})`);
  });

  eventBus.send('test.crossplatform', {
    message: 'Hello from cross-platform event system!',
    env: isNode ? 'Node.js' : 'Browser',
  });

  console.log('');

  // ===================== 测试双向通信 =====================
  console.log('📨 测试双向通信 (invoke/handle)');

  // 注册环境检测处理器
  eventBus.handle('system.env.detect', async () => {
    return {
      isNode,
      isBrowser,
      platform: isNode ? process.platform : 'browser',
      userAgent: isBrowser ? navigator.userAgent.substring(0, 50) + '...' : 'N/A',
      timestamp: new Date().toISOString(),
    };
  });

  try {
    const envInfo = await eventBus.invoke('system.env.detect');
    console.log('  环境信息:', envInfo);
  } catch (error) {
    console.error('  获取环境信息失败:', error);
  }

  console.log('');

  // ===================== 测试UUID生成 =====================
  console.log('🆔 测试UUID生成');

  eventBus.handle('test.uuid.generate', async (payload: { count: number }) => {
    const uuids = [];
    for (let i = 0; i < payload.count; i++) {
      // 通过创建事件来测试UUID生成
      const event = eventBus.createEvent
        ? eventBus.createEvent('test.uuid', { index: i })
        : { eventType: 'test.uuid', aggregateId: `uuid-${i}`, payload: { index: i } };
      uuids.push(event.aggregateId);
    }
    return { uuids, count: uuids.length };
  });

  try {
    const uuidResult = await eventBus.invoke('test.uuid.generate', { count: 3 });
    console.log('  生成的UUID:', uuidResult.uuids);
  } catch (error) {
    console.error('  UUID生成失败:', error);
  }

  console.log('');

  // ===================== 测试统计信息 =====================
  console.log('📊 系统统计信息');
  const stats = eventBus.getStats();
  console.log(`  处理器数量: ${stats.handlersCount}`);
  console.log(`  监听器数量: ${stats.listenersCount}`);
  console.log(`  待处理请求: ${stats.pendingRequestsCount}`);
  console.log(`  注册的处理器: ${stats.registeredHandlers.join(', ')}`);

  console.log('\n✅ 跨平台事件系统测试完成!');
}

// 运行测试
testCrossPlatformEventSystem().catch(console.error);
