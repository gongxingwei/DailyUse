# Feature Spec: 提醒历史追踪

> **功能编号**: REMINDER-003  
> **RICE 评分**: 252 (Reach: 6, Impact: 6, Confidence: 7, Effort: 1)  
> **优先级**: P1  
> **预估时间**: 0.8-1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

提醒系统是时间管理的核心功能，但现有提醒工具普遍存在以下问题：

- ❌ 提醒触发后无历史记录，无法追溯
- ❌ 不知道自己忽略了多少提醒，缺少反馈闭环
- ❌ 无法分析提醒的有效性（响应率、完成率）
- ❌ 重复提醒缺少优化依据（不知道哪些提醒总是被忽略）
- ❌ 提醒失败（发送失败、延迟）无记录，无法排查问题

### 目标用户

- **主要用户**: 所有使用提醒功能的 DailyUse 用户
- **次要用户**: 需要分析提醒效果的项目经理
- **典型画像**: "我设置了很多提醒，但不知道哪些有效，哪些被忽略了"

### 价值主张

**一句话价值**: 记录所有提醒事件的完整生命周期，支持历史追溯、效果分析和智能优化

**核心收益**:

- ✅ 完整记录提醒触发历史（触发时间、渠道、响应）
- ✅ 追踪用户响应行为（查看、完成、延期、忽略）
- ✅ 分析提醒有效性（响应率、完成率、平均响应时间）
- ✅ 识别失效提醒（总是被忽略的提醒）
- ✅ 提醒失败诊断

---

## 2. 用户价值与场景

### 核心场景 1: 自动记录提醒触发历史

**场景描述**:  
提醒触发时（到达预设时间），系统自动创建历史记录。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 系统自动记录每次提醒触发
So that 我可以追溯所有提醒历史
```

**操作流程**:

1. 用户创建一个提醒："每天 09:00 晨会提醒"
2. 到达 2025-10-21 09:00，提醒触发
3. 系统自动创建提醒历史记录：
   ```typescript
   {
     uuid: 'history-001',
     reminderUuid: 'reminder-123',
     triggeredAt: 1729479600000,  // 2025-10-21 09:00
     channels: ['desktop', 'in_app'],
     deliveryStatus: [
       { channel: 'desktop', status: 'sent', sentAt: 1729479600100 },
       { channel: 'in_app', status: 'sent', sentAt: 1729479600150 }
     ],
     userResponse: 'pending',  // 待响应
     createdAt: 1729479600000
   }
   ```
4. 用户在桌面通知上点击"查看"
5. 系统更新历史记录：
   ```typescript
   {
     ...existing fields,
     userResponse: 'viewed',
     respondedAt: 1729479660000,  // 09:01（1分钟后）
     responseTime: 60000,  // 60秒
     responseAction: 'viewed',
     metadata: {
       viewedFrom: 'desktop'
     }
   }
   ```
6. 用户完成关联任务
7. 系统再次更新：
   ```typescript
   {
     ...existing fields,
     userResponse: 'completed',
     completedAt: 1729483200000,  // 10:00（1小时后完成任务）
     completionTime: 3600000  // 1小时
   }
   ```

**预期结果**:

- 每次提醒触发都创建历史记录
- 记录推送状态（成功/失败）
- 追踪用户响应（查看、完成、忽略）
- 计算响应时间和完成时间

---

### 核心场景 2: 查看提醒历史列表

**场景描述**:  
用户查看某个提醒的所有触发历史。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 查看某个提醒的所有历史记录
So that 我可以了解这个提醒的触发和响应情况
```

**操作流程**:

