# TaskMetaTemplate 聚合根重构总结

## 📋 重构概述

将 `TaskMetaTemplate` 从实体（Entity）提升为聚合根（Aggregate Root），与 `TaskTemplate`、`Goal`、`GoalDir` 等保持一致的架构模式。

## 🎯 重构目标

- ✅ 将 TaskMetaTemplate 继承 `AggregateRoot` 而非 `Entity`
- ✅ 移动文件位置从 `entities/` 到 `aggregates/` 目录
- ✅ 保持所有业务逻辑和属性不变
- ✅ 更新所有相关导出路径
- ✅ 确保零编译错误

## 📁 文件变更详情

### 1. **packages/domain-core**

#### 新增文件
```
packages/domain-core/src/task/aggregates/TaskMetaTemplate.ts
```
- 继承 `AggregateRoot` 替代 `Entity`
- 实现 `TaskContracts.ITaskMetaTemplate` 接口
- 包含所有共享属性和抽象方法

#### 删除文件
```
packages/domain-core/src/task/entities/TaskMetaTemplate.ts
```

#### 修改文件
```typescript
// packages/domain-core/src/task/index.ts
export * from './aggregates/TaskTemplate';
export * from './aggregates/TaskMetaTemplate';  // ✅ 从 entities 改为 aggregates
export * from './entities/TaskInstance';
```

### 2. **packages/domain-server**

#### 新增文件
```
packages/domain-server/src/task/aggregates/TaskMetaTemplate.ts
```
- 服务端聚合根实现
- 继承 `TaskMetaTemplateCore` from `@dailyuse/domain-core`
- 包含所有服务端业务方法

#### 删除文件
```
packages/domain-server/src/task/entities/TaskMetaTemplate.ts
```

#### 修改文件
```typescript
// packages/domain-server/src/task/index.ts
// Task 聚合根
export { TaskTemplate } from './aggregates/TaskTemplate';
export { TaskMetaTemplate } from './aggregates/TaskMetaTemplate';  // ✅ 从 entities 改为 aggregates

// Task 实体
export { TaskInstance } from './entities/TaskInstance';
```

```typescript
// packages/domain-server/src/index.ts
// Task domain exports
export * from './task/aggregates/TaskTemplate';
export * from './task/aggregates/TaskMetaTemplate';  // ✅ 从 entities 改为 aggregates
export * from './task/entities/TaskInstance';
export * from './task/repositories/iTaskRepository';
export * from './task/exceptions/TaskDomainException';
```

### 3. **packages/domain-client**

#### 无需修改
```typescript
// packages/domain-client/src/task/entities/TaskMetaTemplate.ts
import { TaskMetaTemplateCore } from '@dailyuse/domain-core';
// ✅ 导入路径自动通过包索引解析，无需修改
```

### 4. **apps/api, apps/web, apps/desktop**

#### 无需修改
- API、Web 和 Desktop 应用通过 `@dailyuse/domain-core` 和 `@dailyuse/domain-server` 包导入
- 包的导出路径已更新，应用层代码无需改动

## 🔍 核心变更对比

### 变更前
```typescript
// domain-core
import { Entity } from '@dailyuse/utils';
export abstract class TaskMetaTemplateCore extends Entity { ... }

// 文件位置
packages/domain-core/src/task/entities/TaskMetaTemplate.ts
packages/domain-server/src/task/entities/TaskMetaTemplate.ts
```

### 变更后
```typescript
// domain-core
import { AggregateRoot } from '@dailyuse/utils';
export abstract class TaskMetaTemplateCore extends AggregateRoot { ... }

// 文件位置
packages/domain-core/src/task/aggregates/TaskMetaTemplate.ts
packages/domain-server/src/task/aggregates/TaskMetaTemplate.ts
```

## 📊 架构一致性

重构后，Task 模块的聚合根结构与 Goal 模块完全一致：

| 模块 | 聚合根 | 位置 |
|------|--------|------|
| Task | TaskTemplate | `task/aggregates/` |
| Task | **TaskMetaTemplate** | `task/aggregates/` ✅ |
| Goal | Goal | `goal/aggregates/` |
| Goal | GoalDir | `goal/aggregates/` |

## ✅ 验证结果

### 编译检查
```bash
✅ packages/domain-core/src/task/aggregates/TaskMetaTemplate.ts - 0 errors
✅ packages/domain-server/src/task/aggregates/TaskMetaTemplate.ts - 0 errors
✅ packages/domain-client/src/task/entities/TaskMetaTemplate.ts - 0 errors
✅ packages/domain-core/src/task/index.ts - 0 errors
✅ packages/domain-server/src/task/index.ts - 0 errors
✅ packages/domain-server/src/index.ts - 0 errors
✅ packages/domain-client/src/task/index.ts - 0 errors
```

### 业务功能
- ✅ 所有属性保持不变
- ✅ 所有方法保持不变
- ✅ 接口实现保持不变
- ✅ 继承关系正确（AggregateRoot）
- ✅ 导出路径正确更新

## 🎯 业务影响

### 无破坏性变更
- ✅ 外部 API 接口不变
- ✅ DTO 结构不变
- ✅ 仓储接口不变
- ✅ 领域服务不变
- ✅ 应用层代码不变

### 架构优势
- ✅ 与其他模块架构一致
- ✅ 清晰的聚合根边界
- ✅ 更好的领域模型表达
- ✅ 符合 DDD 最佳实践

## 📝 注意事项

1. **继承层次**
   - `TaskMetaTemplateCore` (domain-core) extends `AggregateRoot`
   - `TaskMetaTemplate` (domain-server) extends `TaskMetaTemplateCore`
   - `TaskMetaTemplate` (domain-client) extends `TaskMetaTemplateCore`

2. **仓储模式**
   - `ITaskMetaTemplateRepository` 接口保持不变
   - 仓储操作的是聚合根，符合 DDD 原则

3. **事务边界**
   - TaskMetaTemplate 现在是事务边界
   - 增删改查操作以 TaskMetaTemplate 为单位

## 🚀 后续建议

1. **测试验证**
   - 运行单元测试确保业务逻辑正确
   - 运行集成测试确保仓储操作正常

2. **文档更新**
   - 更新架构文档反映聚合根变更
   - 更新开发文档说明模块结构

3. **代码审查**
   - 确认所有引用都通过包索引导入
   - 检查是否有硬编码的文件路径

## ✨ 总结

本次重构成功将 `TaskMetaTemplate` 提升为聚合根，与 `TaskTemplate`、`Goal`、`GoalDir` 等保持一致的架构模式。重构过程保持了所有业务功能不变，零编译错误，无破坏性变更，符合 DDD 最佳实践。

**重构日期**: 2025-10-03
**影响范围**: domain-core, domain-server, domain-client
**编译状态**: ✅ 全部通过
**测试状态**: ⏳ 待运行
