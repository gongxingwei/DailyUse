import app from './app';
import { connectPrisma, disconnectPrisma, prisma } from './config/prisma';
import { initializeApp } from './shared/initialization/initializer';
import { ScheduleTaskScheduler } from './modules/schedule/infrastructure/scheduler/ScheduleTaskScheduler';
import { PriorityQueueScheduler } from './modules/schedule/infrastructure/scheduler/PriorityQueueScheduler';
import { sseController } from './modules/schedule/interface/http/SSEController';
import { registerEventHandlers } from './shared/events/eventHandlerRegistry';
import { eventBus } from '@dailyuse/utils';
import { initializeLogger, getStartupInfo } from './config/logger.config';
import { createLogger } from '@dailyuse/utils';

// 初始化日志系统
initializeLogger();
const logger = createLogger('API');

// 调度器配置：可通过环境变量切换
// USE_PRIORITY_QUEUE_SCHEDULER=true 启用优先队列调度器（推荐）
// USE_PRIORITY_QUEUE_SCHEDULER=false 使用传统轮询调度器
const USE_PRIORITY_QUEUE_SCHEDULER = process.env.USE_PRIORITY_QUEUE_SCHEDULER !== 'false'; // 默认启用

const PORT = process.env.PORT || 3888;

(async () => {
  try {
    logger.info('Starting DailyUse API server...', getStartupInfo());

    await connectPrisma();
    logger.info('Database connected successfully');

    await initializeApp();
    logger.info('Application initialized successfully');

    // 🎯 注册事件处理器（事件驱动架构）
    registerEventHandlers(prisma, sseController);
    logger.info('Event handlers registered successfully');

    // 启动调度器（优先队列 vs 轮询）
    if (USE_PRIORITY_QUEUE_SCHEDULER) {
      const scheduler = PriorityQueueScheduler.getInstance(prisma, eventBus);
      await scheduler.start();
      logger.info('✅ 优先队列调度器已启动', {
        type: 'PriorityQueue',
        mechanism: 'setTimeout',
        precision: '<100ms',
        status: scheduler.getStatus(),
      });
    } else {
      const scheduler = ScheduleTaskScheduler.getInstance(prisma, eventBus);
      scheduler.start();
      logger.info('⚠️  传统轮询调度器已启动（不推荐）', {
        type: 'Polling',
        mechanism: 'cron',
        precision: '0-60s',
      });
    }

    app.listen(PORT, () => {
      logger.info(`API server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal, shutting down gracefully...');
  await disconnectPrisma();
  logger.info('Database disconnected');
  process.exit(0);
});
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, shutting down gracefully...');
  await disconnectPrisma();
  logger.info('Database disconnected');
  process.exit(0);
});
