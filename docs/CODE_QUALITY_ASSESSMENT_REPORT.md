# DailyUse 代码质量评估报告

> **评估日期**: 2025-10-21  
> **评估范围**: packages/domain-server, apps/api, apps/web  
> **评估人**: AI Code Reviewer  
> **评估方法**: 静态分析 + 架构审查

---

## 📊 总体评分

| 维度               | 评分             | 说明                               |
| ------------------ | ---------------- | ---------------------------------- |
| **DDD 架构合规性** | ⭐⭐⭐⭐☆ (4/5)  | 聚合根设计优秀，但缺少 DomainEvent |
| **代码组织结构**   | ⭐⭐⭐⭐⭐ (5/5) | Monorepo + 分层架构清晰            |
| **类型安全**       | ⭐⭐⭐⭐⭐ (5/5) | TypeScript 使用规范                |
| **测试覆盖率**     | ⭐⭐☆☆☆ (2/5)    | ⚠️ 单元测试严重不足                |
| **代码复用**       | ⭐⭐⭐⭐☆ (4/5)  | 契约层设计良好                     |
| **错误处理**       | ⭐⭐⭐☆☆ (3/5)   | 基础错误处理存在，需要统一         |
| **文档质量**       | ⭐⭐⭐⭐⭐ (5/5) | 注释详细，架构文档完善             |

**综合评分**: **3.8/5** ⭐⭐⭐⭐ (良好)

---

## ✅ 优点分析

### 1. **DDD 架构设计优秀** ⭐⭐⭐⭐⭐

**TaskTemplate 聚合根**（`packages/domain-server/src/task/aggregates/TaskTemplate.ts`）:

```typescript
export class TaskTemplate extends AggregateRoot implements ITaskTemplate {
  // ✅ 优点 1: 私有字段封装良好
  private _accountUuid: string;
  private _title: string;
  private _tags: string[];
  private _instances: TaskInstance[];  // 子实体管理

  // ✅ 优点 2: 只读 Getter（防止外部修改）
  public get tags(): string[] {
    return [...this._tags];  // 返回副本，保护不变性
  }

  // ✅ 优点 3: 业务方法封装完整
  public generateInstances(fromDate: number, toDate: number): TaskInstance[] {
    // 业务规则内聚在聚合根内
  }

  // ✅ 优点 4: 状态管理方法清晰
  public activate(): void { ... }
  public pause(): void { ... }
  public archive(): void { ... }
}
```

**评价**:

- ✅ 聚合根职责明确（事务边界、业务规则、子实体管理）
- ✅ 封装性强，防止外部破坏不变性
- ✅ 方法命名语义化（activate, pause, archive）

---

### 2. **Contracts 层设计规范** ⭐⭐⭐⭐⭐

**类型定义清晰**（`packages/contracts/src/modules/task/`）:

```typescript
// ✅ 优点: Server/Client DTO 分离
export interface TaskTemplateServerDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  // ... Server 侧完整数据
}

export interface TaskTemplateClientDTO {
  uuid: string;
  title: string;
  displayTitle: string; // ✅ 客户端专用计算字段
  taskTypeText: string; // ✅ 国际化友好
  completionRate: number; // ✅ UI 展示字段
}
```

**评价**:

- ✅ Server/Client DTO 分离（避免敏感数据泄露）
- ✅ 计算字段在 Client DTO（减轻前端负担）
- ✅ 类型安全（TypeScript 编译期检查）

---

### 3. **Application Service 职责清晰** ⭐⭐⭐⭐

**AuthenticationApplicationService**（`apps/api/src/modules/authentication/application/`）:

```typescript
export class AuthenticationApplicationService {
  // ✅ 优点 1: 依赖注入（可测试）
  private constructor(
    credentialRepository: IAuthCredentialRepository,
    sessionRepository: IAuthSessionRepository,
    accountRepository: IAccountRepository,
  ) { ... }

  // ✅ 优点 2: 业务流程编排清晰
  async login(request: LoginRequest): Promise<LoginResponse> {
    // 步骤 1: 查询账户
    const account = await this.accountRepository.findByUsername(...);

    // 步骤 2: 查询凭证
    const credential = await this.credentialRepository.findByAccountUuid(...);

    // 步骤 3: 业务规则验证（委托给 DomainService）
    const isLocked = this.authenticationDomainService.isCredentialLocked(credential);

    // 步骤 4: 持久化
    await this.sessionRepository.save(session);

    // 步骤 5: 事件发布
    eventBus.emit('user:logged-in', ...);
  }
}
```

