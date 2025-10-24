# Feature Spec: 多渠道通知聚合

> **功能编号**: NOTIFICATION-001  
> **RICE 评分**: 288 (Reach: 8, Impact: 6, Confidence: 8, Effort: 1.33)  
> **优先级**: P0  
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

在 DailyUse 的 8 个模块中，每个模块都会产生通知（Goal 进度更新、Task 提醒、Reminder 触发、Schedule 执行等），但现状存在以下问题：

- ❌ 通知分散在各个模块，用户需要多处查看
- ❌ 缺乏统一的通知中心，重要通知容易被遗漏
- ❌ 无法按优先级、类型过滤通知
- ❌ 通知只能在应用内查看，无法触达离线用户
- ❌ 通知历史无法追溯，已读/未读状态混乱

### 目标用户

- **主要用户**: 所有 DailyUse 用户
- **次要用户**: 需要实时响应的高频用户
- **典型画像**: "我有很多通知，但不知道哪些重要，经常错过关键提醒"

### 价值主张

**一句话价值**: 聚合所有模块的通知，提供统一的通知中心，支持多渠道（应用内、桌面、邮件、Webhook）推送

**核心收益**:

- ✅ 统一通知中心，一处查看所有通知
- ✅ 多渠道推送（应用内、桌面通知、邮件、Webhook）
- ✅ 按优先级、类型、状态过滤
- ✅ 批量操作（标记已读、删除）
- ✅ 通知历史追溯

---

## 2. 用户价值与场景

### 核心场景 1: 查看统一通知中心

**场景描述**:  
用户打开通知中心，查看所有模块的通知。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 在通知中心查看所有模块的通知
So that 我可以一处了解所有重要信息，不会遗漏
```

**操作流程**:

1. 用户点击顶部导航栏的"通知"图标（显示未读数量 Badge）
2. 系统打开通知中心面板：

   ```
   🔔 通知中心 (15 条未读)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   筛选：[全部] [未读] [已读]
   类型：[全部] [目标] [任务] [提醒] [日程]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   今天
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔴 [目标] Q4 收入目标进度预警
      进度仅 30%，距离截止日期还有 10 天
      5 分钟前

   🟡 [任务] "撰写项目报告"截止日期临近
      该任务将在 2 小时后到期
      1 小时前

   🟢 [提醒] 每日复盘提醒
      今天还未完成目标复盘
      2 小时前

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   昨天
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔵 [日程] 定时任务执行成功
      "每日数据备份"已成功执行
      昨天 22:00

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [全部标记已读]  [清空已读]
   ```

3. 用户点击某条通知查看详情
4. 系统跳转到相关模块（如点击目标通知 → 跳转到目标详情页）
5. 通知自动标记为已读

**预期结果**:

- 通知按时间倒序展示（今天 > 昨天 > 更早）
- 未读通知高亮显示
- 支持按类型、状态过滤
- 点击通知跳转到来源模块

---

### 核心场景 2: 接收多渠道通知

**场景描述**:  
系统通过多个渠道推送通知，确保用户及时收到。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 通过多个渠道接收通知（应用内、桌面、邮件）
So that 即使不在应用内，也能及时了解重要信息
```

**操作流程**:

#### 应用内通知

1. 用户在 DailyUse 应用中
2. Goal 模块产生一条通知："Q4 收入目标进度预警"
3. 系统在应用内显示 Toast 提示（右上角）：
   ```
   🔴 目标进度预警
   Q4 收入目标进度仅 30%，距离截止日期还有 10 天
   [查看详情]  [稍后查看]
   ```
4. 同时通知中心的未读 Badge 数量 +1

#### 桌面通知（Electron）

1. 用户最小化了 DailyUse 应用
2. 系统通过 Electron Notification API 发送桌面通知：
   ```
   [DailyUse 图标]
   任务截止日期临近
   "撰写项目报告"将在 2 小时后到期
   ```
3. 用户点击桌面通知
4. 应用自动激活并跳转到任务详情页

