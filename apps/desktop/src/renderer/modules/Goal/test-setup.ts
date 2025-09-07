/**
 * Goal 模块测试设置文件
 * 为 Goal 模块测试提供全局配置和模拟
 */

import { vi } from 'vitest';

// 全局模拟设置
vi.mock('@renderer/shared/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    snackbar: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

// Mock common module types
vi.mock('@common/modules/goal/types/goal', () => ({
  SYSTEM_GOAL_DIRS: {
    ALL: {
      uuid: 'system_all',
      name: '全部',
      icon: 'mdi-folder-multiple',
    },
    ARCHIVED: {
      uuid: 'system_archived',
      name: '已归档',
      icon: 'mdi-archive',
    },
    DELETED: {
      uuid: 'system_deleted',
      name: '已删除',
      icon: 'mdi-delete',
    },
  },
}));

// Mock common domain classes
vi.mock('@dailyuse/utils', () => ({
  AggregateRoot: class MockAggregateRoot {
    protected _uuid: string;

    constructor(uuid: string) {
      this._uuid = uuid || this.generateUUID();
    }

    get uuid(): string {
      return this._uuid;
    }

    static generateId(): string {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    generateId(): string {
      return MockAggregateRoot.generateUUID();
    }
  },
}));

vi.mock('@dailyuse/utils', () => ({
  Entity: class MockEntity {
    protected _uuid: string;

    constructor(uuid: string) {
      this._uuid = uuid || this.generateUUID();
    }

    get uuid(): string {
      return this._uuid;
    }

    static generateId(): string {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    generateId(): string {
      return MockEntity.generateUUID();
    }
  },
}));

// 全局测试工具函数
(globalThis as any).testUtils = {
  /**
   * 创建测试用的 UUID
   */
  createTestUuid: (prefix = 'test') =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * 创建测试用的日期
   */
  createTestDate: (offset = 0) => new Date(Date.now() + offset),

  /**
   * 等待异步操作
   */
  wait: (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * 模拟控制台方法
   */
  mockConsole: () => {
    const originalConsole = { ...console };
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.info = vi.fn();

    return {
      restore: () => {
        Object.assign(console, originalConsole);
      },
      mocks: {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
      },
    };
  },
};

// 设置测试超时
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000,
});

console.log('🔧 Goal 模块测试环境已设置');

// TypeScript 类型声明
declare global {
  const testUtils: {
    createTestUuid: (prefix?: string) => string;
    createTestDate: (offset?: number) => Date;
    wait: (ms?: number) => Promise<void>;
    mockConsole: () => {
      restore: () => void;
      mocks: {
        log: any;
        warn: any;
        error: any;
        info: any;
      };
    };
  };
}
