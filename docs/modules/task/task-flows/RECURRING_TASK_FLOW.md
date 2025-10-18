# 循环任务流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-18
- **架构模式**: DDD (Task 模块)
- **相关模块**: Task, Scheduler
- **业务场景**: 循环/重复任务的规则配置与实例自动生成

---

## 1. 业务概述

### 1.1 业务目标

循环任务（Recurring Task）是 Task 模块的核心功能，支持多种重复模式：

- **每日重复**: 每天固定时间执行（如每日站会）
- **每周重复**: 每周指定星期执行（如周一健身）
- **每月重复**: 每月指定日期执行（如月度总结）
- **自定义重复**: 灵活的间隔规则（如每隔3天）
- **自动生成**: 定时调度自动生成未来的任务实例
- **智能截止**: 支持重复次数或截止日期

### 1.2 核心原则

- **规则驱动**: 通过 RecurrenceRule 值对象定义重复规则
- **提前生成**: 提前 N 天生成任务实例，确保用户看到即将到来的任务
- **独立修改**: 生成的实例可独立修改，不影响模板
- **智能跳过**: 支持跳过某次重复，不影响后续任务
- **结束管理**: 支持永久重复、指定次数、指定日期结束

### 1.3 重复频率类型

| 类型    | 说明     | 示例           | interval 含义   |
| ------- | -------- | -------------- | --------------- |
| DAILY   | 每日重复 | 每天早上9点    | 每 N 天重复一次 |
| WEEKLY  | 每周重复 | 每周一、三、五 | 每 N 周重复一次 |
| MONTHLY | 每月重复 | 每月1号和15号  | 每 N 月重复一次 |
| YEARLY  | 每年重复 | 每年1月1日     | 每 N 年重复一次 |
| CUSTOM  | 自定义   | 用户自定义规则 | 自定义间隔      |

---

## 2. RecurrenceRule 值对象

### 2.1 数据结构

```typescript
interface RecurrenceRuleParams {
  frequency: RecurrenceFrequency;      // DAILY | WEEKLY | MONTHLY | YEARLY | CUSTOM
  interval: number;                    // 间隔（默认1）
  byWeekday?: number[] | null;         // 周几重复（0=周日, 1=周一, ..., 6=周六）
  byMonthDay?: number[] | null;        // 每月几号重复（1-31）
  byMonth?: number[] | null;           // 每年几月重复（1-12）
  count?: number | null;               // 重复次数（null 表示无限）
  until?: number | null;               // 重复截止日期（timestamp, null 表示无限）
}
```

### 2.2 值对象实现

