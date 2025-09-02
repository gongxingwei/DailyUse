import { ref, computed } from 'vue';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { type AuthByPasswordForm, type AuthResponseDTO } from '@/tempTypes';
import { AuthApplicationService } from '../../application/services/AuthApplicationService';
export function useAuthenticationService() {
  const { showError, showSuccess, showInfo, snackbar } = useSnackbar();


  const handleLogin = async (credentials: AuthByPasswordForm): Promise<void> => {
    try {
      showInfo('正在登录...');
      const response = await AuthApplicationService.getInstance().then(
        (authService) => authService.login(credentials)
      );
      if (response.data && response.data.accessToken) {
        showSuccess('登录成功');
      }
    } catch (error) {
      showError('登录失败');
      throw error;
    }
  };


  return {
    snackbar,
    handleLogin,
  };
}
