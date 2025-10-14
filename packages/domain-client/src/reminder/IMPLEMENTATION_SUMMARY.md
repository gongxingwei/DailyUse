# Reminder 模块 Domain-Client 实现总结

## 概述

本文档记录了 Reminder 模块在 `domain-client` 层的完整实现，包括所有值对象和聚合根。

## 实现日期

2025-01-XX

## 模块结构

```
packages/domain-client/src/reminder/
├── aggregates/
│   ├── ReminderGroupClient.ts        # 提醒组聚合根
│   ├── ReminderTemplateClient.ts     # 提醒模板聚合根
│   └── index.ts                      # 聚合根导出
├── value-objects/
│   ├── RecurrenceConfigClient.ts     # 重复配置
│   ├── TriggerConfigClient.ts        # 触发配置
│   ├── NotificationConfigClient.ts   # 通知配置
│   ├── ActiveTimeConfigClient.ts     # 活动时间配置
│   ├── ActiveHoursConfigClient.ts    # 活动小时段配置
│   ├── ReminderStatsClient.ts        # 提醒统计
│   ├── GroupStatsClient.ts           # 组统计
│   └── index.ts                      # 值对象导出
└── index.ts                          # 模块总导出
```

## 值对象实现 (7个)

### 1. RecurrenceConfigClient
**文件**: `value-objects/RecurrenceConfigClient.ts`  
**行数**: ~170 行  
**职责**: 处理提醒的重复配置

**功能**:
- 支持三种重复类型: `DAILY`(每天), `WEEKLY`(每周), `CUSTOM_DAYS`(自定义日期)
- 提供 `displayText` 计算属性，生成易读的中文描述
- WeekDay 枚举映射到中文字符 ("一", "二", "三"等)

**UI 属性**:
- `displayText`: "每天" | "每周一、三、五" | "自定义日期"
- 根据 `type` 自动生成合适的显示文本

**示例**:
```typescript
const config = new RecurrenceConfigClient({
  type: RecurrenceType.WEEKLY,
  weekDays: [WeekDay.MONDAY, WeekDay.WEDNESDAY, WeekDay.FRIDAY]
});
console.log(config.displayText); // "每周一、三、五"
```

---

### 2. TriggerConfigClient
**文件**: `value-objects/TriggerConfigClient.ts`  
**行数**: ~118 行  
**职责**: 处理提醒的触发配置

**功能**:
- 支持两种触发类型: `FIXED_TIME`(固定时间), `INTERVAL`(间隔触发)
- 提供 `displayText` 计算属性，格式化触发时间或间隔

**UI 属性**:
- `displayText`: "每天 09:00" | "每隔 30 分钟"
- 智能时间格式化 (小时:分钟, 补零)

**示例**:
```typescript
const fixedTime = new TriggerConfigClient({
  type: TriggerType.FIXED_TIME,
  timeOfDay: '09:00'
});
console.log(fixedTime.displayText); // "每天 09:00"

const interval = new TriggerConfigClient({
  type: TriggerType.INTERVAL,
  intervalMinutes: 30
});
console.log(interval.displayText); // "每隔 30 分钟"
```

---

### 3. NotificationConfigClient
**文件**: `value-objects/NotificationConfigClient.ts`  
**行数**: ~145 行  
**职责**: 处理多渠道通知配置

**功能**:
- 支持多种通知渠道: `IN_APP`, `PUSH`, `EMAIL`, `SMS`
- 提供 `channelsText` 将渠道数组转为中文描述
- `hasSoundEnabled`, `hasVibrationEnabled` 便捷属性

**UI 属性**:
- `channelsText`: "应用内 + 推送" | "应用内 + 推送 + 邮件"
- `hasSoundEnabled`: 是否启用声音
- `hasVibrationEnabled`: 是否启用振动

**示例**:
```typescript
const config = new NotificationConfigClient({
  channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  soundEnabled: true,
  vibrationEnabled: false
});
console.log(config.channelsText); // "应用内 + 推送"
console.log(config.hasSoundEnabled); // true
```

