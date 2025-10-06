# Reminder 模块架构重构方案

## 📋 问题背景

当前 Reminder 模块的实现存在以下问题：

1. **实例膨胀**：为每个触发时间预先创建 ReminderInstance，导致：
   - 数据库存储大量冗余数据（如每分钟提醒，7天 = 10080 条记录）
   - 需要限制最大生成数量（当前限制 100 个）
   - 无法实现真正的"无限循环"提醒

2. **维护复杂**：
   - 需要定期清理已触发的历史实例
   - 需要定期补充新实例（否则会"断供"）
   - 增加系统负担

3. **语义不符**：
   - ReminderTemplate 是"规则"，不应该生成大量"实例"
   - Instance 应该代表"当前激活的提醒"，而不是"每次触发"

## 🎯 新架构设计

### 核心原则

**Reminder 定义规则，Schedule 负责执行**

- **ReminderTemplate** = 提醒规则（类似 Cron 表达式）
- **Schedule Task** = 循环调度任务（持久化运行）
- **Notification** = 触发时的通知（临时，触发即消失）

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Reminder Module                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ReminderTemplate (规则定义)                            │ │
│  │ - timeConfig: { type, cronExpression, customPattern }  │ │
│  │ - enabled: boolean                                     │ │
│  │ - analytics: { totalTriggers, ... }                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                   │
│                           │ 创建/更新事件                      │
│                           ▼                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ DomainEvent
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Schedule Module                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ RecurringScheduleTask (循环调度任务)                   │ │
│  │ - templateUuid: string                                 │ │
│  │ - type: 'recurring'                                    │ │
│  │ - cronExpression: string                               │ │
│  │ - nextRunTime: Date                                    │ │
│  │ - enabled: boolean                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                   │
│                           │ 到时间触发                         │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Scheduler (定时器)                                      │ │
│  │ - 监控 nextRunTime                                      │ │
│  │ - 触发 Notification                                     │ │
│  │ - 更新 analytics                                        │ │
│  │ - 计算下次触发时间                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ NotificationEvent
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Notification Module                         │
│  - 显示桌面通知                                               │
│  - 播放提示音                                                 │
│  - 记录用户响应（确认/延迟/忽略）                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 详细设计

### 1. ReminderTemplate 改造

#### 移除 instances 数组
```typescript
// ❌ 旧设计
class ReminderTemplate {
  instances: ReminderInstance[];  // 预先生成大量实例
  
  createInstance(scheduledTime: Date) {
    // 为每次触发创建实例
  }
}

// ✅ 新设计
class ReminderTemplate {
  // 不再包含 instances
  
  toCronExpression(): string {
    // 根据 timeConfig 生成 cron 表达式
    // daily: "0 9 * * *"
    // weekly: "0 9 * * 1,3,5"
    // custom: "*/1 * * * *"
  }
  
  getNextTriggerTime(from: Date): Date {
    // 根据规则计算下次触发时间（用于 Schedule）
  }
}
```

#### TimeConfig 扩展
```typescript
interface ReminderTimeConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'custom' | 'cron';
  
  // 现有字段
  times?: string[];
  weekdays?: number[];
  monthDays?: number[];
  customPattern?: {
    interval: number;
    unit: 'minutes' | 'hours' | 'days';
  };
  
  // 新增：直接支持 cron 表达式
  cronExpression?: string;  // "*/5 * * * *"
}
```

### 2. Schedule Module 设计

#### RecurringScheduleTask 实体
```typescript
class RecurringScheduleTask {
  id: string;
  templateUuid: string;        // 关联的 ReminderTemplate
  type: 'recurring';            // 任务类型
  cronExpression: string;       // Cron 表达式
  nextRunTime: Date;            // 下次触发时间
  lastRunTime?: Date;           // 上次触发时间
  enabled: boolean;             // 是否启用
  
  // 计算下次触发时间
  calculateNextRun(): Date {
    // 使用 cron-parser 库
    const interval = parser.parseExpression(this.cronExpression);
    return interval.next().toDate();
  }
  
  // 执行任务
  async execute() {
    // 1. 发布 NotificationEvent
    // 2. 更新 Template.analytics
    // 3. 计算并更新 nextRunTime
  }
}
```

