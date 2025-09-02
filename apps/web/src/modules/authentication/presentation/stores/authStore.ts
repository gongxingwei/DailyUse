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
  
});

// ===== 类型导出 =====
export type AuthStore = ReturnType<typeof useAuthStore>;