```typescript
// RecurrenceRule.ts
export class RecurrenceRule {
  private readonly _frequency: RecurrenceFrequency;
  private readonly _interval: number;
  private readonly _byWeekday: number[] | null;
  private readonly _byMonthDay: number[] | null;
  private readonly _byMonth: number[] | null;
  private readonly _count: number | null;
  private readonly _until: number | null;

  private constructor(params: RecurrenceRuleParams) {
    this._frequency = params.frequency;
    this._interval = params.interval;
    this._byWeekday = params.byWeekday || null;
    this._byMonthDay = params.byMonthDay || null;
    this._byMonth = params.byMonth || null;
    this._count = params.count || null;
    this._until = params.until || null;
  }

  public static create(params: RecurrenceRuleParams): RecurrenceRule {
    // 1. 验证 interval
    if (params.interval < 1) {
      throw new Error('重复间隔必须大于等于 1');
    }
    if (params.interval > 365) {
      throw new Error('重复间隔不能超过 365');
    }

    // 2. 验证 byWeekday
    if (params.byWeekday) {
      if (params.byWeekday.length === 0) {
        throw new Error('byWeekday 不能为空数组');
      }
      if (params.byWeekday.some(day => day < 0 || day > 6)) {
        throw new Error('byWeekday 必须在 0-6 之间');
      }
      if (params.frequency !== RecurrenceFrequency.WEEKLY) {
        throw new Error('byWeekday 只能用于 WEEKLY 频率');
      }
    }

    // 3. 验证 byMonthDay
    if (params.byMonthDay) {
      if (params.byMonthDay.length === 0) {
        throw new Error('byMonthDay 不能为空数组');
      }
      if (params.byMonthDay.some(day => day < 1 || day > 31)) {
        throw new Error('byMonthDay 必须在 1-31 之间');
      }
      if (params.frequency !== RecurrenceFrequency.MONTHLY) {
        throw new Error('byMonthDay 只能用于 MONTHLY 频率');
      }
    }

    // 4. 验证 byMonth
    if (params.byMonth) {
      if (params.byMonth.length === 0) {
        throw new Error('byMonth 不能为空数组');
      }
      if (params.byMonth.some(month => month < 1 || month > 12)) {
        throw new Error('byMonth 必须在 1-12 之间');
      }
      if (params.frequency !== RecurrenceFrequency.YEARLY) {
        throw new Error('byMonth 只能用于 YEARLY 频率');
      }
    }

    // 5. 验证 count 和 until 互斥
    if (params.count !== null && params.until !== null) {
      throw new Error('count 和 until 不能同时设置');
    }

    // 6. 验证 count
    if (params.count !== null) {
      if (params.count < 1) {
        throw new Error('重复次数必须大于等于 1');
      }
      if (params.count > 1000) {
        throw new Error('重复次数不能超过 1000');
      }
    }

    // 7. 验证 until
    if (params.until !== null) {
      if (params.until <= Date.now()) {
        throw new Error('重复截止日期必须在未来');
      }
    }

    return new RecurrenceRule(params);
  }

  // 计算从 startDate 到 endDate 之间的所有重复日期
  public getOccurrencesUntil(startDate: number, endDate: number): number[] {
    const occurrences: number[] = [];
    let currentDate = startDate;
    let count = 0;

    while (currentDate <= endDate) {
      // 检查是否超过重复次数
      if (this._count !== null && count >= this._count) {
        break;
      }

      // 检查是否超过截止日期
      if (this._until !== null && currentDate > this._until) {
        break;
      }

      // 检查当前日期是否符合重复规则
      if (this.matchesRule(currentDate)) {
        occurrences.push(currentDate);
        count++;
      }

      // 计算下一个日期
      currentDate = this.getNextDate(currentDate);
    }

    return occurrences;
  }

  // 检查日期是否符合规则
  private matchesRule(timestamp: number): boolean {
    const date = new Date(timestamp);

    switch (this._frequency) {
      case RecurrenceFrequency.DAILY:
        return true; // 每日重复，所有日期都符合

      case RecurrenceFrequency.WEEKLY:
        if (!this._byWeekday) return true;
        const dayOfWeek = date.getDay();
        return this._byWeekday.includes(dayOfWeek);

      case RecurrenceFrequency.MONTHLY:
        if (!this._byMonthDay) return true;
        const dayOfMonth = date.getDate();
        return this._byMonthDay.includes(dayOfMonth);

      case RecurrenceFrequency.YEARLY:
        if (!this._byMonth) return true;
        const month = date.getMonth() + 1; // 0-based to 1-based
        return this._byMonth.includes(month);

      default:
        return true;
    }
  }

  // 计算下一个日期
  private getNextDate(currentDate: number): number {
    const date = new Date(currentDate);

    switch (this._frequency) {
      case RecurrenceFrequency.DAILY:
        date.setDate(date.getDate() + this._interval);
        break;

      case RecurrenceFrequency.WEEKLY:
        date.setDate(date.getDate() + this._interval * 7);
        break;

      case RecurrenceFrequency.MONTHLY:
        date.setMonth(date.getMonth() + this._interval);
        break;

      case RecurrenceFrequency.YEARLY:
        date.setFullYear(date.getFullYear() + this._interval);
        break;

      default:
        date.setDate(date.getDate() + this._interval);
    }

    return date.getTime();
  }

  // 计算下一次重复的日期
  public getNextOccurrence(afterDate: number): number | null {
    const occurrences = this.getOccurrencesUntil(
      afterDate + 1,
      afterDate + 365 * 24 * 60 * 60 * 1000 // 搜索未来一年
    );

    return occurrences.length > 0 ? occurrences[0] : null;
  }

  // 判断是否有结束条件
  public hasEndCondition(): boolean {
    return this._count !== null || this._until !== null;
  }

  // 判断是否已结束
  public isEnded(currentDate: number, generatedCount: number): boolean {
    if (this._count !== null && generatedCount >= this._count) {
      return true;
    }
    if (this._until !== null && currentDate > this._until) {
      return true;
    }
    return false;
  }

  // Getters
  public get frequency(): RecurrenceFrequency {
    return this._frequency;
  }

  public get interval(): number {
    return this._interval;
  }

  public get byWeekday(): number[] | null {
    return this._byWeekday ? [...this._byWeekday] : null;
  }

  public get byMonthDay(): number[] | null {
    return this._byMonthDay ? [...this._byMonthDay] : null;
  }

  public get byMonth(): number[] | null {
    return this._byMonth ? [...this._byMonth] : null;
  }

  public get count(): number | null {
    return this._count;
  }

  public get until(): number | null {
    return this._until;
  }

  // 生成人类可读的描述
  public toHumanReadable(): string {
    let description = '';

    switch (this._frequency) {
      case RecurrenceFrequency.DAILY:
        description = this._interval === 1 
          ? '每天' 
          : `每 ${this._interval} 天`;
        break;

      case RecurrenceFrequency.WEEKLY:
        if (this._byWeekday) {
          const days = this._byWeekday
            .sort()
            .map(d => ['日', '一', '二', '三', '四', '五', '六'][d])
            .join('、');
          description = this._interval === 1
            ? `每周${days}`
            : `每 ${this._interval} 周的${days}`;
        } else {
          description = this._interval === 1 
            ? '每周' 
            : `每 ${this._interval} 周`;
        }
        break;

      case RecurrenceFrequency.MONTHLY:
        if (this._byMonthDay) {
          const days = this._byMonthDay.sort().join('、');
          description = this._interval === 1
            ? `每月 ${days} 号`
            : `每 ${this._interval} 月的 ${days} 号`;
        } else {
          description = this._interval === 1 
            ? '每月' 
            : `每 ${this._interval} 月`;
        }
        break;

      case RecurrenceFrequency.YEARLY:
        if (this._byMonth) {
          const months = this._byMonth.sort().join('、');
          description = `每年 ${months} 月`;
        } else {
          description = '每年';
        }
        break;

      default:
        description = '自定义重复';
    }

    // 添加结束条件
    if (this._count !== null) {
      description += `，共 ${this._count} 次`;
    } else if (this._until !== null) {
      const endDate = new Date(this._until);
      description += `，截止到 ${endDate.toLocaleDateString()}`;
    } else {
      description += '，永久重复';
    }

    return description;
  }
}
```

