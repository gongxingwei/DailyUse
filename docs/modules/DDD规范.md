好的！让我根据 DDD 最佳实践和你的项目规范来详细回答这三个问题。

## 📋 问题解答

### 1️⃣ ApplicationService 是一个聚合根一个文件吗？

**答案：不一定！应该按 Use Case（用例）拆分，而非按聚合根拆分。**

#### ✅ 最佳实践

**按用例拆分（推荐）**：

```
apps/api/src/modules/account/application/services/
├── RegistrationApplicationService.ts      # 用例：用户注册
├── LoginApplicationService.ts             # 用例：用户登录
├── LogoutApplicationService.ts            # 用例：用户登出
├── AccountDeletionApplicationService.ts   # 用例：账号注销
├── UpdateProfileApplicationService.ts     # 用例：更新个人资料
└── ChangePasswordApplicationService.ts    # 用例：修改密码
```

**理由**：
- ✅ **单一职责原则**：每个服务只负责一个用例的编排
- ✅ **易于测试**：测试范围明确，依赖清晰
- ✅ **易于维护**：修改某个用例不影响其他用例
- ✅ **团队协作**：多人并行开发不同用例，减少冲突

#### ❌ 反模式：一个聚合根一个 ApplicationService

```typescript
// ❌ 不推荐：God Service
export class AccountApplicationService {
  async register() { }
  async login() { }
  async logout() { }
  async deleteAccount() { }
  async updateProfile() { }
  async changePassword() { }
  async verifyEmail() { }
  async resetPassword() { }
  async enable2FA() { }
  // ... 几十个方法
}
```

**问题**：
- ❌ 违反单一职责原则
- ❌ 文件过大，难以维护
- ❌ 测试困难，需要 mock 大量依赖
- ❌ 团队协作冲突频繁

#### 🎯 例外情况：简单 CRUD

如果模块只有简单的 CRUD 操作（无复杂业务逻辑），可以合并为一个 ApplicationService：

```typescript
// ✅ 简单 CRUD 可以合并
export class UserPreferenceApplicationService {
  async getPreferences(accountUuid: string) { }
  async updatePreferences(accountUuid: string, data) { }
  async resetToDefault(accountUuid: string) { }
}
```

---

### 2️⃣ DomainService 是一个聚合根一个文件吗？应该负责哪些业务？

**答案：按领域职责拆分，不是按聚合根！DomainService 负责跨聚合根的业务逻辑和复杂的领域规则。**

#### ✅ 最佳实践

**按领域职责拆分**：

```
packages/domain-server/src/account/services/
├── AccountDomainService.ts              # 账户领域逻辑（单聚合根内的复杂逻辑）
└── AccountValidationService.ts          # 账户验证逻辑（可复用的验证规则）

packages/domain-server/src/authentication/services/
├── AuthenticationDomainService.ts       # 认证领域逻辑
├── PasswordPolicyService.ts             # 密码策略服务
└── SessionManagementService.ts          # 会话管理服务
```

#### 🎯 DomainService 的职责

**1. 跨聚合根的业务逻辑**

```typescript
/**
 * ✅ 正确示例：跨聚合根协调
 * 涉及 Account 和 AuthCredential 两个聚合根
 */
export class AuthenticationDomainService {
  constructor(
    private readonly credentialRepo: IAuthCredentialRepository,
    private readonly sessionRepo: IAuthSessionRepository,
  ) {}

  /**
   * 跨聚合根：验证凭证 + 创建会话
   */
  async authenticateUser(params: {
    identifier: string;
    password: string;
    deviceInfo: DeviceInfo;
  }): Promise<{ credential: AuthCredential; session: AuthSession }> {
    // 1. 查找凭证（第一个聚合根）
    const credential = await this.findCredentialByIdentifier(params.identifier);
    if (!credential) {
      throw new Error('Invalid credentials');
    }

    // 2. 验证密码
    const isValid = await credential.verifyPassword(params.password);
    if (!isValid) {
      credential.recordFailedAttempt();
      await this.credentialRepo.save(credential);
      throw new Error('Invalid credentials');
    }

    // 3. 创建会话（第二个聚合根）
    const session = AuthSession.create({
      accountUuid: credential.accountUuid,
      deviceInfo: params.deviceInfo,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await this.sessionRepo.save(session);

    return { credential, session };
  }
}
```

