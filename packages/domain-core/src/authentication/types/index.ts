/**
 * Domain Core Authentication Types
 * 从 contracts 包重新导出认证相关的核心类型定义
 */

// 从 contracts 包重新导出所有认证核心类型
export {
  TokenType,
  MFADeviceType,
  SessionStatus,
  type IAuthCredentialCore,
  type IPasswordCore,
  type ISessionCore,
  type ITokenCore,
  type IMFADeviceCore,
  type AuthCredentialDTO,
  type SessionDTO,
  type TokenDTO,
  type MFADeviceDTO,
  type ClientInfo,
  type LoginRequest,
  type PasswordChangeRequest,
  type MFADeviceRegistrationRequest,
} from '@dailyuse/contracts';