#### 邮件通知

1. 用户关闭了 DailyUse 应用
2. 系统检测到高优先级通知："关键目标进度严重滞后"
3. 系统发送邮件到用户注册邮箱：

   ```
   主题：[DailyUse] 关键目标进度预警

   您好，郑十：

   您的目标"Q4 收入增长"进度严重滞后：
   - 当前进度：30%
   - 预期进度：70%
   - 剩余时间：10 天

   建议立即调整计划或重新评估目标。

   [查看详情] → https://dailyuse.app/goals/xxx

   ---
   DailyUse 团队
   ```

#### Webhook 通知（高级用户）

1. 用户配置了 Webhook URL（如 Slack、Discord、企业微信）
2. 系统通过 HTTP POST 推送通知：
   ```json
   POST https://hooks.slack.com/services/xxx
   {
     "text": "🔴 [DailyUse] 目标进度预警",
     "blocks": [
       {
         "type": "section",
         "text": {
           "type": "mrkdwn",
           "text": "*Q4 收入目标进度预警*\n进度仅 30%，距离截止日期还有 10 天"
         }
       },
       {
         "type": "actions",
         "elements": [
           {
             "type": "button",
             "text": { "type": "plain_text", "text": "查看详情" },
             "url": "https://dailyuse.app/goals/xxx"
           }
         ]
       }
     ]
   }
   ```

**预期结果**:

- 每个通知可配置推送渠道
- 高优先级通知默认多渠道推送
- 低优先级通知仅应用内显示
- 避免重复推送（同一通知不重复发送邮件）

---

### 核心场景 3: 按优先级过滤通知

**场景描述**:  
用户只想查看高优先级的通知，过滤噪音。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 按优先级过滤通知
So that 我可以优先处理重要通知，忽略次要信息
```

**操作流程**:

1. 用户打开通知中心
2. 点击"优先级"筛选器
3. 选择"仅高优先级"
4. 系统只显示高优先级通知：

   ```
   🔔 通知中心 (3 条未读 - 仅高优先级)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔴 [目标] Q4 收入目标进度预警
      进度仅 30%，距离截止日期还有 10 天
      5 分钟前

   🔴 [任务] 关键任务即将过期
      "产品发布准备"将在 1 小时后到期
      10 分钟前

   🔴 [提醒] 重要会议提醒
      "董事会会议"将在 30 分钟后开始
      15 分钟前
   ```

**预期结果**:

- 支持按优先级筛选（高/中/低）
- 高优先级通知醒目标记（红色）
- 中优先级黄色，低优先级灰色

---

### 核心场景 4: 批量操作通知

**场景描述**:  
用户有大量通知，需要批量标记已读或删除。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 批量操作通知（全部标记已读、删除）
So that 我可以快速清理通知，保持整洁
```

**操作流程**:

1. 用户打开通知中心，有 50 条未读通知
2. 点击"全部标记已读"按钮
3. 系统确认："确定将所有 50 条通知标记为已读？"
4. 用户确认
5. 系统批量更新通知状态为"已读"
6. 未读 Badge 清零

**批量删除流程**:

1. 用户切换到"已读"标签
2. 点击"清空已读"按钮
3. 系统确认："确定删除所有已读通知？此操作不可恢复。"
4. 用户确认
5. 系统批量删除已读通知

**预期结果**:

- 支持一键全部标记已读
- 支持清空已读通知
- 支持多选后批量操作
- 删除操作需二次确认

---

### 核心场景 5: 通知配置与偏好设置

