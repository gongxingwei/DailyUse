/**
 * API 测试环境配置
 * @description 为 API 层提供测试环境初始化，包括数据库和 Express 应用模拟
 */

import { beforeEach, afterEach, vi } from 'vitest';
import { mockPrismaClient, resetMockData } from './mocks/prismaMock.js';

// Mock Prisma config module
vi.mock('../config/prisma.js', () => ({
  prisma: mockPrismaClient,
  connectPrisma: vi.fn(),
  disconnectPrisma: vi.fn(),
}));

// Mock PrismaClient 构造函数
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient),
}));

beforeEach(async () => {
  // 重置所有模拟函数
  vi.clearAllMocks();

  // 设置环境变量
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.DATABASE_URL = 'file:./test.db';

  // 重置Mock数据
  resetMockData();

  // 设置时区为 UTC
  process.env.TZ = 'UTC';

  // 重置日期模拟
  vi.useFakeTimers({
    shouldAdvanceTime: true,
    toFake: ['Date'],
  });
});

afterEach(async () => {
  // 清理模拟
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// API 测试工具函数
export const ApiTestHelpers = {
  /**
   * 创建测试用的 Express 应用
   */
  createTestApp: async () => {
    // 这里应该导入并创建你的 Express 应用
    // 但避免实际启动服务器
    const appModule = await import('../app.js');
    return appModule.default || appModule;
  },

  /**
   * 创建测试用的认证 Token
   */
  createTestToken: async (payload = { accountUuid: 'test-user-123' }) => {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-jwt-secret-key';
    return jwt.default.sign(payload, secret, { expiresIn: '1h' });
  },

  /**
   * 创建测试用的请求头
   */
  createAuthHeaders: (token?: string) => ({
    Authorization: `Bearer ${token || ApiTestHelpers.createTestToken()}`,
    'Content-Type': 'application/json',
  }),

  /**
   * 模拟数据库响应
   */
  mockDatabaseResponse: <T>(data: T) => {
    return Promise.resolve(data);
  },

  /**
   * 创建测试数据
   */
  createTestData: {
    user: (overrides = {}) => ({
      uuid: 'test-user-123',
      email: 'test@example.com',
      name: '测试用户',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),

    goal: (overrides = {}) => ({
      uuid: 'test-goal-123',
      accountUuid: 'test-account-123',
      name: '测试目标',
      description: '测试目标描述',
      color: '#FF5733',
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),

    task: (overrides = {}) => ({
      uuid: 'test-task-123',
      accountUuid: 'test-account-123',
      title: '测试任务',
      description: '测试任务描述',
      status: 'pending',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),
  },
};

// 导出测试常量
export const API_TEST_CONSTANTS = {
  // 测试端口
  TEST_PORT: 0, // 使用随机端口

  // 测试数据库
  TEST_DATABASE_URL: 'file:./test.db',

  // JWT 密钥
  TEST_JWT_SECRET: 'test-jwt-secret-key',

  // API 路径
  API_PATHS: {
    AUTH: '/api/auth',
    GOALS: '/api/goals',
    TASKS: '/api/tasks',
    REMINDERS: '/api/reminders',
    THEMES: '/api/themes',
  },

  // 测试账户
  TEST_ACCOUNT: {
    uuid: 'test-account-123',
    email: 'test@example.com',
    name: '测试账户',
  },
} as const;

// 导出模拟的 Prisma 客户端
export { mockPrismaClient as mockPrisma };
