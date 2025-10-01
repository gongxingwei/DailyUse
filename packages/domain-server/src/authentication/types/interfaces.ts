import { AuthenticationContracts } from '@dailyuse/contracts';

// ======== MFA Device Types ========
type IMFADeviceCore = AuthenticationContracts.IMFADeviceCore;
type ISessionCore = AuthenticationContracts.ISessionCore;
type ITokenCore = AuthenticationContracts.ITokenCore;
type IPasswordCore = AuthenticationContracts.IPasswordCore;
type IAuthCredentialCore = AuthenticationContracts.IAuthCredentialCore;

// ======== MFA Device Server Interface ========
export interface IMFADeviceServer extends IMFADeviceCore {
  // Server-specific methods
  sendVerificationCode(): Promise<boolean>;
  validateWithExternalService(): Promise<boolean>;
  logSecurityEvent(event: string): Promise<void>;

  // Server identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== Session Server Interface ========
export interface ISessionServer extends ISessionCore {
  // Server-specific methods
  saveToDatabase(): Promise<void>;
  loadFromDatabase(uuid: string): Promise<ISessionServer | null>;
  logActivity(activity: string): Promise<void>;
  notifySecurityBreach(): Promise<void>;

  // Server identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== Token Server Interface ========
export interface ITokenServer extends ITokenCore {
  // Server-specific methods
  saveToDatabase(): Promise<void>;
  validateWithJWT(): Promise<boolean>;
  refreshToken(): Promise<ITokenServer>;

  // Server identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== Password Server Interface ========
export interface IPasswordServer extends IPasswordCore {
  // Server-specific methods
  hashWithBcrypt(plainPassword: string): Promise<string>;
  verifyWithBcrypt(plainPassword: string): Promise<boolean>;
  checkBreachDatabase(): Promise<boolean>;
  enforcePolicy(): Promise<boolean>;

  // Server identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== AuthCredential Server Interface ========
export interface IAuthCredentialServer extends IAuthCredentialCore {
  // Server-specific methods
  saveToDatabase(): Promise<void>;
  loadFromDatabase(uuid: string): Promise<IAuthCredentialServer | null>;
  sendAuthNotification(): Promise<void>;
  auditLogin(ipAddress: string, userAgent: string): Promise<void>;
  enforceSecurityPolicies(): Promise<void>;

  // Remember token methods
  createRememberToken(deviceInfo?: string): ITokenServer;

  // Server identification
  isServer(): boolean;
  isClient(): boolean;
}
