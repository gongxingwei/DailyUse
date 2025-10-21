# Feature Spec: 任务进度快照

> **功能编号**: TASK-004  
> **RICE 评分**: 252 (Reach: 6, Impact: 6, Confidence: 7, Effort: 1)  
> **优先级**: P1  
> **预估时间**: 0.8-1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

在任务管理实践中，了解任务的进度变化历史对于识别瓶颈、优化流程至关重要，但现状存在以下问题：
- ❌ 任务状态变更历史无法追溯，不知道任务在哪个阶段停滞
- ❌ 无法对比不同时间点的任务进度，缺少历史数据支持
- ❌ 任务停滞无预警，发现时已严重延期
- ❌ 无法分析任务完成的时间规律（如哪些任务总是拖延）
- ❌ 团队协作时，成员之间无法了解任务的历史进展

### 目标用户

- **主要用户**: 项目经理、任务负责人、团队 Leader
- **次要用户**: 需要回顾工作历史的个人用户
- **典型画像**: "我想知道这个任务为什么延期了，它在哪个阶段停滞了多久"

### 价值主张

**一句话价值**: 自动记录任务状态和进度的快照，支持历史追溯和停滞检测

**核心收益**:
- ✅ 自动记录任务状态变更历史（待办 → 进行中 → 已完成）
- ✅ 定期快照任务进度（如每日快照）
- ✅ 智能检测任务停滞（超过 N 天无进展）
- ✅ 可视化任务进度时间线
- ✅ 分析任务完成时间规律

---

## 2. 用户价值与场景

### 核心场景 1: 自动记录状态变更快照

**场景描述**:  
任务状态变更时（如从"进行中"变为"已完成"），系统自动创建快照。

**用户故事**:
```gherkin
As a 任务负责人
I want 系统自动记录任务状态变更历史
So that 我可以追溯任务经历了哪些阶段
```

**操作流程**:
1. 用户有一个任务"开发登录功能"，当前状态为"待办"
2. 用户将状态改为"进行中"
3. 系统自动创建第一个快照：
   ```typescript
   {
     taskUuid: 'task-123',
     status: 'in-progress',
     previousStatus: 'todo',
     snapshotType: 'status_change',
     changedBy: 'user-456',
     changedAt: 1729497600000,
     metadata: {
       statusDuration: {
         todo: 172800000  // 在"待办"状态持续了2天
       }
     }
   }
   ```
4. 3天后，用户将状态改为"已完成"
5. 系统再次创建快照：
   ```typescript
   {
     taskUuid: 'task-123',
     status: 'done',
     previousStatus: 'in-progress',
     snapshotType: 'status_change',
     changedBy: 'user-456',
     changedAt: 1729756800000,
     metadata: {
       statusDuration: {
         todo: 172800000,      // 2天
         'in-progress': 259200000  // 3天
       },
       totalDuration: 432000000  // 总共5天
     }
   }
   ```

**预期结果**:
- 每次状态变更都创建快照
- 快照记录前后状态、变更时间、变更人
- 计算在每个状态的停留时长

---

### 核心场景 2: 定期进度快照（每日快照）

**场景描述**:  
系统每天定时为所有进行中的任务创建快照，记录当前进度。

**用户故事**:
```gherkin
As a 项目经理
I want 系统每天自动记录任务的进度快照
So that 我可以分析任务的进展速度
```

**操作流程**:
1. 系统定时任务在每天 00:00 执行
2. 查询所有状态为"进行中"的任务
3. 为每个任务创建每日快照：
   ```typescript
   {
     taskUuid: 'task-123',
     status: 'in-progress',
     snapshotType: 'daily',
     progress: 60,  // 当前进度 60%
     metadata: {
       estimatedTime: 480,     // 预估8小时
       actualTime: 360,        // 实际已用6小时
       remainingTime: 120,     // 剩余2小时
       completionRate: 0.75,   // 完成率 75%
       daysInProgress: 3       // 已进行3天
     },
     createdAt: 1729497600000
   }
   ```
