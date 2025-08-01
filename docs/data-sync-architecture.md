# 渲染进程数据同步架构文档

## 概述

本文档详细描述了 DailyUse 应用中渲染进程如何从主进程持久化数据同步到状态仓库的完整机制。该架构基于 Domain-Driven Design (DDD) 和 Clean Architecture 原则，实现了高内聚、低耦合的数据流管理。

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     渲染进程 (Renderer Process)                     │
├─────────────────────────────────────────────────────────────────┤
│  用户界面层 (Presentation Layer)                                   │
│  ┌─────────────────┐    ┌─────────────────┐                      │
│  │   Vue 组件       │    │   Pinia Store   │                      │
│  │                 │    │  (goalStore,    │                      │
│  │                 │    │   taskStore)    │                      │
│  └─────────────────┘    └─────────────────┘                      │
├─────────────────────────────────────────────────────────────────┤
│  应用服务层 (Application Layer)                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │        领域应用服务 (Domain Application Service)              │ │
│  │  ┌─────────────────┐    ┌─────────────────┐                 │ │
│  │  │ GoalDomainApp   │    │ TaskDomainApp   │                 │ │
│  │  │ Service         │    │ Service         │                 │ │
│  │  └─────────────────┘    └─────────────────┘                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  基础设施层 (Infrastructure Layer)                                │
│  ┌─────────────────┐    ┌─────────────────┐                      │
│  │   IPC 客户端     │    │   状态仓库       │                      │
│  │ (goalIpcClient) │    │ (PiniaState     │                      │
│  │                 │    │  Repository)    │                      │
│  └─────────────────┘    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ IPC 通信
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     主进程 (Main Process)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                      │
│  │   IPC 处理器     │    │   应用服务       │                      │
│  │                 │    │                 │                      │
│  │                 │    │                 │                      │
│  └─────────────────┘    └─────────────────┘                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                      │
│  │   数据库仓库     │    │   SQLite 数据库  │                      │
│  │                 │    │                 │                      │
│  │                 │    │                 │                      │
│  └─────────────────┘    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. 用户数据初始化服务 (UserDataInitService)

位置：`src/shared/services/userDataInitService.ts`

这是数据同步的入口点，负责在用户登录时初始化所有模块的数据。

```typescript
export class UserDataInitService {
  static async initUserData(username?: string): Promise<void> {
    // 并行加载各个模块的数据
    await Promise.all([
      this.initGoalData(targetUsername),    // 目标数据
      this.initTaskData(targetUsername),    // 任务数据  
      this.initReminderData(targetUsername), // 提醒数据
      this.initRepositoryData(targetUsername), // 仓库数据
      this.initSettingData(targetUsername), // 设置数据
    ]);
  }
}
```

#### 目标数据初始化流程

```typescript
private static async initGoalData(username: string): Promise<void> {
  try {
    console.log(`开始初始化目标数据 (用户: ${username})...`);
    
    // 通过领域应用服务同步目标数据
    const goalService = getGoalDomainApplicationService();
    await goalService.syncAllData();
    
    console.log(`✅ 目标数据初始化完成`);
  } catch (error) {
    console.error("❌ 目标数据初始化失败:", error);
    // 错误处理：重置状态为空数组
    const goalStore = useGoalStore();
    goalStore.$patch({
      goals: [],
      goalDirs: [],
    });
    throw error;
  }
}
```

### 2. 领域应用服务 (Domain Application Service)

#### 目标领域应用服务

位置：`src/modules/Goal/application/services/goalDomainApplicationService.ts`

这是渲染进程数据同步的核心协调者，负责：
- 调用 IPC 客户端与主进程通信
- 同步数据到前端状态仓库
- 处理错误和异常情况
- 提供统一的业务接口

