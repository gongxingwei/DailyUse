# Feature Spec: 日程自动同步

> **功能编号**: SCHEDULE-003  
> **RICE 评分**: 196 (Reach: 7, Impact: 7, Confidence: 8, Effort: 2)  
> **优先级**: P1  
> **预估时间**: 1.5-2 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

现代用户通常使用多个日历系统（Google Calendar、Outlook、Apple Calendar），但现有工具存在以下问题：
- ❌ 日程分散在多个平台，需要手动同步
- ❌ 外部日历变更无法及时反映到应用中
- ❌ 应用内创建的日程无法同步到外部日历
- ❌ 双向同步容易产生冲突和重复
- ❌ 缺少统一的日程视图

### 目标用户

- **主要用户**: 同时使用多个日历系统的职场人士
- **次要用户**: 需要团队日程协同的项目经理
- **典型画像**: "我的会议在 Google Calendar，但任务在 DailyUse，需要来回切换很麻烦"

### 价值主张

**一句话价值**: 自动同步外部日历（Google/Outlook/Apple），统一管理所有日程

**核心收益**:
- ✅ 一键连接外部日历（OAuth 授权）
- ✅ 实时双向同步日程
- ✅ 智能冲突检测与解决
- ✅ 统一日程视图
- ✅ 支持选择性同步（按日历、标签筛选）

---

## 2. 用户价值与场景

### 核心场景 1: 连接外部日历

**场景描述**:  
用户通过 OAuth 授权连接 Google Calendar 账号。

**用户故事**:
```gherkin
As a 日程管理者
I want 连接我的 Google Calendar
So that 自动同步所有日程
```

**操作流程**:
1. 用户打开设置页面，进入"日历同步"选项
2. 看到支持的日历服务：
   ```
   日历同步设置
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   连接外部日历服务
   
   📅 Google Calendar
      同步您的 Google 日历到 DailyUse
      [连接]
   
   📅 Microsoft Outlook
      同步 Outlook 日历和会议
      [连接]
   
   📅 Apple Calendar (iCloud)
      通过 CalDAV 协议同步
      [连接]
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   已连接的日历 (0)
   ```
3. 用户点击"Google Calendar"的"连接"
4. 系统跳转到 Google OAuth 授权页面：
   ```
   Google 授权
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DailyUse 请求访问您的 Google 账号
   
   📧 user@example.com
   
   DailyUse 将获得以下权限：
   ✓ 查看您的日历
   ✓ 创建和编辑日历事件
   ✓ 删除日历事件
   
   [允许]  [拒绝]
   ```
5. 用户点击"允许"
6. 系统获取 Access Token 和 Refresh Token
7. 跳转回 DailyUse，显示连接成功：
   ```
   ✅ 连接成功
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   已连接到 Google Calendar (user@example.com)
   
   发现 3 个日历：
   ☑️ 工作日历 (12 个事件)
   ☑️ 个人日历 (5 个事件)
   ☐ 节假日 (36 个事件)
   
   同步设置：
   🔄 双向同步: 开启
      DailyUse ↔ Google Calendar
   
   ⏱️ 同步频率: 每 15 分钟
   
   [开始同步]  [稍后设置]
   ```
8. 用户点击"开始同步"
9. 系统执行首次全量同步：
   ```
   正在同步...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   已同步: 17 个事件
   ━━━━━━━━━━━━━━━━━━━━ 100%
   
   同步完成！
   - 导入事件: 17
   - 创建日程: 17
   - 跳过重复: 0
   
   [查看日程]
   ```

**预期结果**:
- OAuth 授权成功
- 获取用户的所有日历列表
- 支持选择同步的日历
- 执行首次全量同步

---

### 核心场景 2: 实时双向同步

**场景描述**:  
外部日历变更自动同步到 DailyUse，DailyUse 的修改也同步回外部日历。

**用户故事**:
```gherkin
As a 日程管理者
I want 双向同步日程
So that 两边的数据始终保持一致
```

**操作流程（外部 → 应用）**:
1. 用户在 Google Calendar 中创建新会议：
   ```
   标题: 产品评审会议
   时间: 2025-10-22 14:00-15:00
   参与者: team@example.com
   描述: 讨论 Q4 产品规划
   ```
2. Google 通过 Webhook 推送变更通知：
   ```json
   {
     "kind": "calendar#event",
     "status": "confirmed",
     "summary": "产品评审会议",
     "start": { "dateTime": "2025-10-22T14:00:00+08:00" },
     "end": { "dateTime": "2025-10-22T15:00:00+08:00" },
     "attendees": [{ "email": "team@example.com" }]
   }
   ```