1. 用户打开提醒详情页
2. 点击"历史记录"标签
3. 系统展示历史列表：

   ```
   📋 提醒历史（最近 30 天）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ✅ 2025-10-21 09:00
   ├─ 推送渠道：桌面通知、应用内
   ├─ 用户响应：已查看（1分钟后）
   ├─ 任务状态：已完成（1小时后）
   └─ [查看详情]

   ❌ 2025-10-20 09:00
   ├─ 推送渠道：桌面通知、应用内
   ├─ 用户响应：已忽略
   ├─ 任务状态：未完成
   └─ [查看详情]

   ✅ 2025-10-19 09:00
   ├─ 推送渠道：桌面通知、应用内
   ├─ 用户响应：已查看（3分钟后）
   ├─ 任务状态：已完成（2小时后）
   └─ [查看详情]

   ⚠️ 2025-10-18 09:00
   ├─ 推送渠道：桌面通知（失败）、应用内
   ├─ 失败原因：桌面通知权限被拒绝
   ├─ 用户响应：已延期到明天
   └─ [查看详情]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   统计（最近 30 天）：
   - 总触发次数：30 次
   - 响应率：73.3%（22/30）
   - 完成率：66.7%（20/30）
   - 平均响应时间：2.5 分钟
   - 平均完成时间：1.2 小时

   [导出历史]  [查看分析]
   ```

**预期结果**:

- 历史按时间倒序展示
- 显示推送状态、用户响应、任务完成情况
- 汇总统计数据

---

### 核心场景 3: 提醒效果分析

**场景描述**:  
系统分析提醒历史，提供效果洞察。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 查看提醒的效果分析
So that 我可以了解哪些提醒有效，哪些需要优化
```

**操作流程**:

1. 用户打开提醒详情页
2. 点击"效果分析"标签
3. 系统展示分析报告：

   ```
   📊 提醒效果分析（最近 30 天）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   总体指标
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📅 触发次数：30 次
   👁️ 响应率：73.3%（22/30）
      ├─ 已查看：22 次
      ├─ 已忽略：8 次
      └─ 延期：0 次
   ✅ 完成率：66.7%（20/30）
      ├─ 按时完成：15 次
      ├─ 延期完成：5 次
      └─ 未完成：10 次
   ⏱️  平均响应时间：2.5 分钟
   ⏳ 平均完成时间：1.2 小时

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   渠道效果对比
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   桌面通知：
   ├─ 推送成功率：90%（27/30）
   ├─ 响应率：70%（19/27）
   └─ 平均响应时间：1.8 分钟

   应用内通知：
   ├─ 推送成功率：100%（30/30）
   ├─ 响应率：50%（15/30）
   └─ 平均响应时间：5.2 分钟

   📌 洞察：桌面通知响应率更高，建议优先使用

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   时间规律
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   响应率按时段：
   08:00-10:00: 85%（工作日早晨，响应率高）
   12:00-14:00: 60%（午休时段，响应率低）
   18:00-22:00: 75%（晚间时段，响应率中等）

   📌 建议：重要提醒安排在 08:00-10:00

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   失败原因分析
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   桌面通知失败：3 次
   ├─ 权限被拒绝：2 次
   └─ 系统服务异常：1 次

   📌 建议：引导用户开启桌面通知权限
   ```

**预期结果**:

- 多维度分析提醒效果
- 对比不同渠道的效果
- 识别时间规律
- 提供优化建议

---

### 核心场景 4: 识别失效提醒

**场景描述**:  
系统识别长期被忽略的提醒，建议优化或删除。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 系统识别失效的提醒
So that 我可以清理无用提醒，减少干扰
```

**操作流程**:

1. 系统每周分析所有提醒的历史数据
2. 发现提醒"每日复盘提醒"连续 7 天被忽略
3. 系统创建提醒优化建议：
   ```typescript
   {
     reminderUuid: 'reminder-456',
     issueType: 'low_response_rate',
     severity: 'medium',
     statistics: {
       recentTriggers: 7,
       responseRate: 0,  // 0%
       ignoreRate: 100%  // 100%
     },
     suggestion: '该提醒连续7天被忽略，建议：\n1. 调整提醒时间\n2. 修改提醒内容\n3. 如不需要可直接删除',
     createdAt: Date.now()
   }
   ```
4. 系统发送通知给用户：

   ```
   💡 提醒优化建议

   您的提醒"每日复盘提醒"连续 7 天被忽略

   统计数据：
   - 触发次数：7 次
   - 响应率：0%
   - 忽略率：100%

   建议：
   1. 调整提醒时间（当前：21:00）
   2. 修改提醒内容，增加吸引力
   3. 如不需要可直接删除

   [调整提醒]  [删除提醒]  [忽略建议]
   ```

