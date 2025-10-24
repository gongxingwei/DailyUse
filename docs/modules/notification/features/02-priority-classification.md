# Feature Spec: 通知优先级分类

> **功能编号**: NOTIFICATION-002  
> **RICE 评分**: 189 (Reach: 9, Impact: 7, Confidence: 6, Effort: 2)  
> **优先级**: P1  
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

现代应用的通知系统普遍存在"通知疲劳"问题：

- ❌ 所有通知权重相同，重要信息被淹没
- ❌ 用户无法快速识别需要立即处理的通知
- ❌ 低优先级通知干扰用户注意力
- ❌ 缺少基于优先级的筛选和管理
- ❌ 通知渠道选择不智能（高优先级应多渠道推送）

### 目标用户

- **主要用户**: 接收大量通知的活跃用户
- **次要用户**: 需要精细化通知管理的团队
- **典型画像**: "我每天收到几十条通知，但真正重要的只有几条，很容易错过"

### 价值主张

**一句话价值**: 智能分类通知优先级，确保重要信息不被错过

**核心收益**:

- ✅ 自动计算通知优先级（HIGH/MEDIUM/LOW）
- ✅ 基于优先级的视觉差异化
- ✅ 高优先级通知多渠道推送
- ✅ 按优先级筛选和排序
- ✅ 智能免打扰（低优先级静默）

---

## 2. 用户价值与场景

### 核心场景 1: 自动优先级计算

**场景描述**:  
系统根据通知类型、相关对象、时间紧急度自动计算优先级。

**用户故事**:

```gherkin
As a 用户
I want 通知自动分配优先级
So that 我可以快速识别重要信息
```

**操作流程**:

1. 系统触发多个通知场景：

   ```typescript
   // 场景 1: 高优先级任务截止提醒
   {
     type: 'task_due_soon',
     task: {
       priority: 'HIGH',
       dueTime: Date.now() + 3600000  // 1 小时后
     }
   }

   // 场景 2: 目标进度更新
   {
     type: 'goal_progress_updated',
     goal: {
       priority: 'MEDIUM',
       progressChange: 20  // 进度提升 20%
     }
   }

   // 场景 3: 普通提醒
   {
     type: 'reminder_triggered',
     reminder: {
       frequency: 'DAILY',
       importance: 'LOW'
     }
   }
   ```

2. 系统应用优先级计算规则：

   ```typescript
   function calculatePriority(notification: Notification): Priority {
     let score = 0;

     // 1. 基础类型权重
     const typeWeights = {
       task_overdue: 50,
       task_due_soon: 40,
       goal_at_risk: 45,
       schedule_conflict: 40,
       reminder_triggered: 20,
       goal_progress_updated: 25,
     };
     score += typeWeights[notification.type] || 10;

     // 2. 相关对象优先级加成
     if (notification.relatedTask?.priority === 'HIGH') score += 20;
     if (notification.relatedGoal?.priority === 'MEDIUM') score += 10;

     // 3. 时间紧急度
     const urgency = calculateUrgency(notification.actionRequired);
     score += urgency; // 0-20 分

     // 4. 用户交互历史
     const engagement = calculateEngagement(notification.type);
     score *= engagement; // 0.8-1.2 倍

     // 映射到优先级
     if (score >= 60) return 'HIGH';
     if (score >= 30) return 'MEDIUM';
     return 'LOW';
   }
   ```

3. 生成分类后的通知：

   ```
   通知中心
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   🔴 高优先级 (2)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚠️ 任务即将截止
      "产品评审报告" 将在 1 小时后截止
      5 分钟前
      [查看任务]

   ⚠️ 日程冲突
      "团队站会" 与 "客户演示" 时间重叠
      10 分钟前
      [解决冲突]

   🟡 中优先级 (5)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 目标进度更新
      "Q4 产品上线" 进度提升至 65%
      1 小时前
      [查看详情]

   ⏰ 提醒
      开始执行 "编写技术文档"
      2 小时前
      [开始任务]

   🔵 低优先级 (8)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💡 每日提醒
      记得喝水休息
      3 小时前

   [展开更多]
   ```

**预期结果**:

- 自动计算优先级（HIGH/MEDIUM/LOW）
- 视觉上清晰区分（红/黄/蓝）
- 高优先级通知置顶

---

### 核心场景 2: 基于优先级的多渠道推送

**场景描述**:  
高优先级通知通过多个渠道推送，确保用户收到。

**用户故事**:

```gherkin
As a 用户
I want 高优先级通知多渠道推送
So that 确保不会错过重要信息
```

