# FocusSession ApplicationService 实现总结

## 概述

实现了 `FocusSessionApplicationService` - FocusSession 模块的应用服务层，负责协调领域服务和仓储，处理专注周期的业务用例编排。

## 文件位置

- **应用服务**: `apps/api/src/modules/goal/application/services/FocusSessionApplicationService.ts` (~400 lines)
- **DI 容器**: `apps/api/src/modules/goal/infrastructure/di/GoalContainer.ts` (已更新)

## DDD 分层职责

### ApplicationService 的职责

根据 `fullstack.prompt.md` 规范，ApplicationService 负责：

1. **用例编排** - 按照 Query → Domain → Persist 模式协调业务流程
2. **调用 DomainService** - 委托纯业务逻辑给领域服务
3. **调用 Repository** - 执行查询和持久化操作
4. **事务管理** - 协调多个仓储操作（如需要）
5. **DTO 转换** - 将领域模型转换为客户端 DTO
6. **发布领域事件** - 在用例完成后发布事件（待实现）

### 与 DomainService 的协作模式

```
ApplicationService                  DomainService                   Aggregate
      │                                  │                              │
      │──1. Query existing sessions────>│                              │
      │<──sessions[]─────────────────────│                              │
      │                                  │                              │
      │──2. Validate single active──────>│                              │
      │                                  │──validateSingleActiveSession()
      │<──ValidationResult───────────────│                              │
      │                                  │                              │
      │──3. Query associated goal───────>Repository                     │
      │<──goal or null───────────────────│                              │
      │                                  │                              │
      │──4. Create session───────────────>│                              │
      │                                  │──createFocusSession()───────>│
      │                                  │                          creates new
      │                                  │<──FocusSession aggregate─────│
      │<──session aggregate──────────────│                              │
      │                                  │                              │
      │──5. Start session────────────────────────────────────────────>│
      │                                                            session.start()
      │<──domain events──────────────────────────────────────────────│
      │                                  │                              │
      │──6. Persist──────────────────────>Repository                   │
      │<──saved──────────────────────────│                              │
      │                                  │                              │
      │──7. Publish events (future)─────>EventBus                      │
      │                                  │                              │
      │──8. Return ClientDTO─────────────────────────────────────────>│
      │                                                        toClientDTO()
      │<──ClientDTO──────────────────────────────────────────────────│
```

## 实现的方法

### 核心业务方法（9 个）

#### 1. `createAndStartSession(accountUuid, request)`

创建并开始新的专注周期。

**业务流程**：
```typescript
// 1. 查询已有活跃会话（验证单个活跃会话规则）
const existingSessions = await this.sessionRepository.findByAccountUuid(accountUuid, {
  status: [IN_PROGRESS, PAUSED],
});
this.domainService.validateSingleActiveSession(existingSessions, accountUuid);

// 2. 查询关联目标（如果指定）
let goal = null;
if (request.goalUuid) {
  goal = await this.goalRepository.findById(request.goalUuid);
  this.domainService.validateAssociatedGoal(goal, accountUuid);
}

// 3. 调用 DomainService 创建聚合根
const session = this.domainService.createFocusSession({
  accountUuid,
  goalUuid: request.goalUuid,
  durationMinutes: request.durationMinutes,
  description: request.description,
}, goal);

// 4. 立即开始（如果指定）
if (request.startImmediately !== false) {
  session.start();
}

// 5. 持久化
await this.sessionRepository.save(session);

// 6. 返回 ClientDTO
return session.toClientDTO();
```

**参数**：
- `accountUuid: string` - 账户 UUID
- `request.goalUuid?: string | null` - 关联目标 UUID（可选）
- `request.durationMinutes: number` - 计划时长（1-240 分钟）
- `request.description?: string | null` - 描述（可选）
- `request.startImmediately?: boolean` - 是否立即开始（默认 true）

**返回**: `FocusSessionClientDTO`

#### 2. `pauseSession(sessionUuid, accountUuid)`

暂停正在进行的专注周期。

**业务流程**：
- 验证状态转换（必须是 IN_PROGRESS）
- 调用聚合根的 `pause()` 方法
- 记录暂停时间和暂停次数

**返回**: `FocusSessionClientDTO`

#### 3. `resumeSession(sessionUuid, accountUuid)`

恢复已暂停的专注周期。

