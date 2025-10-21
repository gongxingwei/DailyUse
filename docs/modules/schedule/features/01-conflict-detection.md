# Feature Spec: 日程冲突检测

> **功能编号**: SCHEDULE-001  
> **RICE 评分**: 384 (Reach: 8, Impact: 8, Confidence: 8, Effort: 1.33)  
> **优先级**: P0  
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

在日程管理中，时间冲突是常见问题，但现状存在以下困扰：
- ❌ 创建新日程时不知道是否与其他日程冲突
- ❌ 接受会议邀请后发现时间重叠，需要重新协调
- ❌ 任务截止时间与日程冲突，导致时间规划混乱
- ❌ 没有提前预警机制，冲突发现太晚

### 目标用户

- **主要用户**: 日程繁忙的职场人士、项目管理者
- **次要用户**: 团队协作者（需协调多人时间）
- **典型画像**: 每天有 5+ 日程安排，需要精细时间规划的用户

### 价值主张

**一句话价值**: 自动检测日程时间冲突并提供智能解决方案，避免时间安排混乱

**核心收益**:
- ✅ 创建日程时实时检测冲突，提前预警
- ✅ 自动标记冲突严重程度（轻微重叠 vs 完全冲突）
- ✅ 提供智能建议（调整时间、拒绝邀请、标记优先级）
- ✅ 支持批量冲突检测，快速识别问题日程

---

## 2. 用户价值与场景

### 核心场景 1: 创建日程时实时检测冲突

**场景描述**:  
用户创建新日程时，系统自动检测是否与现有日程冲突。

**用户故事**:
```gherkin
As a 日程使用者
I want 创建日程时系统自动检测时间冲突
So that 我可以提前调整，避免时间安排混乱
```

**操作流程**:
1. 用户创建新日程："客户会议"
2. 设置时间：2025-10-22 14:00-15:00
3. 系统实时检测到冲突：
   - 已有日程："团队周会"，时间 14:30-15:30
   - 冲突类型：部分重叠（30 分钟）
4. 系统显示冲突警告：
   ```
   ⚠️ 时间冲突检测
   
   您的新日程与以下日程冲突：
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📅 团队周会
   时间：14:30-15:30
   冲突时长：30 分钟
   优先级：高
   
   建议操作：
   1. 调整新日程至 15:30-16:30（无冲突）
   2. 重新安排"团队周会"
   3. 标记"客户会议"为更高优先级
   ```
5. 用户可选择：
   - ✅ 应用建议时间
   - ⏰ 仍保存（标记冲突）
   - ❌ 取消创建

**预期结果**:
- 冲突检测响应时间 < 100ms
- Schedule 表新增 `conflicts` 字段：
  ```typescript
  readonly conflicts?: ScheduleConflict[];
  ```
- 冲突日程在日历上用特殊颜色标记（如橙色/红色）

---

### 核心场景 2: 查看冲突详情和严重程度

**场景描述**:  
用户查看某个冲突日程的详细信息，了解冲突严重程度。

**用户故事**:
```gherkin
As a 日程使用者
I want 查看冲突日程的详细信息和严重程度
So that 我可以决定如何处理冲突
```

**操作流程**:
1. 用户打开日程详情页
2. 系统展示冲突详情面板：
   ```
   冲突详情
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   冲突日程：
   ├─ 📅 团队周会（14:30-15:30）
   │   冲突时段：14:30-15:00（30 分钟）
   │   冲突严重程度：⚠️ 中等
   │   优先级：高
   │
   └─ 📅 项目复盘（14:00-14:30）
       冲突时段：14:00-14:30（30 分钟）
       冲突严重程度：🔴 严重（完全重叠）
       优先级：中
   
   总冲突时长：60 分钟
   建议：优先保留"团队周会"（优先级更高）
   ```
3. 用户可点击某个冲突日程跳转查看
4. 可一键发起重新协商（发送重排提醒）

**预期结果**:
- 冲突严重程度分级：
  | 严重程度 | 定义 | 标识 |
  |---------|------|------|
  | 轻微 | 重叠 < 15 分钟 | 🟡 黄色 |
  | 中等 | 重叠 15-60 分钟 | 🟠 橙色 |
  | 严重 | 重叠 > 60 分钟或完全重叠 | 🔴 红色 |
- 冲突时间段可视化展示（时间轴）

---