3. DailyUse 接收 Webhook，创建对应日程：
   ```typescript
   {
     uuid: 'schedule-123',
     title: '产品评审会议',
     startTime: 1729580400000,
     endTime: 1729584000000,
     externalCalendar: {
       provider: 'google',
       calendarId: 'primary',
       eventId: 'google-event-456',
       syncStatus: 'synced'
     }
   }
   ```
4. 用户在 DailyUse 日程视图中看到新日程：
   ```
   2025-10-22 周二
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   14:00 - 15:00  产品评审会议
                  📅 来自 Google Calendar
                  👥 team@example.com
                  [查看详情]
   ```

**操作流程（应用 → 外部）**:
1. 用户在 DailyUse 中修改日程时间：
   ```
   原时间: 14:00-15:00
   新时间: 15:00-16:00
   ```
2. 系统检测到日程关联了外部日历
3. 调用 Google Calendar API 更新：
   ```typescript
   await googleCalendar.events.patch({
     calendarId: 'primary',
     eventId: 'google-event-456',
     requestBody: {
       start: { dateTime: '2025-10-22T15:00:00+08:00' },
       end: { dateTime: '2025-10-22T16:00:00+08:00' }
     }
   });
   ```
4. 更新成功后显示通知：
   ```
   ✅ 同步成功
   日程已更新到 Google Calendar
   ```
5. 如果同步失败（如网络错误），显示警告：
   ```
   ⚠️ 同步失败
   日程已在 DailyUse 中更新，但未能同步到 Google Calendar
   
   错误原因: 网络连接超时
   
   [重试同步]  [稍后处理]
   ```

**预期结果**:
- 外部变更实时推送到应用
- 应用修改实时同步到外部
- 同步失败有明确提示和重试机制

---

### 核心场景 3: 冲突检测与解决

**场景描述**:  
同一日程在两边同时修改，系统检测冲突并提供解决方案。

**用户故事**:
```gherkin
As a 日程管理者
I want 自动检测同步冲突
So that 避免数据不一致
```

**操作流程**:
1. 用户在 DailyUse 中修改日程标题：
   ```
   原标题: 产品评审会议
   新标题: 产品评审会议（修改版）
   修改时间: 14:30
   ```
2. 同时，其他参与者在 Google Calendar 中修改了同一日程：
   ```
   原标题: 产品评审会议
   新标题: Q4 产品评审会议
   修改时间: 14:32
   ```
3. 系统检测到冲突（基于 `updated` 时间戳）：
   ```typescript
   // DailyUse 版本
   {
     title: '产品评审会议（修改版）',
     updatedAt: 1729584600000  // 14:30
   }
   
   // Google 版本
   {
     title: 'Q4 产品评审会议',
     updated: '2025-10-22T14:32:00+08:00'  // 14:32 (更新)
   }
   ```
4. 系统弹出冲突解决对话框：
   ```
   ⚠️ 同步冲突
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   该日程在 DailyUse 和 Google Calendar 中都被修改
   
   DailyUse 版本 (14:30)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   标题: 产品评审会议（修改版）
   时间: 2025-10-22 15:00-16:00
   
   Google Calendar 版本 (14:32) ← 更新
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   标题: Q4 产品评审会议
   时间: 2025-10-22 14:00-15:00
   
   如何解决：
   🔘 使用 Google 版本（推荐，更新）
      将覆盖 DailyUse 的修改
   
   ⚪ 使用 DailyUse 版本
      将覆盖 Google 的修改
   
   ⚪ 手动合并
      自己选择保留哪些字段
   
   [解决冲突]  [稍后处理]
   ```
5. 用户选择"使用 Google 版本"
6. 系统更新 DailyUse 中的日程并标记为已解决：
   ```
   ✅ 冲突已解决
   已采用 Google Calendar 版本
   
   日程已更新为: Q4 产品评审会议
   ```

**预期结果**:
- 自动检测冲突（基于时间戳）
- 提供多种解决方案
- 默认推荐最新版本
- 支持手动合并

---

### 核心场景 4: 选择性同步

**场景描述**:  
用户可选择只同步特定日历或特定类型的日程。

**用户故事**:
```gherkin
As a 日程管理者
I want 选择性同步日程
So that 只导入我需要的内容
```