4. 第二天同一时间，再次创建快照：
   ```typescript
   {
     taskUuid: 'task-123',
     status: 'in-progress',
     snapshotType: 'daily',
     progress: 80,  // 进度提升到 80%
     metadata: {
       progressDelta: 20,      // 较昨天提升了 20%
       dailyProgress: 20,      // 每日进展 20%
       estimatedCompletion: 1  // 预计还需1天完成
     },
     createdAt: 1729584000000
   }
   ```

**预期结果**:
- 每日快照记录任务进度
- 计算进度增量（今天 vs 昨天）
- 预测完成时间

---

### 核心场景 3: 任务停滞检测与预警

**场景描述**:  
系统检测到任务长时间无进展，自动发送停滞预警。

**用户故事**:
```gherkin
As a 项目经理
I want 系统自动检测任务停滞
So that 我可以及时介入，避免任务延期
```

**操作流程**:
1. 系统每日分析任务快照
2. 发现任务"开发支付模块"连续 3 天进度无变化：
   ```
   Day 1: 进度 30%
   Day 2: 进度 30%
   Day 3: 进度 30%  ⚠️ 停滞检测
   ```
3. 系统创建停滞快照：
   ```typescript
   {
     taskUuid: 'task-456',
     status: 'in-progress',
     snapshotType: 'stagnation_detected',
     progress: 30,
     metadata: {
       stagnationDays: 3,      // 停滞天数
       lastProgressDate: 1729324800000,  // 最后一次进展时间
       riskLevel: 'medium',    // 风险等级
       suggestion: '任务已停滞3天，建议检查是否遇到阻塞'
     },
     createdAt: 1729584000000
   }
   ```
4. 系统发送通知给任务负责人和项目经理：
   ```
   ⚠️ 任务停滞预警
   
   任务"开发支付模块"已连续 3 天无进展
   当前进度：30%
   停滞时间：2025-10-18 至 2025-10-21
   
   建议：
   - 检查是否遇到技术难题
   - 是否需要其他成员协助
   - 重新评估任务复杂度
   
   [查看详情] [标记已处理]
   ```

**预期结果**:
- 自动检测停滞（可配置停滞阈值，如 3 天）
- 分级风险（低/中/高）
- 发送预警通知
- 提供处理建议

---

### 核心场景 4: 查看任务进度时间线

**场景描述**:  
用户查看任务的完整进度时间线，了解任务历史。

**用户故事**:
```gherkin
As a 任务负责人
I want 查看任务的进度时间线
So that 我可以了解任务的完整演变过程
```

**操作流程**:
1. 用户打开任务详情页
2. 点击"进度历史"标签
3. 系统展示时间线视图：
   ```
   📊 任务进度时间线
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   2025-10-21 14:00  ✅ 任务完成
   ├─ 状态：进行中 → 已完成
   ├─ 进度：80% → 100%
   ├─ 用时：5 天
   └─ 操作人：郑十
   
   2025-10-20 16:00  📈 进度更新
   ├─ 进度：60% → 80%
   ├─ 每日进展：+20%
   └─ 预计完成：明天
   
   2025-10-19 09:00  📈 进度更新
   ├─ 进度：30% → 60%
   ├─ 每日进展：+30%
   └─ 状态：进展顺利
   
   2025-10-18 10:00  ⚠️ 停滞检测
   ├─ 进度：30%（3天无变化）
   ├─ 风险：中等
   └─ 建议：检查阻塞
   
   2025-10-16 14:00  ▶️ 开始执行
   ├─ 状态：待办 → 进行中
   ├─ 操作人：郑十
   └─ 预估时间：8 小时
   
   2025-10-15 10:00  📝 任务创建
   ├─ 状态：待办
   ├─ 优先级：高
   └─ 创建人：张三
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   总计：6 天（待办 1天，进行中 5天）
   平均每日进展：20%
   ```

**预期结果**:
- 时间线按时间倒序展示
- 显示所有关键事件（状态变更、进度更新、停滞检测）
- 可视化进度变化曲线

