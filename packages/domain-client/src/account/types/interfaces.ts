import type {
  IAccountCore,
  IUserCore,
  IPermissionCore,
  IRoleCore,
  IAddressCore,
  IEmailCore,
  IPhoneNumberCore,
  ISexCore,
} from '@dailyuse/domain-core';

// ======== Account Client Interface ========
export interface IAccountClient extends IAccountCore {
  // Client-specific methods
  showProfile(): void;
  updateProfileInUI(data: any): void;
  cacheAccountData(): void;
  syncWithServer(): Promise<boolean>;

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== User Client Interface ========
export interface IUserClient extends IUserCore {
  // Client-specific methods
  displayAvatar(): string;
  showProfile(): void;
  showUserSettings(): void;
  updateLastActivity(): void;
  cacheUserSession(): void;
  updateProfileInUI(data: any): void;
  cacheUserData(): void;
  formatForDisplay(): string;

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== Permission Client Interface ========
export interface IPermissionClient extends IPermissionCore {
  // Client-specific methods
  checkUIVisibility(): boolean;
  showPermissionDialog(): Promise<boolean>;
  cachePermissions(): void;

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== Role Client Interface ========
export interface IRoleClient extends IRoleCore {
  // Client-specific methods
  displayRoleBadge(): string;
  showRolePermissions(): void;
  getUIPermissions(): string[];

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== Address Client Interface ========
export interface IAddressClient extends IAddressCore {
  // Client-specific methods
  formatForDisplay(): string;
  showOnMap(): void;
  validateInput(): boolean;
  autoComplete(input: string): Promise<string[]>;

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== Email Client Interface ========
export interface IEmailClient extends IEmailCore {
  // Client-specific methods
  showVerificationDialog(): Promise<boolean>;
  copyToClipboard(): void;
  validateFormat(): { valid: boolean; message: string };
  suggestCorrection(input: string): string | null;

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== PhoneNumber Client Interface ========
export interface IPhoneNumberClient extends IPhoneNumberCore {
  // Client-specific methods
  formatForDisplay(): string;
  showVerificationDialog(): Promise<boolean>;
  copyToClipboard(): void;
  validateInput(): { valid: boolean; message: string };

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}

// ======== Sex Client Interface ========
export interface ISexClient extends ISexCore {
  // Client-specific methods
  getDisplayText(): string;
  getIcon(): string;
  showSelectionDialog(): Promise<boolean>;

  // Client identification
  isServer(): boolean;
  isClient(): boolean;
}