**操作流程**:
1. 用户打开同步设置
2. 看到已连接的 Google Calendar：
   ```
   Google Calendar 同步设置
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   账号: user@example.com
   
   选择要同步的日历：
   ☑️ 工作日历 (primary)
      最后同步: 2 分钟前
      [查看日程]
   
   ☑️ 个人日历 (personal)
      最后同步: 2 分钟前
      [查看日程]
   
   ☐ 节假日 (holidays)
      跳过此日历
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   高级筛选
   
   只同步包含以下关键词的日程：
   [会议, 评审, 站会]
   
   排除包含以下关键词的日程：
   [休假, 个人]
   
   同步时间范围：
   🔘 过去 7 天 + 未来 30 天
   ⚪ 过去 30 天 + 未来 90 天
   ⚪ 全部历史记录
   
   [保存设置]
   ```
3. 用户取消勾选"节假日"日历
4. 添加关键词筛选："会议, 评审"
5. 点击"保存设置"
6. 系统重新同步并应用筛选：
   ```
   正在重新同步...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   已同步: 12 个事件（符合筛选条件）
   已跳过: 5 个事件（不符合筛选条件）
   已移除: 36 个事件（节假日日历）
   
   [完成]
   ```

**预期结果**:
- 支持按日历选择同步
- 支持关键词筛选
- 支持时间范围筛选
- 实时应用筛选规则

---

### 核心场景 5: 同步状态监控

**场景描述**:  
用户查看同步状态和历史记录。

**用户故事**:
```gherkin
As a 日程管理者
I want 查看同步状态
So that 了解同步是否正常
```

**操作流程**:
1. 用户打开同步状态页面：
   ```
   同步状态
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   📅 Google Calendar (user@example.com)
   状态: ✅ 正常同步
   最后同步: 3 分钟前
   下次同步: 12 分钟后
   
   同步统计:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   今日同步: 24 次
   导入事件: 156
   导出事件: 42
   失败次数: 0
   
   [手动同步]  [查看日志]
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   📅 Outlook Calendar (work@company.com)
   状态: ⚠️ 同步延迟
   最后同步: 35 分钟前
   原因: API 限流
   
   [重试]  [查看详情]
   ```
2. 用户点击"查看日志"
3. 显示详细同步日志：
   ```
   同步日志
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   2025-10-21 15:30  ✅ 同步成功
   导入 2 个新事件，更新 1 个事件
   
   2025-10-21 15:15  ✅ 同步成功
   更新 3 个事件
   
   2025-10-21 15:00  ⚠️ 部分成功
   导入 5 个事件，1 个失败
   详情: "团队周会" 与现有日程冲突
   
   2025-10-21 14:45  ✅ 同步成功
   导入 1 个事件
   
   2025-10-21 14:30  ❌ 同步失败
   错误: Token 已过期
   操作: 自动刷新 Token 并重试
   
   [导出日志]  [清除日志]
   ```

**预期结果**:
- 实时显示同步状态
- 显示同步统计数据
- 详细的同步日志
- 失败原因和重试机制

---

### 核心场景 6: 断开连接与数据处理

**场景描述**:  
用户断开外部日历连接，选择数据保留策略。

**用户故事**:
```gherkin
As a 日程管理者
I want 断开日历连接
So that 不再同步但保留已有数据
```

**操作流程**:
1. 用户打开日历同步设置
2. 点击"Google Calendar"的"断开连接"
3. 系统弹出确认对话框：
   ```
   ⚠️ 断开连接
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   确定要断开与 Google Calendar 的连接？
   
   当前已同步: 156 个日程
   
   断开后如何处理这些日程？
   
   🔘 保留所有日程
      日程保留在 DailyUse，但不再同步更新
      推荐：如果您想保留这些日程作为历史记录
   
   ⚪ 删除所有同步的日程
      仅保留手动创建的日程
      推荐：如果这些日程不再需要
   
   ⚪ 标记为只读
      保留日程但不可编辑
      推荐：如果您想保留但不想误修改
   
   ⚠️ 注意：断开后，DailyUse 中的修改将不会同步回 Google Calendar
   
   [确认断开]  [取消]
   ```
4. 用户选择"保留所有日程"
5. 点击"确认断开"
6. 系统执行断开流程：
   ```typescript
   // 1. 撤销 OAuth Token
   await revokeGoogleToken(refreshToken);
   
   // 2. 更新日程状态
   await updateSchedules({
     filter: { externalCalendar: { provider: 'google' } },
     data: {
       externalCalendar: null,  // 移除外部关联
       metadata: { 
         originalProvider: 'google',
         disconnectedAt: Date.now()
       }
     }
   });
   
   // 3. 删除同步配置
   await deleteSyncConfig(userId, 'google');
   ```
7. 显示成功消息：
   ```
   ✅ 已断开连接
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Google Calendar 连接已断开
   
   已保留 156 个日程
   这些日程将不再与 Google 同步
   
   [返回设置]
   ```

