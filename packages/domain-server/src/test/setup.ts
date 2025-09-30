/**
 * Domain Server 测试环境配置
 * @description 为服务端领域层提供测试环境初始化
 */

import { beforeEach, vi } from 'vitest';

// 全局测试配置
beforeEach(() => {
  // 重置所有模拟函数
  vi.clearAllMocks();

  // 设置时区为 UTC，确保时间测试的一致性
  process.env.TZ = 'UTC';

  // 重置日期模拟
  vi.useFakeTimers({
    shouldAdvanceTime: true,
    toFake: ['Date'],
  });
});

// 全局测试工具函数
global.createMockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  vi.setSystemTime(mockDate);
  return mockDate;
};

// 声明全局测试类型
declare global {
  function createMockDate(dateString: string): Date;
}

// 领域模型测试辅助函数
export const TestHelpers = {
  /**
   * 生成测试用的 UUID
   */
  generateTestUuid: (prefix = 'test') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * 创建测试账户 UUID
   */
  createTestAccountUuid: () => TestHelpers.generateTestUuid('account'),

  /**
   * 等待指定毫秒数
   */
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * 创建日期范围
   */
  createDateRange: (startDaysAgo: number, endDaysFromNow: number) => {
    const now = new Date();
    return {
      startTime: new Date(now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + endDaysFromNow * 24 * 60 * 60 * 1000),
    };
  },
};

// 导出测试常量
export const TEST_CONSTANTS = {
  // 测试账户信息
  TEST_ACCOUNT_UUID: 'test-account-123456789',
  TEST_USER_EMAIL: 'test@example.com',

  // 测试时间
  TEST_DATE: '2025-09-29T10:00:00.000Z',
  YESTERDAY: '2025-09-28T10:00:00.000Z',
  TOMORROW: '2025-09-30T10:00:00.000Z',

  // 测试数值
  DEFAULT_TARGET_VALUE: 100,
  DEFAULT_CURRENT_VALUE: 50,
  DEFAULT_WEIGHT: 50,
} as const;
