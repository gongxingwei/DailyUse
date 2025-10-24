# Notification 模块 - 核心架构规划

> **版本**: v1.1 (简化版)  
> **日期**: 2025-01-13  
> **架构参考**: Goal 模块（`docs/modules/goal/GOAL_MODULE_PLAN.md`）

---

## 🎯 核心要点

Notification 模块处理系统通知和用户通知偏好。

### 主要聚合根

1. **Notification** - 通知消息
2. **NotificationPreferences** - 通知偏好设置

### 主要实体

1. **NotificationChannel** - 通知渠道（邮件、推送等）

---

## 📋 DTO 命名规范

```typescript
// Server DTO
NotificationServerDTO;
NotificationPreferencesServerDTO;

// Client DTO（注意 Client 后缀）
NotificationClientDTO;
NotificationPreferencesClientDTO;

// Persistence DTO
NotificationPersistenceDTO;
NotificationPreferencesPersistenceDTO;
```

---

## 🔄 DTO 转换方法

与 Goal 模块完全一致。

---

## 🗂️ 状态管理

```typescript
export enum NotificationStatus {
  Pending = 'pending',
  Sent = 'sent',
  Read = 'read',
  Archived = 'archived',
  Deleted = 'deleted',
}
```

---

## 🔑 核心业务方法

```typescript
export class Notification extends AggregateRoot {
  // 状态管理
  public markAsSent(): void;
  public markAsRead(): void;
  public archive(): void;
  public softDelete(): void;

  // 查询
  public isRead(): boolean;
  public isExpired(): boolean;
}
```

---

## 📦 仓储接口

```typescript
export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  findByUuid(uuid: string): Promise<Notification | null>;
  findByAccountUuid(accountUuid: string): Promise<Notification[]>;

  // 查询
  findUnread(accountUuid: string): Promise<Notification[]>;
  findByStatus(accountUuid: string, status: NotificationStatus): Promise<Notification[]>;

  // 批量操作
  markAllAsRead(accountUuid: string): Promise<void>;
  deleteOld(beforeDate: Date): Promise<void>;
}
```

---

## 💡 重构建议

1. **基于 Goal 模块架构**
2. **实现多渠道支持**（邮件、推送、站内信）
3. **批量操作优化**

---

参考：`docs/modules/goal/GOAL_MODULE_PLAN.md`