---

### 4. ActiveTimeConfigClient
**文件**: `value-objects/ActiveTimeConfigClient.ts`  
**行数**: ~90 行  
**职责**: 处理提醒的活动时间范围

**功能**:
- 配置开始/结束日期
- 验证时间范围合法性
- 计算当前是否在活动期

**UI 属性**:
- `displayText`: "2024-01-01 至 2024-12-31" | "长期有效"
- `isActive`: 根据当前时间判断是否在活动期内

**示例**:
```typescript
const config = new ActiveTimeConfigClient({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});
console.log(config.displayText); // "2024-01-01 至 2024-12-31"
console.log(config.isActive); // 根据当前日期返回
```

---

### 5. ActiveHoursConfigClient
**文件**: `value-objects/ActiveHoursConfigClient.ts`  
**行数**: ~87 行  
**职责**: 处理每天的活动小时段

**功能**:
- 配置每天的开始/结束小时
- 支持全天模式 (null startHour/endHour)

**UI 属性**:
- `displayText`: "09:00 - 21:00" | "全天"

**示例**:
```typescript
const config = new ActiveHoursConfigClient({
  startHour: 9,
  endHour: 21
});
console.log(config.displayText); // "09:00 - 21:00"
```

---

### 6. ReminderStatsClient
**文件**: `value-objects/ReminderStatsClient.ts`  
**行数**: ~96 行  
**职责**: 提醒模板的统计信息

**功能**:
- 记录总触发次数
- 记录最后触发时间
- 提供格式化的统计文本

**UI 属性**:
- `totalTriggersText`: "已触发 15 次" | "未触发"
- `lastTriggeredText`: "3 小时前" | "从未触发"

**示例**:
```typescript
const stats = new ReminderStatsClient({
  totalTriggers: 15,
  lastTriggeredAt: new Date('2024-01-15T10:00:00')
});
console.log(stats.totalTriggersText); // "已触发 15 次"
console.log(stats.lastTriggeredText); // "3 小时前" (相对时间)
```

---

### 7. GroupStatsClient
**文件**: `value-objects/GroupStatsClient.ts`  
**行数**: ~115 行  
**职责**: 提醒组的统计信息

**功能**:
- 统计组内模板数量 (总数, 活跃, 暂停, 自启用, 自暂停)
- 提供格式化的统计文本

**UI 属性**:
- `templateCountText`: "5 个提醒"
- `activeStatusText`: "3 个活跃, 2 个暂停"
- `selfEnabledText`: "2 个自启用, 1 个自暂停"

**示例**:
```typescript
const stats = new GroupStatsClient({
  totalTemplates: 5,
  activeTemplates: 3,
  pausedTemplates: 2,
  selfEnabledTemplates: 2,
  selfPausedTemplates: 1
});
console.log(stats.activeStatusText); // "3 个活跃, 2 个暂停"
```

---

## 聚合根实现 (2个)

### 1. ReminderGroupClient
**文件**: `aggregates/ReminderGroupClient.ts`  
**行数**: ~263 行  
**职责**: 提醒组的聚合根，管理多个提醒模板

**核心属性**:
- `uuid`: 组 UUID
- `accountUuid`: 账户 UUID
- `name`: 组名称
- `description`: 组描述 (可选)
- `controlMode`: 控制模式 (`GROUP` | `INDIVIDUAL`)
- `status`: 组状态 (`ACTIVE` | `PAUSED`)
- `stats`: 组统计 (GroupStatsClient)
- `tags`: 标签数组
- `color`: UI 颜色
- `icon`: UI 图标

**UI 计算属性**:
- `displayName`: 显示名称 (name 或 "未命名组")
- `controlModeText`: "组控制" | "个体控制"
- `statusText`: "活跃" | "暂停"
- `controlDescription`: 详细的控制模式说明

**UI 方法**:
- `getStatusBadge()`: 返回状态徽章配置 `{ text, variant, icon }`
  - ACTIVE: `{ text: '活跃', variant: 'success', icon: 'check-circle' }`
  - PAUSED: `{ text: '暂停', variant: 'warning', icon: 'pause-circle' }`
  