#### Scheduler 服务
```typescript
class SchedulerService {
  private tasks: Map<string, RecurringScheduleTask> = new Map();
  
  // 启动调度器
  start() {
    setInterval(() => {
      this.checkAndExecuteTasks();
    }, 1000); // 每秒检查
  }
  
  // 检查并执行到期任务
  private async checkAndExecuteTasks() {
    const now = new Date();
    
    for (const [id, task] of this.tasks) {
      if (task.enabled && task.nextRunTime <= now) {
        await task.execute();
        
        // 计算下次触发时间
        task.nextRunTime = task.calculateNextRun();
        await this.saveTask(task);
      }
    }
  }
  
  // 监听 Template 事件
  onTemplateCreated(template: ReminderTemplate) {
    const task = new RecurringScheduleTask({
      templateUuid: template.uuid,
      cronExpression: template.toCronExpression(),
      nextRunTime: template.getNextTriggerTime(new Date()),
      enabled: template.enabled && template.selfEnabled,
    });
    
    this.tasks.set(task.id, task);
    this.saveTask(task);
  }
  
  onTemplateUpdated(template: ReminderTemplate) {
    const task = this.tasks.get(template.uuid);
    if (task) {
      task.cronExpression = template.toCronExpression();
      task.nextRunTime = template.getNextTriggerTime(new Date());
      task.enabled = template.enabled && template.selfEnabled;
      this.saveTask(task);
    }
  }
  
  onTemplateDeleted(templateUuid: string) {
    this.tasks.delete(templateUuid);
    this.deleteTask(templateUuid);
  }
}
```

### 3. 数据库设计

#### reminder_templates 表
```sql
CREATE TABLE reminder_templates (
  uuid UUID PRIMARY KEY,
  account_uuid UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  self_enabled BOOLEAN DEFAULT true,
  time_config JSONB NOT NULL,  -- 包含 type, cronExpression 等
  priority VARCHAR(50),
  category VARCHAR(100),
  tags TEXT[],
  analytics JSONB,
  lifecycle JSONB,
  version INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 不再需要 reminder_instances 表！
```

#### schedule_tasks 表
```sql
CREATE TABLE schedule_tasks (
  id UUID PRIMARY KEY,
  template_uuid UUID REFERENCES reminder_templates(uuid) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,  -- 'recurring'
  cron_expression VARCHAR(100) NOT NULL,
  next_run_time TIMESTAMP NOT NULL,
  last_run_time TIMESTAMP,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_schedule_tasks_next_run ON schedule_tasks(next_run_time, enabled);
CREATE INDEX idx_schedule_tasks_template ON schedule_tasks(template_uuid);
```

### 4. 事件驱动集成

#### Domain Events
```typescript
// Reminder 模块发布
interface ReminderTemplateCreatedEvent {
  eventType: 'ReminderTemplateCreated';
  aggregateId: string;
  payload: {
    template: ReminderTemplateDTO;
  };
}

interface ReminderTemplateEnabledChangedEvent {
  eventType: 'ReminderTemplateEnabledChanged';
  aggregateId: string;
  payload: {
    templateUuid: string;
    enabled: boolean;
  };
}

// Schedule 模块订阅
class ScheduleEventHandler {
  @EventHandler(ReminderTemplateCreatedEvent)
  async onTemplateCreated(event: ReminderTemplateCreatedEvent) {
    await this.schedulerService.onTemplateCreated(event.payload.template);
  }
  
  @EventHandler(ReminderTemplateEnabledChangedEvent)
  async onTemplateEnabledChanged(event: ReminderTemplateEnabledChangedEvent) {
    await this.schedulerService.updateTaskEnabled(
      event.payload.templateUuid,
      event.payload.enabled
    );
  }
}
```

