# 账户注销（Account Deletion）流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-17
- **架构模式**: DDD (Account 模块 + Authentication 模块分离)
- **相关模块**: Account, Authentication
- **业务场景**: 用户主动注销（删除）账户

---

## 1. 业务概述

### 1.1 业务目标

用户主动发起账户注销，彻底删除或逻辑删除账户及相关数据，系统需要：
- 验证用户身份（密码/二次认证/验证码）
- 提供数据导出选项（GDPR 合规）
- 注销所有认证凭证和会话
- 删除或匿名化用户数据
- 记录注销历史和原因
- 支持注销冷静期（可选恢复）

### 1.2 核心原则

- **Account 模块**：负责账户状态变更、数据清理、注销历史
- **Authentication 模块**：负责凭证和会话注销
- **分离关注点**：账户删除需要协调多个聚合根（Account, AuthCredential, AuthSession）
- **安全优先**：防止误操作、恶意注销、未授权删除
- **合规要求**：遵守 GDPR、CCPA 等数据保护法规

### 1.3 前置条件

- 用户已登录
- 用户提供正确的密码或通过二次认证
- 账户状态为 ACTIVE 或 INACTIVE（非 DELETED）
- 用户同意注销声明（数据不可恢复）

### 1.4 后置条件

- ✅ Account 状态已更新为 DELETED
- ✅ AuthCredential 状态已更新为 REVOKED
- ✅ 所有 AuthSession 已注销（状态为 REVOKED）
- ✅ 用户数据已删除或匿名化
- ✅ 领域事件已发布：`AccountDeletedEvent`
- ✅ 注销确认邮件已发送

---

## 2. 架构分层设计

### 2.1 领域模型 (Domain Layer)

#### Account 模块 (packages/domain-server/account/)

**聚合根**: `Account`
- 属性:
  - `uuid`: 账户唯一标识
  - `username`: 用户名
  - `email`: 邮箱
  - `status`: 账户状态（ACTIVE, INACTIVE, SUSPENDED, DELETED）
  - `deletedAt`: 删除时间
- 方法:
  - `markAsDeleted(reason?: string)`: 标记为已删除
  - `anonymizeData()`: 匿名化数据

**实体**: `AccountHistory`
- 记录账户的重要操作历史
- 包含注销原因、操作时间、操作类型

**领域服务**: `AccountDomainService`
- 职责:
  - 软删除账户（markAccountDeleted）
  - 硬删除账户（permanentlyDeleteAccount）
  - 数据匿名化（anonymizeAccountData）
  - 数据导出（exportAccountData）

**仓储接口**: `IAccountRepository`
```typescript
interface IAccountRepository {
  findById(uuid: string): Promise<Account | null>;
  save(account: Account): Promise<void>;
  delete(uuid: string): Promise<void>; // 硬删除
}
```

#### Authentication 模块 (packages/domain-server/authentication/)

**聚合根**: `AuthCredential`, `AuthSession`

**领域服务**: `AuthenticationDomainService`
- 职责:
  - 注销凭证（revokeCredential）
  - 注销所有会话（revokeAllSessions）
  - 验证密码（verifyPassword）

---

### 2.2 应用层 (Application Layer)

#### 账户删除应用服务 (apps/api/modules/account/application/services/)

**服务**: `AccountDeletionApplicationService`

**核心用例**: `deleteAccount()`, `scheduleAccountDeletion()`

**输入 DTO**:
```typescript
interface DeleteAccountRequest {
  accountUuid: string;
  password: string;              // 二次验证密码
  twoFactorCode?: string;        // 二次认证码（如启用）
  reason?: string;               // 注销原因
  feedback?: string;             // 用户反馈
  confirmationText?: string;     // 确认文本（如"DELETE"）
  exportData?: boolean;          // 是否导出数据
}

interface ScheduleAccountDeletionRequest {
  accountUuid: string;
  password: string;
  scheduledAt: number;           // 计划删除时间（冷静期后）
  reason?: string;
}
```

**输出 DTO**:
```typescript
interface DeleteAccountResponse {
  success: boolean;
  message: string;
  deletedAt: number;
  dataExportUrl?: string;        // 数据导出链接（如请求）
  recoveryDeadline?: number;     // 恢复截止时间（冷静期）
}
```