**评价**:

- ✅ 职责单一（编排 + 持久化 + 事件发布）
- ✅ 依赖接口而非实现（可测试、可替换）
- ✅ 业务逻辑委托给 DomainService

---

### 4. **事件驱动架构** ⭐⭐⭐⭐

**事件总线使用**（`@dailyuse/utils`）:

```typescript
// ✅ 优点: 模块解耦
// Account 模块创建账户后发布事件
eventBus.emit('account:created', { accountUuid, username });

// Authentication 模块监听事件创建凭证
eventBus.on('account:created', async (event) => {
  await accountCreatedHandler.handle(event);
});
```

**评价**:

- ✅ 模块间松耦合（Account 不依赖 Authentication）
- ✅ 最终一致性（异步处理）
- ✅ 可扩展（新模块只需监听事件）

---

### 5. **代码注释详细** ⭐⭐⭐⭐⭐

```typescript
/**
 * TaskTemplate 聚合根
 *
 * DDD 聚合根职责：
 * - 管理任务模板的生命周期
 * - 管理任务实例的生成
 * - 管理历史记录
 * - 执行业务规则
 * - 是事务边界
 */
```

**评价**:

- ✅ 类级别注释说明职责
- ✅ 方法注释说明参数和返回值
- ✅ 业务逻辑注释清晰

---

## ❌ 问题分析

### 1. **⚠️ 单元测试严重不足** (Critical)

**现状**:

- ✅ 有集成测试（`registration.integration.test.ts`, `login.integration.test.ts`）
- ❌ **没有 Domain 层单元测试**（TaskTemplate, TaskInstance, Goal 等聚合根）
- ❌ **没有 Value Object 单元测试**（RecurrenceRule, TaskTimeConfig 等）
- ❌ **没有 Application Service 单元测试**（Mock Repository）

**问题影响**:

- 🐛 业务规则变更容易引入 Bug
- 🔄 重构风险高（无法快速验证）
- ⏱️ 调试效率低（依赖集成测试，启动慢）

**测试覆盖率估算**:

- Domain 层: **< 5%** ❌
- Application 层: **< 10%** ❌
- API 层: **~30%** ⚠️

**推荐目标**:

- Domain 层: **≥ 80%** ✅
- Application 层: **≥ 70%** ✅
- API 层: **≥ 60%** ✅

---

### 2. **DomainEvent 机制未充分使用** (Medium)

**现状**:

```typescript
export class TaskTemplate extends AggregateRoot {
  public activate(): void {
    this._status = 'ACTIVE';
    this._updatedAt = Date.now();
    this.addHistory('resumed'); // ✅ 记录历史

    // ❌ 缺少: 发布 TaskTemplateActivatedEvent
  }
}
```

**问题**:

- ❌ 没有发布领域事件（如 `TaskTemplateActivatedEvent`, `TaskInstanceCompletedEvent`）
- ❌ 无法实现事件溯源（Event Sourcing）
- ❌ 其他模块无法监听领域事件

**改进建议**:

```typescript
public activate(): void {
  this._status = 'ACTIVE';
  this._updatedAt = Date.now();

  // ✅ 发布领域事件
  this.addDomainEvent(new TaskTemplateActivatedEvent({
    aggregateId: this.uuid,
    accountUuid: this._accountUuid,
    activatedAt: Date.now()
  }));
}
```

---

### 3. **错误处理不统一** (Medium)

**现状**:

```typescript
// ❌ 方式 1: 抛出字符串
throw new Error('Invalid username or password');

// ❌ 方式 2: 直接返回错误
return { success: false, message: 'Error' };

// ✅ 方式 3: 自定义错误类（仅部分使用）
throw new AccountAlreadyExistsError(username);
```

**问题**:

- ❌ 错误类型不统一（难以捕获和处理）
- ❌ 缺少错误码（前端无法国际化）
- ❌ 错误上下文信息不足（调试困难）

**改进建议**:

