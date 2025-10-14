# Reminder Domain-Client 使用示例

## 导入模块

```typescript
import { ReminderDomain } from '@dailyuse/domain-client';
import { ReminderContracts } from '@dailyuse/contracts';

// 或者具体导入
import {
  ReminderTemplateClient,
  ReminderGroupClient,
  RecurrenceConfigClient,
  TriggerConfigClient,
  NotificationConfigClient,
} from '@dailyuse/domain-client/reminder';
```

## 基础用例

### 1. 创建一个每天的固定时间提醒

```typescript
import { ReminderDomain } from '@dailyuse/domain-client';
import { 
  ReminderType, 
  TriggerType, 
  RecurrenceType,
  ReminderStatus,
  ImportanceLevel,
  NotificationChannel 
} from '@dailyuse/contracts';

// 创建触发配置
const trigger = new ReminderDomain.TriggerConfigClient({
  type: TriggerType.FIXED_TIME,
  timeOfDay: '09:00',
});

// 创建重复配置
const recurrence = new ReminderDomain.RecurrenceConfigClient({
  type: RecurrenceType.DAILY,
});

// 创建通知配置
const notificationConfig = new ReminderDomain.NotificationConfigClient({
  channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  soundEnabled: true,
  vibrationEnabled: false,
});

// 创建统计信息
const stats = new ReminderDomain.ReminderStatsClient({
  totalTriggers: 0,
  lastTriggeredAt: null,
});

// 创建提醒模板
const reminder = new ReminderDomain.ReminderTemplateClient({
  uuid: 'reminder-001',
  accountUuid: 'account-123',
  title: '每天早上喝水',
  description: '起床后第一件事',
  type: ReminderType.RECURRING,
  trigger,
  recurrence,
  notificationConfig,
  selfEnabled: true,
  status: ReminderStatus.ACTIVE,
  importanceLevel: ImportanceLevel.MEDIUM,
  tags: ['健康', '习惯'],
  color: '#4CAF50',
  icon: 'water-drop',
  stats,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 使用 UI 属性
console.log(reminder.displayTitle);        // "每天早上喝水"
console.log(reminder.typeText);            // "循环"
console.log(reminder.triggerText);         // "每天 09:00"
console.log(reminder.recurrenceText);      // "每天"
console.log(reminder.importanceText);      // "中"

// 使用 UI 方法
const statusBadge = reminder.getStatusBadge();
// { text: '活跃', variant: 'success', icon: 'check-circle' }

const importanceBadge = reminder.getImportanceBadge();
// { text: '中', variant: 'warning', icon: 'info' }

// 权限检查
console.log(reminder.canEdit());           // true (活跃状态可编辑)
console.log(reminder.canPause());          // true (活跃状态可暂停)
```

### 2. 创建一个每周特定日期的提醒

```typescript
import { WeekDay } from '@dailyuse/contracts';

// 每周一、三、五下午3点的会议提醒
const meetingTrigger = new ReminderDomain.TriggerConfigClient({
  type: TriggerType.FIXED_TIME,
  timeOfDay: '15:00',
});

const meetingRecurrence = new ReminderDomain.RecurrenceConfigClient({
  type: RecurrenceType.WEEKLY,
  weekDays: [WeekDay.MONDAY, WeekDay.WEDNESDAY, WeekDay.FRIDAY],
});

const meetingReminder = new ReminderDomain.ReminderTemplateClient({
  // ... 其他属性
  title: '团队例会',
  trigger: meetingTrigger,
  recurrence: meetingRecurrence,
});

console.log(meetingReminder.recurrenceText); // "每周一、三、五"
console.log(meetingReminder.triggerText);    // "每天 15:00"
```

### 3. 创建一个间隔触发的提醒

