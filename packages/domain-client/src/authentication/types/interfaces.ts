import { AuthenticationContracts } from '@dailyuse/contracts';

type IAuthCredentialCore = AuthenticationContracts.IAuthCredentialCore;
type IMFADeviceCore = AuthenticationContracts.IMFADeviceCore;
type ISessionCore = AuthenticationContracts.ISessionCore;
type ITokenCore = AuthenticationContracts.ITokenCore;
type IPasswordCore = AuthenticationContracts.IPasswordCore;

// ======== MFA Device Client Interface ========
export interface IMFADeviceClient extends IMFADeviceCore {
  // Client-specific methods
  renderQRCode(): Promise<string>;
  showActivationDialog(): Promise<boolean>;
  cacheVerificationCode(code: string): void;
  clearLocalCache(): void;

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== Session Client Interface ========
export interface ISessionClient extends ISessionCore {
  // Client-specific methods
  saveToLocalStorage(): void;
  loadFromLocalStorage(): ISessionClient | null;
  displayExpiryWarning(): void;
  autoRefresh(): Promise<boolean>;

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== Token Client Interface ========
export interface ITokenClient extends ITokenCore {
  // Client-specific methods
  saveToSecureStorage(): void;
  removeFromSecureStorage(): void;
  displayInUI(): string;
  copyToClipboard(): void;

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== Password Client Interface ========
export interface IPasswordClient extends IPasswordCore {
  // Client-specific methods
  validateStrength(): { score: number; feedback: string[] };
  showStrengthIndicator(): void;
  checkCommonPasswords(): boolean;
  generateSecurePassword(): string;

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== AuthCredential Client Interface ========
export interface IAuthCredentialClient extends IAuthCredentialCore {
  // Client-specific methods
  showLoginForm(): Promise<boolean>;
  displayMFAPrompt(): Promise<string>;
  cacheUserPreferences(): void;
  showAccountLockWarning(): void;

  // Remember token methods
  createRememberToken(deviceInfo?: string): ITokenClient;

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}
