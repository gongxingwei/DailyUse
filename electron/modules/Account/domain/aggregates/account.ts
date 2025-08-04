import { AggregateRoot } from "@common/shared/domain/aggregateRoot";
import { User } from "../entities/user";
import { Email } from "../valueObjects/email";
import { PhoneNumber } from "../valueObjects/phoneNumber";
import { Address } from "../valueObjects/address";
import { AccountStatus, AccountType, IAccount, AccountDTO } from "../../../../../common/modules/account/types/account";
import { AccountRegisteredEvent } from "../events/accountEvents";

/**
 * Account 聚合根
 * 管理账号的核心身份信息和关联实体
 */
export class Account extends AggregateRoot implements IAccount {
  private _username: string;
  private _email?: Email;
  private _phoneNumber?: PhoneNumber;
  private _address?: Address;
  private _status: AccountStatus;
  private _accountType: AccountType;
  private _user: User;
  private _roleUuids: Set<string>;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt?: Date;
  private _emailVerificationToken?: string;
  private _phoneVerificationCode?: string;
  private _isEmailVerified: boolean;
  private _isPhoneVerified: boolean;

  /**
   * 构造函数（对象参数，自动生成时间相关字段）
   */
  constructor(params: {
    uuid?: string;
    username: string;
    accountType: AccountType;
    user: User;
    email?: Email;
    phoneNumber?: PhoneNumber;
    address?: Address;
    roleUuids?: Set<string>;
    status?: AccountStatus;
    emailVerificationToken?: string;
    phoneVerificationCode?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    lastLoginAt?: Date;
  }) {
    super(params.uuid || Account.generateId());
    this._username = params.username;
    this._email = params.email;
    this._phoneNumber = params.phoneNumber;
    this._address = params.address;
    this._status = params.status ?? AccountStatus.PENDING_VERIFICATION;
    this._accountType = params.accountType;
    this._user = params.user;
    this._roleUuids = params.roleUuids ?? new Set();
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._lastLoginAt = params.lastLoginAt;
    this._emailVerificationToken = params.emailVerificationToken;
    this._phoneVerificationCode = params.phoneVerificationCode;
    this._isEmailVerified = params.isEmailVerified ?? (params.email ? params.email.isVerified : false);
    this._isPhoneVerified = params.isPhoneVerified ?? (params.phoneNumber ? params.phoneNumber.isVerified : false);
  }

  // ======================== Getter/Setter ========================
  get username(): string { return this._username; }
  set username(value: string) { this._username = value; this._updatedAt = new Date(); }

  get email(): Email | undefined { return this._email; }
  set email(value: Email | undefined) { this._email = value; this._updatedAt = new Date(); }

  get phoneNumber(): PhoneNumber | undefined { return this._phoneNumber; }
  set phoneNumber(value: PhoneNumber | undefined) { this._phoneNumber = value; this._updatedAt = new Date(); }

  get address(): Address | undefined { return this._address; }
  set address(value: Address | undefined) { this._address = value; this._updatedAt = new Date(); }

  get status(): AccountStatus { return this._status; }
  set status(value: AccountStatus) { this._status = value; this._updatedAt = new Date(); }

  get accountType(): AccountType { return this._accountType; }
  set accountType(value: AccountType) { this._accountType = value; this._updatedAt = new Date(); }

  get user(): User { return this._user; }
  set user(value: User) { this._user = value; this._updatedAt = new Date(); }

  get roleIds(): Set<string> { return new Set(this._roleUuids); }
  set roleIds(value: Set<string>) { this._roleUuids = value; this._updatedAt = new Date(); }

  get createdAt(): Date { return this._createdAt; }
  set createdAt(value: Date) { this._createdAt = value; }

  get updatedAt(): Date { return this._updatedAt; }
  set updatedAt(value: Date) { this._updatedAt = value; }

  get lastLoginAt(): Date | undefined { return this._lastLoginAt; }
  set lastLoginAt(value: Date | undefined) { this._lastLoginAt = value; }

  get emailVerificationToken(): string | undefined { return this._emailVerificationToken; }
  set emailVerificationToken(value: string | undefined) { this._emailVerificationToken = value; }

  get phoneVerificationCode(): string | undefined { return this._phoneVerificationCode; }
  set phoneVerificationCode(value: string | undefined) { this._phoneVerificationCode = value; }

  get isEmailVerified(): boolean { return this._isEmailVerified; }
  set isEmailVerified(value: boolean) { this._isEmailVerified = value; }