---

### 核心场景 5: 任务进度对比分析

**场景描述**:  
用户对比多个任务的进度，识别慢任务。

**用户故事**:
```gherkin
As a 项目经理
I want 对比多个任务的进度
So that 我可以识别哪些任务进展缓慢
```

**操作流程**:
1. 用户进入"任务看板"页面
2. 点击"进度分析"
3. 系统展示任务进度对比表：
   ```
   📊 任务进度对比（本周）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   任务名称            状态      进度    每日进展  停滞天数  风险
   ────────────────────────────────────────────────
   开发登录功能        已完成    100%    +20%      0        ✅
   开发支付模块        进行中     30%     0%       3        ⚠️
   数据库设计          进行中     70%    +10%      0        ✅
   API 接口开发        待办       0%      -        -        -
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   停滞任务：1 个
   平均进度：50%
   平均每日进展：+10%
   ```
4. 用户点击"开发支付模块"查看详情
5. 系统显示该任务的停滞原因和建议

**预期结果**:
- 多任务进度对比
- 识别停滞任务
- 计算团队平均进展速度

---

### 核心场景 6: 任务完成时间规律分析

**场景描述**:  
系统分析历史任务，识别用户的工作规律。

**用户故事**:
```gherkin
As a 任务负责人
I want 了解我的任务完成时间规律
So that 我可以优化时间估算和工作安排
```

**操作流程**:
1. 用户打开"数据洞察"页面
2. 选择"任务完成分析"
3. 系统展示分析报告：
   ```
   📊 任务完成时间分析（最近 30 天）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   总任务数：15 个
   已完成：12 个
   平均完成时间：3.2 天
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   按优先级分析
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   高优先级：平均 2.1 天（5 个）
   中优先级：平均 3.5 天（5 个）
   低优先级：平均 5.0 天（2 个）
   
   📌 洞察：高优先级任务完成速度快 40%
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   按任务类型分析
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   开发类：平均 4.0 天
   设计类：平均 2.5 天
   测试类：平均 1.8 天
   
   📌 洞察：开发类任务耗时最长，建议预估时增加 50%
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   停滞规律
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   停滞任务数：3 个
   平均停滞时长：2.3 天
   常见停滞原因：
   1. 等待他人反馈（2 个）
   2. 技术难题（1 个）
   
   📌 建议：对于依赖他人的任务，提前沟通
   ```

**预期结果**:
- 分析任务完成时间规律
- 按优先级、类型分组统计
- 识别停滞规律
- 提供优化建议

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 新增实体：TaskProgressSnapshot

**位置**: `packages/contracts/src/modules/task/entities/TaskProgressSnapshotServer.ts`

```typescript
/**
 * 任务进度快照
 */
export interface TaskProgressSnapshotServerDTO {
  readonly uuid: string;
  readonly taskUuid: string;
  readonly userUuid: string;
  readonly status: TaskStatus;              // 快照时的状态
  readonly previousStatus?: TaskStatus;     // 前一个状态（状态变更时）
  readonly progress?: number;               // 进度百分比（0-100）
  readonly snapshotType: SnapshotType;      // 快照类型
  readonly changedBy?: string;              // 变更操作人（状态变更时）
  readonly metadata?: SnapshotMetadata;     // 扩展元数据
  readonly createdAt: number;
}

/**
 * 快照类型
 */
export enum SnapshotType {
  STATUS_CHANGE = 'status_change',       // 状态变更快照
  DAILY = 'daily',                       // 每日定期快照
  STAGNATION_DETECTED = 'stagnation_detected', // 停滞检测快照
  MANUAL = 'manual'                      // 手动创建快照
}

/**
 * 快照元数据
 */
export interface SnapshotMetadata {
  // 状态停留时长（毫秒）
  readonly statusDuration?: Record<string, number>;
  
  // 总时长（毫秒）
  readonly totalDuration?: number;
  
  // 进度相关
  readonly progressDelta?: number;       // 进度增量
  readonly dailyProgress?: number;       // 每日进展
  readonly estimatedCompletion?: number; // 预计完成天数
  
  // 时间相关
  readonly estimatedTime?: number;       // 预估时间（分钟）
  readonly actualTime?: number;          // 实际时间（分钟）
  readonly remainingTime?: number;       // 剩余时间（分钟）
  readonly completionRate?: number;      // 完成率（0-1）
  readonly daysInProgress?: number;      // 已进行天数
  
  // 停滞检测
  readonly stagnationDays?: number;      // 停滞天数
  readonly lastProgressDate?: number;    // 最后一次进展时间
  readonly riskLevel?: 'low' | 'medium' | 'high'; // 风险等级
  readonly suggestion?: string;          // 建议
  
  // 其他
  readonly [key: string]: any;
}
```