```typescript
// ✅ 统一错误基类
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ✅ 具体错误类
export class InvalidCredentialsError extends DomainError {
  constructor(username: string) {
    super('AUTH_001', 'Invalid username or password', { username });
  }
}

// ✅ 使用
throw new InvalidCredentialsError(request.username);
```

---

### 4. **部分业务逻辑泄漏到 Controller** (Low)

**现状**（`TaskTemplateController.ts`）:

```typescript
static async getTaskTemplates(req: Request, res: Response) {
  // ❌ 问题: 查询逻辑分散在 Controller
  if (status) {
    templates = await service.getTaskTemplatesByStatus(accountUuid, status);
  } else if (folderUuid) {
    templates = await service.getTaskTemplatesByFolder(folderUuid);
  } else if (goalUuid) {
    templates = await service.getTaskTemplatesByGoal(goalUuid);
  } else if (tags) {
    const tagArray = typeof tags === 'string' ? tags.split(',') : [];
    templates = await service.getTaskTemplatesByTags(accountUuid, tagArray);
  }
}
```

**问题**:

- ❌ Controller 包含业务判断逻辑
- ❌ 参数解析逻辑应该在 Application Service

**改进建议**:

```typescript
// ✅ Application Service 统一入口
async getTaskTemplates(
  accountUuid: string,
  filters: {
    status?: TaskTemplateStatus;
    folderUuid?: string;
    goalUuid?: string;
    tags?: string[];
  }
): Promise<TaskTemplateClientDTO[]> {
  // 业务逻辑在 Application Service
}
```

---

### 5. **缺少 API 输入验证** (Medium)

**现状**:

```typescript
static async createTaskTemplate(req: Request, res: Response) {
  // ❌ 缺少: Zod 或 Joi 输入验证
  const template = await service.createTaskTemplate({
    accountUuid,
    ...req.body,  // ⚠️ 直接使用 req.body
  });
}
```

**问题**:

- ❌ 缺少输入验证（类型、格式、范围）
- ❌ 可能导致脏数据进入数据库

**改进建议**:

```typescript
import { z } from 'zod';

const createTaskTemplateSchema = z.object({
  title: z.string().min(1).max(200),
  taskType: z.enum(['ONE_TIME', 'RECURRING']),
  importance: z.number().int().min(1).max(5),
  // ...
});

static async createTaskTemplate(req: Request, res: Response) {
  // ✅ Zod 验证
  const validated = createTaskTemplateSchema.parse(req.body);
  const template = await service.createTaskTemplate({
    accountUuid,
    ...validated,
  });
}
```

---

### 6. **RecurrenceRule 实现不完整** (Medium)

**现状**（`TaskTemplate.shouldGenerateInstance`）:

```typescript
switch (rule.frequency) {
  case 'MONTHLY':
    // ❌ 问题: 注释说"简化处理"
    // 每月的指定日期
    // 这里简化处理，实际应该更复杂
    return true;

  case 'YEARLY':
    // ❌ 问题: 没有实现
    return true;
}
```

**问题**:

- ❌ MONTHLY 和 YEARLY 逻辑未实现
- ❌ 缺少复杂重复规则（如"每月最后一个周五"）

**改进建议**:

- ✅ 集成 `node-cron` 或 `rrule` 库（Sprint 2b 计划）
- ✅ 实现完整的 RFC 5545 规则

---

## 🎯 重构优先级

### **P0 - 立即重构** (本周完成)

1. **补充单元测试**（Critical）
   - TaskTemplate 聚合根测试
   - TaskInstance 聚合根测试
   - RecurrenceRule 值对象测试
   - 目标覆盖率: **80%**

2. **统一错误处理**（High）
   - 创建 `DomainError` 基类
   - 定义错误码枚举
   - 在所有模块中使用

### **P1 - 短期重构** (Sprint 2a-2b)

3. **添加 API 输入验证**（High）
   - 使用 Zod Schema 验证所有 API 输入
   - 统一验证错误响应格式

4. **完善 RecurrenceRule**（Medium）
   - 集成 `node-cron`（Sprint 2b 计划中已有）
   - 实现 MONTHLY 和 YEARLY 逻辑

5. **重构 Controller 查询逻辑**（Medium）
   - 将查询逻辑下沉到 Application Service
   - Controller 只负责 HTTP 适配

### **P2 - 中期改进** (Sprint 3-4)