**操作流程**:

1. 系统生成高优先级通知（任务截止）
2. 根据优先级决定推送渠道：

   ```typescript
   const channelStrategy = {
     HIGH: ['in_app', 'desktop', 'email'], // 三渠道
     MEDIUM: ['in_app', 'desktop'], // 双渠道
     LOW: ['in_app'], // 仅应用内
   };

   const channels = channelStrategy[notification.priority];

   for (const channel of channels) {
     await sendNotification(channel, notification);
   }
   ```

3. 用户收到多渠道通知：

   **应用内通知（立即）**:

   ```
   ┌────────────────────────────────────┐
   │ 🔴 任务即将截止                    │
   │ "产品评审报告" 将在 1 小时后截止   │
   │ [查看任务]  [忽略]                │
   └────────────────────────────────────┘
   ```

   **桌面通知（立即）**:

   ```
   ┌─────────────────────────────────────┐
   │ DailyUse                            │
   │ ⚠️ 任务即将截止                     │
   │ "产品评审报告" 将在 1 小时后截止    │
   │ 点击查看详情                        │
   └─────────────────────────────────────┘
   ```

   **邮件通知（5 分钟后，如果未读）**:

   ```
   发件人: DailyUse <noreply@dailyuse.com>
   主题: [紧急] 任务即将截止

   您好 郑十，

   您的任务 "产品评审报告" 将在 1 小时后截止。

   任务详情：
   - 优先级: 高
   - 截止时间: 2025-10-21 16:00
   - 关联目标: Q4 产品上线

   请及时处理：
   [查看任务] [延期申请]
   ```

4. 用户偏好设置：

   ```
   通知渠道设置
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   根据优先级自动选择渠道：

   🔴 高优先级通知
   ☑️ 应用内通知（总是）
   ☑️ 桌面通知（总是）
   ☑️ 邮件通知（5 分钟后未读）
   ☐ 短信通知（付费功能）

   🟡 中优先级通知
   ☑️ 应用内通知
   ☑️ 桌面通知
   ☐ 邮件通知

   🔵 低优先级通知
   ☑️ 应用内通知
   ☐ 桌面通知（静默）
   ☐ 邮件通知

   [保存设置]
   ```

**预期结果**:

- 高优先级多渠道推送
- 中/低优先级选择性推送
- 支持用户自定义渠道策略

---

### 核心场景 3: 按优先级筛选和排序

**场景描述**:  
用户可按优先级筛选通知，快速查看重要信息。

**用户故事**:

```gherkin
As a 用户
I want 按优先级筛选通知
So that 只查看我关心的级别
```

**操作流程**:

1. 用户打开通知中心，默认显示所有未读通知
2. 点击筛选按钮：

   ```
   通知筛选
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   优先级：
   ☑️ 高优先级 (2)
   ☑️ 中优先级 (5)
   ☑️ 低优先级 (8)

   状态：
   🔘 未读 (12)
   ⚪ 已读 (45)
   ⚪ 全部 (57)

   类型：
   ☑️ 任务相关
   ☑️ 目标相关
   ☑️ 日程相关
   ☑️ 提醒
   ☐ 系统通知

   时间范围：
   🔘 今天
   ⚪ 最近 7 天
   ⚪ 全部

   [应用筛选]  [重置]
   ```

3. 用户取消勾选"低优先级"
4. 通知列表仅显示高/中优先级：

   ```
   通知中心 (已筛选)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   仅显示: 高/中优先级 | 未读 | 今天

   🔴 高优先级 (2)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚠️ 任务即将截止
      "产品评审报告" 将在 1 小时后截止
      [查看任务]

   ⚠️ 日程冲突
      "团队站会" 与 "客户演示" 时间重叠
      [解决冲突]

   🟡 中优先级 (5)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 目标进度更新
      "Q4 产品上线" 进度提升至 65%
      [查看详情]

   ⏰ 提醒
      开始执行 "编写技术文档"
      [开始任务]

   已隐藏 8 个低优先级通知
   [查看全部]
   ```

5. 排序选项：
   ```
   排序方式：
   🔘 优先级（高→低）
   ⚪ 时间（新→旧）
   ⚪ 时间（旧→新）
   ⚪ 类型
   ```

**预期结果**:

- 支持多维度筛选
- 实时更新筛选结果
- 显示被隐藏的通知数量

---

### 核心场景 4: 智能免打扰模式

**场景描述**:  
免打扰模式下，低优先级通知静默，仅推送高优先级。

**用户故事**:

