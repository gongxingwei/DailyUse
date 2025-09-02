# DDD 模块事件通信迁移指南

## 背景

在 DDD 架构中，不同模块之间通过事件通信是最佳实践。然而，如果模块直接导入其他模块的事件定义，就会产生不必要的跨模块依赖，违背了 DDD 的模块独立性原则。

## 问题分析

### 原来的问题模式

```typescript
// ❌ 错误：Authentication 模块直接导入 Account 模块的事件
import { AccountRegisteredEvent } from '../../account/domain/events/AccountRegisteredEvent';

// 这样做会产生模块间的直接依赖
// Authentication 模块必须了解 Account 模块的内部结构
```

### 解决方案

通过共享事件契约层解决跨模块依赖问题：

```typescript
// ✅ 正确：通过共享契约导入事件定义
import { AccountRegisteredEvent } from 'common/shared/domain/events/contracts';

// 模块只依赖共享契约，不直接依赖其他业务模块
```

## 迁移步骤

### 步骤 1: 停止直接导入其他模块的事件

**Before (错误的方式):**

```typescript
// apps/api/src/modules/authentication/application/handlers/AccountRegisteredHandler.ts
import { AccountRegisteredEvent } from '../../account/domain/events/AccountRegisteredEvent';
```

**After (正确的方式):**

```typescript
// apps/api/src/modules/authentication/application/handlers/AccountRegisteredHandler.ts
import { AccountRegisteredEvent } from 'common/shared/domain/events/contracts';
```

### 步骤 2: 更新事件发布代码

**Before:**

```typescript
// Account 模块发布事件
const event = new AccountRegisteredEvent({
  accountId: account.id,
  // ... other fields
});

eventBus.publish(event);
```

**After:**

```typescript
// Account 模块发布事件
import { EVENT_TYPES } from 'common/shared/domain/events/contracts';

const event: AccountRegisteredEvent = {
  aggregateId: account.uuid,
  eventType: EVENT_TYPES.ACCOUNT.REGISTERED,
  occurredOn: new Date(),
  payload: {
    accountUuid: account.uuid,
    username: account.username,
    // ... 根据共享契约定义的字段
  },
};

await typedEventBus.publish(event);
```

### 步骤 3: 更新事件订阅代码

**Before:**

```typescript
// 旧的事件订阅方式
eventBus.subscribe('account.registered', async (event) => {
  // 处理逻辑
});
```

**After:**

```typescript
// 新的类型安全事件订阅
import { EVENT_TYPES } from 'common/shared/domain/events/contracts';

typedEventBus.subscribe(
  EVENT_TYPES.ACCOUNT.REGISTERED,
  async (event) => {
    // event 参数有完整的类型安全
    console.log('账户注册:', event.payload.accountUuid);
  },
  { module: 'AuthenticationService', version: '1.0.0' },
);
```

### 步骤 4: 更新模块初始化

**Before:**

```typescript
// 模块初始化
export class AuthenticationModule {
  async initialize() {
    // 直接使用 eventBus
    eventBus.subscribe(/* ... */);
  }
}
```

**After:**

```typescript
// 模块初始化
import { typedEventBus } from 'common/shared/domain/events/typedEventBus';

export class AuthenticationModule {
  async initialize() {
    // 使用增强版事件总线
    typedEventBus.subscribe(/* ... */);

    // 可以获取健康状态
    const health = typedEventBus.healthCheck();
    console.log('事件总线健康状态:', health);
  }
}
```

## 具体模块迁移指南

### Account 模块迁移

1. **事件发布迁移**

