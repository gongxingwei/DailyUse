import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { type AuthByPasswordForm, type AuthResponseDTO } from '@dailyuse/contracts';
import { AuthApplicationService } from '../../application/services/AuthApplicationService';
import { useAuthStore } from '../stores/useAuthStore';
import { useAccountStore } from '@/modules/account/presentation/stores/useAccountStore';
import { useGlobalInitialization } from '@/composables/useGlobalInitialization';
export function useAuthenticationService() {
  const { showError, showSuccess, showInfo, snackbar } = useSnackbar();
  const router = useRouter();
  const authStore = useAuthStore();
  const accountStore = useAccountStore();

  // 全局初始化服务
  const {
    initializeForUser,
    isInitializing,
    initializationError,
    clearError: clearInitializationError,
  } = useGlobalInitialization();

  /**
   * 处理登录
   */
  const handleLogin = async (credentials: AuthByPasswordForm): Promise<void> => {
    try {
      authStore.setLoading(true);
      authStore.clearError();
      clearInitializationError();
      showInfo('正在登录...');

      const authService = await AuthApplicationService.getInstance();
      const response = await authService.login(credentials);

      if (response.data && response.data.accessToken && response.data.refreshToken) {
        // 更新store状态，包括tokens
        // accountStore.setAccountUuid(response.data.accountUuid);
        authStore.setUser(response.data);
        authStore.setTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          rememberToken: response.data.rememberToken,
          expiresIn: response.data.expiresIn || 3600,
        });

        showSuccess('登录成功');

        // 登录成功后初始化所有模块数据
        try {
          showInfo('正在加载数据...');
          console.log('用户登录成功，开始初始化所有模块...');

          const initResults = await initializeForUser();

          if (initResults.success) {
            const { results } = initResults;
            let successMessage = '数据加载完成';

            // 构建详细的成功消息
            const details = [];
            if (results.goals) {
              details.push(`${results.goals.goalsCount} 个目标`);
            }
            if (results.tasks) {
              details.push(`${results.tasks.templatesCount} 个任务模板`);
            }
            if (results.repositories) {
              details.push(`${results.repositories.repositoriesCount} 个仓库`);
            }
            if (results.editor) {
              details.push(`${results.editor.filesCount} 个文件`);
            }

            if (details.length > 0) {
              successMessage += `：${details.join(', ')}`;
            }

            showSuccess(successMessage);
            console.log('所有模块初始化完成:', initResults);
          } else {
            // 部分模块初始化失败
            const errorCount = initResults.errors.length;
            showError(`部分数据加载失败 (${errorCount} 个错误)`);
            console.warn('部分模块初始化失败:', initResults.errors);
          }
        } catch (initError) {
          // 初始化失败不影响登录流程
          console.error('数据初始化失败:', initError);
          showError('数据加载失败，但登录成功');
        }

        router.push({ name: 'dashboard' });
      }
    } catch (error: any) {
      const errorMessage = error.message || '登录失败';
      authStore.setError(errorMessage);
      showError(errorMessage);
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  };

  /**
   * 处理登出
   */
  const handleLogout = async (): Promise<void> => {
    try {
      authStore.setLoading(true);

      const authService = await AuthApplicationService.getInstance();
      await authService.logout();

      // 清除store状态
      authStore.clearAuth();

      // 清理全局初始化服务的资源
      const { cleanup } = useGlobalInitialization();
      cleanup();

      showSuccess('登出成功');
      router.push({ name: 'login' });
    } catch (error: any) {
      const errorMessage = error.message || '登出失败';
      authStore.setError(errorMessage);
      showError(errorMessage);
    } finally {
      authStore.setLoading(false);
    }
  };

  /**
   * 刷新用户信息
   */
  const handleRefreshUser = async (): Promise<void> => {
    try {
      authStore.setLoading(true);
      authStore.clearError();

      const authService = await AuthApplicationService.getInstance();
      const userData = await authService.refreshUser();

      authStore.setUser(userData);
    } catch (error: any) {
      const errorMessage = error.message || '获取用户信息失败';
      authStore.setError(errorMessage);
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  };

  /**
   * 初始化认证状态
   */
  const handleInitAuth = async (): Promise<void> => {
    try {
      const authService = await AuthApplicationService.getInstance();
      const userData = await authService.initAuth();

      if (userData) {
        authStore.setUser(userData);
      }
    } catch (error: any) {
      // 初始化失败时清除状态
      authStore.clearAuth();
    }
  };

  /**
   * 修改密码
   */
  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    try {
      authStore.setLoading(true);
      authStore.clearError();

      const authService = await AuthApplicationService.getInstance();
      await authService.changePassword(currentPassword, newPassword);

      showSuccess('密码修改成功');
    } catch (error: any) {
      const errorMessage = error.message || '修改密码失败';
      authStore.setError(errorMessage);
      showError(errorMessage);
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  };

  return {
    // UI 相关
    snackbar,

    // 业务方法
    handleLogin,
    handleLogout,
    handleRefreshUser,
    handleInitAuth,
    handleChangePassword,

    // 状态（来自store）
    isAuthenticated: computed(() => authStore.isAuthenticated),
    user: computed(() => authStore.user),
    loading: computed(() => authStore.loading),
    error: computed(() => authStore.error),

    // 初始化相关状态
    isInitializing,
    initializationError,
  };
}
