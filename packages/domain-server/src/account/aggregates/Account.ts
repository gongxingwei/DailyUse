import { AccountCore } from '@dailyuse/domain-core';
import { User } from '../entities/User';
import { Email } from '../valueObjects/Email';
import { PhoneNumber } from '../valueObjects/PhoneNumber';
import { Address } from '../valueObjects/Address';
import { AccountContracts, sharedContracts } from '@dailyuse/contracts';

type AccountPersistenceDTO = AccountContracts.AccountPersistenceDTO;
type AccountType = AccountContracts.AccountType;
type AccountStatus = AccountContracts.AccountStatus;
type IAccount = AccountContracts.IAccountServer;

const AccountType = AccountContracts.AccountType;
const AccountStatus = AccountContracts.AccountStatus;

/**
 * 服务端账号聚合根 - 包含完整的业务逻辑
 * 数据持久化、业务规则验证、安全策略等
 */
export class Account extends AccountCore implements IAccount {
  isClient(): boolean {
    return false;
  }
  isServer(): boolean {
    return true;
  }
  // ===== 服务端专用业务方法 =====

  /**
   * 更新邮箱 - 服务端版本包含业务逻辑和事件发布
   */
  updateEmail(emailAddress: string): void {
    this.validateEmail(emailAddress);

    const newEmail = new Email(emailAddress);
    this._email = newEmail;
    this._updatedAt = new Date();

    // 邮箱更改后需要重新验证
    this._isEmailVerified = false;
    this._emailVerificationToken = this.generateEmailVerificationToken();

    // 如果账号已激活，更新邮箱后需要重新验证
    if (this._status === AccountStatus.ACTIVE) {
      this._status = AccountStatus.PENDING_VERIFICATION;
    }

    // 发布领域事件
    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'EmailUpdated',
      occurredOn: new Date(),
      payload: {
        accountUuid: this.uuid,
        oldEmail: this._email?.value,
        newEmail: emailAddress,
        timestamp: this._updatedAt,
      },
    });
  }

  /**
   * 更新手机号 - 服务端版本
   */
  updatePhone(phoneNumber: string, countryCode: string = '+86'): void {
    this.validatePhoneNumber(phoneNumber);

    const newPhone = new PhoneNumber(phoneNumber, countryCode);
    this._phoneNumber = newPhone;
    this._updatedAt = new Date();

    // 手机号更改后需要重新验证
    this._isPhoneVerified = false;
    this._phoneVerificationCode = this.generatePhoneVerificationCode();

    // 如果账号已激活，更新手机号后需要重新验证
    if (this._status === AccountStatus.ACTIVE) {
      this._status = AccountStatus.PENDING_VERIFICATION;
    }

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'PhoneUpdated',
      occurredOn: new Date(),
      payload: {
        accountUuid: this.uuid,
        phoneNumber: newPhone.fullNumber,
        timestamp: this._updatedAt,
      },
    });
  }

  /**
   * 验证邮箱 - 服务端版本包含状态更新逻辑
   */
  verifyEmail(): void {
    if (!this._email) {
      throw new Error('账号未设置邮箱');
    }

    this._email = this._email.verify();
    this._isEmailVerified = true;
    this._emailVerificationToken = undefined;

    // 检查是否可以激活账号
    this.checkAndActivateAccount();

    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'EmailVerified',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt },
    });
  }

  /**
   * 验证手机号 - 服务端版本
   */
  verifyPhone(): void {
    if (!this._phoneNumber) {
      throw new Error('账号未设置手机号');
    }

    this._phoneNumber = this._phoneNumber.verify();
    this._isPhoneVerified = true;
    this._phoneVerificationCode = undefined;

    // 检查是否可以激活账号
    this.checkAndActivateAccount();

    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'PhoneVerified',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt },
    });
  }

  // ===== 服务端专用业务方法 =====

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
      payload: { accountUuid: this.uuid, timestamp: this._lastLoginAt },
    });
  }

  /**
   * 更新地址 - 服务端版本
   */
  updateAddress(address: Address): void {
    this._address = address;
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'AddressUpdated',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt },
    });
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
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt },
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
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt },
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
      payload: { accountUuid: this.uuid, timestamp: this._updatedAt },
    });
  }

  /**
   * 添加角色
   */
  addRole(roleId: string): void {
    if (this._roleUuids.has(roleId)) {
      return; // 已存在，不重复添加
    }

    this._roleUuids.add(roleId);
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'RoleAdded',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, roleId, timestamp: this._updatedAt },
    });
  }

  /**
   * 移除角色
   */
  removeRole(roleId: string): void {
    if (!this._roleUuids.has(roleId)) {
      return; // 不存在，无需移除
    }

    this._roleUuids.delete(roleId);
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'RoleRemoved',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, roleId, timestamp: this._updatedAt },
    });
  }

  /**
   * 生成邮箱验证令牌
   */
  generateEmailVerificationToken(): string {
    this._emailVerificationToken =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

  // ===== 私有辅助方法 =====

  /**
   * 检查并激活账号
   */
  private checkAndActivateAccount(): void {
    const emailVerified = !this._email || this._isEmailVerified;
    const phoneVerified = !this._phoneNumber || this._isPhoneVerified;

    if (emailVerified && phoneVerified && this._status === AccountStatus.PENDING_VERIFICATION) {
      this._status = AccountStatus.ACTIVE;
    }
  }

  // ===== 服务端专用工厂方法 =====

  /**
   * 注册新账号
   */
  static register(params: {
    username: string;
    accountType: AccountType;
    email?: Email;
    phoneNumber?: PhoneNumber;
    password?: string;
  }): Account {
    const user = User.create({});
    const accountParams = {
      username: params.username,
      accountType: params.accountType,
      email: params.email,
      phoneNumber: params.phoneNumber,
      password: params.password,
      user: user,
    };
    const newAccount = new Account(accountParams);

    newAccount.addDomainEvent({
      aggregateId: newAccount.uuid,
      eventType: 'AccountRegistered',
      occurredOn: new Date(),
      payload: {
        accountUuid: newAccount.uuid,
        username: newAccount.username,
        password: params.password,
        email: newAccount.email?.value,
        phone: newAccount.phoneNumber?.fullNumber,
        accountType: newAccount.accountType,
        userUuid: newAccount.user.uuid,
        userProfile: {
          firstName: newAccount.user.firstName,
          lastName: newAccount.user.lastName,
          avatar: newAccount.user.avatar,
          bio: newAccount.user.bio,
        },
        status: newAccount.status,
        createdAt: newAccount.createdAt,
        requiresAuthentication: true,
      },
    });

    return newAccount;
  }

  /**
   * 从DTO数据创建实例
   */
  static fromDTO(data: any): Account {
    return Account.fromPersistence(data);
  }

  /**
   * 从持久化 DTO 创建实例
   * 专门处理来自仓储层的持久化 DTO 数据
   */
  static fromPersistenceDTO(persistenceDTO: AccountPersistenceDTO): Account {
    // 创建 User 实体 (从 userUuid 加载，这里简化处理)
    const user = new User({ firstName: '', lastName: '' });

    return new Account({
      uuid: persistenceDTO.uuid,
      username: persistenceDTO.username,
      accountType: persistenceDTO.accountType,
      user,
      email: persistenceDTO.email ? Email.fromValue(persistenceDTO.email) : undefined,
      phoneNumber: persistenceDTO.phone ? PhoneNumber.fromValue(persistenceDTO.phone) : undefined,
      status: persistenceDTO.status,
      isEmailVerified: persistenceDTO.isEmailVerified === 1,
      isPhoneVerified: persistenceDTO.isPhoneVerified === 1,
      createdAt: new Date(persistenceDTO.createdAt),
      updatedAt: new Date(persistenceDTO.updatedAt),
      lastLoginAt: persistenceDTO.lastLoginAt ? new Date(persistenceDTO.lastLoginAt) : undefined,
      emailVerificationToken: persistenceDTO.emailVerificationToken,
      phoneVerificationCode: persistenceDTO.phoneVerificationCode,
      roleUuids: new Set([]),
    });
  }

  /**
   * 字符串账户类型转换为枚举
   */
  private static mapStringToAccountType(type: string): AccountType {
    switch (type) {
      case 'local':
        return AccountType.LOCAL;
      case 'online':
        return AccountType.ONLINE;
      case 'guest':
        return AccountType.GUEST;
      default:
        return AccountType.LOCAL;
    }
  }

  /**
   * 字符串账户状态转换为枚举
   */
  private static mapStringToAccountStatus(status: string): AccountStatus {
    switch (status) {
      case 'active':
        return AccountStatus.ACTIVE;
      case 'disabled':
        return AccountStatus.DISABLED;
      case 'suspended':
        return AccountStatus.SUSPENDED;
      case 'pending_verification':
        return AccountStatus.PENDING_VERIFICATION;
      default:
        return AccountStatus.ACTIVE;
    }
  }

  /**
   * 从持久化数据创建实例
   */
  static fromPersistence(data: any): Account {
    const account = new Account({
      uuid: data.uuid,
      username: data.username,
      accountType: data.accountType,
      user: User.fromDTO(data.user),
      email: data.email ? Email.fromValue(data.email) : undefined,
      phoneNumber: data.phoneNumber ? PhoneNumber.fromValue(data.phoneNumber) : undefined,
      address: data.address ? Address.fromValue(data.address) : undefined,
      status: data.status,
      isEmailVerified: data.isEmailVerified,
      isPhoneVerified: data.isPhoneVerified,
      lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
      emailVerificationToken: data.emailVerificationToken,
      phoneVerificationCode: data.phoneVerificationCode,
      roleUuids: new Set(data.roleUuids || []),
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    });

    // 清除领域事件，因为这是从持久化加载的
    account.clearDomainEvents();

    return account;
  }

  /**
   * 转换为持久化数据
   */
  toPersistence() {
    return {
      uuid: this.uuid,
      username: this._username,
      status: this._status,
      accountType: this._accountType,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      lastLoginAt: this._lastLoginAt,
      email: this._email?.value,
      phoneNumber: this._phoneNumber?.fullNumber,
      address: this._address
        ? {
            street: this._address.street,
            city: this._address.city,
            state: this._address.state,
            country: this._address.country,
            postalCode: this._address.postalCode,
          }
        : null,
      emailVerificationToken: this._emailVerificationToken,
      phoneVerificationCode: this._phoneVerificationCode,
      roleUuids: Array.from(this._roleUuids),
      isEmailVerified: this._isEmailVerified,
      isPhoneVerified: this._isPhoneVerified,
      user: (this._user as User).toPersistence(),
    };
  }

  /**
   * 克隆对象（服务端可能需要深拷贝进行测试）
   */
  clone(): Account {
    return Account.fromPersistence(this.toPersistence());
  }

  /**
   * 转换为 DTO
   */
  toDTO(): AccountContracts.AccountDTO {
    return {
      uuid: this.uuid,
      username: this._username,
      accountType: this._accountType,
      status: this._status,
      email: this._email?.value,
      phoneNumber: this._phoneNumber?.fullNumber,
      isEmailVerified: this._isEmailVerified,
      isPhoneVerified: this._isPhoneVerified,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      lastLoginAt: this._lastLoginAt?.getTime(),
      user: (this._user as User).toDTO(),
      // roles 需要从角色仓储加载，这里暂时不包含
    };
  }
}
