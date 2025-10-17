/**
 * Authentication Application Services Index
 * 认证应用服务索引文件
 *
 * 导出所有认证模块的应用服务
 */

export { AuthenticationApplicationService } from './AuthenticationApplicationService';
export type { LoginRequest, LoginResponse } from './AuthenticationApplicationService';

export { PasswordManagementApplicationService } from './PasswordManagementApplicationService';
export type {
  ChangePasswordRequest,
  ResetPasswordRequest,
  ChangePasswordResponse,
} from './PasswordManagementApplicationService';

export { SessionManagementApplicationService } from './SessionManagementApplicationService';
export type {
  RefreshSessionRequest,
  ValidateSessionRequest,
  TerminateSessionRequest,
  TerminateAllSessionsRequest,
  RefreshSessionResponse,
} from './SessionManagementApplicationService';

export { TwoFactorApplicationService } from './TwoFactorApplicationService';
export type {
  EnableTwoFactorRequest,
  DisableTwoFactorRequest,
  VerifyTwoFactorRequest,
  EnableTwoFactorResponse,
} from './TwoFactorApplicationService';

export { RememberMeApplicationService } from './RememberMeApplicationService';
export type {
  CreateRememberMeTokenRequest,
  ValidateRememberMeTokenRequest,
  RevokeRememberMeTokenRequest,
  CreateRememberMeTokenResponse,
} from './RememberMeApplicationService';

export { ApiKeyApplicationService } from './ApiKeyApplicationService';
export type {
  CreateApiKeyRequest,
  ValidateApiKeyRequest,
  RevokeApiKeyRequest,
  UpdateApiKeyScopesRequest,
  CreateApiKeyResponse,
} from './ApiKeyApplicationService';