### 核心场景 3: 批量检测所有冲突日程

**场景描述**:  
用户一键检测所有日程，快速识别所有冲突。

**用户故事**:
```gherkin
As a 日程使用者
I want 批量检测所有日程的冲突
So that 我可以集中处理所有时间冲突问题
```

**操作流程**:
1. 用户打开日程管理页面
2. 点击"冲突检测"按钮
3. 系统扫描未来 30 天的所有日程
4. 展示冲突报告：
   ```
   冲突检测报告
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 统计数据
   - 总日程数：45 个
   - 冲突日程：8 个
   - 严重冲突：2 个
   - 中等冲突：3 个
   - 轻微冲突：3 个
   
   🔴 严重冲突（2 个）
   ├─ 2025-10-23：客户演示 vs 内部培训（完全重叠）
   └─ 2025-10-25：董事会 vs 项目评审（完全重叠）
   
   🟠 中等冲突（3 个）
   ├─ 2025-10-22：团队周会 vs 客户会议（30 分钟）
   ├─ 2025-10-24：午餐会 vs 代码审查（45 分钟）
   └─ 2025-10-26：培训 vs 一对一面谈（40 分钟）
   ```
5. 用户可逐个处理或批量操作

**预期结果**:
- 批量检测响应时间 < 3 秒（100 个日程）
- 支持导出冲突报告（PDF/CSV）
- 可按严重程度筛选

---

### 核心场景 4: 智能推荐解决方案

**场景描述**:  
系统根据冲突情况，智能推荐解决方案。

**用户故事**:
```gherkin
As a 日程使用者
I want 系统智能推荐冲突解决方案
So that 我可以快速解决冲突，无需手动思考
```

**操作流程**:
1. 用户查看冲突日程"客户会议"
2. 系统分析：
   - 客户会议：优先级 高，不可取消
   - 团队周会：优先级 中，可调整
   - 用户的空闲时间段：15:30-17:00, 19:00-20:00
3. 系统推荐 3 种方案：
   ```
   智能推荐方案
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   方案 1（推荐）⭐
   - 保留"客户会议"（14:00-15:00）
   - 将"团队周会"改至 15:30-16:30
   - 无新冲突，所有参与者有空
   
   方案 2
   - 保留"客户会议"（14:00-15:00）
   - 取消"团队周会"，发起重排投票
   
   方案 3
   - 调整"客户会议"至 10:00-11:00
   - 保留"团队周会"（14:30-15:30）
   - 需确认客户是否接受
   ```
4. 用户选择方案 1，一键应用
5. 系统自动更新日程并发送通知

**预期结果**:
- 推荐方案考虑：优先级、参与者可用性、历史偏好
- 支持"自动解决"功能（低优先级冲突自动调整）
- 记录用户选择，优化推荐算法

---

### 核心场景 5: 日程创建时预防性冲突检测

**场景描述**:  
用户在选择日程时间时，系统实时显示可用/冲突时段。

**用户故事**:
```gherkin
As a 日程使用者
I want 在选择时间时看到可用时段和冲突时段
So that 我可以直接选择无冲突的时间
```

**操作流程**:
1. 用户打开"创建日程"表单
2. 点击"选择时间"
3. 系统展示时间选择器，带冲突标记：
   ```
   选择时间（2025-10-22）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   09:00 ─────── ✅ 可用
   10:00 ─────── ✅ 可用
   11:00 ─────── ✅ 可用
   12:00 ─────── 🍽️ 午餐时间
   13:00 ─────── ✅ 可用
   14:00 ─────── ❌ 已有"团队周会"
   15:00 ─────── ❌ 已有"团队周会"（部分）
   16:00 ─────── ✅ 可用
   17:00 ─────── ✅ 可用
   18:00 ─────── 🏠 下班时间
   ```
4. 用户直接选择绿色（可用）时段
5. 冲突时段不可选或需二次确认

**预期结果**:
- 时间选择器实时更新可用性
- 支持"智能推荐时间"按钮（自动选择最佳空档）
- 考虑工作时间偏好（如避开午餐、早会时间）

---

### 核心场景 6: 与 Task 模块集成（任务截止时间冲突）

**场景描述**:  
检测任务截止时间是否与日程冲突，提前预警。

**用户故事**:
```gherkin
As a 任务执行者
I want 系统检测任务截止时间是否与日程冲突
So that 我可以提前调整，确保任务按时完成
```

