# 用户登录流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-17
- **架构模式**: DDD (Account 模块 + Authentication 模块分离)
- **相关模块**: Authentication, Account
- **业务场景**: 用户通过凭证登录系统

---

## 1. 业务概述

### 1.1 业务目标

用户通过提供身份标识（用户名/邮箱/手机号）和密码进行身份验证，系统需要：

- 验证用户身份的合法性
- 检查账户和凭证状态
- 创建会话（Session）并颁发令牌（access/refresh token）
- 记录登录历史、设备信息、IP 地址、地理位置
- 支持多端登录（Web、Desktop、Mobile）
- 实施安全策略（防爆破、锁定机制、速率限制）

### 1.2 核心原则

- **Authentication 模块**：负责凭证校验、密码验证、会话创建、安全策略
- **Account 模块**：负责账户状态查询、资料获取、统计更新
- **分离关注点**：认证逻辑与账户管理解耦，便于扩展多种认证方式（OAuth、SSO）
- **安全优先**：防止暴力破解、实施账户锁定、记录异常登录

### 1.3 前置条件

- 用户已完成注册
- 用户提供有效的身份标识（username/email/phone）
- 用户提供正确的密码
- 账户状态为 ACTIVE（非 SUSPENDED/DELETED）
- 凭证状态为 ACTIVE（非 LOCKED/EXPIRED）

### 1.4 后置条件

- ✅ 密码验证成功
- ✅ AuthSession 聚合根已创建并持久化
- ✅ access token 和 refresh token 已生成
- ✅ 账户统计信息已更新（loginCount, lastLoginAt）
- ✅ 领域事件已发布：`UserLoggedInEvent`
- ✅ 返回 LoginResponse（包含 tokens 和 account/session 信息）

---

## 2. 架构分层设计

### 2.1 领域模型 (Domain Layer)

#### Authentication 模块 (packages/domain-server/authentication/)

**聚合根**: `AuthCredential`

- 属性:
  - `uuid`: 凭证唯一标识
  - `accountUuid`: 关联账户 UUID
  - `type`: 凭证类型（PASSWORD, API_KEY 等）
  - `passwordCredential`: 密码凭证实体（hashedPassword, salt, algorithm）
  - `security`: 安全策略
    - `failedLoginAttempts`: 失败登录次数
    - `lastFailedLoginAt`: 最后失败时间
    - `lockedUntil`: 锁定截止时间
    - `passwordExpiresAt`: 密码过期时间
  - `status`: 凭证状态（ACTIVE, SUSPENDED, EXPIRED, REVOKED）

**聚合根**: `AuthSession`

- 属性:
  - `uuid`: 会话唯一标识
  - `accountUuid`: 关联账户 UUID
  - `accessToken`: 访问令牌（JWT）
  - `accessTokenExpiresAt`: 访问令牌过期时间
  - `refreshToken`: 刷新令牌实体（token, expiresAt）
  - `device`: 设备信息（type, os, browser, userAgent）
  - `ipAddress`: IP 地址
  - `location`: 地理位置（country, region, city, timezone）
  - `status`: 会话状态（ACTIVE, EXPIRED, REVOKED, LOCKED）
  - `lastActivityAt`: 最后活动时间
  - `history`: 会话历史记录

**领域服务**: `AuthenticationDomainService`

- 职责:
  - 验证密码（verifyPassword）
  - 记录失败登录（recordFailedLogin）
  - 重置失败尝试（resetFailedAttempts）
  - 检查凭证锁定状态（isCredentialLocked）
  - 创建会话（createSession）
  - 生成 token（generateRememberMeToken）

**仓储接口**: `IAuthCredentialRepository`, `IAuthSessionRepository`

```typescript
interface IAuthCredentialRepository {
  findByUuid(uuid: string): Promise<AuthCredential | null>;
  findByAccountUuid(accountUuid: string): Promise<AuthCredential | null>;
  save(credential: AuthCredential): Promise<void>;
}

interface IAuthSessionRepository {
  save(session: AuthSession): Promise<void>;
  findByUuid(uuid: string): Promise<AuthSession | null>;
  findByAccessToken(accessToken: string): Promise<AuthSession | null>;
  findByAccountUuid(accountUuid: string): Promise<AuthSession[]>;
}
```