**预期结果**:
- 支持断开连接
- 提供多种数据处理策略
- 撤销 OAuth 授权
- 清理同步配置

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 新增实体：ExternalCalendarConnection（外部日历连接）

**位置**: `packages/contracts/src/modules/schedule/entities/ExternalCalendarConnectionServer.ts`

```typescript
/**
 * 外部日历连接
 */
export interface ExternalCalendarConnectionServerDTO {
  readonly uuid: string;
  readonly userId: string;
  readonly provider: CalendarProvider;     // 日历服务商
  readonly providerAccountId: string;      // 服务商账号 ID
  readonly email: string;                  // 账号邮箱
  readonly accessToken: string;            // 访问令牌（加密存储）
  readonly refreshToken: string;           // 刷新令牌（加密存储）
  readonly tokenExpiresAt: number;         // Token 过期时间
  readonly syncConfig: SyncConfig;         // 同步配置
  readonly syncStatus: SyncStatus;         // 同步状态
  readonly lastSyncAt?: number;            // 最后同步时间
  readonly lastSyncError?: string;         // 最后同步错误
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * 日历服务商
 */
export enum CalendarProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  APPLE = 'apple',
  CALDAV = 'caldav'
}

/**
 * 同步配置
 */
export interface SyncConfig {
  readonly enabled: boolean;               // 是否启用同步
  readonly bidirectional: boolean;         // 是否双向同步
  readonly syncInterval: number;           // 同步间隔（分钟）
  readonly selectedCalendars: string[];    // 选择的日历 ID
  readonly keywordFilter?: KeywordFilter;  // 关键词筛选
  readonly timeRange: TimeRange;           // 时间范围
}

/**
 * 关键词筛选
 */
export interface KeywordFilter {
  readonly include?: string[];             // 包含关键词
  readonly exclude?: string[];             // 排除关键词
}

/**
 * 时间范围
 */
export interface TimeRange {
  readonly pastDays: number;               // 过去天数
  readonly futureDays: number;             // 未来天数
}

/**
 * 同步状态
 */
export enum SyncStatus {
  ACTIVE = 'active',                       // 正常同步
  PAUSED = 'paused',                       // 暂停
  ERROR = 'error',                         // 错误
  TOKEN_EXPIRED = 'token_expired'          // Token 过期
}
```

#### 新增实体：SyncLog（同步日志）

**位置**: `packages/contracts/src/modules/schedule/entities/SyncLogServer.ts`

```typescript
/**
 * 同步日志
 */
export interface SyncLogServerDTO {
  readonly uuid: string;
  readonly connectionUuid: string;         // 连接 UUID
  readonly syncType: SyncType;             // 同步类型
  readonly status: 'success' | 'partial' | 'failed';
  readonly startTime: number;
  readonly endTime: number;
  readonly eventsImported: number;         // 导入事件数
  readonly eventsExported: number;         // 导出事件数
  readonly eventsFailed: number;           // 失败事件数
  readonly errorDetails?: ErrorDetail[];   // 错误详情
  readonly createdAt: number;
}

/**
 * 同步类型
 */
export enum SyncType {
  FULL = 'full',                           // 全量同步
  INCREMENTAL = 'incremental',             // 增量同步
  MANUAL = 'manual'                        // 手动同步
}

/**
 * 错误详情
 */
export interface ErrorDetail {
  readonly eventId: string;
  readonly errorType: string;
  readonly errorMessage: string;
  readonly retryable: boolean;
}
```

#### 更新 Schedule 实体

**位置**: `packages/contracts/src/modules/schedule/entities/ScheduleServer.ts`

```typescript
export interface ScheduleServerDTO {
  // ...existing fields...
  
  // 外部日历同步相关
  readonly externalCalendar?: ExternalCalendarInfo;
  readonly syncStatus?: 'synced' | 'pending' | 'conflict' | 'failed';
  readonly lastSyncAt?: number;
}

/**
 * 外部日历信息
 */
export interface ExternalCalendarInfo {
  readonly provider: CalendarProvider;
  readonly calendarId: string;             // 外部日历 ID
  readonly eventId: string;                // 外部事件 ID
  readonly etag?: string;                  // 用于冲突检测
  readonly updated?: number;               // 外部更新时间
}
```

---

### 交互设计

#### 1. OAuth 授权流程

```typescript
// Google Calendar OAuth 流程
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]
});

// 用户授权后回调
const { tokens } = await oauth2Client.getToken(code);

// 保存 Token（加密）
await saveConnection({
  provider: 'google',
  accessToken: encrypt(tokens.access_token),
  refreshToken: encrypt(tokens.refresh_token),
  tokenExpiresAt: tokens.expiry_date
});
```

