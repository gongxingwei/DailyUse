import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { DateTime } from "../../../../shared/types/myDateTime";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";
import { User } from "../entities/user";
import { Email } from "../valueObjects/email";
import { PhoneNumber } from "../valueObjects/phoneNumber";
import { Address } from "../valueObjects/address";
import { AccountStatus, AccountType, IAccount } from "../types/account";

/**
 * Account 聚合根
 * 管理账号的核心身份信息和关联实体
 * 
 * 职责：
 * - 管理用户的核心身份信息（用户名、邮箱、手机号）
 * - 维护账号生命周期（注册、注销、资料修改）
 * - 处理账号状态（启用/禁用）和多设备绑定
 * - 不包含密码和认证凭证，仅管理身份信息
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
  private _createdAt: DateTime;
  private _updatedAt: DateTime;
  private _lastLoginAt?: DateTime;
  private _emailVerificationToken?: string;
  private _phoneVerificationCode?: string;

  constructor(
    id: string,
    username: string,
    accountType: AccountType,
    user: User,
    email?: Email,
    phoneNumber?: PhoneNumber
  ) {
    super(id);
    this._username = username;
    this._email = email;
    this._phoneNumber = phoneNumber;
    this._status = AccountStatus.PENDING_VERIFICATION;
    this._accountType = accountType;
    this._user = user;
    this._roleIds = new Set();
    this._createdAt = TimeUtils.now();
    this._updatedAt = TimeUtils.now();

    // 如果没有邮箱和手机号，直接激活本地账号
    if (accountType === AccountType.LOCAL && !email && !phoneNumber) {
      this._status = AccountStatus.ACTIVE;
    }
  }

  // Getters
  get username(): string {
    return this._username;
  }

  get email(): Email | undefined {
    return this._email;
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

  get createdAt(): DateTime {
    return this._createdAt;
  }

  get updatedAt(): DateTime {
    return this._updatedAt;
  }

  get lastLoginAt(): DateTime | undefined {
    return this._lastLoginAt;
  }

  /**
   * 更新邮箱
   */
  updateEmail(emailAddress: string): void {
    const newEmail = new Email(emailAddress);
    this._email = newEmail;
    this._updatedAt = TimeUtils.now();
    
    // 如果账号已激活，更新邮箱后需要重新验证
    if (this._status === AccountStatus.ACTIVE) {
      this._status = AccountStatus.PENDING_VERIFICATION;
    }

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'EmailUpdated',
      occurredOn: new Date(),
      payload: { accountId: this.id, email: emailAddress, timestamp: this._updatedAt }
    });
  }

  /**
   * 更新手机号
   */
  updatePhone(phoneNumber: string, countryCode: string = '+86'): void {
    const newPhone = new PhoneNumber(phoneNumber, countryCode);
    this._phoneNumber = newPhone;
    this._updatedAt = TimeUtils.now();

    // 如果账号已激活，更新手机号后需要重新验证
    if (this._status === AccountStatus.ACTIVE) {
      this._status = AccountStatus.PENDING_VERIFICATION;
    }

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'PhoneUpdated',
      occurredOn: new Date(),
      payload: { accountId: this.id, phoneNumber: newPhone.fullNumber, timestamp: this._updatedAt }
    });
  }

  /**
   * 更新地址
   */
  updateAddress(address: Address): void {
    this._address = address;
    this._updatedAt = TimeUtils.now();

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'AddressUpdated',
      occurredOn: new Date(),
      payload: { accountId: this.id, timestamp: this._updatedAt }
    });
  }

  /**
   * 验证邮箱
   */
  verifyEmail(): void {
    if (!this._email) {
      throw new Error('账号未设置邮箱');
    }

    this._email = this._email.verify();
    this._emailVerificationToken = undefined;
    
    // 如果手机号也已验证或不存在，则激活账号
    if (!this._phoneNumber || this._phoneNumber.isVerified) {
      this._status = AccountStatus.ACTIVE;
    }

    this._updatedAt = TimeUtils.now();

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'EmailVerified',
      occurredOn: new Date(),
      payload: { accountId: this.id, timestamp: this._updatedAt }
    });
  }

  /**
   * 验证手机号
   */
  verifyPhone(): void {
    if (!this._phoneNumber) {
      throw new Error('账号未设置手机号');
    }

    this._phoneNumber = this._phoneNumber.verify();
    this._phoneVerificationCode = undefined;
    
    // 如果邮箱也已验证或不存在，则激活账号
    if (!this._email || this._email.isVerified) {
      this._status = AccountStatus.ACTIVE;
    }

    this._updatedAt = TimeUtils.now();

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'PhoneVerified',
      occurredOn: new Date(),
      payload: { accountId: this.id, timestamp: this._updatedAt }
    });
  }

  /**
   * 禁用账号
   */
  disable(): void {
    this._status = AccountStatus.DISABLED;
    this._updatedAt = TimeUtils.now();

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'AccountDisabled',
      occurredOn: new Date(),
      payload: { accountId: this.id, timestamp: this._updatedAt }
    });
  }

  /**
   * 启用账号
   */
  enable(): void {
    this._status = AccountStatus.ACTIVE;
    this._updatedAt = TimeUtils.now();

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'AccountEnabled',
      occurredOn: new Date(),
      payload: { accountId: this.id, timestamp: this._updatedAt }
    });
  }

  /**
   * 暂停账号
   */
  suspend(): void {
    this._status = AccountStatus.SUSPENDED;
    this._updatedAt = TimeUtils.now();

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'AccountSuspended',
      occurredOn: new Date(),
      payload: { accountId: this.id, timestamp: this._updatedAt }
    });
  }

  /**
   * 添加角色
   */
  addRole(roleId: string): void {
    this._roleIds.add(roleId);
    this._updatedAt = TimeUtils.now();

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'RoleAdded',
      occurredOn: new Date(),
      payload: { accountId: this.id, roleId, timestamp: this._updatedAt }
    });
  }

  /**
   * 移除角色
   */
  removeRole(roleId: string): void {
    this._roleIds.delete(roleId);
    this._updatedAt = TimeUtils.now();

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'RoleRemoved',
      occurredOn: new Date(),
      payload: { accountId: this.id, roleId, timestamp: this._updatedAt }
    });
  }

  /**
   * 检查是否拥有某个角色
   */
  hasRole(roleId: string): boolean {
    return this._roleIds.has(roleId);
  }

  /**
   * 记录登录时间
   */
  recordLogin(): void {
    this._lastLoginAt = TimeUtils.now();
    this._updatedAt = this._lastLoginAt;

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'UserLoggedIn',
      occurredOn: new Date(),
      payload: { accountId: this.id, timestamp: this._lastLoginAt }
    });
  }

  /**
   * 检查账号是否可以登录
   */
  canLogin(): boolean {
    return this._status === AccountStatus.ACTIVE;
  }

  /**
   * 生成邮箱验证令牌
   */
  generateEmailVerificationToken(): string {
    this._emailVerificationToken = Math.random().toString(36).substring(2, 15);
    return this._emailVerificationToken;
  }

  /**
   * 生成手机验证码
   */
  generatePhoneVerificationCode(): string {
    this._phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    return this._phoneVerificationCode;
  }

  /**
   * 验证邮箱令牌
   */
  validateEmailToken(token: string): boolean {
    return this._emailVerificationToken === token;
  }

  /**
   * 验证手机验证码
   */
  validatePhoneCode(code: string): boolean {
    return this._phoneVerificationCode === code;
  }
}
