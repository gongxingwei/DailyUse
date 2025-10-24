# EPIC-NOTIFICATION-001: 多渠道通知聚合

> **Epic ID**: EPIC-NOTIFICATION-001  
> **功能编号**: NOTIFICATION-001  
> **RICE 评分**: 294 (Reach: 7, Impact: 7, Confidence: 6, Effort: 1)  
> **优先级**: P0  
> **预估工期**: 1.5-2 周 (15 SP)  
> **Sprint**: Sprint 6  
> **状态**: Draft  
> **创建日期**: 2025-10-21

---

## 1. Epic 概述

### 业务价值

统一管理应用内/桌面/邮件多渠道通知，提供聚合通知中心，支持已读/未读管理。

**核心问题**:

- ❌ 通知散落在各个模块，无统一入口
- ❌ 无法区分已读/未读
- ❌ 缺少通知分组和优先级
- ❌ 桌面通知与应用内通知不同步

**解决方案**:

- ✅ 统一通知中心聚合所有通知
- ✅ 多渠道推送（应用内+桌面+邮件）
- ✅ 已读/未读管理
- ✅ 通知分组与优先级
- ✅ 通知偏好设置

---

## 2. User Stories (精简版)

### Story 001: Contracts & Domain - 通知模型 (3 SP)

```typescript
export interface NotificationServerDTO {
  readonly uuid: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly content: string;
  readonly priority: NotificationPriority;
  readonly channels: NotificationChannel[]; // 推送渠道
  readonly isRead: boolean;
  readonly readAt?: number;
  readonly actionUrl?: string;
  readonly metadata?: Record<string, any>;
  readonly createdAt: number;
  readonly expiresAt?: number;
}

export enum NotificationType {
  TASK_REMINDER = 'task_reminder',
  GOAL_PROGRESS = 'goal_progress',
  DEPENDENCY_MET = 'dependency_met',
  SYSTEM = 'system',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  IN_APP = 'in_app', // 应用内
  DESKTOP_PUSH = 'desktop_push', // 桌面推送
  EMAIL = 'email', // 邮件
}
```

**Domain 逻辑**:

```typescript
export class Notification {
  markAsRead(): void {
    if (this.isRead) return;

    this.isRead = true;
    this.readAt = Date.now();

    this.addDomainEvent(
      new NotificationReadEvent({
        notificationUuid: this.uuid,
        userId: this.userId,
        readAt: this.readAt,
      }),
    );
  }

  shouldExpire(): boolean {
    if (!this.expiresAt) return false;
    return Date.now() > this.expiresAt;
  }

  canSendViaChannel(channel: NotificationChannel): boolean {
    return this.channels.includes(channel);
  }
}
```

---

### Story 002: Application Service - 通知管理服务 (3 SP)

```typescript
export class NotificationService {
  async create(command: CreateNotificationCommand): Promise<Notification> {
    const notification = new Notification({
      uuid: generateUuid(),
      ...command,
      isRead: false,
      createdAt: Date.now(),
    });

    await this.repo.save(notification);

    // 多渠道推送
    await this.dispatchToChannels(notification);

    return notification;
  }

  private async dispatchToChannels(notification: Notification): Promise<void> {
    const promises: Promise<void>[] = [];

    if (notification.canSendViaChannel(NotificationChannel.IN_APP)) {
      promises.push(this.inAppService.send(notification));
    }

    if (notification.canSendViaChannel(NotificationChannel.DESKTOP_PUSH)) {
      promises.push(this.desktopPushService.send(notification));
    }

    if (notification.canSendViaChannel(NotificationChannel.EMAIL)) {
      // 邮件通知异步发送
      promises.push(this.emailService.sendAsync(notification));
    }

    await Promise.all(promises);
  }

  async markAsRead(userId: string, notificationUuid: string): Promise<void> {
    const notification = await this.repo.findByUuid(notificationUuid);

    if (notification.userId !== userId) {
      throw new UnauthorizedError();
    }

    notification.markAsRead();
    await this.repo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const unread = await this.repo.findUnread(userId);

    for (const notification of unread) {
      notification.markAsRead();
    }

    await this.repo.saveAll(unread);
    return unread.length;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.repo.countUnread(userId);
  }
}
```

---

### Story 003: Infrastructure - 通知表与索引 (2 SP)

```prisma
model Notification {
  uuid          String   @id @default(uuid())
  userId        String   @map("user_id")
  type          String   @map("type")
  title         String   @map("title")
  content       String   @map("content")
  priority      String   @map("priority")
  channels      Json     @map("channels")      // NotificationChannel[]
  isRead        Boolean  @default(false) @map("is_read")
  readAt        BigInt?  @map("read_at")
  actionUrl     String?  @map("action_url")
  metadata      Json?    @map("metadata")
  createdAt     BigInt   @map("created_at")
  expiresAt     BigInt?  @map("expires_at")

  user          User     @relation(fields: [userId], references: [uuid])

  @@index([userId, isRead])
  @@index([userId, createdAt(sort: Desc)])
  @@index([expiresAt])
  @@map("notifications")
}
```

**Indexes**:

- `(userId, isRead)`: 快速查询未读数量
- `(userId, createdAt DESC)`: 按时间排序列表
- `(expiresAt)`: 定期清理过期通知

---

### Story 004: API Endpoints (2 SP)

```typescript
// 创建通知（内部调用）
POST /api/v1/notifications
Body: { userId: string, type: string, title: string, content: string, priority: string, channels: string[] }

// 获取通知列表
GET /api/v1/notifications
Query: { isRead?: boolean, page: number, limit: number }
Response: { notifications: NotificationClientDTO[], total: number, unreadCount: number }

// 标记已读
PATCH /api/v1/notifications/:id/read
Response: NotificationClientDTO

// 批量标记已读
POST /api/v1/notifications/mark-all-read
Response: { updatedCount: number }

// 获取未读数量
GET /api/v1/notifications/unread-count
Response: { count: number }

// 删除通知
DELETE /api/v1/notifications/:id
```

