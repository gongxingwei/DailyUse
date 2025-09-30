/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dailyuse/domain-core': path.resolve(__dirname, '../domain-core/src'),
      '@dailyuse/contracts': path.resolve(__dirname, '../contracts/src'),
      '@dailyuse/utils': path.resolve(__dirname, '../utils/src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom', // 客户端需要 DOM 环境
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache', 'src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', 'dist/'],
    },
    // 客户端测试超时设置
    testTimeout: 5000,
    // 允许并发测试
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },
});
