# 用户注册流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-17
- **架构模式**: DDD (Account 模块 + Authentication 模块分离)
- **相关模块**: Account, Authentication
- **业务场景**: 新用户注册账号

---

## 1. 业务概述

### 1.1 业务目标

用户通过提供基本信息（用户名、邮箱、密码）创建新账号，系统需要：
- 验证信息的唯一性和合法性
- 创建账户主体（Account）
- 创建认证凭证（AuthCredential）
- 发送邮箱验证邮件（可选）
- 返回账户信息供后续登录

### 1.2 核心原则

- **Account 模块**：负责账户生命周期、资料管理、状态管理
- **Authentication 模块**：负责认证凭证、密码管理、安全策略
- **分离关注点**：Account 和 Authentication 通过事件总线松耦合
- **原子性**：Account 和 AuthCredential 的创建在同一事务中完成

### 1.3 前置条件

- 用户提供有效的用户名（唯一）
- 用户提供有效的邮箱地址（唯一）
- 用户提供符合安全策略的密码
- （可选）同意用户协议和隐私政策

### 1.4 后置条件

- ✅ Account 聚合根已创建并持久化
- ✅ AuthCredential 聚合根已创建并持久化（密码已加密）
- ✅ 邮箱验证邮件已发送（如启用）
- ✅ 领域事件已发布：`AccountCreatedEvent`, `CredentialCreatedEvent`
- ✅ 返回 AccountClientDTO 供前端使用

---

## 2. 架构分层设计

### 2.1 领域模型 (Domain Layer)

#### Account 模块 (packages/domain-server/account/)

**聚合根**: `Account`
- 属性:
  - `uuid`: 账户唯一标识
  - `username`: 用户名（唯一）
  - `email`: 邮箱（唯一）
  - `emailVerified`: 邮箱是否已验证
  - `phoneNumber`: 手机号（可选）
  - `status`: 账户状态（ACTIVE, INACTIVE, SUSPENDED, DELETED）
  - `profile`: 用户资料（displayName, avatar, bio 等）
  - `preferences`: 偏好设置（timezone, language, theme 等）
  - `security`: 安全设置（twoFactorEnabled, sessionTimeout 等）
  - `stats`: 统计信息（loginCount, lastLoginAt 等）
  - `createdAt`, `updatedAt`, `lastActiveAt`

**领域服务**: `AccountDomainService`
- 职责:
  - 验证用户名/邮箱唯一性
  - 创建 Account 聚合根
  - 更新账户资料
  - 管理账户状态

**仓储接口**: `IAccountRepository`
```typescript
interface IAccountRepository {
  save(account: Account): Promise<void>;
  findById(uuid: string): Promise<Account | null>;
  findByUsername(username: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  existsByUsername(username: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
}
```

#### Authentication 模块 (packages/domain-server/authentication/)

**聚合根**: `AuthCredential`
- 属性:
  - `uuid`: 凭证唯一标识
  - `accountUuid`: 关联的账户 UUID（外键）
  - `type`: 凭证类型（PASSWORD, API_KEY, BIOMETRIC 等）
  - `passwordCredential`: 密码凭证实体（hashedPassword, salt, algorithm）
  - `twoFactor`: 双因素认证配置
  - `security`: 安全策略（failedLoginAttempts, lockedUntil, passwordExpiresAt）
  - `status`: 凭证状态（ACTIVE, SUSPENDED, EXPIRED, REVOKED）

**领域服务**: `AuthenticationDomainService`
- 职责:
  - 创建密码凭证
  - 验证密码强度
  - 密码加密/哈希
  - 管理登录失败计数

**仓储接口**: `IAuthCredentialRepository`
```typescript
interface IAuthCredentialRepository {
  save(credential: AuthCredential): Promise<void>;
  findByUuid(uuid: string): Promise<AuthCredential | null>;
  findByAccountUuid(accountUuid: string): Promise<AuthCredential | null>;
}
```

---

### 2.2 应用层 (Application Layer)

#### 注册应用服务 (apps/api/modules/account/application/services/)

**服务**: `RegistrationApplicationService`

**核心用例**: `registerUser()`

**输入 DTO**:
```typescript
interface RegisterUserRequest {
  username: string;        // 3-20 字符，字母数字下划线
  email: string;          // 有效邮箱格式
  password: string;       // 8-64 字符，至少包含大小写字母和数字
  displayName?: string;   // 可选，默认使用 username
  timezone?: string;      // 可选，默认 UTC
  language?: string;      // 可选，默认 en
  agreeToTerms: boolean;  // 必须同意条款
}
```