---

## 3. 重复任务示例

### 3.1 每日任务

```typescript
// 每天早上9点站会
const dailyStandup = RecurrenceRule.create({
  frequency: RecurrenceFrequency.DAILY,
  interval: 1,
  count: null, // 永久重复
  until: null,
});

// 每隔2天复习
const everyTwoDays = RecurrenceRule.create({
  frequency: RecurrenceFrequency.DAILY,
  interval: 2,
  count: 30, // 重复30次
  until: null,
});
```

### 3.2 每周任务

```typescript
// 每周一、三、五健身
const weeklyWorkout = RecurrenceRule.create({
  frequency: RecurrenceFrequency.WEEKLY,
  interval: 1,
  byWeekday: [1, 3, 5], // 周一、周三、周五
  count: null,
  until: null,
});

// 每两周的周一开会
const biweeklyMeeting = RecurrenceRule.create({
  frequency: RecurrenceFrequency.WEEKLY,
  interval: 2,
  byWeekday: [1], // 周一
  count: null,
  until: null,
});
```

### 3.3 每月任务

```typescript
// 每月1号发工资
const monthlySalary = RecurrenceRule.create({
  frequency: RecurrenceFrequency.MONTHLY,
  interval: 1,
  byMonthDay: [1],
  count: null,
  until: null,
});

// 每月15号和30号写总结
const monthlySummary = RecurrenceRule.create({
  frequency: RecurrenceFrequency.MONTHLY,
  interval: 1,
  byMonthDay: [15, 30],
  count: 12, // 重复12次（一年）
  until: null,
});
```

