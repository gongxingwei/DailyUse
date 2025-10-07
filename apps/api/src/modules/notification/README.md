# Notification 模块 - DDD 架构完整实现

## 📋 模块概述

Notification 模块采用完整的 DDD (领域驱动设计) 架构，实现了：
- ✅ 通知的创建、发送、已读、忽略等完整生命周期管理
- ✅ 多渠道通知支持（IN_APP, SSE, SYSTEM, EMAIL, SMS, PUSH）
- ✅ 用户通知偏好管理（类型过滤、渠道设置、免打扰时段）
- ✅ 通知模板系统（可复用的通知模板）
- ✅ 发送回执跟踪（每个渠道的发送状态）
- ✅ SSE 实时推送（兼容旧功能）
- ✅ 通知持久化（支持历史查询）

## 🏗️ 架构层次

```
notification/
├── domain/                    # 领域层（核心业务逻辑）
│   ├── value-objects/         # 值对象
│   │   ├── NotificationContent.ts      # 通知内容
│   │   ├── NotificationAction.ts       # 通知动作
│   │   ├── DeliveryChannels.ts         # 投递渠道配置
│   │   ├── ScheduleTime.ts             # 调度时间
│   │   └── NotificationMetadata.ts     # 元数据
│   ├── entities/              # 实体
│   │   └── DeliveryReceipt.ts          # 发送回执
│   ├── aggregates/            # 聚合根
│   │   ├── Notification.ts             # 通知聚合根 ⭐
│   │   ├── NotificationTemplate.ts     # 通知模板聚合根
│   │   └── NotificationPreference.ts   # 通知偏好聚合根
│   ├── repositories/          # 仓储接口
│   │   ├── INotificationRepository.ts
│   │   ├── INotificationTemplateRepository.ts
│   │   └── INotificationPreferenceRepository.ts
│   └── services/              # 领域服务
│       ├── NotificationDomainService.ts      # 核心业务逻辑 ⭐
│       ├── TemplateRenderService.ts          # 模板渲染
│       └── ChannelSelectionService.ts        # 渠道选择
│
├── infrastructure/            # 基础设施层（技术实现）
│   ├── repositories/          # 仓储实现
│   │   ├── NotificationRepository.ts
│   │   └── NotificationPreferenceRepository.ts
│   └── mappers/              # 数据映射
│       └── NotificationMapper.ts
│
├── application/              # 应用层（用例编排）
│   └── eventHandlers/
│       └── TaskTriggeredHandler.ts     # ⭐ 重构后的事件处理器
│
└── interface/                # 接口层（API）
    └── http/
        └── NotificationController.ts   # REST API（待实现）
```

## 🎯 核心概念

### 1. 聚合根

#### Notification（通知）
- **职责**：管理通知的完整生命周期
- **状态**：pending → sent → read/dismissed/failed/expired
- **不变量**：
  - 已发送的通知才能标记为已读
  - 过期的通知不能发送
  - 每个渠道只能有一条发送回执

#### NotificationTemplate（通知模板）
- **职责**：管理可复用的通知模板
- **功能**：模板渲染、变量替换、验证
- **示例变量**：`{{userName}}`, `{{goalName}}`, `{{progress}}`

#### NotificationPreference（通知偏好）
- **职责**：管理用户的通知偏好设置
- **功能**：
  - 控制哪些类型的通知可以接收
  - 各渠道的开关和设置
  - 免打扰时段管理

### 2. 实体

#### DeliveryReceipt（发送回执）
- **职责**：跟踪单个渠道的发送状态
- **状态转换**：pending → sent → delivered/failed
- **重试机制**：支持失败重试

### 3. 值对象

- **NotificationContent**：封装标题、内容、图标、图片
- **NotificationAction**：导航、执行、忽略等动作
- **DeliveryChannels**：渠道列表 + 优先级
- **ScheduleTime**：调度时间 + 过期时间
- **NotificationMetadata**：来源追溯信息

## 📝 使用示例

### 1. 创建并发送通知

```typescript
import { NotificationDomainService } from './domain/services/NotificationDomainService';
import { NotificationMetadata } from './domain/value-objects/NotificationMetadata';
import { NotificationType, NotificationPriority, NotificationChannel } from '@dailyuse/contracts';
import { v4 as uuidv4 } from 'uuid';

// 注入依赖
const notificationService = new NotificationDomainService(
  notificationRepository,
  preferenceRepository,
);

// 创建通知
const notification = await notificationService.createAndSendNotification({
  uuid: uuidv4(),
  accountUuid: 'user-123',
  title: '目标进度提醒',
  content: '您的目标"完成项目"已完成 50%',
  type: NotificationType.REMINDER,
  priority: NotificationPriority.NORMAL,
  channels: [NotificationChannel.IN_APP, NotificationChannel.SSE],
  icon: '🎯',
  metadata: NotificationMetadata.createForGoal({
    goalId: 'goal-456',
    additionalData: { progress: 0.5 },
  }),
});
```

### 2. 标记通知为已读

```typescript
await notificationService.markAsRead('notification-uuid');
```

### 3. 批量标记已读

```typescript
await notificationService.batchMarkAsRead([
  'notification-1',
  'notification-2',
]);
```

### 4. 查询通知

```typescript
const { notifications, total } = await notificationRepository.query({
  accountUuid: 'user-123',
  status: [NotificationStatus.SENT, NotificationStatus.PENDING],
  type: [NotificationType.REMINDER],
  limit: 20,
  offset: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});
```

### 5. 获取未读数量

```typescript
const unreadCount = await notificationService.getUnreadCount('user-123');
```

## 🔧 事件驱动集成

### TaskTriggeredHandler（重构完成）

当 Schedule 模块触发任务时，自动创建通知：

```typescript
// Schedule 模块发布事件
eventBus.publish(new TaskTriggeredEvent({
  aggregateId: 'task-123',
  accountUuid: 'user-123',
  sourceType: 'reminder',
  sourceId: 'reminder-456',
  payload: {
    data: {
      message: '该写日报了！',
      scheduledTime: new Date(),
    },
  },
}));

// TaskTriggeredHandler 自动处理
// 1. 创建持久化通知（数据库）
// 2. 通过 SSE 实时推送（前端）
```

**优势**：
- ✅ 通知持久化，支持历史查询
- ✅ 遵循用户偏好设置
- ✅ 保持 SSE 实时推送功能
- ✅ 支持发送回执跟踪

## 🗄️ 数据库表结构

### notifications
- uuid, accountUuid, templateUuid
- title, content, icon, image
- type, priority, status, channels (JSON)
- scheduledAt, sentAt, readAt, dismissedAt, expiresAt
- metadata (JSON), version

### notification_templates
- uuid, name, type
- titleTemplate, contentTemplate
- defaultPriority, defaultChannels (JSON)
- variables (JSON), enabled

### notification_preferences
- uuid, accountUuid
- enabledTypes (JSON)
- channelPreferences (JSON)
- maxNotifications, autoArchiveDays

### delivery_receipts
- uuid, notificationUuid, channel
- status, sentAt, deliveredAt
- failureReason, retryCount, metadata (JSON)

## 🎨 设计模式应用

1. **聚合模式**：Notification 作为聚合根管理 DeliveryReceipt
2. **工厂模式**：静态工厂方法创建聚合和实体
3. **值对象模式**：不可变的值对象封装业务规则
4. **仓储模式**：抽象数据访问，依赖倒置
5. **领域服务**：跨聚合的业务逻辑
6. **事件驱动**：通过领域事件解耦模块

## 🚀 后续扩展

### 待实现功能
- [ ] NotificationController (REST API)
- [ ] NotificationTemplateRepository 实现
- [ ] 集成测试编写
- [ ] 邮件渠道实现
- [ ] 短信渠道实现
- [ ] Push 通知实现

### 扩展建议
1. **批量通知**：批量创建和发送通知
2. **通知分组**：将相关通知分组折叠
3. **通知优先级队列**：高优先级通知优先发送
4. **定时清理**：自动清理过期/已归档通知
5. **通知统计**：用户通知行为分析

## 📚 参考文档

- [DDD 参考架构](../../../docs/systems/)
- [Goal 模块实现](../goal/)
- [事件驱动架构](../schedule/domain/events/)