6. **引入 DomainEvent 机制**（Medium）
   - 为关键业务操作发布领域事件
   - 实现事件监听和处理

7. **性能优化**（Low）
   - 添加数据库查询索引
   - 实现缓存策略（Redis）

---

## 📋 测试补充计划

### **Phase 1: Domain 层单元测试** (Week 1)

#### **TaskTemplate 聚合根测试**

```typescript
// packages/domain-server/src/task/aggregates/__tests__/TaskTemplate.spec.ts

describe('TaskTemplate Aggregate Root', () => {
  describe('Factory Methods', () => {
    it('should create one-time task template', () => {
      const template = TaskTemplate.create({
        accountUuid: 'acc-123',
        title: 'Review PR',
        taskType: 'ONE_TIME',
        // ...
      });

      expect(template.taskType).toBe('ONE_TIME');
      expect(template.title).toBe('Review PR');
    });
  });

  describe('Instance Generation', () => {
    it('should generate one instance for one-time task', () => {
      const template = TaskTemplate.create({
        /* ... */
      });
      const instances = template.generateInstances(
        Date.parse('2025-12-01'),
        Date.parse('2025-12-31'),
      );

      expect(instances).toHaveLength(1);
    });

    it('should generate multiple instances for daily recurring task', () => {
      const template = TaskTemplate.create({
        taskType: 'RECURRING',
        recurrenceRule: RecurrenceRule.create({
          frequency: 'DAILY',
          interval: 1,
        }),
        // ...
      });

      const instances = template.generateInstances(
        Date.parse('2025-12-01'),
        Date.parse('2025-12-07'), // 7 days
      );

      expect(instances).toHaveLength(7);
    });
  });

  describe('Status Management', () => {
    it('should activate paused template', () => {
      const template = TaskTemplate.create({
        /* ... */
      });
      template.pause();
      expect(template.status).toBe('PAUSED');

      template.activate();
      expect(template.status).toBe('ACTIVE');
    });
  });

  describe('Tag Management', () => {
    it('should add tag', () => {
      const template = TaskTemplate.create({ tags: [] });
      template.addTag('urgent');

      expect(template.tags).toContain('urgent');
    });

    it('should not add duplicate tag', () => {
      const template = TaskTemplate.create({ tags: ['urgent'] });
      template.addTag('urgent');

      expect(template.tags).toHaveLength(1);
    });
  });
});
```

#### **RecurrenceRule 值对象测试**

```typescript
// packages/domain-server/src/task/value-objects/__tests__/RecurrenceRule.spec.ts

describe('RecurrenceRule Value Object', () => {
  describe('Daily Recurrence', () => {
    it('should create daily rule', () => {
      const rule = RecurrenceRule.create({
        frequency: 'DAILY',
        interval: 1,
      });

      expect(rule.frequency).toBe('DAILY');
    });

    it('should reject interval < 1', () => {
      expect(() => {
        RecurrenceRule.create({
          frequency: 'DAILY',
          interval: 0, // Invalid
        });
      }).toThrow();
    });
  });

  describe('Weekly Recurrence', () => {
    it('should create weekly rule with specific days', () => {
      const rule = RecurrenceRule.create({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      });

      expect(rule.daysOfWeek).toEqual([1, 3, 5]);
    });
  });
});
```

---

### **Phase 2: Application 层单元测试** (Week 2)

#### **AuthenticationApplicationService 测试**