**场景描述**:  
用户配置通知偏好，控制哪些通知通过哪些渠道推送。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 配置通知偏好
So that 我可以控制接收哪些通知，避免打扰
```

**操作流程**:

1. 用户打开"设置" → "通知偏好"
2. 系统展示通知配置界面：

   ```
   ⚙️ 通知偏好设置
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   通知渠道
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ☑️ 应用内通知（Toast + 通知中心）
   ☑️ 桌面通知（系统原生通知）
   ☐ 邮件通知（仅高优先级）
   ☐ Webhook 通知
      URL: _____________________
      [测试 Webhook]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   通知类型偏好
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   目标模块：
   ☑️ 进度预警（高优先级）
   ☑️ 目标到期提醒（中优先级）
   ☐ 进度更新（低优先级）

   任务模块：
   ☑️ 截止日期临近（高优先级）
   ☑️ 任务分配通知（中优先级）
   ☐ 任务状态变更（低优先级）

   提醒模块：
   ☑️ 重要提醒（高优先级）
   ☑️ 普通提醒（中优先级）
   ☐ 每日提醒（低优先级）

   日程模块：
   ☑️ 执行失败（高优先级）
   ☑️ 执行成功（低优先级，仅应用内）

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   免打扰模式
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ☑️ 启用免打扰时段
      时间：22:00 - 08:00
      行为：仅应用内显示，不发送桌面/邮件

   [保存设置]
   ```

3. 用户勾选"邮件通知（仅高优先级）"
4. 保存设置
5. 后续高优先级通知将通过邮件推送

**预期结果**:

- 支持按模块、优先级配置通知开关
- 支持配置推送渠道
- 支持免打扰时段
- 配置实时生效

---

### 核心场景 6: 通知历史追溯

**场景描述**:  
用户查看历史通知，回顾过往事件。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 查看历史通知
So that 我可以回溯过往的重要事件
```

**操作流程**:

1. 用户打开通知中心
2. 向下滚动到底部
3. 点击"查看更多历史通知"
4. 系统展示更早的通知（分页加载）
5. 用户可按日期范围筛选：
   ```
   筛选历史通知：
   📅 开始日期：2025-10-01
   📅 结束日期：2025-10-21
   [查询]
   ```
6. 系统展示该日期范围内的所有通知

**预期结果**:

- 支持无限滚动加载历史通知
- 支持按日期范围筛选
- 历史通知永久保存（可配置保留策略，如保留 90 天）

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 新增实体：Notification

**位置**: `packages/contracts/src/modules/notification/entities/NotificationServer.ts`

```typescript
/**
 * 通知
 */
export interface NotificationServerDTO {
  readonly uuid: string;
  readonly userUuid: string;
  readonly title: string; // 通知标题
  readonly content: string; // 通知内容
  readonly type: NotificationType; // 通知类型
  readonly priority: NotificationPriority; // 优先级
  readonly sourceModule: SourceModule; // 来源模块
  readonly sourceEntityUuid?: string; // 来源实体 UUID（如 goalUuid）
  readonly sourceEntityType?: string; // 来源实体类型（如 'Goal'）
  readonly actionUrl?: string; // 点击跳转 URL
  readonly channels: NotificationChannel[]; // 推送渠道
  readonly status: NotificationStatus; // 状态
  readonly readAt?: number; // 已读时间
  readonly deliveryStatus: DeliveryStatus[]; // 各渠道的推送状态
  readonly metadata?: Record<string, any>; // 扩展元数据
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * 通知类型
 */
export enum NotificationType {
  GOAL_PROGRESS_WARNING = 'goal_progress_warning', // 目标进度预警
  GOAL_DEADLINE_APPROACHING = 'goal_deadline_approaching', // 目标截止日期临近
  TASK_DEADLINE_APPROACHING = 'task_deadline_approaching', // 任务截止日期临近
  TASK_ASSIGNED = 'task_assigned', // 任务分配
  REMINDER_TRIGGERED = 'reminder_triggered', // 提醒触发
  SCHEDULE_EXECUTED = 'schedule_executed', // 日程执行
  SCHEDULE_FAILED = 'schedule_failed', // 日程执行失败
  SYSTEM_NOTIFICATION = 'system_notification', // 系统通知
}

/**
 * 通知优先级
 */
export enum NotificationPriority {
  HIGH = 'high', // 高优先级（红色）
  MEDIUM = 'medium', // 中优先级（黄色）
  LOW = 'low', // 低优先级（灰色）
}

/**
 * 来源模块
 */
export enum SourceModule {
  GOAL = 'goal',
  TASK = 'task',
  REMINDER = 'reminder',
  SCHEDULE = 'schedule',
  REPOSITORY = 'repository',
  EDITOR = 'editor',
  NOTIFICATION = 'notification',
  SETTING = 'setting',
  SYSTEM = 'system',
}

/**
 * 通知渠道
 */
export enum NotificationChannel {
  IN_APP = 'in_app', // 应用内
  DESKTOP = 'desktop', // 桌面通知
  EMAIL = 'email', // 邮件
  WEBHOOK = 'webhook', // Webhook
}

/**
 * 通知状态
 */
export enum NotificationStatus {
  UNREAD = 'unread', // 未读
  READ = 'read', // 已读
  ARCHIVED = 'archived', // 已归档
}

/**
 * 推送状态
 */
export interface DeliveryStatus {
  readonly channel: NotificationChannel;
  readonly status: 'pending' | 'sent' | 'failed';
  readonly sentAt?: number;
  readonly error?: string;
}
```

