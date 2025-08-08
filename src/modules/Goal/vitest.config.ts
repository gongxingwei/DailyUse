import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Goal 模块专用测试配置
    name: 'goal-module-tests',
    include: ['src/modules/Goal/**/*.test.{ts,js}', 'src/modules/Goal/**/*.spec.{ts,js}'],
    exclude: ['node_modules/**', 'dist/**', '**/*.d.ts'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/modules/Goal/test-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/modules/Goal/**/*.{ts,vue}'],
      exclude: [
        'src/modules/Goal/**/*.test.{ts,js}',
        'src/modules/Goal/**/*.spec.{ts,js}',
        'src/modules/Goal/**/*.d.ts',
        'src/modules/Goal/**/test-*.{ts,js}',
      ],
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage/goal-module',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    reporters: ['verbose', 'junit'],
    outputFile: {
      junit: 'test-results/goal-module-junit.xml',
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, '../../../'),
      '@': path.resolve(__dirname, '../../../src'),
      src: path.resolve(__dirname, '../../../src'),
      '@electron': path.resolve(__dirname, '../../../electron'),
      '@common': path.resolve(__dirname, '../../../common'),
    },
  },
});
