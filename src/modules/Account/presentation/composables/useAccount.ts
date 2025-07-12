import { ref, computed, reactive } from "vue";
import { accountApplicationService } from "../../application/services/rendererAccountApplicationService";

import type { User, AccountRegistrationRequest } from "../../index";
import type { TResponse } from "@/shared/types/response";
import { useSnackbar } from "@/shared/composables/useSnackbar";
 const { snackbar, showSuccess, showError, showInfo } = useSnackbar();
/**
 * 账号管理 Composable
 * 封装账号相关的响应式状态和操作方法
 */
export function useAccount() {
  // 从服务获取响应式状态
 
  const currentUser = computed(
    () => accountApplicationService.currentUser.value
  );
  const isLoading = computed(() => accountApplicationService.isLoading.value);
  const error = computed(() => accountApplicationService.error.value);

  // 本地状态
  const isRegistering = ref(false);
  const isUpdating = ref(false);
  const isDeactivating = ref(false);

  /**
   * 注册新账号
   */
  const registerAccount = async (
    registrationData: AccountRegistrationRequest
  ): Promise<TResponse<User>> => {
    isRegistering.value = true;

    try {
      const response = await accountApplicationService.registerAccount(
        registrationData
      );
      return response;
    } finally {
      isRegistering.value = false;
    }
  };

  /**
   * 获取当前用户信息
   */
  const getCurrentUser = async (): Promise<TResponse<User>> => {
    return await accountApplicationService.getCurrentUser();
  };

  /**
   * 更新用户信息
   */
  const updateUserInfo = async (
    userData: Partial<User>
  ): Promise<TResponse<User>> => {
    isUpdating.value = true;

    try {
      const response = await accountApplicationService.updateUserInfo(userData);
      return response;
    } finally {
      isUpdating.value = false;
    }
  };

  // /**
  //  * 请求账号注销
  //  */
  // const requestAccountDeactivation = async (deactivationData: AccountDeactivationRequest): Promise<TResponse> => {
  //   isDeactivating.value = true;

  //   try {
  //     const response = await accountApplicationService.requestAccountDeactivation(deactivationData);
  //     return response;
  //   } finally {
  //     isDeactivating.value = false;
  //   }
  // };

  /**
   * 清理错误状态
   */
  const clearError = (): void => {
    accountApplicationService.clearState();
  };

  /**
   * 验证用户名
   */
  const validateUsername = (username: string) => {
    return accountApplicationService.validateUsername(username);
  };

  /**
   * 验证邮箱
   */
  const validateEmail = (email: string) => {
    return accountApplicationService.validateEmail(email);
  };

  /**
   * 验证手机号
   */
  const validatePhone = (phone: string) => {
    return accountApplicationService.validatePhone(phone);
  };

  /**
   * 检查用户是否已登录
   */
  const isLoggedIn = computed(() => !!currentUser.value);

  /**
   * 获取用户显示名称
   */
  const displayName = computed(() => {
    if (!currentUser.value) return "";

    const { firstName, lastName, username } = currentUser.value;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else {
      return username;
    }
  });

  /**
   * 获取用户头像URL
   */
  const avatarUrl = computed(() => {
    return currentUser.value?.avatar || "";
  });

  /**
   * 检查账号状态
   */
  const accountStatus = computed(() => {
    return currentUser.value?.status;
  });

  /**
   * 检查账号类型
   */
  const accountType = computed(() => {
    return currentUser.value?.accountType;
  });

  return {
    // 状态
    currentUser,
    isLoading,
    error,
    isRegistering,
    isUpdating,
    isDeactivating,

    // 计算属性
    isLoggedIn,
    displayName,
    avatarUrl,
    accountStatus,
    accountType,

    // 方法
    registerAccount,
    getCurrentUser,
    updateUserInfo,
    clearError,
    validateUsername,
    validateEmail,
    validatePhone,
  };
}

/**
 * 账号注册 Composable
 * 专门用于注册流程的状态管理
 */
export function useAccountRegistration() {
  const registrationStep = ref<"form" | "credentials" | "complete">("form");

  const registrationData = reactive<AccountRegistrationRequest>({
    username: "",
    firstName: "",
    lastName: "",
    sex: "",
  });

  /**
   * 开始注册流程
   */
  const startRegistration = () => {
    accountApplicationService
      .registerAccount(registrationData)
      .then((res) => {
        if (res.success) {
          showSuccess("注册成功，请设置认证凭证");
          registrationStep.value = "credentials";
        } else {
          showError(res.message || "注册失败");
        }
      })
      .catch((error) => {
        showError(error.message || "注册过程中发生错误");
      });

    registrationStep.value = "credentials";
  };

  /**
   * 完成注册流程
   */
  const completeRegistration = () => {
    registrationStep.value = "complete";
  };

  /**
   * 重置注册流程
   */
  const resetRegistration = () => {
    registrationStep.value = "form";
  };

  return {
    snackbar,
    registrationStep,
    registrationData,
    startRegistration,
    completeRegistration,
    resetRegistration,
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
