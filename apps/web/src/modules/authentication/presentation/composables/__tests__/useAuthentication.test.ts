import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthentication } from '../useAuthentication';

// Mock router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock stores
vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    accessToken: null,
    refreshToken: null,
    rememberToken: null,
    tokenExpiry: null,
    isTokenExpired: false,
    needsRefresh: false,
    clearAuth: vi.fn(),
    setUser: vi.fn(),
    setTokens: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
  }),
}));

// Mock AuthApplicationService
vi.mock('../../../application/services/AuthApplicationService', () => ({
  AuthApplicationService: {
    getInstance: () =>
      Promise.resolve({
        login: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
        initAuth: vi.fn(),
        changePassword: vi.fn(),
      }),
  },
}));

describe('useAuthentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return authentication composable with correct structure', () => {
    const auth = useAuthentication();

    expect(auth).toHaveProperty('isAuthenticated');
    expect(auth).toHaveProperty('user');
    expect(auth).toHaveProperty('isLoading');
    expect(auth).toHaveProperty('error');
    expect(auth).toHaveProperty('tokens');

    // Token 状态
    expect(auth).toHaveProperty('isTokenExpired');
    expect(auth).toHaveProperty('needsRefresh');
    expect(auth).toHaveProperty('tokenExpiry');

    // 本地 UI 状态
    expect(auth).toHaveProperty('loginFormVisible');
    expect(auth).toHaveProperty('currentOperation');

    // 查询方法
    expect(auth).toHaveProperty('getUserProfile');
    expect(auth).toHaveProperty('hasPermission');
    expect(auth).toHaveProperty('hasRole');
    expect(auth).toHaveProperty('getAccountUuid');
    expect(auth).toHaveProperty('getDisplayName');

    // 业务操作
    expect(auth).toHaveProperty('login');
    expect(auth).toHaveProperty('logout');
    expect(auth).toHaveProperty('refreshUser');
    expect(auth).toHaveProperty('initAuth');
    expect(auth).toHaveProperty('changePassword');
    expect(auth).toHaveProperty('refreshTokens');

    // 本地状态管理
    expect(auth).toHaveProperty('showLoginForm');
    expect(auth).toHaveProperty('hideLoginForm');
    expect(auth).toHaveProperty('toggleLoginForm');
    expect(auth).toHaveProperty('isOperationInProgress');
  });

  it('should handle login form visibility', () => {
    const auth = useAuthentication();

    // 初始状态
    expect(auth.loginFormVisible.value).toBe(false);

    // 显示表单
    auth.showLoginForm();
    expect(auth.loginFormVisible.value).toBe(true);

    // 隐藏表单
    auth.hideLoginForm();
    expect(auth.loginFormVisible.value).toBe(false);

    // 切换表单
    auth.toggleLoginForm();
    expect(auth.loginFormVisible.value).toBe(true);
  });

  it('should return correct display name', () => {
    const auth = useAuthentication();
    const displayName = auth.getDisplayName();

    // 默认情况下返回 '未知用户'
    expect(displayName).toBe('未知用户');
  });

  it('should handle permission and role checks', () => {
    const auth = useAuthentication();

    // 简化实现总是返回基于用户存在的布尔值
    const hasPermission = auth.hasPermission('read');
    const hasRole = auth.hasRole('admin');

    expect(typeof hasPermission).toBe('boolean');
    expect(typeof hasRole).toBe('boolean');
  });

  it('should track operation progress', () => {
    const auth = useAuthentication();

    // 初始状态
    expect(auth.isOperationInProgress('login')).toBe(false);
    expect(auth.currentOperation.value).toBe(null);
  });
});




