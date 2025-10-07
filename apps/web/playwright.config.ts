import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试文件目录
  testDir: './e2e',

  // 单个测试最大执行时间 (5分钟，因为需要等待 Reminder 触发)
  timeout: 5 * 60 * 1000,

  // 全局设置超时
  expect: {
    timeout: 10 * 1000, // 断言超时 10 秒
  },

  // 失败重试次数
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,

  // 并行 worker 数量
  workers: 1, // E2E 测试使用单个 worker 避免冲突

  // 报告配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // 全局配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:5173',

    // 追踪配置
    trace: 'on-first-retry',

    // 截图配置
    screenshot: 'only-on-failure',

    // 视频录制
    video: 'retain-on-failure',

    // 浏览器上下文选项
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15 * 1000, // 操作超时 15 秒
  },

  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 开发服务器配置 (可选，如果需要 Playwright 自动启动服务器)
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