```typescript
// 每隔2小时喝水提醒
const intervalTrigger = new ReminderDomain.TriggerConfigClient({
  type: TriggerType.INTERVAL,
  intervalMinutes: 120, // 2小时
});

const waterReminder = new ReminderDomain.ReminderTemplateClient({
  // ... 其他属性
  title: '喝水提醒',
  type: ReminderType.RECURRING,
  trigger: intervalTrigger,
  recurrence: new ReminderDomain.RecurrenceConfigClient({
    type: RecurrenceType.DAILY,
  }),
});

console.log(waterReminder.triggerText); // "每隔 120 分钟"
```

### 4. 使用活动时间和小时段配置

```typescript
// 只在工作日的工作时间提醒
const activeTime = new ReminderDomain.ActiveTimeConfigClient({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});

const activeHours = new ReminderDomain.ActiveHoursConfigClient({
  startHour: 9,
  endHour: 18,
});

const workReminder = new ReminderDomain.ReminderTemplateClient({
  // ... 其他属性
  title: '工作事项检查',
  activeTime,
  activeHours,
});

console.log(activeTime.displayText);   // "2024-01-01 至 2024-12-31"
console.log(activeHours.displayText);  // "09:00 - 18:00"
console.log(activeTime.isActive);      // true/false (根据当前日期)
```

## 提醒组用例

### 1. 创建一个组控制的提醒组

```typescript
import { ControlMode } from '@dailyuse/contracts';

// 创建组统计
const groupStats = new ReminderDomain.GroupStatsClient({
  totalTemplates: 5,
  activeTemplates: 3,
  pausedTemplates: 2,
  selfEnabledTemplates: 4,
  selfPausedTemplates: 1,
});

// 创建提醒组
const group = new ReminderDomain.ReminderGroupClient({
  uuid: 'group-001',
  accountUuid: 'account-123',
  name: '工作提醒',
  description: '所有工作相关的提醒',
  controlMode: ControlMode.GROUP,
  status: ReminderStatus.ACTIVE,
  stats: groupStats,
  tags: ['工作'],
  color: '#2196F3',
  icon: 'briefcase',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 使用 UI 属性
console.log(group.displayName);           // "工作提醒"
console.log(group.controlModeText);       // "组控制"
console.log(group.statusText);            // "活跃"
console.log(group.controlDescription);    // "组状态统一控制所有提醒"

// 使用 UI 方法
const statusBadge = group.getStatusBadge();
// { text: '活跃', variant: 'success', icon: 'check-circle' }

const modeBadge = group.getControlModeBadge();
// { text: '组控制', variant: 'primary', icon: 'users' }

// 统计信息
console.log(groupStats.templateCountText);  // "5 个提醒"
console.log(groupStats.activeStatusText);   // "3 个活跃, 2 个暂停"
console.log(groupStats.selfEnabledText);    // "4 个自启用, 1 个自暂停"

// 权限检查
console.log(group.canEdit());             // true (活跃状态可编辑)
console.log(group.canDelete());           // false (有模板不能删除)
console.log(group.hasTemplates());        // true
console.log(group.isGroupControlled());   // true
```

## DTO 转换用例

### 1. 从服务端 DTO 创建实体

```typescript
// 假设从 API 接收到服务端 DTO
const serverDTO = {
  uuid: 'reminder-001',
  accountUuid: 'account-123',
  title: '每天早上喝水',
  type: ReminderType.RECURRING,
  trigger: {
    type: TriggerType.FIXED_TIME,
    timeOfDay: '09:00',
  },
  recurrence: {
    type: RecurrenceType.DAILY,
  },
  notificationConfig: {
    channels: [NotificationChannel.IN_APP],
    soundEnabled: true,
    vibrationEnabled: false,
  },
  selfEnabled: true,
  status: ReminderStatus.ACTIVE,
  importanceLevel: ImportanceLevel.MEDIUM,
  tags: ['健康'],
  color: '#4CAF50',
  icon: 'water-drop',
  stats: {
    totalTriggers: 15,
    lastTriggeredAt: '2024-01-15T10:00:00Z',
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

// 创建客户端实体
const reminder = ReminderDomain.ReminderTemplateClient.fromServerDTO(serverDTO);

// 现在可以使用所有客户端功能
console.log(reminder.displayTitle);
console.log(reminder.triggerText);
console.log(reminder.canEdit());
```

