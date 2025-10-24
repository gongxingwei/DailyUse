# Web 端模块修复指南

> 修复 Schedule 调用问题和简化 Theme 模块

## 📋 修复清单

### 1. ✅ Editor 模块 Web 端重构完成

已重新实现为纯前端组件：

- EditorContainer（主容器）
- EditorTabBar（标签栏）
- MarkdownEditor（Markdown 编辑器）
- MediaViewer（媒体查看器）
- useEditor（Composable API）

详见：`docs/modules/editor/EDITOR_WEB_IMPLEMENTATION.md`

---

## 2. 🔧 Schedule 调用问题修复

### 问题分析

当前 Task、Goal、Reminder 等模块在前端直接调用 Schedule API：

```typescript
// ❌ 错误：前端直接调用 Schedule
await scheduleApiClient.createScheduleTask({
  sourceModule: 'task',
  sourceUuid: taskUuid,
  // ...
});
```

**问题：**

1. **职责错乱**：调度逻辑应该在后端处理
2. **重复逻辑**：前后端都要处理调度
3. **一致性问题**：前后端逻辑可能不一致
4. **性能问题**：前端需要等待多个请求

### 正确架构（基于事件总线）

**架构原则：**

- Schedule 模块通过**事件总线**监听其他模块的领域事件
- 业务模块（Task/Goal/Reminder）在创建/更新/删除时发出专门的 Schedule 相关事件
- Schedule 模块订阅这些事件，自动创建/更新/删除调度任务

```
前端 (Web)              后端 (API)                     事件总线              调度 (Schedule)
  │                        │                              │                       │
  │  创建任务请求          │                              │                       │
  ├───────────────────────>│                              │                       │
  │                        │  1. 创建任务实体             │                       │
  │                        ├──────────┐                   │                       │
  │                        │          │                   │                       │
  │                        │  2. 发布领域事件             │                       │
  │                        │     TaskCreatedEvent         │                       │
  │                        ├─────────────────────────────>│                       │
  │                        │          │                   │  3. 分发事件          │
  │                        │          │                   ├──────────────────────>│
  │                        │          │                   │  4. 监听到事件        │
  │                        │          │                   │  5. 创建 ScheduleTask │
  │                        │          │                   │<──────────────────────┤
  │                        │<─────────┘                   │                       │
  │  返回任务信息          │                              │                       │
  │<───────────────────────┤                              │                       │
  │                        │                              │                       │
```

**事件流程示例：**

```typescript
// 1. Task 模块发布事件
class TaskApplicationService {
  async createTaskTemplate(request: CreateTaskTemplateRequest) {
    const template = await this.taskDomainService.createTaskTemplate(request);

    // 如果有时间配置，发布 Schedule 相关事件
    if (template.timeConfig) {
      await this.eventBus.publish(
        new TaskScheduleRequiredEvent({
          taskUuid: template.uuid,
          scheduleType: 'template',
          timeConfig: template.timeConfig,
          operation: 'create',
        }),
      );
    }

    return template.toDTO();
  }
}

// 2. Schedule 模块监听事件
class ScheduleEventListener {
  @OnEvent('task.schedule.required')
  async handleTaskScheduleRequired(event: TaskScheduleRequiredEvent) {
    await this.scheduleService.createScheduleTaskForTask(event.data);
  }

  @OnEvent('goal.schedule.required')
  async handleGoalScheduleRequired(event: GoalScheduleRequiredEvent) {
    await this.scheduleService.createScheduleTaskForGoal(event.data);
  }

  @OnEvent('reminder.schedule.required')
  async handleReminderScheduleRequired(event: ReminderScheduleRequiredEvent) {
    await this.scheduleService.createScheduleTaskForReminder(event.data);
  }
}
```

### 修复方案

#### Step 1: 移除前端 Schedule 调用

**文件位置：**

- `apps/web/src/modules/task/services/taskScheduleIntegrationService.ts`
- `apps/web/src/modules/reminder/services/reminderScheduleIntegrationService.ts`
- `apps/web/src/modules/goal/*` （如果有）

**修改示例：**