**业务流程**：
- 验证状态转换（必须是 PAUSED）
- 调用聚合根的 `resume()` 方法
- 累加暂停时长

**返回**: `FocusSessionClientDTO`

#### 4. `completeSession(sessionUuid, accountUuid)`

完成专注周期。

**业务流程**：
- 验证状态转换（必须是 IN_PROGRESS 或 PAUSED）
- 调用聚合根的 `complete()` 方法
- 计算实际专注时长（总时长 - 暂停时长）

**返回**: `FocusSessionClientDTO`

#### 5. `cancelSession(sessionUuid, accountUuid)`

取消专注周期。

**业务流程**：
- 验证状态转换（不能是 COMPLETED 或 CANCELLED）
- 调用聚合根的 `cancel()` 方法

**返回**: `void`

#### 6. `getActiveSession(accountUuid)`

获取用户当前的活跃会话。

**业务流程**：
- 查询 IN_PROGRESS 或 PAUSED 状态的会话
- 返回 ClientDTO 或 null

**返回**: `FocusSessionClientDTO | null`

#### 7. `getSessionHistory(accountUuid, filters?)`

获取会话历史记录。

**参数**：
```typescript
{
  goalUuid?: string;                      // 筛选关联目标
  status?: FocusSessionStatus[];          // 筛选状态
  limit?: number;                         // 分页大小（默认 50）
  offset?: number;                        // 分页偏移（默认 0）
  orderBy?: 'createdAt' | 'startedAt' | 'completedAt';  // 排序字段
  orderDirection?: 'asc' | 'desc';        // 排序方向（默认 desc）
}
```

**返回**: `FocusSessionClientDTO[]`

#### 8. `getSession(sessionUuid, accountUuid)`

获取单个会话详情。

**业务流程**：
- 加载会话
- 验证所有权
- 返回 ClientDTO

**返回**: `FocusSessionClientDTO`

#### 9. `deleteSession(sessionUuid, accountUuid)`

删除会话。

**业务规则**：只能删除已完成或已取消的会话

**业务流程**：
- 加载会话
- 验证所有权
- 验证是否可以删除（通过 DomainService）
- 物理删除

**返回**: `void`

#### 10. `getSessionStatistics(accountUuid, options?)`

获取会话统计信息。

**参数**：
```typescript
{
  startDate?: number;   // Unix 时间戳（毫秒）
  endDate?: number;     // Unix 时间戳（毫秒）
  goalUuid?: string;    // 筛选特定目标
}
```

**返回**：
```typescript
{
  totalSessions: number;        // 总会话数
  completedSessions: number;    // 已完成会话数
  cancelledSessions: number;    // 已取消会话数
  totalFocusMinutes: number;    // 总专注时长
  totalPauseMinutes: number;    // 总暂停时长
  averageFocusMinutes: number;  // 平均专注时长
  completionRate: number;       // 完成率（0-1）
}
```

### 辅助方法（1 个）

#### `executeSessionAction(sessionUuid, accountUuid, action)`

**私有模板方法**，实现 DRY 原则。

**职责**：
- 加载会话
- 验证所有权
- 执行操作（由调用方提供回调）
- 持久化
- 发布事件（未来）
- 返回 ClientDTO

**使用示例**：
```typescript
async pauseSession(sessionUuid: string, accountUuid: string) {
  return this.executeSessionAction(sessionUuid, accountUuid, (session) => {
    this.domainService.validateStateTransition(session.status, 'pause');
    session.pause();
  });
}
```

## 依赖注入模式

### 单例 + 依赖注入

```typescript
export class FocusSessionApplicationService {
  private static instance: FocusSessionApplicationService;
  private domainService: FocusSessionDomainService;
  private sessionRepository: IFocusSessionRepository;
  private goalRepository: IGoalRepository;

  private constructor(
    sessionRepository: IFocusSessionRepository,
    goalRepository: IGoalRepository,
  ) {
    this.domainService = new FocusSessionDomainService(); // 无参数
    this.sessionRepository = sessionRepository;
    this.goalRepository = goalRepository;
  }

  static async createInstance(
    sessionRepository?: IFocusSessionRepository,
    goalRepository?: IGoalRepository,
  ): Promise<FocusSessionApplicationService> {
    const container = GoalContainer.getInstance();
    const sessionRepo = sessionRepository || container.getFocusSessionRepository();
    const goalRepo = goalRepository || container.getGoalRepository();

    FocusSessionApplicationService.instance = new FocusSessionApplicationService(
      sessionRepo,
      goalRepo,
    );
    return FocusSessionApplicationService.instance;
  }

  static async getInstance(): Promise<FocusSessionApplicationService> {
    if (!FocusSessionApplicationService.instance) {
      FocusSessionApplicationService.instance =
        await FocusSessionApplicationService.createInstance();
    }
    return FocusSessionApplicationService.instance;
  }
}
```

