import type { AccountContracts } from '@dailyuse/contracts';
import { AccountContracts as AC } from '@dailyuse/contracts';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { ApplicationService } from '../../application/services/ApplicationService';

// 使用类型别名
type CreateAccountRequest = AccountContracts.CreateAccountRequest;

// 表单类型（前端使用）
interface RegistrationByUsernameAndPasswordForm {
  username: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

// 获取 AccountType enum
const { AccountType } = AC;
export function useAccountService() {
  const { snackbar, showSuccess, showError } = useSnackbar();
  // 更新用户信息
  const handleUpdateUserProfile = async () => {
    console.log('更新用户信息');
  };

  const handleRegistration = async (registrationData: RegistrationByUsernameAndPasswordForm) => {
    console.log('开始注册流程', registrationData);
    const accountService = await ApplicationService.getInstance();
    const registrationRequestDate: CreateAccountRequest = {
      uuid: crypto.randomUUID(), // 前端生成 UUID
      username: registrationData.username,
      password: registrationData.password,
      confirmPassword: registrationData.confirmPassword,
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