#### 2. 同步策略

| 同步类型 | 触发条件 | 同步内容 |
|---------|---------|---------|
| 全量同步 | 首次连接 | 所有历史事件 |
| 增量同步 | 定时任务（15 分钟） | 自上次同步后的变更 |
| Webhook 推送 | 外部变更（实时） | 单个事件变更 |
| 手动同步 | 用户点击 | 立即执行增量同步 |

#### 3. 冲突解决规则

```typescript
// 冲突检测
function detectConflict(localEvent: Schedule, remoteEvent: GoogleEvent): boolean {
  return (
    localEvent.updatedAt > localEvent.lastSyncAt &&
    remoteEvent.updated > localEvent.lastSyncAt
  );
}

// 冲突解决
function resolveConflict(
  local: Schedule, 
  remote: GoogleEvent, 
  strategy: 'local' | 'remote' | 'latest'
): Schedule {
  if (strategy === 'latest') {
    return local.updatedAt > remote.updated ? local : convertToSchedule(remote);
  }
  return strategy === 'local' ? local : convertToSchedule(remote);
}
```

---

## 4. MVP/MMP/Full 路径

### MVP: 基础同步功能（1.5-2 周）

**范围**:
- ✅ Google Calendar OAuth 连接
- ✅ 单向同步（外部 → 应用）
- ✅ 手动触发同步
- ✅ 基础同步状态显示
- ✅ 断开连接

**技术要点**:
- Contracts: 定义 `ExternalCalendarConnectionServerDTO`
- OAuth 2.0 集成（Google API）
- API: `POST /api/v1/calendar-sync/google/connect`
- 定时任务：每 15 分钟增量同步

**验收标准**:
```gherkin
Given 用户连接 Google Calendar
When 执行首次同步
Then 应导入所有外部事件
And 创建对应的 Schedule 记录
And 关联外部事件 ID
```

---

### MMP: 双向同步与冲突处理（+1 周）

**在 MVP 基础上新增**:
- ✅ 双向同步（应用 → 外部）
- ✅ Webhook 实时推送（Google Calendar Push Notifications）
- ✅ 冲突检测与解决
- ✅ 选择性同步（按日历、关键词筛选）
- ✅ 同步日志

**技术要点**:
- Google Calendar Webhook 集成
- 冲突检测算法（基于 `etag` 和时间戳）
- 关键词筛选（正则匹配）

**验收标准**:
```gherkin
Given 用户在 DailyUse 中修改日程
When 该日程关联了 Google Calendar
Then 应自动同步修改到 Google
And 更新成功后标记为 synced
```

---

### Full Release: 多平台与高级功能（+1.5 周）

**在 MMP 基础上新增**:
- ✅ Outlook Calendar 集成
- ✅ Apple Calendar (CalDAV) 集成
- ✅ 批量操作（批量导入/导出）
- ✅ 同步性能优化（批量 API 调用）
- ✅ 离线同步队列
- ✅ 同步统计与分析

**技术要点**:
- Microsoft Graph API
- CalDAV 协议
- 同步队列（Redis）
- 性能监控

**验收标准**:
```gherkin
Given 用户同时连接 Google 和 Outlook
When 执行同步
Then 应正确处理两个日历的事件
And 避免重复导入
```

---

## 5. 验收标准（Gherkin）

### Feature: 日程自动同步

#### Scenario 1: 连接 Google Calendar

```gherkin
Feature: 日程自动同步
  作为日程管理者，我希望自动同步外部日历

  Background:
    Given 用户"郑十"已登录
    And 用户有 Google 账号 "user@example.com"

  Scenario: OAuth 授权连接
    When 用户点击"连接 Google Calendar"
    Then 应跳转到 Google OAuth 授权页面
    
    When 用户授权并返回
    Then 应创建 ExternalCalendarConnection 记录：
      | 字段             | 值                |
      | provider         | google            |
      | email            | user@example.com  |
      | syncStatus       | active            |
    And 应获取用户的日历列表
    And 显示"连接成功"消息
```

---

#### Scenario 2: 首次全量同步

```gherkin
  Background:
    Given 用户已连接 Google Calendar
    And Google 账号有 3 个日历：
      | calendarId | name       | eventCount |
      | primary    | 工作日历   | 12         |
      | personal   | 个人日历   | 5          |
      | holidays   | 节假日     | 36         |

  Scenario: 执行全量同步
    When 用户选择同步"工作日历"和"个人日历"
    And 点击"开始同步"
    Then 应创建 SyncLog 记录，syncType = 'full'
    And 应导入 17 个事件（12 + 5）
    And 每个事件应包含 externalCalendar 信息
    And 显示同步完成消息
    And SyncLog.status 应为 'success'
```