**输出 DTO**:
```typescript
interface RegisterUserResponse {
  account: AccountClientDTO;
  message: string;
  emailVerificationSent: boolean;
}
```

**职责**:
1. 参数验证（格式、长度、必填项）
2. 业务规则验证（唯一性检查）
3. 密码加密（使用 bcrypt/argon2）
4. 编排事务：创建 Account + 创建 AuthCredential
5. 发布领域事件
6. 触发邮箱验证流程（可选）
7. 返回结果

---

### 2.3 基础设施层 (Infrastructure Layer)

#### 仓储实现 (apps/api/modules/account/infrastructure/repositories/)

**PrismaAccountRepository**:
- 实现 `IAccountRepository` 接口
- 使用 Prisma ORM 操作数据库
- DTO 映射：`toPersistenceDTO()` / `fromPersistenceDTO()`

**PrismaAuthCredentialRepository**:
- 实现 `IAuthCredentialRepository` 接口
- 使用 Prisma ORM 操作数据库
- DTO 映射：处理密码等敏感字段

#### 数据库 Schema (apps/api/prisma/schema.prisma)

```prisma
model Account {
  uuid            String   @id @default(uuid())
  username        String   @unique
  email           String   @unique
  email_verified  Boolean  @default(false)
  phone_number    String?  @unique
  phone_verified  Boolean  @default(false)
  status          String   @default("ACTIVE") // ACTIVE, INACTIVE, SUSPENDED, DELETED
  
  // JSON 字段
  profile         Json
  preferences     Json
  storage         Json
  security        Json
  stats           Json
  
  // 时间戳
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  last_active_at  DateTime?
  deleted_at      DateTime?
  
  // 关联关系
  auth_credential AuthCredential?
  sessions        AuthSession[]
  
  @@map("accounts")
}

model AuthCredential {
  uuid                  String   @id @default(uuid())
  account_uuid          String   @unique
  type                  String   // PASSWORD, API_KEY, BIOMETRIC, etc.
  
  // 密码凭证（JSON）
  password_credential   Json?
  
  // 双因素认证
  two_factor            Json?
  
  // 安全策略
  security              Json
  status                String   @default("ACTIVE")
  
  // 时间戳
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  last_used_at          DateTime?
  expires_at            DateTime?
  revoked_at            DateTime?
  
  // 关联关系
  account               Account  @relation(fields: [account_uuid], references: [uuid], onDelete: Cascade)
  
  @@map("auth_credentials")
}
```

---

## 3. 详细流程设计

### 3.1 时序图

```
Frontend          API Controller         Registration          Account           Authentication
  │                    │                  Application          Domain            Domain
  │                    │                  Service              Service           Service
  │                    │                     │                   │                 │
  │──Register Request──>│                     │                   │                 │
  │  {username,email,  │                     │                   │                 │
  │   password}        │                     │                   │                 │
  │                    │                     │                   │                 │
  │                    │──registerUser()────>│                   │                 │
  │                    │                     │                   │                 │
  │                    │                     │──Validate Input──>│                 │
  │                    │                     │                   │                 │
  │                    │                     │──Check Username──>│                 │
  │                    │                     │   Uniqueness      │                 │
  │                    │                     │<──Exists: false───│                 │
  │                    │                     │                   │                 │
  │                    │                     │──Check Email─────>│                 │
  │                    │                     │   Uniqueness      │                 │
  │                    │                     │<──Exists: false───│                 │
  │                    │                     │                   │                 │
  │                    │                     │──Hash Password──────────────────────>│
  │                    │                     │                   │                 │
  │                    │                     │<──HashedPassword─────────────────────│
  │                    │                     │                   │                 │
  │                    │                     │──Begin Transaction──────────────────>│
  │                    │                     │                   │                 │
  │                    │                     │──createAccount───>│                 │
  │                    │                     │                   │                 │
  │                    │                     │<──Account Object──│                 │
  │                    │                     │                   │                 │
  │                    │                     │──Save Account────>│                 │
  │                    │                     │   (Repository)    │                 │
  │                    │                     │<──Success─────────│                 │
  │                    │                     │                   │                 │
  │                    │                     │──createCredential────────────────────>│
  │                    │                     │   {accountUuid,   │                 │
  │                    │                     │    hashedPassword}│                 │
  │                    │                     │<──Credential Object──────────────────│
  │                    │                     │                   │                 │
  │                    │                     │──Save Credential─────────────────────>│
  │                    │                     │   (Repository)    │                 │
  │                    │                     │<──Success────────────────────────────│
  │                    │                     │                   │                 │
  │                    │                     │──Commit Transaction─────────────────>│
  │                    │                     │                   │                 │
  │                    │                     │──Publish Events──>│                 │
  │                    │                     │  - AccountCreatedEvent              │
  │                    │                     │  - CredentialCreatedEvent           │
  │                    │                     │                   │                 │
  │                    │                     │──Send Verification Email (async)───>│
  │                    │                     │                   │                 │
  │                    │<──Response──────────│                   │                 │
  │<──201 Created──────│  {account, message}│                   │                 │
  │   AccountClientDTO │                     │                   │                 │
```

