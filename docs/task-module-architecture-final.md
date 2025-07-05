# Task 模块最终架构设计

## 架构原则

### 1. 离线优先，数据一致性
- 所有数据持久化操作通过 IPC 走主进程
- Store 仅做状态管理和缓存，不负责持久化
- 支持多种数据获取策略

### 2. 层次清晰，职责单一
```
UI 层 → Application Service → IPC → 主进程 API → Database Repository → SQLite
     ↘ Store (状态管理) ↙
```

## 渲染进程架构

### Application Service (核心业务层)
- 直接调用 IPC API，不依赖仓库抽象
- 实现"持久化 + 同步状态"模式
- 支持多种数据获取策略：
  - `OFFLINE_FIRST`: 先返回缓存，后台同步
  - `REALTIME_FIRST`: 优先实时数据，失败降级到缓存
  - `CACHE_ONLY`: 仅使用缓存
  - `REALTIME_ONLY`: 强制实时数据

```typescript
// 示例：创建任务模板
async createTaskTemplate(template: TaskTemplate): Promise<TResponse<TaskTemplate>> {
  try {
    // 1. 通过 IPC 持久化
    const response = await window.shared.ipcRenderer.invoke('task:templates:save', template.toJSON());
    
    // 2. 成功后同步状态
    if (response.success && this.config.enableReactiveState) {
      this.taskStore.addTaskTemplate(template);
    }
    
    return response;
  } catch (error) {
    return { success: false, message: error.message };
  }
}
```

### Store (状态管理层)
- 提供响应式状态给 UI 层
- 实现批量同步方法（setTaskTemplates、setTaskInstances 等）
- 不直接处理持久化，由 Application Service 调用

### 依赖注入容器（简化版）
```typescript
export class TaskContainer {
  private static instance: TaskContainer;
  private taskStore = useTaskStore();
  
  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }
  
  getTaskStore() {
    return this.taskStore;
  }
}
```

## 主进程架构

### IPC API 层
- 接收渲染进程请求
- 调用 Application Service 处理业务逻辑
- 返回标准响应格式

### Application Service 层
- 业务逻辑处理
- 调用 Domain Service 和 Repository
- 事务管理

### Repository 层 (保留)
- 抽象数据访问
- 实现 CRUD 和复杂查询
- 支持多用户隔离
- 便于单元测试

### Database 层
- SQLite 直接操作
- 表结构和索引管理
- 数据序列化/反序列化

## 数据流示例

### 创建任务模板
1. UI → Application Service → IPC → 主进程 API
2. 主进程：验证 → Domain Service → Database Repository → SQLite
3. 主进程：返回结果 → IPC → Application Service
4. Application Service：同步更新 Store → UI 响应

### 查询任务模板
- **离线优先**：Store 缓存 → 后台 IPC 同步
- **实时优先**：IPC 查询 → 更新 Store → 返回数据

## 配置策略

### 默认配置（离线优先）
```typescript
const config = {
  dataFetchStrategy: DataFetchStrategy.OFFLINE_FIRST,
  enableReactiveState: true,
  enableAutoSync: true,
  syncInterval: 30000
};
```

### 实时配置（数据一致性优先）
```typescript
const config = {
  dataFetchStrategy: DataFetchStrategy.REALTIME_FIRST,
  enableReactiveState: true,
  enableAutoSync: false
};
```

## 优势总结

### 性能优势
- Store 缓存提供快速响应
- 后台同步保证数据新鲜度
- 减少不必要的 IPC 调用

### 一致性优势
- 所有持久化操作通过主进程
- 多进程数据同步机制
- 支持实时数据策略

### 维护优势
- 层次清晰，职责单一
- 主进程保留仓库抽象，便于测试
- 渲染进程简化，减少复杂度

### 扩展优势
- 支持多种数据策略
- 便于添加缓存层
- 支持离线操作

## 后续优化方向

1. **智能缓存策略**：基于使用频率和时间的缓存淘汰
2. **增量同步**：只同步变更的数据
3. **离线支持**：检测网络状态，自动切换策略
4. **性能监控**：监控 IPC 调用耗时和缓存命中率