#### 新增实体：NotificationPreference

**位置**: `packages/contracts/src/modules/notification/entities/NotificationPreferenceServer.ts`

```typescript
/**
 * 通知偏好配置
 */
export interface NotificationPreferenceServerDTO {
  readonly uuid: string;
  readonly userUuid: string;
  readonly enabledChannels: NotificationChannel[]; // 启用的渠道
  readonly webhookUrl?: string; // Webhook URL
  readonly typePreferences: TypePreference[]; // 各类型通知的偏好
  readonly doNotDisturbEnabled: boolean; // 免打扰模式
  readonly doNotDisturbStart?: string; // 免打扰开始时间（HH:mm）
  readonly doNotDisturbEnd?: string; // 免打扰结束时间（HH:mm）
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * 通知类型偏好
 */
export interface TypePreference {
  readonly type: NotificationType;
  readonly enabled: boolean; // 是否启用
  readonly channels: NotificationChannel[]; // 该类型的推送渠道
  readonly priority: NotificationPriority; // 该类型的优先级
}
```

---

### 交互设计

#### 1. 通知中心 UI 结构

```
┌────────────────────────────────────────┐
│ 🔔 通知中心 (15 条未读)       [设置]  │
├────────────────────────────────────────┤
│ 筛选：[全部] [未读] [已读]             │
│ 类型：[全部] [目标] [任务] ...        │
│ 优先级：[全部] [高] [中] [低]          │
├────────────────────────────────────────┤
│ ━━ 今天 ━━━━━━━━━━━━━━━━━━━━━━━━     │
│ 🔴 [目标] Q4 收入目标进度预警          │
│    进度仅 30%，距离截止日期还有 10 天  │
│    5 分钟前                    [查看]  │
├────────────────────────────────────────┤
│ 🟡 [任务] "撰写项目报告"截止日期临近   │
│    该任务将在 2 小时后到期             │
│    1 小时前                    [查看]  │
├────────────────────────────────────────┤
│ ━━ 昨天 ━━━━━━━━━━━━━━━━━━━━━━━━     │
│ 🔵 [日程] 定时任务执行成功             │
│    "每日数据备份"已成功执行            │
│    昨天 22:00                  [查看]  │
├────────────────────────────────────────┤
│ [全部标记已读]  [清空已读]            │
└────────────────────────────────────────┘
```

#### 2. 通知优先级视觉设计

| 优先级 | 颜色 | 图标 | 行为               |
| ------ | ---- | ---- | ------------------ |
| HIGH   | 红色 | 🔴   | 多渠道推送 + Toast |
| MEDIUM | 黄色 | 🟡   | 应用内 + 桌面通知  |
| LOW    | 灰色 | 🔵   | 仅应用内           |

---

## 4. MVP/MMP/Full 路径

### MVP: 基础通知中心（1-1.5 周）

