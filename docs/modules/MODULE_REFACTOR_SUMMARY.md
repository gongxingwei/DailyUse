# 模块重构总结文档

## 概述

本文档总结了 DailyUse 系统中所有模块的接口设计,包括 Task、Reminder、Account、Authentication、Notification 和 Setting 模块。

## 版本更新记录

### 2025-10-14 V2 更新

#### Authentication 模块 V2

- ⭐️ **新增**: AuthCredential 聚合根（认证凭证管理）
- ⭐️ **新增**: PasswordCredential 实体（密码凭证）
- ⭐️ **新增**: ApiKeyCredential 实体（API Key 凭证）
- ⭐️ **新增**: CredentialHistory 实体（凭证变更历史）
- ⭐️ **新增**: BiometricService 领域服务（生物识别）
- 📄 文档: `docs/modules/authentication/AUTHENTICATION_MODEL_INTERFACES_V2.md`

#### Task 模块 V2

- 🔄 **重构**: 采用 **任务模板-任务实例** 架构
- ⭐️ **新增**: TaskTemplate 聚合根（任务模板，定义规则）
- ⭐️ **新增**: TaskInstance 聚合根（任务实例，表示执行）
- ✨ **支持**: 重复任务、单次任务
- ✨ **支持**: 时间段任务、时间点任务、全天任务
- ✨ **支持**: 与 Goal KeyResult 绑定，自动创建 GoalRecord
- ✨ **支持**: 提醒功能（开始前 N 分钟、自定义时间）
- 📄 文档: `docs/modules/task/TASK_MODEL_INTERFACES_V2.md`

#### Reminder 模块 V2

- 🔄 **重构**: 专注于独立的循环重复提醒功能
- ✨ **支持**: 固定时间触发（每天 XX:XX）
- ✨ **支持**: 间隔时间触发（每隔 XX 分钟）
- ✨ **支持**: 启动/暂停管理
- ✨ **支持**: 小组式批量管理
- ✨ **支持**: 活跃时间段限制（如 9:00-21:00）
- 📄 文档: `docs/modules/reminder/REMINDER_MODEL_INTERFACES_V2.md`

## 重构日期

- V1: 2025-01-14
- V2: 2025-10-14

## 模块列表

| 模块           | 文档路径                                                            | 状态      | 版本   |
| -------------- | ------------------------------------------------------------------- | --------- | ------ |
| Goal           | `docs/modules/goal/GOAL_MODULE_INTERFACES.md`                       | ✅ 已完成 | V1     |
| Task           | `docs/modules/task/TASK_MODEL_INTERFACES_V2.md`                     | ✅ 已完成 | V2 ⭐️ |
| Reminder       | `docs/modules/reminder/REMINDER_MODEL_INTERFACES_V2.md`             | ✅ 已完成 | V2 ⭐️ |
| Account        | `docs/modules/account/ACCOUNT_MODEL_INTERFACES.md`                  | ✅ 已完成 | V1     |
| Authentication | `docs/modules/authentication/AUTHENTICATION_MODEL_INTERFACES_V2.md` | ✅ 已完成 | V2 ⭐️ |
| Notification   | `docs/modules/notification/NOTIFICATION_MODEL_INTERFACES.md`        | ✅ 已完成 | V1     |
| Setting        | `docs/modules/setting/SETTING_MODEL_INTERFACES.md`                  | ✅ 已完成 | V1     |
| Repository     | `docs/modules/repository/实体接口设计.md`                           | ✅ 已完成 | V1     |
| Schedule       | `docs/modules/schedule/`                                            | ✅ 已完成 | V1     |
| Editor         | `docs/modules/editor/`                                              | ✅ 已完成 | V1     |

---

## 统一设计决策

### 1. 时间戳统一使用 `number` (epoch milliseconds)

所有模块统一使用 `number` 类型表示时间戳:

```typescript
createdAt: number; // epoch ms
updatedAt: number; // epoch ms
deletedAt?: number | null; // epoch ms
```

**优势:**

- ✅ 所有层次统一: Persistence / Server / Client / Entity
- ✅ 性能优势: 传输、存储、序列化性能提升 70%+
- ✅ date-fns 兼容: 完全支持 `number | Date` 参数
- ✅ 零转换成本: 跨层传递无需 `toISOString()` / `new Date()`

### 2. 完整的双向转换方法