#### 更新 Task 实体

**位置**: `packages/contracts/src/modules/task/entities/TaskServer.ts`

```typescript
export interface TaskServerDTO {
  // ...existing fields...
  
  // 进度快照相关
  readonly snapshots?: TaskProgressSnapshotServerDTO[];
  readonly lastSnapshotAt?: number;      // 最后一次快照时间
  readonly stagnationDetected?: boolean; // 是否检测到停滞
  readonly stagnationDays?: number;      // 停滞天数
}
```

---

### 交互设计

#### 1. 快照创建时机

| 触发条件 | 快照类型 | 自动/手动 |
|---------|---------|----------|
| 状态变更（待办→进行中→完成） | STATUS_CHANGE | 自动 |
| 每日定时任务（00:00） | DAILY | 自动 |
| 检测到停滞（连续N天无进展） | STAGNATION_DETECTED | 自动 |
| 用户手动创建快照 | MANUAL | 手动 |

#### 2. 停滞检测规则

```typescript
// 停滞检测配置（可自定义）
const stagnationConfig = {
  checkInterval: 'daily',      // 检测频率
  threshold: 3,                // 停滞阈值（天）
  progressThreshold: 0,        // 进度变化阈值（%）
  riskLevels: {
    low: 3,                    // 3天 - 低风险
    medium: 5,                 // 5天 - 中风险
    high: 7                    // 7天 - 高风险
  }
};
```

#### 3. 时间线可视化

```
进度曲线图：
  100% ┤                                    ●
   80% ┤                          ●─────────┘
   60% ┤                 ●────────┘
   40% ┤        ●────────┘
   20% ┤   ●────┘
    0% ┤───┘
       └────┬────┬────┬────┬────┬────┬────┬──
          Day1 Day2 Day3 Day4 Day5 Day6 Day7
          
状态时长饼图：
  ┌──────────────┐
  │ 待办: 1天 20%│
  │ 进行中: 4天 80%│
  └──────────────┘
```

---

## 4. MVP/MMP/Full 路径

### MVP: 基础快照与历史追溯（0.8-1 周）

**范围**:
- ✅ 状态变更自动快照
- ✅ 每日进度快照（定时任务）
- ✅ 快照数据存储
- ✅ 任务进度时间线查看
- ✅ 计算状态停留时长
- ✅ 基础停滞检测（超过 3 天无进展）

**技术要点**:
- Contracts: 定义 `TaskProgressSnapshotServerDTO`
- Domain: Task 聚合根添加 `createSnapshot()` 方法
- Application: `TaskSnapshotService` 应用服务
- Infrastructure: 定时任务（每日快照）+ 事件监听器（状态变更）
- API: `GET /api/v1/tasks/:taskUuid/snapshots`
- UI: 进度时间线组件

**验收标准**:
```gherkin
Given 用户将任务状态从"待办"改为"进行中"
When 系统处理状态变更
Then 应创建状态变更快照
And 记录前后状态和变更时间
And 时间线应显示该变更
```

---

### MMP: 停滞检测与预警（+0.5-1 周）

**在 MVP 基础上新增**:
- ✅ 智能停滞检测（多维度）
- ✅ 风险等级评估
- ✅ 停滞预警通知
- ✅ 任务进度对比分析
- ✅ 停滞原因标注
- ✅ 处理建议生成