**操作流程**:
1. 用户有任务"完成报告"，截止时间 2025-10-22 15:00
2. 用户当天 14:00-16:00 有"客户会议"日程
3. 系统检测到潜在冲突：
   ```
   ⚠️ 任务截止时间预警
   
   任务"完成报告"截止时间为 15:00，
   但您在 14:00-16:00 有"客户会议"。
   
   建议：
   1. 将报告提前至 13:00 前完成
   2. 延后报告截止时间至 17:00
   3. 缩短会议时长至 14:00-15:00
   ```
4. 用户选择方案并应用

**预期结果**:
- Task 与 Schedule 跨模块冲突检测
- 考虑任务预估时长（如 2 小时任务需在截止前 2 小时有空档）
- 支持任务自动排期（根据空闲时段）

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 更新聚合根：Schedule

**位置**: `packages/contracts/src/modules/schedule/aggregates/ScheduleServer.ts`

```typescript
export interface ScheduleServerDTO {
  // ...existing fields...
  
  // 冲突相关字段
  readonly conflicts?: ScheduleConflict[];      // 冲突列表
  readonly hasConflict: boolean;                // 是否有冲突
  readonly conflictSeverity?: ConflictSeverity; // 冲突严重程度
  readonly conflictResolved: boolean;           // 冲突是否已解决
}

/**
 * 日程冲突
 */
export interface ScheduleConflict {
  readonly conflictWithScheduleUuid: string;    // 冲突的日程 UUID
  readonly conflictWithScheduleName: string;    // 冲突日程名称
  readonly overlapStartTime: number;            // 重叠开始时间
  readonly overlapEndTime: number;              // 重叠结束时间
  readonly overlapDuration: number;             // 重叠时长（分钟）
  readonly severity: ConflictSeverity;          // 严重程度
  readonly detectedAt: number;                  // 检测时间
}

/**
 * 冲突严重程度
 */
export enum ConflictSeverity {
  MINOR = 'minor',        // 轻微（< 15 分钟）
  MODERATE = 'moderate',  // 中等（15-60 分钟）
  SEVERE = 'severe'       // 严重（> 60 分钟或完全重叠）
}

/**
 * 冲突解决方案
 */
export interface ConflictResolution {
  readonly type: 'reschedule' | 'cancel' | 'ignore' | 'adjust_priority';
  readonly description: string;
  readonly targetScheduleUuid: string;
  readonly newStartTime?: number;
  readonly newEndTime?: number;
  readonly confidence: number;  // 推荐置信度 (0-100)
}
```

---

### 交互设计

#### 1. 冲突检测触发时机

- ✅ 创建新日程时（实时检测）
- ✅ 修改日程时间时（实时检测）
- ✅ 接受会议邀请时（检测后再确认）
- ✅ 用户手动触发批量检测
- ✅ 每日凌晨自动检测未来 7 天冲突

#### 2. 冲突检测算法

```typescript
/**
 * 检测两个日程是否冲突
 */
function detectConflict(
  scheduleA: Schedule,
  scheduleB: Schedule
): ScheduleConflict | null {
  const startA = scheduleA.startTime;
  const endA = scheduleA.endTime;
  const startB = scheduleB.startTime;
  const endB = scheduleB.endTime;
  
  // 检测时间重叠
  const overlapStart = Math.max(startA, startB);
  const overlapEnd = Math.min(endA, endB);
  
  if (overlapStart >= overlapEnd) {
    return null; // 无冲突
  }
  
  const overlapDuration = (overlapEnd - overlapStart) / 60000; // 分钟
  
  // 判断严重程度
  let severity: ConflictSeverity;
  if (overlapDuration < 15) {
    severity = ConflictSeverity.MINOR;
  } else if (overlapDuration <= 60) {
    severity = ConflictSeverity.MODERATE;
  } else {
    severity = ConflictSeverity.SEVERE;
  }
  
  return {
    conflictWithScheduleUuid: scheduleB.uuid,
    conflictWithScheduleName: scheduleB.name,
    overlapStartTime: overlapStart,
    overlapEndTime: overlapEnd,
    overlapDuration,
    severity,
    detectedAt: Date.now()
  };
}
```

#### 3. 智能推荐算法