```gherkin
As a 用户
I want 免打扰模式下不被低级通知打扰
So that 保持专注但不错过重要信息
```

**操作流程**:

1. 用户启用免打扰模式：

   ```
   免打扰模式
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   状态: ⚪ 关闭  🔘 开启

   在免打扰模式下：

   🔴 高优先级通知
   🔘 正常推送（推荐）
      重要通知不会被屏蔽
   ⚪ 静默推送
      收到通知但不发出声音
   ⚪ 完全屏蔽
      不接收任何通知

   🟡 中优先级通知
   ⚪ 正常推送
   🔘 静默推送（推荐）
      收到但不发出声音和弹窗
   ⚪ 完全屏蔽

   🔵 低优先级通知
   ⚪ 正常推送
   ⚪ 静默推送
   🔘 完全屏蔽（推荐）
      暂时不接收

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   自动启用时间段:
   ☑️ 工作时间: 周一至周五 09:00-18:00
   ☑️ 睡眠时间: 每天 22:00-07:00
   ☐ 专注时间: 自定义

   [保存设置]
   ```

2. 用户启用免打扰后，系统行为：

   **高优先级通知（正常推送）**:

   ```
   15:00  收到高优先级通知
   → 应用内弹窗 ✓
   → 桌面通知 ✓
   → 声音提示 ✓
   ```

   **中优先级通知（静默推送）**:

   ```
   15:05  收到中优先级通知
   → 应用内角标 +1 ✓
   → 桌面通知 ✗
   → 声音提示 ✗
   ```

   **低优先级通知（完全屏蔽）**:

   ```
   15:10  收到低优先级通知
   → 暂存到队列 ✓
   → 任何提示 ✗
   → 退出免打扰后批量显示
   ```

3. 退出免打扰模式时：

   ```
   ✅ 免打扰模式已结束
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   在免打扰期间，您收到：

   🔴 高优先级: 1 个（已推送）
   🟡 中优先级: 3 个（已静默接收）
   🔵 低优先级: 8 个（已屏蔽）

   是否现在查看被屏蔽的通知？

   [查看全部]  [仅查看中/高优先级]  [稍后]
   ```

**预期结果**:

- 基于优先级的差异化处理
- 支持自动启用时间段
- 退出时汇总被屏蔽通知

---

### 核心场景 5: 优先级动态调整

**场景描述**:  
系统根据用户行为动态调整未来通知的优先级。

**用户故事**:

```gherkin
As a 用户
I want 系统学习我的习惯
So that 优先级更符合我的需求
```

**操作流程**:

1. 系统记录用户对不同通知的交互：

   ```typescript
   // 用户行为数据
   const interactions = [
     { type: 'task_due_soon', priority: 'HIGH', action: 'opened', responseTime: 30 },
     { type: 'task_due_soon', priority: 'HIGH', action: 'opened', responseTime: 120 },
     { type: 'goal_progress_updated', priority: 'MEDIUM', action: 'ignored' },
     { type: 'goal_progress_updated', priority: 'MEDIUM', action: 'ignored' },
     { type: 'reminder_triggered', priority: 'LOW', action: 'opened', responseTime: 60 },
   ];
   ```

2. 计算每种通知的用户参与度：

   ```typescript
   function calculateEngagementScore(notificationType: string): number {
     const interactions = getUserInteractions(notificationType);

     const openRate =
       interactions.filter((i) => i.action === 'opened').length / interactions.length;
     const avgResponseTime = average(
       interactions.filter((i) => i.action === 'opened').map((i) => i.responseTime),
     );
     const dismissRate =
       interactions.filter((i) => i.action === 'dismissed').length / interactions.length;

     // 综合得分（0-1）
     const score =
       openRate * 0.5 +
       (1 - avgResponseTime / 3600) * 0.3 + // 响应越快分数越高
       (1 - dismissRate) * 0.2;

     return score;
   }
   ```

3. 调整优先级权重：

   ```typescript
   // 原始优先级: MEDIUM
   // 用户参与度: 0.2（很少打开）

   if (engagementScore < 0.3) {
     // 降低优先级
     adjustedPriority = lowerPriority(originalPriority); // MEDIUM → LOW
   }

   // 原始优先级: LOW
   // 用户参与度: 0.8（经常快速响应）

   if (engagementScore > 0.7) {
     // 提升优先级
     adjustedPriority = raisePriority(originalPriority); // LOW → MEDIUM
   }
   ```