### 2. 转换为服务端 DTO (用于 API 请求)

```typescript
// 有一个客户端实体
const reminder = new ReminderDomain.ReminderTemplateClient({
  // ... 所有属性
});

// 转换为服务端 DTO (用于 PUT/POST 请求)
const serverDTO = reminder.toServerDTO();

// 发送到 API
await fetch('/api/reminders', {
  method: 'POST',
  body: JSON.stringify(serverDTO),
});
```

### 3. 转换为客户端 DTO (用于缓存/状态管理)

```typescript
// 转换为客户端 DTO (包含所有计算属性)
const clientDTO = reminder.toClientDTO();

// 保存到本地存储或状态管理
localStorage.setItem('reminder', JSON.stringify(clientDTO));

// 稍后从缓存恢复
const cachedDTO = JSON.parse(localStorage.getItem('reminder'));
const restoredReminder = ReminderDomain.ReminderTemplateClient.fromClientDTO(cachedDTO);
```

## 高级用例

### 1. 批量处理提醒

```typescript
// 假设从 API 获取多个提醒
const reminders = serverDTOList.map(dto => 
  ReminderDomain.ReminderTemplateClient.fromServerDTO(dto)
);

// 筛选活跃的提醒
const activeReminders = reminders.filter(r => r.isActive);

// 筛选可编辑的提醒
const editableReminders = reminders.filter(r => r.canEdit());

// 按重要程度分组
const importanceGroups = {
  high: reminders.filter(r => r.importanceLevel === ImportanceLevel.HIGH),
  medium: reminders.filter(r => r.importanceLevel === ImportanceLevel.MEDIUM),
  low: reminders.filter(r => r.importanceLevel === ImportanceLevel.LOW),
};
```

### 2. 显示下次触发时间

```typescript
const reminder = new ReminderDomain.ReminderTemplateClient({
  // ... 其他属性
  nextTriggerAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后
});

// 智能显示
console.log(reminder.nextTriggerText);
// "2 小时后" 或 "今天 15:00" 或 "明天 09:00"

// 获取详细显示
const nextTrigger = reminder.getNextTriggerDisplay();
console.log(nextTrigger);
```

### 3. 比较两个提醒是否相同

```typescript
const reminder1 = new ReminderDomain.ReminderTemplateClient({ /* ... */ });
const reminder2 = new ReminderDomain.ReminderTemplateClient({ /* ... */ });

// 使用 equals 方法 (基于 uuid)
if (reminder1.equals(reminder2)) {
  console.log('这是同一个提醒');
}

// 比较值对象
const config1 = new ReminderDomain.RecurrenceConfigClient({
  type: RecurrenceType.DAILY,
});
const config2 = new ReminderDomain.RecurrenceConfigClient({
  type: RecurrenceType.DAILY,
});

if (config1.equals(config2)) {
  console.log('配置相同');
}
```

## Vue 组件示例

### 提醒卡片组件

