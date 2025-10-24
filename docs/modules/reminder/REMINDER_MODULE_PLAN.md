# Reminder 模块 - 核心架构规划

> **版本**: v1.1 (简化版)  
> **日期**: 2025-01-13  
> **架构参考**: Goal 模块（`docs/modules/goal/GOAL_MODULE_PLAN.md`）  
> **特殊要求**: ⚠️ **无归档状态，只有逻辑删除**

---

## 🎯 核心要点

Reminder 模块与 Goal 模块架构一致，**特别注意：不使用归档状态**。

### 主要聚合根

1. **ReminderTemplate** - 提醒模板
2. **ReminderInstance** - 提醒实例（实际触发的提醒）
3. **ReminderFolder** - 提醒文件夹（可选）

### 主要实体

1. **ReminderRecurrence** - 重复规则（值对象或实体）
2. **ReminderNotification** - 通知记录

---

## 📋 DTO 命名规范

```typescript
// Server DTO
ReminderTemplateServerDTO;
ReminderInstanceServerDTO;
ReminderFolderServerDTO;

// Client DTO（注意 Client 后缀）
ReminderTemplateClientDTO;
ReminderInstanceClientDTO;
ReminderFolderClientDTO;

// Persistence DTO
ReminderTemplatePersistenceDTO;
ReminderInstancePersistenceDTO;
ReminderFolderPersistenceDTO;
```

---

## 🔄 DTO 转换方法

与 Goal 模块完全一致，每个聚合根/实体需要4个转换方法。

---

## 🗂️ 状态管理 ⚠️ 重要

```typescript
// ❌ 错误：不要使用 Archived
export enum ReminderTemplateStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Archived = 'archived', // ❌ 删除这个
  Deleted = 'deleted',
}

// ✅ 正确：无归档状态
export enum ReminderTemplateStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Deleted = 'deleted', // 逻辑删除
}

export enum ReminderInstanceStatus {
  Pending = 'pending',
  Triggered = 'triggered',
  Completed = 'completed',
  Dismissed = 'dismissed',
  Snoozed = 'snoozed',
}
```

---

## 📊 生命周期

```
draft → active ⇄ paused → deleted
```

**不要使用**：

- ❌ `archive()` 方法
- ❌ `archivedAt` 字段
- ❌ `Archived` 状态

**使用**：

- ✅ `softDelete()` 方法
- ✅ `deletedAt` 字段
- ✅ `Deleted` 状态

---

## 🔑 核心业务方法

```typescript
export class ReminderTemplate extends AggregateRoot {
  // 状态转换
  public activate(): void;
  public pause(): void;
  public resume(): void;
  public softDelete(): void; // ✅ 使用软删除，不用 archive
  public restore(): void;

  // 实例管理
  public createInstance(triggerTime: Date): ReminderInstance;

  // 重复规则
  public updateRecurrence(recurrence: ReminderRecurrence): void;
  public getNextTriggerTime(): Date | null;
}
```

---

## 📦 仓储接口

```typescript
export interface IReminderTemplateRepository {
  save(template: ReminderTemplate): Promise<void>;
  findByUuid(uuid: string): Promise<ReminderTemplate | null>;
  findByAccountUuid(accountUuid: string, includeDeleted?: boolean): Promise<ReminderTemplate[]>;

  // 逻辑删除（不要用 archive）
  softDelete(uuid: string): Promise<void>;
  restore(uuid: string): Promise<void>;
  hardDelete(uuid: string): Promise<void>;

  // 查询
  findByStatus(accountUuid: string, status: ReminderTemplateStatus): Promise<ReminderTemplate[]>;
  findActiveReminders(accountUuid: string): Promise<ReminderTemplate[]>;
}
```

---

## ⚠️ 特别注意

### 与 Goal/Task 模块的区别

| 特性     | Goal/Task 模块                      | Reminder 模块                     |
| -------- | ----------------------------------- | --------------------------------- |
| 归档状态 | ✅ 有 `Archived`                    | ❌ 无，直接删除                   |
| 归档方法 | ✅ `archive()`                      | ❌ 使用 `softDelete()`            |
| 归档字段 | ✅ `archivedAt`                     | ❌ 无                             |
| 生命周期 | draft → active → archived → deleted | draft → active → paused → deleted |

### 为什么不用归档？

- 提醒是时间敏感的
- 过期的提醒直接删除即可
- 简化状态管理
- 减少用户困惑

---

## 💡 重构建议

1. **基于 Goal 模块**开始
2. **移除所有归档相关代码**
3. **调整状态枚举**
4. **实现提醒特有的重复规则**

---

## 📖 详细规划

完整的详细规划可以在重构过程中逐步补充。

参考：`docs/modules/goal/GOAL_MODULE_PLAN.md`（架构）

---

**注**: 这是简化版规划，强调了与 Goal 模块的关键区别。