4. 系统通知用户优先级已调整：

   ```
   💡 通知偏好已优化
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   基于您的使用习惯，我们调整了通知优先级：

   📉 降低优先级:
   • "目标进度更新" 从中优先级降至低优先级
     原因：您很少查看此类通知

   📈 提升优先级:
   • "每日提醒" 从低优先级升至中优先级
     原因：您总是快速响应此类通知

   这将影响未来的通知推送策略。

   [查看详情]  [撤销调整]  [保持当前设置]
   ```

**预期结果**:

- 自动学习用户习惯
- 动态调整优先级权重
- 透明告知用户调整原因

---

### 核心场景 6: 批量优先级管理

**场景描述**:  
用户批量调整多个通知的优先级。

**用户故事**:

```gherkin
As a 用户
I want 批量管理通知优先级
So that 快速整理大量通知
```

**操作流程**:

1. 用户进入通知管理页面
2. 开启批量操作模式：

   ```
   通知中心 (批量模式)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   已选择: 5 个通知

   ☑️ ⚠️ 任务即将截止 (HIGH)
   ☑️ 📊 目标进度更新 (MEDIUM)
   ☑️ ⏰ 提醒 (MEDIUM)
   ☐ 💡 每日提醒 (LOW)
   ☑️ 📅 日程提醒 (LOW)
   ☑️ 📧 邮件摘要 (LOW)

   批量操作：
   [标记已读]  [删除]  [调整优先级▾]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   调整优先级
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   将选中的 5 个通知优先级调整为：

   ⚪ 高优先级
   🔘 中优先级
   ⚪ 低优先级

   ☑️ 同时调整相同类型通知的默认优先级

   [确认]  [取消]
   ```

3. 用户选择"中优先级"并确认
4. 系统批量更新：

   ```
   ✅ 优先级已更新
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   已将 5 个通知调整为中优先级

   同时更新了相同类型通知的默认优先级：
   • "日程提醒" 默认优先级: LOW → MEDIUM
   • "邮件摘要" 默认优先级: LOW → MEDIUM

   未来这些类型的通知将按新优先级推送。

   [完成]
   ```

**预期结果**:

- 支持多选批量操作
- 可同时更新默认规则
- 显示影响范围

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 更新 Notification 实体

**位置**: `packages/contracts/src/modules/notification/entities/NotificationServer.ts`

```typescript
export interface NotificationServerDTO {
  readonly uuid: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly content: string;
  readonly priority: NotificationPriority; // 优先级
  readonly priorityScore: number; // 优先级计算分数
  readonly channels: NotificationChannel[]; // 推送渠道
  readonly metadata?: NotificationMetadata;
  readonly relatedObjectType?: string;
  readonly relatedObjectUuid?: string;
  readonly actionUrl?: string;
  readonly status: NotificationStatus;
  readonly readAt?: number;
  readonly createdAt: number;
  readonly expiresAt?: number;
}

/**
 * 通知优先级
 */
export enum NotificationPriority {
  HIGH = 'high', // 高优先级（红色）
  MEDIUM = 'medium', // 中优先级（黄色）
  LOW = 'low', // 低优先级（蓝色）
}

/**
 * 通知元数据
 */
export interface NotificationMetadata {
  readonly urgencyScore?: number; // 紧急度分数
  readonly engagementScore?: number; // 用户参与度分数
  readonly priorityAdjusted?: boolean; // 是否已被调整
  readonly originalPriority?: NotificationPriority;
  readonly adjustmentReason?: string;
}
```

#### 新增实体：NotificationPreference（通知偏好）

**位置**: `packages/contracts/src/modules/notification/entities/NotificationPreferenceServer.ts`

```typescript
/**
 * 通知偏好
 */
export interface NotificationPreferenceServerDTO {
  readonly uuid: string;
  readonly userId: string;
  readonly channelConfig: ChannelConfig; // 渠道配置
  readonly dndConfig: DndConfig; // 免打扰配置
  readonly priorityRules: PriorityRule[]; // 优先级规则
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * 渠道配置
 */
export interface ChannelConfig {
  readonly high: NotificationChannel[]; // 高优先级渠道
  readonly medium: NotificationChannel[]; // 中优先级渠道
  readonly low: NotificationChannel[]; // 低优先级渠道
}

/**
 * 免打扰配置
 */
export interface DndConfig {
  readonly enabled: boolean;
  readonly highPriority: 'normal' | 'silent' | 'block';
  readonly mediumPriority: 'normal' | 'silent' | 'block';
  readonly lowPriority: 'normal' | 'silent' | 'block';
  readonly autoSchedules: DndSchedule[];
}

/**
 * 免打扰时间段
 */
export interface DndSchedule {
  readonly name: string;
  readonly days: number[]; // 0-6 (周日-周六)
  readonly startTime: string; // HH:mm
  readonly endTime: string; // HH:mm
  readonly enabled: boolean;
}

/**
 * 优先级规则
 */
export interface PriorityRule {
  readonly notificationType: NotificationType;
  readonly defaultPriority: NotificationPriority;
  readonly adjustmentFactor: number; // 调整系数（0.5-1.5）
  readonly reason?: string;
}
```