```typescript
// apps/api/src/modules/authentication/application/services/__tests__/AuthenticationApplicationService.spec.ts

describe('AuthenticationApplicationService', () => {
  let service: AuthenticationApplicationService;
  let mockCredentialRepo: jest.Mocked<IAuthCredentialRepository>;
  let mockSessionRepo: jest.Mocked<IAuthSessionRepository>;
  let mockAccountRepo: jest.Mocked<IAccountRepository>;

  beforeEach(() => {
    // ✅ Mock Repositories
    mockCredentialRepo = {
      findByAccountUuid: jest.fn(),
      save: jest.fn(),
    };
    mockSessionRepo = {
      save: jest.fn(),
    };
    mockAccountRepo = {
      findByUsername: jest.fn(),
    };

    service = new AuthenticationApplicationService(
      mockCredentialRepo,
      mockSessionRepo,
      mockAccountRepo,
    );
  });

  it('should login successfully with valid credentials', async () => {
    // Arrange
    const mockAccount = Account.create({
      /* ... */
    });
    const mockCredential = AuthCredential.create({
      /* ... */
    });

    mockAccountRepo.findByUsername.mockResolvedValue(mockAccount);
    mockCredentialRepo.findByAccountUuid.mockResolvedValue(mockCredential);

    // Act
    const result = await service.login({
      username: 'john',
      password: 'password123',
      // ...
    });

    // Assert
    expect(result.success).toBe(true);
    expect(mockSessionRepo.save).toHaveBeenCalled();
  });

  it('should throw error for invalid password', async () => {
    // Arrange
    mockAccountRepo.findByUsername.mockResolvedValue(mockAccount);
    mockCredentialRepo.findByAccountUuid.mockResolvedValue(mockCredential);

    // Act & Assert
    await expect(
      service.login({
        username: 'john',
        password: 'wrong-password',
        // ...
      }),
    ).rejects.toThrow('Invalid username or password');
  });
});
```

---

## 🚀 增量开发计划

### **阶段 1: 重构 + 测试补充** (Week 1-2)

| 任务                                          | 优先级 | 预估时间 | 负责人 |
| --------------------------------------------- | ------ | -------- | ------ |
| 1. 创建 DomainError 基类                      | P0     | 2h       | Dev    |
| 2. 补充 TaskTemplate 单元测试                 | P0     | 4h       | Dev    |
| 3. 补充 RecurrenceRule 单元测试               | P0     | 3h       | Dev    |
| 4. 补充 AuthenticationApplicationService 测试 | P0     | 4h       | Dev    |
| 5. 添加 API 输入验证（Zod）                   | P1     | 3h       | Dev    |
| 6. 重构 Controller 查询逻辑                   | P1     | 2h       | Dev    |
| **Total**                                     | -      | **18h**  | -      |

---

### **阶段 2: Sprint 2a - 任务标签功能** (Week 3-4)

**基于现有 TaskTemplate，增量开发**：

#### **1. Domain 层扩展** (2h)

```typescript
// packages/domain-server/src/task/aggregates/TaskTemplate.ts

export class TaskTemplate extends AggregateRoot {
  // ✅ 已有字段
  private _tags: string[];

  // 🆕 新增方法
  public addTag(tag: string): void {
    if (!tag || tag.trim().length === 0) {
      throw new InvalidTagError('Tag cannot be empty');
    }

    if (this._tags.includes(tag)) {
      return; // 幂等性
    }

    if (this._tags.length >= 10) {
      throw new TooManyTagsError('Maximum 10 tags allowed');
    }

    this._tags.push(tag);
    this._updatedAt = Date.now();

    // ✅ 发布领域事件
    this.addDomainEvent(
      new TagAddedEvent({
        aggregateId: this.uuid,
        tag,
        addedAt: Date.now(),
      }),
    );
  }

  public removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index === -1) return;

    this._tags.splice(index, 1);
    this._updatedAt = Date.now();

    this.addDomainEvent(
      new TagRemovedEvent({
        aggregateId: this.uuid,
        tag,
        removedAt: Date.now(),
      }),
    );
  }

  public hasTag(tag: string): boolean {
    return this._tags.includes(tag);
  }

  public replaceTag(oldTag: string, newTag: string): void {
    const index = this._tags.indexOf(oldTag);
    if (index === -1) {
      throw new TagNotFoundError(oldTag);
    }

    this._tags[index] = newTag;
    this._updatedAt = Date.now();
  }
}
```

#### **2. API 层扩展** (2h)

```typescript
// apps/api/src/modules/task/interface/http/routes/taskTemplateRoutes.ts

// 🆕 新增标签管理路由
router.post('/:id/tags', TaskTemplateController.addTag);
router.delete('/:id/tags/:tagName', TaskTemplateController.removeTag);
router.put('/:id/tags/:oldTag', TaskTemplateController.replaceTag);
router.get('/:id/tags', TaskTemplateController.getTags);
```

#### **3. 前端 UI** (4h)