#### Account 模块 (packages/domain-server/account/)

**聚合根**: `Account`

- 职责: 提供账户基本信息和状态
- 方法: `updateLastLogin()`, `incrementLoginCount()`

**领域服务**: `AccountDomainService`

- 职责:
  - 查询账户（getAccountByUsername/Email/Phone）
  - 更新登录统计（updateLoginStats）

---

### 2.2 应用层 (Application Layer)

#### 登录应用服务 (apps/api/modules/authentication/application/services/)

**服务**: `AuthenticationApplicationService`

**核心用例**: `login()`

**输入 DTO**:

```typescript
interface LoginRequest {
  identifier: string; // 用户名/邮箱/手机号
  password: string; // 明文密码（通过 HTTPS 传输）
  deviceInfo: {
    deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API';
    os?: string; // 操作系统（如 Windows, macOS, iOS）
    browser?: string; // 浏览器（如 Chrome, Firefox）
    ipAddress: string; // 客户端 IP
    userAgent: string; // User-Agent 字符串
    location?: {
      // 地理位置（可选，通过 IP 解析）
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  };
  rememberMe?: boolean; // 是否记住登录（延长 token 有效期）
  rememberMeDays?: number; // 记住天数（默认 30 天）
}
```

**输出 DTO**:

```typescript
interface LoginResponse {
  accessToken: string; // 访问令牌（短期，15分钟-1小时）
  refreshToken: string; // 刷新令牌（长期，7-30天）
  expiresIn: number; // access token 过期时间（秒）
  tokenType: 'Bearer'; // Token 类型
  account: AccountClientDTO; // 账户信息
  session: AuthSessionClientDTO; // 会话信息
}
```

**职责**:

1. 参数验证（identifier、password、deviceInfo）
2. 查询账户（通过 AccountRepository）
3. 查询凭证（通过 AuthCredentialRepository）
4. 检查账户状态（ACTIVE/SUSPENDED/DELETED）
5. 检查凭证状态（ACTIVE/LOCKED/EXPIRED）
6. 验证密码（通过 AuthenticationDomainService）
7. 处理登录失败（记录失败次数、锁定账户）
8. 处理登录成功：
   - 重置失败尝试次数
   - 创建会话（AuthSession）
   - 生成 access/refresh token
   - 更新账户统计（lastLoginAt, loginCount）
9. 发布领域事件（UserLoggedInEvent）
10. 返回登录结果

---

### 2.3 基础设施层 (Infrastructure Layer)

#### 仓储实现 (apps/api/modules/authentication/infrastructure/repositories/)

**PrismaAuthCredentialRepository**:

- 实现 `IAuthCredentialRepository` 接口
- 查询凭证：`findByAccountUuid(accountUuid)`
- 更新凭证：`save(credential)`（更新失败次数、锁定时间）

**PrismaAuthSessionRepository**:

- 实现 `IAuthSessionRepository` 接口
- 创建会话：`save(session)`
- 查询会话：`findByAccessToken(token)`

**PrismaAccountRepository**:

- 实现 `IAccountRepository` 接口
- 查询账户：`findByUsername/Email/Phone(identifier)`
- 更新统计：保存 account 时更新 stats 字段

#### Token 服务 (apps/api/modules/authentication/infrastructure/services/)

**TokenService**:

- 职责: 生成和验证 JWT token
- 方法:
  - `generateAccessToken(accountUuid, sessionUuid)`: 生成短期 access token（15-60分钟）
  - `generateRefreshToken()`: 生成长期 refresh token（7-30天）
  - `verifyAccessToken(token)`: 验证 access token 合法性