#### 新增实体：NotificationInteraction（通知交互）

**位置**: `packages/contracts/src/modules/notification/entities/NotificationInteractionServer.ts`

```typescript
/**
 * 通知交互记录
 */
export interface NotificationInteractionServerDTO {
  readonly uuid: string;
  readonly notificationUuid: string;
  readonly userId: string;
  readonly action: InteractionAction;
  readonly responseTime?: number; // 响应时间（毫秒）
  readonly createdAt: number;
}

/**
 * 交互动作
 */
export enum InteractionAction {
  RECEIVED = 'received', // 收到
  OPENED = 'opened', // 打开
  CLICKED = 'clicked', // 点击
  DISMISSED = 'dismissed', // 忽略
  DELETED = 'deleted', // 删除
}
```

---

### 交互设计

#### 1. 优先级计算公式

```typescript
function calculatePriority(notification: Notification): NotificationPriority {
  let score = 0;

  // 1. 基础类型权重 (0-50)
  const typeWeights = {
    task_overdue: 50,
    task_due_soon: 40,
    schedule_conflict: 40,
    goal_at_risk: 45,
    goal_milestone_reached: 35,
    reminder_triggered: 20,
    goal_progress_updated: 25,
    system_update: 10,
  };
  score += typeWeights[notification.type] || 10;

  // 2. 相关对象优先级 (0-20)
  if (notification.relatedTask?.priority === 'HIGH') score += 20;
  else if (notification.relatedTask?.priority === 'MEDIUM') score += 10;

  if (notification.relatedGoal?.priority === 'HIGH') score += 15;

  // 3. 时间紧急度 (0-20)
  const urgency = calculateUrgency(notification.actionRequired);
  score += urgency;

  // 4. 用户参与度系数 (0.8-1.2)
  const engagement = getEngagementScore(notification.type);
  score *= engagement;

  // 5. 优先级规则调整
  const rule = getPriorityRule(notification.type);
  if (rule) {
    score *= rule.adjustmentFactor;
  }

  // 映射到优先级
  if (score >= 60) return NotificationPriority.HIGH;
  if (score >= 30) return NotificationPriority.MEDIUM;
  return NotificationPriority.LOW;
}
```

#### 2. 渠道选择策略

| 优先级 | 默认渠道             | 延迟策略               |
| ------ | -------------------- | ---------------------- |
| HIGH   | 应用内 + 桌面 + 邮件 | 立即 + 5分钟后（未读） |
| MEDIUM | 应用内 + 桌面        | 立即                   |
| LOW    | 仅应用内             | 立即或批量             |

---

## 4. MVP/MMP/Full 路径

### MVP: 基础优先级分类（1-1.5 周）

**范围**:

- ✅ 自动优先级计算（固定规则）
- ✅ 视觉差异化（颜色/图标）
- ✅ 按优先级排序
- ✅ 基于优先级的渠道选择
- ✅ 简单筛选（按优先级）

**技术要点**:

- Contracts: 更新 `NotificationServerDTO` 添加 `priority` 字段
- 优先级计算服务
- UI 组件差异化渲染

**验收标准**:

```gherkin
Given 系统生成任务截止通知
When 任务优先级为 HIGH 且距离截止 1 小时
Then 通知优先级应为 HIGH
And 应通过应用内 + 桌面渠道推送
And 在通知列表中显示红色标识
```

---

### MMP: 智能免打扰与动态调整（+1 周）

**在 MVP 基础上新增**:

- ✅ 免打扰模式（基于优先级）
- ✅ 自动免打扰时间段
- ✅ 用户参与度学习
- ✅ 动态优先级调整
- ✅ 优先级规则自定义

**技术要点**:

- 交互记录收集
- 参与度分析算法
- 定时任务调整规则

**验收标准**:

```gherkin
Given 用户启用免打扰模式
And 设置低优先级完全屏蔽
When 收到低优先级通知
Then 通知应暂存到队列
And 不发出任何提示
And 退出免打扰后批量显示
```

---

### Full Release: 高级管理与分析（+1 周）

**在 MMP 基础上新增**:

