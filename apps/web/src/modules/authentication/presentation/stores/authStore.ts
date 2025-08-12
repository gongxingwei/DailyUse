import { defineStore } from 'pinia';
import { ref, computed, readonly, type Ref } from 'vue';
import { AuthApplicationService } from '../../application/services/AuthApplicationService';
import type {
  AuthStateDto,
  LoginRequestDto,
  RegistrationRequestDto,
  PasswordResetRequestDto,
  PasswordResetConfirmDto,
  TokenRefreshRequestDto,
  VerificationCodeRequestDto,
  VerificationCodeConfirmDto,
  LogoutRequestDto,
  PasswordChangeRequestDto,
  AuthOperationResultDto,
} from '../../application/dtos/AuthDtos';

/**
 * Authentication Store
 * 认证状态管理 - 使用Pinia管理认证状态和操作
 */
export const useAuthStore = defineStore('authentication', () => {
  // ===== State =====
  const authState: Ref<AuthStateDto | null> = ref(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const warnings = ref<string[]>([]);

  // 依赖注入：认证应用服务
  let authApplicationService: AuthApplicationService | null = null;

  // ===== Computed =====
  const isAuthenticated = computed(() => authState.value?.isAuthenticated || false);
  const currentUser = computed(() => authState.value?.user || null);
  const currentSession = computed(() => authState.value?.session || null);
  const permissions = computed(() => authState.value?.permissions || []);
  const lastActivity = computed(() => authState.value?.lastActivity || null);

  // ===== Actions =====

  /**
   * 设置认证应用服务（依赖注入）
   */
  function setAuthApplicationService(service: AuthApplicationService) {
    authApplicationService = service;
  }

  /**
   * 用户登录
   */
  async function login(loginData: LoginRequestDto): Promise<AuthOperationResultDto> {
    if (!authApplicationService) {
      throw new Error('AuthApplicationService not initialized');
    }

    isLoading.value = true;
    error.value = null;
    warnings.value = [];

    try {
      const result = await authApplicationService.login(loginData);

      if (result.success) {
        // 更新认证状态
        await loadAuthState();

        // 处理警告
        if (result.warnings) {
          warnings.value = result.warnings;
        }
      } else {
        error.value = result.message;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      error.value = errorMessage;
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 用户注册
   */
  async function register(
    registrationData: RegistrationRequestDto,
  ): Promise<AuthOperationResultDto> {
    if (!authApplicationService) {
      throw new Error('AuthApplicationService not initialized');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const result = await authApplicationService.register(registrationData);

      if (!result.success) {
        error.value = result.message;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      error.value = errorMessage;
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 刷新访问令牌
   */
  async function refreshToken(
    refreshData: TokenRefreshRequestDto,
  ): Promise<AuthOperationResultDto> {
    if (!authApplicationService) {
      throw new Error('AuthApplicationService not initialized');
    }

    try {
      const result = await authApplicationService.refreshToken(refreshData);

      if (result.success) {
        await loadAuthState();
      } else {
        error.value = result.message;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token refresh failed';
      error.value = errorMessage;
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      };
    }
  }

  /**
   * 用户登出
   */
  async function logout(logoutData?: LogoutRequestDto): Promise<AuthOperationResultDto> {
    if (!authApplicationService) {
      throw new Error('AuthApplicationService not initialized');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const result = await authApplicationService.logout(logoutData || {});

      if (result.success) {
        // 清除本地状态
        authState.value = null;
        error.value = null;
        warnings.value = [];
      } else {
        error.value = result.message;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      error.value = errorMessage;
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 发起密码重置
   */
  async function initiatePasswordReset(
    resetData: PasswordResetRequestDto,
  ): Promise<AuthOperationResultDto> {
    if (!authApplicationService) {
      throw new Error('AuthApplicationService not initialized');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const result = await authApplicationService.initiatePasswordReset(resetData);

      if (!result.success) {
        error.value = result.message;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      error.value = errorMessage;
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 确认密码重置
   */
  async function confirmPasswordReset(
    confirmData: PasswordResetConfirmDto,
  ): Promise<AuthOperationResultDto> {
    if (!authApplicationService) {
      throw new Error('AuthApplicationService not initialized');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const result = await authApplicationService.confirmPasswordReset(confirmData);

      if (result.success) {
        // 密码重置成功，清除当前会话
        authState.value = null;
      } else {
        error.value = result.message;
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Password reset confirmation failed';
      error.value = errorMessage;
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 修改密码
   */
  async function changePassword(
    changeData: PasswordChangeRequestDto,
  ): Promise<AuthOperationResultDto> {
    if (!authApplicationService) {
      throw new Error('AuthApplicationService not initialized');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const result = await authApplicationService.changePassword(changeData);

      if (!result.success) {
        error.value = result.message;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password change failed';
      error.value = errorMessage;
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 发送验证码
   */
  async function sendVerificationCode(
    codeData: VerificationCodeRequestDto,
  ): Promise<AuthOperationResultDto> {
    if (!authApplicationService) {
      throw new Error('AuthApplicationService not initialized');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const result = await authApplicationService.sendVerificationCode(codeData);

      if (!result.success) {
        error.value = result.message;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Send verification code failed';
      error.value = errorMessage;
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 验证验证码
   */
  async function verifyCode(
    verifyData: VerificationCodeConfirmDto,
  ): Promise<AuthOperationResultDto> {
    if (!authApplicationService) {
      throw new Error('AuthApplicationService not initialized');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const result = await authApplicationService.verifyCode(verifyData);

      if (!result.success) {
        error.value = result.message;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Code verification failed';
      error.value = errorMessage;
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 加载当前认证状态
   */
  async function loadAuthState(): Promise<void> {
    if (!authApplicationService) {
      return;
    }

    try {
      const state = await authApplicationService.getCurrentAuthState();
      authState.value = state;
    } catch (err) {
      console.error('Failed to load auth state:', err);
      authState.value = null;
    }
  }

  /**
   * 清除错误和警告
   */
  function clearMessages() {
    error.value = null;
    warnings.value = [];
  }

  /**
   * 检查是否有特定权限
   */
  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission);
  }

  /**
   * 检查是否有任一权限
   */
  function hasAnyPermission(permissionList: string[]): boolean {
    return permissionList.some((permission) => permissions.value.includes(permission));
  }

  /**
   * 检查是否有所有权限
   */
  function hasAllPermissions(permissionList: string[]): boolean {
    return permissionList.every((permission) => permissions.value.includes(permission));
  }

  /**
   * 获取用户角色
   */
  function getUserRoles(): string[] {
    return currentUser.value?.roles || [];
  }

  /**
   * 检查是否有特定角色
   */
  function hasRole(role: string): boolean {
    return getUserRoles().includes(role);
  }

  /**
   * 初始化认证状态（应用启动时调用）
   */
  async function initialize(): Promise<void> {
    await loadAuthState();
  }

  // ===== 返回store接口 =====
  return {
    // State
    authState: readonly(authState),
    isLoading: readonly(isLoading),
    error: readonly(error),
    warnings: readonly(warnings),

    // Computed
    isAuthenticated,
    currentUser,
    currentSession,
    permissions,
    lastActivity,

    // Actions
    setAuthApplicationService,
    login,
    register,
    refreshToken,
    logout,
    initiatePasswordReset,
    confirmPasswordReset,
    changePassword,
    sendVerificationCode,
    verifyCode,
    loadAuthState,
    clearMessages,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserRoles,
    hasRole,
    initialize,
  };
});

// ===== 类型导出 =====
export type AuthStore = ReturnType<typeof useAuthStore>;
