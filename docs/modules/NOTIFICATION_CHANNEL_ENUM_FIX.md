# 通知渠道枚举修复总结

## 🐛 问题根源

### 问题 1: SSE 401 错误
**原因**: Express 路由匹配顺序错误
- `/notifications/sse/events` 先匹配到 `/notifications` 路由
- 触发了 `authMiddleware`，导致 401 未授权

**解决方案**: 将 SSE 路由挂载在 `/notifications` 之前
```typescript
// ✅ 正确顺序
api.use('/notifications/sse', notificationSSERoutes);
api.use('/notifications', authMiddleware, notificationRoutes);
```

### 问题 2: No allowed channels for notification type schedule_reminder

**根本原因**: **NotificationChannel 枚举定义不完整**

代码中广泛使用 `DESKTOP` 和 `SOUND` 渠道，但 contracts 包中的枚举定义缺少这两个值：

```typescript
// ❌ 旧定义（不完整）
export enum NotificationChannel {
  IN_APP = 'in_app',
  SSE = 'sse',
  SYSTEM = 'system',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

// ✅ 新定义（完整）
export enum NotificationChannel {
  IN_APP = 'in_app',
  SSE = 'sse',
  DESKTOP = 'desktop', // 新增：桌面应用通知
  SOUND = 'sound',     // 新增：声音提醒
  SYSTEM = 'system',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}
```

**连锁反应**:

1. `TaskTriggeredHandler.mapChannels()` 返回 `['DESKTOP' as NotificationChannel]`
2. NotificationPreferenceRepository 从数据库读取 `channelPreferences`，键为小写（`desktop`, `sound`）
3. `preference.isTypeAllowedOnChannel('DESKTOP', 'schedule_reminder')` 查找失败
   - Map 中的键是 `'desktop'`（小写）
   - 查询的键是 `'DESKTOP'`（大写字符串）
   - `NotificationChannel.DESKTOP` 的值才是 `'desktop'`（小写）
4. 所有渠道都被过滤掉，导致错误：`No allowed channels`

## ✅ 修复内容

### 1. 添加缺失的枚举值

**文件**: `packages/contracts/src/modules/notification/enums.ts`

```typescript
export enum NotificationChannel {
  IN_APP = 'in_app',
  SSE = 'sse',
  DESKTOP = 'desktop', // ← 新增
  SOUND = 'sound',     // ← 新增
  SYSTEM = 'system',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}
```

### 2. 修复 TaskTriggeredHandler

**文件**: `apps/api/src/modules/notification/application/eventHandlers/TaskTriggeredHandler.ts`

#### 2.1 添加运行时导入
```typescript
import { NotificationChannel } from '@dailyuse/contracts';
```

#### 2.2 修复 mapChannels 方法
```typescript
// ❌ 旧代码 - 硬编码字符串
return ['DESKTOP' as NotificationContracts.NotificationChannel];

// ✅ 新代码 - 使用枚举值
return [NotificationChannel.DESKTOP]; // 值为 'desktop'
```

#### 2.3 修复 switch-case
```typescript
// ❌ 旧代码 - 硬编码字符串
switch (channel) {
  case 'DESKTOP':
  case 'EMAIL':
  case 'SMS':
  case 'IN_APP':
}

// ✅ 新代码 - 使用枚举
switch (channel) {
  case NotificationChannel.DESKTOP:
  case NotificationChannel.EMAIL:
  case NotificationChannel.SMS:
  case NotificationChannel.IN_APP:
}
```

### 3. 更新测试用户通知偏好

**文件**: `apps/api/src/__tests__/manual/update-test-user-prefs.ts`

```typescript
const channelPreferences = {
  in_app: { enabled: true, types: [] },
  sse: { enabled: true, types: [] },
  desktop: { enabled: true, types: [] }, // ← 必须有
  sound: { enabled: true, types: [] },   // ← 必须有
};
```

**关键点**: 
- 数据库中存储的键必须是小写（`desktop`, `sound`）
- 与 `NotificationChannel.DESKTOP` 的值（`'desktop'`）匹配
- `types: []` 表示允许所有 `enabledTypes` 中的类型

## 🔍 问题诊断脚本

创建了诊断脚本帮助发现问题：

**文件**: `apps/api/src/__tests__/manual/diagnose-channel-mapping.ts`

输出示例：
```
Map keys: [ 'in_app', 'sse', 'desktop', 'sound' ]

检查各个渠道:
  DESKTOP: undefined        ← 大写字符串找不到
  desktop: {"enabled":true} ← 小写字符串能找到
  
NotificationChannel.DESKTOP: 'desktop' ← 枚举值是小写
```

## 📊 数据流图

### 正确的流程

```
TaskTriggeredHandler.mapChannels()
  ↓ 返回 [NotificationChannel.DESKTOP]
  ↓ 实际值: ['desktop']
  ↓
NotificationDomainService.createAndSendNotification()
  ↓ params.channels = ['desktop']
  ↓
preference.isTypeAllowedOnChannel('desktop', 'schedule_reminder')
  ↓ Map.get('desktop') ✅ 找到
  ↓ { enabled: true, types: [] }
  ↓ types.length === 0，允许所有 enabledTypes
  ↓
✅ allowedChannels = ['desktop']
```

### 错误的流程（修复前）

```
TaskTriggeredHandler.mapChannels()
  ↓ 返回 ['DESKTOP' as NotificationChannel]
  ↓ 实际值: ['DESKTOP'] ← 字符串，不是枚举值
  ↓
preference.isTypeAllowedOnChannel('DESKTOP', 'schedule_reminder')
  ↓ Map.get('DESKTOP') ❌ 找不到（Map 的键是 'desktop'）
  ↓ 返回 false
  ↓
❌ allowedChannels = [] → 抛出错误
```

## ✅ 验证清单

- [x] 添加 `NotificationChannel.DESKTOP` 枚举
- [x] 添加 `NotificationChannel.SOUND` 枚举
- [x] 修复 `TaskTriggeredHandler.mapChannels()` 使用枚举值
- [x] 修复 `TaskTriggeredHandler.sendToChannel()` switch-case
- [x] 更新测试用户通知偏好设置
- [x] 修复 SSE 路由挂载顺序
- [ ] 测试 SSE 连接成功
- [ ] 测试 Reminder 通知推送成功

## 🎯 关键教训

1. **枚举值 vs 字符串**: 始终使用枚举值，不要硬编码字符串
   ```typescript
   ❌ return ['DESKTOP' as NotificationChannel];
   ✅ return [NotificationChannel.DESKTOP];
   ```

2. **类型安全**: TypeScript 的类型系统能捕获这类错误，但需要正确使用
   - `as` 类型断言会绕过类型检查
   - 应该使用实际的枚举值

3. **Map 键匹配**: Map 的键是严格匹配的
   - `Map.get('DESKTOP')` ≠ `Map.get('desktop')`
   - 枚举值的字符串表示必须与 Map 键一致

4. **数据库存储**: 枚举值的字符串形式存储在数据库中
   - `NotificationChannel.DESKTOP` → 存储为 `'desktop'`
   - Repository 转换时必须保持一致

---

**修复时间**: 2025-10-07  
**影响范围**: Notification 模块、Contracts 包、测试用户设置