**范围**:

- ✅ 统一通知中心 UI
- ✅ 应用内通知（Toast + 通知中心）
- ✅ 桌面通知（Electron Notification API）
- ✅ 未读/已读状态管理
- ✅ 按类型、状态过滤
- ✅ 批量标记已读
- ✅ 点击通知跳转到来源模块

**技术要点**:

- Contracts: 定义 `NotificationServerDTO`
- Domain: Notification 聚合根
- Application: `NotificationService` 应用服务
- Infrastructure: 事件监听器（监听各模块事件并创建通知）
- API: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:uuid/read`
- UI: 通知中心组件 + Toast 组件

**验收标准**:

```gherkin
Given Goal 模块产生进度预警
When 系统创建通知
Then 用户应在应用内看到 Toast
And 通知中心应显示该通知
And 未读 Badge 应 +1
And 用户点击通知应跳转到目标详情页
```

---

### MMP: 多渠道推送（+1-2 周）

**在 MVP 基础上新增**:

- ✅ 邮件通知（高优先级）
- ✅ Webhook 通知（用户自定义）
- ✅ 通知偏好配置
- ✅ 免打扰模式
- ✅ 推送状态追踪（sent/failed）
- ✅ 通知去重（避免重复推送）

**技术要点**:

- 邮件模板引擎（Handlebars）
- SMTP 服务集成（Nodemailer）
- Webhook 异步队列（Bull）
- 推送失败重试机制

**验收标准**:

```gherkin
Given 用户启用了邮件通知
When 产生高优先级通知
Then 系统应发送邮件到用户邮箱
And 邮件内容应包含通知详情和跳转链接
And 推送状态应记录为 'sent'
```

---

### Full Release: 智能通知与分析（+2-3 周）

**在 MMP 基础上新增**:

- ✅ 智能通知聚合（相似通知合并）
- ✅ 通知摘要（每日/每周摘要邮件）
- ✅ 通知效果分析（打开率、响应率）
- ✅ 自定义通知规则（高级用户）
- ✅ 移动端推送（FCM/APNS）
- ✅ 通知模板自定义

**技术要点**:

- 通知聚合算法（相似度计算）
- 摘要生成算法
- 分析指标计算
- 移动推送服务集成

**验收标准**:

```gherkin
Given 用户有 5 条相似的任务截止提醒
When 系统生成通知
Then 应聚合为 1 条通知："5 个任务即将到期"
And 展开后显示所有 5 个任务
```

---

## 5. 验收标准（Gherkin）

### Feature: 多渠道通知聚合

#### Scenario 1: 查看通知中心

```gherkin
Feature: 多渠道通知聚合
  作为 DailyUse 用户，我希望在通知中心查看所有通知

  Background:
    Given 用户"郑十"已登录
    And 系统有以下通知：
      | uuid    | type                    | priority | status | createdAt          |
      | notif-1 | goal_progress_warning   | high     | unread | 2025-10-21 14:00   |
      | notif-2 | task_deadline_approaching | medium | unread | 2025-10-21 13:00   |
      | notif-3 | schedule_executed       | low      | read   | 2025-10-20 22:00   |

  Scenario: 打开通知中心查看未读通知
    When 用户点击顶部导航栏的"通知"图标
    Then 通知中心应打开
    And 应显示未读数量：2
    And 应按时间倒序显示通知
    And 第1条应为 notif-1（目标进度预警）
    And 第2条应为 notif-2（任务截止临近）
    And notif-3 应在"已读"标签下

  Scenario: 筛选高优先级通知
    When 用户打开通知中心
    And 选择优先级筛选："高"
    Then 应只显示 notif-1
    And 其他通知应隐藏

  Scenario: 点击通知跳转到来源模块
    When 用户点击 notif-1
    Then 应跳转到目标详情页（/goals/xxx）
    And notif-1 的状态应变为"已读"
    And readAt 应记录当前时间
    And 未读 Badge 应 -1
