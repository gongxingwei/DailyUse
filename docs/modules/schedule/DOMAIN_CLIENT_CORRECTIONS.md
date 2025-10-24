# Schedule Domain-Client 重构 - 紧急修正说明

## 🚨 关键发现

通过对比 **contracts** 定义，发现以下关键差异：

### 1. 字段名称不匹配

| 我的实现              | Contracts 定义               | 说明            |
| --------------------- | ---------------------------- | --------------- |
| `executionInfo`       | `execution`                  | ❌ 字段名错误   |
| `nextRunAt/lastRunAt` | 在 `execution` 内部          | ❌ 位置错误     |
| `isActive()` 等       | 应该是 getter 属性，不是方法 | ❌ 接口定义错误 |

### 2. ScheduleTaskClient 接口定义（从 contracts）

```typescript
export interface ScheduleTaskClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;

  // 值对象（Client 版本）- 注意这里是 execution，不是 executionInfo
  schedule: ScheduleConfigClientDTO;
  execution: ExecutionInfoClientDTO; // ⭐ 关键：是 execution
  retryPolicy: RetryPolicyClientDTO;
  metadata: TaskMetadataClientDTO;

  // 时间戳
  createdAt: number;
  updatedAt: number;

  // UI 辅助属性（⭐ 都是属性，不是方法）
  statusDisplay: string;
  statusColor: string;
  sourceModuleDisplay: string;
  enabledDisplay: string;
  nextRunAtFormatted: string; // ⭐ 不是 string | null
  lastRunAtFormatted: string;
  executionSummary: string;
  healthStatus: string;
  isOverdue: boolean;

  // 业务方法
  isActive(): boolean; // ⭐ 是方法，不是 getter
  isPaused(): boolean;
  isCompleted(): boolean;
  isFailed(): boolean;
  isCancelled(): boolean;
  canPause(): boolean;
  canResume(): boolean;
  canExecute(): boolean;

  // 子实体访问
  executions: ScheduleExecutionClient[] | null;

  // 业务逻辑方法
  pause(): ScheduleTaskClient;
  resume(): ScheduleTaskClient;
  cancel(): ScheduleTaskClient;
  complete(): ScheduleTaskClient;
  updateExecution(execution: ExecutionInfoClientDTO): ScheduleTaskClient;

  // 工厂方法
  clone(): ScheduleTaskClient;

  // DTO 转换
  toServerDTO(): ScheduleTaskServerDTO;
  toClientDTO(): ScheduleTaskClientDTO;
}
```

### 3. ExecutionInfo 包含 nextRunAt/lastRunAt

从 contracts 的定义来看，`nextRunAt` 和 `lastRunAt` 应该在 `ExecutionInfo` 内部，而不是在 ScheduleTask 的顶层字段。

---

## ✅ 正确的实现方式

### ScheduleTask 聚合根修正

