import {
  type RegistrationByUsernameAndPasswordForm,
  type RegistrationByUsernameAndPasswordRequestDTO,
  AccountType,
} from '@dailyuse/contracts';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { ApplicationService } from '../../application/services/ApplicationService';
export function useAccountService() {
  const { snackbar, showSuccess, showError } = useSnackbar();
  // 更新用户信息
  const handleUpdateUserProfile = async () => {
    console.log('更新用户信息');
  };

  const handleRegistration = async (registrationData: RegistrationByUsernameAndPasswordForm) => {
    console.log('开始注册流程', registrationData);
    const accountService = await ApplicationService.getInstance();
    const registrationRequestDate: RegistrationByUsernameAndPasswordRequestDTO = {
      username: registrationData.username,
      password: registrationData.password,
      confirmPassword: registrationData.confirmPassword,
      agreement: {
        agreedToPrivacy: registrationData.agree,
        agreedToTerms: registrationData.agree,
        termsVersion: '1.0.0',
        privacyVersion: '1.0.0',
        agreedAt: new Date().getTime(),
      },
      accountType: AccountType.GUEST,
    };
    const response = await accountService.register(registrationRequestDate);
    if (response) {
      showSuccess('注册成功');
    } else {
      showError('注册失败: ');
    }
  };

  return {
    snackbar,
    handleUpdateUserProfile,
    handleRegistration,
  };
}