```typescript
export class GoalDomainApplicationService {
  constructor(private stateRepository?: IGoalStateRepository) {}

  /**
   * 同步所有数据 - 这是数据初始化的核心方法
   */
  async syncAllData(): Promise<void> {
    try {
      console.log('🔄 [目标应用服务] 开始同步所有目标数据');

      if (!this.stateRepository?.isAvailable()) {
        console.warn('⚠️ 状态仓库不可用，跳过同步');
        return;
      }

      // 并行获取所有数据
      const [goals, records, goalDirs] = await Promise.all([
        this.getAllGoals(),     // 获取所有目标
        this.getAllGoalRecords(),   // 获取所有记录
        this.getAllGoalDirs(),  // 获取所有目标目录
      ]);

      // 批量同步到状态仓库
      await this.stateRepository.syncAllGoalData({
        goals,
        records,
        goalDirs,
      });

      console.log('✅ [目标应用服务] 所有目标数据同步完成');
    } catch (error) {
      console.error('❌ [目标应用服务] 同步所有数据失败:', error);
    }
  }
}
```

#### 任务领域应用服务

位置：`src/modules/Task/application/services/taskDomainApplicationService.ts`

```typescript
export class TaskDomainApplicationService {
  /**
   * 批量同步数据 - 公开方法，供外部调用
   */
  async syncAllData(): Promise<void> {
    await this.syncAllState();
  }

  /**
   * 自动同步状态数据 - 确保与数据库一致性
   */
  private async syncAllState() {
    try {
      if (!this.stateRepository.isAvailable()) {
        console.warn('⚠️ 状态仓库不可用，跳过同步');
        return;
      }

      console.log('🔄 开始同步任务数据到状态仓库...');
      
      // 并行获取所有数据
      const [templatesResponse, instancesResponse, metaTemplatesResponse] = await Promise.all([
        taskIpcClient.getAllTaskTemplates(),
        taskIpcClient.getAllTaskInstances(), 
        taskIpcClient.getAllMetaTemplates()
      ]);

      // 批量同步所有数据
      const templates = templatesResponse.success ? templatesResponse.data || [] : [];
      const instances = instancesResponse.success ? instancesResponse.data || [] : [];
      const metaTemplates = metaTemplatesResponse.success ? metaTemplatesResponse.data || [] : [];

      await this.stateRepository.syncAllTaskData(templates, instances, metaTemplates);
      console.log('✅ 任务数据同步完成');
    } catch (error) {
      console.error('❌ 同步任务数据失败:', error);
    }
  }
}
```

### 3. IPC 客户端 (IPC Client)

位置：`src/modules/Goal/infrastructure/ipc/goalIpcClient.ts`

IPC 客户端负责与主进程进行通信，获取持久化数据。

```typescript
export class GoalIpcClient {
  /**
   * 获取所有目标
   */
  async getAllGoals(): Promise<TResponse<IGoal[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取所有目标');
      
      const response = await window.shared.ipcRenderer.invoke('goal:get-all');
      
      if (response.success) {
        console.log(`✅ [渲染进程-IPC] 获取目标成功，数量: ${response.data?.length || 0}`);
      } else {
        console.error('❌ [渲染进程-IPC] 获取目标失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有记录
   */
  async getAllGoalRecords(): Promise<TResponse<IGoalRecord[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取所有记录');
      
      const response = await window.shared.ipcRenderer.invoke('goal:getAllGoalRecords');
      
      if (response.success) {
        console.log(`✅ [渲染进程-IPC] 获取记录成功，数量: ${response.data?.length || 0}`);
      } else {
        console.error('❌ [渲染进程-IPC] 获取记录失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取记录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有目标目录
   */
  async getAllGoalDirs(): Promise<TResponse<IGoalDir[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取所有目标目录');
      
      const response = await window.shared.ipcRenderer.invoke('goal:dir:get-all');
      
      if (response.success) {
        console.log(`✅ [渲染进程-IPC] 获取目标目录成功，数量: ${response.data?.length || 0}`);
      } else {
        console.error('❌ [渲染进程-IPC] 获取目标目录失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取目标目录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
}
```