```typescript
// TokenService.ts
import jwt from 'jsonwebtoken';

export class TokenService {
  private readonly accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;

  generateAccessToken(accountUuid: string, sessionUuid: string): string {
    return jwt.sign(
      { accountUuid, sessionUuid, type: 'access' },
      this.accessTokenSecret,
      { expiresIn: '1h' }, // 1小时
    );
  }

  generateRefreshToken(accountUuid: string, sessionUuid: string): string {
    return jwt.sign(
      { accountUuid, sessionUuid, type: 'refresh' },
      this.refreshTokenSecret,
      { expiresIn: '30d' }, // 30天
    );
  }

  verifyAccessToken(token: string): { accountUuid: string; sessionUuid: string } {
    const payload = jwt.verify(token, this.accessTokenSecret) as any;
    return { accountUuid: payload.accountUuid, sessionUuid: payload.sessionUuid };
  }
}
```

#### 数据库 Schema 补充

```prisma
model AuthSession {
  uuid                   String   @id @default(uuid())
  account_uuid           String
  access_token           String   @unique
  access_token_expires_at DateTime

  // Refresh Token（嵌入 JSON）
  refresh_token          Json     // { token, expiresAt, createdAt }

  // 设备信息
  device                 Json     // { deviceType, os, browser, userAgent }
  ip_address             String
  location               Json?    // { country, region, city, timezone }

  // 状态
  status                 String   @default("ACTIVE")
  last_activity_at       DateTime
  last_activity_type     String?

  // 时间戳
  created_at             DateTime @default(now())
  expires_at             DateTime
  revoked_at             DateTime?

  // 关联关系
  account                Account  @relation(fields: [account_uuid], references: [uuid], onDelete: Cascade)

  @@index([account_uuid])
  @@index([access_token])
  @@map("auth_sessions")
}
```

---

## 3. 详细流程设计

### 3.1 时序图

```
Frontend          API Controller         AuthenticationApp      AccountDomain      AuthenticationDomain
  │                    │                  Service                Service                Service
  │                    │                     │                       │                        │
  │──Login Request─────>│                     │                       │                        │
  │  {identifier,      │                     │                       │                        │
  │   password,        │                     │                       │                        │
  │   deviceInfo}      │                     │                       │                        │
  │                    │                     │                       │                        │
  │                    │──login()──────────>│                       │                        │
  │                    │                     │                       │                        │
  │                    │                     │──Validate Input───────>│                        │
  │                    │                     │                       │                        │
  │                    │                     │──Find Account────────>│                        │
  │                    │                     │   (by identifier)     │                        │
  │                    │                     │<──Account or null─────│                        │
  │                    │                     │                       │                        │
  │                    │                     │──Check Account Status─>│                        │
  │                    │                     │<──ACTIVE──────────────│                        │
  │                    │                     │                       │                        │
  │                    │                     │──Find Credential──────────────────────────────>│
  │                    │                     │   (by accountUuid)    │                        │
  │                    │                     │<──Credential──────────────────────────────────│
  │                    │                     │                       │                        │
  │                    │                     │──Check Credential Status─────────────────────>│
  │                    │                     │<──ACTIVE──────────────────────────────────────│
  │                    │                     │                       │                        │
  │                    │                     │──Is Locked?───────────────────────────────────>│
  │                    │                     │<──false───────────────────────────────────────│
  │                    │                     │                       │                        │
  │                    │                     │──Verify Password──────────────────────────────>│
  │                    │                     │   (hash + compare)    │                        │
  │                    │                     │<──true/false──────────────────────────────────│
  │                    │                     │                       │                        │
  │                    │                     │[If false]             │                        │
  │                    │                     │──Record Failed Login──────────────────────────>│
  │                    │                     │<──Updated Credential──────────────────────────│
  │                    │                     │──Throw Error──────────>│                        │
  │                    │                     │                       │                        │
  │                    │                     │[If true]              │                        │
  │                    │                     │──Reset Failed Attempts────────────────────────>│
  │                    │                     │<──Success─────────────────────────────────────│
  │                    │                     │                       │                        │
  │                    │                     │──Generate Access Token────────────────────────>│
  │                    │                     │<──Access Token────────────────────────────────│
  │                    │                     │                       │                        │
  │                    │                     │──Generate Refresh Token───────────────────────>│
  │                    │                     │<──Refresh Token───────────────────────────────│
  │                    │                     │                       │                        │
  │                    │                     │──Create Session───────────────────────────────>│
  │                    │                     │   {accountUuid,       │                        │
  │                    │                     │    accessToken,       │                        │
  │                    │                     │    refreshToken,      │                        │
  │                    │                     │    device, ip}        │                        │
  │                    │                     │<──Session Object──────────────────────────────│
  │                    │                     │                       │                        │
  │                    │                     │──Save Session─────────────────────────────────>│
  │                    │                     │<──Success─────────────────────────────────────│
  │                    │                     │                       │                        │
  │                    │                     │──Update Account Stats─>│                        │
  │                    │                     │   (lastLoginAt,       │                        │
  │                    │                     │    loginCount++)      │                        │
  │                    │                     │<──Success─────────────│                        │
  │                    │                     │                       │                        │
  │                    │                     │──Publish Event────────>│                        │
  │                    │                     │  UserLoggedInEvent    │                        │
  │                    │                     │                       │                        │
  │                    │<──LoginResponse─────│                       │                        │
  │<──200 OK───────────│  {accessToken,     │                       │                        │
  │   LoginResponse    │   refreshToken,    │                       │                        │
  │                    │   account, session}│                       │                        │
```

