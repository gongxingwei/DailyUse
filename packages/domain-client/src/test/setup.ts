/**
 * Domain Client 测试环境配置
 * @description 为客户端领域层提供测试环境初始化，包括 Pinia、Vue 等模拟
 */

import { beforeEach, vi } from 'vitest';

// 全局测试配置
beforeEach(() => {
  // 重置所有模拟函数
  vi.clearAllMocks();

  // 模拟 localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  vi.stubGlobal('localStorage', localStorageMock);

  // 模拟 sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  vi.stubGlobal('sessionStorage', sessionStorageMock);

  // 设置时区为 UTC
  process.env.TZ = 'UTC';

  // 重置日期模拟
  vi.useFakeTimers({
    shouldAdvanceTime: true,
    toFake: ['Date'],
  });
});

// 客户端测试工具函数
export const ClientTestHelpers = {
  /**
   * 创建模拟的 HTTP 响应
   */
  createMockResponse: <T>(data: T, success = true) => ({
    success,
    data,
    message: success ? 'Success' : 'Error',
    code: success ? 200 : 500,
  }),

  /**
   * 创建模拟的 Pinia Store
   */
  createMockStore: <T extends Record<string, any>>(initialState: T) => {
    const store = { ...initialState };
    return {
      ...store,
      $patch: vi.fn((updates: Partial<T>) => {
        Object.assign(store, updates);
      }),
      $reset: vi.fn(() => {
        Object.assign(store, initialState);
      }),
      $subscribe: vi.fn(),
    };
  },

  /**
   * 创建模拟的 API 服务
   */
  createMockApiService: () => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  }),

  /**
   * 等待 Vue 更新周期
   */
  waitForNextTick: () => new Promise((resolve) => setTimeout(resolve, 0)),

  /**
   * 模拟网络延迟
   */
  mockNetworkDelay: (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// 导出测试常量
export const CLIENT_TEST_CONSTANTS = {
  // API 基础 URL
  API_BASE_URL: 'http://localhost:3888/api',

  // 模拟 Token
  MOCK_ACCESS_TOKEN: 'mock-access-token-12345',
  MOCK_REFRESH_TOKEN: 'mock-refresh-token-12345',

  // 测试用户信息
  MOCK_USER: {
    uuid: 'user-test-123',
    email: 'test@example.com',
    name: '测试用户',
    avatar: 'https://example.com/avatar.jpg',
  },

  // HTTP 状态码
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
} as const;

// 全局模拟导入
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useRoute: () => ({
    params: {},
    query: {},
    path: '/',
    fullPath: '/',
    name: 'test',
  }),
}));

// 声明全局类型
declare global {
  interface Window {
    localStorage: Storage;
    sessionStorage: Storage;
  }
}