**职责**:
1. 参数验证（password、confirmationText）
2. 身份验证（密码、二次认证）
3. 查询账户、凭证、会话
4. 检查账户状态（是否已删除）
5. 数据导出（如请求）
6. 事务操作：
   - 软删除账户（标记为 DELETED）
   - 注销凭证（AuthCredential）
   - 注销所有会话（AuthSession）
   - 删除或匿名化关联数据（Goals, Tasks, Reminders 等）
7. 记录注销历史
8. 发布领域事件（AccountDeletedEvent）
9. 发送确认邮件
10. 返回删除结果

---

### 2.3 基础设施层 (Infrastructure Layer)

#### 仓储实现 (apps/api/modules/account/infrastructure/repositories/)

**PrismaAccountRepository**:
- 软删除：更新 status 和 deletedAt
- 硬删除：从数据库彻底删除记录（或保留匿名化数据）

**PrismaAuthCredentialRepository**, **PrismaAuthSessionRepository**:
- 注销凭证和会话

#### 数据清理服务 (apps/api/modules/account/infrastructure/services/)

**DataCleanupService**:
- 职责: 删除或匿名化用户关联数据
- 方法:
  - `cleanupUserGoals(accountUuid)`: 删除目标
  - `cleanupUserTasks(accountUuid)`: 删除任务
  - `cleanupUserReminders(accountUuid)`: 删除提醒
  - `cleanupUserNotifications(accountUuid)`: 删除通知
  - `anonymizeUserData(accountUuid)`: 匿名化数据（保留统计）

#### 数据导出服务

**DataExportService**:
- 职责: 导出用户数据为 JSON/CSV 格式
- 方法:
  - `exportAccountData(accountUuid)`: 导出账户信息
  - `exportGoalsData(accountUuid)`: 导出目标数据
  - `exportTasksData(accountUuid)`: 导出任务数据
  - 生成下载链接（临时 URL，24 小时有效）

#### 数据库操作

```typescript
// 软删除账户
await prisma.account.update({
  where: { uuid: accountUuid },
  data: {
    status: 'DELETED',
    deleted_at: new Date(),
    // 可选：匿名化敏感字段
    email: `deleted_${accountUuid}@deleted.local`,
    phone_number: null,
  },
});

// 注销凭证
await prisma.authCredential.update({
  where: { account_uuid: accountUuid },
  data: {
    status: 'REVOKED',
    revoked_at: new Date(),
  },
});

// 注销所有会话
await prisma.authSession.updateMany({
  where: { account_uuid: accountUuid },
  data: {
    status: 'REVOKED',
    revoked_at: new Date(),
  },
});

// 删除关联数据（或级联删除）
await prisma.goal.deleteMany({ where: { account_uuid: accountUuid } });
await prisma.task.deleteMany({ where: { account_uuid: accountUuid } });
await prisma.reminder.deleteMany({ where: { account_uuid: accountUuid } });
```

---

## 3. 详细流程设计

### 3.1 时序图 - 立即删除