## 📊 对比分析

### 存储占用对比

**场景**：每分钟提醒，运行30天

| 方案 | 记录数 | 存储估算 |
|------|--------|----------|
| 旧方案（预生成实例） | 30 * 24 * 60 = 43,200 条 | ~10 MB |
| 新方案（单个任务） | 1 条 | ~1 KB |

**节省**：99.99% 的存储空间

### 性能对比

| 操作 | 旧方案 | 新方案 | 提升 |
|------|--------|--------|------|
| 创建模板 | 生成100实例 ~500ms | 创建1任务 ~5ms | **100x** |
| 查询提醒 | 扫描10万+实例 ~2s | 查询活跃任务 ~10ms | **200x** |
| 定期清理 | 每天清理旧实例 | 无需清理 | **∞** |

## 🚀 迁移步骤

### Phase 1: Schedule 模块开发（2周）

1. **Week 1**：
   - [ ] 创建 Schedule 模块基础架构
   - [ ] 实现 RecurringScheduleTask 实体
   - [ ] 实现 SchedulerService 核心逻辑
   - [ ] 集成 cron-parser 库

2. **Week 2**：
   - [ ] 实现事件订阅（监听 Reminder 模块）
   - [ ] 实现任务持久化（schedule_tasks 表）
   - [ ] 编写单元测试
   - [ ] 编写集成测试

### Phase 2: Reminder 模块改造（1周）

1. **Day 1-2**：
   - [ ] ReminderTemplate 添加 `toCronExpression()` 方法
   - [ ] 移除 `instances` 数组和相关方法
   - [ ] 更新 Domain Events

2. **Day 3-4**：
   - [ ] 更新 Controller 和 Service 层
   - [ ] 移除实例生成逻辑
   - [ ] 更新 API 文档

3. **Day 5**：
   - [ ] 前端适配（移除实例列表显示）
   - [ ] 测试和 Bug 修复

### Phase 3: 数据迁移（1周）

1. **准备阶段**：
   ```sql
   -- 备份现有数据
   CREATE TABLE reminder_instances_backup AS 
   SELECT * FROM reminder_instances;
   ```

2. **迁移脚本**：
   ```typescript
   async function migrateToSchedule() {
     // 1. 为所有启用的 Template 创建 Schedule Task
     const templates = await db.reminderTemplate.findMany({
       where: { enabled: true, selfEnabled: true }
     });
     
     for (const template of templates) {
       await scheduleService.createTask({
         templateUuid: template.uuid,
         cronExpression: generateCronExpression(template.timeConfig),
         nextRunTime: calculateNextRun(template.timeConfig),
       });
     }
     
     // 2. 删除旧的 instances
     await db.reminderInstance.deleteMany({});
     
     // 3. 验证迁移
     const taskCount = await db.scheduleTask.count();
     console.log(`Migrated ${taskCount} templates to schedule tasks`);
   }
   ```

3. **回滚方案**：
   ```sql
   -- 恢复数据
   INSERT INTO reminder_instances 
   SELECT * FROM reminder_instances_backup;
   ```

### Phase 4: 验证和上线（1周）

1. **功能验证**：
   - [ ] 每日提醒正常触发
   - [ ] 每周提醒正常触发
   - [ ] 每月提醒正常触发
   - [ ] 自定义间隔提醒正常触发
   - [ ] 启用/禁用正常工作

2. **性能验证**：
   - [ ] 创建模板 < 10ms
   - [ ] 查询模板 < 50ms
   - [ ] 触发提醒 < 100ms

3. **上线**：
   - [ ] 灰度发布（10% 用户）
   - [ ] 监控关键指标
   - [ ] 全量发布

## 💡 前端适配