- `getControlModeBadge()`: 返回控制模式徽章
  - GROUP: `{ text: '组控制', variant: 'primary', icon: 'users' }`
  - INDIVIDUAL: `{ text: '个体控制', variant: 'default', icon: 'user' }`

- `getIcon()`: 返回图标 (icon 或默认 "folder")
- `getColorStyle()`: 返回颜色样式对象 `{ color: '#xxx' }`

**权限检查**:
- `canSwitchMode()`: 是否可切换控制模式
- `canEnableAll()`: 是否可启用所有模板
- `canPauseAll()`: 是否可暂停所有模板
- `canEdit()`: 是否可编辑组 (ACTIVE 状态)
- `canDelete()`: 是否可删除组 (无模板)
- `hasTemplates()`: 是否有模板
- `isGroupControlled()`: 是否为组控制模式

**使用示例**:
```typescript
const group = new ReminderGroupClient({
  uuid: 'group-123',
  accountUuid: 'account-456',
  name: '工作提醒',
  controlMode: ControlMode.GROUP,
  status: ReminderStatus.ACTIVE,
  stats: statsData,
  // ...
});

console.log(group.displayName); // "工作提醒"
console.log(group.controlModeText); // "组控制"
console.log(group.getStatusBadge()); // { text: '活跃', variant: 'success', icon: 'check-circle' }
console.log(group.canEdit()); // true (ACTIVE 状态可编辑)
```

---

### 2. ReminderTemplateClient
**文件**: `aggregates/ReminderTemplateClient.ts`  
**行数**: ~408 行  
**职责**: 提醒模板的聚合根，包含完整的提醒配置

**核心属性**:
- `uuid`: 模板 UUID
- `accountUuid`: 账户 UUID
- `title`: 提醒标题
- `description`: 提醒描述 (可选)
- `type`: 提醒类型 (`ONE_TIME` | `RECURRING`)
- `trigger`: 触发配置 (TriggerConfigClient)
- `recurrence`: 重复配置 (RecurrenceConfigClient, 可选)
- `activeTime`: 活动时间配置 (ActiveTimeConfigClient, 可选)
- `activeHours`: 活动小时段配置 (ActiveHoursConfigClient, 可选)
- `notificationConfig`: 通知配置 (NotificationConfigClient)
- `selfEnabled`: 自身启用状态
- `status`: 模板状态 (`ACTIVE` | `PAUSED`)
- `effectiveEnabled`: **计算属性** - 实际生效状态 (考虑组控制)
- `groupUuid`: 所属组 UUID (可选)
- `importanceLevel`: 重要程度
- `tags`: 标签数组
- `color`: UI 颜色
- `icon`: UI 图标
- `nextTriggerAt`: 下次触发时间 (可选)
- `stats`: 提醒统计 (ReminderStatsClient)

**UI 计算属性**:
- `displayTitle`: 显示标题 (title 或 "未命名提醒")
- `typeText`: "一次性" | "循环"
- `triggerText`: 触发配置的显示文本
- `recurrenceText`: 重复配置的显示文本 (如果有)
- `statusText`: "活跃" | "暂停"
- `importanceText`: "高" | "中" | "低"
- `nextTriggerText`: 下次触发时间的显示文本
- `isActive`: 是否活跃 (status === ACTIVE)
- `isPaused`: 是否暂停 (status === PAUSED)
- `lastTriggeredText`: 最后触发时间文本
- `controlledByGroup`: 是否受组控制

**UI 方法**:
- `getStatusBadge()`: 返回状态徽章
  - ACTIVE: `{ text: '活跃', variant: 'success', icon: 'check-circle' }`
  - PAUSED: `{ text: '暂停', variant: 'warning', icon: 'pause-circle' }`