---

### 3.2 核心代码实现

#### Step 1: API Controller (apps/api/modules/authentication/interface/http/)

```typescript
// AuthController.ts
import { Router, Request, Response } from 'express';
import { AuthenticationApplicationService } from '../../application/services/AuthenticationApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthController');
const router = Router();

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password, rememberMe, deviceInfo } = req.body;

    // 基础验证
    if (!identifier || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Identifier and password are required',
      });
    }

    // 补充设备信息
    const fullDeviceInfo = {
      ...deviceInfo,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    // 调用应用服务
    const service = await AuthenticationApplicationService.getInstance();
    const result = await service.login({
      identifier,
      password,
      deviceInfo: fullDeviceInfo,
      rememberMe,
    });

    logger.info('User logged in successfully', {
      accountUuid: result.account.uuid,
      sessionUuid: result.session.uuid,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Login failed', error);

    // 错误处理
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Account not found',
      });
    }

    if (error.message.includes('locked')) {
      return res.status(423).json({
        error: 'ACCOUNT_LOCKED',
        message: error.message,
      });
    }

    if (error.message.includes('suspended')) {
      return res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended',
      });
    }

    if (error.message.includes('password') || error.message.includes('Invalid credentials')) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username/email or password',
      });
    }

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Login failed. Please try again later.',
    });
  }
});

export default router;
```

---

#### Step 2: Application Service (apps/api/modules/authentication/application/services/)

