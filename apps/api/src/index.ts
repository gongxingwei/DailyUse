import app from './app';
import { connectPrisma, disconnectPrisma, prisma } from './config/prisma';
import { initializeApp } from './shared/initialization/initializer';
import { ScheduleTaskScheduler } from './modules/schedule/infrastructure/scheduler/ScheduleTaskScheduler';
import { sseController } from './modules/schedule/interface/http/SSEController';
import { registerEventHandlers } from './shared/events/eventHandlerRegistry';
import { eventBus } from '@dailyuse/utils';
import { initializeLogger, getStartupInfo } from './config/logger.config';
import { createLogger } from '@dailyuse/utils';

// 初始化日志系统
initializeLogger();
const logger = createLogger('API');

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

    // 启动调度器
    const scheduler = ScheduleTaskScheduler.getInstance(prisma, eventBus);
    scheduler.start();
    logger.info('Schedule task scheduler started');

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
