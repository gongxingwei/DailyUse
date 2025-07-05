# Task 模块重构总结

## 重构目标

将 Task 模块从"本地存储 + 仓库模式"重构为"IPC 持久化 + Store 状态管理"模式，实现渲染进程和主进程的清晰职责分离。

## 架构设计原则

### 面向对象 vs 面向过程的分工

1. **TaskInstance/TaskTemplate 类（面向对象）**：
   - 领域模型，包含业务逻辑和行为方法
   - 提供 UI 校验方法（`canComplete()`, `canStart()` 等）
   - 包含工厂方法和序列化方法
   - 用于渲染进程的业务逻辑处理

2. **ITaskInstance/ITaskTemplate 接口（面向过程）**：
   - 数据传输对象（DTO），纯数据结构
   - 用于序列化和跨进程传输
   - Store 状态管理使用的数据格式
   - IPC 调用的参数和返回值格式

3. **Mapper 类**：
   - 负责领域模型和 DTO 之间的转换
   - 提供类型安全的数据映射

## 已完成的重构

### 1. 渲染进程重构

#### 1.1 应用层服务 (`taskApplicationService.ts`)
- ✅ 移除所有本地仓库依赖 (`this.taskInstanceRepo`, `this.taskTemplateRepo`)
- ✅ 所有业务操作改为 IPC 调用 (`ipcRenderer.invoke`)
- ✅ 新增 `performTaskInstanceAction` 和 `performTaskTemplateAction` 辅助方法
- ✅ 优化 `saveTaskTemplate`，移除渲染进程的"是否存在"判断
- ✅ 成功后同步更新本地 Store 状态

#### 1.2 配置重构 (`taskModuleConfig.ts`)
- ✅ 移除 `RepositoryMode` 和 `TaskContainer`
- ✅ 重构为 IPC 模式配置：
  - 数据获取策略 (`fetchStrategy`)
  - 自动同步配置 (`autoSync`)
  - 响应式状态管理 (`reactive`)
  - IPC 超时设置 (`ipcTimeout`)
- ✅ 新增配置验证和推荐工具

#### 1.3 领域模型重构 (`taskInstance.ts`, `taskTemplate.ts`)
- ✅ 移除所有业务操作方法（`complete`, `start`, `cancel`, `reschedule`, `activate`, `pause`, `archive` 等）
- ✅ 新增 UI 校验方法：
  - `canComplete()`, `canStart()`, `canCancel()`, `canReschedule()` 等
  - `getAvailableActions()`, `previewAction()` 
  - `validateRescheduleTime()`, `validateConfiguration()` 等
- ✅ 保留状态检查方法 (`isPending`, `isInProgress` 等)
- ✅ 保留工厂方法和序列化方法 (`fromTemplate`, `toJSON`, `fromCompleteData`)

#### 1.4 DTO 和映射器（优化后）
- ✅ **移除重复接口定义**：不再创建 `TaskInstanceData` 和 `TaskTemplateData`，直接使用现有的 `ITaskInstance` 和 `ITaskTemplate` 接口
- ✅ **明确职责分工**：
  - `TaskInstance/TaskTemplate` 类：面向对象的领域模型，包含业务逻辑和行为方法
  - `ITaskInstance/ITaskTemplate` 接口：面向过程的数据传输对象，用于序列化和跨进程传输
- ✅ 重构 `TaskInstanceMapper` 和 `TaskTemplateMapper` 类：
  - `toDTO()` / `fromDTO()` 方法实现领域模型与 DTO 的双向转换
  - 支持批量转换：`toDTOArray()` / `fromDTOArray()`
  - 支持部分更新：`toPartialDTO()`

### 2. 主进程验证

#### 2.1 应用层服务
- ✅ 确认包含所有业务操作方法：
  - 任务实例：`completeTask`, `startTask`, `cancelTask`, `rescheduleTask`, `undoCompleteTask`
  - 任务模板：`activateTemplate`, `pauseTemplate`, `archiveTemplate`, `updateTemplateTitle`, `updateTemplateDescription`

