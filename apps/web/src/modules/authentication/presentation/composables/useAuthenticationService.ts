import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { type AuthByPasswordForm, type AuthResponseDTO } from '@dailyuse/contracts';
import { AuthApplicationService } from '../../application/services/AuthApplicationService';
export function useAuthenticationService() {
  const { showError, showSuccess, showInfo, snackbar } = useSnackbar();
  const router = useRouter();

  const handleLogin = async (credentials: AuthByPasswordForm): Promise<void> => {
    try {
      showInfo('正在登录...');
      const response = await AuthApplicationService.getInstance().then(
        (authService) => authService.login(credentials)
      );
      if (response.data && response.data.accessToken) {
        showSuccess('登录成功');
        router.push({ name: 'home' });
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
