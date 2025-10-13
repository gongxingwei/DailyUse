# 模块规划文档 - 修正说明

> **创建时间**: 2025-10-13  
> **修正版本**: v1.1

---

## 🔧 修正内容概览

### 1. DTO 命名规范修正

**问题**: Client DTO 没有统一添加 `Client` 后缀

**修正**:
| 旧命名 | 新命名 |
|--------|--------|
| `GoalDTO` | `GoalClientDTO` |
| `TaskTemplateDTO` | `TaskTemplateClientDTO` |
| `ReminderTemplateDTO` | `ReminderTemplateClientDTO` |
| `AccountDTO` | `AccountClientDTO` |
| `NotificationDTO` | `NotificationClientDTO` |
| `UserPreferenceDTO` | `UserPreferenceClientDTO` |

**原则**: 所有 Client 端的 DTO 统一使用 `XxxClientDTO` 命名格式，与 `XxxServerDTO` 对称

---

### 2. DTO 转换方法补充

**问题**: 缺少完整的 DTO 转换方法体系

**修正**: 为所有聚合根和实体添加以下方法

#### Domain-Server 层（聚合根/实体）

```typescript
export class Goal extends AggregateRoot {
  // ===== To 方法 =====
  public toServerDTO(includeChildren = false): GoalServerDTO;
  public toPersistenceDTO(): GoalPersistenceDTO;
  
  // ===== From 静态方法 =====
  public static fromServerDTO(dto: GoalServerDTO): Goal;
  public static fromPersistenceDTO(dto: GoalPersistenceDTO): Goal;
}
```

#### Domain-Client 层（聚合根/实体）

```typescript
export class GoalClient extends AggregateRoot {
  // ===== To 方法 =====
  public toServerDTO(includeChildren = false): GoalServerDTO;
  public toClientDTO(includeChildren = false): GoalClientDTO;
  
  // ===== From 静态方法 =====
  public static fromServerDTO(dto: GoalServerDTO): GoalClient;
  public static fromClientDTO(dto: GoalClientDTO): GoalClient;
}
```

---

### 3. PersistenceDTO 类型补充

**问题**: 缺少 PersistenceDTO 的类型定义

**修正**: 为所有聚合根添加 PersistenceDTO 类型定义

#### 命名规范

```typescript
// Contracts 层
export interface GoalPersistenceDTO {
  uuid: string;
  account_uuid: string;  // 数据库使用 snake_case
  title: string;
  // ... 其他字段
  created_at: number;    // 数据库字段名
  updated_at: number;
}
```

**注意**:
- PersistenceDTO 使用 `snake_case` 字段名（数据库规范）
- 日期字段为 `number` 类型（timestamp）
- JSON 字段需要序列化为 `string`

---

### 4. Reminder 模块状态修正

**问题**: Reminder 模块包含 `Archived` 归档状态，应统一为逻辑删除

**修正前**:
```typescript
export enum ReminderTemplateStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Archived = 'archived',  // ❌ 应该删除
  Deleted = 'deleted',
}
```

**修正后**:
```typescript
export enum ReminderTemplateStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Deleted = 'deleted',     // ✅ 逻辑删除
}
```

**生命周期变更**:
```
修正前: draft → active ⇄ paused → archived → deleted
修正后: draft → active ⇄ paused → deleted
```

---

### 5. 逻辑删除统一原则

**所有模块的聚合根删除应该都是逻辑删除（软删除）**

#### 聚合根必须包含

```typescript
export class Goal extends AggregateRoot {
  private _status: GoalStatus;  // 包含 Deleted 状态
  private _deletedAt: Date | null;
  
  // 逻辑删除方法
  public softDelete(): void {
    this._status = GoalStatus.Deleted;
    this._deletedAt = new Date();
    this.markAsModified();
    
    this.addDomainEvent({
      eventType: 'GoalDeleted',
      // ...
    });
  }
  
  // 恢复方法
  public restore(): void {
    if (this._status !== GoalStatus.Deleted) {
      throw new Error('Only deleted goals can be restored');
    }
    this._status = GoalStatus.Active;  // 或其他合适的状态
    this._deletedAt = null;
    this.markAsModified();
  }
}
```

#### 仓储接口