```typescript
/**
 * 生成冲突解决方案
 */
function generateResolutions(
  schedule: Schedule,
  conflicts: ScheduleConflict[]
): ConflictResolution[] {
  const resolutions: ConflictResolution[] = [];
  
  // 方案 1: 调整到最近的空闲时段
  const nearestFreeSlot = findNearestFreeSlot(schedule);
  if (nearestFreeSlot) {
    resolutions.push({
      type: 'reschedule',
      description: `将日程改至 ${formatTime(nearestFreeSlot.start)}`,
      targetScheduleUuid: schedule.uuid,
      newStartTime: nearestFreeSlot.start,
      newEndTime: nearestFreeSlot.end,
      confidence: 90
    });
  }
  
  // 方案 2: 取消低优先级冲突日程
  const lowerPrioritySchedules = conflicts
    .filter(c => c.priority < schedule.priority);
  if (lowerPrioritySchedules.length > 0) {
    resolutions.push({
      type: 'cancel',
      description: `取消优先级较低的 ${lowerPrioritySchedules[0].name}`,
      targetScheduleUuid: lowerPrioritySchedules[0].uuid,
      confidence: 70
    });
  }
  
  // 方案 3: 标记为高优先级，保持冲突
  resolutions.push({
    type: 'adjust_priority',
    description: '标记为高优先级，保持当前时间',
    targetScheduleUuid: schedule.uuid,
    confidence: 50
  });
  
  return resolutions.sort((a, b) => b.confidence - a.confidence);
}
```

---

## 4. MVP/MMP/Full 路径

### MVP: 基础冲突检测（1-1.5 周）

**范围**:
- ✅ 创建/修改日程时实时检测冲突
- ✅ 显示冲突警告（简单文本提示）
- ✅ 标记冲突严重程度（轻微/中等/严重）
- ✅ 批量冲突检测功能
- ✅ 冲突日程列表视图

**技术要点**:
- Contracts: 定义 `ScheduleConflict`, `ConflictSeverity`
- Domain: Schedule 聚合根添加 `detectConflicts()` 方法
- Application: `DetectScheduleConflictService` 应用服务
- API: `POST /api/v1/schedules/detect-conflicts`
- UI: 冲突警告组件 + 冲突列表页

**验收标准**:
```gherkin
Given 用户已有日程"团队周会"（14:30-15:30）
When 用户创建新日程"客户会议"（14:00-15:00）
Then 系统应检测到冲突
And 显示警告："与'团队周会'冲突 30 分钟"
And 冲突严重程度应标记为"中等"
```

---

### MMP: 智能解决方案（+1-2 周）

**在 MVP 基础上新增**:
- ✅ 智能推荐解决方案（3 个方案）
- ✅ 一键应用方案
- ✅ 时间选择器显示可用/冲突时段
- ✅ 冲突详情时间轴可视化
- ✅ 与 Task 模块集成（任务截止时间冲突）

**技术要点**:
- 推荐算法（基于优先级、参与者、历史偏好）
- 时间轴渲染组件
- Task-Schedule 跨模块查询

**验收标准**:
```gherkin
Given 用户有冲突日程"客户会议"
When 用户点击"查看解决方案"
Then 系统应显示 3 个推荐方案
And 方案 1 应为"调整至 15:30-16:30"
And 用户可一键应用方案
And 应用后冲突自动解决
```

---

### Full Release: 智能预测与协作（+2-3 周）

**在 MMP 基础上新增**:
- ✅ 预测未来冲突（基于历史模式）
- ✅ 多人日程协调（找到所有人的空闲时段）
- ✅ 自动解决低优先级冲突
- ✅ 冲突统计报表（月度冲突分析）
- ✅ 与外部日历同步（Google Calendar, Outlook）

**技术要点**:
- 机器学习预测模型
- 多人空闲时段算法
- 外部日历 API 集成

**验收标准**:
```gherkin
Given 系统分析了用户过去 3 个月的日程
When 系统检测到用户每周二 14:00 经常有冲突
Then 系统应预警："建议避免在周二 14:00 安排重要会议"
And 提供替代时间建议
```

---

## 5. 验收标准（Gherkin）

### Feature: 日程冲突检测

#### Scenario 1: 创建日程时检测冲突