- ✅ 批量优先级管理
- ✅ 优先级分布统计
- ✅ 通知效果分析
- ✅ AI 推荐优先级规则
- ✅ 跨设备同步偏好

**技术要点**:

- 批量操作 API
- 数据分析看板
- 机器学习推荐

**验收标准**:

```gherkin
Given 用户选择 5 个通知
When 批量调整为中优先级
And 选择"同时更新默认规则"
Then 5 个通知优先级应更新
And 相同类型的默认规则应更新
```

---

## 5. 验收标准（Gherkin）

### Feature: 通知优先级分类

#### Scenario 1: 自动优先级计算

```gherkin
Feature: 通知优先级分类
  作为用户，我希望通知自动分配优先级

  Background:
    Given 用户"郑十"已登录

  Scenario: 高优先级任务截止通知
    Given 存在任务：
      | uuid    | title      | priority | dueTime            |
      | task-1  | 产品报告   | HIGH     | 1 小时后           |
    When 系统触发任务截止提醒
    Then 应创建通知，priority = 'HIGH'
    And priorityScore 应 >= 60
    And channels 应包含：['in_app', 'desktop', 'email']
    And 通知颜色应为红色

  Scenario: 低优先级常规提醒
    Given 存在提醒：
      | uuid      | title    | frequency |
      | reminder-1| 喝水休息 | DAILY     |
    When 提醒触发
    Then 应创建通知，priority = 'LOW'
    And priorityScore 应 < 30
    And channels 应仅包含：['in_app']
    And 通知颜色应为蓝色
```

---

#### Scenario 2: 基于优先级的多渠道推送

```gherkin
  Background:
    Given 用户已配置通知渠道偏好
    And 高优先级启用：应用内 + 桌面 + 邮件

  Scenario: 高优先级多渠道推送
    When 创建高优先级通知 "任务即将截止"
    Then 应立即发送应用内通知
    And 应立即发送桌面通知
    And 应在 5 分钟后检查是否已读

    When 5 分钟后通知仍未读
    Then 应发送邮件通知
    And 邮件主题应包含 "[紧急]"
```

---

#### Scenario 3: 按优先级筛选

```gherkin
  Background:
    Given 用户有 15 个未读通知：
      | priority | count |
      | HIGH     | 2     |
      | MEDIUM   | 5     |
      | LOW      | 8     |

  Scenario: 筛选高优先级通知
    When 用户打开通知中心
    And 设置筛选条件：仅显示高优先级
    Then 通知列表应显示 2 个通知
    And 所有通知的 priority 应为 'HIGH'
    And 应提示："已隐藏 13 个其他优先级通知"
```

---

#### Scenario 4: 免打扰模式

```gherkin
  Background:
    Given 用户启用免打扰模式
    And 配置：
      | priority | mode   |
      | HIGH     | normal |
      | MEDIUM   | silent |
      | LOW      | block  |

  Scenario: 免打扰期间收到不同优先级通知
    When 收到高优先级通知
    Then 应正常推送（声音 + 弹窗）

    When 收到中优先级通知
    Then 应静默推送（无声音 + 无弹窗）
    And 应增加角标数

    When 收到低优先级通知
    Then 应屏蔽通知
    And 添加到待显示队列

    When 用户退出免打扰模式
    Then 应提示："收到 1 个高优先级、1 个中优先级、1 个低优先级通知"
    And 提供"查看被屏蔽通知"选项
```

---

#### Scenario 5: 动态优先级调整

```gherkin
  Background:
    Given 用户收到 10 个"目标进度更新"通知（MEDIUM）
    And 用户从未打开过此类通知

  Scenario: 降低优先级
    When 系统执行优先级调整分析
    Then 应检测到用户参与度低（< 0.3）
    And 应将"目标进度更新"默认优先级降至 LOW
    And 应通知用户："已调整通知优先级"
    And 提供"撤销"选项

    When 用户收到新的"目标进度更新"通知
    Then 新通知的 priority 应为 'LOW'
    And metadata.priorityAdjusted 应为 true
```

---

#### Scenario 6: 批量管理

