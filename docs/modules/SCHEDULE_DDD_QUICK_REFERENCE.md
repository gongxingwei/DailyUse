# Schedule 模块快速参考 (DDD 架构)

> **最后更新**: 2025-01-XX  
> **架构模式**: DDD (Domain-Driven Design)  
> **核心原则**: Repository 返回实体，ApplicationService 负责 DTO 转换

---

## 🎯 快速查找

| 需求 | 跳转 |
|-----|------|
| 如何创建调度任务？ | [创建任务](#创建任务) |
| 如何查询任务？ | [查询任务](#查询任务) |
| 如何更新任务？ | [更新任务](#更新任务) |
| 数据库字段映射？ | [字段映射表](#字段映射表) |
| 实体转换方法？ | [实体转换](#实体转换) |
| 分层职责？ | [架构分层](#架构分层) |

---

## 🏗️ 架构分层

```
Controller (DTO) 
    ↓
ApplicationService (Entity ↔ DTO)
    ↓
DomainService (Entity)
    ↓
Repository (Entity ↔ DB)
    ↓
Database
```

**核心数据流**:
- **Controller → ApplicationService**: DTO
- **ApplicationService → DomainService**: DTO (创建) / Entity (返回)
- **DomainService → Repository**: Entity
- **Repository → Database**: `toPersistence()` (Entity → DB)
- **Database → Repository**: `fromPersistence()` (DB → Entity)
- **Repository → DomainService**: Entity
- **DomainService → ApplicationService**: Entity
- **ApplicationService → Controller**: `toClient()` (Entity → DTO)

---

## 📦 核心文件

| 文件 | 层级 | 职责 |
|-----|------|------|
| `ScheduleTask.ts` | Domain | 聚合根实体 + 业务逻辑 + 数据转换 |
| `IScheduleTaskRepository.ts` | Domain | Repository 接口（返回实体） |
| `PrismaScheduleTaskRepository.ts` | Infrastructure | Repository 实现（Prisma） |
| `ScheduleDomainService.ts` | Domain | 领域服务（业务逻辑） |
| `ScheduleApplicationService.ts` | Application | 应用服务（DTO 转换） |
| `controller.ts` | Interface | HTTP 控制器（路由） |

---

## 🔄 实体转换

### fromPersistence (DB → Entity)
```typescript
// 数据库查询结果 → ScheduleTask 实体
const dbData = await prisma.scheduleTask.findUnique({...});
const task = ScheduleTask.fromPersistence(dbData);

// 自动处理：
// - JSON 字段解析 (payload, recurrence, alertConfig)
// - 字段名映射 (title → name, accountUuid → createdBy)
// - 日期转换 (string → Date)
```

### toPersistence (Entity → DB)
```typescript
// ScheduleTask 实体 → 数据库格式
const task = new ScheduleTask({...});
const dbData = task.toPersistence();
await prisma.scheduleTask.create({ data: dbData });

// 自动处理：
// - JSON 字段序列化 (payload, recurrence, alertConfig)
// - 字段名反向映射 (name → title, createdBy → accountUuid)
// - 日期格式化 (Date → ISO string)
```

### toClient (Entity → DTO)
```typescript
// ScheduleTask 实体 → 客户端 DTO
const task = await repository.findByUuid(uuid);
const dto = task.toClient();
return dto; // ScheduleTaskResponseDto

// 自动处理：
// - UUID 重命名 (uuid → id)
// - 日期格式化 (Date → ISO string)
// - 所有字段展平
```

---

## 📊 字段映射表

| 数据库字段 | 实体属性 | DTO 字段 | 类型转换 |
|-----------|---------|---------|---------|
| `uuid` | `_uuid` | `id` | string |
| `title` | `_basic.name` | `name` | string |
| `accountUuid` | `_basic.createdBy` | `createdBy` | string |
| `payload` | `_basic.payload` | `payload` | JSON.parse/stringify |
| `scheduledTime` | `_scheduling.scheduledTime` | `scheduledTime` | Date ↔ ISO string |
| `nextScheduledAt` | `_scheduling.nextExecutionTime` | `nextExecutionTime` | Date ↔ ISO string |
| `recurrence` | `_scheduling.recurrence` | `recurrence` | JSON.parse/stringify |
| `failureCount` | `_execution.currentRetries` | `currentRetries` | number |
| `alertConfig` | `_alertConfig` | `alertConfig` | JSON.parse/stringify |
| `enabled` | `_lifecycle.enabled` | `enabled` | boolean |
| `createdAt` | `_lifecycle.createdAt` | `createdAt` | Date ↔ ISO string |

---

## 💻 常用代码示例

### 创建任务

```typescript
// 1. Controller 接收 DTO
@Post('/')
async createScheduleTask(@Body() request: CreateScheduleTaskRequestDto) {
  const accountUuid = this.getAccountUuid();
  return await this.scheduleAppService.createScheduleTask(accountUuid, request);
}

// 2. ApplicationService 转换 Entity → DTO
async createScheduleTask(
  accountUuid: string,
  request: CreateScheduleTaskRequestDto,
): Promise<ScheduleTaskResponseDto> {
  const task = await this.scheduleDomainService.createScheduleTask(accountUuid, request);
  return task.toClient(); // ✅ Entity → DTO
}

// 3. DomainService 业务验证 + 返回实体
async createScheduleTask(
  accountUuid: string,
  request: CreateScheduleTaskRequestDto,
): Promise<ScheduleTask> {
  await this.validateScheduleTaskCreation(accountUuid, request);
  return await this.scheduleRepository.create(request, accountUuid); // 返回实体
}

// 4. Repository 持久化 + 返回实体
async create(
  request: CreateScheduleTaskRequestDto,
  createdBy: string,
): Promise<ScheduleTask> {
  const created = await this.prisma.scheduleTask.create({
    data: {
      title: request.name,        // DTO → DB 映射
      accountUuid: createdBy,
      payload: JSON.stringify(request.payload),
      // ...
    },
  });
  return ScheduleTask.fromPersistence(created); // ✅ DB → Entity
}
```

---

### 查询任务

```typescript
// 1. Controller
@Get('/:uuid')
async getScheduleTask(@Param('uuid') uuid: string) {
  const accountUuid = this.getAccountUuid();
  return await this.scheduleAppService.getScheduleTask(accountUuid, uuid);
}

// 2. ApplicationService
async getScheduleTask(
  accountUuid: string,
  uuid: string,
): Promise<ScheduleTaskResponseDto | null> {
  const task = await this.scheduleDomainService.getScheduleTaskByUuid(accountUuid, uuid);
  return task ? task.toClient() : null; // ✅ 处理 null
}

// 3. DomainService
async getScheduleTaskByUuid(
  accountUuid: string,
  uuid: string,
): Promise<ScheduleTask | null> {
  const task = await this.scheduleRepository.findByUuid(uuid);
  
  // 权限验证
  if (task && task.createdBy !== accountUuid) {
    return null;
  }
  
  return task; // 返回实体
}

// 4. Repository
async findByUuid(uuid: string): Promise<ScheduleTask | null> {
  const task = await this.prisma.scheduleTask.findUnique({
    where: { uuid },
  });
  return task ? ScheduleTask.fromPersistence(task) : null; // ✅ DB → Entity
}
```

---

### 更新任务

```typescript
// 1. Controller
@Patch('/:uuid')
async updateScheduleTask(
  @Param('uuid') uuid: string,
  @Body() request: UpdateScheduleTaskRequestDto,
) {
  const accountUuid = this.getAccountUuid();
  return await this.scheduleAppService.updateScheduleTask(accountUuid, uuid, request);
}

// 2. ApplicationService
async updateScheduleTask(
  accountUuid: string,
  uuid: string,
  request: UpdateScheduleTaskRequestDto,
): Promise<ScheduleTaskResponseDto> {
  const task = await this.scheduleDomainService.updateScheduleTask(accountUuid, uuid, request);
  return task.toClient(); // ✅ Entity → DTO
}

// 3. DomainService
async updateScheduleTask(
  accountUuid: string,
  uuid: string,
  request: UpdateScheduleTaskRequestDto,
): Promise<ScheduleTask> {
  // 验证权限
  const existing = await this.getScheduleTaskByUuid(accountUuid, uuid);
  if (!existing) {
    throw new Error('Schedule task not found or access denied');
  }

  // 业务规则验证
  await this.validateScheduleTaskUpdate(accountUuid, uuid, request);

  return await this.scheduleRepository.update(uuid, request); // 返回实体
}

// 4. Repository
async update(
  uuid: string,
  request: UpdateScheduleTaskRequestDto,
): Promise<ScheduleTask> {
  const updated = await this.prisma.scheduleTask.update({
    where: { uuid },
    data: {
      title: request.name,
      description: request.description,
      // ... 其他字段映射
    },
  });
  return ScheduleTask.fromPersistence(updated); // ✅ DB → Entity
}
```

---

### 查询任务列表

```typescript
// 1. Controller
@Get('/')
async getScheduleTasks(@Query() query: IScheduleTaskQuery) {
  const accountUuid = this.getAccountUuid();
  return await this.scheduleAppService.getScheduleTasks(accountUuid, query);
}

// 2. ApplicationService
async getScheduleTasks(
  accountUuid: string,
  query: IScheduleTaskQuery,
): Promise<ScheduleTaskListResponseDto> {
  const result = await this.scheduleDomainService.getScheduleTasks(accountUuid, query);
  return {
    tasks: result.tasks.map(task => task.toClient()), // ✅ 批量转换
    total: result.total,
    pagination: result.pagination || { offset: 0, limit: result.tasks.length, hasMore: false },
  };
}

// 3. DomainService
async getScheduleTasks(
  accountUuid: string,
  query: IScheduleTaskQuery,
): Promise<{ tasks: ScheduleTask[]; total: number; pagination?: {...} }> {
  const accountQuery = { ...query, createdBy: accountUuid };
  return await this.scheduleRepository.findMany(accountQuery); // 返回实体数组
}

// 4. Repository
async findMany(query: IScheduleTaskQuery): Promise<{
  tasks: ScheduleTask[];
  total: number;
  pagination?: {...};
}> {
  const tasks = await this.prisma.scheduleTask.findMany({...});
  const total = await this.prisma.scheduleTask.count({...});
  
  return {
    tasks: tasks.map(t => ScheduleTask.fromPersistence(t)), // ✅ 批量转换
    total,
    pagination: {...},
  };
}
```

---

### 直接保存实体 (save 方法)

```typescript
// 适用场景：已有实体，直接持久化（避免 DTO 转换）

// DomainService
async updateScheduleTaskStatus(task: ScheduleTask): Promise<ScheduleTask> {
  task.updateStatus(ScheduleStatus.RUNNING); // 使用实体方法
  return await this.scheduleRepository.save(task); // 直接保存
}

// Repository
async save(task: ScheduleTask): Promise<ScheduleTask> {
  const persistence = task.toPersistence(); // ✅ Entity → DB
  const saved = await this.prisma.scheduleTask.upsert({
    where: { uuid: persistence.uuid },
    create: persistence,
    update: persistence,
  });
  return ScheduleTask.fromPersistence(saved); // ✅ DB → Entity
}
```

---

## 🎨 状态管理示例

```typescript
// 启用任务
@Post('/:uuid/enable')
async enableScheduleTask(@Param('uuid') uuid: string) {
  const accountUuid = this.getAccountUuid();
  return await this.scheduleAppService.enableScheduleTask(accountUuid, uuid);
}

// ApplicationService
async enableScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTaskResponseDto> {
  const task = await this.scheduleDomainService.enableScheduleTask(accountUuid, uuid);
  return task.toClient(); // ✅ Entity → DTO
}

// DomainService
async enableScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTask> {
  return await this.scheduleRepository.enable(uuid); // 返回实体
}

// Repository
async enable(uuid: string): Promise<ScheduleTask> {
  const updated = await this.prisma.scheduleTask.update({
    where: { uuid },
    data: { enabled: true, status: ScheduleStatus.PENDING },
  });
  return ScheduleTask.fromPersistence(updated); // ✅ DB → Entity
}
```

---

## 🔍 常见问题

### Q1: 为什么 Repository 要返回实体而不是 DTO？

**A**: DDD 原则要求 Repository 是领域层的一部分，负责聚合根的持久化。DTO 是接口层的概念，不应出现在领域层。

```typescript
// ❌ 错误：领域层依赖接口层
interface IScheduleTaskRepository {
  findByUuid(): Promise<ScheduleTaskResponseDto>; // DTO 属于接口层
}

// ✅ 正确：领域层只使用聚合根
interface IScheduleTaskRepository {
  findByUuid(): Promise<ScheduleTask>; // Entity 属于领域层
}
```

---

### Q2: 什么时候使用 `save()` vs `update()`？

**A**:
- **`update(dto)`**: 接收 DTO，用于从客户端更新任务
- **`save(entity)`**: 接收实体，用于领域逻辑内部更新任务

```typescript
// 场景1：客户端更新（使用 update）
const task = await repository.update(uuid, updateDto);

// 场景2：领域逻辑更新（使用 save）
const task = await repository.findByUuid(uuid);
task.execute(); // 调用领域方法
await repository.save(task); // 保存修改后的实体
```

---

### Q3: 如何处理 JSON 字段（payload、recurrence）？

**A**: 在 `fromPersistence()` 中解析，在 `toPersistence()` 中序列化。

```typescript
// fromPersistence
static fromPersistence(data: any): ScheduleTask {
  const payload = parseJson(data.payload) || {}; // ✅ 解析 JSON
  const recurrence = parseJson(data.recurrence);
  
  return new ScheduleTask({
    basic: { payload }, // 对象
    scheduling: { recurrence }, // 对象
  });
}

// toPersistence
toPersistence(): any {
  return {
    payload: JSON.stringify(this._basic.payload), // ✅ 序列化
    recurrence: this._scheduling.recurrence 
      ? JSON.stringify(this._scheduling.recurrence) 
      : null,
  };
}
```

---

### Q4: 如何访问实体的私有属性？

**A**: 使用实体提供的 **getter 方法**。

```typescript
// ❌ 错误：直接访问私有属性
if (task._basic.createdBy !== accountUuid) { ... }

// ✅ 正确：使用 getter
if (task.createdBy !== accountUuid) { ... }

// ScheduleTaskCore 提供的 getter:
get createdBy(): string {
  return this._basic.createdBy;
}
```

---

### Q5: 如何处理分页参数？

**A**: Repository 返回完整对象，ApplicationService 提供默认值。

```typescript
// Repository
async findMany(query): Promise<{
  tasks: ScheduleTask[];
  total: number;
  pagination?: { offset: number; limit: number; hasMore: boolean }; // 可选
}> {
  return {
    tasks: [...],
    total: 100,
    pagination: { offset: 0, limit: 10, hasMore: true },
  };
}

// ApplicationService
async getScheduleTasks(accountUuid: string, query): Promise<ScheduleTaskListResponseDto> {
  const result = await this.scheduleDomainService.getScheduleTasks(accountUuid, query);
  return {
    tasks: result.tasks.map(task => task.toClient()),
    total: result.total,
    pagination: result.pagination || { // ✅ 提供默认值
      offset: 0,
      limit: result.tasks.length,
      hasMore: false,
    },
  };
}
```

---

## 📚 相关文档

- [完整重构总结](./SCHEDULE_MODULE_DDD_REFACTORING_COMPLETE.md) - 详细重构过程
- [Reminder 模块参考](./NOTIFICATION_REFACTORING_SUMMARY.md) - 相同模式
- [Goal 模块参考](Goal模块完整流程.md) - 相同模式
- [DDD 架构原则](../systems/DDD_ARCHITECTURE_PRINCIPLES.md) - 架构理论

---

**快速参考版本**: v1.0  
**适用版本**: Nx 21.4.1 + TypeScript 5.x  
**最后更新**: 2025-01-XX
