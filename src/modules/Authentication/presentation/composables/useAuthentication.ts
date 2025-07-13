import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { AuthenticationService } from "../../application/services/authenticationService";

import { useSnackbar } from "@/shared/composables/useSnackbar";
import type {
  PasswordAuthenticationRequest,
  PasswordAuthenticationResponse,
} from "@/modules/Authentication/domain/types";
const { snackbar, showError, showSuccess } = useSnackbar();
const authenticationService = AuthenticationService.getInstance();

// /**
//  * 认证管理 Composable
//  * 封装认证相关的响应式状态和操作方法
//  */
// export function useAuthentication() {
//   // 从服务获取响应式状态
//   const isAuthenticated = computed(() => authenticationApplicationService.isAuthenticated.value);
//   const currentSession = computed(() => authenticationApplicationService.currentSession.value);
//   const isLoading = computed(() => authenticationApplicationService.isLoading.value);
//   const error = computed(() => authenticationApplicationService.error.value);

//   // 凭证设置状态
//   const isCredentialSetupRequired = computed(() => authenticationApplicationService.isCredentialSetupRequired.value);
//   const credentialSetupContext = computed(() => authenticationApplicationService.credentialSetupContext.value);

//   // 验证状态
//   const isVerificationRequired = computed(() => authenticationApplicationService.isVerificationRequired.value);
//   const verificationContext = computed(() => authenticationApplicationService.verificationContext.value);

//   // 本地状态
//   const isLoggingIn = ref(false);
//   const isLoggingOut = ref(false);

//   /**
//    * 用户登出
//    */
//   const logout = async (sessionId?: string): Promise<TResponse> => {
//     isLoggingOut.value = true;

//     try {
//       const response = await authenticationApplicationService.logout(sessionId);
//       return response;
//     } finally {
//       isLoggingOut.value = false;
//     }
//   };

//   /**
//    * 验证会话
//    */
//   const verifySession = async (sessionId: string): Promise<TResponse> => {
//     return await authenticationApplicationService.verifySession(sessionId);
//   };

//   /**
//    * 设置认证凭证
//    */
//   const setupCredentials = async (credentialData: CredentialSetupRequest): Promise<TResponse> => {
//     return await authenticationApplicationService.setupCredentials(credentialData);
//   };

//   /**
//    * 提供认证验证
//    */
//   const provideVerification = async (verificationData: AuthenticationVerificationRequest): Promise<TResponse> => {
//     return await authenticationApplicationService.provideVerification(verificationData);
//   };

//   /**
//    * 取消认证凭证设置
//    */
//   const cancelCredentialSetup = (): void => {
//     authenticationApplicationService.cancelCredentialSetup();
//   };

//   /**
//    * 取消认证验证
//    */
//   const cancelVerification = (): void => {
//     authenticationApplicationService.cancelVerification();
//   };

//   /**
//    * 清理错误状态
//    */
//   const clearError = (): void => {
//     authenticationApplicationService.error.value = null;
//   };

//   /**
//    * 验证密码强度
//    */
//   const validatePasswordStrength = (password: string) => {
//     return authenticationApplicationService.validatePasswordStrength(password);
//   };

//   /**
//    * 获取当前用户token
//    */
//   const getCurrentToken = computed(() => {
//     return currentSession.value?.token;
//   });

//   /**
//    * 检查会话是否过期
//    */
//   const isSessionExpired = computed(() => {
//     if (!currentSession.value?.expiresAt) return false;
//     return Date.now() > currentSession.value.expiresAt;
//   });

//   return {
//     // 状态
//     isAuthenticated,
//     currentSession,
//     isLoading,
//     error,
//     isCredentialSetupRequired,
//     credentialSetupContext,
//     isVerificationRequired,
//     verificationContext,
//     isLoggingIn,
//     isLoggingOut,

//     // 计算属性
//     getCurrentToken,
//     isSessionExpired,

//     logout,
//     verifySession,
//     setupCredentials,
//     provideVerification,
//     cancelCredentialSetup,
//     cancelVerification,
//     clearError,
//     validatePasswordStrength
//   };
// }

/**
 * 登录表单 Composable
 * 专门用于登录表单的状态管理
 */
export function usePasswordAuthentication() {
  const router = useRouter();
  const loading = ref(false);
  const passwordAuthenticationForm = ref<PasswordAuthenticationRequest>({
    username: "Test1",
    password: "Llh123123",
    remember: false,
  });

  const formValid = ref(false);
  const showPassword = ref(false);

  /**
   * 重置表单
   */
  const resetForm = (): void => {
    passwordAuthenticationForm.value = {
      username: "",
      password: "",
      remember: false,
    };
    formValid.value = false;
    showPassword.value = false;
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

  const handleRemoveAccount = (username: string): void => {
    // 删除用户信息
    console.log(`Removing account: ${username}`);
  };
  const handleLocalLogin = async (): Promise<void> => {
    console.log("[useAuthentication]: handleLocalLogin");
    const response = await authenticationService.passwordAuthentication(
      passwordAuthenticationForm.value
    );
    if (response.success) {
      // 登录成功
      showSuccess("登录成功");
      // 跳转到首页
      router.push("/summary");
      console.log("🚀！！[useAuthentication]: 登录成功", response.data);
    } else {
      // 登录失败
      showError(response.message);
    }
  };

  return {
    loading,
    snackbar,
    passwordAuthenticationForm,
    formValid,
    showPassword,
    resetForm,
    handleLocalLogin,
    handleAccountSelect,
    handleRemoveAccount
  };
}
