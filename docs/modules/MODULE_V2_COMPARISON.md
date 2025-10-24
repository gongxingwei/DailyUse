# V2 模块重构对比文档

## 更新日期: 2025-10-14

本文档对比了 Task、Reminder、Authentication 模块的 V1 和 V2 版本的主要差异。

---

## 1. Authentication 模块对比

### V1 架构

```
AuthSession (聚合根)
├── RefreshToken (实体)
└── SessionHistory (实体)

AuthProvider (聚合根)
Permission (聚合根)
└── Role (实体)
```

### V2 架构 ⭐️ 新增

```
AuthCredential (聚合根) ⭐️ 新增
├── PasswordCredential (实体)
├── ApiKeyCredential (实体)
└── CredentialHistory (实体)

AuthSession (聚合根)
├── RefreshToken (实体)
└── SessionHistory (实体)

AuthProvider (聚合根)
Permission (聚合根)
└── Role (实体)
```

### 主要变化

#### ⭐️ 新增功能

| 功能             | V1  | V2  | 说明                         |
| ---------------- | --- | --- | ---------------------------- |
| 认证凭证管理     | ❌  | ✅  | 新增 AuthCredential 聚合根   |
| 密码凭证         | ❌  | ✅  | PasswordCredential 实体      |
| API Key 管理     | ❌  | ✅  | ApiKeyCredential 实体        |
| 两步验证         | ❌  | ✅  | TOTP、SMS、Email             |
| 生物识别         | ❌  | ✅  | 指纹、Face ID                |
| 密码策略         | ❌  | ✅  | 强度检查、过期、重复使用防护 |
| API Key 速率限制 | ❌  | ✅  | 请求频率控制                 |
| 备用恢复码       | ❌  | ✅  | 两步验证备用码               |

#### 🔧 优化改进

1. **凭证与会话分离**
   - V1: 密码验证逻辑混在 AuthSession 中
   - V2: AuthCredential 专门管理认证凭证，AuthSession 只管理会话

2. **安全增强**
   - V1: 基础的密码验证
   - V2: 密码强度检查、过期管理、失败登录锁定、两步验证

3. **API 访问**
   - V1: 仅支持用户密码登录
   - V2: 支持 API Key 程序化访问，包含作用域和速率限制

---

## 2. Task 模块对比

### V1 架构

```
Task (聚合根)
├── TaskStep (实体)
├── TaskAttachment (实体)
├── TaskDependency (实体)
└── TaskHistory (实体)

TaskFolder (聚合根)
TaskStatistics (聚合根)
```

### V2 架构 ⭐️ 重构

```
TaskTemplate (聚合根) ⭐️ 新架构
├── RecurrenceRule (值对象)
├── ReminderConfig (值对象)
├── GoalBinding (值对象)
└── TaskTemplateHistory (实体)

TaskInstance (聚合根) ⭐️ 新架构
├── TimeRange (值对象)
├── CompletionRecord (值对象)
└── SkipRecord (值对象)

TaskFolder (聚合根)
TaskStatistics (聚合根)
```

### 主要变化

#### 🔄 架构重构

| 概念     | V1              | V2                          | 说明             |
| -------- | --------------- | --------------------------- | ---------------- |
| 核心模型 | Task (单一模型) | TaskTemplate + TaskInstance | 模板-实例分离    |
| 单次任务 | Task            | 1 Template → 1 Instance     | 统一架构         |
| 重复任务 | Task + 重复规则 | 1 Template → N Instances    | 每次执行独立实例 |

#### ⭐️ 新增功能

| 功能     | V1       | V2                 | 说明                        |
| -------- | -------- | ------------------ | --------------------------- |
| 时间类型 | 仅时间段 | 全天/时间点/时间段 | 更灵活的时间配置            |
| 提醒功能 | ❌       | ✅                 | 开始前 N 分钟、自定义时间   |
| 目标绑定 | ❌       | ✅                 | 完成任务自动创建 GoalRecord |
| 实例管理 | ❌       | ✅                 | 每次执行独立状态            |
| 跳过记录 | ❌       | ✅                 | SkipRecord 值对象           |
| 完成记录 | ❌       | ✅                 | CompletionRecord 值对象     |

#### 🔧 优化改进

1. **重复任务处理**
   - V1: Task 本身包含重复逻辑，每次完成重置状态
   - V2: Template 定义规则，Instance 表示每次执行，历史记录完整

2. **时间配置**
   - V1: 仅支持时间段任务（startTime + endTime）
   - V2: 支持全天任务、时间点任务、时间段任务

3. **目标联动**
   - V1: 无自动联动
   - V2: 绑定 KeyResult，完成任务自动创建 GoalRecord

4. **实例生成**
   - V1: 运行时计算
   - V2: 提前生成未来 N 天的实例，提升性能

#### ❌ 移除功能

| 功能       | V1                | V2  | 原因                       |
| ---------- | ----------------- | --- | -------------------------- |
| 子任务步骤 | ✅ TaskStep       | ❌  | 简化架构，专注核心功能     |
| 附件管理   | ✅ TaskAttachment | ❌  | 可由统一的附件系统提供     |
| 任务依赖   | ✅ TaskDependency | ❌  | 实际使用场景少，增加复杂度 |

