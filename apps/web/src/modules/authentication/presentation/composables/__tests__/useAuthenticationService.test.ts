import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthenticationService } from '../useAuthenticationService';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAccountStore } from '@/modules/account/presentation/stores/useAccountStore';
import { useGlobalInitialization } from '@/composables/useGlobalInitialization';
import { AuthApplicationService } from '../../../application/services/AuthApplicationService';
import { useRouter } from 'vue-router';
import { createMockStore } from '../../../../../../../../tests/utils/testHelpers';
import type { AuthByPasswordForm } from '@dailyuse/contracts';

// Mock dependencies
vi.mock('@/shared/composables/useSnackbar');
vi.mock('../../stores/useAuthStore');
vi.mock('@/modules/account/presentation/stores/useAccountStore');
vi.mock('@/composables/useGlobalInitialization');
vi.mock('../../../application/services/AuthApplicationService');
vi.mock('vue-router');

describe('useAuthenticationService', () => {
  let mockSnackbar: any;
  let mockAuthStore: any;
  let mockAccountStore: any;
  let mockGlobalInitialization: any;
  let mockAuthApplicationService: any;
  let mockRouter: any;

  beforeEach(() => {
    // Mock snackbar
    mockSnackbar = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showInfo: vi.fn(),
      showWarning: vi.fn(),
      handleOperationResult: vi.fn(),
    };

    // Mock auth store
    mockAuthStore = createMockStore({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      setLoading: vi.fn(),
      clearError: vi.fn(),
      setUser: vi.fn(),
      setTokens: vi.fn(),
      clearAuth: vi.fn(),
      setError: vi.fn(),
    });

    // Mock account store
    mockAccountStore = createMockStore({
      setAccountUuid: vi.fn(),
    });

    // Mock global initialization
    mockGlobalInitialization = {
      initializeForUser: vi.fn(),
      isInitializing: { value: false },
      initializationError: { value: null },
      clearError: vi.fn(),
      cleanup: vi.fn(),
    };

    // Mock auth application service
    mockAuthApplicationService = {
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      initAuth: vi.fn(),
      changePassword: vi.fn(),
    };

    // Mock router
    mockRouter = {
      push: vi.fn(),
    };

    // Setup mocks
    vi.mocked(useSnackbar).mockReturnValue(mockSnackbar);
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);
    vi.mocked(useAccountStore).mockReturnValue(mockAccountStore);
    vi.mocked(useGlobalInitialization).mockReturnValue(mockGlobalInitialization);
    vi.mocked(AuthApplicationService.getInstance).mockResolvedValue(mockAuthApplicationService);
    vi.mocked(useRouter).mockReturnValue(mockRouter);
  });

  describe('初始化', () => {
    it('应该正确初始化 composable', () => {
      const authService = useAuthenticationService();

      expect(authService).toBeDefined();
      expect(typeof authService.handleLogin).toBe('function');
      expect(typeof authService.handleLogout).toBe('function');
      expect(typeof authService.handleRefreshUser).toBe('function');
      expect(typeof authService.handleInitAuth).toBe('function');
      expect(typeof authService.handleChangePassword).toBe('function');
    });

    it('应该正确获取状态计算属性', () => {
      const authService = useAuthenticationService();

      expect(authService.isAuthenticated).toBeDefined();
      expect(authService.user).toBeDefined();
      expect(authService.loading).toBeDefined();
      expect(authService.error).toBeDefined();
      expect(authService.isInitializing).toBeDefined();
      expect(authService.initializationError).toBeDefined();
    });
  });

  describe('登录处理', () => {
    it('应该能够处理成功登录', async () => {
      const credentials: AuthByPasswordForm = {
        username: 'testuser',
        password: 'testpass',
        remember: false,
      };

      const mockResponse = {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          rememberToken: 'remember-token',
          expiresIn: 3600,
          accountUuid: 'account-uuid',
        },
      };

      const mockInitResults = {
        success: true,
        results: {
          goals: { goalsCount: 5 },
          tasks: { templatesCount: 10 },
          repositories: { repositoriesCount: 3 },
          editor: { filesCount: 15 },
        },
        errors: [],
      };

      mockSnackbar.handleOperationResult.mockResolvedValue(mockResponse);
      mockGlobalInitialization.initializeForUser.mockResolvedValue(mockInitResults);

      const authService = useAuthenticationService();

      await authService.handleLogin(credentials);

      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockAuthStore.clearError).toHaveBeenCalled();
      expect(mockSnackbar.showInfo).toHaveBeenCalledWith('正在登录...');
      expect(mockAuthApplicationService.login).toHaveBeenCalledWith(credentials);
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockResponse.data);
      expect(mockAuthStore.setTokens).toHaveBeenCalledWith({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        rememberToken: 'remember-token',
        expiresIn: 3600,
      });
      expect(mockGlobalInitialization.initializeForUser).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith({ name: 'dashboard' });
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('应该处理登录失败', async () => {
      const credentials: AuthByPasswordForm = {
        username: 'testuser',
        password: 'wrongpass',
        remember: false,
      };

      const error = new Error('Invalid credentials');
      mockSnackbar.handleOperationResult.mockRejectedValue(error);

      const authService = useAuthenticationService();

      await expect(authService.handleLogin(credentials)).rejects.toThrow('Invalid credentials');

      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockAuthStore.setError).toHaveBeenCalledWith('Invalid credentials');
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('应该处理初始化失败但不影响登录', async () => {
      const credentials: AuthByPasswordForm = {
        username: 'testuser',
        password: 'testpass',
        remember: false,
      };

      const mockResponse = {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          accountUuid: 'account-uuid',
        },
      };

      mockSnackbar.handleOperationResult.mockResolvedValue(mockResponse);
      mockGlobalInitialization.initializeForUser.mockRejectedValue(new Error('Init failed'));

      const authService = useAuthenticationService();

      await authService.handleLogin(credentials);

      expect(mockSnackbar.showWarning).toHaveBeenCalledWith('数据加载失败，但登录成功');
      expect(mockRouter.push).toHaveBeenCalledWith({ name: 'dashboard' });
    });
  });

  describe('登出处理', () => {
    it('应该能够处理成功登出', async () => {
      const authService = useAuthenticationService();

      await authService.handleLogout();

      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockSnackbar.handleOperationResult).toHaveBeenCalledWith(
        mockAuthApplicationService.logout(),
        '登出成功',
        '登出失败',
      );
      expect(mockAuthStore.clearAuth).toHaveBeenCalled();
      expect(mockGlobalInitialization.cleanup).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith({ name: 'login' });
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('应该处理登出失败', async () => {
      const error = new Error('Logout failed');
      mockSnackbar.handleOperationResult.mockRejectedValue(error);

      const authService = useAuthenticationService();

      await authService.handleLogout();

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Logout failed');
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('刷新用户信息', () => {
    it('应该能够刷新用户信息', async () => {
      const mockUserData = { username: 'testuser', accountUuid: 'account-uuid' };
      mockAuthApplicationService.refreshUser.mockResolvedValue(mockUserData);

      const authService = useAuthenticationService();

      await authService.handleRefreshUser();

      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockAuthStore.clearError).toHaveBeenCalled();
      expect(mockAuthApplicationService.refreshUser).toHaveBeenCalled();
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUserData);
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('应该处理刷新失败', async () => {
      const error = new Error('Refresh failed');
      mockAuthApplicationService.refreshUser.mockRejectedValue(error);

      const authService = useAuthenticationService();

      await expect(authService.handleRefreshUser()).rejects.toThrow('Refresh failed');

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Refresh failed');
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('初始化认证状态', () => {
    it('应该能够初始化认证状态', async () => {
      const mockUserData = { username: 'testuser', accountUuid: 'account-uuid' };
      mockAuthApplicationService.initAuth.mockResolvedValue(mockUserData);

      const authService = useAuthenticationService();

      await authService.handleInitAuth();

      expect(mockAuthApplicationService.initAuth).toHaveBeenCalled();
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUserData);
    });

    it('应该处理初始化失败', async () => {
      const error = new Error('Init failed');
      mockAuthApplicationService.initAuth.mockRejectedValue(error);

      const authService = useAuthenticationService();

      await authService.handleInitAuth();

      expect(mockAuthStore.clearAuth).toHaveBeenCalled();
    });

    it('应该处理空用户数据', async () => {
      mockAuthApplicationService.initAuth.mockResolvedValue(null);

      const authService = useAuthenticationService();

      await authService.handleInitAuth();

      expect(mockAuthStore.setUser).not.toHaveBeenCalled();
    });
  });

  describe('修改密码', () => {
    it('应该能够修改密码', async () => {
      const currentPassword = 'oldpass';
      const newPassword = 'newpass';

      const authService = useAuthenticationService();

      await authService.handleChangePassword(currentPassword, newPassword);

      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockAuthStore.clearError).toHaveBeenCalled();
      expect(mockSnackbar.handleOperationResult).toHaveBeenCalledWith(
        mockAuthApplicationService.changePassword(currentPassword, newPassword),
        '密码修改成功',
        '修改密码失败',
      );
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('应该处理密码修改失败', async () => {
      const currentPassword = 'oldpass';
      const newPassword = 'newpass';
      const error = new Error('Password change failed');

      mockSnackbar.handleOperationResult.mockRejectedValue(error);

      const authService = useAuthenticationService();

      await expect(authService.handleChangePassword(currentPassword, newPassword)).rejects.toThrow(
        'Password change failed',
      );

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Password change failed');
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('状态读取', () => {
    it('应该正确读取认证状态', () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.user = { username: 'testuser' };
      mockAuthStore.loading = false;
      mockAuthStore.error = null;

      const authService = useAuthenticationService();

      expect(authService.isAuthenticated.value).toBe(true);
      expect(authService.user.value).toEqual({ username: 'testuser' });
      expect(authService.loading.value).toBe(false);
      expect(authService.error.value).toBeNull();
    });

    it('应该正确读取初始化状态', () => {
      mockGlobalInitialization.isInitializing.value = true;
      mockGlobalInitialization.initializationError.value = 'Init error';

      const authService = useAuthenticationService();

      expect(authService.isInitializing.value).toBe(true);
      expect(authService.initializationError.value).toBe('Init error');
    });
  });

  describe('错误处理', () => {
    it('应该正确处理无 token 的登录响应', async () => {
      const credentials: AuthByPasswordForm = {
        username: 'testuser',
        password: 'testpass',
        remember: false,
      };

      const mockResponse = {
        data: {
          accountUuid: 'account-uuid',
          // 缺少 tokens
        },
      };

      mockSnackbar.handleOperationResult.mockResolvedValue(mockResponse);

      const authService = useAuthenticationService();

      await authService.handleLogin(credentials);

      // 应该不会调用 setTokens 和 router.push
      expect(mockAuthStore.setTokens).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('应该为错误消息提供默认值', async () => {
      const error = new Error(); // 没有 message
      mockSnackbar.handleOperationResult.mockRejectedValue(error);

      const authService = useAuthenticationService();

      await expect(
        authService.handleLogin({
          username: 'test',
          password: 'test',
          remember: false,
        }),
      ).rejects.toThrow();

      expect(mockAuthStore.setError).toHaveBeenCalledWith('登录失败');
    });
  });
});
