# 模块规划文档批量修正指南

> 由于每个模块文档都很长（1000+行），这里提供统一的修正模式，可以基于 Goal 模块模板快速修正其他模块。

---

## 📋 修正清单

### ✅ 已完成
- [x] Goal 模块 - `docs/modules/goal/GOAL_MODULE_PLAN.md`
- [x] 创建修正说明文档 - `docs/modules/MODULE_PLAN_CORRECTIONS.md`

### 🔄 待完成（已删除旧文件，等待创建）
- [ ] Task 模块 - `docs/modules/task/TASK_MODULE_PLAN.md`
- [ ] Reminder 模块 - `docs/modules/reminder/REMINDER_MODULE_PLAN.md` **（特殊：去掉归档状态）**
- [ ] Account 模块 - `docs/modules/account/ACCOUNT_MODULE_PLAN.md`
- [ ] Authentication 模块 - `docs/modules/authentication/AUTHENTICATION_MODULE_PLAN.md`
- [ ] Notification 模块 - `docs/modules/notification/NOTIFICATION_MODULE_PLAN.md`
- [ ] Setting 模块 - `docs/modules/setting/SETTING_MODULE_PLAN.md`

---

## 🔧 统一修正规则

### 1. 文档头部元数据

```markdown
> **创建时间**: 2025-01-20  
> **更新时间**: 2025-01-13  
> **文档版本**: v1.1  
> **参考模式**: Repository 模块的 DDD 架构  
> **修正内容**: DTO 命名规范、完整 DTO 转换方法、PersistenceDTO 定义、逻辑删除
```

### 2. Client DTO 命名修正

| 模块 | 旧命名 | 新命名 |
|------|--------|--------|
| Task | `TaskTemplateDTO` | `TaskTemplateClientDTO` |
| Task | `TaskInstanceDTO` | `TaskInstanceClientDTO` |
| Task | `TaskFolderDTO` | `TaskFolderClientDTO` |
| Reminder | `ReminderTemplateDTO` | `ReminderTemplateClientDTO` |
| Reminder | `ReminderInstanceDTO` | `ReminderInstanceClientDTO` |
| Account | `AccountDTO` | `AccountClientDTO` |
| Account | `AccountPreferencesDTO` | `AccountPreferencesClientDTO` |
| Authentication | `SessionDTO` | `SessionClientDTO` |
| Authentication | `AuthTokenDTO` | `AuthTokenClientDTO` |
| Notification | `NotificationDTO` | `NotificationClientDTO` |
| Notification | `NotificationPreferencesDTO` | `NotificationPreferencesClientDTO` |
| Setting | `UserPreferenceDTO` | `UserPreferenceClientDTO` |
| Setting | `ThemeSettingDTO` | `ThemeSettingClientDTO` |

### 3. 聚合根 DTO 转换方法（Domain-Server）

在每个聚合根类的方法列表中添加：

```typescript
  // ===== DTO 转换方法（Domain-Server 层）=====
  public toServerDTO(includeChildren = false): XxxServerDTO;
  public toPersistenceDTO(): XxxPersistenceDTO;
  public static fromServerDTO(dto: XxxServerDTO): Xxx;
  public static fromPersistenceDTO(dto: XxxPersistenceDTO): Xxx;
}
```

### 4. 聚合根 DTO 转换方法（Domain-Client）

在每个聚合根设计章节后添加：

```typescript
**Domain-Client 层额外方法**:

\`\`\`typescript
export class XxxClient extends AggregateRoot {
  // ... 同 Domain-Server 层的业务方法
  
  // ===== DTO 转换方法（Domain-Client 层）=====
  public toServerDTO(includeChildren = false): XxxServerDTO;
  public toClientDTO(includeChildren = false): XxxClientDTO;
  public static fromServerDTO(dto: XxxServerDTO): XxxClient;
  public static fromClientDTO(dto: XxxClientDTO): XxxClient;
}
\`\`\`
```

### 5. 实体 DTO 转换方法

同样适用于所有实体（Entity），需要添加完整的4个转换方法。

### 6. 类型定义章节调整

在第9章中，调整为：