---

#### Scenario 3: 双向同步（外部 → 应用）

```gherkin
  Background:
    Given 用户已连接并完成首次同步
    And 启用了双向同步

  Scenario: 外部创建事件推送
    When Google Calendar 通过 Webhook 推送新事件：
      ```json
      {
        "id": "google-event-123",
        "summary": "团队站会",
        "start": { "dateTime": "2025-10-22T09:00:00+08:00" },
        "end": { "dateTime": "2025-10-22T09:30:00+08:00" }
      }
      ```
    Then 应在 DailyUse 中创建对应 Schedule
    And schedule.externalCalendar.eventId 应为 "google-event-123"
    And schedule.syncStatus 应为 'synced'
    And 用户应在日程视图中看到该事件
```

---

#### Scenario 4: 双向同步（应用 → 外部）

```gherkin
  Background:
    Given 用户已同步的日程 "团队站会" (eventId: "google-event-123")

  Scenario: 应用中修改事件
    When 用户在 DailyUse 中修改该日程标题为 "每日站会"
    Then 应调用 Google Calendar API 更新事件
    And API 请求应包含 eventId "google-event-123"
    And 请求体应包含新标题 "每日站会"
    
    When API 返回成功
    Then schedule.syncStatus 应更新为 'synced'
    And schedule.lastSyncAt 应更新为当前时间
    And 显示"同步成功"通知
```

---

#### Scenario 5: 冲突检测与解决

```gherkin
  Background:
    Given 用户已同步的日程 "产品评审会议"
    And 日程 updatedAt = 14:30
    And 日程 lastSyncAt = 14:00

  Scenario: 检测双边修改冲突
    When 用户在 DailyUse 修改标题（14:30）
    And Google 中同一事件也被修改（14:32）
    And 系统执行增量同步
    Then 应检测到冲突
    And 弹出冲突解决对话框
    And 显示两个版本的差异
    And 推荐使用 Google 版本（更新）
    
    When 用户选择"使用 Google 版本"
    Then 应用 DailyUse 日程应更新为 Google 版本
    And syncStatus 应为 'synced'
    And 记录冲突解决日志
```

---

#### Scenario 6: 选择性同步

```gherkin
  Background:
    Given 用户已连接 Google Calendar
    And Google 有 3 个日历

  Scenario: 按日历筛选
    When 用户在同步设置中取消勾选"节假日"
    And 保存设置
    Then syncConfig.selectedCalendars 应不包含 "holidays"
    And 执行重新同步
    And 应删除所有来自"节假日"的日程
    
  Scenario: 关键词筛选
    When 用户设置包含关键词：["会议", "评审"]
    And 设置排除关键词：["休假"]
    And 保存设置
    Then 执行同步时应只导入标题包含关键词的事件
    And 应跳过标题包含排除词的事件
```

---

#### Scenario 7: 断开连接