5. 用户点击"调整提醒"
6. 将提醒时间从 21:00 改为 19:00
7. 系统记录优化操作

**预期结果**:

- 自动识别失效提醒（响应率 <20%）
- 提供优化建议
- 用户可一键优化或删除

---

### 核心场景 5: 提醒失败诊断

**场景描述**:  
提醒推送失败时，系统记录失败原因并提供解决方案。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 了解提醒为什么失败
So that 我可以解决问题，确保提醒正常工作
```

**操作流程**:

1. 提醒"重要会议提醒"到达触发时间
2. 系统尝试推送桌面通知
3. 推送失败（用户未授权桌面通知权限）
4. 系统创建失败记录：
   ```typescript
   {
     uuid: 'history-002',
     reminderUuid: 'reminder-789',
     triggeredAt: 1729483200000,
     channels: ['desktop', 'in_app'],
     deliveryStatus: [
       {
         channel: 'desktop',
         status: 'failed',
         error: 'NotificationPermissionDenied',
         errorMessage: '桌面通知权限被拒绝',
         attemptedAt: 1729483200100
       },
       {
         channel: 'in_app',
         status: 'sent',
         sentAt: 1729483200150
       }
     ],
     userResponse: 'pending'
   }
   ```
5. 系统发送失败通知（通过应用内）：

   ```
   ⚠️ 提醒推送失败

   提醒："重要会议提醒"
   失败渠道：桌面通知
   失败原因：权限被拒绝

   解决方案：
   1. 打开系统设置
   2. 找到 DailyUse 应用
   3. 开启"通知"权限

   [打开设置]  [仅使用应用内通知]
   ```

6. 用户点击"打开设置"
7. 系统调用操作系统 API 打开权限设置页面

**预期结果**:

- 记录所有失败原因
- 提供针对性解决方案
- 引导用户修复问题

---

### 核心场景 6: 导出提醒历史

**场景描述**:  
用户导出提醒历史数据用于分析或备份。

**用户故事**:

```gherkin
As a DailyUse 用户
I want 导出提醒历史数据
So that 我可以进行深度分析或备份
```

**操作流程**:

1. 用户打开提醒详情页
2. 点击"导出历史"
3. 系统显示导出选项：

   ```
   📥 导出提醒历史
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   时间范围：
   ⚪ 最近 7 天
   🔘 最近 30 天
   ⚪ 最近 90 天
   ⚪ 自定义范围

   导出格式：
   🔘 CSV（表格数据）
   ⚪ JSON（结构化数据）
   ⚪ PDF（可视化报告）

   包含字段：
   ☑️ 触发时间
   ☑️ 推送渠道
   ☑️ 用户响应
   ☑️ 响应时间
   ☑️ 完成状态
   ☑️ 失败原因

   [取消]  [导出]
   ```

4. 用户选择"最近 30 天" + "CSV"
5. 点击"导出"
6. 系统生成 CSV 文件：
   ```csv
   触发时间,推送渠道,用户响应,响应时间(秒),完成状态,失败原因
   2025-10-21 09:00,桌面通知+应用内,已查看,60,已完成,
   2025-10-20 09:00,桌面通知+应用内,已忽略,,,
   2025-10-19 09:00,桌面通知+应用内,已查看,180,已完成,
   2025-10-18 09:00,桌面通知(失败)+应用内,已延期,,,权限被拒绝
   ...
   ```
7. 浏览器下载文件："晨会提醒\_历史\_20251021.csv"

**预期结果**:

- 支持多种导出格式（CSV、JSON、PDF）
- 可自定义时间范围和字段
- 生成文件命名规范

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 新增实体：ReminderHistory

**位置**: `packages/contracts/src/modules/reminder/entities/ReminderHistoryServer.ts`

```typescript
/**
 * 提醒历史记录
 */
