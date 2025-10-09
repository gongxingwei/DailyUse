# Task 模块重构计划

**创建时间**: 2025-10-03  
**参考模块**: Goal 模块  
**目标**: 按照 DDD + Contract First 架构重构 Task 模块

---

## 📋 重构范围

Task 模块包含三个核心实体：
1. **TaskMetaTemplate** (元模板) - 任务类别模板（如"晨练"、"阅读"）
2. **TaskTemplate** (任务模板) - 具体任务配置（调度、时间、提醒）
3. **TaskInstance** (任务实例) - 实际执行的任务

---

## 🎯 重构目标

### 1. Contract First
- ✅ 已有基础类型定义 (`types.ts`, `dtos.ts`)
- 🔄 需要添加 `enums.ts`, `persistence-dtos.ts`
- 🔄 需要完善请求/响应 DTO

### 2. DDD 分层
```
Task 模块
├── Contracts (类型定义)
├── Domain-Core (抽象层 - 可选)
├── Domain-Server (服务端领域层)
│   ├── Entities (TaskTemplate, TaskInstance, TaskMetaTemplate)
│   ├── Services (TaskDomainService)
│   └── Repositories (ITaskRepository)
├── Domain-Client (客户端领域层)
│   ├── Services (TaskDomainService)
│   └── Stores (Pinia)
├── API (服务端应用层)
│   ├── Application Services
│   ├── Controllers
│   ├── Prisma Repositories
│   └── Routes
└── Web (前端表现层)
    ├── Stores (Pinia)
    ├── Composables
    ├── API Clients
    └── Components
```

### 3. 使用项目工具
- [[日志系统|日志系统]]
- [[API响应系统|API响应系统]]
- [[事件总线系统|事件总线系统]]
- [[校验系统|校验系统]]

---

## 📁 文件清单

### Contracts 层 (`packages/contracts/src/modules/task/`)

| 文件 | 状态 | 说明 |
|------|------|------|
| `types.ts` | ✅ 已有 | 实体接口、时间配置、查询参数 |
| `enums.ts` | 🆕 需创建 | 枚举类型（状态、时间类型等）|
| `dtos.ts` | 🔄 需完善 | 请求/响应 DTO、客户端 DTO |
| `persistence-dtos.ts` | 🆕 需创建 | 数据库持久化 DTO |
| `events.ts` | ✅ 已有 | 事件定义 |
| `index.ts` | 🔄 需更新 | 统一导出 |

### Domain-Server 层 (`packages/domain-server/src/task/`)

| 文件 | 状态 | 说明 |
|------|------|------|
| `entities/TaskMetaTemplate.ts` | 🆕 需创建 | 元模板实体 |
| `entities/TaskTemplate.ts` | 🆕 需创建 | 任务模板实体 |
| `entities/TaskInstance.ts` | 🆕 需创建 | 任务实例实体 |
| `services/TaskDomainService.ts` | 🆕 需创建 | 领域服务 |
| `repositories/ITaskRepository.ts` | 🆕 需创建 | 仓储接口 |
| `index.ts` | 🆕 需创建 | 导出 |

### API 层 (`apps/api/src/modules/task/`)

| 文件 | 状态 | 说明 |
|------|------|------|
| `application/services/TaskApplicationService.ts` | 🆕 需创建 | 应用服务 |
| `domain/services/TaskDomainService.ts` | 🆕 需创建 | API 领域服务 |
| `infrastructure/repositories/PrismaTaskRepository.ts` | 🔄 需重构 | Prisma 仓储实现 |
| `interface/controllers/TaskController.ts` | 🆕 需创建 | HTTP 控制器 |
| `interface/routes/taskRoutes.ts` | 🆕 需创建 | 路由定义 |
| `infrastructure/di/TaskContainer.ts` | 🆕 需创建 | 依赖注入容器 |

### Web 层 (`apps/web/src/modules/task/`)

