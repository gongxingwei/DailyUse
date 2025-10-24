# Schedule Web 端文件清单

## 📁 完整文件列表（14 个文件）

```
apps/web/src/modules/schedule/
│
├── index.ts                                           ✅ 模块总导出
│   • 导出 ScheduleWebApplicationService
│   • 导出 scheduleApiClient
│   • 导出 scheduleRoutes
│   • 导出所有组件
│   • 导出 useSchedule
│
├── application/
│   └── index.ts                                       ✅ 应用层导出（保留用于扩展）
│
├── infrastructure/
│   └── api/
│       ├── index.ts                                   ✅ API 导出
│       │   • 导出 scheduleApiClient
│       │   • 导出 ScheduleApiClient 类型
│       │
│       └── scheduleApiClient.ts                       ✅ API 客户端（核心）
│           • class ScheduleApiClient
│           • 18 个 API 方法
│           • 任务管理（12 方法）
│           • 统计管理（6 方法）
│           • 导出单例 scheduleApiClient
│
├── services/
│   └── ScheduleWebApplicationService.ts               ✅ Web 应用服务（核心）
│       • class ScheduleWebApplicationService
│       • 18 个业务方法
│       • 日志记录（createLogger）
│       • 错误处理
│       • 导出单例 scheduleWebApplicationService
│
├── presentation/
│   ├── components/
│   │   ├── index.ts                                   ✅ 组件导出
│   │   │   • 导出 ReminderTasksCard
│   │   │   • 导出 TaskModuleTasksCard
│   │   │   • 导出 GoalTasksCard
│   │   │   • 导出 StatisticsCard
│   │   │
│   │   └── cards/
│   │       ├── ReminderTasksCard.vue                  ✅ 提醒模块任务卡片
│   │       │   • Props: tasks, isLoading, error
│   │       │   • Emits: pause-task, resume-task, delete-task
│   │       │   • 主题色: primary（蓝色）
│   │       │   • 图标: mdi-bell-ring
│   │       │
│   │       ├── TaskModuleTasksCard.vue                ✅ 任务模块任务卡片
│   │       │   • Props: tasks, isLoading, error
│   │       │   • Emits: pause-task, resume-task, delete-task
│   │       │   • 主题色: success（绿色）
│   │       │   • 图标: mdi-format-list-checks
│   │       │
│   │       ├── GoalTasksCard.vue                      ✅ 目标模块任务卡片
│   │       │   • Props: tasks, isLoading, error
│   │       │   • Emits: pause-task, resume-task, delete-task
│   │       │   • 主题色: warning（橙色）
│   │       │   • 图标: mdi-target
│   │       │
│   │       └── StatisticsCard.vue                     ✅ 统计信息卡片
│   │           • Props: statistics, moduleStatistics, isLoading, error
│   │           • Emits: refresh
│   │           • 主题色: info（蓝色）
│   │           • 图标: mdi-chart-box
│   │           • 功能: 总体概览、执行情况、模块分布
│   │
│   ├── composables/
│   │   └── useSchedule.ts                             ✅ Schedule Composable（核心）
│   │       • function useSchedule()
│   │       • 状态管理（5 个 ref）
│   │       • 任务方法（6 个）
│   │       • 统计方法（3 个）
│   │       • 工具方法（3 个）
│   │       • 总计 12 个方法
│   │
│   └── views/
│       └── ScheduleDashboardView.vue                  ✅ 调度控制台页面（核心）
│           • 使用 useSchedule composable
│           • 使用 4 个卡片组件
│           • 确认对话框
│           • Snackbar 通知
│           • 响应式布局（左 8 列 + 右 4 列）
│           • 错误处理和重试
│
├── router/
│   └── index.ts                                       ✅ 路由配置
│       • export const scheduleRoutes
│       • /schedule/dashboard 路由
│       • meta: { title, requiresAuth }
│
└── initialization/
    └── scheduleInitialization.ts                      ✅ 初始化逻辑（保留）
```

---

## 📊 文件统计

### 按类型统计

| 类型            | 数量      | 说明                         |
| --------------- | --------- | ---------------------------- |
| TypeScript 文件 | 9 个      | .ts 文件                     |
| Vue 组件        | 5 个      | .vue 文件（4 卡片 + 1 页面） |
| **总计**        | **14 个** |                              |

### 按层级统计