```typescript
// AuthenticationApplicationService.ts
import { Account, AccountDomainService, type IAccountRepository } from '@dailyuse/domain-server';
import {
  AuthenticationDomainService,
  type IAuthCredentialRepository,
  type IAuthSessionRepository,
} from '@dailyuse/domain-server';
import { AuthenticationContracts, AccountContracts } from '@dailyuse/contracts';
import { createLogger, eventBus } from '@dailyuse/utils';
import { AuthenticationContainer } from '../../infrastructure/di/AuthenticationContainer';
import { AccountContainer } from '../../../account/infrastructure/di/AccountContainer';
import { TokenService } from '../../infrastructure/services/TokenService';
import bcrypt from 'bcrypt';

const logger = createLogger('AuthenticationApplicationService');

type AccountClientDTO = AccountContracts.AccountClientDTO;
type AuthSessionClientDTO = AuthenticationContracts.AuthSessionClientDTO;
type DeviceInfo = AuthenticationContracts.DeviceInfoServer;

interface LoginRequest {
  identifier: string;
  password: string;
  deviceInfo: DeviceInfo;
  rememberMe?: boolean;
  rememberMeDays?: number;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  account: AccountClientDTO;
  session: AuthSessionClientDTO;
}

export class AuthenticationApplicationService {
  private static instance: AuthenticationApplicationService;
  private accountDomainService: AccountDomainService;
  private authDomainService: AuthenticationDomainService;
  private accountRepo: IAccountRepository;
  private credentialRepo: IAuthCredentialRepository;
  private sessionRepo: IAuthSessionRepository;
  private tokenService: TokenService;

  private constructor(
    accountRepo: IAccountRepository,
    credentialRepo: IAuthCredentialRepository,
    sessionRepo: IAuthSessionRepository,
  ) {
    this.accountRepo = accountRepo;
    this.credentialRepo = credentialRepo;
    this.sessionRepo = sessionRepo;
    this.accountDomainService = new AccountDomainService(accountRepo);
    this.authDomainService = new AuthenticationDomainService(credentialRepo, sessionRepo);
    this.tokenService = new TokenService();
  }

  static async createInstance(
    accountRepo?: IAccountRepository,
    credentialRepo?: IAuthCredentialRepository,
    sessionRepo?: IAuthSessionRepository,
  ): Promise<AuthenticationApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const authContainer = AuthenticationContainer.getInstance();

    const accRepo = accountRepo || accountContainer.getAccountRepository();
    const credRepo = credentialRepo || authContainer.getAuthCredentialRepository();
    const sessRepo = sessionRepo || authContainer.getAuthSessionRepository();

    AuthenticationApplicationService.instance = new AuthenticationApplicationService(
      accRepo,
      credRepo,
      sessRepo,
    );
    return AuthenticationApplicationService.instance;
  }

  static async getInstance(): Promise<AuthenticationApplicationService> {
    if (!AuthenticationApplicationService.instance) {
      AuthenticationApplicationService.instance =
        await AuthenticationApplicationService.createInstance();
    }
    return AuthenticationApplicationService.instance;
  }

  /**
   * 用户登录
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { identifier, password, deviceInfo, rememberMe } = request;

    // 1. 查询账户（支持用户名/邮箱/手机号）
    const account = await this.findAccountByIdentifier(identifier);
    if (!account) {
      throw new Error('Account not found');
    }

    // 2. 检查账户状态
    if (account.status === 'DELETED') {
      throw new Error('Account has been deleted');
    }
    if (account.status === 'SUSPENDED') {
      throw new Error('Account is suspended. Please contact support.');
    }
    if (account.status === 'INACTIVE') {
      throw new Error('Account is inactive. Please verify your email.');
    }

    // 3. 查询凭证
    const credential = await this.credentialRepo.findByAccountUuid(account.uuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    // 4. 检查凭证状态
    if (credential.status !== 'ACTIVE') {
      throw new Error(`Credential is ${credential.status.toLowerCase()}`);
    }

    // 5. 检查是否被锁定
    if (await this.authDomainService.isCredentialLocked(account.uuid)) {
      const lockedUntil = credential.security.lockedUntil;
      const minutes = Math.ceil((lockedUntil! - Date.now()) / 60000);
      throw new Error(`Account is locked. Please try again in ${minutes} minutes.`);
    }

    // 6. 验证密码
    const isValid = await this.verifyPassword(password, credential);
    if (!isValid) {
      // 记录失败登录
      await this.authDomainService.recordFailedLogin(account.uuid);
      throw new Error('Invalid credentials');
    }

    // 7. 重置失败尝试次数
    await this.authDomainService.resetFailedAttempts(account.uuid);

    // 8. 生成 tokens
    const accessToken = this.tokenService.generateAccessToken(account.uuid, ''); // sessionUuid 后面生成
    const refreshToken = this.tokenService.generateRefreshToken(account.uuid, '');

    // 9. 创建会话
    const session = await this.authDomainService.createSession({
      accountUuid: account.uuid,
      accessToken,
      refreshToken,
      device: deviceInfo,
      ipAddress: deviceInfo.ipAddress,
      location: deviceInfo.location,
    });

    // 10. 保存会话
    await this.sessionRepo.save(session);

    // 11. 更新账户统计
    account.updateLastLogin();
    account.incrementLoginCount();
    await this.accountRepo.save(account);

    // 12. 发布登录事件
    eventBus.send('user:logged-in', {
      accountUuid: account.uuid,
      sessionUuid: session.uuid,
      deviceType: deviceInfo.deviceType,
      ipAddress: deviceInfo.ipAddress,
      loginAt: Date.now(),
    });

    logger.info('Login successful', {
      accountUuid: account.uuid,
      sessionUuid: session.uuid,
    });

    // 13. 返回结果
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken.token,
      expiresIn: Math.floor((session.accessTokenExpiresAt - Date.now()) / 1000),
      tokenType: 'Bearer',
      account: account.toClientDTO(),
      session: session.toClientDTO(),
    };
  }

  /**
   * 通过标识符查找账户（支持用户名/邮箱/手机号）
   */
  private async findAccountByIdentifier(identifier: string): Promise<Account | null> {
    // 判断标识符类型
    if (identifier.includes('@')) {
      // 邮箱
      return this.accountRepo.findByEmail(identifier);
    } else if (/^\+?\d{10,15}$/.test(identifier)) {
      // 手机号
      return this.accountRepo.findByPhone(identifier);
    } else {
      // 用户名
      return this.accountRepo.findByUsername(identifier);
    }
  }

  /**
   * 验证密码
   */
  private async verifyPassword(plainPassword: string, credential: any): Promise<boolean> {
    const hashedPassword = credential.passwordCredential?.hashedPassword;
    if (!hashedPassword) return false;

    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
```