export interface ReminderHistoryServerDTO {
  readonly uuid: string;
  readonly reminderUuid: string;
  readonly userUuid: string;
  readonly triggeredAt: number; // 触发时间
  readonly channels: NotificationChannel[]; // 推送渠道
  readonly deliveryStatus: DeliveryStatus[]; // 推送状态
  readonly userResponse: UserResponse; // 用户响应
  readonly respondedAt?: number; // 响应时间
  readonly responseTime?: number; // 响应时长（毫秒）
  readonly responseAction?: ResponseAction; // 响应动作
  readonly completedAt?: number; // 完成时间
  readonly completionTime?: number; // 完成时长（毫秒）
  readonly metadata?: Record<string, any>; // 扩展元数据
  readonly createdAt: number;
}

/**
 * 用户响应状态
 */
export enum UserResponse {
  PENDING = 'pending', // 待响应
  VIEWED = 'viewed', // 已查看
  COMPLETED = 'completed', // 已完成
  IGNORED = 'ignored', // 已忽略
  SNOOZED = 'snoozed', // 已延期
}

/**
 * 响应动作
 */
export enum ResponseAction {
  VIEWED = 'viewed', // 查看
  CLICKED_ACTION = 'clicked_action', // 点击操作按钮
  SNOOZED = 'snoozed', // 延期
  DISMISSED = 'dismissed', // 关闭
}

/**
 * 推送状态（复用 Notification 模块定义）
 */
export interface DeliveryStatus {
  readonly channel: NotificationChannel;
  readonly status: 'pending' | 'sent' | 'failed';
  readonly sentAt?: number;
  readonly attemptedAt?: number;
  readonly error?: string;
  readonly errorMessage?: string;
}
```

#### 新增实体：ReminderOptimizationSuggestion

**位置**: `packages/contracts/src/modules/reminder/entities/ReminderOptimizationSuggestionServer.ts`

```typescript
/**
 * 提醒优化建议
 */
export interface ReminderOptimizationSuggestionServerDTO {
  readonly uuid: string;
  readonly reminderUuid: string;
  readonly userUuid: string;
  readonly issueType: IssueType;
  readonly severity: 'low' | 'medium' | 'high';
  readonly statistics: OptimizationStatistics;
  readonly suggestion: string;
  readonly actions: SuggestedAction[];
  readonly status: 'pending' | 'applied' | 'ignored';
  readonly appliedAt?: number;
  readonly createdAt: number;
}

/**
 * 问题类型
 */
export enum IssueType {
  LOW_RESPONSE_RATE = 'low_response_rate', // 响应率低
  LOW_COMPLETION_RATE = 'low_completion_rate', // 完成率低
  HIGH_FAILURE_RATE = 'high_failure_rate', // 失败率高
  ALWAYS_IGNORED = 'always_ignored', // 总是被忽略
}

/**
 * 优化统计数据
 */
export interface OptimizationStatistics {
  readonly recentTriggers: number; // 最近触发次数
  readonly responseRate: number; // 响应率（0-1）
  readonly completionRate: number; // 完成率（0-1）
  readonly ignoreRate: number; // 忽略率（0-1）
  readonly failureRate: number; // 失败率（0-1）
  readonly avgResponseTime: number; // 平均响应时间（秒）
}

/**
 * 建议动作
 */
export interface SuggestedAction {
  readonly type: 'adjust_time' | 'change_channel' | 'modify_content' | 'delete';
  readonly label: string;
  readonly description: string;
}
```

#### 更新 Reminder 实体

**位置**: `packages/contracts/src/modules/reminder/entities/ReminderServer.ts`

```typescript
export interface ReminderServerDTO {
  // ...existing fields...

  // 历史追踪相关
  readonly history?: ReminderHistoryServerDTO[];
  readonly lastTriggeredAt?: number; // 最后触发时间
  readonly totalTriggers?: number; // 总触发次数
  readonly responseRate?: number; // 响应率（0-1）
  readonly completionRate?: number; // 完成率（0-1）
  readonly needsOptimization?: boolean; // 是否需要优化
}
```

---

### 交互设计

#### 1. 历史记录状态流转

```
提醒触发 → 推送（pending）
    ↓
推送成功（sent）/ 推送失败（failed）
    ↓
用户响应（pending）
    ↓
