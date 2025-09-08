import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { type AuthByPasswordForm, type AuthResponseDTO } from '@dailyuse/contracts';
import { AuthApplicationService } from '../../application/services/AuthApplicationService';
import { useAuthStore } from '../stores/useAuthStore';
import { useAccountStore } from '@/modules/account/presentation/stores/useAccountStore';
export function useAuthenticationService() {
  const { showError, showSuccess, showInfo, snackbar } = useSnackbar();
  const router = useRouter();
  const authStore = useAuthStore();
  const accountStore = useAccountStore();

  /**
   * 处理登录
   */
  const handleLogin = async (credentials: AuthByPasswordForm): Promise<void> => {
    try {
      authStore.setLoading(true);
      authStore.clearError();
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
  };
}
