import type { AccountContracts } from '@dailyuse/contracts';
import { Gender } from '@dailyuse/contracts';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { ApplicationService } from '../../application/services/ApplicationService';
import { useAccountStore } from '../stores/useAccountStore';

// 使用类型别名
type CreateAccountRequest = AccountContracts.CreateAccountRequestDTO;

// 表单类型（前端使用）
interface RegistrationByUsernameAndPasswordForm {
  username: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

// 用户资料更新表单
interface ProfileUpdateForm {
  displayName: string;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  dateOfBirth?: number | null;
  gender?: Gender | null;
}

// 获取 AccountType enum
export function useAccountService() {
  const { snackbar, showSuccess, showError } = useSnackbar();
  const accountStore = useAccountStore();

  // 更新用户资料
  const handleUpdateUserProfile = async (profileData: ProfileUpdateForm) => {
    try {
      console.log('更新用户资料', profileData);
      
      const currentAccount = accountStore.currentAccount;
      if (!currentAccount) {
        showError('未找到当前用户');
        return;
      }

      // 调用 Account 聚合根的业务方法更新资料
      currentAccount.updateProfile({
        displayName: profileData.displayName,
        avatar: profileData.avatar,
        bio: profileData.bio,
        location: profileData.location,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
      });

      // TODO: 调用后端 API 持久化更新
      // const accountService = await ApplicationService.getInstance();
      // await accountService.updateProfile(currentAccount.uuid, profileData);

      showSuccess('资料更新成功');
    } catch (error) {
      console.error('更新资料失败:', error);
      showError(`更新资料失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleRegistration = async (registrationData: RegistrationByUsernameAndPasswordForm) => {
    console.log('开始注册流程', registrationData);
    const accountService = await ApplicationService.getInstance();
    const registrationRequestDate: CreateAccountRequest = {
      username: registrationData.username,
      email: `${registrationData.username}@temp.com`, // 临时邮箱，后续需要绑定
      password: registrationData.password,
      displayName: registrationData.username,
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