### GoalContainer 更新

**新增方法**：

```typescript
// 获取专注周期仓储实例（懒加载）
getFocusSessionRepository(): IFocusSessionRepository {
  if (!this.focusSessionRepository) {
    // TODO: 取消注释以下代码，当数据库迁移完成后
    // this.focusSessionRepository = new PrismaFocusSessionRepository(prisma);
    throw new Error(
      'FocusSession repository not yet implemented. Database migration required.',
    );
  }
  return this.focusSessionRepository;
}

// 设置专注周期仓储实例（用于测试）
setFocusSessionRepository(repository: IFocusSessionRepository): void {
  this.focusSessionRepository = repository;
}
```

**使用场景**：

1. **生产环境**：自动从 GoalContainer 获取 Repository
   ```typescript
   const service = await FocusSessionApplicationService.getInstance();
   ```

2. **测试环境**：注入 Mock Repository
   ```typescript
   const mockRepo = new MockFocusSessionRepository();
   const service = await FocusSessionApplicationService.createInstance(mockRepo);
   ```

## DDD 最佳实践

### 1. 清晰的职责分离

```
┌─────────────────────────────────────────────────────────────┐
│ FocusSessionApplicationService (编排层)                      │
│ - Query → Domain → Persist → DTO                           │
│ - 管理事务和依赖                                              │
│ - 发布领域事件                                                │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
┌────────────────┐  ┌──────────────┐
│ DomainService  │  │ Repository   │
│ (纯业务逻辑)     │  │ (持久化接口)   │
│ - 无依赖        │  │ - 聚合根操作  │
│ - 同步方法      │  │ - 异步操作    │
│ - 验证/计算     │  └──────────────┘
└────────────────┘
         │
         ▼
┌────────────────┐
│ Aggregate      │
│ (领域模型)       │
│ - 状态机        │
│ - 领域事件      │
└────────────────┘
```

### 2. Query → Domain → Persist 模式

**标准流程**：

```typescript
async someBusinessUseCase(params) {
  // 1. Query - 查询必要的聚合根
  const existingData = await this.repository.findXXX();
  
  // 2. Domain - 委托给 DomainService 或聚合根
  this.domainService.validateXXX(existingData);
  const aggregate = this.domainService.createXXX(params);
  aggregate.doSomething();
  
  // 3. Persist - 持久化变更
  await this.repository.save(aggregate);
  
  // 4. Publish Events (未来)
  await this.eventBus.publish(aggregate.getDomainEvents());
  
  // 5. Return DTO
  return aggregate.toClientDTO();
}
```

### 3. DomainService 无依赖原则

**错误示例** ❌：
```typescript
class FocusSessionDomainService {
  constructor(private repository: IFocusSessionRepository) {} // ❌ 错误！
  
  async validateSingleActiveSession(accountUuid: string) {
    const sessions = await this.repository.findByAccountUuid(accountUuid); // ❌
    // ...
  }
}
```

**正确示例** ✅：
```typescript
class FocusSessionDomainService {
  constructor() {} // ✅ 无依赖
  
  validateSingleActiveSession(sessions: FocusSession[], accountUuid: string) {
    // ✅ 接受查询结果作为参数
    // ✅ 纯业务逻辑，同步方法
  }
}
```

### 4. 模板方法模式（DRY）

**避免重复**：

```typescript
// ❌ 重复代码
async pauseSession(uuid: string, accountUuid: string) {
  const session = await this.repository.findById(uuid);
  if (!session) throw new Error('不存在');
  this.domainService.validateOwnership(session, accountUuid);
  session.pause();
  await this.repository.save(session);
  return session.toClientDTO();
}

async resumeSession(uuid: string, accountUuid: string) {
  const session = await this.repository.findById(uuid);
  if (!session) throw new Error('不存在');
  this.domainService.validateOwnership(session, accountUuid);
  session.resume();
  await this.repository.save(session);
  return session.toClientDTO();
}
```