├─ 已查看（viewed）
├─ 已延期（snoozed）
├─ 已忽略（ignored）
└─ 已完成（completed）
```

#### 2. 效果分析维度

| 维度     | 指标           | 计算方式                |
| -------- | -------------- | ----------------------- |
| 总体效果 | 响应率         | 已响应次数 / 总触发次数 |
|          | 完成率         | 已完成次数 / 总触发次数 |
|          | 忽略率         | 已忽略次数 / 总触发次数 |
| 渠道效果 | 推送成功率     | 成功推送 / 尝试推送     |
|          | 渠道响应率     | 该渠道响应 / 该渠道推送 |
| 时间规律 | 时段响应率     | 各时段的响应率对比      |
|          | 工作日 vs 周末 | 响应率对比              |

---

## 4. MVP/MMP/Full 路径

### MVP: 基础历史记录（0.8-1 周）

**范围**:

- ✅ 提醒触发自动创建历史记录
- ✅ 记录推送状态（成功/失败）
- ✅ 记录用户响应（查看/忽略）
- ✅ 查看历史列表
- ✅ 基础统计（触发次数、响应率）
- ✅ 失败原因记录

**技术要点**:

- Contracts: 定义 `ReminderHistoryServerDTO`
- Domain: Reminder 聚合根添加 `recordHistory()` 方法
- Application: `ReminderHistoryService` 应用服务
- Infrastructure: 事件监听器（监听提醒触发事件）
- API: `GET /api/v1/reminders/:uuid/history`
- UI: 历史列表组件

**验收标准**:

```gherkin
Given 提醒到达触发时间
When 系统推送提醒
Then 应创建历史记录
And 记录触发时间和推送状态
And 用户可在历史列表中查看
```

---

### MMP: 效果分析与优化建议（+0.5-1 周）

**在 MVP 基础上新增**:

- ✅ 多维度效果分析
- ✅ 渠道效果对比
- ✅ 时间规律识别
- ✅ 失效提醒识别
- ✅ 优化建议生成
- ✅ 一键优化操作

**技术要点**:

- 统计分析算法
- 失效检测规则引擎
- 建议生成算法

**验收标准**:

```gherkin
Given 提醒连续 7 天被忽略
When 系统执行周度分析
Then 应识别为失效提醒
And 生成优化建议
And 发送通知给用户
```

---

### Full Release: 深度洞察与导出（+1-2 周）

**在 MMP 基础上新增**:

- ✅ 历史数据导出（CSV、JSON、PDF）
- ✅ 跨提醒对比分析
- ✅ 用户行为模式识别（如习惯在何时响应提醒）
- ✅ 预测性分析（预测提醒有效性）
- ✅ 可视化图表（响应率趋势图、渠道效果对比图）

**技术要点**:

- 数据导出服务
- 行为模式识别算法
- 数据可视化

**验收标准**:

```gherkin
Given 用户有 90 天的提醒历史
When 用户查看"行为分析"
Then 应识别用户习惯："工作日早晨响应率高 85%"
And 提供建议："重要提醒建议安排在工作日 08:00-10:00"
```

---

## 5. 验收标准（Gherkin）

### Feature: 提醒历史追踪

#### Scenario 1: 自动创建历史记录

```gherkin
Feature: 提醒历史追踪
  作为 DailyUse 用户，我希望系统自动记录提醒历史

  Background:
    Given 用户"郑十"已登录
    And 用户有一个提醒"晨会提醒"
    And 提醒设置为每天 09:00 触发
    And 推送渠道为：桌面通知、应用内

  Scenario: 提醒触发创建历史
    When 当前时间到达 2025-10-21 09:00
    And 提醒触发
    Then 系统应创建历史记录：
      | 字段          | 值                        |
      | reminderUuid  | reminder-123             |
      | triggeredAt   | 2025-10-21 09:00:00      |
      | channels      | ['desktop', 'in_app']    |
      | userResponse  | pending                  |
    And deliveryStatus 应包含：
      | channel  | status  |
      | desktop  | sent    |
      | in_app   | sent    |

    When 用户点击桌面通知
    And 当前时间为 09:01
    Then 历史记录应更新：
      | 字段            | 值                  |
      | userResponse    | viewed              |
      | respondedAt     | 2025-10-21 09:01:00 |
      | responseTime    | 60000（60秒）       |
      | responseAction  | viewed              |
