import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { registerAccountEventHandlers } from '../../modules/account';
import { initializeAuthenticationEventHandlers } from '../../modules/authentication/application/events/EventHandler';
import { eventBus } from '@dailyuse/utils';

/**
 * 初始化所有模块的统一事件处理器
 * @description 统一管理所有模块的事件处理器注册
 */
export async function initializeUnifiedEventHandlers(): Promise<void> {
  console.log('🚀 [EventSystem] 初始化统一事件处理系统...');

  try {
    // ===================== 账户模块 =====================
    console.log('📦 [EventSystem] 注册账户模块事件处理器...');
    registerAccountEventHandlers();

    // ===================== 认证模块 =====================
    console.log('🔐 [EventSystem] 注册认证模块事件处理器...');
    initializeAuthenticationEventHandlers();

    // ===================== 其他模块 =====================
    // 这里可以添加其他模块的事件处理器注册
    // 例如：
    // await registerNotificationEventHandlers();
    // await registerTaskEventHandlers();
    // await registerGoalEventHandlers();

    // ===================== 系统级事件处理器 =====================
    registerSystemEventHandlers();

    console.log('✅ [EventSystem] 统一事件处理系统初始化完成');

    // 输出系统统计信息
    const stats = eventBus.getStats();
    console.log(`📊 [EventSystem] 系统统计:`, {
      处理器数量: stats.handlersCount,
      监听器数量: stats.listenersCount,
      注册的处理器: stats.registeredHandlers.slice(0, 10), // 只显示前10个
      监听的事件: stats.registeredEvents.slice(0, 10), // 只显示前10个
    });
  } catch (error) {
    console.error('❌ [EventSystem] 统一事件处理系统初始化失败:', error);
    throw error;
  }
}

/**
 * 注册系统级事件处理器
 */
function registerSystemEventHandlers(): void {
  console.log('🔧 [EventSystem] 注册系统级事件处理器...');

  // ===================== 系统通知事件 =====================

  // 处理系统启动事件
  eventBus.on('system.startup', (payload) => {
    console.log('🚀 [System] 系统启动事件:', payload);
  });

  // 处理系统关闭事件
  eventBus.on('system.shutdown', (payload) => {
    console.log('⛔ [System] 系统关闭事件:', payload);
  });

  // 处理错误事件
  eventBus.on('system.error', (payload) => {
    console.error('❌ [System] 系统错误事件:', payload);
  });

  // ===================== 跨模块通信事件 =====================

  // 处理账户创建通知事件
  eventBus.on('notification.account.created', (payload) => {
    console.log('📢 [System] 账户创建通知:', payload);
    // 这里可以处理跨模块的通知逻辑
    // 如发送邮件、更新缓存、记录审计日志等
  });

  // 处理数据同步事件
  eventBus.on('data.sync.required', (payload) => {
    console.log('🔄 [System] 数据同步事件:', payload);
    // 处理数据同步逻辑
  });

  // ===================== 系统监控和健康检查 =====================

  // 定期健康检查
  setInterval(async () => {
    try {
      const healthStatus = await eventBus.healthCheck();
      if (healthStatus.status !== 'healthy') {
        console.warn('⚠️ [System] 事件系统健康检查异常:', healthStatus);
      }
    } catch (error) {
      console.error('❌ [System] 健康检查失败:', error);
    }
  }, 30000); // 每30秒检查一次

  console.log('✅ [EventSystem] 系统级事件处理器注册完成');
}

/**
 * 优雅关闭事件系统
 */
export async function shutdownEventSystem(): Promise<void> {
  console.log('⏹️ [EventSystem] 开始关闭事件处理系统...');

  try {
    // 发送系统关闭事件
    eventBus.send('system.shutdown', {
      timestamp: new Date(),
      reason: 'graceful_shutdown',
    });

    // 等待一段时间让事件处理完成
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 清理事件总线资源
    eventBus.destroy();

    console.log('✅ [EventSystem] 事件处理系统已安全关闭');
  } catch (error) {
    console.error('❌ [EventSystem] 关闭事件处理系统时发生错误:', error);
  }
}

/**
 * 事件系统状态监控
 */
export function getEventSystemStatus() {
  const stats = eventBus.getEnhancedStats();

  return {
    健康状态: stats.pendingRequestsCount < 100 ? '正常' : '警告',
    处理器数量: stats.handlersCount,
    监听器数量: stats.listenersCount,
    待处理请求: stats.pendingRequestsCount,
    运行时间: Math.floor(stats.uptime / 3600) + ' 小时',
    内存使用: Math.round(stats.memoryUsage.heapUsed / 1024 / 1024) + ' MB',
    注册的处理器: stats.registeredHandlers,
    监听的事件: stats.registeredEvents,
  };
}
