import { Entity } from '@dailyuse/utils';

export enum MFADeviceType {
  EMAIL = 'email',
  SMS = 'sms',
  TOTP = 'totp',
  HARDWARE_TOKEN = 'hardware_token',
}

export enum MFADeviceStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export class MFADevice extends Entity {
  private _accountUuid: string;
  private _type: MFADeviceType;
  private _status: MFADeviceStatus;
  private _name: string;
  private _identifier: string; // email, phone number, or device identifier
  private _secret?: string; // for TOTP devices
  private _backupCodes?: string[];
  private _createdAt: Date;
  private _lastUsedAt?: Date;
  private _verifiedAt?: Date;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    type: MFADeviceType;
    name: string;
    identifier: string;
    secret?: string;
    backupCodes?: string[];
  }) {
    super(params.uuid);
    this._accountUuid = params.accountUuid;
    this._type = params.type;
    this._name = params.name;
    this._identifier = params.identifier;
    this._secret = params.secret;
    this._backupCodes = params.backupCodes;
    this._status = MFADeviceStatus.PENDING_VERIFICATION;
    this._createdAt = new Date();
  }

  get accountUuid(): string {
    return this._accountUuid;
  }

  get type(): MFADeviceType {
    return this._type;
  }

  get status(): MFADeviceStatus {
    return this._status;
  }

  get name(): string {
    return this._name;
  }

  get identifier(): string {
    return this._identifier;
  }

  get secret(): string | undefined {
    return this._secret;
  }

  get backupCodes(): string[] | undefined {
    return this._backupCodes;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get lastUsedAt(): Date | undefined {
    return this._lastUsedAt;
  }

  get verifiedAt(): Date | undefined {
    return this._verifiedAt;
  }

  get isActive(): boolean {
    return this._status === MFADeviceStatus.ACTIVE;
  }

  get isPendingVerification(): boolean {
    return this._status === MFADeviceStatus.PENDING_VERIFICATION;
  }

  verify(): void {
    if (this._status === MFADeviceStatus.PENDING_VERIFICATION) {
      this._status = MFADeviceStatus.ACTIVE;
      this._verifiedAt = new Date();
    }
  }

  disable(): void {
    this._status = MFADeviceStatus.DISABLED;
  }

  enable(): void {
    if (this._verifiedAt) {
      this._status = MFADeviceStatus.ACTIVE;
    }
  }

  updateName(name: string): void {
    this._name = name;
  }

  recordUsage(): void {
    this._lastUsedAt = new Date();
  }

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    this._backupCodes = codes;
    return codes;
  }

  isBackupCodeValid(code: string): boolean {
    return this._backupCodes?.includes(code.toUpperCase()) || false;
  }

  useBackupCode(code: string): boolean {
    if (this.isBackupCodeValid(code)) {
      this._backupCodes = this._backupCodes?.filter((c) => c !== code.toUpperCase());
      this.recordUsage();
      return true;
    }
    return false;
  }
}