```

---

#### Scenario 2: 记录失败原因

```gherkin
  Background:
    Given 用户未授权桌面通知权限

  Scenario: 推送失败记录失败原因
    When 提醒触发
    And 系统尝试推送桌面通知
    Then deliveryStatus 应包含：
      | channel  | status | error                          | errorMessage           |
      | desktop  | failed | NotificationPermissionDenied   | 桌面通知权限被拒绝     |
      | in_app   | sent   |                                |                        |
    And 系统应发送失败通知（应用内）
    And 通知应包含解决方案
```

---

#### Scenario 3: 查看历史列表与统计

```gherkin
  Background:
    Given 提醒"晨会提醒"有以下历史：
      | 触发时间       | 用户响应 | 完成状态 |
      | 2025-10-21     | viewed   | completed|
      | 2025-10-20     | ignored  | -        |
      | 2025-10-19     | viewed   | completed|
      | 2025-10-18     | snoozed  | -        |
      | ...（共 30 条）|          |          |

  Scenario: 查看历史与统计
    When 用户打开提醒详情页
    And 点击"历史记录"
    Then 应显示历史列表（30 条）
    And 应按时间倒序排列
    And 应显示统计数据：
      | 指标         | 值      |
      | 总触发次数   | 30      |
      | 响应率       | 73.3%   |
      | 完成率       | 66.7%   |
      | 平均响应时间 | 2.5分钟 |
```

---

#### Scenario 4: 识别失效提醒

```gherkin
  Background:
    Given 提醒"每日复盘提醒"连续 7 天被忽略

  Scenario: 生成优化建议
    When 系统执行周度分析
    Then 应创建优化建议：
      | 字段        | 值                      |
      | issueType   | always_ignored          |
      | severity    | medium                  |
      | responseRate| 0                       |
      | ignoreRate  | 1.0（100%）             |
    And suggestion 应包含："建议调整提醒时间或删除"
    And actions 应包含：
      | type          | label      |
      | adjust_time   | 调整时间   |
      | delete        | 删除提醒   |
    And 系统应发送优化建议通知
```

---

#### Scenario 5: 效果分析

```gherkin
  Background:
    Given 提醒有 30 天历史数据
    And 桌面通知推送 27 次成功，响应 19 次
    And 应用内推送 30 次成功，响应 15 次

  Scenario: 查看渠道效果对比
    When 用户打开"效果分析"
    Then 应显示渠道对比：
      | 渠道       | 推送成功率 | 响应率 | 平均响应时间 |
      | 桌面通知   | 90%        | 70.4%  | 1.8分钟      |
      | 应用内     | 100%       | 50%    | 5.2分钟      |
    And 应提供洞察："桌面通知响应率更高，建议优先使用"
```

---

#### Scenario 6: 导出历史

```gherkin
  Scenario: 导出 CSV 格式
    When 用户点击"导出历史"
    And 选择时间范围："最近 30 天"
    And 选择格式："CSV"
    And 点击"导出"
    Then 应生成 CSV 文件
    And 文件名应为："晨会提醒_历史_20251021.csv"
    And 文件应包含字段：触发时间、推送渠道、用户响应、响应时间、完成状态
    And 应触发浏览器下载
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 历史记录创建
{
  event: 'reminder_history_created',
  properties: {
    reminderUuid: string,
    triggeredAt: number,
    channels: NotificationChannel[],
    deliverySuccess: boolean
  }
}

// 用户响应
{
  event: 'reminder_responded',
  properties: {
    historyUuid: string,
    response: UserResponse,
    responseTime: number,  // 秒
    respondedFrom: 'desktop' | 'in_app'
  }
}

// 优化建议生成
{
  event: 'reminder_optimization_suggested',
  properties: {
    reminderUuid: string,
    issueType: IssueType,
    severity: string,
    responseRate: number
  }
}

