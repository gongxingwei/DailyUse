# Schedule 模块 API 层迁移计划

## 当前状态

### Domain-Server 层
- ✅ **已完成**：ScheduleTask、ScheduleStatistics 聚合根
- ✅ **已完成**：ScheduleExecution 实体
- ✅ **已完成**：所有值对象（ScheduleConfig, ExecutionInfo, RetryPolicy, TaskMetadata）
- ✅ **已完成**：领域服务（ScheduleDomainService, ScheduleStatisticsDomainService）
- ✅ **已完成**：仓储接口定义（IScheduleTaskRepository, IScheduleStatisticsRepository）
- ✅ **类型检查**：100% 通过

### API 层
- ❌ **未完成**：Infrastructure Repository 实现
- ❌ **未完成**：Application Service
- ❌ **未完成**：HTTP Controllers
- ❌ **未完成**：HTTP Routes
- ❌ **阻塞问题**：Prisma Schema 与 Domain Model 不匹配

---

## 问题分析

### 1. Prisma Schema 不匹配

**当前 `ScheduleTask` 表结构**：
```prisma
model ScheduleTask {
  uuid             String    @id
  name             String
  description      String?
  cronExpression   String    // ❌ 应该在 config.schedule 中
  status           String
  enabled          Boolean
  sourceModule     String
  sourceEntityId   String
  metadata         String    // ✅ JSON
  nextRunAt        DateTime? // ❌ 应该在 executionInfo 中
  lastRunAt        DateTime? // ❌ 应该在 executionInfo 中
  executionCount   Int       // ❌ 应该在 executionInfo 中
  executionHistory String    // ❌ 应该是独立的 ScheduleExecution 表
  // ❌ 缺少 accountUuid
  // ❌ 缺少 config (JSON)
  // ❌ 缺少 executionInfo (JSON)
  // ❌ 缺少 retryPolicy (JSON)
  // ❌ 缺少 executions 关系
}
```

**期望的 DDD Schema**：
```prisma
model ScheduleTask {
  uuid          String    @id
  accountUuid   String    // ✅ 新增：账户关联
  name          String
  description   String?
  sourceModule  String
  sourceEntityId String
  status        String
  enabled       Boolean
  
  // ✅ 新增：DDD 值对象 JSON 字段
  config        Json      // { schedule: ScheduleConfig }
  executionInfo Json      // ExecutionInfo 值对象
  retryPolicy   Json      // RetryPolicy 值对象
  metadata      Json      // TaskMetadata 值对象
  
  createdAt     DateTime
  updatedAt     DateTime
  
  // ✅ 新增：关系
  executions    ScheduleExecution[]
  account       Account   @relation(fields: [accountUuid], references: [uuid])
}
```

### 2. ScheduleStatistics 表缺失

**需要创建**：
```prisma
model ScheduleStatistics {
  id          Int    @id @default(autoincrement())
  accountUuid String @unique
  
  // 任务统计（按状态）
  totalTasks      Int @default(0)
  activeTasks     Int @default(0)
  pausedTasks     Int @default(0)
  completedTasks  Int @default(0)
  cancelledTasks  Int @default(0)
  failedTasks     Int @default(0)
  
  // 执行统计（按结果）
  totalExecutions    Int @default(0)
  successExecutions  Int @default(0)
  failedExecutions   Int @default(0)
  skippedExecutions  Int @default(0)
  timeoutExecutions  Int @default(0)
  
  // 模块统计 (JSON)
  moduleStats Json @default("{}")
  
  // 时间戳
  lastUpdatedAt DateTime
  createdAt     DateTime @default(now())
  
  // Relations
  account Account @relation(fields: [accountUuid], references: [uuid])
  
  @@index([accountUuid])
  @@map("schedule_statistics")
}
```

### 3. ScheduleExecution 关系问题

**当前**：
```prisma
model ScheduleExecution {
  // ...
  task OldScheduleTask @relation(...) // ❌ 引用旧模型
}
```

**需要修改为**：
```prisma
model ScheduleExecution {
  // ...
  task ScheduleTask @relation(fields: [taskUuid], references: [uuid])
}
```

---

## 迁移策略

### 方案 A：完整迁移（推荐）

**优点**：
- 完全符合 DDD 设计
- 类型安全
- 易于维护

**缺点**：
- 需要数据迁移
- 可能破坏现有功能

**步骤**：
1. 创建新的 Prisma schema
2. 生成迁移文件
3. 编写数据迁移脚本（从旧表迁移到新表）
4. 实现 PrismaScheduleTaskRepository
5. 实现 PrismaScheduleStatisticsRepository
6. 测试所有功能

### 方案 B：适配现有 Schema（临时方案）

**优点**：
- 不修改数据库
- 快速实现

**缺点**：
- 映射层复杂
- 丢失部分 DDD 特性
- 技术债务

**步骤**：
1. 在 Repository 层做字段映射
2. 手动解析 JSON 字段
3. 模拟缺失的关系
4. 添加大量转换逻辑

### 方案 C：渐进式迁移

**优点**：
- 平滑过渡
- 降低风险

**缺点**：
- 需要维护两套代码

**步骤**：
1. 新增字段，保留旧字段
2. 双写（写入新旧字段）
3. 逐步迁移数据
4. 验证新逻辑
5. 删除旧字段

---

## 推荐方案

**选择方案 A：完整迁移**

**理由**：
1. Schedule 模块尚未正式使用，数据迁移风险低
2. DDD 架构带来的长期收益大于短期成本
3. 现在是最佳迁移时机

---

## 执行计划

