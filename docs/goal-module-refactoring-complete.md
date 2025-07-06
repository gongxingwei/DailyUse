# Goal 模块架构重构 - 完整实现指南

## 概述

Goal 模块已按照 Task 模块的架构进行了全链路重构，实现了完整的分层架构、领域实体、DTO、主进程应用服务、IPC 通信、Pinia 状态仓库、前后端数据一致性等功能。

## 架构层次

```
src/modules/Goal/
├── domain/                    # 领域层
│   ├── types/                 # 类型定义
│   │   └── goal.d.ts         # 目标、关键结果、记录、目录的接口定义
│   ├── entities/              # 领域实体
│   │   ├── goal.ts           # 目标实体
│   │   ├── keyResult.ts      # 关键结果实体
│   │   ├── record.ts         # 记录实体
│   │   └── goalDir.ts        # 目录实体
│   └── repositories/          # 仓库接口
│       └── IGoalStateRepository.ts  # 状态仓库接口
├── application/               # 应用层
│   └── services/             # 应用服务
│       └── goalDomainApplicationService.ts  # 领域应用服务
├── infrastructure/           # 基础设施层
│   ├── ipc/                  # IPC 通信
│   │   └── goalIpcClient.ts  # IPC 客户端
│   └── repositories/         # 仓库实现
│       └── piniaGoalStateRepository.ts  # Pinia 状态仓库实现
├── presentation/             # 表现层
│   └── stores/               # 状态管理
│       └── goalStore.ts      # 新的 Pinia Store
├── composables/              # 组合式函数
│   └── useGoalManagement.new.ts  # 新的目标管理组合函数
└── views/                    # 视图组件
    └── ...                   # 现有的 Vue 组件

electron/modules/goal/         # 主进程
├── application/              # 主进程应用层
│   └── mainGoalApplicationService.ts  # 主进程应用服务
└── ipcs/                     # 主进程 IPC 处理
    └── goalIpcHandler.ts     # IPC 处理器
```

## 核心功能

### 1. 领域实体

所有领域实体都支持：
- DTO 转换（`toDTO()`, `fromDTO()`）
- 深度序列化（`deepSerialize()`）
- 业务逻辑方法
- 生命周期管理

```typescript
// 示例：目标实体使用
import { Goal } from '@/modules/Goal/domain/entities/goal';

const goalData = { /* IGoal 数据 */ };
const goal = new Goal(goalData);

// 更新目标
goal.updateTitle('新标题');
goal.updateProgress(75);

// 管理关键结果
goal.addKeyResult(keyResultData);
goal.removeKeyResult('kr-id');

// 计算进度
const progress = goal.calculateProgress();

// DTO 转换
const dto = goal.toDTO();
```

### 2. 主进程应用服务

主进程服务支持：
- 目标 CRUD 操作
- 关键结果管理
- 记录管理
- 目录管理
- 批量操作
- 数据验证

```typescript
// 示例：主进程服务使用
import { MainGoalApplicationService } from '@/electron/modules/goal/application/mainGoalApplicationService';

const mainService = new MainGoalApplicationService();

// 创建目标
const result = await mainService.createGoal(goalData);

// 批量创建
const batchResult = await mainService.batchCreateGoals(goalsArray);

// 获取所有数据
const allData = await mainService.getAllGoalData();
```

### 3. IPC 通信

IPC 客户端提供完整的通信能力：
- 所有数据经过 `deepSerializeForIpc` 序列化
- 支持复杂对象传输
- 错误处理和重试机制

```typescript
// 示例：IPC 客户端使用
import { goalIpcClient } from '@/modules/Goal/infrastructure/ipc/goalIpcClient';

// 创建目标
const response = await goalIpcClient.createGoal(goalData);

// 更新关键结果值
const updateResponse = await goalIpcClient.updateKeyResultCurrentValue(
  keyResultId, 
  goalId, 
  newValue
);
```

### 4. 领域应用服务

协调 IPC 通信和状态同步：
- 调用 IPC 与主进程通信
- 自动同步状态到前端
- 统一的错误处理
- 依赖注入支持

```typescript
// 示例：领域应用服务使用
import { createGoalDomainApplicationService } from '@/modules/Goal/application/services/goalDomainApplicationService';

const goalService = createGoalDomainApplicationService();

// 创建目标并自动同步状态
const result = await goalService.createGoal(goalData);

// 删除目标并清理相关记录
await goalService.deleteGoal(goalId);

// 同步所有数据
await goalService.syncAllData();
```