- `getImportanceBadge()`: 返回重要程度徽章
  - HIGH: `{ text: '高', variant: 'danger', icon: 'alert-circle' }`
  - MEDIUM: `{ text: '中', variant: 'warning', icon: 'info' }`
  - LOW: `{ text: '低', variant: 'default', icon: 'minus-circle' }`

- `getTriggerDisplay()`: 触发配置的详细显示
- `getNextTriggerDisplay()`: 下次触发时间的详细显示

**权限检查**:
- `canEnable()`: 是否可启用 (当前暂停)
- `canPause()`: 是否可暂停 (当前活跃)
- `canEdit()`: 是否可编辑 (当前活跃)
- `canDelete()`: 是否可删除 (总是可以)

**时间格式化**:
- `formatNextTrigger()`: 智能相对时间格式化
  - "今天 09:00"
  - "明天 14:30"
  - "3 小时后"
  - "2 天后"
  - "即将触发" (5分钟内)

**集成值对象** (6个):
1. TriggerConfigClient (触发配置)
2. RecurrenceConfigClient (重复配置)
3. ActiveTimeConfigClient (活动时间)
4. ActiveHoursConfigClient (活动小时段)
5. NotificationConfigClient (通知配置)
6. ReminderStatsClient (统计信息)

**使用示例**:
```typescript
const template = new ReminderTemplateClient({
  uuid: 'template-123',
  accountUuid: 'account-456',
  title: '每天早上喝水',
  type: ReminderType.RECURRING,
  trigger: new TriggerConfigClient({
    type: TriggerType.FIXED_TIME,
    timeOfDay: '09:00'
  }),
  recurrence: new RecurrenceConfigClient({
    type: RecurrenceType.DAILY
  }),
  notificationConfig: new NotificationConfigClient({
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH]
  }),
  selfEnabled: true,
  status: ReminderStatus.ACTIVE,
  importanceLevel: ImportanceLevel.MEDIUM,
  // ...
});

console.log(template.displayTitle); // "每天早上喝水"
console.log(template.typeText); // "循环"
console.log(template.triggerText); // "每天 09:00"
console.log(template.recurrenceText); // "每天"
console.log(template.getStatusBadge()); // { text: '活跃', variant: 'success', icon: 'check-circle' }
console.log(template.getImportanceBadge()); // { text: '中', variant: 'warning', icon: 'info' }
console.log(template.canEdit()); // true
```

---

## DTO 转换模式

所有实体和值对象都实现了完整的 DTO 转换方法:

### 1. toServerDTO()
将客户端实体转换为服务端 DTO (用于 API 请求)

**特点**:
- 移除客户端计算属性 (如 `effectiveEnabled`)
- 递归转换嵌套的值对象
- 保留核心业务数据

**示例**:
```typescript
const serverDTO = template.toServerDTO();
// serverDTO 不包含 effectiveEnabled, displayTitle 等计算属性
```

### 2. toClientDTO()
将客户端实体转换为客户端 DTO (用于状态管理/缓存)

**特点**:
- 包含所有计算属性
- 递归转换嵌套的值对象
- 完整的UI数据

**示例**:
```typescript
const clientDTO = template.toClientDTO();
// clientDTO 包含所有计算属性和UI数据
```

### 3. fromServerDTO()
从服务端 DTO 创建客户端实体 (用于 API 响应处理)

**特点**:
- 计算客户端专有属性 (如 `effectiveEnabled = dto.selfEnabled`)
- 重建值对象实例
- 设置默认值

**示例**:
```typescript
const template = ReminderTemplateClient.fromServerDTO(serverDTO);
// template 是完整的客户端实体，包含所有计算属性
```

### 4. fromClientDTO()
从客户端 DTO 创建客户端实体 (用于缓存恢复)

**特点**:
- 直接使用 DTO 中的所有数据
- 重建值对象实例

**示例**:
```typescript
const template = ReminderTemplateClient.fromClientDTO(clientDTO);
// 从缓存恢复完整实体
```

---

## 设计模式与最佳实践

### 1. **命名空间导入**
```typescript
import { ReminderContracts as RC } from '@dailyuse/contracts';
```
- 使用 `RC` 前缀访问所有 contracts 类型
- 避免命名冲突
- 代码更清晰

