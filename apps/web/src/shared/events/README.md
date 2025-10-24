# 基于 mitt 的跨模块事件通信系统

## 概述

本项目实现了基于 mitt 库的事件总线系统，用于实现跨模块的解耦通信。当用户登录成功后，认证模块会发布事件，账户模块监听该事件并自动获取完整的用户账户信息。

## 架构设计

```
认证模块 (Authentication)
    ↓ 发布事件
事件总线 (EventBus)
    ↓ 传递事件
账户模块 (Account)
    ↓ 调用API
后端服务 (Backend)
```

## 实现流程

### 1. 用户登录成功

```typescript
// apps/web/src/modules/authentication/application/services/AuthApplicationService.ts
async login(request: AuthByPasswordForm) {
  // ... 登录逻辑

  // 发布用户登录成功事件
  publishUserLoggedInEvent({
    accountUuid: response.data.accountUuid,
    username: response.data.username,
    sessionUuid: response.data.sessionUuid,
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    expiresIn: response.data.expiresIn,
    loginTime: new Date(),
  });
}
```

### 2. 账户模块监听事件

```typescript
// apps/web/src/modules/account/application/events/accountEventHandlers.ts
export class AccountEventHandlers {
  static initializeEventHandlers(): void {
    // 监听用户登录成功事件
    eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, AccountEventHandlers.handleUserLoggedIn);
  }

  private static async handleUserLoggedIn(payload: UserLoggedInEventPayload): Promise<void> {
    const accountStore = useAccountStore();

    // 1. 设置 accountUuid
    accountStore.setAccountUuid(payload.accountUuid);

    // 2. 通过 API 获取完整账户信息
    const accountInfo = await AccountApiService.getAccountById(payload.accountUuid);

    // 3. 保存到 store
    accountStore.setAccount(accountInfo);
  }
}
```

### 3. 应用启动时初始化

```typescript
// apps/web/src/main.ts
import { AppInitializationManager } from './shared/initialization/AppInitializationManager';

// 初始化应用模块
AppInitializationManager.initializeApp().then(() => {
  console.log('🎯 Event handlers initialized successfully');
});
```

## 关键文件说明

### 事件定义

- **`apps/web/src/modules/authentication/application/events/authEvents.ts`**: 定义认证相关事件类型和发布函数

### 事件处理器

- **`apps/web/src/modules/account/application/events/accountEventHandlers.ts`**: 账户模块事件处理器，监听登录事件并获取账户信息

### 初始化管理

- **`apps/web/src/shared/initialization/AppInitializationManager.ts`**: 应用初始化管理器，负责设置事件监听器

### 状态管理

- **`apps/web/src/modules/account/presentation/stores/useAccountStore.ts`**: 账户状态管理，保存账户信息

## 事件类型

### AUTH_EVENTS

```typescript
export const AUTH_EVENTS = {
  USER_LOGGED_IN: 'auth:user-logged-in', // 用户登录成功
  USER_LOGGED_OUT: 'auth:user-logged-out', // 用户登出
  AUTH_STATE_CHANGED: 'auth:state-changed', // 认证状态变更
  TOKEN_REFRESHED: 'auth:token-refreshed', // Token刷新
} as const;
```

### 事件负载类型

```typescript
export interface UserLoggedInEventPayload {
  accountUuid: string; // 账户UUID
  username: string; // 用户名
  sessionUuid: string; // 会话UUID
  accessToken: string; // 访问令牌
  refreshToken?: string; // 刷新令牌
  expiresIn?: number; // 过期时间
  loginTime: Date; // 登录时间
}
```

## 使用方法

### 1. 发布事件

```typescript
import { publishUserLoggedInEvent } from '../modules/authentication';

publishUserLoggedInEvent({
  accountUuid: 'user-uuid-123',
  username: 'john_doe',
  sessionUuid: 'session-uuid-456',
  accessToken: 'jwt-token',
  loginTime: new Date(),
});
```

### 2. 监听事件

```typescript
import { eventBus, AUTH_EVENTS } from '@dailyuse/utils';

eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, async (payload) => {
  console.log('用户登录:', payload.username);
  // 处理登录逻辑
});
```

### 3. 双向通信

```typescript
// 注册处理器
eventBus.handle('get-user-profile', async (payload) => {
  return await fetchUserProfile(payload.userId);
});

// 发送请求
const profile = await eventBus.invoke('get-user-profile', { userId: '123' });
```

## 测试

运行事件系统测试：

```typescript
import { EventSystemTester } from './shared/testing/EventSystemTester';

// 运行所有测试
await EventSystemTester.runAllTests();

// 单独测试登录流程
await EventSystemTester.testLoginEventFlow();

// 查看统计信息
EventSystemTester.getEventBusStats();
```

## 优势

1. **解耦**: 模块间不直接依赖，通过事件通信
2. **扩展性**: 容易添加新的事件监听器
3. **可测试性**: 可以独立测试事件发布和处理
4. **类型安全**: TypeScript 支持，编译时检查事件类型
5. **调试友好**: 详细的日志输出，便于调试

## 注意事项

1. **异步处理**: 事件处理是异步的，需要适当的错误处理
2. **内存泄漏**: 记得在组件销毁时移除事件监听器
3. **事件命名**: 使用有意义的事件名称，避免冲突
4. **错误处理**: 事件处理器中的错误不会影响事件发布者

## 扩展

可以轻松扩展到其他模块：

```typescript
// 任务模块监听账户登录
eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, async (payload) => {
  await loadUserTasks(payload.accountUuid);
});

// 目标模块监听账户登录
eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, async (payload) => {
  await loadUserGoals(payload.accountUuid);
});
```
