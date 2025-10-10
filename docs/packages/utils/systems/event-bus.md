# 事件总线系统

> **位置**: `packages/utils/src/domain`  
> **适用范围**: Web、Desktop 项目（跨模块通信）  
> **依赖**: mitt (轻量级事件库)

---

## 📋 概述

DailyUse 的事件总线系统基于 mitt 库实现，提供跨模块解耦通信能力。当一个模块的状态发生变化时，可以通过事件总线通知其他模块，而无需直接依赖。

### 核心特性

- ✅ **解耦通信**: 模块间不直接依赖
- ✅ **类型安全**: TypeScript 支持
- ✅ **双向通信**: 支持请求-响应模式
- ✅ **统计监控**: 事件发送/接收统计
- ✅ **跨平台**: Node.js + 浏览器
- ✅ **调试友好**: 详细的日志输出

---

## 🏗️ 架构设计

### 通信模式

```
认证模块 (Auth)
    ↓ 发布事件: USER_LOGGED_IN
事件总线 (EventBus)
    ↓ 传递事件
┌───────────┬───────────┬───────────┐
│账户模块   │目标模块   │任务模块   │  订阅者
│(Account)  │(Goal)     │(Task)     │
└───────────┴───────────┴───────────┘
    ↓           ↓           ↓
自动获取     加载用户     加载任务
账户信息     目标列表     列表
```

### 核心组件

```
packages/utils/src/domain/
├── CrossPlatformEventBus.ts   # 跨平台事件总线（基于 mitt）
├── UnifiedEventBus.ts         # 统一事件总线（增强版）
├── eventBus.ts                # 简化导出
└── index.ts                   # 导出入口
```

---

## 🚀 快速开始

### 1. 基础使用

```typescript
import { eventBus } from '@dailyuse/utils';

// 监听事件
eventBus.on('user-logged-in', (payload) => {
  console.log('用户登录:', payload.username);
  // 处理逻辑...
});

// 发布事件
eventBus.emit('user-logged-in', {
  accountUuid: 'user-123',
  username: 'john_doe',
  timestamp: Date.now(),
});

// 移除监听
const handler = (payload) => console.log(payload);
eventBus.on('user-logged-in', handler);
eventBus.off('user-logged-in', handler);

// 清除所有监听
eventBus.off('user-logged-in');  // 清除该事件的所有监听
eventBus.all.clear();             // 清除所有事件
```

### 2. 类型安全的事件

```typescript
// 定义事件类型
export const AUTH_EVENTS = {
  USER_LOGGED_IN: 'auth:user-logged-in',
  USER_LOGGED_OUT: 'auth:user-logged-out',
  TOKEN_REFRESHED: 'auth:token-refreshed',
} as const;

// 定义事件负载类型
export interface UserLoggedInEventPayload {
  accountUuid: string;
  username: string;
  sessionUuid: string;
  accessToken: string;
  refreshToken?: string;
  loginTime: Date;
}

// 类型安全的发布
export function publishUserLoggedInEvent(payload: UserLoggedInEventPayload): void {
  eventBus.emit(AUTH_EVENTS.USER_LOGGED_IN, payload);
}

// 类型安全的订阅
eventBus.on<UserLoggedInEventPayload>(
  AUTH_EVENTS.USER_LOGGED_IN,
  (payload) => {
    console.log('用户登录:', payload.username);
    console.log('账户 UUID:', payload.accountUuid);
  }
);
```

### 3. 双向通信（请求-响应）

```typescript
import { CrossPlatformEventBus } from '@dailyuse/utils';

const eventBus = new CrossPlatformEventBus();

// 注册请求处理器
eventBus.handle('get-user-profile', async (payload: { userId: string }) => {
  const profile = await fetchUserProfile(payload.userId);
  return profile;
});

// 发送请求并等待响应
const profile = await eventBus.invoke('get-user-profile', { userId: '123' });
console.log('用户资料:', profile);
```

---

## 📐 实战案例：用户登录流程

### 架构流程

```
1. 用户提交登录表单
   ↓
2. AuthApplicationService 调用 API
   ↓
3. API 返回用户基本信息 (accountUuid, username, token)
   ↓
4. AuthApplicationService 保存 token 到 AuthStore
   ↓
5. 发布 USER_LOGGED_IN 事件
   ↓
   ├→ AccountModule: 自动获取完整账户信息
   ├→ GoalModule: 加载用户目标列表
   └→ TaskModule: 加载用户任务列表
```

### 代码实现

#### 1. 定义事件