**技术要点**:
- 停滞检测算法（进度变化率、时间阈值）
- 风险评分算法
- 与 Notification 模块集成

**验收标准**:
```gherkin
Given 任务连续 3 天进度无变化
When 系统执行每日检测
Then 应创建停滞检测快照
And 发送停滞预警通知
And 通知中包含风险等级和建议
```

---

### Full Release: 数据分析与洞察（+1-2 周）

**在 MMP 基础上新增**:
- ✅ 任务完成时间规律分析
- ✅ 按优先级/类型分组统计
- ✅ 停滞规律识别
- ✅ 预测任务完成时间（基于历史数据）
- ✅ 团队进度对比
- ✅ 可视化图表（进度曲线、时长饼图）

**技术要点**:
- 统计分析算法
- 预测模型（线性回归）
- 数据可视化（Chart.js）

**验收标准**:
```gherkin
Given 用户有 30 天的任务历史数据
When 用户查看"数据洞察"
Then 应显示任务完成时间分析
And 按优先级/类型分组统计
And 提供优化建议
```

---

## 5. 验收标准（Gherkin）

### Feature: 任务进度快照

#### Scenario 1: 状态变更自动快照

```gherkin
Feature: 任务进度快照
  作为任务负责人，我希望系统自动记录任务进度历史

  Background:
    Given 用户"郑十"已登录
    And 用户有一个任务"开发登录功能"
    And 任务当前状态为"待办"
    And 任务创建于 2025-10-15 10:00

  Scenario: 状态变更时创建快照
    When 用户将任务状态改为"进行中"
    And 当前时间为 2025-10-16 14:00
    Then 系统应创建快照：
      | 字段            | 值                    |
      | taskUuid        | task-123             |
      | status          | in-progress          |
      | previousStatus  | todo                 |
      | snapshotType    | status_change        |
      | changedBy       | user-456             |
      | createdAt       | 2025-10-16 14:00     |
    And metadata.statusDuration 应包含：
      | 状态   | 时长（毫秒） |
      | todo   | 100800000   |  // 1天4小时
    
    When 用户再次将状态改为"已完成"
    And 当前时间为 2025-10-21 14:00
    Then 系统应创建第二个快照
    And previousStatus 应为 "in-progress"
    And metadata.statusDuration 应包含：
      | 状态        | 时长（毫秒） |
      | todo        | 100800000   |
      | in-progress | 432000000   |  // 5天
```

---

#### Scenario 2: 每日进度快照

```gherkin
  Background:
    Given 任务"开发支付模块"状态为"进行中"
    And 任务当前进度为 30%
    And 当前日期为 2025-10-21

  Scenario: 定时任务创建每日快照
    When 系统定时任务在 00:00 执行
    Then 系统应为所有"进行中"任务创建快照
    And 任务"开发支付模块"的快照应包含：
      | 字段          | 值              |
      | snapshotType  | daily           |
      | status        | in-progress     |
      | progress      | 30              |
    And metadata 应包含：
      | 字段              | 值   |
      | daysInProgress    | 3    |
      | estimatedTime     | 480  |
      | actualTime        | 180  |

  Scenario: 第二天快照计算进度增量
    Given 昨天的快照进度为 30%
    When 今天 00:00 创建新快照
    And 当前进度为 50%
    Then metadata.progressDelta 应为 20
    And metadata.dailyProgress 应为 20
```

---

#### Scenario 3: 停滞检测

```gherkin
  Background:
    Given 任务"开发支付模块"有以下每日快照：
      | 日期       | 进度 |
      | 2025-10-18 | 30%  |
      | 2025-10-19 | 30%  |
      | 2025-10-20 | 30%  |
      | 2025-10-21 | 30%  |

  Scenario: 检测到停滞并创建快照
    When 系统执行停滞检测
    And 发现连续 3 天进度无变化
    Then 系统应创建停滞检测快照：
      | 字段          | 值                      |
      | snapshotType  | stagnation_detected     |
      | progress      | 30                      |
    And metadata 应包含：
      | 字段              | 值                                |
      | stagnationDays    | 3                                 |
      | lastProgressDate  | 2025-10-17（最后一次有进展）       |
      | riskLevel         | medium                            |
      | suggestion        | 任务已停滞3天，建议检查是否遇到阻塞 |
    And 系统应发送停滞预警通知
    And 通知接收人应包括任务负责人和项目经理
```