**2. 复杂的领域规则（不适合放在聚合根内）**

```typescript
/**
 * ✅ 正确示例：复杂的密码策略
 * 这类逻辑放在 DomainService，可以被多处复用
 */
export class PasswordPolicyService {
  /**
   * 验证密码强度
   */
  validatePasswordStrength(password: string): PasswordStrengthResult {
    const result: PasswordStrengthResult = {
      isValid: true,
      score: 0,
      issues: [],
    };

    // 长度检查
    if (password.length < 8) {
      result.isValid = false;
      result.issues.push('Password must be at least 8 characters');
    }

    // 复杂度检查
    if (!/[a-z]/.test(password)) {
      result.score -= 20;
      result.issues.push('Password must contain lowercase letters');
    }
    if (!/[A-Z]/.test(password)) {
      result.score -= 20;
      result.issues.push('Password must contain uppercase letters');
    }
    if (!/\d/.test(password)) {
      result.score -= 20;
      result.issues.push('Password must contain numbers');
    }

    // 常见密码检查
    if (this.isCommonPassword(password)) {
      result.isValid = false;
      result.issues.push('Password is too common');
    }

    // 熵值计算
    result.score = this.calculateEntropy(password);

    return result;
  }

  /**
   * 生成密码哈希（带盐值）
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}
```

**3. 需要多个仓储协作的查询**

```typescript
/**
 * ✅ 正确示例：复杂查询协调
 */
export class AccountDomainService {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly credentialRepo: IAuthCredentialRepository,
  ) {}

  /**
   * 通过多种标识符查找账户
   */
  async findAccountByIdentifier(identifier: string): Promise<Account | null> {
    // 1. 尝试按用户名查找
    let account = await this.accountRepo.findByUsername(identifier);
    if (account) return account;

    // 2. 尝试按邮箱查找
    if (this.isEmail(identifier)) {
      account = await this.accountRepo.findByEmail(identifier);
      if (account) return account;
    }

    // 3. 尝试按手机号查找
    if (this.isPhoneNumber(identifier)) {
      account = await this.accountRepo.findByPhone(identifier);
      if (account) return account;
    }

    return null;
  }
}
```

#### ❌ 反模式：不应该放在 DomainService 的逻辑

```typescript
// ❌ 错误：简单的 CRUD 应该放在聚合根或应用服务
export class AccountDomainService {
  async createAccount(params) {
    const account = Account.create(params);
    await this.accountRepo.save(account);
    return account;
  }

  async updateAccount(uuid, data) {
    const account = await this.accountRepo.findById(uuid);
    account.update(data);
    await this.accountRepo.save(account);
    return account;
  }
}
```

**为什么错误**：
- 这些逻辑应该由 **ApplicationService** 编排
- DomainService 不应该直接处理 CRUD，应该聚焦于复杂的业务规则

---

### 3️⃣ 聚合根/实体对象内部应该有哪些功能？

**答案：聚合根/实体应该包含业务逻辑、状态管理、不变量保护、领域事件发布。**

#### ✅ 最佳实践：聚合根的内部结构