```typescript
export class ScheduleTask extends AggregateRoot implements IScheduleTaskClient {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _sourceModule: SourceModule;
  private _sourceEntityId: string;
  private _status: ScheduleTaskStatus;
  private _enabled: boolean;

  // 值对象
  private _schedule: ScheduleConfig;
  private _execution: ExecutionInfo; // ⭐ 改名为 _execution
  private _retryPolicy: RetryPolicy;
  private _metadata: TaskMetadata;

  // 时间戳
  private _createdAt: number;
  private _updatedAt: number;

  // 子实体
  private _executions: ScheduleExecution[]; // ⭐ 注意是 ScheduleExecution，不是 TaskExecution

  // ===== Getter 属性 =====

  // 值对象返回 DTO
  public get execution(): ExecutionInfoClientDTO {
    // ⭐ 改名为 execution
    return this._execution.toClientDTO();
  }

  // UI 辅助属性（必须返回非 null 值）
  public get nextRunAtFormatted(): string {
    // ⭐ 不能是 null
    if (!this._execution.nextRunAt) return '未安排';
    return this.formatRelativeTime(this._execution.nextRunAt.getTime());
  }

  public get lastRunAtFormatted(): string {
    // ⭐ 不能是 null
    if (!this._execution.lastRunAt) return '从未执行';
    return this.formatRelativeTime(this._execution.lastRunAt.getTime());
  }

  // ===== 业务方法（⭐ 是方法，不是 getter）=====

  public isActive(): boolean {
    // ⭐ 方法，不是 get isActive()
    return this._status === SC.ScheduleTaskStatus.ACTIVE && this._enabled;
  }

  public isPaused(): boolean {
    return this._status === SC.ScheduleTaskStatus.PAUSED || !this._enabled;
  }

  // ... 其他方法

  // ===== 状态转换方法（返回新实例，符合不可变原则）=====

  public pause(): ScheduleTask {
    // ⭐ 返回 ScheduleTask
    if (this._status !== SC.ScheduleTaskStatus.ACTIVE) {
      throw new Error('只有活跃的任务才能暂停');
    }
    const cloned = this.clone();
    cloned._status = SC.ScheduleTaskStatus.PAUSED;
    cloned._enabled = false;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  // ===== DTO 转换 =====

  public toServerDTO(): ScheduleTaskServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      // ...
      schedule: this._schedule.toServerDTO(),
      execution: this._execution.toServerDTO(), // ⭐ execution
      retryPolicy: this._retryPolicy.toServerDTO(),
      metadata: this._metadata.toServerDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toClientDTO(): ScheduleTaskClientDTO {
    return {
      uuid: this._uuid,
      // ... 所有基础字段
      schedule: this._schedule.toClientDTO(),
      execution: this._execution.toClientDTO(), // ⭐ execution
      retryPolicy: this._retryPolicy.toClientDTO(),
      metadata: this._metadata.toClientDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,

      // UI 辅助属性（必须全部提供）
      statusDisplay: this.statusDisplay,
      statusColor: this.statusColor,
      sourceModuleDisplay: this.sourceModuleDisplay,
      enabledDisplay: this.enabledDisplay,
      nextRunAtFormatted: this.nextRunAtFormatted, // ⭐ 非 null
      lastRunAtFormatted: this.lastRunAtFormatted,
      executionSummary: this.executionSummary,
      healthStatus: this.healthStatus,
      isOverdue: this.isOverdue,

      // 子实体（可选）
      executions: this._executions.length > 0 ? this._executions.map((e) => e.toClientDTO()) : null,
    };
  }
}
```

---

## 🎯 修正清单

### 1. ScheduleTask.ts 需要修正的地方

- [ ] 将 `_executionInfo` 改名为 `_execution`
- [ ] 删除顶层的 `_nextRunAt` 和 `_lastRunAt`（移到 ExecutionInfo 内部）
- [ ] 将 `get isActive()` 等改为方法 `isActive(): boolean`
- [ ] `nextRunAtFormatted` 和 `lastRunAtFormatted` 必须返回 string（不能是 null）
- [ ] 添加缺失的 UI 辅助属性：
  - `statusDisplay`
  - `statusColor`
  - `sourceModuleDisplay`
  - `enabledDisplay`
  - `executionSummary`
  - `healthStatus`
  - `isOverdue`
- [ ] 业务方法返回新实例（不可变原则）

### 2. 需要完成的文件

- [ ] `entities/ScheduleExecution.ts`（不是 TaskExecution）
- [ ] `entities/index.ts`
- [ ] `aggregates/index.ts`
- [ ] 修正 `aggregates/ScheduleTask.ts`
- [ ] 更新 `schedule/index.ts`

---

## 📋 正确的 SourceModule 枚举值

```typescript
export enum SourceModule {
  REMINDER = 'reminder',
  TASK = 'task',
  GOAL = 'goal',
  NOTIFICATION = 'notification',
  SYSTEM = 'system', // ⭐ 缺失
  CUSTOM = 'custom', // ⭐ 缺失
}
```

---

## 🚀 下一步行动（按优先级）

1. **立即修正** `ScheduleTask.ts`：
   - 改字段名 `_executionInfo` → `_execution`
   - 改方法签名（isActive 等）
   - 添加所有缺失的 UI 属性
   - 修正 DTO 转换

2. **创建** `ScheduleExecution.ts` 实体（子实体）

3. **创建** index.ts 文件：
   - `entities/index.ts`
   - `aggregates/index.ts`

4. **更新** `schedule/index.ts` 导出结构

5. **删除** 旧文件：
   - `ScheduleTaskClient.ts`（已被聚合根替代）
   - `ScheduleStatisticsClient.ts`（如果需要，也要重构）

---

## ⚠️ 关键原则（再次强调）

1. **严格遵循 contracts 定义**
   - 字段名必须一致
   - 类型必须一致
   - 方法签名必须一致

2. **DDD 原则**
   - 聚合根是事务边界
   - 值对象不可变
   - 业务方法返回新实例

3. **参考 Repository 模块**
   - 代码结构
   - 命名规范
   - 注释风格

---

**当前状态**: ScheduleTask 聚合根已创建，但需要大量修正才能符合 contracts 定义。

**预计修正时间**: 需要仔细检查每个字段和方法，预计需要再创建/修改 5-8 个文件。