```
Frontend         API Controller         AccountApp             AccountDomain      AuthenticationDomain    DataCleanup
  │                    │                  Service                Service                Service            Service
  │                    │                     │                       │                        │                 │
  │──Delete Request────>│                     │                       │                        │                 │
  │  {accountUuid,     │                     │                       │                        │                 │
  │   password,        │                     │                       │                        │                 │
  │   reason}          │                     │                       │                        │                 │
  │                    │                     │                       │                        │                 │
  │                    │──deleteAccount()──>│                       │                        │                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │──Validate Input───────>│                        │                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │──Find Account────────>│                        │                 │
  │                    │                     │<──Account─────────────│                        │                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │──Check Status─────────>│                        │                 │
  │                    │                     │<──ACTIVE──────────────│                        │                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │──Verify Password──────────────────────────────>│                 │
  │                    │                     │<──true────────────────────────────────────────│                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │[If exportData]        │                        │                 │
  │                    │                     │──Export Data──────────────────────────────────────────────────>│
  │                    │                     │<──Export URL──────────────────────────────────────────────────│
  │                    │                     │                       │                        │                 │
  │                    │                     │──Begin Transaction────>│                        │                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │──Mark Deleted─────────>│                        │                 │
  │                    │                     │   (account.markAsDeleted)                      │                 │
  │                    │                     │<──Updated Account─────│                        │                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │──Save Account─────────>│                        │                 │
  │                    │                     │<──Success─────────────│                        │                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │──Revoke Credential────────────────────────────>│                 │
  │                    │                     │<──Success─────────────────────────────────────│                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │──Revoke All Sessions──────────────────────────>│                 │
  │                    │                     │<──Success─────────────────────────────────────│                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │──Cleanup User Data────────────────────────────────────────────>│
  │                    │                     │<──Success─────────────────────────────────────────────────────│
  │                    │                     │                       │                        │                 │
  │                    │                     │──Commit Transaction───>│                        │                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │──Publish Event────────>│                        │                 │
  │                    │                     │  AccountDeletedEvent  │                        │                 │
  │                    │                     │                       │                        │                 │
  │                    │                     │──Send Confirmation Email────────────────────────>│                 │
  │                    │                     │                       │                        │                 │
  │                    │<──DeleteResponse────│                       │                        │                 │
  │<──200 OK───────────│  {success: true,   │                       │                        │                 │
  │                    │   deletedAt,       │                       │                        │                 │
  │                    │   dataExportUrl}   │                       │                        │                 │
```

### 3.2 时序图 - 计划删除（冷静期）

```
Frontend         API Controller         AccountApp             ScheduleService
  │                    │                  Service                   │
  │──Schedule Delete───>│                     │                       │
  │  {accountUuid,     │                     │                       │
  │   scheduledAt}     │                     │                       │
  │                    │                     │                       │
  │                    │──scheduleDelete()─>│                       │
  │                    │                     │                       │
  │                    │                     │──Create Job───────────>│
  │                    │                     │   (delayed 30 days)   │
  │                    │                     │<──Job ID──────────────│
  │                    │                     │                       │
  │                    │                     │──Update Account───────>│
  │                    │                     │   (pending_deletion)  │
  │                    │                     │                       │
  │                    │<──Response──────────│                       │
  │<──200 OK───────────│  {scheduledAt,     │                       │
  │                    │   recoveryDeadline}│                       │
  │                    │                     │                       │
  │                    │                     ... 30 days later ...   │
  │                    │                     │                       │
  │                    │                     │<──Execute Job─────────│
  │                    │                     │──deleteAccount()─────>│
  │                    │                     │   (same as immediate) │
```

---

## 4. 核心代码实现

### 4.1 API Controller (apps/api/modules/account/interface/http/)

```typescript
// AccountController.ts
import { Router, Request, Response } from 'express';
import { AccountDeletionApplicationService } from '../../application/services/AccountDeletionApplicationService';
import { createLogger } from '@dailyuse/utils';
import { authMiddleware } from '../../../authentication/infrastructure/middleware/authMiddleware';

const logger = createLogger('AccountController');
const router = Router();

/**
 * DELETE /api/account
 * 删除账户（立即）
 */
router.delete('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { password, twoFactorCode, reason, feedback, confirmationText, exportData } = req.body;
    const accountUuid = req.user?.accountUuid;

    if (!accountUuid || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Account UUID and password are required',
      });
    }

    // 确认文本验证（如"DELETE"）
    if (confirmationText !== 'DELETE') {
      return res.status(400).json({
        error: 'CONFIRMATION_REQUIRED',
        message: 'Please type "DELETE" to confirm account deletion',
      });
    }

    const service = await AccountDeletionApplicationService.getInstance();
    const result = await service.deleteAccount({
      accountUuid,
      password,
      twoFactorCode,
      reason,
      feedback,
      confirmationText,
      exportData,
    });

    logger.info('Account deleted successfully', { accountUuid });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Account deletion failed', error);

    if (error.message.includes('password')) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Incorrect password',
      });
    }

    if (error.message.includes('two-factor')) {
      return res.status(401).json({
        error: 'INVALID_2FA',
        message: 'Invalid two-factor authentication code',
      });
    }

    if (error.message.includes('already deleted')) {
      return res.status(409).json({
        error: 'ALREADY_DELETED',
        message: 'Account is already deleted',
      });
    }

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Account deletion failed. Please try again later.',
    });
  }
});

/**
 * POST /api/account/schedule-deletion
 * 计划删除账户（冷静期）
 */
router.post('/schedule-deletion', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { password, reason, coolingPeriodDays } = req.body;
    const accountUuid = req.user?.accountUuid;

    if (!accountUuid || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Account UUID and password are required',
      });
    }

    const service = await AccountDeletionApplicationService.getInstance();
    const scheduledAt = Date.now() + (coolingPeriodDays || 30) * 24 * 60 * 60 * 1000;

    const result = await service.scheduleAccountDeletion({
      accountUuid,
      password,
      scheduledAt,
      reason,
    });

    logger.info('Account deletion scheduled', { accountUuid, scheduledAt });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Schedule account deletion failed', error);

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to schedule account deletion',
    });
  }
});

/**
 * POST /api/account/cancel-deletion
 * 取消计划删除
 */
router.post('/cancel-deletion', authMiddleware, async (req: Request, res: Response) => {
  try {
    const accountUuid = req.user?.accountUuid;

    if (!accountUuid) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Account UUID is required',
      });
    }

    const service = await AccountDeletionApplicationService.getInstance();
    const result = await service.cancelAccountDeletion(accountUuid);

    logger.info('Account deletion cancelled', { accountUuid });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Cancel account deletion failed', error);

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to cancel account deletion',
    });
  }
});

export default router;
```