```gherkin
  Background:
    Given 用户已连接 Google Calendar
    And 已同步 156 个日程

  Scenario: 断开连接并保留数据
    When 用户点击"断开连接"
    And 选择"保留所有日程"
    And 确认断开
    Then 应撤销 OAuth Token
    And 应删除 ExternalCalendarConnection 记录
    And 156 个日程应保留
    And 日程的 externalCalendar 字段应清空
    And 日程应添加 metadata.originalProvider = 'google'
    And 显示"已断开连接"消息
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 连接外部日历
{
  event: 'external_calendar_connected',
  properties: {
    provider: CalendarProvider,
    calendarsCount: number
  }
}

// 同步执行
{
  event: 'calendar_sync_executed',
  properties: {
    provider: CalendarProvider,
    syncType: SyncType,
    eventsImported: number,
    eventsExported: number,
    duration: number,
    success: boolean
  }
}

// 冲突检测
{
  event: 'sync_conflict_detected',
  properties: {
    provider: CalendarProvider,
    resolution: 'local' | 'remote' | 'manual'
  }
}

// 断开连接
{
  event: 'external_calendar_disconnected',
  properties: {
    provider: CalendarProvider,
    dataRetention: 'keep' | 'delete' | 'readonly'
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 连接成功率 | >95% | 成功连接数 / 尝试连接数 |
| 同步成功率 | >98% | 成功同步次数 / 总同步次数 |
| 冲突率 | <2% | 冲突次数 / 同步事件总数 |
| 同步延迟 | <5 分钟 | 外部变更到应用显示的时间 |

**定性指标**:
- 用户反馈"日程管理更方便"
- 减少手动同步操作
- 日历使用频率提升

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model ExternalCalendarConnection {
  uuid                String   @id @default(uuid())
  userId              String   @map("user_id")
  provider            String   @map("provider")
  providerAccountId   String   @map("provider_account_id")
  email               String   @map("email")
  accessToken         String   @map("access_token")  // 加密
  refreshToken        String   @map("refresh_token")  // 加密
  tokenExpiresAt      BigInt   @map("token_expires_at")
  syncConfig          Json     @map("sync_config")
  syncStatus          String   @map("sync_status")
  lastSyncAt          DateTime? @map("last_sync_at")
  lastSyncError       String?  @map("last_sync_error") @db.Text
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  
  user                User     @relation(fields: [userId], references: [uuid])
  syncLogs            SyncLog[]
  
  @@unique([userId, provider])
  @@index([userId])
  @@index([syncStatus])
  @@map("external_calendar_connections")
}

model SyncLog {
  uuid              String   @id @default(uuid())
  connectionUuid    String   @map("connection_uuid")
  syncType          String   @map("sync_type")
  status            String   @map("status")
  startTime         BigInt   @map("start_time")
  endTime           BigInt   @map("end_time")
  eventsImported    Int      @map("events_imported")
  eventsExported    Int      @map("events_exported")
  eventsFailed      Int      @map("events_failed")
  errorDetails      Json?    @map("error_details")
  createdAt         DateTime @default(now()) @map("created_at")
  
  connection        ExternalCalendarConnection @relation(fields: [connectionUuid], references: [uuid])
  
  @@index([connectionUuid])
  @@map("sync_logs")
}

// 更新 Schedule 模型
model Schedule {
  // ...existing fields...
  
  externalCalendar  Json?    @map("external_calendar")  // ExternalCalendarInfo
  syncStatus        String?  @map("sync_status")
  lastSyncAt        DateTime? @map("last_sync_at")
  
  @@map("schedules")
}
```

### Application Service

```typescript
// packages/domain-server/src/modules/schedule/application/CalendarSyncService.ts

export class CalendarSyncService {
  // 连接 Google Calendar
  async connectGoogleCalendar(userId: string, code: string): Promise<ExternalCalendarConnection> {
    // 1. 交换 Code 获取 Token
    const { tokens } = await this.googleOAuth.getToken(code);
    
    // 2. 获取用户信息
    const userInfo = await this.googleCalendar.getUserInfo(tokens.access_token);
    
    // 3. 保存连接配置
    const connection = new ExternalCalendarConnection({
      userId,
      provider: CalendarProvider.GOOGLE,
      providerAccountId: userInfo.id,
      email: userInfo.email,
      accessToken: this.encrypt(tokens.access_token),
      refreshToken: this.encrypt(tokens.refresh_token),
      tokenExpiresAt: tokens.expiry_date,
      syncConfig: {
        enabled: true,
        bidirectional: true,
        syncInterval: 15,
        selectedCalendars: [],
        timeRange: { pastDays: 7, futureDays: 30 }
      },
      syncStatus: SyncStatus.ACTIVE
    });
    
    await this.connectionRepository.save(connection);
    
    // 4. 获取日历列表
    const calendars = await this.googleCalendar.listCalendars(tokens.access_token);
    
    return { connection, calendars };
  }
  
  // 执行同步
  async syncCalendar(connectionUuid: string, syncType: SyncType = SyncType.INCREMENTAL): Promise<SyncLog> {
    const connection = await this.connectionRepository.findByUuid(connectionUuid);
    const log = new SyncLog({
      connectionUuid,
      syncType,
      startTime: Date.now()
    });
    
    try {
      // 1. 刷新 Token（如果需要）
      if (this.isTokenExpired(connection)) {
        await this.refreshToken(connection);
      }
      
      // 2. 获取外部事件
      const externalEvents = await this.fetchExternalEvents(connection, syncType);
      
      // 3. 同步到应用
      const importResult = await this.importEvents(connection, externalEvents);
      log.eventsImported = importResult.success;
      log.eventsFailed = importResult.failed;
      
      // 4. 双向同步（如果启用）
      if (connection.syncConfig.bidirectional) {
        const exportResult = await this.exportEvents(connection);
        log.eventsExported = exportResult.success;
      }
      
      log.status = 'success';
      log.endTime = Date.now();
      
      // 5. 更新连接状态
      connection.updateLastSync(Date.now());
      await this.connectionRepository.save(connection);
      
    } catch (error) {
      log.status = 'failed';
      log.errorDetails = [{ errorMessage: error.message }];
      throw error;
    } finally {
      await this.syncLogRepository.save(log);
    }
    
    return log;
  }
  
  // 导入事件
  private async importEvents(
    connection: ExternalCalendarConnection,
    externalEvents: GoogleEvent[]
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const event of externalEvents) {
      try {
        // 应用筛选规则
        if (!this.matchesFilter(event, connection.syncConfig)) {
          continue;
        }
        
        // 检查是否已存在
        const existing = await this.scheduleRepository.findByExternalId(
          connection.provider,
          event.id
        );
        
        if (existing) {
          // 更新
          await this.updateScheduleFromExternal(existing, event);
        } else {
          // 创建
          await this.createScheduleFromExternal(connection, event);
        }
        
        success++;
      } catch (error) {
        failed++;
        this.logger.error(`Failed to import event ${event.id}:`, error);
      }
    }
    
    return { success, failed };
  }
  
  // 导出事件
  private async exportEvents(connection: ExternalCalendarConnection): Promise<{ success: number }> {
    // 查找需要同步的本地修改
    const pendingSchedules = await this.scheduleRepository.findPendingSync(
      connection.userId,
      connection.provider
    );
    
    let success = 0;
    
    for (const schedule of pendingSchedules) {
      try {
        await this.googleCalendar.updateEvent({
          calendarId: schedule.externalCalendar.calendarId,
          eventId: schedule.externalCalendar.eventId,
          event: this.convertToGoogleEvent(schedule)
        });
        
        schedule.markAsSynced();
        await this.scheduleRepository.save(schedule);
        success++;
      } catch (error) {
        this.logger.error(`Failed to export schedule ${schedule.uuid}:`, error);
      }
    }
    
    return { success };
  }
  
  // 检测冲突
  private async detectConflict(schedule: Schedule, externalEvent: GoogleEvent): Promise<boolean> {
    return (
      schedule.updatedAt > schedule.lastSyncAt &&
      new Date(externalEvent.updated).getTime() > schedule.lastSyncAt
    );
  }
}
```