```vue
<script setup lang="ts">
import { ReminderDomain } from '@dailyuse/domain-client';
import type { ReminderTemplateClient } from '@dailyuse/domain-client/reminder';

const props = defineProps<{
  reminder: ReminderTemplateClient;
}>();

const statusBadge = computed(() => props.reminder.getStatusBadge());
const importanceBadge = computed(() => props.reminder.getImportanceBadge());
</script>

<template>
  <div class="reminder-card">
    <div class="header">
      <h3>{{ reminder.displayTitle }}</h3>
      <badge :variant="statusBadge.variant">
        <icon :name="statusBadge.icon" />
        {{ statusBadge.text }}
      </badge>
    </div>
    
    <div class="content">
      <p>{{ reminder.description }}</p>
      
      <div class="info">
        <div class="info-item">
          <span class="label">类型:</span>
          <span>{{ reminder.typeText }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">触发:</span>
          <span>{{ reminder.triggerText }}</span>
        </div>
        
        <div v-if="reminder.recurrence" class="info-item">
          <span class="label">重复:</span>
          <span>{{ reminder.recurrenceText }}</span>
        </div>
        
        <div v-if="reminder.nextTriggerAt" class="info-item">
          <span class="label">下次:</span>
          <span>{{ reminder.nextTriggerText }}</span>
        </div>
      </div>
    </div>
    
    <div class="actions">
      <button 
        v-if="reminder.canEdit()" 
        @click="$emit('edit', reminder)"
      >
        编辑
      </button>
      
      <button 
        v-if="reminder.canPause()" 
        @click="$emit('pause', reminder)"
      >
        暂停
      </button>
      
      <button 
        v-if="reminder.canEnable()" 
        @click="$emit('enable', reminder)"
      >
        启用
      </button>
      
      <button 
        v-if="reminder.canDelete()" 
        @click="$emit('delete', reminder)"
      >
        删除
      </button>
    </div>
  </div>
</template>
```

### 提醒组卡片组件

```vue
<script setup lang="ts">
import type { ReminderGroupClient } from '@dailyuse/domain-client/reminder';

const props = defineProps<{
  group: ReminderGroupClient;
}>();

const statusBadge = computed(() => props.group.getStatusBadge());
const modeBadge = computed(() => props.group.getControlModeBadge());
</script>

<template>
  <div class="group-card">
    <div class="header">
      <icon :name="group.getIcon()" :style="group.getColorStyle()" />
      <h3>{{ group.displayName }}</h3>
      <badge :variant="statusBadge.variant">
        {{ statusBadge.text }}
      </badge>
    </div>
    
    <div class="content">
      <p>{{ group.description }}</p>
      
      <div class="stats">
        <div class="stat-item">
          {{ group.stats.templateCountText }}
        </div>
        <div class="stat-item">
          {{ group.stats.activeStatusText }}
        </div>
      </div>
      
      <div class="control-mode">
        <badge :variant="modeBadge.variant">
          <icon :name="modeBadge.icon" />
          {{ modeBadge.text }}
        </badge>
        <span class="description">{{ group.controlDescription }}</span>
      </div>
    </div>
    
    <div class="actions">
      <button 
        v-if="group.canSwitchMode()" 
        @click="$emit('switch-mode', group)"
      >
        切换模式
      </button>
      
      <button 
        v-if="group.canEdit()" 
        @click="$emit('edit', group)"
      >
        编辑
      </button>
      
      <button 
        v-if="group.canDelete()" 
        @click="$emit('delete', group)"
        :disabled="group.hasTemplates()"
      >
        删除
      </button>
    </div>
  </div>
</template>
```

## 注意事项

1. **effectiveEnabled vs selfEnabled**: 
   - `selfEnabled`: 模板自身的启用状态
   - `effectiveEnabled`: 实际生效状态 (考虑组控制)
   - 在客户端，`effectiveEnabled` 是计算属性，不从服务端接收

2. **时间格式化**: 
   - 所有时间相关的显示属性都是计算属性
   - 会根据当前时间动态更新
   - 建议在需要实时更新的场景使用响应式计算

3. **DTO 转换**: 
   - `toServerDTO()` 用于发送到 API
   - `toClientDTO()` 用于本地缓存
   - `fromServerDTO()` 用于处理 API 响应
   - `fromClientDTO()` 用于恢复缓存

4. **权限检查**: 
   - 所有 `can*()` 方法返回布尔值
   - 应该在 UI 中用于控制按钮禁用状态
   - 不应该用于服务端权限验证

5. **值对象不可变性**: 
   - 值对象应该是不可变的
   - 修改配置应该创建新的值对象实例
   - 使用 `readonly` 属性确保不可变性