```gherkin
  Background:
    Given 用户有 20 个未读通知

  Scenario: 批量调整优先级
    When 用户选择 5 个低优先级通知
    And 点击"批量调整优先级"
    And 选择调整为"中优先级"
    And 勾选"同时更新默认规则"
    And 确认操作
    Then 5 个通知的 priority 应更新为 'MEDIUM'
    And 相同类型通知的默认规则应更新
    And 显示："已更新 5 个通知及 2 个默认规则"
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
    priorityScore: number,
    channels: NotificationChannel[]
  }
}

// 通知交互
{
  event: 'notification_interacted',
  properties: {
    notificationUuid: string,
    priority: NotificationPriority,
    action: InteractionAction,
    responseTime: number
  }
}

// 优先级调整
{
  event: 'priority_adjusted',
  properties: {
    notificationType: NotificationType,
    oldPriority: NotificationPriority,
    newPriority: NotificationPriority,
    reason: string
  }
}

// 免打扰模式
{
  event: 'dnd_mode_toggled',
  properties: {
    enabled: boolean,
    config: DndConfig
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 高优先级通知打开率 | >80% | 打开数 / 高优先级通知总数 |
| 低优先级通知忽略率 | <30% | 忽略数 / 低优先级通知总数 |
| 优先级准确率 | >85% | 用户未手动调整的通知比例 |
| 免打扰模式使用率 | >40% | 启用用户数 / 活跃用户数 |

**定性指标**:

- 用户反馈"通知更有条理"
- 减少通知疲劳感
- 重要通知响应更及时

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model Notification {
  // ...existing fields...

  priority          String   @map("priority")
  priorityScore     Float    @map("priority_score")
  channels          Json     @map("channels")  // NotificationChannel[]
  metadata          Json?    @map("metadata")  // NotificationMetadata

  interactions      NotificationInteraction[]

  @@index([userId, priority, status])
  @@map("notifications")
}

model NotificationPreference {
  uuid              String   @id @default(uuid())
  userId            String   @map("user_id")
  channelConfig     Json     @map("channel_config")
  dndConfig         Json     @map("dnd_config")
  priorityRules     Json     @map("priority_rules")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user              User     @relation(fields: [userId], references: [uuid])

  @@unique([userId])
  @@map("notification_preferences")
}

model NotificationInteraction {
  uuid              String   @id @default(uuid())
  notificationUuid  String   @map("notification_uuid")
  userId            String   @map("user_id")
  action            String   @map("action")
  responseTime      Int?     @map("response_time")
  createdAt         DateTime @default(now()) @map("created_at")

  notification      Notification @relation(fields: [notificationUuid], references: [uuid])

  @@index([notificationUuid])
  @@index([userId, action])
  @@map("notification_interactions")
}
```

### Application Service

```typescript
// packages/domain-server/src/modules/notification/application/PriorityService.ts

export class NotificationPriorityService {
  // 计算优先级
  calculatePriority(notification: Notification): NotificationPriority {
    let score = this.getBaseScore(notification.type);

    // 关联对象加成
    score += this.getRelatedObjectBonus(notification);

    // 时间紧急度
    score += this.getUrgencyScore(notification);

    // 用户参与度系数
    const engagement = this.getEngagementScore(notification.userId, notification.type);
    score *= engagement;

    // 应用自定义规则
    const rule = this.getPriorityRule(notification.userId, notification.type);
    if (rule) {
      score *= rule.adjustmentFactor;
    }

    notification.setPriorityScore(score);

    if (score >= 60) return NotificationPriority.HIGH;
    if (score >= 30) return NotificationPriority.MEDIUM;
    return NotificationPriority.LOW;
  }

  // 选择推送渠道
  selectChannels(priority: NotificationPriority, userId: string): NotificationChannel[] {
    const preference = await this.preferenceRepository.findByUser(userId);

    if (preference) {
      return preference.channelConfig[priority];
    }

    // 默认策略
    const defaultChannels = {
      [NotificationPriority.HIGH]: ['in_app', 'desktop', 'email'],
      [NotificationPriority.MEDIUM]: ['in_app', 'desktop'],
      [NotificationPriority.LOW]: ['in_app'],
    };

    return defaultChannels[priority];
  }

  // 检查是否应该推送（免打扰模式）
  shouldPush(
    notification: Notification,
    userId: string,
  ): { push: boolean; mode: 'normal' | 'silent' | 'block' } {
    const preference = await this.preferenceRepository.findByUser(userId);

    if (!preference?.dndConfig.enabled) {
      return { push: true, mode: 'normal' };
    }

    // 检查是否在免打扰时间段
    if (!this.isInDndSchedule(preference.dndConfig)) {
      return { push: true, mode: 'normal' };
    }

    // 根据优先级决定推送模式
    const priorityMode = {
      [NotificationPriority.HIGH]: preference.dndConfig.highPriority,
      [NotificationPriority.MEDIUM]: preference.dndConfig.mediumPriority,
      [NotificationPriority.LOW]: preference.dndConfig.lowPriority,
    };

    const mode = priorityMode[notification.priority];

    return {
      push: mode !== 'block',
      mode,
    };
  }

  // 记录交互
  async recordInteraction(notificationUuid: string, action: InteractionAction): Promise<void> {
    const notification = await this.notificationRepository.findByUuid(notificationUuid);

    const interaction = new NotificationInteraction({
      notificationUuid,
      userId: notification.userId,
      action,
      responseTime: action === 'opened' ? Date.now() - notification.createdAt : undefined,
    });

    await this.interactionRepository.save(interaction);

    // 异步更新参与度分析
    this.eventBus.publish(new NotificationInteractionEvent({ interactionUuid: interaction.uuid }));
  }

  // 分析并调整优先级规则
  async analyzeAndAdjustRules(userId: string): Promise<PriorityRule[]> {
    const interactions = await this.interactionRepository.findByUser(userId, {
      limit: 1000,
      orderBy: { createdAt: 'desc' },
    });

    const adjustedRules: PriorityRule[] = [];

    // 按通知类型分组
    const grouped = groupBy(interactions, 'notification.type');

    for (const [type, typeInteractions] of Object.entries(grouped)) {
      const engagement = this.calculateEngagementScore(typeInteractions);

      // 参与度低，降低优先级
      if (engagement < 0.3) {
        adjustedRules.push({
          notificationType: type as NotificationType,
          defaultPriority: this.lowerPriority(getDefaultPriority(type)),
          adjustmentFactor: 0.7,
          reason: '用户很少查看此类通知',
        });
      }

      // 参与度高，提升优先级
      if (engagement > 0.7) {
        adjustedRules.push({
          notificationType: type as NotificationType,
          defaultPriority: this.raisePriority(getDefaultPriority(type)),
          adjustmentFactor: 1.3,
          reason: '用户经常快速响应此类通知',
        });
      }
    }

    // 保存规则
    const preference = await this.preferenceRepository.findByUser(userId);
    preference.updatePriorityRules(adjustedRules);
    await this.preferenceRepository.save(preference);

    return adjustedRules;
  }
}
```

