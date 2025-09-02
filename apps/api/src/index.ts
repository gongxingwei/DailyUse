import app from './app';
import { connectPrisma, disconnectPrisma } from './config/prisma';
import { initializeApp } from './shared/initialization/initializer';

const port = Number(process.env.PORT ?? 3000);

(async () => {
  try {
    await connectPrisma();
    await initializeApp();
    app.listen(port, () => {
      console.log(`[api] listening on http://localhost:${port}`);
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
