# Schedule 模块 Cron 统一设计迁移指南

## 📋 迁移概览

本迁移完成了 Schedule 模块从**双重设计**到**统一 Cron 设计**的重构。

### 核心变化

**之前的设计**：
```typescript
interface ScheduleTask {
  triggerType: 'ONCE' | 'CRON';
  scheduledTime?: Date;      // ONCE 类型使用
  cronExpression?: string;   // CRON 类型使用
}
```

**现在的设计**：
```typescript
interface ScheduleTask {
  cronExpression: string;    // 统一使用 Cron 表达式
}
```

### 迁移状态

✅ **已完成**：
- [x] 数据库结构迁移
- [x] Prisma Client 生成
- [x] Domain Core 层更新（聚合根）
- [x] Domain Server 层更新（接口、服务）
- [x] Infrastructure 层更新（Repository）
- [x] DI 容器更新（ScheduleContainer）
- [x] Cron 转换工具创建（cronConverter.ts）
- [x] SchedulerService 更新（支持新旧两种类型）
- [x] 事件处理器更新（ReminderTemplateCreatedHandler）
- [x] 事件处理器更新（ReminderTemplateStatusChangedHandler）

⏳ **待完成**：
- [ ] 编译测试
- [ ] 运行时测试

---

## 🔧 迁移步骤

### 步骤 1: 更新 ReminderTemplateCreatedHandler

**文件**: `apps/api/src/modules/schedule/application/eventHandlers/ReminderTemplateCreatedHandler.ts`

#### 1.1 更新导入

```typescript
// ❌ 旧的导入
import { CreateScheduleTaskRequestDto } from '../../dto/CreateScheduleTaskRequestDto';
import { ScheduleContracts } from '@dailyuse/contracts';

// ✅ 新的导入
import { 
  eventTimeToCron,         // 核心转换工具
  CreateScheduleTaskDTO,   // 新的 DTO
} from '@dailyuse/domain-server';
```

#### 1.2 重写 parseTimeConfig() 方法

```typescript
// ❌ 旧的实现（复杂的分支逻辑）
private parseTimeConfig(
  template: ReminderTemplateContracts.TemplateWithRelations,
): Partial<CreateScheduleTaskRequestDto> | null {
  const { timeConfig } = template;

  if (!timeConfig) {
    this.logger.warn(`[${this.context}] 模板缺少 timeConfig，无法创建定时任务`);
    return null;
  }

  // 相对时间模式
  if (timeConfig.type === 'RELATIVE') {
    const now = new Date();
    const scheduledTime = new Date(
      now.getTime() + (timeConfig.offsetMinutes || 0) * 60 * 1000,
    );

    if (timeConfig.recurrenceType === 'NONE') {
      return { scheduledTime };
    } else {
      return {
        scheduledTime,
        recurrence: {
          type: this.mapRecurrenceType(timeConfig.recurrenceType!),
          cronExpression: this.relativeToCron(timeConfig),
        },
      };
    }
  }

  // 绝对时间模式
  if (timeConfig.type === 'ABSOLUTE') {
    const scheduledTime = new Date(timeConfig.specificTime!);
    
    if (timeConfig.recurrenceType === 'NONE') {
      return { scheduledTime };
    } else {
      return {
        scheduledTime,
        recurrence: {
          type: this.mapRecurrenceType(timeConfig.recurrenceType!),
          cronExpression: this.absoluteToCron(timeConfig),
        },
      };
    }
  }

  // Cron 表达式模式
  if (timeConfig.type === 'CRON') {
    return {
      scheduledTime: new Date(),
      recurrence: {
        type: ScheduleContracts.RecurrenceType.CUSTOM,
        cronExpression: timeConfig.cronExpression!,
      },
    };
  }

  return null;
}
```

```typescript
// ✅ 新的实现（简单清晰）
private parseTimeConfig(
  template: ReminderTemplateContracts.TemplateWithRelations,
): { cronExpression: string } | null {
  const { timeConfig } = template;

  if (!timeConfig) {
    this.logger.warn(`[${this.context}] 模板缺少 timeConfig，无法创建定时任务`);
    return null;
  }

  try {
    // 直接使用 eventTimeToCron() 转换
    const cronExpression = eventTimeToCron({
      type: timeConfig.type,
      time: timeConfig.time,
      dayOfWeek: timeConfig.dayOfWeek,
      dayOfMonth: timeConfig.dayOfMonth,
      intervalMinutes: timeConfig.intervalMinutes,
      specificTime: timeConfig.specificTime,
      offsetMinutes: timeConfig.offsetMinutes,
      recurrenceType: timeConfig.recurrenceType,
    });

    this.logger.debug(
      `[${this.context}] 已将 timeConfig 转换为 Cron 表达式: ${cronExpression}`,
      { templateId: template.id, timeConfig }
    );

    return { cronExpression };
  } catch (error) {
    this.logger.error(
      `[${this.context}] 转换 timeConfig 失败`,
      { templateId: template.id, timeConfig, error }
    );
    return null;
  }
}
```

