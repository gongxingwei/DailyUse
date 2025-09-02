import { AggregateRoot } from '@dailyuse/utils';
import type { IAccountCore, AccountDTO } from '@dailyuse/contracts';
import {
  AccountStatus,
  AccountType,
} from '@dailyuse/contracts';
import { UserCore } from '../entities/UserCore';
import { EmailCore } from '../valueObjects/EmailCore';
import { PhoneNumberCore } from '../valueObjects/PhoneNumberCore';
import { AddressCore } from '../valueObjects/AddressCore';

/**
 * Account 核心基类 - 包含共享属性和基础计算
 * 前端和后端的具体实现继承此类
 */
export abstract class AccountCore extends AggregateRoot implements IAccountCore {
  protected _username: string;
  protected _email?: EmailCore;
  protected _phoneNumber?: PhoneNumberCore;
  protected _address?: AddressCore;
  protected _status: AccountStatus;
  protected _accountType: AccountType;
  protected _user: UserCore;
  protected _roleUuids: Set<string>;
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _lastLoginAt?: Date;
  protected _emailVerificationToken?: string;
  protected _phoneVerificationCode?: string;
  protected _isEmailVerified: boolean;
  protected _isPhoneVerified: boolean;

  constructor(params: {
    uuid?: string;
    username: string;
    accountType: AccountType;
    user: UserCore;
    email?: EmailCore;
    phoneNumber?: PhoneNumberCore;
    address?: AddressCore;
    roleUuids?: Set<string>;
    status?: AccountStatus;
    emailVerificationToken?: string;
    phoneVerificationCode?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    lastLoginAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._username = params.username;
    this._email = params.email;
    this._phoneNumber = params.phoneNumber;
    this._address = params.address;
    this._status = params.status ?? AccountStatus.PENDING_VERIFICATION;
    this._accountType = params.accountType;
    this._user = params.user;
    this._roleUuids = params.roleUuids ?? new Set();
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();
    this._lastLoginAt = params.lastLoginAt;
    this._emailVerificationToken = params.emailVerificationToken;
    this._phoneVerificationCode = params.phoneVerificationCode;
    this._isEmailVerified =
      params.isEmailVerified ?? (params.email ? params.email.isVerified : false);
    this._isPhoneVerified =
      params.isPhoneVerified ?? (params.phoneNumber ? params.phoneNumber.isVerified : false);
  }

  // ===== 共享只读属性 =====
  get username(): string {
    return this._username;
  }
  get email(): EmailCore | undefined {
    return this._email;
  }
  get phoneNumber(): PhoneNumberCore | undefined {
    return this._phoneNumber;
  }
  get address(): AddressCore | undefined {
    return this._address;
  }
  get status(): AccountStatus {
    return this._status;
  }
  get accountType(): AccountType {
    return this._accountType;
  }
  get user(): UserCore {
    return this._user;
  }
  get roleIds(): Set<string> {
    return new Set(this._roleUuids);
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }
  get emailVerificationToken(): string | undefined {
    return this._emailVerificationToken;
  }
  get phoneVerificationCode(): string | undefined {
    return this._phoneVerificationCode;
  }
  get isEmailVerified(): boolean {
    return this._isEmailVerified;
  }
  get isPhoneVerified(): boolean {
    return this._isPhoneVerified;
  }

  // ===== 共享计算属性 =====
  get hasEmail(): boolean {
    return this._email !== undefined;
  }

  get hasPhone(): boolean {
    return this._phoneNumber !== undefined;
  }

  get isFullyVerified(): boolean {
    const emailVerified = !this._email || this._isEmailVerified;
    const phoneVerified = !this._phoneNumber || this._isPhoneVerified;
    return emailVerified && phoneVerified;
  }

  get canLogin(): boolean {
    return this._status === AccountStatus.ACTIVE;
  }

  get hasRoles(): boolean {
    return this._roleUuids.size > 0;
  }

  get roleCount(): number {
    return this._roleUuids.size;
  }

  // ===== 共享业务规则校验 =====
  protected validateUsername(username: string): void {
    if (!username || username.trim().length === 0) {
      throw new Error('用户名不能为空');
    }
    if (username.length < 3) {
      throw new Error('用户名长度不能少于3个字符');
    }
    if (username.length > 50) {
      throw new Error('用户名长度不能超过50个字符');
    }
  }

  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('邮箱格式不正确');
    }
  }

  protected validatePhoneNumber(phone: string): void {
    const phoneRegex = /^\d{11}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('手机号格式不正确');
    }
  }

  // ===== 共享辅助方法 =====
  hasRole(roleId: string): boolean {
    return this._roleUuids.has(roleId);
  }

  hasAnyRole(roleIds: string[]): boolean {
    return roleIds.some((roleId) => this._roleUuids.has(roleId));
  }

  hasAllRoles(roleIds: string[]): boolean {
    return roleIds.every((roleId) => this._roleUuids.has(roleId));
  }

  // ===== 序列化方法 =====
  toDTO(): AccountDTO {
    return {
      uuid: this.uuid,
      username: this._username,
      status: this._status,
      accountType: this._accountType,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      lastLoginAt: this._lastLoginAt?.getTime(),
      email: this._email?.value,
      phone: this._phoneNumber?.fullNumber,
      emailVerificationToken: this._emailVerificationToken,
      phoneVerificationCode: this._phoneVerificationCode,
      roleIds: Array.from(this.roleIds),
      isEmailVerified: this._isEmailVerified,
      isPhoneVerified: this._isPhoneVerified,
      user: this._user.toDTO(),
    };
  }

  // ===== 抽象方法（由子类实现）=====
  abstract updateEmail(emailAddress: string): void;
  abstract updatePhone(phoneNumber: string, countryCode?: string): void;
  abstract verifyEmail(): void;
  abstract verifyPhone(): void;
}