---

### 4.2 Application Service (apps/api/modules/account/application/services/)

```typescript
// AccountDeletionApplicationService.ts
import {
  Account,
  AccountDomainService,
  type IAccountRepository,
} from '@dailyuse/domain-server';
import {
  AuthenticationDomainService,
  type IAuthCredentialRepository,
  type IAuthSessionRepository,
} from '@dailyuse/domain-server';
import { AccountContracts } from '@dailyuse/contracts';
import { createLogger, eventBus } from '@dailyuse/utils';
import { AccountContainer } from '../../infrastructure/di/AccountContainer';
import { AuthenticationContainer } from '../../../authentication/infrastructure/di/AuthenticationContainer';
import { DataCleanupService } from '../../infrastructure/services/DataCleanupService';
import { DataExportService } from '../../infrastructure/services/DataExportService';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const logger = createLogger('AccountDeletionApplicationService');
const prisma = new PrismaClient();

interface DeleteAccountRequest {
  accountUuid: string;
  password: string;
  twoFactorCode?: string;
  reason?: string;
  feedback?: string;
  confirmationText?: string;
  exportData?: boolean;
}

interface DeleteAccountResponse {
  success: boolean;
  message: string;
  deletedAt: number;
  dataExportUrl?: string;
  recoveryDeadline?: number;
}

export class AccountDeletionApplicationService {
  private static instance: AccountDeletionApplicationService;
  private accountDomainService: AccountDomainService;
  private authDomainService: AuthenticationDomainService;
  private accountRepo: IAccountRepository;
  private credentialRepo: IAuthCredentialRepository;
  private sessionRepo: IAuthSessionRepository;
  private dataCleanupService: DataCleanupService;
  private dataExportService: DataExportService;

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
    this.dataCleanupService = new DataCleanupService();
    this.dataExportService = new DataExportService();
  }

  static async createInstance(
    accountRepo?: IAccountRepository,
    credentialRepo?: IAuthCredentialRepository,
    sessionRepo?: IAuthSessionRepository,
  ): Promise<AccountDeletionApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const authContainer = AuthenticationContainer.getInstance();

    const accRepo = accountRepo || accountContainer.getAccountRepository();
    const credRepo = credentialRepo || authContainer.getAuthCredentialRepository();
    const sessRepo = sessionRepo || authContainer.getAuthSessionRepository();

    AccountDeletionApplicationService.instance = new AccountDeletionApplicationService(
      accRepo,
      credRepo,
      sessRepo,
    );
    return AccountDeletionApplicationService.instance;
  }

  static async getInstance(): Promise<AccountDeletionApplicationService> {
    if (!AccountDeletionApplicationService.instance) {
      AccountDeletionApplicationService.instance =
        await AccountDeletionApplicationService.createInstance();
    }
    return AccountDeletionApplicationService.instance;
  }

  /**
   * 删除账户
   */
  async deleteAccount(request: DeleteAccountRequest): Promise<DeleteAccountResponse> {
    const { accountUuid, password, twoFactorCode, reason, feedback, exportData } = request;

    // 1. 查询账户
    const account = await this.accountRepo.findById(accountUuid);
    if (!account) {
      throw new Error('Account not found');
    }

    // 2. 检查账户状态
    if (account.status === 'DELETED') {
      throw new Error('Account is already deleted');
    }

    // 3. 查询凭证
    const credential = await this.credentialRepo.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    // 4. 验证密码
    const isPasswordValid = await this.verifyPassword(password, credential);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // 5. 验证二次认证（如启用）
    if (credential.twoFactor?.enabled && !twoFactorCode) {
      throw new Error('Two-factor authentication code is required');
    }

    if (twoFactorCode) {
      const is2FAValid = await this.authDomainService.verifyTwoFactorCode(
        accountUuid,
        twoFactorCode,
      );
      if (!is2FAValid) {
        throw new Error('Invalid two-factor authentication code');
      }
    }

    // 6. 数据导出（如请求）
    let dataExportUrl: string | undefined;
    if (exportData) {
      dataExportUrl = await this.dataExportService.exportAccountData(accountUuid);
    }

    // 7. 事务：删除账户、凭证、会话、关联数据
    await prisma.$transaction(async (tx) => {
      // 7.1 软删除账户
      account.markAsDeleted(reason);
      await this.accountRepo.save(account);

      // 7.2 注销凭证
      await this.authDomainService.revokeCredential(credential.uuid);

      // 7.3 注销所有会话
      await this.authDomainService.revokeAllSessions(accountUuid);

      // 7.4 清理关联数据
      await this.dataCleanupService.cleanupUserData(accountUuid);

      logger.info('Account and related data deleted in transaction', { accountUuid });
    });

    // 8. 发布领域事件
    eventBus.send('account:deleted', {
      accountUuid,
      reason,
      feedback,
      deletedAt: Date.now(),
    });

    // 9. 发送确认邮件
    await this.sendDeletionConfirmationEmail(account.email, account.username);

    // 10. 返回结果
    return {
      success: true,
      message: 'Account deleted successfully. We\'re sorry to see you go.',
      deletedAt: Date.now(),
      dataExportUrl,
    };
  }

  /**
   * 计划删除账户（冷静期）
   */
  async scheduleAccountDeletion(
    request: ScheduleAccountDeletionRequest,
  ): Promise<DeleteAccountResponse> {
    // Implementation for scheduled deletion with cooling period
    // ...
  }

  /**
   * 取消计划删除
   */
  async cancelAccountDeletion(accountUuid: string): Promise<{ success: boolean }> {
    // Implementation for cancelling scheduled deletion
    // ...
  }

  /**
   * 验证密码
   */
  private async verifyPassword(plainPassword: string, credential: any): Promise<boolean> {
    const hashedPassword = credential.passwordCredential?.hashedPassword;
    if (!hashedPassword) return false;
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 发送删除确认邮件
   */
  private async sendDeletionConfirmationEmail(email: string, username: string): Promise<void> {
    logger.info('Sending deletion confirmation email', { email });
    // TODO: 集成邮件服务
  }
}
```