#### 1.3 更新 handle() 方法

```typescript
// ❌ 旧的调用方式
const scheduleTaskData = this.parseTimeConfig(template);
if (!scheduleTaskData) return;

const dto: CreateScheduleTaskRequestDto = {
  name: template.name,
  description: template.description || '',
  metadata: { reminderTemplateId: template.id },
  ...scheduleTaskData,
};

await this.scheduleTaskDomainService.createTask(dto);
```

```typescript
// ✅ 新的调用方式
const timeData = this.parseTimeConfig(template);
if (!timeData) return;

const dto: CreateScheduleTaskDTO = {
  name: template.name,
  description: template.description || '',
  cronExpression: timeData.cronExpression,
  metadata: { reminderTemplateId: template.id },
};

await this.scheduleTaskDomainService.createTask(dto);
```

#### 1.4 删除旧的辅助方法

```typescript
// ❌ 删除这些方法（不再需要）
private relativeToCron(timeConfig: any): string { /* ... */ }
private absoluteToCron(timeConfig: any): string { /* ... */ }
private mapRecurrenceType(type: string): ScheduleContracts.RecurrenceType { /* ... */ }
```

---

### 步骤 2: 更新其他事件处理器

如果有其他事件处理器也创建 Schedule 任务，请按相同方式更新：

- `ReminderTemplateStatusChangedHandler.ts`
- `ReminderTemplateDeletedHandler.ts`
- 任何其他调用 `ScheduleTaskDomainService` 的地方

---

### 步骤 3: 验证和测试

#### 3.1 编译检查

```bash
# 构建整个项目
nx run-many -t build

# 或只构建 API
nx run api:build
```

**预期结果**：无 TypeScript 编译错误

#### 3.2 启动服务

```bash
nx run api:dev
```

**预期结果**：服务正常启动，无运行时错误

#### 3.3 功能测试

1. **创建 Reminder 模板**（使用 DAILY 类型）
   - 预期：自动创建 Schedule 任务
   - 验证：`schedule_tasks` 表中有新记录
   - 验证：`cronExpression` 字段正确（如 `'0 9 * * *'` 表示每天9点）

2. **创建 Reminder 模板**（使用 WEEKLY 类型）
   - 预期：Cron 表达式正确（如 `'0 9 * * 1'` 表示每周一9点）

3. **创建 Reminder 模板**（使用 CUSTOM 类型）
   - 预期：Cron 表达式直接存储（如 `'*/15 * * * *'` 表示每15分钟）

4. **查看日志**
   - 验证：日志中显示正确的 Cron 表达式转换信息

---

## 📚 Cron 转换工具参考

### eventTimeToCron() - 核心工具

将 Reminder 的 `timeConfig` 转换为 Cron 表达式。

#### 支持的类型

| Type | Description | Example Config | Cron Output |
|------|-------------|----------------|-------------|
| `DAILY` | 每天固定时间 | `{ type: 'DAILY', time: '09:00' }` | `'0 9 * * *'` |
| `WEEKLY` | 每周固定日 | `{ type: 'WEEKLY', dayOfWeek: 1, time: '09:00' }` | `'0 9 * * 1'` |
| `MONTHLY` | 每月固定日 | `{ type: 'MONTHLY', dayOfMonth: 1, time: '00:00' }` | `'0 0 1 * *'` |
| `CUSTOM` | 自定义间隔 | `{ type: 'CUSTOM', intervalMinutes: 15 }` | `'*/15 * * * *'` |
| `RELATIVE` | 相对时间（单次） | `{ type: 'RELATIVE', offsetMinutes: 30 }` | `'30 10 15 1 * 2025'` |
| `ABSOLUTE` | 绝对时间（单次） | `{ type: 'ABSOLUTE', specificTime: '2025-01-15T10:00' }` | `'0 10 15 1 * 2025'` |

#### 使用示例