### 2. **DDD 分层架构**
- **值对象**: 不可变的领域概念 (RecurrenceConfig, TriggerConfig 等)
- **聚合根**: 业务实体的根 (ReminderGroup, ReminderTemplate)
- **DTO 转换**: 清晰的边界转换逻辑

### 3. **Client 简化原则**
- 专注于 UI 展示需求
- 移除复杂的业务逻辑 (由 domain-server 处理)
- 提供丰富的计算属性和便捷方法

### 4. **计算属性模式**
```typescript
get displayText(): string {
  // UI 友好的文本表示
}
```
- 所有 UI 相关的数据都通过 `get` 属性提供
- 保持实体数据的纯净性
- 便于测试和维护

### 5. **时间格式化**
- 使用 `@dailyuse/utils` 的时间工具
- 提供相对时间 ("3 小时前")
- 支持智能日期显示 ("今天", "明天")

### 6. **权限检查方法**
```typescript
canEdit(): boolean {
  return this.status === ReminderStatus.ACTIVE;
}
```
- 封装权限逻辑
- 统一的命名规范 (`can*`)
- 便于前端按钮禁用等 UI 控制

### 7. **徽章配置模式**
```typescript
getStatusBadge(): { text: string; variant: string; icon: string } {
  // 返回 UI 组件所需的配置对象
}
```
- 返回结构化的 UI 配置
- 前端直接使用，无需二次转换

---

## 类型安全

所有实现都严格遵循 TypeScript 类型系统:

1. **泛型支持**: 继承 `ValueObject` 和 `AggregateRoot` 基类
2. **完整类型定义**: 所有属性都有明确的类型
3. **DTO 类型**: 使用 `@dailyuse/contracts` 中定义的 DTO 类型
4. **编译通过**: 所有代码通过 `tsc --noEmit` 检查

---

## 测试覆盖

建议测试点:

### 值对象测试
- DTO 转换的正确性
- 计算属性的准确性
- `equals()` 方法的正确性
- 边界情况处理

### 聚合根测试
- 复杂 DTO 转换
- 权限检查逻辑
- UI 方法返回值
- 时间格式化

### 集成测试
- 完整的实体创建流程
- 嵌套值对象的正确组装
- 多层 DTO 转换

---

## 依赖关系

```
ReminderTemplateClient (聚合根)
  ├── TriggerConfigClient (值对象)
  ├── RecurrenceConfigClient (值对象)
  ├── ActiveTimeConfigClient (值对象)
  ├── ActiveHoursConfigClient (值对象)
  ├── NotificationConfigClient (值对象)
  └── ReminderStatsClient (值对象)

ReminderGroupClient (聚合根)
  └── GroupStatsClient (值对象)
```

---

## 导出结构

```typescript
// packages/domain-client/src/index.ts
export * as ReminderDomain from './reminder';

// 使用示例
import { ReminderDomain } from '@dailyuse/domain-client';

const template = new ReminderDomain.ReminderTemplateClient(data);
const group = new ReminderDomain.ReminderGroupClient(data);
const config = new ReminderDomain.RecurrenceConfigClient(data);
```

---

## 后续工作

1. **单元测试**: 为所有值对象和聚合根编写测试
2. **集成测试**: 验证与 API 的集成
3. **性能优化**: 大量实体时的性能考虑
4. **文档完善**: 添加更多使用示例

---

## 参考文档

- `remodules.prompt.md`: 模块实现规范
- `@dailyuse/contracts`: Reminder 相关的 DTO 定义
- `@dailyuse/utils`: 基础工具类和时间格式化
- `packages/domain-client/src/notification/`: 通知模块参考实现

---

## 变更记录

### 2025-01-XX - 初始实现
- ✅ 创建 7 个值对象
- ✅ 创建 2 个聚合根
- ✅ 完整的 DTO 转换支持
- ✅ 丰富的 UI 计算属性
- ✅ 通过 TypeScript 编译检查