```typescript
export interface IGoalRepository {
  // 基本方法返回包含已删除的
  findByUuid(uuid: string): Promise<Goal | null>;
  
  // 软删除
  softDelete(uuid: string): Promise<void>;
  
  // 恢复
  restore(uuid: string): Promise<void>;
  
  // 物理删除（谨慎使用）
  hardDelete(uuid: string): Promise<void>;
  
  // 查询时默认过滤已删除
  findByAccountUuid(accountUuid: string, includeDeleted?: boolean): Promise<Goal[]>;
}
```

---

### 6. 实体的 DTO 转换修正

**问题**: 实体（Entity）也需要完整的 DTO 转换方法

**修正**: KeyResult 实体示例

#### Domain-Server 层

```typescript
export class KeyResult extends Entity {
  // ===== To 方法 =====
  public toServerDTO(): KeyResultServerDTO {
    return {
      id: this._id,
      goalUuid: this._goalUuid,
      title: this._title,
      // ... 其他字段
    };
  }
  
  public toPersistenceDTO(): KeyResultPersistenceDTO {
    return {
      id: this._id,
      goal_uuid: this._goalUuid,  // snake_case
      title: this._title,
      // ... 其他字段
      created_at: this._createdAt.getTime(),
    };
  }
  
  // ===== From 静态方法 =====
  public static fromServerDTO(dto: KeyResultServerDTO): KeyResult {
    return new KeyResult({
      id: dto.id,
      goalUuid: dto.goalUuid,
      // ...
    });
  }
  
  public static fromPersistenceDTO(dto: KeyResultPersistenceDTO): KeyResult {
    return new KeyResult({
      id: dto.id,
      goalUuid: dto.goal_uuid,
      // ...
    });
  }
}
```

#### Domain-Client 层

```typescript
export class KeyResultClient extends Entity {
  // ===== To 方法 =====
  public toServerDTO(): KeyResultServerDTO {
    // 同 Server 层
  }
  
  public toClientDTO(): KeyResultClientDTO {
    return {
      id: this._id,
      goalUuid: this._goalUuid,
      title: this._title,
      // ... 包含 UI 辅助字段
      progressPercentage: this.getProgressPercentage(),
      isOverdue: this.isOverdue(),
    };
  }
  
  // ===== From 静态方法 =====
  public static fromServerDTO(dto: KeyResultServerDTO): KeyResultClient {
    return new KeyResultClient({
      // ...
    });
  }
  
  public static fromClientDTO(dto: KeyResultClientDTO): KeyResultClient {
    return new KeyResultClient({
      // ...
    });
  }
}
```

---

### 7. 补充的类型定义章节

每个模块规划文档的第 9 章需要补充以下小节：

#### 9.1 枚举 ✅ (已有)
#### 9.2 Server DTO ✅ (已有)
#### 9.3 Client DTO ✅ (已有，需重命名)
#### 9.4 **Persistence DTO** ❌ (需新增)

```typescript
// ===== Goal Persistence DTO =====
export interface GoalPersistenceDTO {
  uuid: string;
  account_uuid: string;
  title: string;
  description: string | null;
  
  start_date: number | null;
  end_date: number | null;
  reminder_days: string;  // JSON.stringify(number[])
  
  importance: string;
  urgency: string;
  tags: string;           // JSON.stringify(string[])
  custom_fields: string;  // JSON.stringify(Record<string, any>)
  
  folder_uuid: string | null;
  
  status: string;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
  archived_at: number | null;
  deleted_at: number | null;
}

// ===== KeyResult Persistence DTO =====
export interface KeyResultPersistenceDTO {
  id: string;
  goal_uuid: string;
  title: string;
  description: string | null;
  
  target_value: number;
  current_value: number;
  unit: string;
  value_type: string;
  
  start_date: number | null;
  target_date: number | null;
  
  is_completed: boolean;
  completed_at: number | null;
  
  created_at: number;
  updated_at: number;
}
```

#### 9.5 API Request/Response DTO ✅ (已有)
#### 9.6 创建参数类型 ✅ (已有)

---

## 🔄 修正模式总结

### DTO 转换流程

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│              (Vue Components, Store)                 │
└────────────────┬────────────────────────────────────┘
                 │ ClientDTO
                 ↓
┌────────────────────────────────────────────────────┐
│           Domain-Client (Browser)                   │
│         fromClientDTO / toClientDTO                 │
│         fromServerDTO / toServerDTO                 │
└────────────────┬───────────────────────────────────┘
                 │ ServerDTO
                 ↓
