# Repository 事务支持实施指南

## 📋 概述

本文档说明如何为 Repository 接口添加事务支持，以便在 ApplicationService 中实现原子性操作。

**状态**: 📝 实施指南
**优先级**: 高
**影响范围**: Authentication 和 Account 模块的 Repository

---

## 🎯 目标

为以下 Repository 接口的 `save()` 方法添加可选的事务参数：

1. `IAuthCredentialRepository`
2. `IAuthSessionRepository`
3. `IAccountRepository`

---

## 📐 设计方案

### 方案 1: 添加可选参数（推荐）

**优点**:
- 向后兼容，不破坏现有代码
- 实施简单，影响范围小
- 逐步迁移

**实现**:

```typescript
import { PrismaClient, Prisma } from '@prisma/client';

export interface IAuthCredentialRepository {
  /**
   * 保存凭证
   * @param credential 凭证聚合根
   * @param tx 可选的 Prisma 事务客户端
   */
  save(
    credential: AuthCredential,
    tx?: Prisma.TransactionClient
  ): Promise<void>;
  
  // ... 其他方法
}
```

**使用示例**:

```typescript
// 无事务（向后兼容）
await repository.save(credential);

// 使用事务
await prisma.$transaction(async (tx) => {
  await repository.save(credential, tx);
  await anotherRepository.save(otherAggregate, tx);
});
```

### 方案 2: 独立的事务管理器

**优点**:
- 更清晰的事务边界
- 更好的测试性
- 事务逻辑集中管理

**实现**:

```typescript
export interface ITransactionManager {
  executeInTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T>;
}

// 在 ApplicationService 中使用
async login(request: LoginRequest): Promise<LoginResponse> {
  return await this.transactionManager.executeInTransaction(async (tx) => {
    const account = await this.accountRepository.findByUsername(
      request.username,
      tx
    );
    const credential = await this.credentialRepository.save(credential, tx);
    const session = await this.sessionRepository.save(session, tx);
    return response;
  });
}
```

---

## 🔧 实施步骤（方案 1 - 推荐）

### 步骤 1: 更新 Repository 接口

#### 1.1 IAuthCredentialRepository

**文件**: `packages/domain-server/src/authentication/repositories/IAuthCredentialRepository.ts`

```typescript
import { Prisma } from '@prisma/client';

export interface IAuthCredentialRepository {
  /**
   * 保存凭证
   * @param credential 凭证聚合根
   * @param tx 可选的 Prisma 事务客户端，用于支持事务操作
   */
  save(
    credential: AuthCredential,
    tx?: Prisma.TransactionClient
  ): Promise<void>;
  
  // 其他查询方法也可以添加 tx 参数
  findByAccountUuid(
    accountUuid: string,
    tx?: Prisma.TransactionClient
  ): Promise<AuthCredential | null>;
  
  // ... 其他方法保持不变
}
```

#### 1.2 IAuthSessionRepository

**文件**: `packages/domain-server/src/authentication/repositories/IAuthSessionRepository.ts`

```typescript
import { Prisma } from '@prisma/client';

export interface IAuthSessionRepository {
  save(
    session: AuthSession,
    tx?: Prisma.TransactionClient
  ): Promise<void>;
  
  findByAccountUuid(
    accountUuid: string,
    tx?: Prisma.TransactionClient
  ): Promise<AuthSession[]>;
  
  // ... 其他方法
}
```

#### 1.3 IAccountRepository

**文件**: `packages/domain-server/src/account/repositories/IAccountRepository.ts`

```typescript
import { Prisma } from '@prisma/client';

export interface IAccountRepository {
  save(
    account: Account,
    tx?: Prisma.TransactionClient
  ): Promise<void>;
  
  findById(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Account | null>;
  
  // ... 其他方法
}
```

### 步骤 2: 更新 Repository 实现

#### 2.1 PrismaAuthCredentialRepository

**文件**: `apps/api/src/modules/authentication/infrastructure/repositories/PrismaAuthCredentialRepository.ts`

```typescript
export class PrismaAuthCredentialRepository implements IAuthCredentialRepository {
  constructor(private prisma: PrismaClient) {}

  async save(
    credential: AuthCredential,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx || this.prisma;
    const dto = credential.toPersistenceDTO();
    
    await client.authCredential.upsert({
      where: { uuid: dto.uuid },
      create: dto,
      update: dto,
    });
  }
  
  async findByAccountUuid(
    accountUuid: string,
    tx?: Prisma.TransactionClient
  ): Promise<AuthCredential | null> {
    const client = tx || this.prisma;
    const record = await client.authCredential.findFirst({
      where: { accountUuid },
    });
    
    if (!record) return null;
    return AuthCredential.fromPersistenceDTO(record);
  }
  
  // ... 其他方法
}
```