```gherkin
Feature: 日程冲突检测
  作为日程使用者，我希望系统自动检测时间冲突并提供解决方案

  Background:
    Given 用户"吴九"已登录
    And 已有日程"团队周会"，时间为 2025-10-22 14:30-15:30

  Scenario: 检测到部分重叠冲突
    When 用户创建新日程"客户会议"
    And 设置时间为 2025-10-22 14:00-15:00
    Then 系统应检测到冲突
    And 冲突详情应为：
      | 字段                 | 值              |
      | conflictWith         | 团队周会        |
      | overlapStartTime     | 14:30           |
      | overlapEndTime       | 15:00           |
      | overlapDuration      | 30 分钟         |
      | severity             | moderate（中等）|
    And 显示警告："与'团队周会'冲突 30 分钟"

  Scenario: 检测到完全重叠冲突
    When 用户创建新日程"紧急会议"
    And 设置时间为 2025-10-22 14:00-16:00（完全覆盖周会）
    Then 冲突严重程度应为 severe（严重）
    And 显示红色警告图标
```

---

#### Scenario 2: 批量冲突检测

```gherkin
  Background:
    Given 用户有以下日程：
      | name       | date       | startTime | endTime |
      | 晨会       | 2025-10-22 | 09:00     | 09:30   |
      | 客户演示   | 2025-10-22 | 14:00     | 15:00   |
      | 团队周会   | 2025-10-22 | 14:30     | 15:30   |
      | 项目复盘   | 2025-10-23 | 10:00     | 11:00   |
      | 内部培训   | 2025-10-23 | 10:30     | 12:00   |

  Scenario: 执行批量冲突检测
    When 用户点击"冲突检测"
    Then 系统应扫描所有日程
    And 冲突报告应显示：
      | 统计项       | 值  |
      | 总日程数     | 5   |
      | 冲突日程     | 4   |
      | 严重冲突     | 1   |
      | 中等冲突     | 1   |
    And 冲突列表应包含：
      | date       | schedule1  | schedule2  | severity |
      | 2025-10-22 | 客户演示   | 团队周会   | moderate |
      | 2025-10-23 | 项目复盘   | 内部培训   | severe   |
```

---

#### Scenario 3: 智能推荐解决方案

```gherkin
  Background:
    Given "客户会议"（14:00-15:00）与"团队周会"（14:30-15:30）冲突
    And "客户会议"优先级为 高
    And "团队周会"优先级为 中
    And 用户在 15:30-17:00 无其他日程

  Scenario: 生成推荐方案
    When 用户查看"客户会议"的冲突详情
    And 点击"查看解决方案"
    Then 系统应显示 3 个推荐方案：
      | 方案 | 描述                              | 置信度 |
      | 1    | 将"团队周会"改至 15:30-16:30     | 90%    |
      | 2    | 调整"客户会议"至 10:00-11:00     | 70%    |
      | 3    | 标记"客户会议"为最高优先级，保持时间 | 50%    |
    And 方案 1 应标记为"推荐"

  Scenario: 应用推荐方案
    Given 系统已显示推荐方案
    When 用户选择方案 1
    And 点击"应用"
    Then "团队周会"的时间应更新为 15:30-16:30
    And "客户会议"的冲突状态应变为 resolved（已解决）
    And 系统应发送通知给"团队周会"的参与者
```

---

#### Scenario 4: 时间选择器显示冲突

```gherkin
  Background:
    Given 用户正在创建新日程
    And 选择日期为 2025-10-22
    And 当天已有以下日程：
      | name     | startTime | endTime |
      | 晨会     | 09:00     | 09:30   |
      | 午餐     | 12:00     | 13:00   |
      | 客户会议 | 14:00     | 15:00   |

  Scenario: 展示可用/冲突时段
    When 用户打开时间选择器
    Then 时间选择器应显示：
      | 时段       | 状态   | 标识 |
      | 08:00-09:00| 可用   | ✅   |
      | 09:00-10:00| 部分占用| 🟡   |
      | 10:00-12:00| 可用   | ✅   |
      | 12:00-13:00| 已占用 | ❌   |
      | 13:00-14:00| 可用   | ✅   |
      | 14:00-15:00| 已占用 | ❌   |
    And 已占用时段应不可选择
    And 可用时段应可直接点击
```

---

#### Scenario 5: 任务截止时间冲突检测

