import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { AuthenticationService } from '../../application/services/authenticationService';

import { useSnackbar } from '@renderer/shared/composables/useSnackbar';
import type {
  PasswordAuthenticationRequest,
  RememberMeTokenAuthenticationRequest,
} from '@renderer/modules/Authentication/domain/types';

/**
 * 登录表单 Composable
 * 专门用于登录表单的状态管理
 */
export function useAuthenticationService() {
  const { snackbar, showError, showSuccess } = useSnackbar();
  const authenticationService = AuthenticationService.getInstance();
  const router = useRouter();
  const loading = ref(false);
  const passwordAuthenticationForm = ref<PasswordAuthenticationRequest>({
    username: 'Test1',
    password: 'test1@example.com',
    remember: false,
  });

  const formValid = ref(false);
  const showPassword = ref(false);

  /**
   * 重置表单
   */
  const resetForm = (): void => {
    passwordAuthenticationForm.value = {
      username: '',
      password: '',
      remember: false,
    };
    formValid.value = false;
    showPassword.value = false;
  };

  const getQuickLoginAccounts = async (): Promise<
    Array<{ accountUuid: string; username: string; token: string }>
  > => {
    try {
      const accounts: Array<{ accountUuid: string; username: string; token: string }> =
        await authenticationService.getQuickLoginAccounts();
      return accounts;
    } catch (error) {
      showError((error as Error).message);
      return [];
    }
  };

  const handleAccountSelect = (selectedUsername: string | null): void => {
    if (selectedUsername) {
      passwordAuthenticationForm.value.username = selectedUsername;
      // const savedPassword = getSavedPasswordForUser(selectedUsername);
      // if (savedPassword) {
      //   passwordAuthenticationForm.password = savedPassword;
      // }
    }
  };

  const handleLocalLoginByPassword = async (): Promise<void> => {
    try {
      const response = await authenticationService.passwordAuthentication(
        passwordAuthenticationForm.value,
      );
      if (response.success) {
        // 登录成功
        showSuccess('登录成功');
        // 跳转到首页
        router.push('/summary');
        console.log('🚀！！[useAuthentication]: 登录成功', response.data);
      } else {
        // 登录失败
        showError(response.message);
      }
    } catch (error) {
      console.error('[useAuthentication]: handleLocalLoginByPassword', error);
    }
  };

  const handleLocalQuickLogin = async (
    request: RememberMeTokenAuthenticationRequest,
  ): Promise<void> => {
    try {
      console.log('🚀！！[useAuthentication]: 快速登录', request);
      const response = await authenticationService.rememberMeTokenAuthentication(request);
      if (response.success) {
        // 登录成功
        showSuccess('登录成功');
        // 跳转到首页
        router.push('/summary');
        console.log('🚀！！[useAuthentication]: 登录成功', response.data);
      } else {
        // 登录失败
        showError(response.message);
      }
    } catch (error) {
      console.error('[useAuthentication]: handleLocalQuickLogin', error);
    }
  };

  const handleRemoveAccount = (username: string): void => {
    // 删除用户信息
    console.log(`Removing account: ${username}`);
  };

  return {
    loading,
    snackbar,
    passwordAuthenticationForm,
    formValid,
    showPassword,
    resetForm,
    getQuickLoginAccounts,
    handleLocalLoginByPassword,
    handleLocalQuickLogin,
    handleAccountSelect,
    handleRemoveAccount,
  };
}