---

#### Scenario 4: 查看进度时间线

```gherkin
  Background:
    Given 任务"开发登录功能"有以下快照：
      | 时间              | 类型           | 状态       | 进度 |
      | 2025-10-15 10:00  | manual         | todo       | 0%   |
      | 2025-10-16 14:00  | status_change  | in-progress| 0%   |
      | 2025-10-17 00:00  | daily          | in-progress| 20%  |
      | 2025-10-18 00:00  | daily          | in-progress| 40%  |
      | 2025-10-19 00:00  | daily          | in-progress| 60%  |
      | 2025-10-21 14:00  | status_change  | done       | 100% |

  Scenario: 查看时间线
    When 用户打开任务详情页
    And 点击"进度历史"标签
    Then 应显示时间线视图
    And 时间线应包含 6 条记录
    And 应按时间倒序排列
    And 第1条应为"任务完成"（2025-10-21）
    And 最后1条应为"任务创建"（2025-10-15）
    And 应显示进度曲线图
    And 应显示状态时长统计：
      | 状态        | 时长   |
      | todo        | 1天    |
      | in-progress | 5天    |
```

---

#### Scenario 5: 任务进度对比

```gherkin
  Background:
    Given 项目有以下任务：
      | 任务名          | 状态       | 进度 | 停滞天数 |
      | 开发登录功能    | 已完成     | 100% | 0        |
      | 开发支付模块    | 进行中     | 30%  | 3        |
      | 数据库设计      | 进行中     | 70%  | 0        |

  Scenario: 查看任务进度对比
    When 用户打开"任务看板"
    And 点击"进度分析"
    Then 应显示任务进度对比表
    And 应标记停滞任务："开发支付模块"
    And 应计算平均进度：(100 + 30 + 70) / 3 = 66.7%
    And 应识别风险任务数量：1
    And 应提供建议："1个任务停滞，建议尽快介入"
```

---

#### Scenario 6: 数据分析与洞察