### 移除实例列表显示

**Before**:
```vue
<template>
  <div>
    <h3>最近实例</h3>
    <div v-for="instance in template.instances">
      {{ instance.scheduledTime }}
    </div>
  </div>
</template>
```

**After**:
```vue
<template>
  <div>
    <h3>下次触发</h3>
    <div>{{ template.nextTriggerTime }}</div>
    
    <h3>触发规则</h3>
    <div>{{ formatCronExpression(template.timeConfig) }}</div>
  </div>
</template>
```

### 添加规则预览

```vue
<template>
  <v-card>
    <v-card-title>触发规则预览</v-card-title>
    <v-card-text>
      <div class="preview-item">
        <strong>规则：</strong>
        <v-chip color="primary">{{ cronDescription }}</v-chip>
      </div>
      
      <div class="preview-item">
        <strong>下次触发：</strong>
        {{ nextTriggerTime }}
      </div>
      
      <div class="preview-item">
        <strong>未来10次触发时间：</strong>
        <v-timeline density="compact">
          <v-timeline-item 
            v-for="time in next10Triggers" 
            :key="time"
            size="small"
          >
            {{ formatDateTime(time) }}
          </v-timeline-item>
        </v-timeline>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import parser from 'cron-parser';

const cronDescription = computed(() => {
  // 使用 cronstrue 库将 cron 转换为人类可读
  return cronstrue.toString(template.value.cronExpression);
  // 输出：'Every minute' 或 '每分钟'
});

const next10Triggers = computed(() => {
  const interval = parser.parseExpression(template.value.cronExpression);
  const times = [];
  for (let i = 0; i < 10; i++) {
    times.push(interval.next().toDate());
  }
  return times;
});
</script>
```

## 📚 技术栈

### 新增依赖

```json
{
  "dependencies": {
    "cron-parser": "^4.9.0",      // Cron 表达式解析
    "cronstrue": "^2.50.0",        // Cron 转人类可读
    "node-schedule": "^2.1.1"      // 可选：替代自己实现调度器
  }
}
```

## 🎯 预期收益

### 1. 存储优化
- **减少 99%+ 的数据库记录**
- **降低 90%+ 的存储成本**

### 2. 性能提升
- **创建模板速度提升 100 倍**
- **查询速度提升 200 倍**
- **无需定期清理任务**

### 3. 可维护性
- **代码更简洁**：移除复杂的实例生成逻辑
- **语义更清晰**：Template = 规则，Schedule = 执行
- **扩展性更好**：易于支持新的提醒类型

### 4. 用户体验
- **真正的无限循环**：不受预生成限制
- **即时生效**：修改规则立即生效，无需重新生成
- **更快响应**：创建/修改模板无延迟

## ⚠️ 风险和注意事项

### 1. Schedule 模块的可靠性
- **风险**：调度器进程崩溃导致提醒丢失
- **缓解**：
  - 使用 PM2 等进程管理工具自动重启
  - 持久化 nextRunTime，重启后恢复
  - 添加健康检查

### 2. 时区处理
- **风险**：跨时区用户的提醒时间不准确
- **缓解**：
  - 存储用户时区
  - Cron 表达式基于用户时区计算
  - 前端显示转换为本地时间

### 3. 性能瓶颈
- **风险**：大量并发任务触发
- **缓解**：
  - 任务队列（Bull/BullMQ）
  - 水平扩展调度器
  - 任务分片

## 📖 参考资料

- [Cron Expression](https://crontab.guru/)
- [cron-parser NPM](https://www.npmjs.com/package/cron-parser)
- [cronstrue NPM](https://www.npmjs.com/package/cronstrue)
- [Node Schedule](https://github.com/node-schedule/node-schedule)

---

**提案作者**: AI Assistant  
**创建日期**: 2025-10-06  
**状态**: 待评审  
**预计工期**: 5 周（开发 + 测试 + 迁移）
