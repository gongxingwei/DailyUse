# Notification Metadata 值对象修复

## ❌ 问题

```
TypeError: params.metadata?.toPlainObject is not a function
```

## 🔍 根本原因

`NotificationDomainService.createAndSendNotification()` 接收的 `metadata` 参数是**普通对象**：

```typescript
metadata: {
  sourceType: 'reminder',
  sourceId: 'test-reminder-id',
  additionalData: { ... }
}
```

但 `Notification.create()` 期望的是 **`NotificationMetadata` 值对象**，该值对象有 `toPlainObject()` 方法。

## ✅ 修复

### 文件: `apps/api/src/modules/notification/domain/services/NotificationDomainService.ts`

```typescript
// ❌ 旧代码 - 直接传递普通对象
const notification = Notification.create({
  uuid: params.uuid,
  accountUuid: params.accountUuid,
  content: notificationContent,
  type: params.type,
  deliveryChannels,
  scheduleTime,
  metadata: params.metadata, // ← 这是普通对象
  templateUuid: params.templateUuid,
  actions: params.actions,
});

// ✅ 新代码 - 先转换为值对象
const metadata = params.metadata
  ? NotificationMetadata.create({
      sourceType: params.metadata.sourceType || 'system',
      sourceId: params.metadata.sourceId || params.uuid,
      additionalData: params.metadata.additionalData,
    })
  : undefined;

const notification = Notification.create({
  uuid: params.uuid,
  accountUuid: params.accountUuid,
  content: notificationContent,
  type: params.type,
  deliveryChannels,
  scheduleTime,
  metadata, // ← 现在是 NotificationMetadata 值对象
  templateUuid: params.templateUuid,
  actions: params.actions,
});
```

## 🧪 测试验证

创建了测试脚本 `test-notification-creation.ts`，完整模拟 TaskTriggeredHandler 的流程：

```bash
cd apps/api
npx tsx src/__tests__/manual/test-notification-creation.ts
```

**测试结果**: ✅ 通过

```
✅ 通知创建成功！
   通知 UUID: b637d6c8-fc2b-41cd-a9a7-665e4170a916
   标题: 测试提醒标题
   内容: 测试提醒内容
   渠道: [ 'desktop' ]
   状态: pending
```

## 📝 类型流转

```
TaskTriggeredHandler
  ↓ 创建普通对象
  metadata: {
    sourceType: 'reminder',
    sourceId: 'xxx',
    additionalData: {...}
  }
  ↓ 传递给
NotificationApplicationService.createNotification()
  ↓ 传递给
NotificationDomainService.createAndSendNotification()
  ↓ 转换为值对象
  NotificationMetadata.create({...})
  ↓ 传递给
Notification.create()
  ↓ 调用
  metadata.toPlainObject() ✅ 成功
```

## ✅ 完整修复清单

- [x] 修复 metadata 转换逻辑
- [x] 创建测试脚本验证
- [x] 测试通过
- [x] 无 TypeScript 错误
- [x] 符合领域驱动设计（值对象模式）

---

**修复时间**: 2025-10-07 15:35  
**测试脚本**: `apps/api/src/__tests__/manual/test-notification-creation.ts`  
**影响文件**: 1 个 (NotificationDomainService.ts)
