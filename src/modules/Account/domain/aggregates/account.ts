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
 * Account 聚合根
 * 管理账号的核心身份信息和关联实体
 * 
 * 构造参数说明：
 * - username: 用户名
 * - accountType: 账号类型
 * - user: 用户实体
 * - email?: 邮箱对象
 * - phoneNumber?: 手机号对象
 * - address?: 地址对象
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
   * 构造函数
   * @param params - 账号初始化参数
   * @example
   * new Account({
   *   username: "张三",
   *   accountType: AccountType.PERSONAL,
   *   user: new User(...),
   *   email: new Email("xxx@xx.com"),
   *   phoneNumber: new PhoneNumber("13800000000"),
   *   address: new Address(...),
   * })
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
  set username(value: string) {
    this._username = value;
    this._updatedAt = new Date();
  }

  get email(): Email | undefined { return this._email; }
  set email(value: Email | undefined) {
    this._email = value;
    this._updatedAt = new Date();
  }

  get phoneNumber(): PhoneNumber | undefined { return this._phoneNumber; }
  set phoneNumber(value: PhoneNumber | undefined) {
    this._phoneNumber = value;
    this._updatedAt = new Date();
  }

  get address(): Address | undefined { return this._address; }
  set address(value: Address | undefined) {
    this._address = value;
    this._updatedAt = new Date();
  }

  get status(): AccountStatus { return this._status; }
  set status(value: AccountStatus) {
    this._status = value;
    this._updatedAt = new Date();
  }

  get accountType(): AccountType { return this._accountType; }
  set accountType(value: AccountType) {
    this._accountType = value;
    this._updatedAt = new Date();
  }

  get user(): User { return this._user; }
  set user(value: User) {
    this._user = value;
    this._updatedAt = new Date();
  }

  get roleIds(): Set<string> { return new Set(this._roleUuids); }
  set roleIds(value: Set<string>) {
    this._roleUuids = value;
    this._updatedAt = new Date();
  }

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

  // ======================== 业务方法 ========================

  /**
   * 更新邮箱
   * @param emailAddress - 新邮箱地址
   */
  updateEmail(emailAddress: string): void {
    this.email = new Email(emailAddress);
    if (this.status === AccountStatus.ACTIVE) {
      this.status = AccountStatus.PENDING_VERIFICATION;
    }
  }

  /**
   * 更新手机号
   * @param phoneNumber - 新手机号
   * @param countryCode - 国家码
   */
  updatePhone(phoneNumber: string, countryCode: string = "+86"): void {
    this.phoneNumber = new PhoneNumber(phoneNumber, countryCode);
    if (this.status === AccountStatus.ACTIVE) {
      this.status = AccountStatus.PENDING_VERIFICATION;
    }
  }

  /**
   * 更新地址
   * @param address - 新地址对象
   */
  updateAddress(address: Address): void {
    this.address = address;
  }

  /**
   * 验证邮箱
   */
  verifyEmail(): void {
    if (!this.email) throw new Error("账号未设置邮箱");
    this.email = this.email.verify();
    this.emailVerificationToken = undefined;
    if (!this.phoneNumber || this.phoneNumber.isVerified) {
      this.status = AccountStatus.ACTIVE;
    }
  }

  /**
   * 验证手机号
   */
  verifyPhone(): void {
    if (!this.phoneNumber) throw new Error("账号未设置手机号");
    this.phoneNumber = this.phoneNumber.verify();
    this.phoneVerificationCode = undefined;
    if (!this.email || this.email.isVerified) {
      this.status = AccountStatus.ACTIVE;
    }
  }

  // ======================== 辅助方法 ========================

  /**
   * 判断对象是否为 Account 实例
   * @param obj - 任意对象
   * @returns 是否为 Account
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
   * @param account - 可能为 DTO、实体或 null
   * @returns Account 或 null
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
   * @param account - 可能为 DTO、实体或 null
   * @returns Account
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
   * @returns AccountDTO 对象
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
   * @param dto - AccountDTO 对象
   * @returns Account 实体
   * @example
   * Account.fromDTO(accountDTO)
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
    // 用 setter 恢复其它属性
    account.createdAt = dto.createdAt ? new Date(dto.createdAt) : new Date();
    account.updatedAt = dto.updatedAt ? new Date(dto.updatedAt) : new Date();
    account.lastLoginAt = dto.lastLoginAt ? new Date(dto.lastLoginAt) : undefined;
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
   * @returns Account 实体
   */
  clone(): Account {
    return Account.fromDTO(this.toDTO());
  }

  /**
   * 创建一个初始化对象（用于新建表单）
   * @returns Account 实体
   */
  static forCreate(): Account {
    return new Account({
      username: "",
      accountType: AccountType.LOCAL,
      user: User.forCreate(),
    });
  }
}