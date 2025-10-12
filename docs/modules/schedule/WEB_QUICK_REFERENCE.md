# Schedule Web 模块快速参考

## 📦 安装和导入

```typescript
// 导入 composable
import { useSchedule } from '@/modules/schedule';

// 导入组件
import {
  ReminderTasksCard,
  TaskModuleTasksCard,
  GoalTasksCard,
  StatisticsCard,
} from '@/modules/schedule';

// 导入服务
import { scheduleWebApplicationService } from '@/modules/schedule';

// 导入路由
import { scheduleRoutes } from '@/modules/schedule';
```

---

## 🎯 useSchedule Composable

### 基本用法

```vue
<script setup lang="ts">
import { useSchedule } from '@/modules/schedule';

const {
  // 状态
  tasks,
  statistics,
  moduleStatistics,
  isLoading,
  isLoadingStats,
  error,

  // 任务方法
  fetchTasks,
  fetchTasksByModule,
  createTask,
  pauseTask,
  resumeTask,
  deleteTask,

  // 统计方法
  fetchStatistics,
  fetchAllModuleStatistics,
  recalculateStatistics,

  // 工具方法
  initialize,
  refresh,
  clearError,
} = useSchedule();

// 初始化
onMounted(async () => {
  await initialize(); // 加载任务和统计信息
});
</script>
```

### 方法说明

#### 任务管理
```typescript
// 获取所有任务
await fetchTasks();

// 按模块获取任务
await fetchTasksByModule('reminder'); // 'reminder' | 'task' | 'goal' | 'notification'

// 创建任务
const newTask = await createTask({
  name: '每日提醒任务',
  description: '每天早上9点提醒',
  sourceModule: 'reminder',
  sourceEntityId: 'reminder-uuid-123',
  schedule: {
    cronExpression: '0 9 * * *',
    timezone: 'Asia/Shanghai',
    startDate: Date.now(),
  },
});

// 暂停任务
await pauseTask('task-uuid');

// 恢复任务
await resumeTask('task-uuid');

// 删除任务
await deleteTask('task-uuid');
```

#### 统计信息
```typescript
// 获取统计信息
await fetchStatistics();

// 获取所有模块统计
await fetchAllModuleStatistics();

// 重新计算统计
await recalculateStatistics();
```

---

## 🎨 组件使用

### ReminderTasksCard - 提醒模块任务卡片

```vue
<template>
  <reminder-tasks-card
    :tasks="reminderTasks"
    :is-loading="isLoading"
    :error="error"
    @pause-task="handlePauseTask"
    @resume-task="handleResumeTask"
    @delete-task="handleDeleteTask"
  />
</template>

<script setup lang="ts">
import { ReminderTasksCard } from '@/modules/schedule';
import { useSchedule } from '@/modules/schedule';

const { tasks, isLoading, error, pauseTask, resumeTask, deleteTask } = useSchedule();

const reminderTasks = computed(() => 
  tasks.value.filter(t => t.sourceModule === 'reminder')
);

async function handlePauseTask(taskUuid: string) {
  await pauseTask(taskUuid);
}

async function handleResumeTask(taskUuid: string) {
  await resumeTask(taskUuid);
}

async function handleDeleteTask(taskUuid: string) {
  await deleteTask(taskUuid);
}
</script>
```

### TaskModuleTasksCard - 任务模块任务卡片

```vue
<template>
  <task-module-tasks-card
    :tasks="taskModuleTasks"
    :is-loading="isLoading"
    :error="error"
    @pause-task="handlePauseTask"
    @resume-task="handleResumeTask"
    @delete-task="handleDeleteTask"
  />
</template>

<script setup lang="ts">
import { TaskModuleTasksCard } from '@/modules/schedule';
import { useSchedule } from '@/modules/schedule';

const { tasks, pauseTask, resumeTask, deleteTask } = useSchedule();

const taskModuleTasks = computed(() => 
  tasks.value.filter(t => t.sourceModule === 'task')
);
</script>
```

### GoalTasksCard - 目标模块任务卡片

```vue
<template>
  <goal-tasks-card
    :tasks="goalTasks"
    :is-loading="isLoading"
    :error="error"
    @pause-task="handlePauseTask"
    @resume-task="handleResumeTask"
    @delete-task="handleDeleteTask"
  />
</template>

<script setup lang="ts">
import { GoalTasksCard } from '@/modules/schedule';
import { useSchedule } from '@/modules/schedule';

const { tasks } = useSchedule();

const goalTasks = computed(() => 
  tasks.value.filter(t => t.sourceModule === 'goal')
);
</script>
```

