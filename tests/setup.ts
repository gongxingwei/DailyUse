import { config } from '@vue/test-utils';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 全局测试配置
config.global.stubs = {
  // 暂时禁用路由相关组件
  'router-link': true,
  'router-view': true,
};

// 模拟 Pinia store
const mockStore = {
  $state: {},
  $patch: vi.fn(),
  $reset: vi.fn(),
  $subscribe: vi.fn(),
  $dispose: vi.fn(),
};

// 全局 mock 配置
(globalThis as any).vi = vi;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock console methods for cleaner test output
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args: any[]) => {
  // 过滤掉一些不重要的警告
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Vue warn') ||
      message.includes('[Vuetify]') ||
      message.includes('Failed to resolve component'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

console.error = (...args: any[]) => {
  // 过滤掉一些不重要的错误
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Vue warn') || message.includes('[Vuetify]'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