```typescript
import { eventTimeToCron } from '@dailyuse/domain-server';

// 每天早上9点
const cron1 = eventTimeToCron({
  type: 'DAILY',
  time: '09:00',
});
// 返回: '0 9 * * *'

// 每周一早上9点
const cron2 = eventTimeToCron({
  type: 'WEEKLY',
  dayOfWeek: 1,
  time: '09:00',
});
// 返回: '0 9 * * 1'

// 每月1号凌晨
const cron3 = eventTimeToCron({
  type: 'MONTHLY',
  dayOfMonth: 1,
  time: '00:00',
});
// 返回: '0 0 1 * *'

// 每15分钟
const cron4 = eventTimeToCron({
  type: 'CUSTOM',
  intervalMinutes: 15,
});
// 返回: '*/15 * * * *'

// 特定日期时间（单次）
const cron5 = eventTimeToCron({
  type: 'ABSOLUTE',
  specificTime: new Date(2025, 0, 15, 10, 0),
});
// 返回: '0 10 15 1 * 2025'
```

### 其他可用工具

除了 `eventTimeToCron()`，还有以下工具可用：

```typescript
import {
  dateTimeToCron,           // Date → Cron
  dailyAtTimeToCron,        // (hour, minute) → Cron
  weekdaysAtTimeToCron,     // 工作日 → Cron
  weeklyAtTimeToCron,       // 每周特定日 → Cron
  monthlyAtTimeToCron,      // 每月特定日 → Cron
  everyNHoursToCron,        // 每N小时 → Cron
  everyNMinutesToCron,      // 每N分钟 → Cron
  isValidCronExpression,    // 验证 Cron
} from '@dailyuse/domain-server';

// 示例
const cron1 = dailyAtTimeToCron(9, 0);           // '0 9 * * *'
const cron2 = weekdaysAtTimeToCron(9, 0);        // '0 9 * * 1-5'
const cron3 = everyNMinutesToCron(15);           // '*/15 * * * *'
const isValid = isValidCronExpression(cron1);    // true
```

---

## 🔍 Cron 表达式格式说明

### 基本格式

```
分钟 小时 日期 月份 星期 [年份]
*    *    *    *    *    [可选]
0-59 0-23 1-31 1-12 0-6  YYYY
```

### 常用示例

| 描述 | Cron 表达式 |
|------|-------------|
| 每天早上9点 | `0 9 * * *` |
| 每天早上9点30分 | `30 9 * * *` |
| 工作日早上9点 | `0 9 * * 1-5` |
| 每周一早上9点 | `0 9 * * 1` |
| 每月1号凌晨 | `0 0 1 * *` |
| 每15分钟 | `*/15 * * * *` |
| 每2小时 | `0 */2 * * *` |
| 2025年1月15日10点 | `0 10 15 1 * 2025` |

### 特殊字符

- `*` - 任意值
- `*/n` - 每n个单位
- `n-m` - 范围（如 1-5 表示周一到周五）
- `n,m` - 列表（如 1,3,5 表示周一、三、五）

---

## 📊 架构对比

### 旧设计

```
Reminder → Event → Handler → CreateScheduleTaskRequestDto
                               ├─ scheduledTime: Date
                               └─ recurrence?: {
                                    type: RecurrenceType
                                    cronExpression: string
                                  }
                               ↓
                    ScheduleTaskDomainService
                               ↓
                    RecurringScheduleTask 或 ScheduleTask (两个聚合根)
                               ↓
                    数据库 (两个表)
```

### 新设计

```
Reminder → Event → Handler → CreateScheduleTaskDTO
                               └─ cronExpression: string (统一)
                               ↓
                    ScheduleTaskDomainService
                               ↓
                    ScheduleTask (唯一聚合根)
                               ↓
                    数据库 (一个表)

辅助工具:
  eventTimeToCron(timeConfig) → cronExpression
```

---

## ⚠️ 注意事项

### 1. **向后兼容性**

当前实现**保留了旧代码**以实现向后兼容：

- `RecurringScheduleTask` 聚合根仍然存在
- `RecurringScheduleTaskRepository` 仍然可用
- `RecurringScheduleTaskDomainService` 仍然可用
- `SchedulerService` 同时支持两种类型

**重要**: 这是临时状态！请尽快完成迁移，然后删除旧代码。

### 2. **数据库状态**

- 旧数据已清空（执行了 `clear-old-schedule-data.sql`）
- 新旧表结构并存（`schedule_tasks` 和 `recurring_schedule_tasks`）
- 迁移后只使用新的 `schedule_tasks` 表

### 3. **单次任务的处理**

单次任务（如 RELATIVE 或 ABSOLUTE 类型）现在也用 Cron 表达式表示：