---

#### Step 3: Domain Service (packages/domain-server/authentication/services/)

已在现有代码中实现，主要方法：

**AuthenticationDomainService.verifyPassword()**:

```typescript
async verifyPassword(accountUuid: string, hashedPassword: string): Promise<boolean> {
  const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
  if (!credential) return false;
  return credential.verifyPassword(hashedPassword);
}
```

**AuthenticationDomainService.recordFailedLogin()**:

```typescript
async recordFailedLogin(accountUuid: string): Promise<void> {
  const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
  if (!credential) throw new Error('Credential not found');
  credential.recordFailedLogin();
  await this.credentialRepository.save(credential);
}
```

**AuthenticationDomainService.isCredentialLocked()**:

```typescript
async isCredentialLocked(accountUuid: string): Promise<boolean> {
  const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
  if (!credential) return false;
  const lockedUntil = credential.security.lockedUntil;
  return lockedUntil ? lockedUntil > Date.now() : false;
}
```

**AuthenticationDomainService.createSession()**:

```typescript
async createSession(params: {
  accountUuid: string;
  accessToken: string;
  refreshToken: string;
  device: DeviceInfo;
  ipAddress: string;
  location?: any;
}): Promise<AuthSession> {
  const session = AuthSession.create({
    accountUuid: params.accountUuid,
    accessToken: params.accessToken,
    refreshToken: params.refreshToken,
    device: params.device,
    ipAddress: params.ipAddress,
    location: params.location,
  });
  return session;
}
```

---

## 4. 错误处理策略

### 4.1 业务异常

| 错误代码              | HTTP 状态 | 描述       | 处理方式                   |
| --------------------- | --------- | ---------- | -------------------------- |
| `NOT_FOUND`           | 404       | 账户不存在 | 提示用户检查用户名/邮箱    |
| `INVALID_CREDENTIALS` | 401       | 密码错误   | 提示密码错误，记录失败次数 |
| `ACCOUNT_LOCKED`      | 423       | 账户被锁定 | 提示锁定剩余时间           |
| `ACCOUNT_SUSPENDED`   | 403       | 账户被暂停 | 提示联系客服               |
| `ACCOUNT_INACTIVE`    | 403       | 账户未激活 | 提示验证邮箱               |
| `CREDENTIAL_EXPIRED`  | 403       | 凭证已过期 | 提示重置密码               |

### 4.2 安全策略

**防暴力破解**:

- 连续 5 次密码错误 → 锁定账户 15 分钟
- 连续 10 次密码错误 → 锁定账户 1 小时
- 连续 15 次密码错误 → 锁定账户 24 小时

**速率限制**:

- 同一 IP：每分钟最多 10 次登录尝试
- 同一账户：每分钟最多 5 次登录尝试

**异常登录检测**:

- 地理位置突变（如从中国到美国）
- 设备类型变化（如从桌面到移动）
- 发送邮件/短信提醒用户

---

## 5. 安全考虑

### 5.1 密码安全

