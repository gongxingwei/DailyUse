import { vi, beforeEach, afterEach } from 'vitest';

// 简化版本的 Pinia 测试工具，避免依赖问题
export function createTestPinia(): any {
  const stores = new Map();

  const pinia = {
    _s: stores,
    install: vi.fn(),
    use: vi.fn(),
    state: {
      value: {},
    },
  };

  // 模拟 setActivePinia
  (globalThis as any).__TEST_PINIA__ = pinia;

  return pinia;
}

/**
 * 重置所有 Store 状态（用于测试清理）
 */
export function resetStores(pinia: any) {
  if (pinia && pinia._s) {
    pinia._s.forEach((store: any) => {
      if (store.$reset) {
        store.$reset();
      }
    });
  }
}

/**
 * 模拟 Pinia store 状态
 */
export function mockStoreState<T extends Record<string, any>>(store: any, mockState: Partial<T>) {
  Object.keys(mockState).forEach((key) => {
    if (store[key] !== undefined) {
      store[key] = mockState[key];
    }
  });
}

/**
 * 为 Composable 测试设置 Pinia 环境
 */
export function setupPiniaForComposables() {
  beforeEach(() => {
    createTestPinia();
  });

  afterEach(() => {
    // 清理 Pinia 实例
    (globalThis as any).__TEST_PINIA__ = undefined;
  });
}