### API 端点

```typescript
// 连接 Google Calendar
POST /api/v1/calendar-sync/google/connect
Body: { code: string }
Response: {
  connection: ExternalCalendarConnectionClientDTO,
  calendars: GoogleCalendarInfo[]
}

// 获取连接列表
GET /api/v1/calendar-sync/connections
Response: {
  connections: ExternalCalendarConnectionClientDTO[]
}

// 执行同步
POST /api/v1/calendar-sync/:connectionUuid/sync
Body: { syncType?: SyncType }
Response: SyncLogClientDTO

// 更新同步配置
PATCH /api/v1/calendar-sync/:connectionUuid/config
Body: Partial<SyncConfig>
Response: ExternalCalendarConnectionClientDTO

// 断开连接
DELETE /api/v1/calendar-sync/:connectionUuid
Body: { dataRetention: 'keep' | 'delete' | 'readonly' }
Response: { success: boolean }

// 获取同步日志
GET /api/v1/calendar-sync/:connectionUuid/logs?limit=20
Response: {
  logs: SyncLogClientDTO[]
}

// Google Calendar Webhook
POST /api/v1/calendar-sync/google/webhook
Headers: { 'X-Goog-Channel-ID': string }
Body: GoogleWebhookPayload
Response: { received: true }
```

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| OAuth Token 过期 | 高 | 中 | 自动刷新 + 重试机制 |
| API 限流 | 中 | 高 | 批量 API + 指数退避 |
| 同步冲突频繁 | 中 | 中 | 智能冲突解决 + 用户教育 |
| 大量事件性能问题 | 中 | 中 | 分页同步 + 后台任务 |

---

## 9. 后续增强方向

### Phase 2 功能
- 🔄 更多日历平台（钉钉、企业微信、飞书）
- 📊 同步性能分析
- 🤖 智能同步建议（最佳同步频率）
- 📱 移动端同步支持

### Phase 3 功能
- 🔗 跨平台日程聚合
- 👥 团队日历共享
- 🎯 基于 AI 的冲突预防
- 📈 日程分析与洞察

---

## 10. 参考资料

- [Schedule Contracts](../../../../packages/contracts/src/modules/schedule/)
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [Microsoft Graph Calendar API](https://docs.microsoft.com/en-us/graph/api/resources/calendar)
- [OAuth 2.0 规范](https://oauth.net/2/)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:
- 创建: 2025-10-21
- 创建者: PO Agent  
- 版本: 1.0
- 下次更新: Sprint Planning 前