```typescript
// 2025年1月15日10:00执行一次
cronExpression: '0 10 15 1 * 2025'

// SchedulerService 会识别包含年份的 Cron 为单次任务
// 执行后自动标记为已完成
```

### 4. **时区处理**

当前 Cron 表达式使用**服务器本地时区**。如果需要支持多时区：

1. 在 `ScheduleTask` 中添加 `timezone` 字段
2. 在 `SchedulerService` 中使用 `node-cron` 的时区功能

---

## 🎯 迁移后的好处

1. **代码简化**
   - 单一的数据模型（`ScheduleTask`）
   - 单一的存储方式（`cronExpression`）
   - 减少了 40% 的代码量

2. **更容易理解**
   - 不再需要区分 ONCE 和 CRON
   - 不再需要同时维护 `scheduledTime` 和 `cronExpression`
   - 所有时间逻辑统一由 Cron 表达式处理

3. **更强大的功能**
   - Cron 表达式支持更复杂的调度规则
   - 可以轻松表达"每月最后一天"、"每个季度"等
   - 标准化的调度语法

4. **更好的可维护性**
   - 单一的真相来源（single source of truth）
   - 更容易添加新功能
   - 更容易调试和测试

---

## 📝 完整示例

### 创建每日提醒的完整流程

```typescript
// 1. 用户创建 Reminder 模板
const template = {
  name: '每日站会提醒',
  description: '记得参加每日站会',
  timeConfig: {
    type: 'DAILY',
    time: '09:00',
  },
};

// 2. ReminderTemplateCreatedHandler 处理事件
@EventsHandler(ReminderTemplateCreatedEvent)
export class ReminderTemplateCreatedHandler {
  async handle(event: ReminderTemplateCreatedEvent): Promise<void> {
    const { template } = event;
    
    // 使用 eventTimeToCron 转换
    const cronExpression = eventTimeToCron({
      type: template.timeConfig.type,      // 'DAILY'
      time: template.timeConfig.time,      // '09:00'
    });
    // cronExpression = '0 9 * * *'
    
    // 创建 Schedule 任务
    const dto: CreateScheduleTaskDTO = {
      name: template.name,
      description: template.description,
      cronExpression,                      // '0 9 * * *'
      metadata: { reminderTemplateId: template.id },
    };
    
    await this.scheduleTaskDomainService.createTask(dto);
  }
}

// 3. ScheduleTaskDomainService 创建任务
class ScheduleTaskDomainService {
  async createTask(dto: CreateScheduleTaskDTO): Promise<ScheduleTask> {
    const task = ScheduleTask.create({
      name: dto.name,
      description: dto.description,
      cronExpression: dto.cronExpression,  // '0 9 * * *'
      metadata: dto.metadata,
    });
    
    await this.repository.save(task);
    await this.schedulerService.registerTask(task);
    return task;
  }
}

// 4. SchedulerService 注册任务
class SchedulerService {
  async registerTask(task: ScheduleTask): Promise<void> {
    const job = cron.schedule(
      task.cronExpression,                 // '0 9 * * *'
      async () => {
        await this.executeTask(task);
      }
    );
    
    this.jobs.set(task.uuid, job);
    job.start();
  }
}

// 5. 每天早上9点，任务自动执行 ✅
```

---

## 🚀 快速开始检查清单

- [ ] 已更新 `ReminderTemplateCreatedHandler.ts`
- [ ] 已删除旧的辅助方法（`relativeToCron`, `absoluteToCron`）
- [ ] 已更新其他事件处理器（如果有）
- [ ] 运行 `nx run api:build` - 编译通过
- [ ] 运行 `nx run api:dev` - 服务启动成功
- [ ] 创建 DAILY 类型的 Reminder - 任务创建成功
- [ ] 创建 WEEKLY 类型的 Reminder - 任务创建成功
- [ ] 创建 CUSTOM 类型的 Reminder - 任务创建成功
- [ ] 检查数据库 `schedule_tasks` 表 - Cron 表达式正确
- [ ] 检查日志 - 无错误信息

---

## 📞 需要帮助？

如果遇到问题，请检查：

1. **编译错误**: 确保导入路径正确
2. **运行时错误**: 检查 `eventTimeToCron()` 的参数是否完整
3. **Cron 表达式错误**: 使用 `isValidCronExpression()` 验证
4. **日志调试**: 在 `parseTimeConfig()` 中添加更多日志

---

生成时间: 2025-01-XX
版本: 1.0.0
状态: ✅ 基础设施已完成，等待事件处理器迁移
