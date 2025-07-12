import { ref, computed, reactive } from "vue";
import { AccountApplicationService } from "../../application/services/accountApplicationService";

import type { User, AccountRegistrationRequest } from "../../index";
import { useSnackbar } from "@/shared/composables/useSnackbar";
 const { snackbar, showSuccess, showError, showInfo } = useSnackbar();

/**
 * 账号注册 Composable
 * 专门用于注册流程的状态管理
 */
export function useAccountRegistration(emit:any) {
    const accountApplicationService = AccountApplicationService.getInstance();


  const registrationData = reactive<AccountRegistrationRequest>({
    username: "",
    password: "",
    confirmPassword: "",
  });

  /**
   * 开始注册流程
   */
  const handleRegistration = async () => {
    const response = await accountApplicationService.register(registrationData)
    if (response.success && response.data) {
      showSuccess("注册成功");
      emit("registration-success", response.data);
    } else {
      showError("注册失败: " + response.message);
    }
  };



  return {
    snackbar,
    registrationData,
    handleRegistration,
  };
}

/**
 * 账号注销 Composable
 * 专门用于注销流程的状态管理
 */
export function useAccountDeactivation() {
  const deactivationStep = ref<"request" | "verification" | "complete">(
    "request"
  );
  const deactivationReason = ref("");

  /**
   * 开始注销流程
   */
  const startDeactivation = (reason: string) => {
    deactivationReason.value = reason;
    deactivationStep.value = "verification";
  };

  /**
   * 完成注销流程
   */
  const completeDeactivation = () => {
    deactivationStep.value = "complete";
  };

  /**
   * 重置注销流程
   */
  const resetDeactivation = () => {
    deactivationStep.value = "request";
    deactivationReason.value = "";
  };

  return {
    deactivationStep,
    deactivationReason,
    startDeactivation,
    completeDeactivation,
    resetDeactivation,
  };
}