| 层级                 | 文件数    | 说明                                  |
| -------------------- | --------- | ------------------------------------- |
| Infrastructure       | 2 个      | API 客户端                            |
| Application/Services | 1 个      | Web 应用服务                          |
| Presentation         | 7 个      | 组件 + Composable + 视图              |
| Router               | 1 个      | 路由配置                              |
| Module               | 1 个      | 模块导出                              |
| Other                | 2 个      | application/index.ts + initialization |
| **总计**             | **14 个** |                                       |

---

## 📝 文件详细说明

### 1. infrastructure/api/scheduleApiClient.ts

**职责**: 封装所有 HTTP API 请求

**导出**:

- `class ScheduleApiClient` - API 客户端类
- `scheduleApiClient` - 单例实例

**方法列表**（18 个）:

```typescript
// 任务管理（12 个）
createTask();
createTasksBatch();
getTasks();
getTaskById();
getDueTasks();
getTaskBySource();
pauseTask();
resumeTask();
completeTask();
cancelTask();
deleteTask();
deleteTasksBatch();
updateTaskMetadata();

// 统计管理（6 个）
getStatistics();
getModuleStatistics();
getAllModuleStatistics();
recalculateStatistics();
resetStatistics();
deleteStatistics();
```

**特点**:

- 使用 `apiClient` 实例（统一的 HTTP 客户端）
- 完整的 TypeScript 类型定义
- 基于 `ScheduleContracts` 类型

### 2. services/ScheduleWebApplicationService.ts

**职责**: 业务逻辑封装和错误处理

**导出**:

- `class ScheduleWebApplicationService` - 应用服务类
- `scheduleWebApplicationService` - 单例实例

**方法列表**（18 个）:

- 对应 API 客户端的 18 个方法
- 每个方法包含：
  - 日志记录（logger.info/error）
  - 错误处理（try-catch）
  - 业务逻辑封装

**特点**:

- 使用 `createLogger('ScheduleWebApplicationService')`
- 统一的错误处理模式
- 调用 `scheduleApiClient` 方法

### 3. presentation/composables/useSchedule.ts

**职责**: Vue 组合函数，提供状态管理和业务方法

**导出**:

- `function useSchedule()` - 组合函数

**状态**（5 个）:

```typescript
tasks: Ref<ScheduleTaskServerDTO[]>;
statistics: Ref<ScheduleStatisticsServerDTO | null>;
moduleStatistics: Ref<Record<SourceModule, ModuleStatisticsServerDTO> | null>;
isLoading: Ref<boolean>;
isLoadingStats: Ref<boolean>;
error: Ref<string | null>;
```

**方法**（12 个）:

```typescript
// 任务方法（6 个）
fetchTasks();
fetchTasksByModule();
createTask();
pauseTask();
resumeTask();
deleteTask();

// 统计方法（3 个）
fetchStatistics();
fetchAllModuleStatistics();
recalculateStatistics();

// 工具方法（3 个）
initialize();
refresh();
clearError();
```

**特点**:

- 响应式状态管理
- 自动错误处理
- 调用 `scheduleWebApplicationService` 方法

### 4. presentation/components/cards/\*.vue

**职责**: 可复用的任务队列卡片组件

**组件列表**:

1. **ReminderTasksCard.vue** - 提醒模块
2. **TaskModuleTasksCard.vue** - 任务模块
3. **GoalTasksCard.vue** - 目标模块
4. **StatisticsCard.vue** - 统计信息

**共同特点**（前 3 个任务卡片）:

- Props: `tasks`, `isLoading`, `error`
- Emits: `pause-task`, `resume-task`, `delete-task`
- 显示任务列表
- 状态图标和颜色
- 操作菜单（暂停/恢复/删除）

**StatisticsCard 特点**:

- Props: `statistics`, `moduleStatistics`, `isLoading`, `error`
- Emits: `refresh`
- 总体概览（4 个统计卡片）
- 执行情况（3 个统计 + 成功率进度条）
- 模块分布（动态模块卡片）

### 5. presentation/views/ScheduleDashboardView.vue

**职责**: 调度控制台主页面

**功能**:

- 使用 `useSchedule` composable
- 渲染 4 个卡片组件
- 响应式布局（左侧 8 列 + 右侧 4 列）
- 确认对话框（操作确认）
- Snackbar 通知（操作反馈）
- 错误处理和数据刷新

**布局**:

```vue
<v-container>
  <v-card> <!-- 页面头部 --> </v-card>
  <v-row>
    <v-col cols="12" lg="8">
      <reminder-tasks-card />
      <task-module-tasks-card />
      <goal-tasks-card />
    </v-col>
    <v-col cols="12" lg="4">
      <statistics-card />
    </v-col>
  </v-row>
</v-container>
```