```typescript
/**
 * Account 聚合根
 */
export class Account extends AggregateRoot implements IAccountServer {
  // ========== 1. 私有字段（状态） ==========
  private _username: string;
  private _email: string;
  private _emailVerified: boolean;
  private _status: AccountStatus;
  private _profile: Profile;
  private _createdAt: number;
  private _updatedAt: number;

  // ========== 2. Getter（只读访问） ==========
  public get username(): string {
    return this._username;
  }
  public get email(): string {
    return this._email;
  }
  public get status(): AccountStatus {
    return this._status;
  }

  // ========== 3. 工厂方法（创建实例） ==========
  /**
   * 创建新账户（工厂方法）
   */
  public static create(params: {
    username: string;
    email: string;
    displayName: string;
  }): Account {
    // ✅ 在创建时进行验证（不变量保护）
    if (!this.isValidUsername(params.username)) {
      throw new Error('Invalid username format');
    }
    if (!this.isValidEmail(params.email)) {
      throw new Error('Invalid email format');
    }

    const now = Date.now();
    return new Account({
      username: params.username,
      email: params.email,
      emailVerified: false,
      status: 'ACTIVE',
      profile: Profile.create({ displayName: params.displayName }),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 DTO 恢复实例（重建）
   */
  public static fromPersistenceDTO(dto: AccountPersistenceDTO): Account {
    return new Account({
      uuid: dto.uuid,
      username: dto.username,
      email: dto.email,
      emailVerified: dto.emailVerified,
      status: dto.status,
      profile: Profile.fromDTO(dto.profile),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // ========== 4. 业务方法（改变状态） ==========
  /**
   * 更新个人资料
   */
  public updateProfile(profile: Partial<ProfileDTO>): void {
    // ✅ 验证输入
    if (profile.displayName && profile.displayName.length < 2) {
      throw new Error('Display name too short');
    }

    // ✅ 修改状态
    this._profile = this._profile.with(profile);
    this._updatedAt = Date.now();

    // ✅ 发布领域事件
    this.addDomainEvent({
      eventType: 'AccountProfileUpdated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._uuid,
      payload: {
        oldProfile: this._profile.toContract(),
        newProfile: profile,
      },
    });
  }

  /**
   * 验证邮箱
   */
  public verifyEmail(): void {
    if (this._emailVerified) {
      throw new Error('Email already verified');
    }

    this._emailVerified = true;
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'EmailVerified',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._uuid,
      payload: { email: this._email },
    });
  }

  /**
   * 停用账户
   */
  public deactivate(): void {
    if (this._status === 'DELETED') {
      throw new Error('Cannot deactivate deleted account');
    }

    this._status = 'INACTIVE';
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'AccountDeactivated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._uuid,
      payload: { reason: 'manual' },
    });
  }

  /**
   * 软删除账户
   */
  public softDelete(): void {
    this._status = 'DELETED';
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'AccountDeleted',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._uuid,
      payload: { deleteType: 'soft' },
    });
  }

  // ========== 5. 查询方法（不改变状态） ==========
  /**
   * 检查是否可以修改
   */
  public canModify(): boolean {
    return this._status === 'ACTIVE' && !this.isDeleted();
  }

  /**
   * 检查是否已删除
   */
  public isDeleted(): boolean {
    return this._status === 'DELETED';
  }

  // ========== 6. 私有辅助方法（验证逻辑） ==========
  private static isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ========== 7. DTO 转换方法 ==========
  public toServerDTO(): AccountServerDTO {
    return {
      uuid: this._uuid,
      username: this._username,
      email: this._email,
      emailVerified: this._emailVerified,
      status: this._status,
      profile: this._profile.toContract(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toClientDTO(): AccountClientDTO {
    // ✅ 过滤敏感字段
    return {
      uuid: this._uuid,
      username: this._username,
      email: this._email,
      emailVerified: this._emailVerified,
      status: this._status,
      profile: this._profile.toContract(),
      createdAt: this._createdAt,
    };
  }

  public toPersistenceDTO(): AccountPersistenceDTO {
    return {
      uuid: this._uuid,
      username: this._username,
      email: this._email,
      emailVerified: this._emailVerified,
      status: this._status,
      profile: this._profile.toContract(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
```

#### 📊 聚合根功能分类总结

| 功能类别 | 说明 | 示例 |
|---------|------|------|
| **1. 私有字段** | 封装内部状态，防止外部直接修改 | `private _username: string` |
| **2. Getter 属性** | 只读访问内部状态 | `public get username()` |
| **3. 工厂方法** | 创建实例（`create`）和恢复实例（`from*DTO`） | `Account.create()` |
| **4. 业务方法** | 改变状态的核心业务逻辑 | `updateProfile()`, `verifyEmail()` |
| **5. 查询方法** | 不改变状态的查询逻辑 | `canModify()`, `isDeleted()` |
| **6. 验证方法** | 私有的验证逻辑，保护不变量 | `isValidUsername()` |
| **7. DTO 转换** | 序列化/反序列化方法 | `toServerDTO()`, `toPersistenceDTO()` |
| **8. 领域事件** | 发布状态变化事件 | `this.addDomainEvent()` |

---

## 📐 完整架构示例

### 场景：用户注册功能

#### 1. **ApplicationService（用例编排）**