```markdown
## 9. TypeScript 类型定义

### 9.1 枚举
### 9.2 Server DTO
### 9.3 Client DTO
### 9.4 Persistence DTO  ⬅️ 新增
### 9.5 API Request/Response DTO
### 9.6 创建参数类型
```

### 7. PersistenceDTO 模板

```typescript
// ===== Xxx Persistence DTO =====
export interface XxxPersistenceDTO {
  uuid: string;
  account_uuid: string;  // snake_case
  title: string;
  description: string | null;
  
  // 日期字段使用 timestamp
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  
  // JSON 字段需要序列化
  tags: string;  // JSON.stringify(string[])
  custom_fields: string;  // JSON.stringify(Record<string, any>)
  
  // 其他字段...
}
```

### 8. 逻辑删除

确保所有聚合根包含：

```typescript
// 生命周期
private _status: XxxStatus;
private _deletedAt: Date | null;

// 方法
public softDelete(): void;
public restore(): void;
```

仓储接口包含：

```typescript
export interface IXxxRepository {
  // ...
  softDelete(uuid: string): Promise<void>;
  restore(uuid: string): Promise<void>;
  hardDelete(uuid: string): Promise<void>;  // 物理删除（谨慎使用）
  
  findByAccountUuid(accountUuid: string, includeDeleted?: boolean): Promise<Xxx[]>;
}
```

---

## ⚠️ Reminder 模块特殊修正

### 移除归档状态

1. **枚举定义**：

```typescript
// ❌ 旧的
export enum ReminderTemplateStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Archived = 'archived',  // 删除这个
  Deleted = 'deleted',
}

// ✅ 新的
export enum ReminderTemplateStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Deleted = 'deleted',
}
```

2. **移除方法**：
   - 删除 `archive()` 方法
   - 删除 `archivedAt` 字段
   - 删除 `async archiveTemplate()` 应用服务方法

3. **更新生命周期图**：

```markdown
// ❌ 旧的
draft → active ⇄ paused → archived → deleted

// ✅ 新的
draft → active ⇄ paused → deleted
```

---

## 📝 快速修正流程

### 对于每个模块：

1. **复制 Goal 模块文档作为模板**
2. **全局替换模块名称**：
   - `Goal` → `Task` / `Reminder` / etc.
   - `goal` → `task` / `reminder` / etc.
   - `KeyResult` → 对应的实体名称
3. **调整业务逻辑部分**（保留原文档的业务需求）
4. **确保所有 DTO 命名规范**
5. **确保所有转换方法完整**
6. **添加 PersistenceDTO 章节**
7. **对 Reminder 模块特殊处理**

---

## 🎯 修正验证清单

对每个修正后的文档检查：

- [ ] 文档版本更新为 v1.1
- [ ] 更新时间为 2025-01-13
- [ ] 添加"修正内容"说明
- [ ] 所有 Client DTO 使用 `XxxClientDTO` 命名
- [ ] 聚合根包含 4 个 DTO 转换方法（Domain-Server）
- [ ] 聚合根包含 4 个 DTO 转换方法（Domain-Client）
- [ ] 实体包含 4 个 DTO 转换方法（两层）
- [ ] 添加 9.4 Persistence DTO 章节
- [ ] PersistenceDTO 使用 snake_case
- [ ] 逻辑删除相关代码完整
- [ ] Reminder 模块无归档状态

---

## 💡 建议

由于文档很长，建议：

1. **使用 VSCode 的多光标编辑**功能批量替换
2. **使用正则表达式**快速查找需要修正的模式
3. **先修正核心模块**（Task、Reminder、Account）
4. **最后统一检查**所有模块的一致性

---

## 📚 参考文件

- ✅ **已修正**: `docs/modules/goal/GOAL_MODULE_PLAN.md` - 作为模板参考
- 📖 **Repository 模块**: `packages/domain-server/src/repository/` - DDD 实现参考
- 📖 **修正说明**: `docs/modules/MODULE_PLAN_CORRECTIONS.md` - 详细修正原因

---

**最后更新**: 2025-01-13  
**状态**: 等待批量修正完成