---

### 4.3 Domain Service (packages/domain-server/)

```typescript
// AccountDomainService.ts (新增方法)

export class AccountDomainService {
  // ... existing code ...

  /**
   * 软删除账户
   */
  public async markAccountDeleted(uuid: string, reason?: string): Promise<Account> {
    const account = await this.accountRepo.findById(uuid);
    if (!account) {
      throw new Error(`Account not found: ${uuid}`);
    }

    account.markAsDeleted(reason);
    await this.accountRepo.save(account);
    return account;
  }

  /**
   * 硬删除账户（彻底删除）
   */
  public async permanentlyDeleteAccount(uuid: string): Promise<void> {
    await this.accountRepo.delete(uuid);
  }

  /**
   * 匿名化账户数据
   */
  public async anonymizeAccountData(uuid: string): Promise<Account> {
    const account = await this.accountRepo.findById(uuid);
    if (!account) {
      throw new Error(`Account not found: ${uuid}`);
    }

    account.anonymizeData();
    await this.accountRepo.save(account);
    return account;
  }
}
```

```typescript
// AuthenticationDomainService.ts (新增方法)

export class AuthenticationDomainService {
  // ... existing code ...

  /**
   * 注销凭证
   */
  async revokeCredential(credentialUuid: string): Promise<void> {
    const credential = await this.credentialRepository.findByUuid(credentialUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    credential.revoke();
    await this.credentialRepository.save(credential);
  }
}
```