### 4. 状态仓库 (State Repository)

#### Pinia 目标状态仓库

位置：`src/modules/Goal/infrastructure/repositories/piniaGoalStateRepository.ts`

状态仓库实现了领域仓库接口，将抽象的状态管理操作映射到 Pinia store 的具体方法。

```typescript
export class PiniaGoalStateRepository implements IGoalStateRepository {
  private _goalStore: ReturnType<typeof useGoalStore> | null = null;

  /**
   * 延迟获取 goalStore，确保 Pinia 已经初始化
   */
  private get goalStore() {
    if (!this._goalStore) {
      this._goalStore = useGoalStore();
    }
    return this._goalStore;
  }

  /**
   * 批量同步所有数据 - 数据初始化的核心方法
   */
  async syncAllGoalData(data: {
    goals: IGoal[];
    records: IGoalRecord[];
    goalDirs: IGoalDir[];
  }): Promise<void> {
    try {
      this.goalStore.syncAllGoalData(data);
      console.log(`✅ [StateRepo] 全量同步目标数据: ${data.goals.length} 目标, ${data.records.length} 记录, ${data.goalDirs.length} 目录`);
    } catch (error) {
      console.error('❌ [StateRepo] 全量同步失败', error);
      throw error;
    }
  }

  // 其他增删改查方法...
  async addGoal(goal: IGoal): Promise<void> { /* ... */ }
  async updateGoal(goal: IGoal): Promise<void> { /* ... */ }
  async removeGoal(goalUuid: string): Promise<void> { /* ... */ }
  // ...
}
```

#### Pinia 任务状态仓库

位置：`src/modules/Task/infrastructure/repositories/piniaTaskStateRepository.ts`

```typescript
export class PiniaTaskStateRepository implements ITaskStateRepository {
  /**
   * 综合状态同步 - 批量同步所有任务数据
   */
  async syncAllTaskData(
    templates: ITaskTemplate[], 
    instances: ITaskInstance[], 
    metaTemplates: any[]
  ): Promise<void> {
    try {
      this.taskStore.syncAllData(templates, instances, metaTemplates);
      console.log(`✅ [StateRepo] 全量同步任务数据: ${templates.length} 模板, ${instances.length} 实例, ${metaTemplates.length} 元模板`);
    } catch (error) {
      console.error('❌ [StateRepo] 全量同步失败', error);
      throw error;
    }
  }
}
```

### 5. Pinia Store

#### 目标 Store

位置：`src/modules/Goal/presentation/stores/goalStore.ts`

```typescript
export const useGoalStore = defineStore('goal', {
  state: (): GoalState => ({
    goals: [],
    goalDirs: [],
    tempGoalDir: null,
  }),

  actions: {
    /**
     * 同步所有目标数据（保持系统文件夹）
     */
    async syncAllGoalData(data: {
      goals: IGoal[];
      records: IGoalRecord[];
      goalDirs: IGoalDir[];
    }): Promise<void> {
      this.goals = data.goals;
      
      // 保留系统文件夹，只同步用户文件夹
      const systemDirs = this.goalDirs.filter(dir => 
        dir.uuid === SYSTEM_GOAL_DIRS.ALL ||
        dir.uuid === SYSTEM_GOAL_DIRS.DELETED ||
        dir.uuid === SYSTEM_GOAL_DIRS.ARCHIVED
      );
      
      const userDirs = data.goalDirs.filter(dir => 
        dir.uuid !== SYSTEM_GOAL_DIRS.ALL &&
        dir.uuid !== SYSTEM_GOAL_DIRS.DELETED &&
        dir.uuid !== SYSTEM_GOAL_DIRS.ARCHIVED
      );
      
      this.goalDirs = [...systemDirs, ...userDirs];
      // records 已经包含在 goals 中，无需单独处理
    }
  }
});
```

#### 任务 Store

位置：`src/modules/Task/presentation/stores/taskStore.ts`