---

### Story 005: Client Services (2 SP)

```typescript
export function useNotifications(filters?: { isRead?: boolean }) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => service.getList(filters),
    refetchInterval: 30000, // 30秒轮询
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: () => service.getUnreadCount(),
    refetchInterval: 10000, // 10秒轮询
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => service.markAsRead(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notification-unread-count']);
    },
  });
}
```

---

### Story 006: UI Component - 通知中心 (3 SP)

```vue
<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <!-- 通知图标 -->
    <el-badge :value="unreadCount" :hidden="unreadCount === 0">
      <el-icon :size="20"><Bell /></el-icon>
    </el-badge>

    <template #dropdown>
      <el-dropdown-menu class="notification-dropdown">
        <div class="header">
          <span>通知中心</span>
          <el-button link size="small" :disabled="unreadCount === 0" @click="markAllAsRead">
            全部已读
          </el-button>
        </div>

        <!-- 通知列表 -->
        <el-scrollbar max-height="400px">
          <div v-if="notifications.length === 0" class="empty">暂无通知</div>

          <div
            v-for="notification in notifications"
            :key="notification.uuid"
            class="notification-item"
            :class="{ 'is-unread': !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <!-- 优先级图标 -->
            <el-icon :size="16" :color="getPriorityColor(notification.priority)">
              <component :is="getPriorityIcon(notification.priority)" />
            </el-icon>

            <!-- 内容 -->
            <div class="content">
              <div class="title">{{ notification.title }}</div>
              <div class="description">{{ notification.content }}</div>
              <div class="time">{{ formatTime(notification.createdAt) }}</div>
            </div>

            <!-- 未读标记 -->
            <div v-if="!notification.isRead" class="unread-dot" />
          </div>
        </el-scrollbar>

        <div class="footer">
          <el-button link @click="viewAll">查看全部</el-button>
        </div>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useNotifications, useUnreadCount, useMarkAsRead } from '@domain-client/notification';
import { useRouter } from 'vue-router';

const router = useRouter();

const { data: notifications } = useNotifications({ isRead: false });
const { data: unreadCount } = useUnreadCount();
const markAsRead = useMarkAsRead();

async function handleNotificationClick(notification: any) {
  // 标记已读
  if (!notification.isRead) {
    await markAsRead.mutateAsync(notification.uuid);
  }

  // 跳转到目标页面
  if (notification.actionUrl) {
    router.push(notification.actionUrl);
  }
}

async function markAllAsRead() {
  await markAsRead.mutateAsync('all');
}

function viewAll() {
  router.push('/notifications');
}

function getPriorityColor(priority: string) {
  const colors = {
    low: '#909399',
    medium: '#409eff',
    high: '#e6a23c',
    urgent: '#f56c6c',
  };
  return colors[priority] || '#909399';
}
</script>

<style scoped>
.notification-dropdown {
  width: 360px;
}

.header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  position: relative;
  transition: background 0.3s;
}

.notification-item:hover {
  background: #f5f7fa;
}

.notification-item.is-unread {
  background: #ecf5ff;
}

.content {
  flex: 1;
  margin-left: 12px;
}

.title {
  font-weight: 500;
  margin-bottom: 4px;
}

.description {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.time {
  font-size: 12px;
  color: #909399;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f56c6c;
  position: absolute;
  top: 16px;
  right: 16px;
}

.footer {
  padding: 8px 16px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}
</style>
```

---

### Story 007: E2E Tests (1 SP)

```typescript
test('通知中心完整流程', async ({ page }) => {
  await page.goto('/');

  // 验证未读数量
  await expect(page.locator('[data-testid="notification-badge"]')).toContainText('3');

  // 打开通知中心
  await page.click('[data-testid="notification-icon"]');
  await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();

  // 点击通知
  await page.click('[data-testid="notification-item-1"]');

  // 验证已读
  await expect(page.locator('[data-testid="notification-badge"]')).toContainText('2');

  // 全部已读
  await page.click('[data-testid="notification-icon"]');
  await page.click('[data-testid="mark-all-read"]');
  await expect(page.locator('[data-testid="notification-badge"]')).not.toBeVisible();
});
```

---

## 3. Definition of Done

- [ ] 所有 7 个 Stories 完成
- [ ] Unit Tests 覆盖率 ≥ 80%
- [ ] 通知推送成功率 ≥ 99%
- [ ] 通知列表加载 < 200ms
- [ ] E2E Tests 通过

---

## 4. Release Plan

**Sprint 6 (Week 11-12)**:

- Week 1: Stories 001-004
- Week 2: Stories 005-007

---

## 5. 验收标准

```gherkin
Feature: 多渠道通知聚合

  Scenario: 通知创建与推送
    Given 用户"张三"登录系统
    When 系统创建通知：
      | type       | title      | priority | channels                 |
      | task_reminder | 任务提醒 | high     | in_app, desktop_push     |
    Then 应用内通知中心应显示新通知
    And 桌面应弹出推送通知
    And 未读数量应增加 1

  Scenario: 标记已读
    Given 用户有 3 条未读通知
    When 用户点击某条通知
    Then 该通知应标记为已读
    And 未读数量应减少 1

  Scenario: 全部已读
    Given 用户有 5 条未读通知
    When 用户点击"全部已读"
    Then 所有通知应标记为已读
    And 未读数量应变为 0
```

---

_文档创建: 2025-10-21 | Epic Owner: PM Agent_