```

---

#### Scenario 2: 多渠道推送

```gherkin
  Background:
    Given 用户启用了以下通知渠道：
      | channel  | enabled |
      | in_app   | true    |
      | desktop  | true    |
      | email    | true    |
    And 用户配置邮件通知仅高优先级

  Scenario: 高优先级通知多渠道推送
    When Goal 模块产生高优先级通知："目标进度严重滞后"
    Then 系统应创建通知记录
    And channels 应包含：['in_app', 'desktop', 'email']
    And 应在应用内显示 Toast
    And 应发送桌面通知
    And 应发送邮件到用户邮箱
    And deliveryStatus 应记录：
      | channel  | status |
      | in_app   | sent   |
      | desktop  | sent   |
      | email    | sent   |

  Scenario: 低优先级通知仅应用内
    When Schedule 模块产生低优先级通知："定时任务执行成功"
    Then 系统应创建通知记录
    And channels 应只包含：['in_app']
    And 应在应用内显示（通知中心）
    And 不应发送桌面通知
    And 不应发送邮件

  Scenario: 免打扰时段行为
    Given 用户启用免打扰模式：22:00 - 08:00
    And 当前时间为 23:00
    When 产生中优先级通知
    Then 应在通知中心添加记录
    And 不应显示 Toast
    And 不应发送桌面通知
    And 不应发送邮件
```

---

#### Scenario 3: 批量操作

```gherkin
  Background:
    Given 用户有 50 条未读通知

  Scenario: 全部标记已读
    When 用户点击"全部标记已读"
    And 确认操作
    Then 所有 50 条通知的状态应变为"已读"
    And 未读 Badge 应清零
    And readAt 应记录当前时间

  Scenario: 清空已读通知
    Given 用户有 30 条已读通知
    When 用户切换到"已读"标签
    And 点击"清空已读"
    And 确认操作
    Then 30 条已读通知应被删除
    And 数据库中应不再存在这些记录
```

---

#### Scenario 4: 通知偏好配置

```gherkin
  Scenario: 配置通知偏好
    When 用户打开"设置" → "通知偏好"
    And 启用"邮件通知"
    And 禁用"任务状态变更"通知
    And 配置免打扰时段：22:00 - 08:00
    And 保存设置
    Then 系统应创建/更新 NotificationPreference 记录
    And enabledChannels 应包含 'email'
    And typePreferences 中 'task_status_changed' 应 enabled: false
    And doNotDisturbEnabled 应为 true
    And 配置应立即生效

  Scenario: Webhook 配置与测试
    When 用户配置 Webhook URL："https://hooks.slack.com/xxx"
    And 点击"测试 Webhook"
    Then 系统应发送测试通知到该 URL
    And 如果成功，显示："✅ Webhook 测试成功"
    And 如果失败，显示："❌ Webhook 测试失败：无法连接"
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 通知创建
{
  event: 'notification_created',
  properties: {
    type: NotificationType,
    priority: NotificationPriority,
    sourceModule: SourceModule,
    channels: NotificationChannel[]
  }
}

// 通知推送
{
  event: 'notification_delivered',
  properties: {
    notificationUuid: string,
    channel: NotificationChannel,
    status: 'sent' | 'failed',
    error?: string
  }
}

// 通知查看
{
  event: 'notification_viewed',
  properties: {
    notificationUuid: string,
    viewedFrom: 'notification_center' | 'toast' | 'email' | 'desktop',
    timeToView: number  // 从创建到查看的时长（秒）
  }
}

// 通知点击
{
  event: 'notification_clicked',
  properties: {
    notificationUuid: string,
    actionUrl: string,
    clickedFrom: 'notification_center' | 'toast' | 'email' | 'desktop'
  }
}