```vue
<!-- apps/web/src/modules/task/presentation/components/TaskTagManager.vue -->

<template>
  <div class="task-tag-manager">
    <el-tag v-for="tag in tags" :key="tag" closable @close="handleRemoveTag(tag)">
      {{ tag }}
    </el-tag>

    <el-input
      v-model="newTag"
      placeholder="添加标签"
      @keyup.enter="handleAddTag"
      size="small"
      style="width: 120px"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTaskService } from '../composables/useTaskService';

const props = defineProps<{
  taskUuid: string;
  tags: string[];
}>();

const emit = defineEmits<{
  (e: 'update:tags', tags: string[]): void;
}>();

const { addTag, removeTag } = useTaskService();
const newTag = ref('');

async function handleAddTag() {
  if (!newTag.value.trim()) return;

  await addTag(props.taskUuid, newTag.value);
  emit('update:tags', [...props.tags, newTag.value]);
  newTag.value = '';
}

async function handleRemoveTag(tag: string) {
  await removeTag(props.taskUuid, tag);
  emit(
    'update:tags',
    props.tags.filter((t) => t !== tag),
  );
}
</script>
```

#### **4. 单元测试** (2h)

```typescript
// packages/domain-server/src/task/aggregates/__tests__/TaskTemplate.tags.spec.ts

describe('TaskTemplate - Tag Management', () => {
  it('should add tag', () => {
    const template = TaskTemplate.create({ tags: [] });
    template.addTag('urgent');

    expect(template.tags).toContain('urgent');
  });

  it('should prevent duplicate tags', () => {
    const template = TaskTemplate.create({ tags: ['urgent'] });
    template.addTag('urgent');

    expect(template.tags).toHaveLength(1);
  });

  it('should throw error when exceeding max tags', () => {
    const template = TaskTemplate.create({
      tags: Array(10)
        .fill(0)
        .map((_, i) => `tag${i}`),
    });

    expect(() => template.addTag('tag11')).toThrow(TooManyTagsError);
  });

  it('should remove tag', () => {
    const template = TaskTemplate.create({ tags: ['urgent', 'bug'] });
    template.removeTag('urgent');

    expect(template.tags).not.toContain('urgent');
    expect(template.tags).toContain('bug');
  });

  it('should replace tag', () => {
    const template = TaskTemplate.create({ tags: ['urgent'] });
    template.replaceTag('urgent', 'high-priority');

    expect(template.tags).toContain('high-priority');
    expect(template.tags).not.toContain('urgent');
  });
});
```

---

### **阶段 3: Sprint 2b - 周期性任务 + Node-Cron** (Week 5-6)

**集成 node-cron，完善 RecurrenceRule**：

#### **1. 安装依赖**

```bash
pnpm add node-cron rrule
pnpm add -D @types/node-cron
```

#### **2. 重构 RecurrenceRule** (4h)

```typescript
// packages/domain-server/src/task/value-objects/RecurrenceRule.ts

import { RRule, Frequency } from 'rrule';

export class RecurrenceRule {
  private _rrule: RRule;

  private constructor(rruleOptions: Partial<RRule>) {
    this._rrule = new RRule(rruleOptions);
  }

  static create(config: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval?: number;
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
    monthOfYear?: number; // 1-12
    endDate?: number;
    count?: number; // 最多生成 N 次
  }): RecurrenceRule {
    const rruleConfig: Partial<RRule> = {
      freq: this.mapFrequency(config.frequency),
      interval: config.interval || 1,
    };

    if (config.daysOfWeek) {
      rruleConfig.byweekday = config.daysOfWeek;
    }

    if (config.dayOfMonth) {
      rruleConfig.bymonthday = config.dayOfMonth;
    }

    if (config.endDate) {
      rruleConfig.until = new Date(config.endDate);
    }

    if (config.count) {
      rruleConfig.count = config.count;
    }

    return new RecurrenceRule(rruleConfig);
  }

  private static mapFrequency(freq: string): Frequency {
    const map = {
      DAILY: RRule.DAILY,
      WEEKLY: RRule.WEEKLY,
      MONTHLY: RRule.MONTHLY,
      YEARLY: RRule.YEARLY,
    };
    return map[freq];
  }

  /**
   * 获取指定日期范围内的所有重复日期
   */
  public getDatesInRange(startDate: Date, endDate: Date): Date[] {
    return this._rrule.between(startDate, endDate, true);
  }

  /**
   * 判断指定日期是否应该生成实例
   */
  public shouldGenerateOn(date: Date): boolean {
    const nextOccurrence = this._rrule.after(date, false);
    return nextOccurrence?.toDateString() === date.toDateString();
  }

  /**
   * 转换为 Cron 表达式（用于调度）
   */
  public toCronExpression(): string {
    // 根据 _rrule 生成 cron 表达式
    // 例如: '0 9 * * 1,3,5' (每周一三五 9:00)
  }
}
```

