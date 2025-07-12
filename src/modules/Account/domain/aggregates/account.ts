import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { User } from "../entities/user";
import { Email } from "../valueObjects/email";
import { PhoneNumber } from "../valueObjects/phoneNumber";
import { Address } from "../valueObjects/address";
import {
  AccountStatus,
  AccountType,
  IAccount,
  AccountDTO,
} from "../types/account";

/**
 * ！！！渲染进程！！！
 * Account 聚合根
 * 管理账号的核心身份信息和关联实体
 *
 * 职责：
 * - 管理用户的核心身份信息（用户名、邮箱、手机号）
 */
export class Account extends AggregateRoot implements IAccount {
  private _username: string;
  private _email?: Email;
  private _phoneNumber?: PhoneNumber;
  private _address?: Address;
  private _status: AccountStatus;
  private _accountType: AccountType;
  private _user: User;
  private _roleIds: Set<string>; // 角色ID集合
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt?: Date;
  private _emailVerificationToken?: string;
  private _phoneVerificationCode?: string;
  private _isEmailVerified: boolean;
  private _isPhoneVerified: boolean;

  constructor(
    username: string,
    accountType: AccountType,
    user: User,
    _password?: string,
    id?: string,
    email?: Email,

    phoneNumber?: PhoneNumber,
    createdAt?: Date,
    updatedAt?: Date,
    lastLoginAt?: Date,
    _isRegistration: boolean = false
  ) {
    super(id || Account.generateId());
    this._username = username;
    this._email = email;
    this._phoneNumber = phoneNumber;
    this._status = AccountStatus.PENDING_VERIFICATION;
    this._accountType = accountType;
    this._user = user;
    this._roleIds = new Set();
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._lastLoginAt = lastLoginAt;
    this._isEmailVerified = email ? email.isVerified : false;
    this._isPhoneVerified = phoneNumber ? phoneNumber.isVerified : false;
  }

  get username(): string {
    return this._username;
  }

  get email(): Email | undefined {
    return this._email;
  }

  get emailVerificationToken(): string | undefined {
    return this._emailVerificationToken;
  }

  get isEmailVerified(): boolean {
    return this._isEmailVerified;
  }
  get phoneVerificationCode(): string | undefined {
    return this._phoneVerificationCode;
  }

  get isPhoneVerified(): boolean {
    return this._isPhoneVerified;
  }
  get phoneNumber(): PhoneNumber | undefined {
    return this._phoneNumber;
  }

  get address(): Address | undefined {
    return this._address;
  }

  get status(): AccountStatus {
    return this._status;
  }

  get accountType(): AccountType {
    return this._accountType;
  }

  get user(): User {
    return this._user;
  }

  get roleIds(): Set<string> {
    return new Set(this._roleIds);
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

  set phoneVerificationCode(code: string | undefined) {
    this._phoneVerificationCode = code;
  }

  set emailVerificationToken(token: string | undefined) {
    this._emailVerificationToken = token;
  }

  set status(status: AccountStatus) {
    this._status = status;
  }

  set isEmailVerified(isVerified: boolean) {
    this._isEmailVerified = isVerified;
  }

  set isPhoneVerified(isVerified: boolean) {
    this._isPhoneVerified = isVerified;
  }
  set roleIds(roleIds: Set<string>) {
    this._roleIds = roleIds;
  }

  set user(user: User) {
    this._user = user;
  }

  /**
   * 更新邮箱
   */
  updateEmail(emailAddress: string): void {
    const newEmail = new Email(emailAddress);
    this._email = newEmail;
    this._updatedAt = new Date();

    // 如果账号已激活，更新邮箱后需要重新验证
    if (this._status === AccountStatus.ACTIVE) {
      this._status = AccountStatus.PENDING_VERIFICATION;
    }
  }

  /**
   * 更新手机号
   */
  updatePhone(phoneNumber: string, countryCode: string = "+86"): void {
    const newPhone = new PhoneNumber(phoneNumber, countryCode);
    this._phoneNumber = newPhone;
    this._updatedAt = new Date();

    // 如果账号已激活，更新手机号后需要重新验证
    if (this._status === AccountStatus.ACTIVE) {
      this._status = AccountStatus.PENDING_VERIFICATION;
    }
  }

  /**
   * 更新地址
   */
  updateAddress(address: Address): void {
    this._address = address;
    this._updatedAt = new Date();
  }

  /**
   * 验证邮箱
   */
  verifyEmail(): void {
    if (!this._email) {
      throw new Error("账号未设置邮箱");
    }

    this._email = this._email.verify();
    this._emailVerificationToken = undefined;

    // 如果手机号也已验证或不存在，则激活账号
    if (!this._phoneNumber || this._phoneNumber.isVerified) {
      this._status = AccountStatus.ACTIVE;
    }

    this._updatedAt = new Date();
  }

  /**
   * 验证手机号
   */
  verifyPhone(): void {
    if (!this._phoneNumber) {
      throw new Error("账号未设置手机号");
    }

    this._phoneNumber = this._phoneNumber.verify();
    this._phoneVerificationCode = undefined;

    // 如果邮箱也已验证或不存在，则激活账号
    if (!this._email || this._email.isVerified) {
      this._status = AccountStatus.ACTIVE;
    }

    this._updatedAt = new Date();
  }
  toDTO(): AccountDTO {
    let user = this.user.toDTO();
    let accountDTO = {
      id: this.id,
      username: this.username,
      status: this.status,
      accountType: this.accountType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      email: this.email?.value,
      phone: this.phoneNumber?.fullNumber,
      _emailVerificationToken: this._emailVerificationToken,
      phoneVerificationCode: this.phoneVerificationCode,
      roleIds: this.roleIds,
      isEmailVerified: this.isEmailVerified,
      isPhoneVerified: this.isPhoneVerified,
      user: user,
    };
    console.log("将账号数据转换为DTO", accountDTO);
    return accountDTO;
  }

  static fromDTO(dto: AccountDTO): Account {
    const account = new Account(
      dto.username,
      dto.accountType,
      User.fromDTO(dto.user),
      undefined,
      dto.id,
      dto.email ? new Email(dto.email) : undefined,
      dto.phone ? new PhoneNumber(dto.phone) : undefined,
      dto.createdAt,
      dto.updatedAt,
      dto.lastLoginAt
    );
    account.roleIds = dto.roleIds || new Set();
    account.emailVerificationToken = dto.emailVerificationToken;
    account.phoneVerificationCode = dto.phoneVerificationCode;
    account.status = dto.status;
    account.isEmailVerified = dto.isEmailVerified;
    account.isPhoneVerified = dto.isPhoneVerified;

    return account;
  }
}