| 文件 | 状态 | 说明 |
|------|------|------|
| `presentation/stores/taskStore.ts` | 🆕 需创建 | Pinia Store |
| `presentation/composables/useTask.ts` | 🆕 需创建 | Vue Composable |
| `infrastructure/api/taskApiClient.ts` | 🆕 需创建 | API 客户端 |
| `application/services/TaskWebApplicationService.ts` | 🆕 需创建 | 应用服务 |
| `domain/services/TaskDomainService.ts` | 🆕 需创建 | Web 领域服务 |
| `presentation/components/` | 🔄 待完善 | UI 组件 |

---

## 🔄 重构步骤

### 阶段 1: Contracts 层 ✅

**优先级**: 🔥 最高

**任务**:
1. ✅ 检查现有 `types.ts` (已有完整接口定义)
2. 🆕 创建 `enums.ts` - 提取所有枚举类型
3. 🔄 完善 `dtos.ts` - 添加请求/响应/客户端 DTO
4. 🆕 创建 `persistence-dtos.ts` - 数据库持久化 DTO
5. 🔄 更新 `index.ts` - 统一导出

**关键点**:
- 参考 `Goal` 模块的 DTO 设计
- 区分 DTO (服务端) 和 ClientDTO (客户端)
- 区分 DTO (传输) 和 PersistenceDTO (持久化)

### 阶段 2: Domain-Server 层

**优先级**: 🔥 高

**任务**:
1. 创建实体类 (TaskMetaTemplate, TaskTemplate, TaskInstance)
2. 创建领域服务 (TaskDomainService)
3. 创建仓储接口 (ITaskRepository)
4. 实现业务逻辑和验证

**关键点**:
- 实体包含业务逻辑方法
- 领域服务处理跨实体业务
- 仓储接口定义数据访问契约

### 阶段 3: API 层

**优先级**: 🔥 高

**任务**:
1. 创建 TaskApplicationService (协调层)
2. 创建 TaskDomainService (领域服务)
3. 重构 PrismaTaskRepository (实现仓储接口)
4. 创建 TaskController (HTTP 处理)
5. 创建路由定义
6. 集成日志系统、响应系统

**关键点**:
- Controller 使用 Response 辅助类
- 所有操作记录日志
- 错误分类处理
- 使用 JWT 提取 accountUuid

### 阶段 4: Web 层

**优先级**: 🔥 中

**任务**:
1. 创建 taskStore (Pinia)
2. 创建 API 客户端
3. 创建应用服务 (协调层)
4. 创建领域服务 (状态转换)
5. 创建 Composables
6. 实现乐观更新

**关键点**:
- 支持乐观更新和回滚
- 使用事件总线监听用户登录
- 合理的错误提示

### 阶段 5: 文档

**优先级**: 📝 中

**任务**:
1. 创建 `Task模块完整流程.md`
2. 更新 `README.md` 索引
3. 创建重构总结文档

---

## 📊 复杂度分析

### 实体关系

```
TaskMetaTemplate (元模板)
    ↓ 1:N
TaskTemplate (任务模板)
    ↓ 1:N
TaskInstance (任务实例)
```

### 核心流程

#### 1. 创建任务模板
```
用户填写表单
  ↓
选择元模板 (可选)
  ↓
配置时间、提醒
  ↓
创建 TaskTemplate
  ↓
自动生成第一批 TaskInstance
```

#### 2. 任务实例生命周期
```
生成 (pending)
  ↓
提醒触发
  ↓
开始执行 (inProgress)
  ↓
完成 (completed) / 取消 (cancelled)
```

#### 3. 定时调度
```
定时任务
  ↓
检查 TaskTemplate 的调度配置
  ↓
生成新的 TaskInstance
  ↓
设置提醒
```

---

## 🎯 关键设计点

### 1. 时间配置设计

**问题**: Task 的时间配置非常复杂（全天、指定时间、时间范围、单次、每日、每周...）

**解决方案**:
```typescript
// 分离模板配置和实例配置
TaskTemplate.timeConfig // 调度规则
TaskInstance.timeConfig // 具体时间
```