// 历史导出
{
  event: 'reminder_history_exported',
  properties: {
    reminderUuid: string,
    format: 'csv' | 'json' | 'pdf',
    recordCount: number
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 历史记录创建成功率 | >99% | 成功创建记录数 / 提醒触发数 |
| 失效提醒识别准确率 | >80% | 准确识别数 / 实际失效数 |
| 优化建议采纳率 | >40% | 采纳建议数 / 建议生成数 |
| 导出使用率 | >15% | 导出用户数 / 活跃用户数 |

**定性指标**:

- 用户反馈"更了解提醒效果"
- 失效提醒被及时清理
- 提醒响应率整体提升

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model ReminderHistory {
  uuid            String   @id @default(uuid())
  reminderUuid    String   @map("reminder_uuid")
  userUuid        String   @map("user_uuid")
  triggeredAt     BigInt   @map("triggered_at")
  channels        Json     @map("channels")  // NotificationChannel[]
  deliveryStatus  Json     @map("delivery_status")  // DeliveryStatus[]
  userResponse    String   @map("user_response")
  respondedAt     BigInt?  @map("responded_at")
  responseTime    Int?     @map("response_time")  // 毫秒
  responseAction  String?  @map("response_action")
  completedAt     BigInt?  @map("completed_at")
  completionTime  Int?     @map("completion_time")  // 毫秒
  metadata        Json?    @map("metadata")
  createdAt       DateTime @default(now()) @map("created_at")

  reminder        Reminder @relation(fields: [reminderUuid], references: [uuid])
  user            Account  @relation(fields: [userUuid], references: [uuid])

  @@index([reminderUuid, triggeredAt(sort: Desc)])
  @@index([userUuid, userResponse])
  @@map("reminder_histories")
}

model ReminderOptimizationSuggestion {
  uuid         String   @id @default(uuid())
  reminderUuid String   @map("reminder_uuid")
  userUuid     String   @map("user_uuid")
  issueType    String   @map("issue_type")
  severity     String   @map("severity")
  statistics   Json     @map("statistics")
  suggestion   String   @map("suggestion") @db.Text
  actions      Json     @map("actions")
  status       String   @default("pending") @map("status")
  appliedAt    BigInt?  @map("applied_at")
  createdAt    DateTime @default(now()) @map("created_at")

  reminder     Reminder @relation(fields: [reminderUuid], references: [uuid])
  user         Account  @relation(fields: [userUuid], references: [uuid])

  @@index([reminderUuid, status])
  @@index([userUuid, createdAt(sort: Desc)])
  @@map("reminder_optimization_suggestions")
}

// 更新 Reminder 模型
model Reminder {
  // ...existing fields...

  history               ReminderHistory[]
  optimizationSuggestions ReminderOptimizationSuggestion[]
  lastTriggeredAt       BigInt?  @map("last_triggered_at")
  totalTriggers         Int      @default(0) @map("total_triggers")
  responseRate          Float?   @map("response_rate")
  completionRate        Float?   @map("completion_rate")
  needsOptimization     Boolean  @default(false) @map("needs_optimization")
}
```

### Application Service

```typescript
// packages/domain-server/src/modules/reminder/application/ReminderHistoryService.ts

export class ReminderHistoryService {
  // 创建历史记录
  async recordTrigger(
    reminder: Reminder,
    channels: NotificationChannel[],
    deliveryStatus: DeliveryStatus[],
  ): Promise<ReminderHistory> {
    const history = new ReminderHistory({
      reminderUuid: reminder.uuid,
      userUuid: reminder.userUuid,
      triggeredAt: Date.now(),
      channels,
      deliveryStatus,
      userResponse: UserResponse.PENDING,
    });

    await this.historyRepository.save(history);

    // 更新提醒统计
    await this.updateReminderStatistics(reminder);

    return history;
  }

  // 记录用户响应
  async recordResponse(
    historyUuid: string,
    response: UserResponse,
    action: ResponseAction,
  ): Promise<void> {
    const history = await this.historyRepository.findByUuid(historyUuid);
    const now = Date.now();

    history.updateResponse({
      userResponse: response,
      respondedAt: now,
      responseTime: now - history.triggeredAt,
      responseAction: action,
    });

    await this.historyRepository.save(history);
  }

  // 分析提醒效果
  async analyzeEffectiveness(
    reminderUuid: string,
    days: number = 30,
  ): Promise<EffectivenessAnalysis> {
    const histories = await this.historyRepository.findRecent(reminderUuid, days);

    const totalTriggers = histories.length;
    const responded = histories.filter(
      (h) => h.userResponse !== UserResponse.PENDING && h.userResponse !== UserResponse.IGNORED,
    );
    const completed = histories.filter((h) => h.userResponse === UserResponse.COMPLETED);

    const responseRate = totalTriggers > 0 ? responded.length / totalTriggers : 0;
    const completionRate = totalTriggers > 0 ? completed.length / totalTriggers : 0;

    const avgResponseTime =
      responded.length > 0
        ? responded.reduce((sum, h) => sum + (h.responseTime || 0), 0) / responded.length / 1000
        : 0;

    return {
      totalTriggers,
      responseRate,
      completionRate,
      avgResponseTime,
      channelAnalysis: this.analyzeChannels(histories),
      timePatterns: this.analyzeTimePatterns(histories),
    };
  }

  // 识别失效提醒
  async detectIneffectiveReminders(): Promise<void> {
    const reminders = await this.reminderRepository.findAll();

    for (const reminder of reminders) {
      const recentHistories = await this.historyRepository.findRecent(reminder.uuid, 7);

      if (recentHistories.length >= 5) {
        const ignoreRate =
          recentHistories.filter((h) => h.userResponse === UserResponse.IGNORED).length /
          recentHistories.length;

        if (ignoreRate >= 0.8) {
          // 80% 忽略率
          await this.createOptimizationSuggestion(reminder, IssueType.ALWAYS_IGNORED, 'high', {
            recentTriggers: recentHistories.length,
            responseRate: 1 - ignoreRate,
            ignoreRate,
          });
        }
      }
    }
  }
}
```

### API 端点

```typescript
// 获取提醒历史
GET /api/v1/reminders/:uuid/history?days=30&limit=50
Response: {
  history: ReminderHistoryClientDTO[],
  total: number,
  statistics: {
    totalTriggers: number,
    responseRate: number,
    completionRate: number
  }
}

// 记录用户响应
POST /api/v1/reminder-history/:uuid/response
Body: {
  response: UserResponse,
  action: ResponseAction
}
Response: ReminderHistoryClientDTO

// 获取效果分析
GET /api/v1/reminders/:uuid/analysis?days=30
Response: EffectivenessAnalysis

// 获取优化建议
GET /api/v1/reminders/:uuid/optimization-suggestions
Response: {
  suggestions: ReminderOptimizationSuggestionClientDTO[]
}

// 应用优化建议
POST /api/v1/reminder-optimization-suggestions/:uuid/apply
Response: { success: boolean }

// 导出历史
GET /api/v1/reminders/:uuid/history/export?format=csv&days=30
Response: File (CSV/JSON/PDF)
```

---

## 8. 风险与缓解

| 风险             | 可能性 | 影响 | 缓解措施                     |
| ---------------- | ------ | ---- | ---------------------------- |
| 历史数据量过大   | 高     | 中   | 定期归档（保留 90 天）+ 分页 |
| 统计计算性能问题 | 中     | 中   | 异步计算 + 缓存结果          |
| 失效检测误报     | 中     | 低   | 可配置阈值 + 人工确认        |
| 导出文件过大     | 低     | 低   | 限制导出数量 + 压缩          |

---

## 9. 后续增强方向

### Phase 2 功能

- 🔄 用户行为模式识别（如习惯何时响应）
- 📊 跨提醒对比分析
- 🤖 AI 预测提醒有效性
- 📱 移动端历史查看优化

### Phase 3 功能

- 🔗 与 Task/Goal 模块深度集成（关联任务完成率）
- 👥 团队提醒效果对比
- 🎯 A/B 测试（不同提醒策略效果对比）
- 📈 长期趋势预测

---

## 10. 参考资料

- [Reminder Contracts](../../../../packages/contracts/src/modules/reminder/)
- [用户行为分析最佳实践](https://en.wikipedia.org/wiki/Behavioral_analytics)
- [A/B 测试方法论](https://en.wikipedia.org/wiki/A/B_testing)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:

- 创建: 2025-10-21
- 创建者: PO Agent
- 版本: 1.0
- 下次更新: Sprint Planning 前