### 5. Pinia Store

新的状态管理提供：
- 完整的状态管理
- 响应式数据
- 持久化支持
- 兼容性方法

```typescript
// 示例：Store 使用
import { useGoalStore } from '@/modules/Goal/presentation/stores/goalStore';

const goalStore = useGoalStore();

// 访问状态
console.log(goalStore.goals);
console.log(goalStore.records);
console.log(goalStore.goalDirs);

// 状态操作
goalStore.addGoal(goal);
goalStore.updateGoal(updatedGoal);
goalStore.removeGoal(goalId);

// 批量同步
await goalStore.syncAllGoalData(allData);
```

### 6. 组合式函数

新的组合函数整合了新架构：
- 使用领域应用服务
- 响应式状态管理
- 业务逻辑封装

```typescript
// 示例：组合函数使用
import { useGoalManagement } from '@/modules/Goal/composables/useGoalManagement.new';

const {
  goalsInCurStatus,
  getGoalCountByStatus,
  startDeleteGoal,
  handleDeleteGoal,
  refreshGoals,
  goalDomainService
} = useGoalManagement();

// 删除目标
startDeleteGoal(goalId);
await handleDeleteGoal();

// 刷新数据
await refreshGoals();
```

## 数据流

### 创建目标的完整流程

1. **UI 组件** → 调用组合函数
2. **组合函数** → 调用领域应用服务
3. **领域应用服务** → 调用 IPC 客户端
4. **IPC 客户端** → 序列化数据并发送到主进程
5. **主进程 IPC 处理器** → 调用主进程应用服务
6. **主进程应用服务** → 验证数据、创建实体、持久化
7. **响应返回** → 主进程 → IPC → 领域应用服务
8. **状态同步** → 领域应用服务调用状态仓库更新前端状态
9. **UI 更新** → Pinia 状态变化触发组件重新渲染

### 数据序列化

所有跨进程传输的数据都经过 `deepSerializeForIpc` 处理：
- 移除 Proxy 对象
- 处理循环引用
- 保持对象结构完整
- 确保 JSON 可序列化

## 兼容性

### 向后兼容

1. **旧的 goalStore** 仍然存在，位于 `src/modules/Goal/stores/goalStore.ts`
2. **现有组件** 可以继续使用旧的接口
3. **渐进式迁移** 可以逐步替换为新架构

### 迁移路径

1. **测试新架构** 使用新的组合函数和服务
2. **验证功能** 确保所有业务逻辑正常工作
3. **更新组件** 逐步将组件迁移到新的架构
4. **移除旧代码** 完成迁移后清理旧的实现

## 测试

已创建的测试文件：
- `src/modules/Goal/application/services/__tests__/goalDomainApplicationService.test.ts`
- `src/modules/Goal/domain/entities/__tests__/entities.test.ts`
- `electron/modules/goal/application/__tests__/mainGoalApplicationService.test.ts`
- `src/modules/Goal/infrastructure/ipc/__tests__/goalIpcClient.test.ts`

这些测试覆盖了：
- 领域实体的业务逻辑
- 应用服务的协调逻辑
- IPC 通信的正确性
- 状态管理的一致性

## 性能优化

1. **批量操作** 支持批量创建、更新、删除
2. **延迟加载** 按需加载数据
3. **状态缓存** 避免重复的 IPC 调用
4. **深度序列化** 优化跨进程数据传输

## 错误处理

1. **分层错误处理** 每层都有相应的错误处理机制
2. **用户友好提示** 业务错误转换为用户可理解的消息
3. **降级策略** IPC 失败时的本地缓存机制
4. **日志记录** 完整的操作日志用于调试

## 下一步

1. **UI 组件更新** 将现有组件迁移到新架构
2. **完善测试** 添加集成测试和端到端测试
3. **性能测试** 验证大数据量下的性能表现
4. **文档完善** 补充 API 文档和使用示例

## 使用建议

1. **新功能开发** 直接使用新架构
2. **现有功能维护** 可以继续使用旧架构，但建议逐步迁移
3. **复杂业务逻辑** 使用领域应用服务封装
4. **简单状态操作** 直接使用新的 Pinia Store
5. **跨模块集成** 通过领域实体的 DTO 进行数据交换

这个重构为 Goal 模块提供了与 Task 模块一致的架构能力，支持复杂的业务需求，同时保持了良好的可维护性和可扩展性。
