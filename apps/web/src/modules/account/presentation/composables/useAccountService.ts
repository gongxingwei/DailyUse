import { type RegistrationForm } from '@/tempTypes';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { ApplicationService } from '../../application/services/ApplicationService';
export function useAccountService() {

    const { snackbar, showSuccess, showError } = useSnackbar();
    // 更新用户信息
    const handleUpdateUserProfile = async () => {
       console.log("更新用户信息");
    };

    const handleRegistration = async (registrationData: RegistrationForm) => {
        console.log("开始注册流程", registrationData);
        const accountService = await ApplicationService.getInstance();
        const response = await accountService.register(registrationData);
        if (response) {
          showSuccess("注册成功");
        } else {
          showError("注册失败: " + response.message);
        }
        
    }

    return {
        snackbar,
        handleUpdateUserProfile,
        handleRegistration,
    };
}