```typescript
// ❌ 删除前端调用
// import { scheduleApiClient } from '@/modules/schedule/infrastructure/api/scheduleApiClient';

/**
 * 创建任务模板
 */
async function createTaskTemplate(request: CreateTaskTemplateRequest) {
  try {
    // ✅ 只调用任务 API，后端会自动处理调度
    const result = await taskApiClient.createTaskTemplate(request);

    // ❌ 删除这段
    // if (result.timeConfig) {
    //   await scheduleApiClient.createScheduleTask({
    //     sourceModule: 'task',
    //     sourceUuid: result.uuid,
    //     ...
    //   });
    // }

    return result;
  } catch (error) {
    throw error;
  }
}
```

#### Step 2: 确保后端正确处理（基于事件总线）

**后端应该实现以下事件驱动架构：**

**1. 定义 Schedule 相关事件**

```typescript
// packages/domain-server/src/schedule/events/TaskScheduleRequiredEvent.ts

export class TaskScheduleRequiredEvent {
  constructor(
    public readonly data: {
      taskUuid: string;
      scheduleType: 'template' | 'instance';
      timeConfig: TimeConfig;
      operation: 'create' | 'update' | 'delete';
    },
  ) {}
}

// 类似地定义 GoalScheduleRequiredEvent, ReminderScheduleRequiredEvent
```

**2. 业务模块发布事件**

```typescript
// apps/api/src/modules/task/application/services/TaskApplicationService.ts

import { EventBus } from '@/shared/infrastructure/events/EventBus';
import { TaskScheduleRequiredEvent } from '@dailyuse/domain-server/schedule/events';

@Injectable()
export class TaskApplicationService {
  constructor(
    private readonly taskDomainService: TaskDomainService,
    private readonly eventBus: EventBus,
  ) {}

  async createTaskTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplateDTO> {
    // 1. 创建任务模板
    const template = await this.taskDomainService.createTaskTemplate(request);

    // 2. 如果有时间配置，发布 Schedule 事件
    if (template.timeConfig) {
      await this.eventBus.publish(
        new TaskScheduleRequiredEvent({
          taskUuid: template.uuid,
          scheduleType: 'template',
          timeConfig: template.timeConfig,
          operation: 'create',
        }),
      );
    }

    return template.toDTO();
  }

  async updateTaskTemplate(
    uuid: string,
    request: UpdateTaskTemplateRequest,
  ): Promise<TaskTemplateDTO> {
    const template = await this.taskDomainService.updateTaskTemplate(uuid, request);

    // 发布更新事件
    if (request.timeConfig) {
      await this.eventBus.publish(
        new TaskScheduleRequiredEvent({
          taskUuid: template.uuid,
          scheduleType: 'template',
          timeConfig: template.timeConfig,
          operation: 'update',
        }),
      );
    }

    return template.toDTO();
  }

  async deleteTaskTemplate(uuid: string): Promise<void> {
    // 1. 发布删除事件（先删除调度任务）
    await this.eventBus.publish(
      new TaskScheduleRequiredEvent({
        taskUuid: uuid,
        scheduleType: 'template',
        timeConfig: null as any,
        operation: 'delete',
      }),
    );

    // 2. 删除任务模板
    await this.taskDomainService.deleteTaskTemplate(uuid);
  }
}
```

**3. Schedule 模块监听事件**

```typescript
// apps/api/src/modules/schedule/application/listeners/ScheduleEventListener.ts

import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import {
  TaskScheduleRequiredEvent,
  GoalScheduleRequiredEvent,
  ReminderScheduleRequiredEvent,
} from '@dailyuse/domain-server/schedule/events';

@Injectable()
export class ScheduleEventListener {
  constructor(private readonly scheduleService: ScheduleApplicationService) {}

  /**
   * 监听 Task 模块的 Schedule 事件
   */
  @OnEvent('task.schedule.required')
  async handleTaskScheduleRequired(event: TaskScheduleRequiredEvent) {
    const { taskUuid, scheduleType, timeConfig, operation } = event.data;

    switch (operation) {
      case 'create':
        await this.scheduleService.createScheduleTaskForTask({
          sourceModule: 'task',
          sourceUuid: taskUuid,
          scheduleType,
          timeConfig,
        });
        break;

      case 'update':
        await this.scheduleService.updateScheduleTaskForTask(taskUuid, timeConfig);
        break;

      case 'delete':
        await this.scheduleService.deleteScheduleTaskForSource('task', taskUuid);
        break;
    }
  }

  /**
   * 监听 Goal 模块的 Schedule 事件
   */
  @OnEvent('goal.schedule.required')
  async handleGoalScheduleRequired(event: GoalScheduleRequiredEvent) {
    // 类似的处理逻辑
  }

  /**
   * 监听 Reminder 模块的 Schedule 事件
   */
  @OnEvent('reminder.schedule.required')
  async handleReminderScheduleRequired(event: ReminderScheduleRequiredEvent) {
    // 类似的处理逻辑
  }
}
```

