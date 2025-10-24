# 事件系统迁移总结

## 迁移目标

将 `api/src/shared/events` 下的本地 EventBus 实现迁移到使用 `packages/utils` 中的跨平台 UnifiedEventBus 系统。

## 迁移完成情况

### ✅ 已完成

1. **删除旧的事件系统文件**
   - ❌ `apps/api/src/shared/events/EventBus.ts` - 本地 EventBus 实现（已删除）
   - ❌ `apps/api/src/shared/events/eventHandlerRegistry.ts` - 已废弃的事件处理器注册文件（已删除）
   - ❌ `apps/api/src/shared/events/eventHandlerRegistry.ts.bak` - 备份文件（已删除）

2. **修复 unifiedEventSystem.ts**
   - 移除无效的方法调用：
     - `eventBus.healthCheck()` → 改用 `eventBus.getStats()`
     - `eventBus.getEnhancedStats()` → 改用 `eventBus.getStats()`
   - 注释掉未实现的模块导入（account、authentication、goal）
   - 注释掉未实现的模块事件处理器注册调用

3. **更新 index.ts**
   - 移除导入：`import { registerEventHandlers } from './shared/events/eventHandlerRegistry'`
   - 保留 utils 包导入：`import { eventBus } from '@dailyuse/utils'`

4. **修复集成测试**
   - 文件：`reminder-schedule-notification-flow.integration.test.ts`
   - 替换：`EventBus.getInstance()` → `import { eventBus } from '@dailyuse/utils'`

5. **修复 initializer.ts**
   - 注释掉未实现的模块导入
   - 注释掉未实现的模块初始化任务注册调用

### 📦 保留的文件

- ✅ `apps/api/src/shared/events/unifiedEventSystem.ts` - 统一事件系统（已修复，使用 utils 包）

### 🔍 UnifiedEventBus 可用方法

从 `@dailyuse/utils` 包导出的 `eventBus` 支持以下方法：

#### 单向通信（One-way）

- `send(event: string, data?: any): void` - 发送事件
- `on(event: string, handler: Function): void` - 监听事件
- `once(event: string, handler: Function): void` - 监听一次事件
- `off(event: string, handler?: Function): void` - 移除监听器

#### 双向通信（Two-way）

- `invoke(event: string, data?: any): Promise<any>` - 调用并等待响应
- `handle(event: string, handler: Function): void` - 处理并返回响应

#### 兼容性方法

- `publish(channel: string, data: any): void` - 发布到频道（同 send）
- `subscribe(channel: string, handler: Function): void` - 订阅频道（同 on）
- `unsubscribe(channel: string, handler?: Function): void` - 取消订阅（同 off）

#### 管理方法

- `getStats(): EventBusStats` - 获取统计信息
- `destroy(): void` - 销毁事件总线
- `removeHandler(event: string, handler?: Function): void` - 移除处理器

### ❌ 不可用的方法（已从代码中移除）

- `healthCheck()` - 不存在
- `getEnhancedStats()` - 不存在

## 类型检查结果

### 迁移前

- 12 个类型错误（包括缺失模块导入错误）

### 迁移后

- 3 个类型错误（仅测试文件中的无关错误）
  - `tempTypes.ts` - AccountType 属性不存在
  - `test-event-driven-architecture.ts` - ACCOUNT_UUID 变量名错误（2处）

### ✅ 事件系统相关错误：全部解决！

## 待实现的模块

以下模块导入已被注释，待模块实现后需要取消注释：

### unifiedEventSystem.ts

```typescript
// import { registerAccountEventHandlers } from '../../modules/account';
// import { initializeAuthenticationEventHandlers } from '../../modules/authentication/application/events/EventHandler';
// import { initializeGoalEventHandlers } from '../../modules/goal';
```

### initializer.ts

```typescript
// import { registerAccountInitializationTasks } from '../../modules/account';
// import { registerAuthenticationInitializationTasks } from '../../modules/authentication';
// import { registerGoalInitializationTasks } from '../../modules/goal';
// import { registerNotificationInitializationTasks } from '../../modules/notification/initialization/notificationInitialization';
// import { registerSettingInitializationTasks } from '../../modules/setting/initialization/settingInitialization';
// import { registerThemeInitializationTasks } from '../../modules/theme/initialization/themeInitialization';
```

## 使用示例

### 基本事件发送和监听

```typescript
import { eventBus } from '@dailyuse/utils';

// 监听事件
eventBus.on('user:created', (data) => {
  console.log('用户已创建:', data);
});

// 发送事件
eventBus.send('user:created', {
  userId: '123',
  name: 'John Doe',
});
```

### 双向通信

```typescript
// 注册处理器
eventBus.handle('user:query', async (query) => {
  const user = await findUser(query.userId);
  return user;
});

// 调用处理器
const user = await eventBus.invoke('user:query', { userId: '123' });
```

### 获取统计信息

```typescript
const stats = eventBus.getStats();
console.log('事件总线统计:', {
  处理器数量: stats.handlersCount,
  监听器数量: stats.listenersCount,
  待处理请求: stats.pendingRequestsCount,
});
```

## 注意事项

1. **跨平台支持**：UnifiedEventBus 设计用于多平台（Web、Node.js、Electron），使用时无需关心底层实现。

2. **类型安全**：建议为事件定义 TypeScript 类型以提高代码安全性。

3. **错误处理**：事件处理器中应包含适当的错误处理逻辑，避免未捕获的异常。

4. **内存管理**：记得在不需要时使用 `off()` 移除监听器，避免内存泄漏。

5. **模块化注册**：每个模块应在其自己的初始化文件中注册事件处理器，保持代码组织清晰。

## 下一步工作

1. 实现缺失的模块（account、authentication、goal、notification、setting、theme）
2. 为这些模块创建事件处理器注册函数
3. 在 `unifiedEventSystem.ts` 和 `initializer.ts` 中取消相关注释
4. 修复测试文件中的无关错误（tempTypes.ts、test-event-driven-architecture.ts）
5. 完善 Schedule 模块的事件处理器

## 参考资源

- UnifiedEventBus 源码：`packages/utils/src/domain/UnifiedEventBus.ts`
- 事件系统初始化：`apps/api/src/shared/events/unifiedEventSystem.ts`
- 应用初始化：`apps/api/src/shared/initialization/initializer.ts`
