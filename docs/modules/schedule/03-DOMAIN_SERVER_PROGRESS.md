# Schedule 模块 Domain-Server 层实现进度

## ✅ 已完成

### 1. 目录结构
```
packages/domain-server/src/schedule/
├── value-objects/        ✅ 完成
├── entities/             ⏳ 进行中
├── aggregates/           ⏳ 待实现
├── services/             ⏳ 待实现
└── repositories/         ⏳ 待实现
```

### 2. 值对象（Value Objects）- ✅ 100% 完成

#### ✅ ScheduleConfig.ts
- **功能**: Cron 调度配置
- **关键方法**:
  - `calculateNextRun()`: 计算下次执行时间（TODO: 完整 cron 解析）
  - `isExpired()`: 检查是否过期
  - `with()`: 不可变更新
- **工厂方法**:
  - `createDefault()`: 默认配置（每天 9:00 AM）
  - `createOneTime()`: 单次执行配置

#### ✅ ExecutionInfo.ts
- **功能**: 执行信息追踪
- **关键方法**:
  - `updateAfterExecution()`: 执行后更新
  - `resetFailures()`: 重置失败计数
  - `with()`: 不可变更新
- **工厂方法**:
  - `createDefault()`: 默认执行信息

#### ✅ RetryPolicy.ts
- **功能**: 重试策略（指数退避）
- **关键方法**:
  - `shouldRetry()`: 判断是否应该重试
  - `calculateNextRetryDelay()`: 计算重试延迟
  - `with()`: 不可变更新
- **工厂方法**:
  - `createDefault()`: 默认策略（3次，5秒，2倍退避）
  - `createDisabled()`: 禁用重试

#### ✅ TaskMetadata.ts
- **功能**: 任务元数据
- **关键方法**:
  - `updatePayload()`: 更新业务数据
  - `addTag()` / `removeTag()`: 标签管理
  - `with()`: 不可变更新
- **工厂方法**:
  - `createDefault()`: 默认元数据

#### ✅ ModuleStatistics.ts
- **功能**: 模块统计
- **关键方法**:
  - `update()`: 更新统计（智能计算平均值）
  - `calculateSuccessRate()`: 计算成功率
  - `with()`: 不可变更新
- **工厂方法**:
  - `createDefault()`: 默认统计

---

## ⏳ 下一步工作

### 3. 实体（Entities）- ⏳ 进行中

#### ⏳ ScheduleExecution.ts
- **职责**: 单次执行记录
- **需要实现**:
  - 基础属性 getter
  - 业务方法: `markSuccess()`, `markFailed()`, `markTimeout()`, `markSkipped()`, `incrementRetry()`
  - 转换方法: `toServerDTO()`, `toPersistenceDTO()`
  - 静态工厂: `create()`, `fromServerDTO()`, `fromPersistenceDTO()`

### 4. 聚合根（Aggregate Roots）- ⏳ 待实现

#### ⏳ ScheduleTask.ts
- **职责**: 任务生命周期管理
- **需要实现**:
  - 子实体管理（ScheduleExecution 集合）
  - 生命周期方法: `pause()`, `resume()`, `complete()`, `cancel()`, `fail()`
  - 调度方法: `updateSchedule()`, `calculateNextRun()`, `recordExecution()`
  - 元数据方法: `updateMetadata()`, `addTag()`, `removeTag()`
  - 转换方法: `toServerDTO()`, `toPersistenceDTO()`
  - 静态工厂: `create()`, `fromServerDTO()`, `fromPersistenceDTO()`
  - 领域事件发布

#### ⏳ ScheduleStatistics.ts
- **职责**: 系统统计管理
- **需要实现**:
  - 任务计数方法: `incrementTaskCount()`, `decrementTaskCount()`, `updateTaskStatus()`
  - 执行统计方法: `recordExecution()`, `updateExecutionStats()`
  - 模块统计方法: `updateModuleStats()`, `getModuleStats()`, `getAllModuleStats()`
  - 计算方法: `calculateSuccessRate()`, `calculateFailureRate()`
  - 转换方法: `toServerDTO()`, `toPersistenceDTO()`
  - 静态工厂: `create()`, `fromServerDTO()`, `fromPersistenceDTO()`

### 5. 领域服务（Domain Services）- ⏳ 待实现

#### ⏳ ScheduleDomainService.ts
- **职责**: 跨聚合根的业务逻辑
- **需要实现**:
  - 任务调度逻辑
  - 执行触发逻辑
  - 重试逻辑
  - 统计更新逻辑

#### ⏳ ScheduleStatisticsDomainService.ts
- **职责**: 统计计算和更新
- **需要实现**:
  - 统计数据聚合
  - 模块统计更新
  - 性能指标计算

### 6. 仓储接口（Repository Interfaces）- ⏳ 待实现

#### ⏳ IScheduleTaskRepository.ts
- **方法**:
  - `findById()`
  - `findBySourceEntity()`
  - `findActive()`
  - `save()`
  - `delete()`
  - `findExpired()`
  - `findByNextRunTime()`

#### ⏳ IScheduleStatisticsRepository.ts
- **方法**:
  - `findByAccountUuid()`
  - `save()`
  - `create()`

---

## 📝 设计决策

### 类型定义策略
**问题**: Contracts 层使用 Date 类型，但设计文档要求 number (epoch ms)

**临时方案**: 
- Domain-Server 层暂时使用本地类型定义
- 使用 number (epoch ms) 表示时间戳
- 后续统一调整 Contracts 层

### Cron 解析策略
**问题**: cron-parser 库导入问题

**临时方案**:
- `calculateNextRun()` 使用占位实现（+1小时）
- TODO: 完整实现需要正确集成 cron-parser

### 不可变性实现
**已实现**:
- 所有值对象使用 `Object.freeze()`
- 提供 `with()` 方法创建新实例
- 继承 `ValueObject` 基类

---

## 🎯 实现优先级

1. **高优先级**:
   - ✅ 值对象（已完成）
   - ⏳ ScheduleExecution 实体
   - ⏳ ScheduleTask 聚合根
   - ⏳ 仓储接口

2. **中优先级**:
   - ⏳ ScheduleStatistics 聚合根
   - ⏳ 领域服务

3. **低优先级**:
   - 完善 cron 解析
   - 统一 Contracts 时间戳类型
   - 事件发布机制

---

## 📊 完成度统计

- **值对象**: 5/5 (100%) ✅
- **实体**: 0/1 (0%) ⏳
- **聚合根**: 0/2 (0%) ⏳
- **领域服务**: 0/2 (0%) ⏳
- **仓储接口**: 0/2 (0%) ⏳

**总体进度**: ~20% ⏳

---

## 🔄 参考模式

严格遵循 Repository 模块的实现模式：

1. **值对象**: extends ValueObject + 不可变 + equals/with方法
2. **实体**: extends Entity + 私有字段 + getter + 业务方法
3. **聚合根**: extends AggregateRoot + 子实体管理 + 事件发布
4. **仓储接口**: interface + Promise返回值 + 领域对象参数

---

**更新时间**: 2025-10-12  
**实现者**: GitHub Copilot  
**状态**: Domain-Server 值对象层完成，实体层进行中