### 2. 提醒系统集成

**问题**: 提醒需要和 Schedule/Reminder 模块集成

**解决方案**:
- TaskTemplate 定义提醒规则
- TaskInstance 存储提醒状态
- 通过事件总线触发提醒

### 3. 目标关联

**问题**: Task 可以关联 Goal 的 KeyResult

**解决方案**:
```typescript
interface KeyResultLink {
  goalUuid: string;
  keyResultId: string;
  incrementValue: number; // 完成任务增加的进度值
}
```

### 4. 状态机设计

**TaskTemplate 状态**:
- draft → active → paused → completed / archived

**TaskInstance 状态**:
- pending → inProgress → completed / cancelled / overdue

---

## 🔧 技术难点

### 1. 定时任务生成
- 需要后台定时任务扫描 TaskTemplate
- 根据调度规则生成 TaskInstance
- 考虑时区问题

### 2. 提醒触发
- 提前 N 分钟提醒
- 多种提醒方式（通知、声音、邮件）
- 稍后提醒 (Snooze)

### 3. 批量操作
- 批量完成任务
- 批量取消任务
- 批量重新调度

### 4. 性能优化
- TaskInstance 数量可能很大
- 需要分页、索引
- 过期任务归档

---

## 📦 依赖关系

```
Task 模块依赖：
├── @dailyuse/contracts (类型定义)
├── @dailyuse/utils (日志、校验、UUID)
├── Goal 模块 (关联 KeyResult)
├── Schedule 模块 (提醒功能)
└── Account 模块 (用户认证)
```

---

## ⚠️ 注意事项

### 1. 数据库设计
- TaskTemplate 和 TaskInstance 可能需要不同的表
- 考虑软删除
- 添加索引 (accountUuid, scheduledDate, status)

### 2. 时区处理
- 所有时间存储 UTC
- 前端显示根据用户时区转换
- 调度时考虑夏令时

### 3. 性能考虑
- TaskInstance 可能有数万条记录
- 查询需要合理分页
- 考虑归档旧数据

### 4. 兼容性
- 需要考虑现有数据迁移
- API 向后兼容

---

## 📅 时间估算

| 阶段 | 预估时间 | 优先级 |
|------|---------|--------|
| Contracts 层 | 2-3 小时 | 🔥 最高 |
| Domain-Server 层 | 4-6 小时 | 🔥 高 |
| API 层 | 6-8 小时 | 🔥 高 |
| Web 层 | 6-8 小时 | 🔥 中 |
| 测试 | 4-6 小时 | 📝 中 |
| 文档 | 2-3 小时 | 📝 中 |
| **总计** | **24-34 小时** | - |

---

## 🚀 快速开始

### 步骤 1: 阅读参考文档
- [[Goal模块完整流程|Goal模块完整流程]] ⭐⭐⭐⭐⭐
- [[contracts-in-goal|Contracts 设计]]
- [[日志系统|日志系统]]
- [[API响应系统|API响应系统]]

### 步骤 2: 从 Contracts 开始
```bash
cd packages/contracts/src/modules/task
# 创建 enums.ts
# 完善 dtos.ts
# 创建 persistence-dtos.ts
```

### 步骤 3: 实现 Domain 层
```bash
cd packages/domain-server/src/task
# 创建实体、服务、仓储接口
```

### 步骤 4: 实现 API 层
```bash
cd apps/api/src/modules/task
# 创建控制器、应用服务、仓储实现
```

### 步骤 5: 实现 Web 层
```bash
cd apps/web/src/modules/task
# 创建 Store、API Client、Composables
```

---

## 📖 相关文档

- [[Goal模块完整流程|Goal模块完整流程]]
- [[GOAL_AGGREGATE_SERVICE_REFACTORING|Goal聚合服务重构]]
- [[DOCUMENTATION_CLEANUP_SUMMARY|文档清理总结]]

---

**下一步**: 开始重构 Contracts 层