### StatisticsCard - 统计信息卡片

```vue
<template>
  <statistics-card
    :statistics="statistics"
    :module-statistics="moduleStatistics"
    :is-loading="isLoadingStats"
    :error="error"
    @refresh="handleRefresh"
  />
</template>

<script setup lang="ts">
import { StatisticsCard } from '@/modules/schedule';
import { useSchedule } from '@/modules/schedule';

const {
  statistics,
  moduleStatistics,
  isLoadingStats,
  error,
  fetchStatistics,
  fetchAllModuleStatistics,
} = useSchedule();

async function handleRefresh() {
  await Promise.all([
    fetchStatistics(),
    fetchAllModuleStatistics(),
  ]);
}
</script>
```

---

## 🛣️ 路由配置

### 注册路由

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { scheduleRoutes } from '@/modules/schedule';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...scheduleRoutes,
    // ... 其他路由
  ],
});

export default router;
```

### 路由结构

```
/schedule
  └── /dashboard - 调度控制台页面
```

### 导航

```vue
<template>
  <!-- 使用 router-link -->
  <v-btn to="/schedule/dashboard">调度控制台</v-btn>

  <!-- 使用编程式导航 -->
  <v-btn @click="goToSchedule">调度控制台</v-btn>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goToSchedule() {
  router.push('/schedule/dashboard');
}
</script>
```

---

## 🔧 直接使用服务

### ScheduleWebApplicationService

```typescript
import { scheduleWebApplicationService } from '@/modules/schedule';

// 创建任务
const task = await scheduleWebApplicationService.createTask({
  name: '测试任务',
  sourceModule: 'reminder',
  sourceEntityId: 'test-id',
  schedule: {
    cronExpression: '0 9 * * *',
    timezone: 'UTC',
  },
});

// 获取所有任务
const tasks = await scheduleWebApplicationService.getAllTasks();

// 按模块获取任务
const reminderTasks = await scheduleWebApplicationService.getTasksByModule('reminder');

// 暂停任务
await scheduleWebApplicationService.pauseTask('task-uuid');

// 获取统计信息
const statistics = await scheduleWebApplicationService.getStatistics();

// 获取模块统计
const moduleStats = await scheduleWebApplicationService.getAllModuleStatistics();
```

---

## 📊 类型定义

### ScheduleTaskServerDTO

```typescript
interface ScheduleTaskServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string;
  sourceModule: 'reminder' | 'task' | 'goal' | 'notification';
  sourceEntityId: string;
  status: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
  
  // Schedule Config
  cronExpression?: string;
  timezone: string;
  startDate?: number;
  endDate?: number;
  maxExecutions?: number;
  
  // Execution Info
  executionCount: number;
  lastExecutionTime?: number;
  nextExecutionTime?: number;
  lastExecutionStatus?: string;
  
  // Retry Policy
  retryEnabled: boolean;
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
  
  // Metadata
  payload?: any;
  tags: string[];
  priority: string;
  timeout: number;
  
  createdAt: number;
  updatedAt: number;
}
```

### ScheduleStatisticsServerDTO

```typescript
interface ScheduleStatisticsServerDTO {
  uuid: string;
  accountUuid: string;
  
  // 任务统计
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  completedTasks: number;
  failedTasks: number;
  
  // 执行统计
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  
  // 模块统计
  moduleStatistics: Record<string, ModuleStatisticsServerDTO>;
  
  lastRecalculatedAt?: number;
  createdAt: number;
  updatedAt: number;
}
```

### ModuleStatisticsServerDTO

```typescript
interface ModuleStatisticsServerDTO {
  totalTasks: number;
  activeTasks: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
}
```

---

## 🎨 自定义样式

### 覆盖组件样式

```vue
<template>
  <reminder-tasks-card class="custom-card" />
</template>

