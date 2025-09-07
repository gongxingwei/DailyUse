import { AccountApplicationService } from "../..";
import { useSnackbar } from "@renderer/shared/composables/useSnackbar";
import { User } from "../../domain/entities/user";
export function useAccountService() {
  const accountService = AccountApplicationService.getInstance();
  const { snackbar, showError, showSuccess } = useSnackbar();
  const handleUpdateUserProfile = async (user: User) => {
    try {
      const result = await accountService.updateUserProfile(user);
      if (result.success) {
        showSuccess("用户信息更新成功");
      } else {
        showError(`更新用户信息失败：${result.message}`);
        throw new Error(result.message || "更新用户信息失败");
      }
    } catch (error) {
      showError((error as Error).message);
    }
  };

  return {
    snackbar,
    handleUpdateUserProfile,
  };
}