### 6. router/index.ts

**职责**: 路由配置

**导出**:

- `export const scheduleRoutes: RouteRecordRaw[]`

**路由结构**:

```typescript
/schedule
  └── /dashboard (ScheduleDashboardView)
      meta: {
        title: '调度控制台',
        requiresAuth: true
      }
```

### 7. index.ts (模块导出)

**职责**: 模块统一导出

**导出内容**:

```typescript
// 应用服务
export { ScheduleWebApplicationService, scheduleWebApplicationService };

// API 客户端
export * from './infrastructure/api/index';

// 路由
export { scheduleRoutes };

// 组件
export * from './presentation/components';

// Composables
export { useSchedule };
```

---

## 🔗 依赖关系图

```
index.ts (模块导出)
├── infrastructure/api/scheduleApiClient.ts
│   └── 依赖: apiClient (@/shared/api/instances)
│   └── 依赖: ScheduleContracts (@dailyuse/contracts)
│
├── services/ScheduleWebApplicationService.ts
│   └── 依赖: scheduleApiClient
│   └── 依赖: createLogger (@dailyuse/utils)
│
├── presentation/composables/useSchedule.ts
│   └── 依赖: scheduleWebApplicationService
│   └── 依赖: createLogger (@dailyuse/utils)
│
├── presentation/components/cards/*.vue
│   └── 依赖: ScheduleContracts (@dailyuse/contracts)
│
├── presentation/views/ScheduleDashboardView.vue
│   └── 依赖: useSchedule
│   └── 依赖: 4 个卡片组件
│   └── 依赖: createLogger (@dailyuse/utils)
│
└── router/index.ts
    └── 依赖: ScheduleDashboardView
```

---

## 📦 外部依赖

### Vue 生态

- `vue` - Vue 3 核心
- `vue-router` - 路由管理
- `vuetify` - UI 组件库

### DailyUse 内部包

- `@dailyuse/contracts` - 类型契约
- `@dailyuse/utils` - 工具函数（createLogger）

### 共享模块

- `@/shared/api/instances` - API 客户端实例

---

## 🎯 使用流程

### 1. 用户访问页面

```
用户访问 /schedule/dashboard
↓
router/index.ts 匹配路由
↓
加载 ScheduleDashboardView.vue
```

### 2. 页面初始化

```
ScheduleDashboardView.vue
↓
调用 useSchedule()
↓
useSchedule 初始化状态
↓
onMounted 调用 initialize()
↓
fetchTasks() + fetchStatistics() + fetchAllModuleStatistics()
```

### 3. 数据获取

```
useSchedule.fetchTasks()
↓
scheduleWebApplicationService.getAllTasks()
↓
scheduleApiClient.getTasks()
↓
apiClient.get('/schedules/tasks')
↓
API Backend
```

### 4. 用户操作

```
用户点击"暂停任务"
↓
Card 组件 emit('pause-task', taskUuid)
↓
View 组件 handlePauseTask(taskUuid)
↓
useSchedule.pauseTask(taskUuid)
↓
scheduleWebApplicationService.pauseTask(taskUuid)
↓
scheduleApiClient.pauseTask(taskUuid)
↓
API Backend
↓
更新本地状态
↓
UI 更新
```

---

## ✅ 完成清单

- [x] scheduleApiClient.ts - 18 个 API 方法
- [x] ScheduleWebApplicationService.ts - 18 个业务方法
- [x] useSchedule.ts - 12 个 composable 方法
- [x] ReminderTasksCard.vue - 提醒模块卡片
- [x] TaskModuleTasksCard.vue - 任务模块卡片
- [x] GoalTasksCard.vue - 目标模块卡片
- [x] StatisticsCard.vue - 统计信息卡片
- [x] ScheduleDashboardView.vue - 控制台页面
- [x] router/index.ts - 路由配置
- [x] index.ts - 模块导出
- [x] components/index.ts - 组件导出
- [x] infrastructure/api/index.ts - API 导出
- [x] application/index.ts - 应用层导出
- [x] initialization/scheduleInitialization.ts - 初始化逻辑

**总计: 14 个文件 ✅**

---

## 🚀 下一步

1. **集成到主应用**
   - 在主路由中注册 `scheduleRoutes`
   - 在导航菜单添加入口

2. **功能增强**
   - 添加任务创建对话框
   - 添加任务详情页面
   - 添加任务编辑功能

3. **测试**
   - 单元测试
   - 组件测试
   - E2E 测试

---

**最后更新**: 2025-10-12
**状态**: ✅ 100% 完成