### 3.4 每年任务

```typescript
// 每年1月1日新年计划
const yearlyPlan = RecurrenceRule.create({
  frequency: RecurrenceFrequency.YEARLY,
  interval: 1,
  byMonth: [1],
  byMonthDay: [1],
  count: null,
  until: null,
});

// 每年生日提醒
const birthdayReminder = RecurrenceRule.create({
  frequency: RecurrenceFrequency.YEARLY,
  interval: 1,
  byMonth: [5],
  byMonthDay: [20],
  count: null,
  until: null,
});
```

---

## 4. 定时调度生成实例

### 4.1 调度器实现

```typescript
// TaskRecurrenceScheduler.ts
export class TaskRecurrenceScheduler {
  constructor(
    private taskTemplateRepository: ITaskTemplateRepository,
    private taskInstanceRepository: ITaskInstanceRepository,
    private reminderService: IReminderService
  ) {}

  // 每日凌晨2点执行
  async generateRecurringInstances(): Promise<void> {
    console.log('[RecurrenceScheduler] 开始生成循环任务实例...');

    // 1. 获取所有激活的重复任务模板
    const activeTemplates = await this.taskTemplateRepository.findByStatus(
      TaskTemplateStatus.ACTIVE
    );

    const recurringTemplates = activeTemplates.filter(
      t => t.taskType !== TaskType.ONE_TIME && t.recurrenceRule !== null
    );

    console.log(`[RecurrenceScheduler] 找到 ${recurringTemplates.length} 个循环任务模板`);

    const results = {
      processed: 0,
      generated: 0,
      skipped: 0,
      failed: 0,
    };

    // 2. 为每个模板生成实例
    for (const template of recurringTemplates) {
      try {
        const result = await this.generateInstancesForTemplate(template);
        results.processed++;
        results.generated += result.generated;
        results.skipped += result.skipped;
      } catch (error) {
        results.failed++;
        console.error(
          `[RecurrenceScheduler] 模板 "${template.title}" 生成实例失败:`,
          error
        );
      }
    }

    console.log('[RecurrenceScheduler] 循环任务实例生成完成:', results);
  }

  private async generateInstancesForTemplate(
    template: TaskTemplate
  ): Promise<{ generated: number; skipped: number }> {
    const now = Date.now();
    const endDate = now + template.generateAheadDays * 24 * 60 * 60 * 1000;

    // 1. 获取已存在的实例
    const existingInstances = await this.taskInstanceRepository.findByTemplateAndDateRange(
      template.uuid,
      now,
      endDate
    );

    const existingDates = new Set(
      existingInstances.map(i => this.normalizeDate(i.instanceDate))
    );

    // 2. 计算需要生成的日期
    const occurrences = template.recurrenceRule!.getOccurrencesUntil(now, endDate);

    // 3. 过滤已存在的日期
    const newDates = occurrences.filter(
      date => !existingDates.has(this.normalizeDate(date))
    );

    // 4. 生成实例
    const instances: TaskInstance[] = [];
    for (const date of newDates) {
      const instance = TaskInstance.createFromTemplate(template, date);
      instances.push(instance);
    }

    // 5. 批量保存
    if (instances.length > 0) {
      await this.taskInstanceRepository.saveAll(instances);

      // 6. 创建提醒
      for (const instance of instances) {
        if (template.reminderConfig) {
          await this.reminderService.createTaskReminders(
            instance,
            template.reminderConfig
          );
        }
      }

      // 7. 更新模板的最后生成日期
      template.updateLastGeneratedDate(now);
      await this.taskTemplateRepository.save(template);
    }

    console.log(
      `[RecurrenceScheduler] 模板 "${template.title}": 生成 ${instances.length} 个实例，跳过 ${existingDates.size} 个`
    );

    return {
      generated: instances.length,
      skipped: occurrences.length - newDates.length,
    };
  }

  private normalizeDate(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
}

// 注册 Cron 任务
// cron.schedule('0 2 * * *', async () => {
//   const scheduler = new TaskRecurrenceScheduler(
//     taskTemplateRepository,
//     taskInstanceRepository,
//     reminderService
//   );
//   await scheduler.generateRecurringInstances();
// });
```