```typescript
export const useTaskStore = defineStore('task', {
  actions: {
    /**
     * 批量同步所有数据（从主进程同步时使用）
     */
    syncAllData(templates: any[], instances: any[], metaTemplates: any[]): void {
      console.log('🔄 [TaskStore] syncAllData 开始同步数据...');
      console.log('📊 输入数据:', { 
        templatesCount: templates.length, 
        instancesCount: instances.length, 
        metaTemplatesCount: metaTemplates.length 
      });
      
      // 直接使用 $patch 批量更新，避免重复调用
      this.$patch({
        taskTemplates: templates.map(template => ensureTaskTemplate(template)),
        taskInstances: instances.map(instance => ensureTaskInstance(instance)),
        metaTemplates: metaTemplates.map(meta => ensureTaskMetaTemplate(meta)),
      });
      
      console.log('✅ [TaskStore] syncAllData 同步完成');
      console.log('📈 最终状态:', {
        templatesCount: this.taskTemplates.length,
        instancesCount: this.taskInstances.length,
        metaTemplatesCount: this.metaTemplates.length
      });
    }
  }
});
```

## 数据同步流程

### 1. 应用启动时的数据同步

```
用户登录
    ↓
AppInitService.initialize()
    ↓
UserDataInitService.initUserData()
    ↓
并行初始化各模块数据:
    ├─ initGoalData() → GoalDomainApplicationService.syncAllData()
    ├─ initTaskData() → TaskDomainApplicationService.syncAllData()
    ├─ initReminderData() → 直接从文件存储读取
    ├─ initRepositoryData() → 直接从文件存储读取
    └─ initSettingData() → 直接从文件存储读取
```

### 2. 目标数据同步详细流程

```
GoalDomainApplicationService.syncAllData()
    ↓
并行调用 IPC 获取数据:
    ├─ goalIpcClient.getAllGoals()     → 'goal:get-all'
    ├─ goalIpcClient.getAllGoalRecords()   → 'goal:getAllGoalRecords'
    └─ goalIpcClient.getAllGoalDirs()  → 'goal:dir:get-all'
    ↓
主进程处理 IPC 请求:
    ├─ MainGoalApplicationService.getAllGoals()
    ├─ MainGoalApplicationService.getAllGoalRecords()
    └─ MainGoalApplicationService.getAllGoalDirs()
    ↓
从 SQLite 数据库查询数据
    ↓
返回数据到渲染进程
    ↓
PiniaGoalStateRepository.syncAllGoalData()
    ↓
goalStore.syncAllGoalData()
    ↓
更新 Pinia store 状态
    ↓
Vue 组件响应式更新 UI
```

### 3. 任务数据同步详细流程

```
TaskDomainApplicationService.syncAllData()
    ↓
TaskDomainApplicationService.syncAllState()
    ↓
并行调用 IPC 获取数据:
    ├─ taskIpcClient.getAllTaskTemplates()  → 'task:getAllTemplates'
    ├─ taskIpcClient.getAllTaskInstances()  → 'task:getAllInstances'
    └─ taskIpcClient.getAllMetaTemplates()  → 'task:getAllMetaTemplates'
    ↓
主进程处理 IPC 请求
    ↓
从 SQLite 数据库查询数据
    ↓
返回数据到渲染进程
    ↓
PiniaTaskStateRepository.syncAllTaskData()
    ↓
taskStore.syncAllData()
    ↓
更新 Pinia store 状态
    ↓
Vue 组件响应式更新 UI
```

## 错误处理机制

### 1. 网络级错误处理

```typescript
// IPC 客户端层
try {
  const response = await window.shared.ipcRenderer.invoke('goal:get-all');
  return response;
} catch (error) {
  console.error('❌ [渲染进程-IPC] 获取目标通信错误:', error);
  return {
    success: false,
    message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
  };
}
```

### 2. 业务级错误处理