```typescript
// apps/web/src/modules/authentication/application/events/authEvents.ts
export const AUTH_EVENTS = {
  USER_LOGGED_IN: 'auth:user-logged-in',
  USER_LOGGED_OUT: 'auth:user-logged-out',
  AUTH_STATE_CHANGED: 'auth:state-changed',
  TOKEN_REFRESHED: 'auth:token-refreshed',
} as const;

export interface UserLoggedInEventPayload {
  accountUuid: string;
  username: string;
  sessionUuid: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  loginTime: Date;
}

export function publishUserLoggedInEvent(payload: UserLoggedInEventPayload): void {
  eventBus.emit(AUTH_EVENTS.USER_LOGGED_IN, payload);
}

export function publishUserLoggedOutEvent(): void {
  eventBus.emit(AUTH_EVENTS.USER_LOGGED_OUT, {
    logoutTime: new Date(),
  });
}
```

#### 2. 认证服务发布事件

```typescript
// apps/web/src/modules/authentication/application/services/AuthApplicationService.ts
import { publishUserLoggedInEvent } from '../events/authEvents';

export class AuthApplicationService {
  async login(request: AuthByPasswordForm): Promise<void> {
    // 调用 API 登录
    const response = await authApi.login(request);

    // 保存 token 到 store
    this.authStore.setAccessToken(response.accessToken);
    this.authStore.setRefreshToken(response.refreshToken);

    // 🔔 发布用户登录成功事件
    publishUserLoggedInEvent({
      accountUuid: response.accountUuid,
      username: response.username,
      sessionUuid: response.sessionUuid,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
      loginTime: new Date(),
    });
  }
}
```

#### 3. 账户模块监听事件

```typescript
// apps/web/src/modules/account/application/events/accountEventHandlers.ts
import { eventBus, AUTH_EVENTS } from '@/shared/events';
import type { UserLoggedInEventPayload } from '@/modules/authentication';

export class AccountEventHandlers {
  static initializeEventHandlers(): void {
    // 监听用户登录成功事件
    eventBus.on<UserLoggedInEventPayload>(
      AUTH_EVENTS.USER_LOGGED_IN,
      AccountEventHandlers.handleUserLoggedIn
    );

    // 监听用户登出事件
    eventBus.on(
      AUTH_EVENTS.USER_LOGGED_OUT,
      AccountEventHandlers.handleUserLoggedOut
    );
  }

  private static async handleUserLoggedIn(
    payload: UserLoggedInEventPayload
  ): Promise<void> {
    const accountStore = useAccountStore();

    console.log('🔔 收到用户登录事件:', payload.username);

    // 1. 设置 accountUuid
    accountStore.setAccountUuid(payload.accountUuid);

    // 2. 通过 API 获取完整账户信息
    try {
      const accountInfo = await AccountApiService.getAccountById(payload.accountUuid);

      // 3. 保存到 store
      accountStore.setAccount(accountInfo);

      console.log('✅ 账户信息加载成功:', accountInfo.username);
    } catch (error) {
      console.error('❌ 加载账户信息失败:', error);
    }
  }

  private static handleUserLoggedOut(): void {
    const accountStore = useAccountStore();

    console.log('🔔 收到用户登出事件');

    // 清除账户信息
    accountStore.clearAccount();
  }
}
```

#### 4. 应用初始化时注册监听器

```typescript
// apps/web/src/shared/initialization/AppInitializationManager.ts
import { AccountEventHandlers } from '@/modules/account/application/events';
import { GoalEventHandlers } from '@/modules/goal/application/events';

export class AppInitializationManager {
  static async initializeApp(): Promise<void> {
    console.log('🚀 初始化应用模块...');

    // 注册事件处理器
    AccountEventHandlers.initializeEventHandlers();
    GoalEventHandlers.initializeEventHandlers();

    console.log('✅ 事件处理器初始化完成');
  }
}
```

```typescript
// apps/web/src/main.ts
import { AppInitializationManager } from './shared/initialization/AppInitializationManager';

// 初始化应用
AppInitializationManager.initializeApp().then(() => {
  console.log('🎯 应用初始化完成');
});
```

---

## 💡 最佳实践

### 1. 使用常量定义事件名

❌ **不推荐**:
```typescript
eventBus.emit('user-logged-in', payload);  // 字符串硬编码，容易拼写错误
```

✅ **推荐**:
```typescript
const AUTH_EVENTS = {
  USER_LOGGED_IN: 'auth:user-logged-in',
} as const;

eventBus.emit(AUTH_EVENTS.USER_LOGGED_IN, payload);
```

### 2. 为事件定义类型

❌ **不推荐**:
```typescript
eventBus.on('user-logged-in', (payload: any) => {
  console.log(payload.username);  // 类型不安全
});
```

✅ **推荐**:
```typescript
interface UserLoggedInPayload {
  accountUuid: string;
  username: string;
}

eventBus.on<UserLoggedInPayload>('user-logged-in', (payload) => {
  console.log(payload.username);  // 类型安全
});
```

### 3. 使用事件命名空间