<style scoped>
.custom-card {
  /* 自定义样式 */
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
</style>
```

---

## 🔍 调试

### 启用日志

```typescript
// 日志会自动输出到 console
// 使用 createLogger('ScheduleWebApplicationService')
// 查看控制台可以看到所有操作日志
```

### 错误处理

```typescript
const { error, clearError } = useSchedule();

// 检查错误
if (error.value) {
  console.error('Schedule error:', error.value);
  
  // 清除错误
  clearError();
}
```

---

## 💡 最佳实践

### 1. 使用 Composable 管理状态

```vue
<script setup lang="ts">
// ✅ 推荐：使用 composable
import { useSchedule } from '@/modules/schedule';
const { tasks, fetchTasks } = useSchedule();

// ❌ 不推荐：直接使用服务
import { scheduleWebApplicationService } from '@/modules/schedule';
const tasks = ref([]);
// 需要手动管理状态...
</script>
```

### 2. 组件组合

```vue
<template>
  <v-container>
    <v-row>
      <!-- 左侧：任务队列 -->
      <v-col cols="12" md="8">
        <reminder-tasks-card :tasks="reminderTasks" />
        <task-module-tasks-card :tasks="taskModuleTasks" />
        <goal-tasks-card :tasks="goalTasks" />
      </v-col>
      
      <!-- 右侧：统计 -->
      <v-col cols="12" md="4">
        <statistics-card :statistics="statistics" />
      </v-col>
    </v-row>
  </v-container>
</template>
```

### 3. 错误处理

```typescript
async function handleAction() {
  try {
    await someAction();
    showSnackbar('操作成功', 'success');
  } catch (error) {
    console.error('Action failed:', error);
    showSnackbar('操作失败', 'error');
  }
}
```

---

## 🚀 完整示例

### 自定义任务管理页面

```vue
<template>
  <v-container fluid>
    <!-- 头部 -->
    <v-card class="mb-4">
      <v-card-title>我的调度任务</v-card-title>
      <v-card-actions>
        <v-btn @click="handleRefresh" :loading="isLoading">刷新</v-btn>
      </v-card-actions>
    </v-card>

    <!-- 任务列表 -->
    <v-row>
      <v-col cols="12" md="4">
        <reminder-tasks-card
          :tasks="reminderTasks"
          :is-loading="isLoading"
          @pause-task="handlePause"
          @resume-task="handleResume"
          @delete-task="handleDelete"
        />
      </v-col>
      
      <v-col cols="12" md="4">
        <task-module-tasks-card
          :tasks="taskModuleTasks"
          :is-loading="isLoading"
          @pause-task="handlePause"
          @resume-task="handleResume"
          @delete-task="handleDelete"
        />
      </v-col>
      
      <v-col cols="12" md="4">
        <goal-tasks-card
          :tasks="goalTasks"
          :is-loading="isLoading"
          @pause-task="handlePause"
          @resume-task="handleResume"
          @delete-task="handleDelete"
        />
      </v-col>
    </v-row>

    <!-- 统计 -->
    <statistics-card
      :statistics="statistics"
      :module-statistics="moduleStatistics"
      :is-loading="isLoadingStats"
      @refresh="handleRefreshStats"
      class="mt-4"
    />
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  ReminderTasksCard,
  TaskModuleTasksCard,
  GoalTasksCard,
  StatisticsCard,
  useSchedule,
} from '@/modules/schedule';

const {
  tasks,
  statistics,
  moduleStatistics,
  isLoading,
  isLoadingStats,
  fetchTasks,
  fetchStatistics,
  fetchAllModuleStatistics,
  pauseTask,
  resumeTask,
  deleteTask,
} = useSchedule();

const reminderTasks = computed(() => 
  tasks.value.filter(t => t.sourceModule === 'reminder')
);

const taskModuleTasks = computed(() => 
  tasks.value.filter(t => t.sourceModule === 'task')
);

const goalTasks = computed(() => 
  tasks.value.filter(t => t.sourceModule === 'goal')
);

async function handleRefresh() {
  await fetchTasks();
}

async function handleRefreshStats() {
  await Promise.all([
    fetchStatistics(),
    fetchAllModuleStatistics(),
  ]);
}

async function handlePause(taskUuid: string) {
  await pauseTask(taskUuid);
}

async function handleResume(taskUuid: string) {
  await resumeTask(taskUuid);
}

async function handleDelete(taskUuid: string) {
  if (confirm('确定要删除这个任务吗？')) {
    await deleteTask(taskUuid);
  }
}

onMounted(async () => {
  await Promise.all([
    fetchTasks(),
    fetchStatistics(),
    fetchAllModuleStatistics(),
  ]);
});
</script>
```

---

## 📚 相关文档

- [Schedule 模块完整实现文档](./WEB_IMPLEMENTATION_COMPLETE.md)
- [Schedule API 接口文档](../../systems/SCHEDULE_API_QUICK_REFERENCE.md)
- [Repository 模块参考](../repository/FRONTEND_IMPLEMENTATION.md)