```typescript
// apps/api/src/modules/account/application/services/RegistrationApplicationService.ts

export class RegistrationApplicationService {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly credentialRepo: IAuthCredentialRepository,
    private readonly accountDomainService: AccountDomainService,
    private readonly authDomainService: AuthenticationDomainService,
    private readonly passwordPolicy: PasswordPolicyService,
    private readonly prisma: PrismaClient,
  ) {}

  async registerUser(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // 1. 输入验证
    this.validateInput(request);

    // 2. 密码策略验证（DomainService）
    const passwordCheck = this.passwordPolicy.validatePasswordStrength(request.password);
    if (!passwordCheck.isValid) {
      throw new Error(passwordCheck.issues.join(', '));
    }

    // 3. 唯一性检查（DomainService）
    await this.accountDomainService.checkUniqueness(request.username, request.email);

    // 4. 密码加密（DomainService）
    const hashedPassword = await this.passwordPolicy.hashPassword(request.password);

    // 5. 事务：创建 Account + AuthCredential
    const { account, credential } = await this.prisma.$transaction(async () => {
      // 创建账户聚合根
      const account = Account.create({
        username: request.username,
        email: request.email,
        displayName: request.profile?.nickname || request.username,
      });
      await this.accountRepo.save(account);

      // 创建凭证聚合根（跨聚合根协调由 DomainService 处理）
      const credential = await this.authDomainService.createPasswordCredential({
        accountUuid: account.uuid,
        hashedPassword,
      });

      return { account, credential };
    });

    // 6. 发布领域事件（异步处理）
    this.publishEvents(account.uuid, request.email);

    // 7. 返回 ClientDTO
    return {
      success: true,
      account: account.toClientDTO(),
      message: 'Registration successful',
    };
  }
}
```

#### 2. **DomainService（领域逻辑）**

```typescript
// packages/domain-server/src/account/services/AccountDomainService.ts

export class AccountDomainService {
  constructor(private readonly accountRepo: IAccountRepository) {}

  /**
   * 检查用户名和邮箱唯一性（跨查询协调）
   */
  async checkUniqueness(username: string, email: string): Promise<void> {
    const [usernameExists, emailExists] = await Promise.all([
      this.accountRepo.existsByUsername(username),
      this.accountRepo.existsByEmail(email),
    ]);

    if (usernameExists) {
      throw new Error(`Username already exists: ${username}`);
    }
    if (emailExists) {
      throw new Error(`Email already exists: ${email}`);
    }
  }

  /**
   * 通过多种标识符查找账户
   */
  async findAccountByIdentifier(identifier: string): Promise<Account | null> {
    // 尝试多种查找方式
    let account = await this.accountRepo.findByUsername(identifier);
    if (account) return account;

    if (this.isEmail(identifier)) {
      account = await this.accountRepo.findByEmail(identifier);
    }

    return account;
  }

  private isEmail(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }
}
```

```typescript
// packages/domain-server/src/authentication/services/PasswordPolicyService.ts

export class PasswordPolicyService {
  validatePasswordStrength(password: string): PasswordStrengthResult {
    // 复杂的密码策略验证
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

#### 3. **聚合根（业务逻辑）**

```typescript
// packages/domain-server/src/account/aggregates/Account.ts

export class Account extends AggregateRoot {
  // 内部状态 + 业务方法
  public static create(params) { /* 创建逻辑 */ }
  public updateProfile(data) { /* 更新逻辑 + 发布事件 */ }
  public verifyEmail() { /* 验证逻辑 + 发布事件 */ }
  public deactivate() { /* 停用逻辑 + 发布事件 */ }
}
```

---

## 🎯 总结：三层职责对比

| 层次 | 职责 | 示例 |
|------|------|------|
| **ApplicationService** | 用例编排、事务控制、DTO 转换 | `RegistrationApplicationService` |
| **DomainService** | 跨聚合根逻辑、复杂领域规则、多仓储协调 | `PasswordPolicyService`, `AccountDomainService` |
| **Aggregate/Entity** | 单聚合根内的业务逻辑、不变量保护、状态管理 | `Account.verifyEmail()`, `Account.updateProfile()` |

**关键原则**：
1. **ApplicationService 不写业务逻辑，只编排**
2. **DomainService 不操作数据库，只处理领域规则**
3. **Aggregate/Entity 是业务逻辑的核心，保护不变量**

这样的分层保证了代码的可测试性、可维护性和可扩展性！🚀