**使用模板方法** ✅：

```typescript
private async executeSessionAction(
  uuid: string,
  accountUuid: string,
  action: (session: FocusSession) => void,
) {
  const session = await this.repository.findById(uuid);
  if (!session) throw new Error('不存在');
  this.domainService.validateOwnership(session, accountUuid);
  action(session); // 唯一变化的部分
  await this.repository.save(session);
  return session.toClientDTO();
}

async pauseSession(uuid: string, accountUuid: string) {
  return this.executeSessionAction(uuid, accountUuid, (session) => {
    this.domainService.validateStateTransition(session.status, 'pause');
    session.pause();
  });
}

async resumeSession(uuid: string, accountUuid: string) {
  return this.executeSessionAction(uuid, accountUuid, (session) => {
    this.domainService.validateStateTransition(session.status, 'resume');
    session.resume();
  });
}
```

### 5. 领域事件发布（待实现）

**预留代码**：

```typescript
async createAndStartSession(accountUuid: string, request: any) {
  // ... 业务逻辑 ...
  
  await this.sessionRepository.save(session);
  
  // TODO: 发布领域事件
  // const events = session.getDomainEvents();
  // await this.eventBus.publish(events);
  
  return session.toClientDTO();
}
```

**事件类型**：
- `FocusSessionCreatedEvent` - 会话创建
- `FocusSessionStartedEvent` - 会话开始
- `FocusSessionPausedEvent` - 会话暂停
- `FocusSessionResumedEvent` - 会话恢复
- `FocusSessionCompletedEvent` - 会话完成

## 下一步工作

### 1. 数据库迁移（用户任务）⚠️

**创建 Prisma Schema**（`apps/api/prisma/schema.prisma`）：

```prisma
model FocusSession {
  uuid                     String    @id @default(uuid())
  accountUuid              String
  goalUuid                 String?
  status                   String    // DRAFT, IN_PROGRESS, PAUSED, COMPLETED, CANCELLED
  durationMinutes          Int
  actualDurationMinutes    Int       @default(0)
  description              String?   @db.Text
  
  // 时间戳
  startedAt                DateTime?
  pausedAt                 DateTime?
  resumedAt                DateTime?
  completedAt              DateTime?
  cancelledAt              DateTime?
  
  // 暂停追踪
  pauseCount               Int       @default(0)
  pausedDurationMinutes    Int       @default(0)
  
  // 审计字段
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt
  
  // 关系
  account                  Account   @relation(fields: [accountUuid], references: [uuid])
  goal                     Goal?     @relation(fields: [goalUuid], references: [uuid])
  
  @@index([accountUuid])
  @@index([goalUuid])
  @@index([status])
  @@index([accountUuid, status])
  @@map("focus_sessions")
}
```

**运行迁移**：

```bash
pnpm nx run api:prisma-migrate --name add_focus_sessions_table
```

### 2. 实现 PrismaFocusSessionRepository（~150 lines）

**文件**: `apps/api/src/modules/goal/infrastructure/repositories/PrismaFocusSessionRepository.ts`

**需要实现的方法**：

```typescript
export class PrismaFocusSessionRepository implements IFocusSessionRepository {
  constructor(private prisma: PrismaClient) {}

  async save(session: FocusSession): Promise<void> {
    const data = session.toPersistenceDTO();
    await this.prisma.focusSession.upsert({
      where: { uuid: data.uuid },
      create: { ...data },
      update: { ...data },
    });
  }

  async findById(uuid: string): Promise<FocusSession | null> {
    const data = await this.prisma.focusSession.findUnique({
      where: { uuid },
    });
    return data ? FocusSession.fromPersistenceDTO(data) : null;
  }

  async findActiveSession(accountUuid: string): Promise<FocusSession | null> {
    const data = await this.prisma.focusSession.findFirst({
      where: {
        accountUuid,
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
      },
    });
    return data ? FocusSession.fromPersistenceDTO(data) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      goalUuid?: string;
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'startedAt' | 'completedAt';
      orderDirection?: 'asc' | 'desc';
    },
  ): Promise<FocusSession[]> {
    const data = await this.prisma.focusSession.findMany({
      where: {
        accountUuid,
        goalUuid: options?.goalUuid,
        status: options?.status ? { in: options.status } : undefined,
      },
      orderBy: {
        [options?.orderBy || 'createdAt']: options?.orderDirection || 'desc',
      },
      skip: options?.offset,
      take: options?.limit,
    });
    return data.map(FocusSession.fromPersistenceDTO);
  }

  // ... 其他方法
}
```