- **加密算法**: bcrypt（cost factor = 12）或 argon2
- **盐值**: 每个密码使用唯一的盐值
- **传输**: HTTPS 加密传输
- **存储**: 只存储哈希后的密码

### 5.2 Token 安全

- **Access Token**: 短期有效（15分钟-1小时），存储在内存或 sessionStorage
- **Refresh Token**: 长期有效（7-30天），存储在 httpOnly cookie
- **签名**: 使用 RS256 或 HS256 算法签名
- **Rotation**: Refresh token 使用后立即轮换

### 5.3 会话安全

- **设备绑定**: 会话与设备/IP 绑定
- **活动追踪**: 记录每次活动时间和类型
- **超时**: 15分钟无活动自动过期
- **并发控制**: 限制同一账户的活跃会话数量（如最多 5 个）

---

## 6. 测试策略

### 6.1 单元测试

```typescript
describe('AuthenticationApplicationService', () => {
  it('should successfully login with valid credentials', async () => {
    // Arrange
    const mockAccountRepo = createMockAccountRepository();
    const mockCredentialRepo = createMockCredentialRepository();
    const mockSessionRepo = createMockSessionRepository();
    const service = await AuthenticationApplicationService.createInstance(
      mockAccountRepo,
      mockCredentialRepo,
      mockSessionRepo,
    );

    // Act
    const result = await service.login({
      identifier: 'testuser',
      password: 'Password123',
      deviceInfo: createMockDeviceInfo(),
    });

    // Assert
    expect(result.accessToken).toBeDefined();
    expect(result.account.username).toBe('testuser');
    expect(mockSessionRepo.save).toHaveBeenCalled();
  });

  it('should throw error when password is incorrect', async () => {
    // Test invalid credentials
  });

  it('should lock account after 5 failed attempts', async () => {
    // Test account locking
  });
});
```

### 6.2 集成测试

```typescript
describe('Login API Integration', () => {
  it('POST /api/auth/login - should login successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'testuser',
        password: 'Password123',
        deviceInfo: {
          deviceType: 'BROWSER',
          os: 'Windows',
          browser: 'Chrome',
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
  });
});
```

---

## 7. 监控与日志

### 7.1 日志记录

- 登录成功：`logger.info('User logged in', { accountUuid, sessionUuid, ip })`
- 登录失败：`logger.warn('Login failed', { identifier, reason, ip })`
- 账户锁定：`logger.warn('Account locked', { accountUuid, failedAttempts })`
- 异常登录：`logger.warn('Suspicious login', { accountUuid, location, device })`

### 7.2 监控指标

- **登录成功率**: 成功登录数 / 总登录尝试数
- **登录失败原因分布**: 密码错误、账户不存在、账户锁定等
- **平均登录耗时**: P50, P95, P99
- **异常登录检测率**: 异常登录数 / 总登录数
- **活跃会话数**: 当前活跃的会话总数

---

## 8. 未来优化

1. **多因素认证（MFA）**: 支持 TOTP、SMS、Email 验证码
2. **社交登录**: 集成 Google、GitHub、Microsoft 等第三方登录
3. **生物识别**: 支持 Face ID、Touch ID、指纹识别
4. **无密码登录**: 支持 Magic Link、WebAuthn/FIDO2
5. **智能风控**: 基于机器学习的异常登录检测
6. **设备管理**: 用户可查看并管理所有登录设备
7. **登录通知**: 每次登录发送邮件/推送通知
8. **密码过期策略**: 强制定期更换密码

---

## 9. 相关文档

- [用户注册流程设计](./USER_REGISTRATION_FLOW.md)
- [用户登出流程设计](./USER_LOGOUT_FLOW.md)
- [账户注销流程设计](./ACCOUNT_DELETION_FLOW.md)
- [Account 模块设计](../ACCOUNT_MODULE_DESIGN.md)
- [Authentication 模块设计](../AUTHENTICATION_MODULE_DESIGN.md)
- [Token 刷新流程](./TOKEN_REFRESH_FLOW.md)

---

## 10. 变更历史

| 版本 | 日期       | 作者         | 变更说明 |
| ---- | ---------- | ------------ | -------- |
| 1.0  | 2025-10-17 | AI Assistant | 初始版本 |
