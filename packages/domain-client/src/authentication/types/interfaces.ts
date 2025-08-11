import type {
  IMFADeviceCore,
  ISessionCore,
  ITokenCore,
  IPasswordCore,
  IAuthCredentialCore,
} from '@dailyuse/domain-core';

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

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}