┌────────────────────────────────────────────────────┐
│              Application Layer                      │
│         (Controllers, Services - API)               │
└────────────────┬───────────────────────────────────┘
                 │ ServerDTO
                 ↓
┌────────────────────────────────────────────────────┐
│           Domain-Server (Backend)                   │
│         fromServerDTO / toServerDTO                 │
│    fromPersistenceDTO / toPersistenceDTO           │
└────────────────┬───────────────────────────────────┘
                 │ PersistenceDTO
                 ↓
┌────────────────────────────────────────────────────┐
│          Infrastructure Layer                       │
│       (TypeORM Entities, Database)                  │
└─────────────────────────────────────────────────────┘
```

### 各层职责

1. **ClientDTO**: 前端展示，包含 UI 辅助字段（格式化日期、计算属性）
2. **ServerDTO**: 前后端传输，标准化数据格式（ISO 8601 日期字符串）
3. **PersistenceDTO**: 数据库持久化，数据库字段映射（snake_case，序列化）

---

## 📝 实施计划

### 需要修改的文件

1. ✅ `docs/modules/goal/GOAL_MODULE_PLAN.md`
2. ✅ `docs/modules/task/TASK_MODULE_PLAN.md`
3. ✅ `docs/modules/reminder/REMINDER_MODULE_PLAN.md`
4. ✅ `docs/modules/account/ACCOUNT_MODULE_PLAN.md`
5. ✅ `docs/modules/authentication/AUTHENTICATION_MODULE_PLAN.md`
6. ✅ `docs/modules/notification/NOTIFICATION_MODULE_PLAN.md`
7. ✅ `docs/modules/setting/SETTING_MODULE_PLAN.md`
8. ✅ `docs/MODULE_REFACTORING_SUMMARY.md`

### 关于旧文件删除的建议

**推荐做法: 直接删除旧模块文件夹**

```bash
# 删除旧模块实现
Remove-Item -Recurse -Force packages/domain-server/src/goal
Remove-Item -Recurse -Force packages/domain-server/src/task
Remove-Item -Recurse -Force packages/domain-server/src/reminder
# ... 其他模块

Remove-Item -Recurse -Force packages/domain-client/src/goal
Remove-Item -Recurse -Force packages/domain-client/src/task
# ... 其他模块

Remove-Item -Recurse -Force apps/api/src/modules/goal
Remove-Item -Recurse -Force apps/api/src/modules/task
# ... 其他模块

Remove-Item -Recurse -Force apps/web/src/modules/goal
Remove-Item -Recurse -Force apps/web/src/modules/task
# ... 其他模块
```

**为什么要删除**:
1. ✅ 这是早期项目，不需要向后兼容
2. ✅ 避免新旧代码混淆
3. ✅ 强制按照新规划从零实现
4. ✅ 保持代码库整洁

**保留**:
- ✅ Repository 模块（作为参考）
- ✅ Schedule 模块（已完成的架构）
- ✅ 配置文件和工具函数

**删除时机**: 在开始实施 Phase 1 之前统一删除

---

## ✅ 修正完成检查清单

### 所有模块共同检查项

- [ ] Client DTO 使用 `XxxClientDTO` 命名
- [ ] 聚合根包含 `toServerDTO`、`toPersistenceDTO` 方法
- [ ] 聚合根包含 `fromServerDTO`、`fromPersistenceDTO` 静态方法
- [ ] 实体包含 `toServerDTO`、`toPersistenceDTO` 方法
- [ ] 实体包含 `fromServerDTO`、`fromPersistenceDTO` 静态方法
- [ ] Domain-Client 聚合根/实体包含 `toClientDTO` 方法
- [ ] Domain-Client 聚合根/实体包含 `fromClientDTO` 静态方法
- [ ] 补充 PersistenceDTO 类型定义
- [ ] 逻辑删除使用 `softDelete()` 方法
- [ ] 包含 `deletedAt` 字段
- [ ] 包含 `restore()` 恢复方法

### Reminder 模块特殊检查项

- [ ] 移除 `Archived` 状态
- [ ] `ReminderTemplateStatus` 只包含: Draft, Active, Paused, Deleted
- [ ] `ReminderInstanceStatus` 只包含: Pending, Triggered, Completed, Dismissed, Snoozed
- [ ] 移除 `archive()` 方法
- [ ] 移除 `archivedAt` 字段

---

**修正版本**: v1.1  
**修正日期**: 2025-10-13  
**修正人**: GitHub Copilot