**4. 注册事件监听器**

```typescript
// apps/api/src/modules/schedule/schedule.module.ts

import { Module } from '@nestjs/common';
import { ScheduleEventListener } from './application/listeners/ScheduleEventListener';

@Module({
  providers: [
    ScheduleApplicationService,
    ScheduleEventListener, // 注册事件监听器
    // ...
  ],
})
export class ScheduleModule {}
```

#### Step 3: 清理前端文件

**删除以下文件（如果存在）：**

```bash
# Task 模块
rm apps/web/src/modules/task/services/taskScheduleIntegrationService.ts

# Reminder 模块
rm apps/web/src/modules/reminder/services/reminderScheduleIntegrationService.ts

# Schedule API Client（前端不需要）
rm apps/web/src/modules/schedule/infrastructure/api/scheduleApiClient.ts
rm -rf apps/web/src/modules/schedule
```

**更新导入：**

```typescript
// ❌ 删除这些导入
// import { taskScheduleIntegrationService } from '@/modules/task/services/taskScheduleIntegrationService';
// import { scheduleApiClient } from '@/modules/schedule/infrastructure/api/scheduleApiClient';

// ✅ 只需要业务模块的 API
import { taskApiClient } from '@/modules/task/infrastructure/api/taskApiClient';
```

---

## 3. 🎨 Theme 模块简化

### 问题分析

当前 Theme 模块过于复杂：

- 有独立的 domain、application、infrastructure 层
- 有独立的 API、Store、Service
- 实际上只是简单的前端配置（主题颜色、语言）

**实际需求：**

- 切换 Vuetify 主题（浅色/深色）
- 切换语言（i18n）
- 保存用户偏好到 Setting

### 简化方案

#### Step 1: 删除 Theme 模块

```bash
# 删除整个 Theme 模块
rm -rf apps/web/src/modules/theme
rm -rf packages/contracts/src/modules/theme
rm -rf packages/domain-client/src/theme
rm -rf packages/domain-server/src/theme

# 删除后端 Theme 模块
rm -rf apps/api/src/modules/theme
```

#### Step 2: 在 Setting 模块中集成

**创建 Composable：`useTheme.ts`**

```typescript
// apps/web/src/modules/setting/presentation/composables/useTheme.ts

import { computed } from 'vue';
import { useTheme as useVuetifyTheme } from 'vuetify';
import { useI18n } from 'vue-i18n';
import { useSettingStore } from '../stores/settingStore';

export function useTheme() {
  const vuetifyTheme = useVuetifyTheme();
  const i18n = useI18n();
  const settingStore = useSettingStore();

  /**
   * 当前主题模式
   */
  const themeMode = computed({
    get: () => settingStore.themeMode || 'light',
    set: (value: 'light' | 'dark' | 'system') => {
      settingStore.updateThemeMode(value);
      applyTheme(value);
    },
  });

  /**
   * 当前语言
   */
  const locale = computed({
    get: () => settingStore.locale || 'zh-CN',
    set: (value: string) => {
      settingStore.updateLocale(value);
      i18n.locale.value = value;
    },
  });

  /**
   * 应用主题
   */
  function applyTheme(mode: 'light' | 'dark' | 'system') {
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      vuetifyTheme.global.name.value = prefersDark ? 'dark' : 'light';
    } else {
      vuetifyTheme.global.name.value = mode;
    }
  }

  /**
   * 切换主题
   */
  function toggleTheme() {
    const current = themeMode.value;
    themeMode.value = current === 'light' ? 'dark' : 'light';
  }

  /**
   * 可用的主题列表
   */
  const themes = [
    { label: '浅色', value: 'light', icon: 'mdi-white-balance-sunny' },
    { label: '深色', value: 'dark', icon: 'mdi-moon-waning-crescent' },
    { label: '跟随系统', value: 'system', icon: 'mdi-theme-light-dark' },
  ];

  /**
   * 可用的语言列表
   */
  const locales = [
    { label: '简体中文', value: 'zh-CN', flag: '🇨🇳' },
    { label: 'English', value: 'en-US', flag: '🇺🇸' },
  ];

  // 初始化主题
  applyTheme(themeMode.value);

  return {
    themeMode,
    locale,
    themes,
    locales,
    toggleTheme,
    applyTheme,
  };
}
```