---

## 3. Reminder 模块对比

### V1 架构

```
Reminder (聚合根)
├── ReminderOccurrence (实体)
└── ReminderHistory (实体)

ReminderGroup (聚合根)
ReminderStatistics (聚合根)
```

### V2 架构 ⭐️ 重构

```
Reminder (聚合根) ⭐️ 重构
├── RecurrenceConfig (值对象)
├── NotificationConfig (值对象)
└── ReminderHistory (实体)

ReminderGroup (聚合根)
ReminderStatistics (聚合根)
```

### 主要变化

#### 🔄 定位调整

| 方面     | V1              | V2                | 说明             |
| -------- | --------------- | ----------------- | ---------------- |
| 模块定位 | 通用提醒系统    | 独立循环提醒系统  | 更专注的功能定位 |
| 触发方式 | 时间/位置/事件  | 时间（固定/间隔） | 简化为时间触发   |
| 依赖关系 | 可绑定任务/日程 | 完全独立          | 降低耦合         |

#### ⭐️ 新增功能

| 功能         | V1       | V2      | 说明                     |
| ------------ | -------- | ------- | ------------------------ |
| 间隔时间触发 | ❌       | ✅      | 每隔 XX 分钟             |
| 活跃时间段   | ❌       | ✅      | 只在指定时间范围内提醒   |
| 批量管理     | 部分支持 | ✅      | 分组批量启动/暂停        |
| 通知配置     | 基础     | ✅ 增强 | 多渠道、声音、震动、操作 |

#### 🔧 优化改进

1. **触发机制**
   - V1: 支持时间、位置、事件三种触发方式
   - V2: 专注时间触发（固定时间 + 间隔时间），更简单可靠

2. **重复配置**
   - V1: ReminderOccurrence 实体记录每次触发
   - V2: RecurrenceConfig 值对象定义重复规则

3. **通知系统**
   - V1: 基础通知配置
   - V2: NotificationConfig 值对象，支持多渠道、自定义操作

4. **活跃控制**
   - V1: 无时间段限制
   - V2: 支持活跃时间段（如 9:00-21:00）

#### ❌ 移除功能

| 功能               | V1  | V2  | 原因                    |
| ------------------ | --- | --- | ----------------------- |
| 位置触发           | ✅  | ❌  | 实现复杂，使用场景少    |
| 事件触发           | ✅  | ❌  | 与任务/日程功能重叠     |
| 延后机制           | ✅  | ❌  | 可由通知系统统一处理    |
| ReminderOccurrence | ✅  | ❌  | 简化为 RecurrenceConfig |

---

## 设计原则对比

### V1 设计原则

- ✅ 功能全面：尽可能提供更多功能
- ✅ 灵活配置：支持多种触发方式和配置
- ⚠️ 复杂度高：实体和关系较多
- ⚠️ 耦合度高：模块间依赖较多

### V2 设计原则

- ✅ 职责单一：每个模块专注核心功能
- ✅ 架构清晰：模板-实例分离，凭证-会话分离
- ✅ 低耦合：减少模块间依赖
- ✅ 易扩展：值对象设计，便于未来扩展
- ✅ 性能优化：实例预生成，减少运行时计算

---

## 迁移建议

### Authentication 模块

1. 创建 AuthCredential 聚合根
2. 将现有密码数据迁移到 PasswordCredential
3. 为需要 API 访问的用户生成 ApiKeyCredential
4. 提供两步验证迁移向导

### Task 模块

1. 将现有 Task 转换为 TaskTemplate
2. 为每个 TaskTemplate 生成对应的 TaskInstance
3. 迁移完成记录到 CompletionRecord
4. 子任务/附件/依赖数据保留但标记为 deprecated

### Reminder 模块

1. 识别位置/事件触发的 Reminder，转换为固定时间触发
2. 将 ReminderOccurrence 数据迁移到 ReminderHistory
3. 创建默认的 NotificationConfig
4. 为批量管理创建 ReminderGroup

---

## 总结

### V2 的核心改进

1. **Authentication**: 增加完整的凭证管理系统
2. **Task**: 采用模板-实例架构，支持更灵活的时间配置
3. **Reminder**: 简化为专注的循环提醒系统

### V2 的设计理念

- 📐 **清晰的架构**: 模板-实例、凭证-会话分离
- 🎯 **专注的功能**: 每个模块职责明确
- 🔌 **低耦合设计**: 减少模块间依赖
- 🚀 **性能优化**: 实例预生成、缓存友好
- 🔒 **安全增强**: 多因素认证、API Key、权限控制

### 下一步工作

1. ✅ V2 接口设计文档已完成
2. ⏭️ 实现 Domain 层实体类
3. ⏭️ 实现 Repository 接口和实现
4. ⏭️ 实现 Domain Service
5. ⏭️ 实现 Application Service
6. ⏭️ 数据迁移脚本
7. ⏭️ 测试和验证