### 步骤 3: 更新 ApplicationService 使用事务

#### 3.1 RegistrationApplicationService

```typescript
async register(request: RegistrationRequest): Promise<RegistrationResponse> {
  logger.info('[RegistrationApplicationService] Starting registration');

  try {
    // 验证业务规则
    this.accountDomainService.validateAccountCreation({
      username: request.username,
      email: request.email,
    });

    this.authenticationDomainService.validatePasswordStrength(request.password);

    // 检查唯一性
    const existingUsername = await this.accountRepository.findByUsername(request.username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    const existingEmail = await this.accountRepository.findByEmail(request.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(request.password, 12);

    // ===== 使用事务执行原子操作 =====
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 创建账户聚合根（DomainService）
      const account = this.accountDomainService.createAccount({
        username: request.username,
        email: request.email,
        displayName: request.displayName || request.username,
      });

      // 2. 持久化账户（ApplicationService）
      await this.accountRepository.save(account, tx);

      // 3. 创建凭证聚合根（DomainService）
      const credential = this.authenticationDomainService.createPasswordCredential({
        accountUuid: account.uuid,
        hashedPassword,
      });

      // 4. 持久化凭证（ApplicationService）
      await this.credentialRepository.save(credential, tx);

      return { account, credential };
    });

    logger.info('[RegistrationApplicationService] Registration completed', {
      accountUuid: result.account.uuid,
    });

    // 发布事件
    await this.publishAccountCreatedEvent(result.account);
    await this.publishCredentialCreatedEvent(result.credential);

    return {
      success: true,
      account: {
        uuid: result.account.uuid,
        username: result.account.username,
        email: result.account.email,
      },
      message: 'Registration successful',
    };
  } catch (error) {
    logger.error('[RegistrationApplicationService] Registration failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

#### 3.2 AuthenticationApplicationService

```typescript
async login(request: LoginRequest): Promise<LoginResponse> {
  logger.info('[AuthenticationApplicationService] Starting login');

  try {
    // 查询和验证（无需事务）
    const account = await this.accountRepository.findByUsername(request.username);
    if (!account) {
      throw new Error('Invalid username or password');
    }

    const credential = await this.credentialRepository.findByAccountUuid(account.uuid);
    if (!credential) {
      throw new Error('Invalid username or password');
    }

    const isLocked = this.authenticationDomainService.isCredentialLocked(credential);
    if (isLocked) {
      throw new Error('Account is locked');
    }

    const hashedPassword = await bcrypt.hash(request.password, 12);
    const isPasswordValid = this.authenticationDomainService.verifyPassword(
      credential,
      hashedPassword,
    );

    if (!isPasswordValid) {
      // 记录失败登录需要持久化，所以使用事务
      await this.prisma.$transaction(async (tx) => {
        credential.recordFailedLogin();
        await this.credentialRepository.save(credential, tx);
      });
      throw new Error('Invalid username or password');
    }

    // 生成令牌
    const { accessToken, refreshToken, expiresAt } = this.generateTokens();

    // ===== 使用事务创建会话并重置失败尝试 =====
    const session = await this.prisma.$transaction(async (tx) => {
      // 创建会话
      const newSession = this.authenticationDomainService.createSession({
        accountUuid: account.uuid,
        accessToken,
        refreshToken,
        device: request.deviceInfo,
        ipAddress: request.ipAddress,
        location: request.location,
      });
      
      await this.sessionRepository.save(newSession, tx);

      // 重置失败尝试
      credential.resetFailedAttempts();
      await this.credentialRepository.save(credential, tx);

      return newSession;
    });

    // 发布事件
    await this.publishLoginSuccessEvent(account, session);

    return {
      success: true,
      session: {
        sessionUuid: session.uuid,
        accessToken,
        refreshToken,
        expiresAt,
      },
      account: {
        uuid: account.uuid,
        username: account.username,
        email: account.email,
        displayName: account.profile?.displayName || account.username,
      },
      message: 'Login successful',
    };
  } catch (error) {
    logger.error('[AuthenticationApplicationService] Login failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

### 步骤 4: 在 ApplicationService 中注入 PrismaClient

```typescript
export class AuthenticationApplicationService {
  private static instance: AuthenticationApplicationService;

  private credentialRepository: IAuthCredentialRepository;
  private sessionRepository: IAuthSessionRepository;
  private accountRepository: IAccountRepository;
  private authenticationDomainService: AuthenticationDomainService;
  private prisma: PrismaClient; // 添加 Prisma 客户端

  private constructor(
    credentialRepository: IAuthCredentialRepository,
    sessionRepository: IAuthSessionRepository,
    accountRepository: IAccountRepository,
    prisma: PrismaClient, // 注入 Prisma
  ) {
    this.credentialRepository = credentialRepository;
    this.sessionRepository = sessionRepository;
    this.accountRepository = accountRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
    this.prisma = prisma;
  }

  static async createInstance(
    credentialRepository?: IAuthCredentialRepository,
    sessionRepository?: IAuthSessionRepository,
    accountRepository?: IAccountRepository,
    prisma?: PrismaClient, // 可选注入
  ): Promise<AuthenticationApplicationService> {
    const authContainer = AuthenticationContainer.getInstance();
    const accountContainer = AccountContainer.getInstance();

    const credRepo = credentialRepository || authContainer.getAuthCredentialRepository();
    const sessRepo = sessionRepository || authContainer.getAuthSessionRepository();
    const accRepo = accountRepository || accountContainer.getAccountRepository();
    const prismaClient = prisma || authContainer.getPrismaClient();

    AuthenticationApplicationService.instance = new AuthenticationApplicationService(
      credRepo,
      sessRepo,
      accRepo,
      prismaClient,
    );
    return AuthenticationApplicationService.instance;
  }
}
```

---

## ⚠️ 注意事项

### 1. 事务嵌套

Prisma 不支持嵌套事务。如果在事务中调用的方法内部也开启了事务，会导致错误。

**解决方案**: 传递 `tx` 参数到所有需要在同一事务中执行的操作。

### 2. 事件发布

事件应该在事务**提交后**发布，而不是在事务内部。

**正确做法**:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 所有数据库操作
  await repository.save(aggregate, tx);
  return aggregate;
});

// 事务成功后才发布事件
await eventBus.publish({...});
```

### 3. 查询操作

只读查询通常不需要事务，但如果需要在事务中读取刚写入的数据，需要传递 `tx` 参数。

### 4. 向后兼容

通过使用可选参数 `tx?`，确保现有代码不需要修改即可继续运行。

---

## 🧪 测试策略

### 单元测试

```typescript
describe('AuthenticationApplicationService', () => {
  it('should rollback transaction on error', async () => {
    const mockTx = {
      authCredential: { upsert: jest.fn().mockRejectedValue(new Error('DB Error')) },
    };
    
    await expect(
      service.login(validRequest)
    ).rejects.toThrow();
    
    // 验证事务被回滚
    expect(mockTx.authCredential.upsert).toHaveBeenCalled();
  });
});
```

### 集成测试

```typescript
describe('Registration Integration Test', () => {
  it('should create account and credential atomically', async () => {
    const result = await registrationService.register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
    });
    
    expect(result.success).toBe(true);
    
    // 验证账户已创建
    const account = await accountRepository.findById(result.account.uuid);
    expect(account).not.toBeNull();
    
    // 验证凭证已创建
    const credential = await credentialRepository.findByAccountUuid(result.account.uuid);
    expect(credential).not.toBeNull();
  });
  
  it('should rollback on credential creation failure', async () => {
    // 模拟凭证创建失败
    jest.spyOn(credentialRepository, 'save').mockRejectedValue(new Error('Fail'));
    
    await expect(
      registrationService.register(validRequest)
    ).rejects.toThrow();
    
    // 验证账户也没有被创建（事务回滚）
    const account = await accountRepository.findByUsername('testuser');
    expect(account).toBeNull();
  });
});
```

---

## 📊 实施优先级

| 优先级 | Repository | 原因 |
|--------|-----------|------|
| 🔴 高 | IAccountRepository | 用户注册需要原子性 |
| 🔴 高 | IAuthCredentialRepository | 与账户创建同时进行 |
| 🟡 中 | IAuthSessionRepository | 登录时需要原子性 |
| 🟢 低 | 其他 Repository | 单一操作，事务可选 |

---

## ✅ 验证清单

完成实施后，检查以下项：

- [ ] Repository 接口已添加 `tx?` 参数
- [ ] Repository 实现已支持事务参数
- [ ] ApplicationService 已更新使用事务
- [ ] ApplicationService 已注入 PrismaClient
- [ ] 事件在事务外发布
- [ ] 向后兼容性测试通过
- [ ] 集成测试覆盖事务场景
- [ ] 错误回滚测试通过
- [ ] 文档已更新

---

## 📚 参考资料

- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [DDD Transaction Patterns](https://martinfowler.com/eaaCatalog/unitOfWork.html)
- [Application Service Best Practices](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice)

---

**创建时间**: 2024 年
**最后更新**: 2024 年
**状态**: 📝 待实施