#### 2.2 IPC 处理器
- ✅ 确认所有业务操作已通过 IPC 暴露：
  - `task:instances:complete`, `task:instances:start`, `task:instances:cancel`
  - `task:templates:activate`, `task:templates:pause`, `task:templates:archive`
  - 提醒相关：`trigger-reminder`, `snooze-reminder`, `dismiss-reminder`

## 架构对比

### 重构前
```
渲染进程: [UI] → [应用服务] → [本地仓库] → [IPC] → 主进程
问题: 渲染进程包含业务逻辑和持久化操作，职责不清
```

### 重构后
```
渲染进程: [UI] → [应用服务] → [IPC] → 主进程: [业务逻辑] → [持久化]
                     ↓
                [Store状态管理(ITaskInstance/ITaskTemplate)]
                     ↑
               [TaskInstanceMapper/TaskTemplateMapper]
                     ↑
            [TaskInstance/TaskTemplate 领域模型]

优势: 
- 职责清晰：渲染进程专注 UI，主进程处理业务逻辑
- 类型安全：通过 Mapper 确保数据转换的正确性
- 无重复定义：复用现有的 ITaskInstance/ITaskTemplate 接口
```

## 使用方式变化

### 重构前
```typescript
// 直接调用领域模型的业务方法
taskInstance.complete();
await this.taskInstanceRepo.save(taskInstance);
```

### 重构后
```typescript
// 通过应用服务调用 IPC，由主进程处理业务逻辑
await this.taskApplicationService.completeTaskInstance(taskId);

// 使用 Mapper 进行数据转换
const taskDTO: ITaskInstance = TaskInstanceMapper.toDTO(taskInstance);
const taskModel: TaskInstance = TaskInstanceMapper.fromDTO(taskDTO);
```

## 数据流说明

1. **业务操作流程**：
   ```
   UI组件 → 应用服务 → IPC调用 → 主进程业务逻辑 → 数据库
                                                    ↓
   Store更新 ← IPC响应 ← 业务处理结果 ← 数据持久化
   ```

2. **UI校验流程**：
   ```
   UI组件 → 领域模型UI校验方法 → 校验结果 → UI状态更新
   (无需IPC调用，纯客户端校验)
   ```

## 重构收益

1. **架构清晰**：渲染进程和主进程职责明确分离
2. **性能优化**：减少渲染进程的业务逻辑负担
3. **可维护性**：业务逻辑集中在主进程，易于维护和测试
4. **类型安全**：通过 Mapper 确保数据传输的类型安全，复用现有接口定义
5. **扩展性**：便于添加新的业务操作和校验规则
6. **代码简洁**：避免重复的接口定义，明确面向对象和面向过程的分工

## 注意事项

1. **业务操作**：必须通过应用层服务调用 IPC，不能直接调用领域模型方法
2. **UI校验**：可以使用领域模型的校验方法，但仅用于 UI 层面的提示
3. **数据同步**：业务操作成功后，应用服务会自动同步 Store 状态
4. **错误处理**：IPC 调用需要适当的错误处理和用户反馈

## 待办事项

- [ ] 端到端测试所有 CRUD、批量、查询、提醒等操作
- [ ] 性能测试，确保 IPC 调用的响应时间满足要求
- [ ] 补充单元测试，覆盖新的 UI 校验方法
- [ ] 更新用户文档和开发指南

## 最佳实践

1. **渲染进程开发**：
   - 使用应用层服务进行业务操作
   - 使用领域模型的校验方法进行 UI 校验
   - 通过 Store 管理 UI 状态

2. **主进程开发**：
   - 在应用层服务中实现业务逻辑
   - 通过 IPC 处理器暴露业务接口
   - 确保数据验证和业务规则的执行

3. **数据传输**：
   - 使用现有的 ITaskInstance/ITaskTemplate 接口作为 DTO
   - 使用 TaskInstanceMapper/TaskTemplateMapper 进行数据转换
   - 避免直接传输领域模型实例，保持类型安全