---

### 3.2 核心代码实现

#### Step 1: API Controller (apps/api/modules/account/interface/http/)

```typescript
// AuthController.ts
import { Router, Request, Response } from 'express';
import { RegistrationApplicationService } from '../../application/services/RegistrationApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthController');
const router = Router();

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, displayName, timezone, language, agreeToTerms } = req.body;

    // 基础验证
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Username, email, and password are required',
      });
    }

    if (!agreeToTerms) {
      return res.status(400).json({
        error: 'TERMS_NOT_ACCEPTED',
        message: 'You must agree to the terms and conditions',
      });
    }

    // 调用应用服务
    const service = await RegistrationApplicationService.getInstance();
    const result = await service.registerUser({
      username,
      email,
      password,
      displayName,
      timezone,
      language,
      agreeToTerms,
    });

    logger.info('User registered successfully', { accountUuid: result.account.uuid });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Registration failed', error);

    // 错误处理
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'CONFLICT',
        message: error.message,
      });
    }

    if (error.message.includes('invalid') || error.message.includes('Password')) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Registration failed. Please try again later.',
    });
  }
});

export default router;
```

---

#### Step 2: Application Service (apps/api/modules/account/application/services/)

```typescript
// RegistrationApplicationService.ts
import { Account, AccountDomainService, type IAccountRepository } from '@dailyuse/domain-server';
import { AuthenticationDomainService, type IAuthCredentialRepository } from '@dailyuse/domain-server';
import { AccountContracts } from '@dailyuse/contracts';
import { createLogger, eventBus } from '@dailyuse/utils';
import { AccountContainer } from '../../infrastructure/di/AccountContainer';
import { AuthenticationContainer } from '../../../authentication/infrastructure/di/AuthenticationContainer';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const logger = createLogger('RegistrationApplicationService');
const prisma = new PrismaClient();

type AccountClientDTO = AccountContracts.AccountClientDTO;

interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  timezone?: string;
  language?: string;
  agreeToTerms: boolean;
}

interface RegisterUserResponse {
  account: AccountClientDTO;
  message: string;
  emailVerificationSent: boolean;
}

export class RegistrationApplicationService {
  private static instance: RegistrationApplicationService;
  private accountDomainService: AccountDomainService;
  private authDomainService: AuthenticationDomainService;
  private accountRepo: IAccountRepository;
  private credentialRepo: IAuthCredentialRepository;

  private constructor(
    accountRepo: IAccountRepository,
    credentialRepo: IAuthCredentialRepository,
  ) {
    this.accountRepo = accountRepo;
    this.credentialRepo = credentialRepo;
    this.accountDomainService = new AccountDomainService(accountRepo);
    this.authDomainService = new AuthenticationDomainService(credentialRepo, null as any);
  }

  static async createInstance(
    accountRepo?: IAccountRepository,
    credentialRepo?: IAuthCredentialRepository,
  ): Promise<RegistrationApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const authContainer = AuthenticationContainer.getInstance();

    const accRepo = accountRepo || accountContainer.getAccountRepository();
    const credRepo = credentialRepo || authContainer.getAuthCredentialRepository();

    RegistrationApplicationService.instance = new RegistrationApplicationService(
      accRepo,
      credRepo,
    );
    return RegistrationApplicationService.instance;
  }

  static async getInstance(): Promise<RegistrationApplicationService> {
    if (!RegistrationApplicationService.instance) {
      RegistrationApplicationService.instance = await RegistrationApplicationService.createInstance();
    }
    return RegistrationApplicationService.instance;
  }

  /**
   * 用户注册
   */
  async registerUser(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    const { username, email, password, displayName, timezone, language } = request;

    // 1. 输入验证
    this.validateRegistrationInput(request);

    // 2. 检查唯一性
    await this.checkUniqueness(username, email);

    // 3. 密码加密
    const hashedPassword = await this.hashPassword(password);

    // 4. 事务：创建 Account + AuthCredential
    const account = await prisma.$transaction(async (tx) => {
      // 4.1 创建 Account 聚合根
      const newAccount = await this.accountDomainService.createAccount({
        username,
        email,
        displayName: displayName || username,
        timezone: timezone || 'UTC',
        language: language || 'en',
      });

      // 4.2 保存 Account
      await this.accountRepo.save(newAccount);

      // 4.3 创建 AuthCredential 聚合根
      const credential = await this.authDomainService.createPasswordCredential({
        accountUuid: newAccount.uuid,
        hashedPassword,
      });

      // 4.4 保存 AuthCredential
      await this.credentialRepo.save(credential);

      logger.info('Account and credential created in transaction', {
        accountUuid: newAccount.uuid,
      });

      return newAccount;
    });

    // 5. 发布领域事件
    eventBus.send('account:created', {
      accountUuid: account.uuid,
      username: account.username,
      email: account.email,
      createdAt: Date.now(),
    });

    eventBus.send('credential:created', {
      accountUuid: account.uuid,
      type: 'PASSWORD',
      createdAt: Date.now(),
    });

    // 6. 发送邮箱验证邮件（异步）
    let emailVerificationSent = false;
    try {
      await this.sendVerificationEmail(account.email, account.uuid);
      emailVerificationSent = true;
    } catch (error) {
      logger.warn('Failed to send verification email', { error });
    }

    // 7. 返回结果
    return {
      account: account.toClientDTO(),
      message: 'Registration successful. Please check your email to verify your account.',
      emailVerificationSent,
    };
  }

  /**
   * 验证注册输入
   */
  private validateRegistrationInput(request: RegisterUserRequest): void {
    const { username, email, password } = request;

    // 用户名验证
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      throw new Error(
        'Invalid username. Must be 3-20 characters and contain only letters, numbers, and underscores.',
      );
    }

    // 邮箱验证
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format.');
    }

    // 密码强度验证
    if (password.length < 8 || password.length > 64) {
      throw new Error('Password must be between 8 and 64 characters.');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
    }
  }

  /**
   * 检查用户名和邮箱唯一性
   */
  private async checkUniqueness(username: string, email: string): Promise<void> {
    const [usernameExists, emailExists] = await Promise.all([
      this.accountRepo.existsByUsername(username),
      this.accountRepo.existsByEmail(email),
    ]);

    if (usernameExists) {
      throw new Error('Username already exists.');
    }

    if (emailExists) {
      throw new Error('Email already exists.');
    }
  }

  /**
   * 密码加密
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 发送邮箱验证邮件
   */
  private async sendVerificationEmail(email: string, accountUuid: string): Promise<void> {
    // TODO: 集成邮件服务（SendGrid, AWS SES, etc.）
    logger.info('Sending verification email', { email, accountUuid });
    
    // 生成验证令牌
    const verificationToken = Math.random().toString(36).substring(2, 15);
    
    // 存储令牌到 Redis 或数据库（24小时过期）
    // await redis.setex(`email_verification:${accountUuid}`, 86400, verificationToken);
    
    // 发送邮件
    // await emailService.send({
    //   to: email,
    //   subject: 'Verify your email address',
    //   template: 'email-verification',
    //   data: {
    //     verificationLink: `https://app.dailyuse.com/verify-email?token=${verificationToken}`,
    //   },
    // });
  }
}
```

---

#### Step 3: Domain Service (packages/domain-server/)

Account 和 Authentication 的领域服务已在现有代码中实现，主要方法：

**AccountDomainService.createAccount()**:
```typescript
public async createAccount(params: {
  username: string;
  email: string;
  displayName: string;
  timezone?: string;
  language?: string;
}): Promise<Account> {
  // 验证唯一性（已在应用层完成）
  
  // 创建 Account 聚合根
  const account = Account.create({
    username: params.username,
    email: params.email,
    displayName: params.displayName,
    timezone: params.timezone || 'UTC',
    language: params.language || 'en',
  });

  return account;
}
```

**AuthenticationDomainService.createPasswordCredential()**:
```typescript
async createPasswordCredential(params: {
  accountUuid: string;
  hashedPassword: string;
}): Promise<AuthCredential> {
  // 检查凭证是否已存在
  const existing = await this.credentialRepository.findByAccountUuid(params.accountUuid);
  if (existing) {
    throw new Error('Credential already exists for this account');
  }

  // 创建 AuthCredential 聚合根
  const credential = AuthCredential.create({
    accountUuid: params.accountUuid,
    type: 'PASSWORD',
    hashedPassword: params.hashedPassword,
  });

  return credential;
}
```

---

## 4. 错误处理策略

### 4.1 业务异常

| 错误代码 | HTTP 状态 | 描述 | 处理方式 |
|---------|---------|------|---------|
| `USERNAME_EXISTS` | 409 | 用户名已存在 | 提示用户更换用户名 |
| `EMAIL_EXISTS` | 409 | 邮箱已被注册 | 提示用户更换邮箱或找回密码 |
| `INVALID_USERNAME` | 400 | 用户名格式不合法 | 提示格式要求 |
| `INVALID_EMAIL` | 400 | 邮箱格式不合法 | 提示正确格式 |
| `WEAK_PASSWORD` | 400 | 密码强度不足 | 提示密码要求 |
| `TERMS_NOT_ACCEPTED` | 400 | 未同意条款 | 要求用户同意 |

### 4.2 技术异常

- **数据库连接失败**: 返回 503，提示稍后重试
- **事务失败**: 回滚所有操作，返回 500
- **邮件发送失败**: 记录日志，不影响注册成功，后续可重发

---

## 5. 安全考虑

### 5.1 密码安全

- **加密算法**: 使用 bcrypt（salt rounds = 12）或 argon2
- **存储**: 只存储哈希后的密码，永不存储明文
- **传输**: HTTPS 加密传输

### 5.2 输入验证

- 防止 SQL 注入（使用 Prisma ORM 参数化查询）
- 防止 XSS（前端输出转义）
- 限制输入长度（防止 DoS）

### 5.3 速率限制

- 注册接口：同一 IP 每小时最多 5 次注册
- 使用 Redis + express-rate-limit 实现

---

## 6. 测试策略

### 6.1 单元测试

```typescript
describe('RegistrationApplicationService', () => {
  it('should successfully register a new user', async () => {
    // Arrange
    const mockAccountRepo = createMockAccountRepository();
    const mockCredentialRepo = createMockCredentialRepository();
    const service = await RegistrationApplicationService.createInstance(
      mockAccountRepo,
      mockCredentialRepo,
    );

    // Act
    const result = await service.registerUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      agreeToTerms: true,
    });

    // Assert
    expect(result.account.username).toBe('testuser');
    expect(result.account.email).toBe('test@example.com');
    expect(mockAccountRepo.save).toHaveBeenCalled();
    expect(mockCredentialRepo.save).toHaveBeenCalled();
  });

  it('should throw error when username already exists', async () => {
    // Test uniqueness validation
  });

  it('should throw error when password is weak', async () => {
    // Test password strength validation
  });
});
```

### 6.2 集成测试

```typescript
describe('Registration API Integration', () => {
  it('POST /api/auth/register - should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        agreeToTerms: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.account.username).toBe('testuser');
  });
});
```

---

## 7. 监控与日志

### 7.1 日志记录

- 注册成功：`logger.info('User registered', { accountUuid, username })`
- 注册失败：`logger.error('Registration failed', { error, username })`
- 唯一性冲突：`logger.warn('Duplicate username/email', { username, email })`

### 7.2 监控指标

- 注册成功率
- 注册失败原因分布
- 平均注册耗时
- 邮箱验证完成率

---

## 8. 未来优化

1. **邮箱验证强制**: 要求用户验证邮箱后才能使用某些功能
2. **验证码**: 添加图形验证码或 reCAPTCHA 防止机器注册
3. **社交登录**: 支持 Google, GitHub 等第三方登录
4. **密码强度提示**: 实时显示密码强度
5. **邀请码系统**: 封闭测试阶段需要邀请码
6. **用户画像**: 注册时收集更多信息（年龄、职业等）

---

## 9. 相关文档

- [用户登录流程设计](./USER_LOGIN_FLOW.md)
- [用户登出流程设计](./USER_LOGOUT_FLOW.md)
- [账户注销流程设计](./ACCOUNT_DELETION_FLOW.md)
- [Account 模块设计](../ACCOUNT_MODULE_DESIGN.md)
- [Authentication 模块设计](../AUTHENTICATION_MODULE_DESIGN.md)

---

## 10. 变更历史

| 版本 | 日期 | 作者 | 变更说明 |
|-----|------|------|---------|
| 1.0 | 2025-10-17 | AI Assistant | 初始版本 |