### API 端点

```typescript
// 获取通知（支持优先级筛选）
GET /api/v1/notifications?priority=high,medium&status=unread
Response: {
  notifications: NotificationClientDTO[],
  summary: {
    high: number,
    medium: number,
    low: number
  }
}

// 批量更新优先级
POST /api/v1/notifications/batch-priority
Body: {
  notificationUuids: string[],
  priority: NotificationPriority,
  updateDefaultRule?: boolean
}
Response: {
  updated: number,
  rulesUpdated: number
}

// 获取/更新通知偏好
GET /api/v1/notification-preferences
PATCH /api/v1/notification-preferences
Body: Partial<NotificationPreferenceClientDTO>
Response: NotificationPreferenceClientDTO

// 记录交互
POST /api/v1/notifications/:uuid/interact
Body: {
  action: InteractionAction
}
Response: { success: boolean }

// 触发优先级规则分析
POST /api/v1/notification-preferences/analyze-priority
Response: {
  adjustedRules: PriorityRule[],
  summary: string
}
```

---

## 8. 风险与缓解

| 风险                 | 可能性 | 影响 | 缓解措施                |
| -------------------- | ------ | ---- | ----------------------- |
| 优先级计算不准确     | 中     | 高   | 持续优化算法 + 用户反馈 |
| 免打扰屏蔽重要通知   | 中     | 高   | 高优先级默认不屏蔽      |
| 动态调整过于激进     | 中     | 中   | 调整阈值 + 用户确认     |
| 性能问题（大量通知） | 低     | 中   | 索引优化 + 分页         |

---

## 9. 后续增强方向

### Phase 2 功能

- 🔄 基于 AI 的优先级预测
- 📊 优先级效果分析报告
- 🤖 智能推荐免打扰时间
- 📱 跨设备优先级同步

### Phase 3 功能

- 🔗 团队通知优先级共享
- 👥 基于角色的优先级策略
- 🎯 通知疲劳度检测
- 📈 优先级 A/B 测试

---

## 10. 参考资料

- [Notification Contracts](../../../../packages/contracts/src/modules/notification/)
- [Push Notification Best Practices](https://developer.apple.com/design/human-interface-guidelines/notifications)
- [通知疲劳研究](https://www.nngroup.com/articles/notification-fatigue/)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:

- 创建: 2025-10-21
- 创建者: PO Agent
- 版本: 1.0
- 下次更新: Sprint Planning 前