```gherkin
  Background:
    Given 用户有任务"完成报告"，截止时间为 2025-10-22 15:00
    And 任务预估时长为 2 小时
    And 用户在 13:00-16:00 有日程"客户会议"

  Scenario: 检测任务与日程冲突
    When 系统执行跨模块冲突检测
    Then 系统应识别潜在冲突：
      """
      任务"完成报告"截止于 15:00，需 2 小时完成，
      但您在 13:00-16:00 有"客户会议"，
      可能导致任务延误。
      """
    And 系统应发送预警通知
    And 建议：
      | 方案 | 描述                          |
      | 1    | 将报告提前至 11:00-13:00 完成 |
      | 2    | 延后报告截止时间至 18:00      |
      | 3    | 缩短会议时长至 13:00-14:00    |
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 冲突检测
{
  event: 'schedule_conflict_detected',
  properties: {
    scheduleUuid: string,
    conflictCount: number,
    maxSeverity: ConflictSeverity,
    totalOverlapMinutes: number
  }
}

// 解决方案应用
{
  event: 'conflict_resolution_applied',
  properties: {
    scheduleUuid: string,
    resolutionType: 'reschedule' | 'cancel' | 'ignore',
    isAutoResolution: boolean,
    confidence: number
  }
}

// 批量冲突检测
{
  event: 'batch_conflict_detection_executed',
  properties: {
    totalSchedules: number,
    conflictingSchedules: number,
    severeConflicts: number,
    executionTime: number  // ms
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 冲突检测准确率 | >99% | 正确检测的冲突数 / 实际冲突数 |
| 用户接受推荐方案率 | >60% | 应用推荐方案次数 / 查看次数 |
| 严重冲突发生率下降 | -40% | 启用功能后 vs 启用前 |
| 冲突检测响应时间 | P95 <100ms | API 响应时间监控 |

**定性指标**:
- 用户反馈"时间安排更清晰"
- 减少日程协调沟通成本
- 会议迟到/缺席率下降

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model Schedule {
  // ...existing fields...
  
  hasConflict          Boolean  @default(false) @map("has_conflict")
  conflictSeverity     String?  @map("conflict_severity")
  conflictResolved     Boolean  @default(false) @map("conflict_resolved")
  
  conflicts            ScheduleConflict[]
}

model ScheduleConflict {
  uuid                        String   @id @default(uuid())
  scheduleUuid                String   @map("schedule_uuid")
  conflictWithScheduleUuid    String   @map("conflict_with_schedule_uuid")
  conflictWithScheduleName    String   @map("conflict_with_schedule_name")
  overlapStartTime            BigInt   @map("overlap_start_time")
  overlapEndTime              BigInt   @map("overlap_end_time")
  overlapDuration             Int      @map("overlap_duration")  // 分钟
  severity                    String   // minor, moderate, severe
  detectedAt                  BigInt   @map("detected_at")
  resolvedAt                  BigInt?  @map("resolved_at")
  
  schedule                    Schedule @relation(fields: [scheduleUuid], references: [uuid])
  
  @@index([scheduleUuid])
  @@index([severity])
  @@map("schedule_conflicts")
}
```

### API 端点

```typescript
// 检测冲突
POST /api/v1/schedules/detect-conflicts
Body: { startTime: number, endTime: number, excludeUuids?: string[] }
Response: { conflicts: ScheduleConflict[] }

// 获取解决方案
GET /api/v1/schedules/:id/resolutions
Response: { resolutions: ConflictResolution[] }

// 应用解决方案
POST /api/v1/schedules/:id/apply-resolution
Body: { resolutionType: string, newStartTime?: number, newEndTime?: number }
Response: ScheduleClientDTO

// 批量冲突检测
POST /api/v1/schedules/batch-detect-conflicts
Body: { dateRange: { start: number, end: number } }
Response: { report: ConflictReport }
```

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| 检测算法误报 | 低 | 中 | 单元测试 + 边界场景覆盖 |
| 大量日程时性能问题 | 中 | 中 | 索引优化 + 缓存 + 分页 |
| 用户不理解推荐方案 | 中 | 中 | 清晰说明 + 可视化时间轴 |
| 外部日历同步延迟 | 中 | 高 | 增量同步 + 冲突标记 |

---

## 9. 参考资料

- [Schedule Contracts](../../../../packages/contracts/src/modules/schedule/)
- [Task Contracts](../../../../packages/contracts/src/modules/task/)
- [Calendar Conflict Detection Best Practices](https://developers.google.com/calendar/api/guides/conflicts)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow