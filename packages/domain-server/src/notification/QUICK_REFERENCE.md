# Notification 模块快速参考指南

## 📦 导入方式

```typescript
// 从 domain-server 导入
import {
  // 聚合根
  Notification,
  NotificationTemplate,
  NotificationPreference,

  // 实体
  NotificationChannel,
  NotificationHistory,

  // 值对象
  NotificationAction,
  NotificationMetadata,
  CategoryPreference,
  DoNotDisturbConfig,
  RateLimit,
  ChannelError,
  ChannelResponse,
  NotificationTemplateConfig,

  // 仓储接口
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,

  // 领域服务
  NotificationDomainService,
  NotificationTemplateDomainService,
  NotificationPreferenceDomainService,
} from '@dailyuse/domain-server';

// 或者分模块导入
import { Notification } from '@dailyuse/domain-server/notification';
```

## 🎯 常见用例

### 1. 创建并发送通知

```typescript
const notificationService = new NotificationDomainService(
  notificationRepo,
  templateRepo,
  preferenceRepo,
);

// 直接创建并发送
const notification = await notificationService.createAndSendNotification({
  accountUuid: 'user-123',
  title: '任务完成',
  content: '你的任务"完成项目文档"已标记为完成',
  type: NotificationType.INFO,
  category: NotificationCategory.TASK,
  importance: ImportanceLevel.High,
  relatedEntityType: RelatedEntityType.TASK,
  relatedEntityUuid: 'task-456',
  channels: ['inApp', 'email'], // 多渠道发送
});
```

### 2. 使用模板创建通知

```typescript
const templateService = new NotificationTemplateDomainService(templateRepo);

// 创建模板
const template = await templateService.createTemplate({
  name: 'task-completed',
  type: NotificationType.INFO,
  category: NotificationCategory.TASK,
  template: {
    template: {
      title: '{{taskName}} 已完成',
      content: '任务 {{taskName}} 在 {{completedAt}} 完成',
      variables: ['taskName', 'completedAt'],
    },
    channels: {
      inApp: true,
      email: true,
      push: false,
      sms: false,
    },
  },
});

// 使用模板发送
const notification = await notificationService.createNotificationFromTemplate({
  accountUuid: 'user-123',
  templateUuid: template.uuid,
  variables: {
    taskName: '完成项目文档',
    completedAt: '2025-10-14 10:30',
  },
  relatedEntityType: RelatedEntityType.TASK,
  relatedEntityUuid: 'task-456',
});
```

### 3. 管理用户偏好

```typescript
const preferenceService = new NotificationPreferenceDomainService(preferenceRepo);

// 获取或创建偏好设置
const preference = await preferenceService.getOrCreatePreference('user-123');

// 禁用邮件通知
await preferenceService.disableChannel('user-123', 'email');

// 设置免打扰（每天 22:00 - 08:00）
await preferenceService.enableDoNotDisturb(
  'user-123',
  '22:00',
  '08:00',
  [0, 1, 2, 3, 4, 5, 6], // 所有日期
);

// 更新分类偏好
await preferenceService.updateCategoryPreference('user-123', NotificationCategory.TASK, {
  enabled: true,
  channels: { inApp: true, email: false, push: true, sms: false },
  importance: ImportanceLevel.High,
});
```

### 4. 查询和管理通知

```typescript
// 获取未读通知
const unread = await notificationService.getUnreadNotifications('user-123', {
  limit: 20,
});

// 获取未读数量
const count = await notificationService.getUnreadCount('user-123');

// 标记为已读
await notificationService.markAsRead(notification.uuid);

// 批量标记为已读
await notificationService.markManyAsRead([uuid1, uuid2, uuid3]);

// 标记所有为已读
await notificationService.markAllAsRead('user-123');

// 软删除通知
await notificationService.deleteNotification(notification.uuid, true);

// 获取分类统计
const stats = await notificationService.getCategoryStats('user-123');
// { TASK: 5, GOAL: 3, SCHEDULE: 2, ... }
```

### 5. 渠道管理

```typescript
// 获取通知（包含子实体）
const notification = await notificationService.getNotification(uuid, {
  includeChildren: true,
});

// 检查渠道状态
const channels = notification.getAllChannels();
for (const channel of channels) {
  console.log(channel.channelType, channel.status);

  if (channel.isFailed()) {
    const error = channel.error;
    console.error(`Failed: ${error?.message}`);

    // 重试
    if (channel.canRetry()) {
      channel.retry();
    }
  }
}

// 保存更新
await notificationRepo.save(notification);
```

### 6. 执行通知操作

```typescript
// 通知带操作按钮
const notification = await notificationService.createAndSendNotification({
  accountUuid: 'user-123',
  title: '任务分配',
  content: '你被分配了新任务：完成周报',
  type: NotificationType.ACTION_REQUIRED,
  category: NotificationCategory.TASK,
  actions: [
    {
      id: 'accept',
      type: NotificationActionType.ACCEPT,
      label: '接受',
      url: '/tasks/task-789',
    },
    {
      id: 'reject',
      type: NotificationActionType.REJECT,
      label: '拒绝',
    },
  ],
});

// 用户点击操作
await notificationService.executeNotificationAction(notification.uuid, 'accept');
```

### 7. 维护任务

```typescript
// 清理过期通知
const expiredCount = await notificationService.cleanupExpiredNotifications();
console.log(`Cleaned up ${expiredCount} expired notifications`);

// 清理已删除通知（超过 30 天）
const deletedCount = await notificationService.cleanupDeletedNotifications(30);
console.log(`Cleaned up ${deletedCount} deleted notifications`);
```

## 🔍 仓储接口实现示例