```typescript
// 文件: apps/api/src/modules/account/domain/services/AccountDomainService.ts

// Before
import { AccountRegisteredEvent } from '../events/AccountRegisteredEvent';

async registerAccount(account: Account) {
  const event = new AccountRegisteredEvent(account.toDTO());
  this.eventBus.publish(event);
}

// After
import { AccountRegisteredEvent, EVENT_TYPES } from 'common/shared/domain/events/contracts';
import { typedEventBus } from 'common/shared/domain/events/typedEventBus';

async registerAccount(account: Account) {
  const event: AccountRegisteredEvent = {
    aggregateId: account.uuid,
    eventType: EVENT_TYPES.ACCOUNT.REGISTERED,
    occurredOn: new Date(),
    payload: {
      accountUuid: account.uuid,
      username: account.username,
      email: account.email,
      accountType: account.type,
      userUuid: account.userUuid,
      userProfile: {
        firstName: account.userProfile.firstName,
        lastName: account.userProfile.lastName,
        avatar: account.userProfile.avatar,
        bio: account.userProfile.bio,
      },
      status: account.status,
      createdAt: account.createdAt,
      requiresAuthentication: true,
    },
  };

  await typedEventBus.publish(event);
}
```

2. **事件处理器迁移**

Account 模块可能需要响应其他模块的事件：

```typescript
// 文件: apps/api/src/modules/account/application/handlers/AuthenticationHandler.ts

// After
import {
  AccountStatusVerificationRequestedEvent,
  EVENT_TYPES,
} from 'common/shared/domain/events/contracts';
import { typedEventBus } from 'common/shared/domain/events/typedEventBus';

export class AuthenticationHandler {
  initialize() {
    typedEventBus.subscribe(
      EVENT_TYPES.AUTH.ACCOUNT_STATUS_VERIFICATION_REQUESTED,
      this.handleStatusVerificationRequest.bind(this),
      { module: 'AccountModule', version: '1.0.0' },
    );
  }

  private async handleStatusVerificationRequest(event: AccountStatusVerificationRequestedEvent) {
    // 类型安全的事件处理
    const { accountUuid, requestId } = event.payload;

    // 查找账户并返回状态
    const account = await this.accountRepository.findByUuid(accountUuid);

    const responseEvent: AccountStatusVerificationResponseEvent = {
      aggregateId: accountUuid,
      eventType: EVENT_TYPES.ACCOUNT.STATUS_VERIFICATION_RESPONSE,
      occurredOn: new Date(),
      payload: {
        accountUuid,
        username: account?.username || 'unknown',
        requestId,
        accountStatus: account?.status === 'ACTIVE' ? 'active' : 'inactive',
        isLoginAllowed: account?.status === 'ACTIVE',
        verifiedAt: new Date(),
      },
    };

    await typedEventBus.publish(responseEvent);
  }
}
```

### Authentication 模块迁移

1. **事件订阅迁移**

```typescript
// 文件: apps/api/src/modules/authentication/infrastructure/eventHandlers/AccountEventHandler.ts

// Before
import { AccountRegisteredEvent } from '../../account/domain/events/AccountRegisteredEvent';

// After
import { AccountRegisteredEvent, EVENT_TYPES } from 'common/shared/domain/events/contracts';
import { typedEventBus } from 'common/shared/domain/events/typedEventBus';

export class AccountEventHandler {
  initialize() {
    typedEventBus.subscribe(
      EVENT_TYPES.ACCOUNT.REGISTERED,
      this.handleAccountRegistered.bind(this),
      { module: 'AuthenticationModule', version: '1.0.0' },
    );
  }

  private async handleAccountRegistered(event: AccountRegisteredEvent) {
    // 类型安全：event.payload 有完整类型提示
    const { accountUuid, username, password, requiresAuthentication } = event.payload;

    if (requiresAuthentication && password) {
      // 为新注册的账户创建认证凭证
      await this.createAuthCredentials({
        accountUuid,
        username,
        password,
      });
    }
  }
}
```

2. **事件发布迁移**

```typescript
// 文件: apps/api/src/modules/authentication/application/services/LoginService.ts

// After
import {
  UserLoggedInEvent,
  LoginAttemptEvent,
  EVENT_TYPES,
} from 'common/shared/domain/events/contracts';
import { typedEventBus } from 'common/shared/domain/events/typedEventBus';

export class LoginService {
  async authenticate(credentials: LoginCredentials) {
    try {
      const result = await this.verifyCredentials(credentials);

      if (result.success) {
        const event: UserLoggedInEvent = {
          aggregateId: result.accountUuid,
          eventType: EVENT_TYPES.AUTH.USER_LOGGED_IN,
          occurredOn: new Date(),
          payload: {
            accountUuid: result.accountUuid,
            username: credentials.username,
            sessionId: result.sessionId,
            loginTime: new Date(),
            clientInfo: credentials.clientInfo,
          },
        };

        await typedEventBus.publish(event);
      } else {
        const event: LoginAttemptEvent = {
          aggregateId: result.accountUuid || 'unknown',
          eventType: EVENT_TYPES.AUTH.LOGIN_ATTEMPT,
          occurredOn: new Date(),
          payload: {
            username: credentials.username,
            accountUuid: result.accountUuid,
            attemptResult: 'failed',
            failureReason: result.failureReason,
            attemptedAt: new Date(),
            clientInfo: credentials.clientInfo,
          },
        };

        await typedEventBus.publish(event);
      }
    } catch (error) {
      console.error('认证服务错误:', error);
      throw error;
    }
  }
}
```

### Notification 模块迁移

```typescript
// 文件: apps/api/src/modules/notification/application/handlers/EventHandler.ts

// After
import {
  AccountRegisteredEvent,
  UserLoggedInEvent,
  EVENT_TYPES,
} from 'common/shared/domain/events/contracts';
import { typedEventBus } from 'common/shared/domain/events/typedEventBus';

export class NotificationEventHandler {
  initialize() {
    // 监听账户注册 - 发送欢迎邮件
    typedEventBus.subscribe(
      EVENT_TYPES.ACCOUNT.REGISTERED,
      this.handleAccountRegistered.bind(this),
      { module: 'NotificationModule' },
    );

    // 监听用户登录 - 记录登录通知
    typedEventBus.subscribe(EVENT_TYPES.AUTH.USER_LOGGED_IN, this.handleUserLogin.bind(this), {
      module: 'NotificationModule',
    });
  }

  private async handleAccountRegistered(event: AccountRegisteredEvent) {
    const { email, userProfile, accountType } = event.payload;

    if (email) {
      await this.emailService.sendWelcomeEmail({
        to: email,
        userName: `${userProfile.firstName} ${userProfile.lastName}`,
        accountType,
      });
    }
  }

  private async handleUserLogin(event: UserLoggedInEvent) {
    const { username, clientInfo } = event.payload;

    // 可以发送登录通知或安全提醒
    console.log(`用户 ${username} 从 ${clientInfo?.ipAddress} 登录`);
  }
}
```

## 测试迁移

### 单元测试更新

```typescript
// 文件: apps/api/src/modules/account/domain/__tests__/AccountDomainService.test.ts

// Before
import { AccountRegisteredEvent } from '../events/AccountRegisteredEvent';

// After
import { AccountRegisteredEvent } from 'common/shared/domain/events/contracts';
import { typedEventBus } from 'common/shared/domain/events/typedEventBus';

describe('AccountDomainService', () => {
  beforeEach(() => {
    // 清理事件总线状态
    typedEventBus.clear();
  });

  it('应该发布账户注册事件', async () => {
    // 监听事件
    let publishedEvent: AccountRegisteredEvent | null = null;

    typedEventBus.subscribe(
      'AccountRegistered',
      async (event) => {
        publishedEvent = event;
      },
      { module: 'TestModule' },
    );

    // 执行操作
    await accountService.registerAccount(mockAccount);

    // 验证
    expect(publishedEvent).not.toBeNull();
    expect(publishedEvent!.payload.accountUuid).toBe(mockAccount.uuid);
  });
});
```

### 集成测试更新

```typescript
// 文件: apps/api/src/__tests__/integration/eventFlow.test.ts

import { typedEventBus } from 'common/shared/domain/events/typedEventBus';
import { EVENT_TYPES } from 'common/shared/domain/events/contracts';

describe('模块间事件通信集成测试', () => {
  it('账户注册应触发认证凭证创建', async () => {
    let credentialsCreated = false;

    // 模拟 Authentication 模块的事件处理
    typedEventBus.subscribe(
      EVENT_TYPES.ACCOUNT.REGISTERED,
      async (event) => {
        if (event.payload.requiresAuthentication) {
          credentialsCreated = true;
        }
      },
      { module: 'TestAuthModule' },
    );

    // 触发账户注册
    await accountService.registerAccount(mockAccountData);

    // 等待异步处理
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(credentialsCreated).toBe(true);
  });
});
```

## 迁移检查清单

### 代码审查清单

- [ ] 所有模块不再直接导入其他业务模块的事件类型
- [ ] 事件发布使用 `typedEventBus.publish()` 和共享事件契约
- [ ] 事件订阅使用 `typedEventBus.subscribe()` 和 `EVENT_TYPES` 常量
- [ ] 事件处理函数有正确的类型注解
- [ ] 测试代码更新为使用新的事件系统

### 运行时验证

```typescript
// 添加到应用启动时的验证代码
export function validateEventArchitecture() {
  const health = typedEventBus.healthCheck();
  const subscribedEvents = typedEventBus.getSubscribedEventTypes();

  console.log('📊 事件架构验证:');
  console.log(`  - 健康状态: ${health.status}`);
  console.log(`  - 事件类型数: ${health.eventTypes}`);
  console.log(`  - 处理器数: ${health.totalHandlers}`);

  console.log('📝 已订阅的事件:');
  subscribedEvents.forEach((eventType) => {
    const subscribers = typedEventBus.getEventSubscribers(eventType);
    console.log(`  - ${eventType}: ${subscribers.length} 订阅者`);
  });
}
```

## 常见问题和解决方案

### Q1: 现有的事件类型与契约不匹配怎么办？

**A1:** 创建类型适配器进行过渡：

```typescript
// 临时适配器，用于迁移期间
function adaptLegacyEvent(legacyEvent: LegacyAccountEvent): AccountRegisteredEvent {
  return {
    aggregateId: legacyEvent.accountId,
    eventType: 'AccountRegistered',
    occurredOn: legacyEvent.timestamp,
    payload: {
      accountUuid: legacyEvent.accountId,
      username: legacyEvent.username,
      // ... 映射其他字段
    },
  };
}
```

### Q2: 如何处理事件版本演进？

**A2:** 在共享契约中支持版本控制：

```typescript
// contracts/versioning.ts
export interface EventV1 {
  version: 1;
  // v1 字段
}

export interface EventV2 {
  version: 2;
  // v2 字段，向后兼容 v1
}

// 事件处理时检查版本
typedEventBus.subscribe('SomeEvent', async (event) => {
  if (event.payload.version === 1) {
    // 处理 v1 格式
  } else if (event.payload.version === 2) {
    // 处理 v2 格式
  }
});
```

### Q3: 如何确保事件契约的一致性？

**A3:** 使用 TypeScript 编译检查和单元测试：

```typescript
// __tests__/contracts/eventContracts.test.ts
describe('事件契约一致性测试', () => {
  it('所有事件类型都在 EventTypeMap 中定义', () => {
    // 编译时检查 - 如果有遗漏的事件类型，TypeScript 会报错
    const allEventTypes: Array<keyof EventTypeMap> = [
      'AccountRegistered',
      'AccountUpdated',
      // ... 所有事件类型
    ];

    expect(allEventTypes.length).toBeGreaterThan(0);
  });
});
```

## 迁移时间表建议

### 阶段 1: 准备阶段 (1-2 天)

1. 创建共享事件契约
2. 实现增强版事件总线
3. 编写迁移文档和示例

### 阶段 2: 核心模块迁移 (3-5 天)

1. Account 模块迁移
2. Authentication 模块迁移
3. 基础设施更新

### 阶段 3: 其他模块迁移 (2-3 天)

1. Notification 模块迁移
2. 其他业务模块迁移
3. 集成测试更新

### 阶段 4: 验证和清理 (1-2 天)

1. 删除旧的直接依赖
2. 性能测试
3. 文档完善

通过这个系统化的迁移过程，可以确保 DDD 架构的模块独立性，同时保持类型安全的模块间通信。