**更新 GoalContainer**：

```typescript
getFocusSessionRepository(): IFocusSessionRepository {
  if (!this.focusSessionRepository) {
    this.focusSessionRepository = new PrismaFocusSessionRepository(prisma);
  }
  return this.focusSessionRepository;
}
```

### 3. 实现 FocusSessionController（~250 lines）

**文件**: `apps/api/src/modules/goal/interface/http/FocusSessionController.ts`

**端点**：

```typescript
export class FocusSessionController {
  // POST /api/focus-sessions
  async createAndStart(req: Request, res: Response) {
    const accountUuid = req.user.accountUuid;
    const request = req.body; // { goalUuid?, durationMinutes, description?, startImmediately? }
    
    const service = await FocusSessionApplicationService.getInstance();
    const session = await service.createAndStartSession(accountUuid, request);
    
    return ResponseBuilder.success(res, session, '专注周期已创建');
  }

  // POST /api/focus-sessions/:uuid/pause
  async pause(req: Request, res: Response) {
    const { uuid } = req.params;
    const accountUuid = req.user.accountUuid;
    
    const service = await FocusSessionApplicationService.getInstance();
    const session = await service.pauseSession(uuid, accountUuid);
    
    return ResponseBuilder.success(res, session, '专注周期已暂停');
  }

  // POST /api/focus-sessions/:uuid/resume
  async resume(req: Request, res: Response) { /* ... */ }

  // POST /api/focus-sessions/:uuid/complete
  async complete(req: Request, res: Response) { /* ... */ }

  // POST /api/focus-sessions/:uuid/cancel
  async cancel(req: Request, res: Response) { /* ... */ }

  // GET /api/focus-sessions/active
  async getActive(req: Request, res: Response) {
    const accountUuid = req.user.accountUuid;
    
    const service = await FocusSessionApplicationService.getInstance();
    const session = await service.getActiveSession(accountUuid);
    
    return ResponseBuilder.success(res, session);
  }

  // GET /api/focus-sessions/history
  async getHistory(req: Request, res: Response) {
    const accountUuid = req.user.accountUuid;
    const filters = {
      goalUuid: req.query.goalUuid as string,
      status: req.query.status ? (req.query.status as string).split(',') : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      orderBy: req.query.orderBy as any || 'createdAt',
      orderDirection: req.query.orderDirection as any || 'desc',
    };
    
    const service = await FocusSessionApplicationService.getInstance();
    const sessions = await service.getSessionHistory(accountUuid, filters);
    
    return ResponseBuilder.success(res, sessions);
  }

  // GET /api/focus-sessions/statistics
  async getStatistics(req: Request, res: Response) {
    const accountUuid = req.user.accountUuid;
    const options = {
      startDate: req.query.startDate ? parseInt(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? parseInt(req.query.endDate as string) : undefined,
      goalUuid: req.query.goalUuid as string,
    };
    
    const service = await FocusSessionApplicationService.getInstance();
    const statistics = await service.getSessionStatistics(accountUuid, options);
    
    return ResponseBuilder.success(res, statistics);
  }

  // GET /api/focus-sessions/:uuid
  async getById(req: Request, res: Response) { /* ... */ }

  // DELETE /api/focus-sessions/:uuid
  async delete(req: Request, res: Response) { /* ... */ }
}
```

### 4. 创建路由（~150 lines）

**文件**: `apps/api/src/modules/goal/interface/http/focusSessionRoutes.ts`

```typescript
import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { FocusSessionController } from './FocusSessionController';

const router = Router();
const controller = new FocusSessionController();

// 所有路由都需要认证
router.use(authenticateToken);

// 创建和开始
router.post('/focus-sessions', (req, res) => controller.createAndStart(req, res));

// 状态控制
router.post('/focus-sessions/:uuid/pause', (req, res) => controller.pause(req, res));
router.post('/focus-sessions/:uuid/resume', (req, res) => controller.resume(req, res));
router.post('/focus-sessions/:uuid/complete', (req, res) => controller.complete(req, res));
router.post('/focus-sessions/:uuid/cancel', (req, res) => controller.cancel(req, res));

// 查询
router.get('/focus-sessions/active', (req, res) => controller.getActive(req, res));
router.get('/focus-sessions/history', (req, res) => controller.getHistory(req, res));
router.get('/focus-sessions/statistics', (req, res) => controller.getStatistics(req, res));
router.get('/focus-sessions/:uuid', (req, res) => controller.getById(req, res));

// 删除
router.delete('/focus-sessions/:uuid', (req, res) => controller.delete(req, res));

export default router;
```