**更新 Setting Store：**

```typescript
// apps/web/src/modules/setting/presentation/stores/settingStore.ts

import { defineStore } from 'pinia';

export const useSettingStore = defineStore('setting', {
  state: () => ({
    themeMode: 'light' as 'light' | 'dark' | 'system',
    locale: 'zh-CN',
    // ... 其他设置
  }),

  actions: {
    updateThemeMode(mode: 'light' | 'dark' | 'system') {
      this.themeMode = mode;
      // 可选：保存到后端
      // await settingApiClient.updateSetting({ themeMode: mode });
    },

    updateLocale(locale: string) {
      this.locale = locale;
      // 可选：保存到后端
      // await settingApiClient.updateSetting({ locale });
    },
  },

  persist: true, // 持久化到 localStorage
});
```

**使用示例：**

```vue
<!-- apps/web/src/modules/setting/presentation/views/SettingView.vue -->
<template>
  <div class="setting-view">
    <v-card>
      <v-card-title>外观设置</v-card-title>
      <v-card-text>
        <!-- 主题切换 -->
        <v-select
          v-model="themeMode"
          :items="themes"
          item-title="label"
          item-value="value"
          label="主题模式"
        >
          <template #prepend-inner>
            <v-icon :icon="currentThemeIcon" />
          </template>
        </v-select>

        <!-- 语言切换 -->
        <v-select
          v-model="locale"
          :items="locales"
          item-title="label"
          item-value="value"
          label="语言"
          class="mt-4"
        >
          <template #prepend-inner>
            <span class="text-h6">{{ currentFlag }}</span>
          </template>
        </v-select>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme';

const { themeMode, locale, themes, locales } = useTheme();

const currentThemeIcon = computed(() => {
  return themes.find((t) => t.value === themeMode.value)?.icon || 'mdi-theme-light-dark';
});

const currentFlag = computed(() => {
  return locales.find((l) => l.value === locale.value)?.flag || '🌐';
});
</script>
```

#### Step 3: 更新导入

**全局搜索并替换：**

```typescript
// ❌ 旧的导入
// import { useThemeStore } from '@/modules/theme/stores/themeStore';

// ✅ 新的导入
import { useTheme } from '@/modules/setting/presentation/composables/useTheme';
```

---

## 📊 修复优先级

| 任务              | 优先级 | 预计时间 | 状态      |
| ----------------- | ------ | -------- | --------- |
| Editor 模块重构   | P0     | 2h       | ✅ 完成   |
| Schedule 调用移除 | P1     | 1h       | ⏳ 待处理 |
| Theme 模块简化    | P2     | 1.5h     | ⏳ 待处理 |

---

## 🚀 实施步骤

### Phase 1: Schedule 修复（1 小时）

1. 删除前端 Schedule 调用代码（15分钟）
2. 确认后端正确处理调度（30分钟）
3. 测试任务/提醒创建流程（15分钟）

### Phase 2: Theme 简化（1.5 小时）

1. 创建 `useTheme` Composable（30分钟）
2. 更新 Setting Store（20分钟）
3. 删除 Theme 模块文件（10分钟）
4. 更新所有导入引用（20分钟）
5. 测试主题和语言切换（10分钟）

### Phase 3: 文档和测试（30分钟）

1. 更新相关文档
2. 端到端测试
3. 代码审查

---

## ✅ 验证清单

### Schedule 修复验证

- [ ] 前端不再有 `scheduleApiClient` 导入
- [ ] 创建任务时自动创建调度任务（后端日志确认）
- [ ] 更新任务时自动更新调度任务
- [ ] 删除任务时自动删除调度任务
- [ ] 任务实例按时生成

### Theme 简化验证

- [ ] 主题切换正常（浅色/深色/系统）
- [ ] 语言切换正常（中文/英文）
- [ ] 设置持久化到 localStorage
- [ ] 不再有独立的 Theme 模块
- [ ] 所有页面主题统一

---

## 📚 相关文档

- [Editor Web 实现文档](./editor/EDITOR_WEB_IMPLEMENTATION.md)
- [Schedule 模块架构](./schedule/SCHEDULE_ARCHITECTURE.md)
- [Setting 模块设计](./setting/SETTING_DESIGN.md)

---

**创建日期：** 2025-01-13  
**维护者：** DailyUse Team