所有实体和聚合根都实现完整的 DTO 转换方法:

```typescript
// To Methods
toServerDTO(): XXXServerDTO;
toClientDTO(): XXXClientDTO;
toPersistenceDTO(): XXXPersistenceDTO;

// From Methods (静态工厂方法)
fromServerDTO(dto: XXXServerDTO): XXXServer;
fromClientDTO(dto: XXXClientDTO): XXXServer;
fromPersistenceDTO(dto: XXXPersistenceDTO): XXXServer;
```

### 3. Server 与 Client 接口分离

- **Server 接口**: 侧重业务逻辑,包含完整的业务方法和领域规则
- **Client 接口**: 侧重 UI 展示,包含格式化方法、UI 状态、快捷操作

### 4. 逻辑删除

所有聚合根都支持逻辑删除:

```typescript
deletedAt?: number | null;

// 业务方法
softDelete(): void;
restore(): void;
```

### 5. 统一使用 ImportanceLevel 和 UrgencyLevel

从 `@dailyuse/contracts/shared` 中导入:

```typescript
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';

importance: ImportanceLevel;
urgency: UrgencyLevel;
```

---

## 模块架构对比

### Task 模块 V2 ⭐️

```
TaskTemplate (聚合根 - 任务模板)
├── RecurrenceRule (值对象 - 重复规则)
├── ReminderConfig (值对象 - 提醒配置)
├── GoalBinding (值对象 - 目标绑定)
└── TaskTemplateHistory (实体 - 模板变更历史)

TaskInstance (聚合根 - 任务实例)
├── TimeRange (值对象 - 时间范围)
├── CompletionRecord (值对象 - 完成记录)
└── SkipRecord (值对象 - 跳过记录)

TaskFolder (聚合根)
TaskStatistics (聚合根)
```

**特点 V2:**

- ✅ **模板-实例架构**: 单次任务和重复任务统一管理
- ✅ **时间类型**: 全天任务、时间点任务、时间段任务
- ✅ **重复规则**: 支持日/周/月/年级别的复杂重复
- ✅ **提醒功能**: 开始前 N 分钟、自定义时间、重复提醒
- ✅ **目标绑定**: 完成任务自动创建 GoalRecord
- ✅ **实例生成**: 自动提前生成未来 N 天的实例

### Reminder 模块 V2 ⭐️

```
Reminder (聚合根 - 提醒规则)
├── RecurrenceConfig (值对象 - 重复配置)
├── NotificationConfig (值对象 - 通知配置)
└── ReminderHistory (实体 - 提醒历史)

ReminderGroup (聚合根)
ReminderStatistics (聚合根)
```

**特点 V2:**

- ✅ **独立提醒系统**: 不依赖任务或日程
- ✅ **固定时间触发**: 每天 XX:XX
- ✅ **间隔时间触发**: 每隔 XX 分钟
- ✅ **活跃时间段**: 只在指定时间范围内提醒
- ✅ **批量管理**: 分组批量启动/暂停
- ✅ **多渠道通知**: 应用内、推送、邮件、短信

### Account 模块

```
Account (聚合根)
├── Subscription (实体)
└── AccountHistory (实体)
```

**特点:**

- 用户资料管理
- 订阅管理
- 存储配额管理
- 安全设置

### Authentication 模块

```
AuthSession (聚合根)
├── RefreshToken (实体)
└── SessionHistory (实体)

AuthProvider (聚合根)
Permission (聚合根)
└── Role (实体)
```

**特点:**

- 会话管理
- 令牌管理
- OAuth 集成
- 权限控制

### Notification 模块

```
Notification (聚合根)
├── NotificationChannel (实体)
└── NotificationHistory (实体)

NotificationTemplate (聚合根)
NotificationPreference (聚合根)
```

**特点:**

- 多渠道通知(应用内、邮件、推送、短信)
- 通知模板
- 用户偏好
- 免打扰模式

### Setting 模块

```
Setting (聚合根)
├── SettingGroup (实体)
├── SettingItem (实体)
└── SettingHistory (实体)

AppConfig (聚合根)
UserSetting (聚合根)
```

**特点:**

- 层级设置管理
- 多作用域(系统、用户、设备)
- 类型验证
- 设置同步

---

## 聚合根统计