// 批量操作
{
  event: 'notifications_batch_operation',
  properties: {
    operation: 'mark_all_read' | 'delete_all_read',
    count: number
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 通知打开率 | >60% | 已读通知数 / 总通知数 |
| 通知点击率 | >30% | 点击查看详情的通知数 / 已读通知数 |
| 邮件推送成功率 | >95% | 成功发送邮件数 / 尝试发送数 |
| Webhook 推送成功率 | >90% | 成功推送数 / 尝试推送数 |

**定性指标**:

- 用户反馈"不再遗漏重要通知"
- 高优先级通知的响应时间缩短
- 通知配置满意度

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model Notification {
  uuid                String   @id @default(uuid())
  userUuid            String   @map("user_uuid")
  title               String   @map("title")
  content             String   @map("content") @db.Text
  type                String   @map("type")
  priority            String   @map("priority")
  sourceModule        String   @map("source_module")
  sourceEntityUuid    String?  @map("source_entity_uuid")
  sourceEntityType    String?  @map("source_entity_type")
  actionUrl           String?  @map("action_url")
  channels            Json     @map("channels")  // NotificationChannel[]
  status              String   @default("unread") @map("status")
  readAt              BigInt?  @map("read_at")
  deliveryStatus      Json     @map("delivery_status")  // DeliveryStatus[]
  metadata            Json?    @map("metadata")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  user                Account  @relation(fields: [userUuid], references: [uuid])

  @@index([userUuid, status])
  @@index([userUuid, createdAt(sort: Desc)])
  @@index([type, priority])
  @@map("notifications")
}

model NotificationPreference {
  uuid                  String   @id @default(uuid())
  userUuid              String   @unique @map("user_uuid")
  enabledChannels       Json     @map("enabled_channels")  // NotificationChannel[]
  webhookUrl            String?  @map("webhook_url")
  typePreferences       Json     @map("type_preferences")  // TypePreference[]
  doNotDisturbEnabled   Boolean  @default(false) @map("do_not_disturb_enabled")
  doNotDisturbStart     String?  @map("do_not_disturb_start")  // HH:mm
  doNotDisturbEnd       String?  @map("do_not_disturb_end")    // HH:mm
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  user                  Account  @relation(fields: [userUuid], references: [uuid])

  @@map("notification_preferences")
}
```

### Application Service

```typescript
// packages/domain-server/src/modules/notification/application/NotificationService.ts

export class NotificationService {
  async createAndDeliver(
    userUuid: string,
    title: string,
    content: string,
    type: NotificationType,
    priority: NotificationPriority,
    sourceModule: SourceModule,
    sourceEntityUuid?: string,
    actionUrl?: string,
  ): Promise<Notification> {
    // 1. 加载用户通知偏好
    const preference = await this.preferenceRepository.findByUser(userUuid);

    // 2. 检查是否在免打扰时段
    if (this.isDoNotDisturbTime(preference)) {
      // 免打扰时段，只创建应用内通知
      channels = [NotificationChannel.IN_APP];
    } else {
      // 根据优先级和偏好确定推送渠道
      channels = this.determineChannels(priority, preference);
    }

    // 3. 创建通知记录
    const notification = new Notification({
      userUuid,
      title,
      content,
      type,
      priority,
      sourceModule,
      sourceEntityUuid,
      actionUrl,
      channels,
      status: NotificationStatus.UNREAD,
    });

    await this.notificationRepository.save(notification);

    // 4. 异步推送到各渠道
    await this.deliveryQueue.add({
      notificationUuid: notification.uuid,
      channels,
    });

    // 5. 发布事件
    await this.eventBus.publish(
      new NotificationCreatedEvent({
        notificationUuid: notification.uuid,
        userUuid,
        type,
        priority,
      }),
    );

    return notification;
  }

  private determineChannels(
    priority: NotificationPriority,
    preference: NotificationPreference,
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [NotificationChannel.IN_APP];

    if (preference.enabledChannels.includes(NotificationChannel.DESKTOP)) {
      if (priority === NotificationPriority.HIGH || priority === NotificationPriority.MEDIUM) {
        channels.push(NotificationChannel.DESKTOP);
      }
    }

    if (preference.enabledChannels.includes(NotificationChannel.EMAIL)) {
      if (priority === NotificationPriority.HIGH) {
        channels.push(NotificationChannel.EMAIL);
      }
    }

    if (preference.webhookUrl && preference.enabledChannels.includes(NotificationChannel.WEBHOOK)) {
      channels.push(NotificationChannel.WEBHOOK);
    }

    return channels;
  }
}
```

### 事件监听器（示例：Goal 模块）

```typescript
// packages/domain-server/src/modules/goal/infrastructure/event-handlers/GoalProgressWarningHandler.ts

export class GoalProgressWarningHandler implements EventHandler<GoalProgressWarningEvent> {
  constructor(private readonly notificationService: NotificationService) {}

  async handle(event: GoalProgressWarningEvent): Promise<void> {
    const { goalUuid, goalName, currentProgress, expectedProgress, daysLeft } = event;

    await this.notificationService.createAndDeliver(
      event.userUuid,
      `目标进度预警`,
      `您的目标"${goalName}"进度仅 ${currentProgress}%，预期应达到 ${expectedProgress}%，距离截止日期还有 ${daysLeft} 天`,
      NotificationType.GOAL_PROGRESS_WARNING,
      NotificationPriority.HIGH,
      SourceModule.GOAL,
      goalUuid,
      `/goals/${goalUuid}`,
    );
  }
}
```

### API 端点

```typescript
// 获取通知列表
GET /api/v1/notifications?status=unread&type=goal&limit=20&offset=0
Response: {
  notifications: NotificationClientDTO[],
  total: number,
  unreadCount: number
}

// 标记单个通知已读
PATCH /api/v1/notifications/:uuid/read
Response: NotificationClientDTO

// 批量标记已读
POST /api/v1/notifications/batch-read
Body: { notificationUuids?: string[] }  // 不传则全部标记已读
Response: { updatedCount: number }

// 删除已读通知
DELETE /api/v1/notifications/read
Response: { deletedCount: number }

// 获取通知偏好
GET /api/v1/notifications/preferences
Response: NotificationPreferenceClientDTO

// 更新通知偏好
PATCH /api/v1/notifications/preferences
Body: Partial<NotificationPreferenceClientDTO>
Response: NotificationPreferenceClientDTO

// 测试 Webhook
POST /api/v1/notifications/test-webhook
Body: { webhookUrl: string }
Response: { success: boolean, error?: string }
```

---

## 8. 风险与缓解

| 风险                         | 可能性 | 影响 | 缓解措施                           |
| ---------------------------- | ------ | ---- | ---------------------------------- |
| 邮件被标记为垃圾邮件         | 中     | 高   | 使用可信 SMTP 服务 + SPF/DKIM 配置 |
| Webhook 推送失败             | 中     | 中   | 重试机制 + 失败通知用户            |
| 通知过载（用户收到太多通知） | 高     | 高   | 智能聚合 + 偏好配置 + 免打扰模式   |
| 桌面通知权限被拒绝           | 中     | 中   | 引导用户开启权限 + 降级到应用内    |

---

## 9. 后续增强方向

### Phase 2 功能

- 🔄 智能通知聚合（相似通知合并）
- 📊 通知效果分析（打开率、响应率）
- 📅 通知摘要（每日/每周摘要邮件）
- 🎨 通知模板自定义

### Phase 3 功能

- 🤖 AI 通知优先级推荐（学习用户习惯）
- 📱 移动端推送（FCM/APNS）
- 🔗 与第三方服务集成（Slack、Microsoft Teams、钉钉）
- 🎯 自定义通知规则（高级用户）

---

## 10. 参考资料

- [Notification Contracts](../../../../packages/contracts/src/modules/notification/)
- [Electron Notification API](https://www.electronjs.org/docs/latest/api/notification)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Webhook Best Practices](https://www.svix.com/resources/guides/webhook-best-practices/)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:

- 创建: 2025-10-21
- 创建者: PO Agent
- 版本: 1.0
- 下次更新: Sprint Planning 前