```gherkin
  Background:
    Given 用户在过去 30 天完成了以下任务：
      | 任务类型 | 优先级 | 完成时间（天） |
      | 开发     | 高     | 3              |
      | 开发     | 高     | 2              |
      | 设计     | 中     | 2              |
      | 测试     | 低     | 1              |
      | 开发     | 中     | 5              |

  Scenario: 查看任务完成时间分析
    When 用户打开"数据洞察"页面
    And 选择"任务完成分析"
    Then 应显示总任务数：5
    And 应计算平均完成时间：(3+2+2+1+5)/5 = 2.6 天
    And 应按优先级分组统计：
      | 优先级 | 平均时间 | 数量 |
      | 高     | 2.5天    | 2    |
      | 中     | 3.5天    | 2    |
      | 低     | 1.0天    | 1    |
    And 应按类型分组统计：
      | 类型 | 平均时间 | 数量 |
      | 开发 | 3.3天    | 3    |
      | 设计 | 2.0天    | 1    |
      | 测试 | 1.0天    | 1    |
    And 应提供洞察："开发类任务耗时最长，建议预估时增加50%"
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 快照创建
{
  event: 'task_snapshot_created',
  properties: {
    snapshotType: SnapshotType,
    taskStatus: TaskStatus,
    progress: number,
    hasProgressChange: boolean
  }
}

// 停滞检测
{
  event: 'task_stagnation_detected',
  properties: {
    taskUuid: string,
    stagnationDays: number,
    riskLevel: 'low' | 'medium' | 'high',
    currentProgress: number
  }
}

// 时间线查看
{
  event: 'task_timeline_viewed',
  properties: {
    taskUuid: string,
    snapshotCount: number,
    taskDuration: number  // 任务总时长（天）
  }
}

// 数据洞察查看
{
  event: 'task_insights_viewed',
  properties: {
    analyzedTaskCount: number,
    timeRange: number  // 分析时间范围（天）
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 快照创建成功率 | >99% | 成功创建快照数 / 尝试创建数 |
| 停滞检测准确率 | >85% | 准确识别停滞任务数 / 实际停滞数 |
| 停滞预警响应时间 | <1天 | 从检测到处理的平均时间 |
| 时间线查看率 | >30% | 查看时间线的任务数 / 总任务数 |

**定性指标**:
- 用户反馈"更清楚任务的演变过程"
- 停滞任务被及时识别和处理
- 时间估算准确率提升

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model TaskProgressSnapshot {
  uuid            String   @id @default(uuid())
  taskUuid        String   @map("task_uuid")
  userUuid        String   @map("user_uuid")
  status          String   @map("status")
  previousStatus  String?  @map("previous_status")
  progress        Int?     @map("progress")
  snapshotType    String   @map("snapshot_type")
  changedBy       String?  @map("changed_by")
  metadata        Json?    @map("metadata")
  createdAt       DateTime @default(now()) @map("created_at")
  
  task            Task     @relation(fields: [taskUuid], references: [uuid])
  user            Account  @relation(fields: [userUuid], references: [uuid])
  
  @@index([taskUuid, createdAt(sort: Desc)])
  @@index([userUuid, snapshotType])
  @@index([snapshotType, createdAt])
  @@map("task_progress_snapshots")
}

// 更新 Task 模型
model Task {
  // ...existing fields...
  
  snapshots           TaskProgressSnapshot[]
  lastSnapshotAt      BigInt?   @map("last_snapshot_at")
  stagnationDetected  Boolean   @default(false) @map("stagnation_detected")
  stagnationDays      Int?      @map("stagnation_days")
}
```

### Application Service

```typescript
// packages/domain-server/src/modules/task/application/TaskSnapshotService.ts

export class TaskSnapshotService {
  // 创建状态变更快照
  async createStatusChangeSnapshot(
    task: Task,
    previousStatus: TaskStatus,
    changedBy: string
  ): Promise<TaskProgressSnapshot> {
    const statusDuration = this.calculateStatusDuration(task, previousStatus);
    
    const snapshot = new TaskProgressSnapshot({
      taskUuid: task.uuid,
      userUuid: task.userUuid,
      status: task.status,
      previousStatus,
      snapshotType: SnapshotType.STATUS_CHANGE,
      changedBy,
      metadata: {
        statusDuration,
        totalDuration: Date.now() - task.createdAt
      }
    });
    
    await this.snapshotRepository.save(snapshot);
    return snapshot;
  }
  
  // 创建每日快照
  async createDailySnapshots(): Promise<void> {
    const inProgressTasks = await this.taskRepository.findByStatus(TaskStatus.IN_PROGRESS);
    
    for (const task of inProgressTasks) {
      const lastSnapshot = await this.snapshotRepository.findLatest(task.uuid);
      const progressDelta = lastSnapshot ? task.progress - lastSnapshot.progress : 0;
      
      const snapshot = new TaskProgressSnapshot({
        taskUuid: task.uuid,
        userUuid: task.userUuid,
        status: task.status,
        progress: task.progress,
        snapshotType: SnapshotType.DAILY,
        metadata: {
          progressDelta,
          dailyProgress: progressDelta,
          daysInProgress: this.calculateDaysInProgress(task),
          estimatedTime: task.estimatedTime,
          actualTime: task.actualTime
        }
      });
      
      await this.snapshotRepository.save(snapshot);
    }
  }
  
  // 停滞检测
  async detectStagnation(): Promise<void> {
    const inProgressTasks = await this.taskRepository.findByStatus(TaskStatus.IN_PROGRESS);
    
    for (const task of inProgressTasks) {
      const recentSnapshots = await this.snapshotRepository.findRecent(
        task.uuid,
        3  // 最近3天
      );
      
      const isStagnant = this.isTaskStagnant(recentSnapshots);
      
      if (isStagnant) {
        const stagnationDays = this.calculateStagnationDays(recentSnapshots);
        const riskLevel = this.assessRiskLevel(stagnationDays);
        
        const snapshot = new TaskProgressSnapshot({
          taskUuid: task.uuid,
          userUuid: task.userUuid,
          status: task.status,
          progress: task.progress,
          snapshotType: SnapshotType.STAGNATION_DETECTED,
          metadata: {
            stagnationDays,
            riskLevel,
            lastProgressDate: this.getLastProgressDate(recentSnapshots),
            suggestion: this.generateSuggestion(stagnationDays, riskLevel)
          }
        });
        
        await this.snapshotRepository.save(snapshot);
        
        // 发送预警通知
        await this.notificationService.sendStagnationAlert(task, snapshot);
      }
    }
  }
  
  private isTaskStagnant(snapshots: TaskProgressSnapshot[]): boolean {
    if (snapshots.length < 3) return false;
    
    const progresses = snapshots.map(s => s.progress);
    const uniqueProgresses = new Set(progresses);
    
    return uniqueProgresses.size === 1;  // 所有进度都相同
  }
  
  private assessRiskLevel(stagnationDays: number): 'low' | 'medium' | 'high' {
    if (stagnationDays >= 7) return 'high';
    if (stagnationDays >= 5) return 'medium';
    return 'low';
  }
}
```