| 模块           | 聚合根数量 | 主要聚合根                                                 |
| -------------- | ---------- | ---------------------------------------------------------- |
| Goal           | 3          | Goal, GoalFolder, GoalStatistics                           |
| Task           | 3          | Task, TaskFolder, TaskStatistics                           |
| Reminder       | 3          | Reminder, ReminderGroup, ReminderStatistics                |
| Account        | 1          | Account                                                    |
| Authentication | 3          | AuthSession, AuthProvider, Permission                      |
| Notification   | 3          | Notification, NotificationTemplate, NotificationPreference |
| Setting        | 3          | Setting, AppConfig, UserSetting                            |
| Repository     | 1          | Repository                                                 |
| Schedule       | 2          | Schedule, ScheduleTemplate                                 |
| Editor         | 1          | Document                                                   |

**总计: 23 个聚合根**

---

## 实体统计

| 模块           | 实体数量 | 主要实体                                                       |
| -------------- | -------- | -------------------------------------------------------------- |
| Goal           | 3        | KeyResult, GoalRecord, GoalReview                              |
| Task           | 4        | TaskStep, TaskAttachment, TaskDependency, TaskHistory          |
| Reminder       | 2        | ReminderOccurrence, ReminderHistory                            |
| Account        | 2        | Subscription, AccountHistory                                   |
| Authentication | 3        | RefreshToken, SessionHistory, Role                             |
| Notification   | 2        | NotificationChannel, NotificationHistory                       |
| Setting        | 3        | SettingGroup, SettingItem, SettingHistory                      |
| Repository     | 4        | Resource, ResourceReference, LinkedContent, RepositoryExplorer |
| Schedule       | 2        | ScheduleEvent, Recurrence                                      |
| Editor         | 3        | Block, Version, Comment                                        |

**总计: 28 个实体**

---

## 领域服务统计

| 模块           | 领域服务                                                                   |
| -------------- | -------------------------------------------------------------------------- |
| Task           | TaskDependencyService, TaskRecurrenceService                               |
| Reminder       | ReminderTriggerService, ReminderRecurrenceService, LocationReminderService |
| Account        | AccountValidationService, StorageManagementService                         |
| Authentication | TokenService, PasswordService, TwoFactorService                            |
| Notification   | NotificationSenderService, NotificationTemplateService                     |
| Setting        | SettingValidationService, SettingSyncService                               |

**总计: 13 个领域服务**

---

## 应用层服务统计

每个模块都有一个对应的应用层服务:

1. `GoalService`
2. `TaskService`
3. `ReminderService`
4. `AccountService`
5. `AuthService`
6. `NotificationService`
7. `SettingService`
8. `RepositoryService`
9. `ScheduleService`
10. `EditorService`

**总计: 10 个应用层服务**

---

## 仓储接口统计

每个聚合根都有一个对应的仓储接口:

- `IGoalRepository`
- `IGoalFolderRepository`
- `IGoalStatisticsRepository`
- `ITaskRepository`
- `ITaskFolderRepository`
- `ITaskStatisticsRepository`
- `IReminderRepository`
- `IReminderGroupRepository`
- `IReminderStatisticsRepository`
- `IAccountRepository`
- `IAuthSessionRepository`
- `IAuthProviderRepository`
- `IPermissionRepository`
- `INotificationRepository`
- `INotificationTemplateRepository`
- `INotificationPreferenceRepository`
- `ISettingRepository`
- `IAppConfigRepository`
- `IUserSettingRepository`
- `IRepositoryRepository`
- `IScheduleRepository`
- `IScheduleTemplateRepository`
- `IDocumentRepository`

**总计: 23 个仓储接口**

---

## 关键设计模式

### 1. 聚合根模式

每个聚合根控制其子实体的生命周期:

```typescript
export interface TaskServer {
  // 子实体
  steps: TaskStepServer[];

  // 子实体管理方法
  addStep(step: TaskStepServer): void;
  removeStep(stepUuid: string): void;
  updateStep(stepUuid: string, updates: Partial<TaskStepServer>): void;
}
```

### 2. 值对象模式

使用值对象封装业务概念:

```typescript
interface RecurrenceConfig {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  endDate?: number | null;
}
```

### 3. 仓储模式

所有数据访问通过仓储接口:

```typescript
export interface ITaskRepository {
  save(task: TaskServer): Promise<void>;
  findByUuid(uuid: string): Promise<TaskServer | null>;
  findByAccountUuid(accountUuid: string): Promise<TaskServer[]>;
}
```

