# DDD 三层架构重构总结

## 架构设计

基于你的需求，我创建了一个三层架构来实现前后端domain模型的分离和复用：

```
packages/
├── domain-core/          # 共享核心包
│   ├── account/
│   │   ├── AccountCore.ts         # 账号核心基类
│   │   ├── entities/UserCore.ts   # 用户核心实体
│   │   ├── valueObjects/          # 核心值对象
│   │   └── types.ts              # 共享类型定义
│   ├── goal/
│   │   └── GoalCore.ts           # 目标核心基类
│   └── authentication/
│       └── AuthCredentialCore.ts # 认证凭据核心基类
├── domain-server/        # 服务端包（参考 electron/ 中的实现）
│   ├── account/
│   │   └── Account.ts            # 服务端账号实现（完整业务逻辑）
│   ├── goal/
│   │   └── Goal.ts               # 服务端目标实现（业务逻辑 + 持久化）
│   └── authentication/
│       └── AuthCredential.ts     # 服务端认证实现（密码验证等）
└── domain-client/        # 客户端包（参考 src/ 中的实现）
    ├── account/
    │   └── Account.ts            # 客户端账号实现（UI展示 + 计算属性）
    ├── goal/
    │   └── Goal.ts               # 客户端目标实现（UI辅助方法）
    └── authentication/
        └── AuthCredential.ts     # 客户端认证实现（状态展示）
```

## 设计特点

### 1. 核心层 (domain-core)

- **共享属性和方法**：所有基础属性、计算属性、验证规则
- **抽象方法**：定义必须由子类实现的业务方法
- **类型安全**：统一的类型定义和接口

**示例 - AccountCore：**

```typescript
export abstract class AccountCore extends AggregateRoot implements IAccount {
  protected _username: string;
  protected _email?: EmailCore;
  protected _status: AccountStatus;

  // 共享计算属性
  get isFullyVerified(): boolean {
    const emailVerified = !this._email || this._isEmailVerified;
    const phoneVerified = !this._phoneNumber || this._isPhoneVerified;
    return emailVerified && phoneVerified;
  }

  // 抽象方法（由子类实现）
  abstract updateEmail(emailAddress: string): void;
}
```

### 2. 服务端层 (domain-server)

- **完整业务逻辑**：验证、状态管理、事件发布
- **数据持久化**：与数据库交互的方法
- **安全策略**：敏感操作的业务规则

**示例 - 服务端 Account：**

```typescript
export class Account extends AccountCore {
  updateEmail(emailAddress: string): void {
    this.validateEmail(emailAddress);
    const newEmail = new Email(emailAddress);
    this._email = newEmail;
    this._updatedAt = new Date();

    // 业务规则：邮箱更改后需要重新验证
    this._isEmailVerified = false;
    if (this._status === AccountStatus.ACTIVE) {
      this._status = AccountStatus.PENDING_VERIFICATION;
    }

    // 发布领域事件
    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'EmailUpdated',
      occurredOn: new Date(),
      payload: { accountUuid: this.uuid, newEmail: emailAddress },
    });
  }
}
```

### 3. 客户端层 (domain-client)

- **UI展示逻辑**：状态文本、颜色、格式化等
- **计算属性**：进度、统计、友好显示
- **交互辅助**：可执行操作、表单数据转换

**示例 - 客户端 Goal：**

```typescript
export class Goal extends GoalCore {
  getStatusText(): string {
    const statusMap = {
      active: '进行中',
      completed: '已完成',
      paused: '已暂停',
      archived: '已归档',
    };
    return statusMap[this.status] || '未知状态';
  }

  getCardInfo(): {
    name: string;
    statusColor: 'success' | 'warning' | 'info' | 'default';
    timeRemaining: string;
    progress: number;
    canEdit: boolean;
  } {
    return {
      name: this.name,
      statusColor: this.getStatusColor(),
      timeRemaining: this.getTimeRemainingText(),
      progress: this.getProgressPercentage(),
      canEdit: this.isActive || this.isPaused,
    };
  }
}
```

## 使用示例

### Express 后端使用

```typescript
import { Account } from '@dailyuse/domain-server';

// 注册新用户
const account = Account.register({
  username: 'john_doe',
  accountType: AccountType.LOCAL,
  user: newUser,
  email: new Email('john@example.com'),
});

// 完整的业务逻辑和事件发布
await account.updateEmail('newemail@example.com');
const events = account.getDomainEvents();
```

### Vue/React 前端使用

```typescript
import { Account } from '@dailyuse/domain-client';

// 从 API 数据创建实例
const account = Account.fromDTO(apiResponse);

// UI 专用方法
const displayInfo = account.getDisplayInfo();
const canEdit = account.canPerformAction('updateEmail');
const formData = account.toFormData();
```

## 重构的其他模块

基于同样的架构模式，我已经为以下模块创建了三层结构：

1. **Authentication** - 认证凭据管理
   - Core: 基础属性和计算（失败次数、锁定状态）
   - Server: 密码验证、会话管理、安全策略
   - Client: 状态显示、表单验证、UI提示

2. **Goal** - 目标管理
   - Core: 基础属性和时间计算
   - Server: 关键结果管理、记录管理、状态变更
   - Client: 进度显示、时间格式化、操作权限

3. **Account** - 账号管理
   - Core: 身份信息和验证状态
   - Server: 注册、验证、角色管理
   - Client: 显示信息、表单数据、状态文本

## 下一步工作

1. **继续重构其他模块**：Task、Reminder、Repository等
2. **创建实体和值对象的三层结构**
3. **更新现有代码**：将 src/ 和 electron/ 中的使用切换到新架构
4. **添加单元测试**：为每一层的实现编写测试

## 优势

1. **代码复用**：核心逻辑只写一遍，前后端共享
2. **职责分离**：服务端专注业务，客户端专注展示
3. **类型安全**：TypeScript 确保类型一致性
4. **维护性**：修改核心逻辑时前后端自动同步
5. **扩展性**：可以轻松添加移动端、桌面端等新实现

这种架构完美解决了你提出的"前端偏向属性获取计算，后端偏向业务"的需求！