```typescript
// infrastructure/repositories/NotificationRepositoryImpl.ts
export class NotificationRepositoryImpl implements INotificationRepository {
  constructor(private prisma: PrismaClient) {}

  async save(notification: Notification): Promise<void> {
    const dto = notification.toPersistenceDTO();

    await this.prisma.notification.upsert({
      where: { uuid: dto.uuid },
      create: dto,
      update: dto,
    });

    // 级联保存子实体
    if (notification.channels) {
      for (const channel of notification.channels) {
        await this.prisma.notificationChannel.upsert({
          where: { uuid: channel.uuid },
          create: channel.toPersistenceDTO(),
          update: channel.toPersistenceDTO(),
        });
      }
    }
  }

  async findById(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Notification | null> {
    const data = await this.prisma.notification.findUnique({
      where: { uuid },
      include: options?.includeChildren
        ? {
            channels: true,
            history: true,
          }
        : undefined,
    });

    if (!data) return null;

    return Notification.fromPersistenceDTO(data);
  }

  // ... 其他方法实现
}
```

## 📊 数据库 Schema 示例

```prisma
// prisma/schema.prisma

model Notification {
  uuid                 String   @id
  account_uuid         String
  title                String
  content              String   @db.Text
  type                 String
  category             String
  importance           String
  urgency              String
  status               String
  is_read              Boolean  @default(false)
  read_at              BigInt?
  related_entity_type  String?
  related_entity_uuid  String?
  actions              String?  @db.Text // JSON
  metadata             String?  @db.Text // JSON
  expires_at           BigInt?
  created_at           BigInt
  updated_at           BigInt
  sent_at              BigInt?
  delivered_at         BigInt?
  deleted_at           BigInt?

  channels             NotificationChannel[]
  history              NotificationHistory[]

  @@index([account_uuid, status])
  @@index([account_uuid, is_read])
  @@index([category])
  @@index([created_at])
}

model NotificationChannel {
  uuid                String   @id
  notification_uuid   String
  channel_type        String
  recipient           String?
  status              String
  sent_at             BigInt?
  delivered_at        BigInt?
  error               String?  @db.Text // JSON
  response            String?  @db.Text // JSON
  retry_count         Int      @default(0)
  max_retries         Int      @default(3)
  last_retry_at       BigInt?
  created_at          BigInt
  updated_at          BigInt

  notification        Notification @relation(fields: [notification_uuid], references: [uuid], onDelete: Cascade)

  @@index([notification_uuid])
  @@index([status])
}

model NotificationHistory {
  uuid                String   @id
  notification_uuid   String
  action              String
  details             String?  @db.Text // JSON
  created_at          BigInt

  notification        Notification @relation(fields: [notification_uuid], references: [uuid], onDelete: Cascade)

  @@index([notification_uuid])
}

model NotificationTemplate {
  uuid                String   @id
  name                String   @unique
  description         String?
  type                String
  category            String
  template            String   @db.Text // JSON
  is_active           Boolean  @default(true)
  is_system_template  Boolean  @default(false)
  created_at          BigInt
  updated_at          BigInt

  @@index([category])
  @@index([type])
  @@index([is_active])
}

model NotificationPreference {
  uuid                String   @id
  account_uuid        String   @unique
  enabled             Boolean  @default(true)
  channels            String   @db.Text // JSON
  categories          String   @db.Text // JSON
  do_not_disturb      String?  @db.Text // JSON
  rate_limit          String?  @db.Text // JSON
  created_at          BigInt
  updated_at          BigInt
}
```

## 🎨 API 控制器示例

```typescript
// api/controllers/NotificationController.ts

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationDomainService) {}

  @Get()
  async getNotifications(
    @Req() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const accountUuid = req.user.uuid;
    return await this.notificationService.getUserNotifications(accountUuid, {
      limit,
      offset,
    });
  }

  @Get('unread')
  async getUnread(@Req() req) {
    const accountUuid = req.user.uuid;
    return await this.notificationService.getUnreadNotifications(accountUuid);
  }

  @Get('unread/count')
  async getUnreadCount(@Req() req) {
    const accountUuid = req.user.uuid;
    const count = await this.notificationService.getUnreadCount(accountUuid);
    return { count };
  }

  @Patch(':uuid/read')
  async markAsRead(@Param('uuid') uuid: string) {
    await this.notificationService.markAsRead(uuid);
    return { success: true };
  }

  @Post('read-all')
  async markAllAsRead(@Req() req) {
    const accountUuid = req.user.uuid;
    await this.notificationService.markAllAsRead(accountUuid);
    return { success: true };
  }

  @Delete(':uuid')
  async delete(@Param('uuid') uuid: string) {
    await this.notificationService.deleteNotification(uuid, true);
    return { success: true };
  }

  @Post(':uuid/actions/:actionId')
  async executeAction(@Param('uuid') uuid: string, @Param('actionId') actionId: string) {
    await this.notificationService.executeNotificationAction(uuid, actionId);
    return { success: true };
  }
}
```

## 🔔 实时通知（SSE）

```typescript
// api/controllers/NotificationSSEController.ts

@Controller('notifications/stream')
export class NotificationSSEController {
  @Sse()
  stream(@Req() req): Observable<MessageEvent> {
    const accountUuid = req.user.uuid;

    return new Observable((observer) => {
      // 监听新通知事件
      eventBus.on(`notification.created.${accountUuid}`, (notification) => {
        observer.next({
          type: 'notification',
          data: notification,
        });
      });

      // 监听未读数量变化
      eventBus.on(`notification.unread.count.${accountUuid}`, (count) => {
        observer.next({
          type: 'unread-count',
          data: { count },
        });
      });
    });
  }
}
```

---

**最后更新**：2025-10-14