```typescript
// 领域应用服务层
try {
  await goalService.syncAllData();
  console.log(`✅ 目标数据初始化完成`);
} catch (error) {
  console.error("❌ 目标数据初始化失败:", error);
  // 错误恢复：重置为空状态
  const goalStore = useGoalStore();
  goalStore.$patch({
    goals: [],
    goalDirs: [],
  });
  throw error;
}
```

### 3. 状态仓库可用性检查

```typescript
if (!this.stateRepository?.isAvailable()) {
  console.warn('⚠️ 状态仓库不可用，跳过同步');
  return;
}
```

## 性能优化策略

### 1. 并行数据获取

```typescript
// 并行获取所有数据，减少总等待时间
const [goals, records, goalDirs] = await Promise.all([
  this.getAllGoals(),
  this.getAllGoalRecords(), 
  this.getAllGoalDirs(),
]);
```

### 2. 批量状态更新

```typescript
// 使用 $patch 进行批量更新，避免多次响应式触发
this.$patch({
  taskTemplates: templates.map(template => ensureTaskTemplate(template)),
  taskInstances: instances.map(instance => ensureTaskInstance(instance)),
  metaTemplates: metaTemplates.map(meta => ensureTaskMetaTemplate(meta)),
});
```

### 3. 延迟初始化

```typescript
// 延迟获取 store 实例，确保 Pinia 已初始化
private get goalStore() {
  if (!this._goalStore) {
    this._goalStore = useGoalStore();
  }
  return this._goalStore;
}
```

## 配置与扩展

### 1. 工厂方法模式

```typescript
// 支持依赖注入和默认创建
export function getGoalDomainApplicationService(
  stateRepository?: IGoalStateRepository
): GoalDomainApplicationService {
  return new GoalDomainApplicationService(
    stateRepository || new PiniaGoalStateRepository()
  );
}

// 获取默认实例
export function getGoalDomainApplicationService(): GoalDomainApplicationService {
  if (!defaultGoalService) {
    defaultGoalService = getGoalDomainApplicationService();
  }
  return defaultGoalService;
}
```

### 2. 接口抽象

```typescript
// 状态仓库接口，便于测试和替换实现
export interface IGoalStateRepository {
  syncAllGoalData(data: { goals: IGoal[]; records: IGoalRecord[]; goalDirs: IGoalDir[]; }): Promise<void>;
  addGoal(goal: IGoal): Promise<void>;
  updateGoal(goal: IGoal): Promise<void>;
  removeGoal(goalUuid: string): Promise<void>;
  isAvailable(): boolean;
}
```

## 日志与监控

### 1. 结构化日志

```typescript
console.log('🔄 [目标应用服务] 开始同步所有目标数据');
console.log(`✅ [StateRepo] 全量同步目标数据: ${data.goals.length} 目标, ${data.records.length} 记录, ${data.goalDirs.length} 目录`);
console.error('❌ [目标应用服务] 同步所有数据失败:', error);
```

### 2. 性能监控

```typescript
console.log('📊 输入数据:', { 
  templatesCount: templates.length, 
  instancesCount: instances.length, 
  metaTemplatesCount: metaTemplates.length 
});

console.log('📈 最终状态:', {
  templatesCount: this.taskTemplates.length,
  instancesCount: this.taskInstances.length, 
  metaTemplatesCount: this.metaTemplates.length
});
```

## 总结

该数据同步架构具有以下特点：

1. **分层清晰**：通过领域应用服务、IPC 客户端、状态仓库等层次分离关注点
2. **职责单一**：每个组件都有明确的职责范围
3. **容错性强**：多层次错误处理和恢复机制
4. **性能优秀**：并行加载、批量更新等优化策略
5. **可扩展性**：通过接口抽象和工厂模式支持扩展
6. **可测试性**：依赖注入和接口抽象便于单元测试

这套架构确保了数据的一致性、可靠性和性能，为复杂的 Electron 应用提供了坚实的数据管理基础。