### API 端点

```typescript
// 获取任务快照列表
GET /api/v1/tasks/:taskUuid/snapshots?type=all&limit=50
Response: {
  snapshots: TaskProgressSnapshotClientDTO[],
  total: number
}

// 创建手动快照
POST /api/v1/tasks/:taskUuid/snapshots
Body: { note?: string }
Response: TaskProgressSnapshotClientDTO

// 获取任务进度时间线
GET /api/v1/tasks/:taskUuid/timeline
Response: {
  timeline: TimelineItem[],
  statistics: {
    totalDuration: number,
    statusDurations: Record<string, number>,
    avgDailyProgress: number
  }
}

// 获取任务完成时间分析
GET /api/v1/tasks/insights/completion-time?days=30
Response: {
  totalTasks: number,
  completedTasks: number,
  avgCompletionTime: number,
  byPriority: AnalysisByPriority[],
  byType: AnalysisByType[],
  stagnationPatterns: StagnationPattern[]
}

// 获取停滞任务列表
GET /api/v1/tasks/stagnant?riskLevel=all
Response: {
  stagnantTasks: TaskClientDTO[],
  total: number
}
```

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| 快照数据量过大 | 中 | 中 | 定期归档（保留90天）+ 分页查询 |
| 定时任务失败 | 低 | 高 | 失败重试 + 监控告警 |
| 停滞检测误报 | 中 | 中 | 可配置阈值 + 人工确认 |
| 性能影响（大量任务） | 中 | 中 | 异步队列处理 + 批量操作 |

---

## 9. 后续增强方向

### Phase 2 功能
- 🔄 自定义快照规则（用户定义何时创建快照）
- 📊 更多数据分析维度（按团队、按项目）
- 🤖 AI 预测任务完成时间
- 📱 停滞预警移动端推送

### Phase 3 功能
- 🔗 与 Goal 模块集成（目标下的任务整体进度分析）
- 👥 团队进度对比与排名
- 🎯 基于历史数据的智能时间估算建议
- 📈 进度趋势预测（机器学习）

---

## 10. 参考资料

- [Task Contracts](../../../../packages/contracts/src/modules/task/)
- [时间序列数据库最佳实践](https://en.wikipedia.org/wiki/Time_series_database)
- [停滞检测算法](https://en.wikipedia.org/wiki/Change_detection)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:
- 创建: 2025-10-21
- 创建者: PO Agent  
- 版本: 1.0
- 下次更新: Sprint Planning 前