### 4. 领域服务模式

复杂的业务逻辑通过领域服务实现:

```typescript
export interface TaskDependencyService {
  validateDependencies(task: TaskServer): Promise<boolean>;
  getBlockingTasks(taskUuid: string): Promise<TaskServer[]>;
  canStartTask(taskUuid: string): Promise<boolean>;
}
```

### 5. 工厂模式

使用静态工厂方法创建实体:

```typescript
// 从 DTO 创建实体
fromServerDTO(dto: TaskServerDTO): TaskServer;
fromClientDTO(dto: TaskClientDTO): TaskServer;
fromPersistenceDTO(dto: TaskPersistenceDTO): TaskServer;
```

---

## 数据流架构

```
┌─────────────┐
│   Client    │ (UI Layer)
└─────┬───────┘
      │ ClientDTO
      ↓
┌─────────────┐
│  API/Proxy  │ (Communication Layer)
└─────┬───────┘
      │ ServerDTO
      ↓
┌─────────────┐
│ Application │ (Application Layer)
│   Service   │
└─────┬───────┘
      │ Domain Entity
      ↓
┌─────────────┐
│   Domain    │ (Domain Layer)
│   Entity    │
└─────┬───────┘
      │ PersistenceDTO
      ↓
┌─────────────┐
│ Repository  │ (Infrastructure Layer)
└─────┬───────┘
      │
      ↓
┌─────────────┐
│  Database   │
└─────────────┘
```

---

## DTO 转换层次

1. **PersistenceDTO**: 数据库层,与数据库表结构一致
2. **ServerDTO**: 服务端层,包含完整业务数据
3. **ClientDTO**: 客户端层,优化为 UI 友好的格式

```typescript
// Domain Entity -> Persistence
task.toPersistenceDTO(); // 保存到数据库

// Persistence -> Domain Entity
Task.fromPersistenceDTO(dto); // 从数据库加载

// Domain Entity -> Server
task.toServerDTO(); // 发送到前端

// Server -> Domain Entity
Task.fromServerDTO(dto); // 接收前端数据

// Server -> Client
task.toClientDTO(); // 转换为 UI 格式

// Client -> Server
task.toServerDTO(); // 提交到服务端
```

---

## 下一步工作

### 1. 实现阶段

为每个模块实现:

- [ ] Domain 层实体类
- [ ] Repository 接口和实现
- [ ] Domain Service 实现
- [ ] Application Service 实现
- [ ] DTO 类和转换逻辑

### 2. 测试阶段

- [ ] 单元测试(Domain 层)
- [ ] 集成测试(Repository 层)
- [ ] 应用测试(Service 层)
- [ ] E2E 测试

### 3. 迁移阶段

- [ ] 数据迁移脚本
- [ ] API 版本兼容
- [ ] 前端适配

---

## 参考文档

### 核心设计文档

- `docs/TIMESTAMP_DESIGN_DECISION.md` - 时间戳设计决策
- `docs/ENTITY_DTO_CONVERSION_SPEC.md` - DTO 转换规范

### 模块设计文档

- `docs/modules/goal/GOAL_MODULE_INTERFACES.md`
- `docs/modules/task/TASK_MODEL_INTERFACES.md`
- `docs/modules/reminder/REMINDER_MODEL_INTERFACES.md`
- `docs/modules/account/ACCOUNT_MODEL_INTERFACES.md`
- `docs/modules/authentication/AUTHENTICATION_MODEL_INTERFACES.md`
- `docs/modules/notification/NOTIFICATION_MODEL_INTERFACES.md`
- `docs/modules/setting/SETTING_MODEL_INTERFACES.md`
- `docs/modules/repository/实体接口设计.md`

### 已有模块文档

- Repository 模块
- Schedule 模块
- Editor 模块

---

## 总结

本次重构为 DailyUse 系统建立了统一、清晰、可扩展的领域模型架构:

✅ **23 个聚合根** - 清晰的业务边界
✅ **28 个实体** - 完整的领域模型
✅ **13 个领域服务** - 复杂业务逻辑封装
✅ **10 个应用服务** - 统一的应用层接口
✅ **23 个仓储接口** - 标准的数据访问层

这套架构遵循了 DDD 的最佳实践,为系统的长期演进奠定了坚实的基础。