#### **3. 集成 Node-Cron 调度器** (4h)

```typescript
// apps/api/src/modules/task/infrastructure/schedulers/TaskInstanceScheduler.ts

import cron from 'node-cron';
import { TaskTemplateRepository } from '../repositories/TaskTemplateRepository';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskInstanceScheduler');

export class TaskInstanceScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(private taskTemplateRepository: TaskTemplateRepository) {}

  /**
   * 启动所有活跃模板的调度任务
   */
  async start(): Promise<void> {
    const activeTemplates = await this.taskTemplateRepository.findByStatus('ACTIVE');

    for (const template of activeTemplates) {
      if (template.taskType === 'RECURRING' && template.recurrenceRule) {
        this.scheduleTemplate(template);
      }
    }

    logger.info(`Started ${this.jobs.size} task schedulers`);
  }

  /**
   * 为单个模板创建调度任务
   */
  private scheduleTemplate(template: TaskTemplate): void {
    const cronExpression = template.recurrenceRule!.toCronExpression();

    const job = cron.schedule(cronExpression, async () => {
      logger.info(`Generating instance for template ${template.uuid}`);

      try {
        const instance = template.generateInstances(
          Date.now(),
          Date.now() + 86400000, // Next 24 hours
        )[0];

        if (instance) {
          await this.taskInstanceRepository.save(instance);
        }
      } catch (error) {
        logger.error(`Failed to generate instance for ${template.uuid}`, error);
      }
    });

    this.jobs.set(template.uuid, job);
  }

  /**
   * 停止特定模板的调度任务
   */
  public stopTemplate(templateUuid: string): void {
    const job = this.jobs.get(templateUuid);
    if (job) {
      job.stop();
      this.jobs.delete(templateUuid);
    }
  }

  /**
   * 停止所有调度任务
   */
  public stopAll(): void {
    for (const job of this.jobs.values()) {
      job.stop();
    }
    this.jobs.clear();
  }
}
```

---

## 📊 预期成果

### **重构后的代码质量**

| 维度                      | 重构前 | 重构后 | 提升        |
| ------------------------- | ------ | ------ | ----------- |
| **单元测试覆盖率**        | < 5%   | ≥ 80%  | **+75%** ⬆️ |
| **错误处理规范性**        | 3/5    | 5/5    | **+40%** ⬆️ |
| **API 输入验证**          | ❌     | ✅     | **100%** ⬆️ |
| **DomainEvent 使用**      | ❌     | ✅     | **100%** ⬆️ |
| **RecurrenceRule 完整性** | 60%    | 100%   | **+40%** ⬆️ |

### **综合评分**

重构前: **3.8/5** ⭐⭐⭐⭐  
重构后: **4.6/5** ⭐⭐⭐⭐⭐ (优秀)

---

## 📚 参考资料

- **DDD 最佳实践**: [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/)
- **测试金字塔**: [Test Pyramid - Martin Fowler](https://martinfowler.com/bliki/TestPyramid.html)
- **错误处理**: [Error Handling in Node.js](https://nodejs.org/en/docs/guides/error-handling/)
- **RRule 库**: [rrule.js Documentation](https://github.com/jakubroztocil/rrule)
- **Node-Cron**: [node-cron Documentation](https://github.com/node-cron/node-cron)

---

**报告结论**:

✅ **现有代码质量良好**（DDD 架构清晰，类型安全，注释详细）  
⚠️ **主要问题是单元测试不足**（需要立即补充）  
🚀 **可以在现有基础上增量开发**（无需大规模重构）

**建议**: 先完成 **Phase 1 重构 + 测试补充**（2 周），再进入 Sprint 2a 功能开发。

---

**报告生成于**: 2025-10-21  
**下一步**: [制定详细重构和开发排期](./REFACTORING_AND_DEVELOPMENT_ROADMAP.md)
