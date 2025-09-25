import { vi, expect } from 'vitest';
import type { MockedFunction } from 'vitest';

/**
 * 测试工具函数集合
 */

/**
 * 创建 mock 的应用服务
 */
export function createMockApplicationService<T extends Record<string, any>>(methods: (keyof T)[]) {
  const mock = {} as { [K in keyof T]: MockedFunction<any> };

  methods.forEach((method) => {
    mock[method] = vi.fn() as any;
  });

  return mock;
}

/**
 * 创建 mock 的 Store
 */
export function createMockStore<T extends Record<string, any>>(initialState: Partial<T> = {}) {
  return {
    ...initialState,
    $patch: vi.fn(),
    $reset: vi.fn(),
    $subscribe: vi.fn(),
    $dispose: vi.fn(),
  };
}

/**
 * 创建 mock 的 Entity
 */
export function createMockEntity<T extends Record<string, any>>(properties: Partial<T> = {}): T {
  return {
    uuid: 'test-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...properties,
  } as unknown as T;
}

/**
 * 等待 Vue 组合式函数的下一个 tick
 */
export async function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * 创建异步操作的 mock，支持成功和失败场景
 */
export function createAsyncMock<T = any>(
  successValue?: T,
  shouldFail = false,
  errorMessage = 'Mock error',
) {
  return vi.fn().mockImplementation(async () => {
    await nextTick();
    if (shouldFail) {
      throw new Error(errorMessage);
    }
    return successValue;
  });
}

/**
 * 验证组合式函数的基本结构
 */
export function expectComposableStructure(composable: any, expectedMethods: string[]) {
  expect(composable).toBeDefined();
  expect(typeof composable).toBe('object');

  expectedMethods.forEach((method) => {
    expect(composable[method]).toBeDefined();
  });
}

/**
 * Mock 时间相关的工具
 */
export function mockDate(date: string | Date = new Date()) {
  const mockDate = new Date(date);
  vi.setSystemTime(mockDate);
  return mockDate;
}

/**
 * 恢复时间 mock
 */
export function restoreDate() {
  vi.useRealTimers();
}

/**
 * 创建延迟的 Promise
 */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
}