  get isPhoneVerified(): boolean { return this._isPhoneVerified; }
  set isPhoneVerified(value: boolean) { this._isPhoneVerified = value; }
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

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'EmailUpdated',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, email: emailAddress, timestamp: this._updatedAt }
    });
  }

  /**
   * 更新手机号
   */
  updatePhone(phoneNumber: string, countryCode: string = '+86'): void {
    const newPhone = new PhoneNumber(phoneNumber, countryCode);
    this._phoneNumber = newPhone;
    this._updatedAt = new Date();

    // 如果账号已激活，更新手机号后需要重新验证
    if (this._status === AccountStatus.ACTIVE) {
      this._status = AccountStatus.PENDING_VERIFICATION;
    }

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'PhoneUpdated',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, phoneNumber: newPhone.fullNumber, timestamp: this._updatedAt }
    });
  }

  /**
   * 更新地址
   */
  updateAddress(address: Address): void {
    this._address = address;
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'AddressUpdated',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt }
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

    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'EmailVerified',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt }
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

    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'PhoneVerified',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt }
    });
  }

  static register(params: {
    username: string;
    accountType: AccountType;
    user: User;
    email?: Email;
    phoneNumber?: PhoneNumber;
    address?: Address;
    password?: string;
  }): Account {
    const newAccount = new Account(params);

    newAccount.addDomainEvent({
      aggregateId: newAccount.uuid,
      eventType: 'AccountRegistered',
      occurredOn: new Date(),
      payload: { accountUuid: newAccount.uuid, username: newAccount.username,
        password: params.password,
        email: newAccount.email?.value,
        phone: newAccount.phoneNumber?.fullNumber,
        accountType: newAccount.accountType,
        userUuid: newAccount.user.uuid,
        userProfile: {
          firstName: newAccount.user.firstName,
          lastName: newAccount.user.lastName,
          avatar: newAccount.user.avatar,
          bio: newAccount.user.bio
        },
        status: newAccount.status,
        createdAt: newAccount.createdAt,
        requiresAuthentication: true
       } as AccountRegisteredEvent['payload']
    });

    return newAccount;
  }

  /**
   * 禁用账号
   */
  disable(): void {
    this._status = AccountStatus.DISABLED;
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'AccountDisabled',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt }
    });
  }

  /**
   * 启用账号
   */
  enable(): void {
    this._status = AccountStatus.ACTIVE;
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'AccountEnabled',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt }
    });
  }

  /**
   * 暂停账号
   */
  suspend(): void {
    this._status = AccountStatus.SUSPENDED;
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'AccountSuspended',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt }
    });
  }

  /**
   * 添加角色
   */
  addRole(roleId: string): void {
    this._roleUuids.add(roleId);
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'RoleAdded',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, roleId, timestamp: this._updatedAt }
    });
  }

  /**
   * 移除角色
   */
  removeRole(roleId: string): void {
    this._roleUuids.delete(roleId);
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'RoleRemoved',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, roleId, timestamp: this._updatedAt }
    });
  }

  /**
   * 检查是否拥有某个角色
   */
  hasRole(roleId: string): boolean {
    return this._roleUuids.has(roleId);
  }

  /**
   * 记录登录时间
   */
  recordLogin(): void {
    this._lastLoginAt = new Date();
    this._updatedAt = this._lastLoginAt;

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'UserLoggedIn',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, timestamp: this._lastLoginAt }
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
  // ======================== 辅助方法 ========================

  /**
   * 判断对象是否为 Account 实例
   */
  static isAccount(obj: any): obj is Account {
    return (
      obj instanceof Account ||
      (obj &&
        typeof obj === "object" &&
        "uuid" in obj &&
        "username" in obj &&
        "user" in obj)
    );
  }

  /**
   * 保证返回 Account 实例或 null
   */
  static ensureAccount(account: IAccount | Account | null): Account | null {
    if (Account.isAccount(account)) {
      return account instanceof Account ? account : Account.fromDTO(account);
    } else {
      return null;
    }
  }

  /**
   * 保证返回 Account 实例，永不为 null
   */
  static ensureAccountNeverNull(account: IAccount | Account | null): Account {
    if (Account.isAccount(account)) {
      return account instanceof Account ? account : Account.fromDTO(account);
    } else {
      return Account.forCreate();
    }
  }

  /**
   * 转为接口数据（DTO）
   */
  toDTO(): AccountDTO {
    return {
      uuid: this.uuid,
      username: this.username,
      status: this.status,
      accountType: this.accountType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      email: this.email?.value,
      phone: this.phoneNumber?.fullNumber,
      emailVerificationToken: this.emailVerificationToken,
      phoneVerificationCode: this.phoneVerificationCode,
      roleIds: this.roleIds,
      isEmailVerified: this.isEmailVerified,
      isPhoneVerified: this.isPhoneVerified,
      user: this.user.toDTO(),
    };
  }

  /**
   * 从接口数据创建实例
   */
  static fromDTO(dto: AccountDTO): Account {
    const account = new Account({
      uuid: dto.uuid,
      username: dto.username,
      accountType: dto.accountType,
      user: User.fromDTO(dto.user),
      email: dto.email ? new Email(dto.email) : undefined,
      phoneNumber: dto.phone ? new PhoneNumber(dto.phone) : undefined,
      // 其它属性后续用 setter 恢复
    });
    account.createdAt = dto.createdAt ?? new Date();
    account.updatedAt = dto.updatedAt ?? new Date();
    account.lastLoginAt = dto.lastLoginAt;
    account.roleIds = dto.roleIds || new Set();
    account.emailVerificationToken = dto.emailVerificationToken;
    account.phoneVerificationCode = dto.phoneVerificationCode;
    account.status = dto.status;
    account.isEmailVerified = dto.isEmailVerified;
    account.isPhoneVerified = dto.isPhoneVerified;
    return account;
  }

  /**
   * 克隆当前对象（深拷贝）
   */
  clone(): Account {
    return Account.fromDTO(this.toDTO());
  }

  /**
   * 创建一个初始化对象（用于新建表单）
   */
  static forCreate(): Account {
    return new Account({
      username: "",
      accountType: AccountType.LOCAL,
      user: User.forCreate(),
    });
  }
}