---

### 4.4 Account 聚合根方法

```typescript
// Account.ts (packages/domain-server/account/aggregates/)

export class Account extends AggregateRoot implements IAccountServer {
  // ... existing properties ...

  /**
   * 标记账户为已删除
   */
  public markAsDeleted(reason?: string): void {
    if (this._status === 'DELETED') {
      throw new Error('Account is already deleted');
    }

    this._status = 'DELETED';
    this._deletedAt = Date.now();

    // 记录历史
    this.addHistory('ACCOUNT_DELETED', reason);
  }

  /**
   * 匿名化数据（GDPR 合规）
   */
  public anonymizeData(): void {
    this._username = `deleted_user_${this.uuid.substring(0, 8)}`;
    this._email = `deleted_${this.uuid}@deleted.local`;
    this._phoneNumber = null;
    this._profile.displayName = 'Deleted User';
    this._profile.avatar = null;
    this._profile.bio = null;
  }

  /**
   * 添加历史记录
   */
  private addHistory(eventType: string, reason?: string): void {
    const history = AccountHistory.create({
      accountUuid: this.uuid,
      eventType,
      reason,
      timestamp: Date.now(),
    });
    this._history.push(history);
  }
}
```

---

## 5. 错误处理策略

### 5.1 业务异常

| 错误代码 | HTTP 状态 | 描述 | 处理方式 |
|---------|---------|------|---------|
| `ACCOUNT_NOT_FOUND` | 404 | 账户不存在 | 提示账户不存在 |
| `INVALID_CREDENTIALS` | 401 | 密码错误 | 提示密码错误 |
| `INVALID_2FA` | 401 | 二次认证码错误 | 提示重新输入 |
| `ALREADY_DELETED` | 409 | 账户已删除 | 提示账户已删除 |
| `CONFIRMATION_REQUIRED` | 400 | 未确认删除 | 要求输入确认文本 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器错误 | 提示稍后重试 |

---

## 6. 安全考虑

### 6.1 身份验证

- **二次验证**: 要求输入密码和/或二次认证码
- **确认文本**: 要求输入"DELETE"等确认文本
- **邮箱确认**: 发送确认链接到邮箱（可选）

### 6.2 数据保护

- **软删除**: 默认软删除，保留 30 天冷静期
- **硬删除**: 冷静期后彻底删除或匿名化
- **数据导出**: 删除前提供数据导出（GDPR 要求）
- **审计日志**: 记录删除操作的完整信息

---

## 7. 测试策略

### 7.1 单元测试

```typescript
describe('AccountDeletionApplicationService', () => {
  it('should successfully delete account with valid password', async () => {
    // Test account deletion
  });

  it('should throw error when password is incorrect', async () => {
    // Test invalid password
  });

  it('should require 2FA code when enabled', async () => {
    // Test 2FA requirement
  });
});
```

---

## 8. 监控与日志

- 删除成功：`logger.info('Account deleted', { accountUuid, reason })`
- 删除失败：`logger.error('Deletion failed', { error })`

---

## 9. 未来优化

1. **数据备份**: 删除前自动备份
2. **恢复功能**: 冷静期内可恢复
3. **删除原因分析**: 统计用户流失原因

---

## 10. 相关文档

- [用户注册流程设计](./USER_REGISTRATION_FLOW.md)
- [用户登录流程设计](./USER_LOGIN_FLOW.md)
- [用户登出流程设计](./USER_LOGOUT_FLOW.md)

---

## 11. 变更历史

| 版本 | 日期 | 作者 | 变更说明 |
|-----|------|------|---------|
| 1.0 | 2025-10-17 | AI Assistant | 初始版本 |