✅ **推荐**:
```typescript
export const AUTH_EVENTS = {
  USER_LOGGED_IN: 'auth:user-logged-in',      // 认证模块
  USER_LOGGED_OUT: 'auth:user-logged-out',
};

export const GOAL_EVENTS = {
  GOAL_CREATED: 'goal:created',               // 目标模块
  GOAL_UPDATED: 'goal:updated',
};

export const TASK_EVENTS = {
  TASK_COMPLETED: 'task:completed',           // 任务模块
  TASK_DELETED: 'task:deleted',
};
```

### 4. 记得移除事件监听器

```typescript
export function useGoalSync() {
  const handleGoalCreated = (payload: GoalCreatedPayload) => {
    console.log('目标创建:', payload);
  };

  onMounted(() => {
    // 组件挂载时添加监听
    eventBus.on(GOAL_EVENTS.GOAL_CREATED, handleGoalCreated);
  });

  onUnmounted(() => {
    // ✅ 组件卸载时移除监听，避免内存泄漏
    eventBus.off(GOAL_EVENTS.GOAL_CREATED, handleGoalCreated);
  });
}
```

### 5. 错误处理

```typescript
eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, async (payload) => {
  try {
    await loadUserData(payload.accountUuid);
  } catch (error) {
    // ✅ 事件处理器内部捕获错误，不影响其他监听器
    console.error('加载用户数据失败:', error);
  }
});
```

### 6. 使用封装的发布函数

✅ **推荐**:
```typescript
// 封装发布函数，提供类型检查和文档
export function publishUserLoggedInEvent(payload: UserLoggedInEventPayload): void {
  eventBus.emit(AUTH_EVENTS.USER_LOGGED_IN, payload);
}

// 使用时更清晰
publishUserLoggedInEvent({
  accountUuid: 'user-123',
  username: 'john',
  sessionUuid: 'session-456',
  accessToken: 'token',
  loginTime: new Date(),
});
```

---

## 🔍 调试和监控

### 1. 事件统计

```typescript
import { CrossPlatformEventBus } from '@dailyuse/utils';

const eventBus = new CrossPlatformEventBus();

// 发送一些事件
eventBus.emit('event-1', { data: 'test' });
eventBus.emit('event-2', { data: 'test' });

// 获取统计信息
const stats = eventBus.getStats();
console.log('事件统计:', stats);

// 输出:
// {
//   sent: { 'event-1': 1, 'event-2': 1 },
//   received: { 'event-1': 0, 'event-2': 0 }
// }
```

### 2. 监听所有事件（调试）

```typescript
// 调试模式：监听所有事件
eventBus.on('*', (type, payload) => {
  console.log('🔔 事件:', type, '负载:', payload);
});
```

### 3. 日志集成

```typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('EventBus');

eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, (payload) => {
  logger.info('User logged in event received', {
    accountUuid: payload.accountUuid,
    username: payload.username,
  });
});
```

---

## 🧪 测试

### 单元测试

```typescript
import { describe, it, expect, vi } from 'vitest';
import { eventBus, AUTH_EVENTS } from '@/shared/events';

describe('EventBus', () => {
  it('should emit and receive event', () => {
    const handler = vi.fn();
    
    eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, handler);
    
    eventBus.emit(AUTH_EVENTS.USER_LOGGED_IN, {
      accountUuid: 'test-uuid',
      username: 'test-user',
    });
    
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      accountUuid: 'test-uuid',
      username: 'test-user',
    });
  });

  it('should remove event listener', () => {
    const handler = vi.fn();
    
    eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, handler);
    eventBus.off(AUTH_EVENTS.USER_LOGGED_IN, handler);
    
    eventBus.emit(AUTH_EVENTS.USER_LOGGED_IN, { accountUuid: 'test' });
    
    expect(handler).not.toHaveBeenCalled();
  });
});
```

---

## 📚 API 参考

### CrossPlatformEventBus

#### 方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `on()` | `on<T>(type: string, handler: (payload: T) => void): void` | 监听事件 |
| `off()` | `off(type: string, handler?: Function): void` | 移除监听 |
| `emit()` | `emit<T>(type: string, payload: T): void` | 发布事件 |
| `send()` | `send<T>(type: string, payload: T): void` | 发送事件（别名） |
| `handle()` | `handle<TReq, TRes>(type: string, handler: (payload: TReq) => Promise<TRes>): void` | 注册请求处理器 |
| `invoke()` | `invoke<TReq, TRes>(type: string, payload: TReq): Promise<TRes>` | 发送请求并等待响应 |
| `getStats()` | `getStats(): EventStats` | 获取事件统计 |
| `clearStats()` | `clearStats(): void` | 清除统计 |

### 事件对象

```typescript
interface EventStats {
  sent: Record<string, number>;      // 发送统计
  received: Record<string, number>;  // 接收统计
}
```

---

## 🔗 相关文档

- `apps/web/src/shared/events/README.md` - 事件系统使用指南
- [[Initialize系统]] - 应用初始化系统

---

## 📝 变更历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2025-01-01 | 初始版本，基于 mitt |
| 1.1.0 | 2025-10-03 | 添加登录流程事件示例 |

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-03