**注册路由**（`apps/api/src/routes/index.ts`）：

```typescript
import focusSessionRoutes from '@/modules/goal/interface/http/focusSessionRoutes';

app.use('/api', focusSessionRoutes);
```

### 5. EventBus 集成（未来）

**取消注释事件发布代码**：

```typescript
async createAndStartSession(accountUuid: string, request: any) {
  // ... 业务逻辑 ...
  
  await this.sessionRepository.save(session);
  
  // 发布领域事件
  const events = session.getDomainEvents();
  await this.eventBus.publish(events);
  session.clearDomainEvents();
  
  return session.toClientDTO();
}
```

## 完成度评估

### 已完成（60%）✅

1. ✅ FocusSession 聚合根（~580 lines）
2. ✅ FocusSession Contracts（Server/Client DTOs, Events）
3. ✅ FocusSessionDomainService（~400 lines，纯业务逻辑）
4. ✅ IFocusSessionRepository 接口（~130 lines）
5. ✅ FocusSessionApplicationService（~400 lines，用例编排）
6. ✅ GoalContainer 更新（DI 支持）

### 待完成（40%）⏳

7. ⏳ 数据库迁移（用户任务）- focus_sessions 表
8. ⏳ PrismaFocusSessionRepository（~150 lines）
9. ⏳ FocusSessionController（~250 lines）
10. ⏳ 路由注册（~150 lines）
11. ⏳ EventBus 集成（待整体实现）

### 预计剩余时间

- **数据库迁移**: 30 分钟（用户任务）
- **Repository 实现**: 1.5 小时
- **Controller + Routes**: 2 小时
- **测试 + 调试**: 2 小时
- **总计**: 约 5.5-6 小时

## 文件清单

### 新增文件

- ✅ `apps/api/src/modules/goal/application/services/FocusSessionApplicationService.ts` (~400 lines)

### 修改文件

- ✅ `apps/api/src/modules/goal/infrastructure/di/GoalContainer.ts`
  - 新增 `focusSessionRepository` 字段
  - 新增 `getFocusSessionRepository()` 方法
  - 新增 `setFocusSessionRepository()` 方法
  - 更新 `reset()` 方法

### 无编译错误

```bash
✅ FocusSessionApplicationService.ts - No errors
✅ GoalContainer.ts - No errors
```

## 技术亮点

### 1. 严格的 DDD 分层

- **ApplicationService**: 编排层，协调 DomainService 和 Repository
- **DomainService**: 纯业务逻辑，无依赖，同步方法
- **Repository**: 持久化接口，仅负责 CRUD

### 2. 依赖注入支持

- 单例模式 + 依赖注入
- 支持测试时注入 Mock
- 通过 GoalContainer 管理依赖

### 3. 模板方法模式

- `executeSessionAction` 消除重复代码
- pause/resume/complete/cancel 共享相同流程
- 易于维护和扩展

### 4. Query → Domain → Persist 模式

- 清晰的业务流程
- 易于理解和测试
- 符合 DDD 最佳实践

### 5. 预留事件发布

- 为 EventBus 集成预留接口
- 注释清晰标注未来工作
- 易于后续扩展

## 参考资料

- **DDD 规范**: `d:\myPrograms\DailyUse\.github\instructions\fullstack.prompt.md`
- **领域模型**: `packages/domain-server/src/goal/aggregates/FocusSessionAggregate.ts`
- **领域服务**: `packages/domain-server/src/goal/services/FocusSessionDomainService.ts`
- **Repository 接口**: `packages/domain-server/src/goal/repositories/IFocusSessionRepository.ts`
- **参考实现**: `apps/api/src/modules/goal/application/services/GoalApplicationService.ts`

---

**实现日期**: 2025-01-XX
**作者**: GitHub Copilot
**DDD 架构**: 严格遵循 fullstack.prompt.md 规范
