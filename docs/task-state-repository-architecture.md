## 任务应用服务架构重构 - 抽象状态仓库模式

### 重构概述

将任务应用服务层从直接依赖 Pinia store 重构为使用抽象状态仓库接口，实现了更好的分层架构和依赖管理。

### 架构对比

#### 重构前（直接使用 taskStore）
```typescript
// ❌ 问题：Application 层直接依赖 Presentation 层
export class TaskDomainApplicationService {
  private taskStore = useTaskStore(); // 直接依赖具体实现
  
  async createTaskTemplate(dto: ITaskTemplate) {
    const response = await taskIpcClient.createTaskTemplate(dto);
    if (response.success && response.data) {
      await this.taskStore.addTaskTemplate(response.data); // 紧耦合
    }
  }
}
```

#### 重构后（抽象状态仓库）
```typescript
// ✅ 优势：依赖倒置，面向接口编程
export class TaskDomainApplicationService {
  private stateRepository: ITaskStateRepository; // 依赖抽象接口
  
  constructor(stateRepository?: ITaskStateRepository) {
    this.stateRepository = stateRepository || new PiniaTaskStateRepository();
  }
  
  async createTaskTemplate(dto: ITaskTemplate) {
    const response = await taskIpcClient.createTaskTemplate(dto);
    if (response.success && response.data) {
      await this.stateRepository.addTaskTemplate(response.data); // 松耦合
    }
  }
}
```

### 架构优势

#### 1. **符合 DDD 分层架构**
- **Application 层**：不再直接依赖 Presentation 层
- **Infrastructure 层**：状态管理的具体实现
- **Domain 层**：定义抽象接口契约

#### 2. **依赖倒置原则 (DIP)**
- 高层模块（Application）不依赖低层模块（Store）
- 两者都依赖抽象接口（ITaskStateRepository）
- 面向接口编程，而非面向实现编程

#### 3. **可测试性大幅提升**
```typescript
// 单元测试时可以轻松 mock
const mockStateRepository: ITaskStateRepository = {
  addTaskTemplate: jest.fn(),
  updateTaskTemplate: jest.fn(),
  // ... 其他方法
};

const service = new TaskDomainApplicationService(mockStateRepository);
```

#### 4. **可扩展性和灵活性**
- 可以轻松切换不同的状态管理方案（Vuex、Zustand 等）
- 支持多种状态存储策略（内存、本地存储、远程缓存等）
- 不同环境可以使用不同的实现

#### 5. **关注点分离**
- 应用服务专注业务逻辑编排
- 状态仓库专注状态管理
- IPC 客户端专注数据通信

### 文件架构

```
src/modules/Task/
├── domain/
│   └── repositories/
│       └── ITaskStateRepository.ts        # 抽象接口定义
├── infrastructure/
│   └── repositories/
│       └── piniaTaskStateRepository.ts    # Pinia 具体实现
└── application/
    └── services/
        └── taskDomainApplicationService.ts # 应用服务（使用抽象接口）
```

### 使用示例

#### 默认使用（Pinia）
```typescript
const taskService = new TaskDomainApplicationService();
// 自动使用 PiniaTaskStateRepository
```

#### 依赖注入（测试或其他实现）
```typescript
const customStateRepo = new CustomTaskStateRepository();
const taskService = new TaskDomainApplicationService(customStateRepo);
```

#### 全量数据同步
```typescript
// 公开方法，供初始化时调用
await taskService.syncAllData();
```

### 关键接口方法

| 方法 | 描述 | 使用场景 |
|------|------|----------|
| `addTaskTemplate` | 添加任务模板到状态 | 创建新模板后 |
| `updateTaskTemplate` | 更新任务模板状态 | 模板状态变更后 |
| `removeTaskTemplate` | 删除任务模板 | 删除模板后 |
| `syncAllTaskData` | 全量同步所有数据 | 应用初始化 |
| `isAvailable` | 检查仓库可用性 | 错误处理 |

### 错误处理策略

1. **状态仓库不可用时**：输出警告但不阻断业务流程
2. **同步失败时**：记录错误日志，不影响主业务逻辑
3. **依赖注入验证**：确保注入的实现符合接口契约

### 性能优化

1. **批量操作**：`syncAllTaskData` 一次性同步所有数据
2. **懒加载**：状态仓库按需创建和使用
3. **错误隔离**：状态同步失败不影响核心业务

### 总结

通过引入抽象状态仓库模式，实现了：
- ✅ 更清晰的分层架构
- ✅ 更好的可测试性
- ✅ 更强的可扩展性
- ✅ 更松的耦合度
- ✅ 更符合 SOLID 原则

这种架构模式为后续的功能扩展和维护提供了坚实的基础。
