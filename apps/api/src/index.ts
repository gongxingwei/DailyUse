import app from './app';
import { connectPrisma, disconnectPrisma, prisma } from './config/prisma';
import { initializeApp } from './shared/initialization/initializer';
import { ScheduleTaskScheduler } from './modules/schedule/infrastructure/scheduler/ScheduleTaskScheduler';
import { eventBus } from '@dailyuse/utils';

const PORT = process.env.PORT || 3888;

(async () => {
  try {
    await connectPrisma();
    await initializeApp();

    // 启动调度器
    const scheduler = ScheduleTaskScheduler.getInstance(prisma, eventBus);
    scheduler.start();

    app.listen(PORT, () => {
      console.log(`[api] listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  await disconnectPrisma();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await disconnectPrisma();
  process.exit(0);
});