### Phase 1: Schema 设计与迁移 (2-3 hours)

- [ ] 1.1 更新 `schema.prisma` - ScheduleTask 表
  - 添加 `accountUuid` 字段
  - 添加 `config` JSON 字段
  - 添加 `executionInfo` JSON 字段
  - 添加 `retryPolicy` JSON 字段
  - 移除冗余字段（cronExpression, nextRunAt, lastRunAt, executionCount）
  
- [ ] 1.2 创建 `ScheduleStatistics` 表
  - 参考 RepositoryStatistics 结构
  - 添加任务统计字段
  - 添加执行统计字段
  - 添加模块统计字段（JSON）
  
- [ ] 1.3 修复 `ScheduleExecution` 关系
  - 更新 `task` 关系指向新的 `ScheduleTask`
  - 添加必要的索引
  
- [ ] 1.4 生成 Prisma 迁移
  ```bash
  pnpm prisma migrate dev --name schedule_ddd_migration
  ```
  
- [ ] 1.5 验证迁移
  ```bash
  pnpm prisma migrate status
  pnpm prisma generate
  ```

### Phase 2: Infrastructure 层实现 (3-4 hours)

- [ ] 2.1 实现 `PrismaScheduleTaskRepository`
  - 参考 `PrismaRepositoryAggregateRepository`
  - 实现所有 CRUD 方法
  - 实现查询方法
  - 实现事务支持
  - 正确映射 JSON 字段
  - 加载子实体（ScheduleExecution）
  
- [ ] 2.2 实现 `PrismaScheduleStatisticsRepository`
  - 参考 `PrismaRepositoryStatisticsRepository`
  - 实现 UPSERT 逻辑
  - 实现 getOrCreate 方法
  
- [ ] 2.3 创建 `ScheduleContainer` (DI)
  - 参考 `RepositoryContainer`
  - 注册 repositories
  - 注册 domain services
  - 注册 application services

### Phase 3: Application 层实现 (2-3 hours)

- [ ] 3.1 实现 `ScheduleApplicationService`
  - 参考 `RepositoryApplicationService`
  - 创建任务（createScheduleTask）
  - 查询任务（getScheduleTask, getScheduleTasksByAccount）
  - 更新任务（updateScheduleTask, pauseTask, resumeTask）
  - 删除任务（deleteScheduleTask）
  - 执行任务（executeScheduleTask）
  
- [ ] 3.2 实现 `ScheduleStatisticsApplicationService`
  - 参考 `RepositoryStatisticsApplicationService`
  - 获取统计（getStatistics）
  - 重置统计（resetStatistics）
  - 获取模块统计（getModuleStatistics）

### Phase 4: Interface 层实现 (3-4 hours)

- [ ] 4.1 实现 `ScheduleTaskController`
  - POST /api/schedule/tasks - 创建任务
  - GET /api/schedule/tasks/:uuid - 获取任务详情
  - GET /api/schedule/tasks - 查询任务列表
  - PATCH /api/schedule/tasks/:uuid - 更新任务
  - DELETE /api/schedule/tasks/:uuid - 删除任务
  - POST /api/schedule/tasks/:uuid/pause - 暂停任务
  - POST /api/schedule/tasks/:uuid/resume - 恢复任务
  - POST /api/schedule/tasks/:uuid/execute - 手动执行任务
  
- [ ] 4.2 实现 `ScheduleStatisticsController`
  - GET /api/schedule/statistics/:accountUuid - 获取统计
  - GET /api/schedule/statistics/:accountUuid/modules - 获取模块统计
  - POST /api/schedule/statistics/:accountUuid/reset - 重置统计
  
- [ ] 4.3 创建路由配置
  - 参考 `repository/routes/index.ts`
  - 注册所有路由
  - 添加中间件（认证、验证）
  
- [ ] 4.4 注册到主应用
  - 在 `apps/api/src/app.ts` 中注册 schedule 路由

### Phase 5: 测试与验证 (2-3 hours)

- [ ] 5.1 单元测试
  - Repository 层测试
  - Application Service 测试
  - Controller 测试
  
- [ ] 5.2 集成测试
  - E2E API 测试
  - 数据库集成测试
  
- [ ] 5.3 类型检查
  ```bash
  pnpm nx run api:typecheck
  ```
  
- [ ] 5.4 代码审查
  - 与 Repository 模块对比
  - 确保架构一致性

---

## 预计总时间

**12-17 hours**（1.5-2 个工作日）

---

## 下一步

**立即执行 Phase 1.1**：更新 ScheduleTask 的 Prisma schema

```prisma
model ScheduleTask {
  uuid            String    @id @default(cuid())
  accountUuid     String    @map("account_uuid")
  name            String
  description     String?
  sourceModule    String    @map("source_module")
  sourceEntityId  String    @map("source_entity_id")
  status          String    @default("active")
  enabled         Boolean   @default(true)
  
  // DDD 值对象 JSON 字段
  config          Json      @default("{}")      // { schedule: ScheduleConfig }
  executionInfo   Json      @default("{}") @map("execution_info") // ExecutionInfo
  retryPolicy     Json      @default("{}") @map("retry_policy")  // RetryPolicy
  metadata        Json      @default("{}")      // TaskMetadata
  
  // 时间戳
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  // 关系
  executions      ScheduleExecution[]
  account         Account   @relation(fields: [accountUuid], references: [uuid], onDelete: Cascade)
  
  @@index([accountUuid])
  @@index([sourceModule, sourceEntityId])
  @@index([status])
  @@index([enabled])
  @@map("schedule_tasks")
}
```

**是否继续执行迁移？**
