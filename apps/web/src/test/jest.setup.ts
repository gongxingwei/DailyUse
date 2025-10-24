/**
 * Jest Setup File
 *
 * 在每个测试文件运行前执行的全局配置
 */

import '@testing-library/jest-dom';
import { jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { config } from '@vue/test-utils';

// Mock import.meta (Vite特有功能)
(globalThis as any).import = {
  meta: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:3888/api/v1',
      VITE_WS_BASE_URL: 'ws://localhost:3888',
      MODE: 'test',
      DEV: false,
      PROD: false,
      SSR: false,
    },
  },
};

// Configure Vue Test Utils
config.global.mocks = {
  $t: (key: string) => key, // Mock i18n
};

// 扩展 expect matchers
// @testing-library/jest-dom 提供了额外的 matchers，如：
// - toBeInTheDocument()
// - toHaveClass()
// - toBeVisible()
// - toHaveTextContent()
// 等等

// Mock window.matchMedia (用于响应式测试)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver (用于 lazy loading 等)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (用于响应式组件)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock HTMLCanvasElement.getContext (用于 ECharts 等)
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
})) as any;

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock console.warn and console.error to reduce noise in tests
// 只在需要时才启用这些 mock
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  // 过滤掉特定的警告信息
  console.warn = jest.fn((...args) => {
    const message = args[0];
    // 忽略 Vue 的某些开发警告
    if (
      typeof message === 'string' &&
      (message.includes('[Vue warn]') || message.includes('Download the Vue Devtools'))
    ) {
      return;
    }
    originalWarn(...args);
  });

  console.error = jest.fn((...args) => {
    const message = args[0];
    // 忽略特定错误
    if (
      typeof message === 'string' &&
      message.includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      return;
    }
    originalError(...args);
  });
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// 全局测试配置
beforeEach(() => {
  // 清理 DOM
  document.body.innerHTML = '';

  // 清理 localStorage
  localStorage.clear();

  // 清理 sessionStorage
  sessionStorage.clear();
});

afterEach(() => {
  // 清理所有 timers
  jest.clearAllTimers();

  // 清理所有 mocks
  jest.clearAllMocks();
});