---

## 5. 前端实现

### 5.1 重复规则配置组件

```vue
<!-- RecurrenceRuleConfig.vue -->
<template>
  <div class="recurrence-config">
    <el-form-item label="重复频率" prop="frequency">
      <el-select 
        v-model="localRule.frequency"
        @change="handleFrequencyChange"
      >
        <el-option label="每日" value="DAILY" />
        <el-option label="每周" value="WEEKLY" />
        <el-option label="每月" value="MONTHLY" />
        <el-option label="每年" value="YEARLY" />
      </el-select>
    </el-form-item>

    <el-form-item label="重复间隔">
      <el-input-number
        v-model="localRule.interval"
        :min="1"
        :max="365"
      />
      <span class="ml-2 text-gray-500">
        {{ getIntervalLabel() }}
      </span>
    </el-form-item>

    <!-- 每周：选择星期几 -->
    <el-form-item 
      v-if="localRule.frequency === 'WEEKLY'"
      label="重复星期"
    >
      <el-checkbox-group v-model="localRule.byWeekday">
        <el-checkbox :label="0">日</el-checkbox>
        <el-checkbox :label="1">一</el-checkbox>
        <el-checkbox :label="2">二</el-checkbox>
        <el-checkbox :label="3">三</el-checkbox>
        <el-checkbox :label="4">四</el-checkbox>
        <el-checkbox :label="5">五</el-checkbox>
        <el-checkbox :label="6">六</el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <!-- 每月：选择日期 -->
    <el-form-item 
      v-if="localRule.frequency === 'MONTHLY'"
      label="重复日期"
    >
      <el-select 
        v-model="localRule.byMonthDay"
        multiple
        placeholder="选择日期"
      >
        <el-option 
          v-for="day in 31" 
          :key="day"
          :label="`${day} 号`"
          :value="day"
        />
      </el-select>
    </el-form-item>

    <!-- 每年：选择月份 -->
    <el-form-item 
      v-if="localRule.frequency === 'YEARLY'"
      label="重复月份"
    >
      <el-select 
        v-model="localRule.byMonth"
        multiple
        placeholder="选择月份"
      >
        <el-option 
          v-for="month in 12" 
          :key="month"
          :label="`${month} 月`"
          :value="month"
        />
      </el-select>
    </el-form-item>

    <!-- 结束条件 -->
    <el-divider>结束条件</el-divider>

    <el-form-item>
      <el-radio-group v-model="endType">
        <el-radio label="never">永不结束</el-radio>
        <el-radio label="count">指定次数</el-radio>
        <el-radio label="until">指定日期</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item v-if="endType === 'count'">
      <el-input-number
        v-model="localRule.count"
        :min="1"
        :max="1000"
        placeholder="次数"
      />
      <span class="ml-2 text-gray-500">次</span>
    </el-form-item>

    <el-form-item v-if="endType === 'until'">
      <el-date-picker
        v-model="untilDate"
        type="date"
        placeholder="选择结束日期"
        :disabledDate="disabledDate"
      />
    </el-form-item>

    <!-- 预览 -->
    <el-alert
      type="info"
      :closable="false"
      show-icon
    >
      <template #title>
        重复规则预览
      </template>
      <div class="rule-preview">
        {{ ruleDescription }}
      </div>
      <div v-if="nextOccurrences.length > 0" class="next-occurrences">
        <el-text type="info">接下来的日期：</el-text>
        <ul>
          <li v-for="(date, index) in nextOccurrences" :key="index">
            {{ formatDate(date) }}
          </li>
        </ul>
      </div>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  modelValue: any;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: any];
}>();

const localRule = ref({
  frequency: 'DAILY',
  interval: 1,
  byWeekday: [] as number[],
  byMonthDay: [] as number[],
  byMonth: [] as number[],
  count: null as number | null,
  until: null as number | null,
});

const endType = ref<'never' | 'count' | 'until'>('never');
const untilDate = ref<Date | null>(null);

// 初始化
if (props.modelValue) {
  localRule.value = { ...props.modelValue };
  if (localRule.value.count) {
    endType.value = 'count';
  } else if (localRule.value.until) {
    endType.value = 'until';
    untilDate.value = new Date(localRule.value.until);
  }
}

// 监听变化
watch(localRule, (newValue) => {
  emit('update:modelValue', { ...newValue });
}, { deep: true });

watch(endType, (newValue) => {
  if (newValue === 'never') {
    localRule.value.count = null;
    localRule.value.until = null;
  } else if (newValue === 'count') {
    localRule.value.count = 10;
    localRule.value.until = null;
  } else if (newValue === 'until') {
    localRule.value.count = null;
    localRule.value.until = untilDate.value?.getTime() || null;
  }
});

watch(untilDate, (newValue) => {
  if (endType.value === 'until') {
    localRule.value.until = newValue?.getTime() || null;
  }
});

const ruleDescription = computed(() => {
  let desc = '';

  switch (localRule.value.frequency) {
    case 'DAILY':
      desc = localRule.value.interval === 1 
        ? '每天' 
        : `每 ${localRule.value.interval} 天`;
      break;

    case 'WEEKLY':
      if (localRule.value.byWeekday.length > 0) {
        const days = localRule.value.byWeekday
          .sort()
          .map(d => ['日', '一', '二', '三', '四', '五', '六'][d])
          .join('、');
        desc = localRule.value.interval === 1
          ? `每周${days}`
          : `每 ${localRule.value.interval} 周的${days}`;
      } else {
        desc = '请选择重复的星期';
      }
      break;

    case 'MONTHLY':
      if (localRule.value.byMonthDay.length > 0) {
        const days = localRule.value.byMonthDay.sort().join('、');
        desc = localRule.value.interval === 1
          ? `每月 ${days} 号`
          : `每 ${localRule.value.interval} 月的 ${days} 号`;
      } else {
        desc = '请选择重复的日期';
      }
      break;

    case 'YEARLY':
      if (localRule.value.byMonth.length > 0) {
        const months = localRule.value.byMonth.sort().join('、');
        desc = `每年 ${months} 月`;
      } else {
        desc = '请选择重复的月份';
      }
      break;
  }

  if (endType.value === 'count' && localRule.value.count) {
    desc += `，共 ${localRule.value.count} 次`;
  } else if (endType.value === 'until' && untilDate.value) {
    desc += `，截止到 ${untilDate.value.toLocaleDateString()}`;
  } else {
    desc += '，永久重复';
  }

  return desc;
});

const nextOccurrences = computed(() => {
  // 简化实现：只显示前5次
  // 实际应调用 RecurrenceRule.getOccurrencesUntil()
  return [];
});

function handleFrequencyChange() {
  // 清空不相关的字段
  localRule.value.byWeekday = [];
  localRule.value.byMonthDay = [];
  localRule.value.byMonth = [];
}

function getIntervalLabel(): string {
  const labels = {
    DAILY: '天',
    WEEKLY: '周',
    MONTHLY: '月',
    YEARLY: '年',
  };
  return labels[localRule.value.frequency] || '天';
}

function disabledDate(date: Date): boolean {
  return date.getTime() < Date.now();
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<style scoped>
.recurrence-config {
  padding: 16px;
}

.rule-preview {
  font-size: 14px;
  margin-bottom: 12px;
}

.next-occurrences {
  margin-top: 12px;
}

.next-occurrences ul {
  margin: 8px 0 0 20px;
  padding: 0;
}

.next-occurrences li {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}
</style>
```

---

## 6. 参考文档

- [创建任务模板流程](./CREATE_TASK_TEMPLATE_FLOW.md)
- [生成任务实例流程](./GENERATE_TASK_INSTANCE_FLOW.md)
- [Task 模块设计规划](../TASK_MODULE_PLAN.md)
- [iCalendar RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545) - 重复规则标准参考
