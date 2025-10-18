# 创建目标流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-18
- **架构模式**: DDD (Goal 模块)
- **相关模块**: Goal, Reminder, Statistics
- **业务场景**: 用户创建新目标（OKR 模式）

---

## 1. 业务概述

### 1.1 业务目标

用户通过提供目标信息（标题、描述、时间范围、关键结果等）创建新目标，系统需要：

- 验证信息的合法性（标题非空、时间范围合理）
- 创建 Goal 聚合根并设置初始状态
- 创建关键结果（KeyResult）实体
- 设置提醒规则（可选）
- 发布领域事件通知相关模块
- 返回完整的目标信息供前端展示

### 1.2 核心原则

- **Goal 模块**：负责目标的完整生命周期管理
- **OKR 模式**：支持目标（Objective）+ 关键结果（Key Results）的管理
- **时间管理**：支持开始/结束日期、剩余天数计算、提醒设置
- **元数据丰富**：支持标签、重要性、紧急性、颜色主题、可行性分析、实现动机
- **事件驱动**：通过领域事件与 Reminder、Statistics 模块解耦

### 1.3 前置条件

- 用户已登录并获得有效的 accountUuid
- 用户提供目标标题（必填）
- （可选）用户提供关键结果列表
- （可选）用户选择所属文件夹

### 1.4 后置条件

- ✅ Goal 聚合根已创建并持久化
- ✅ KeyResult 实体已创建并关联到 Goal
- ✅ 提醒规则已设置（如果提供）
- ✅ 领域事件已发布：`GoalCreatedEvent`
- ✅ 返回 GoalClientDTO（包含完整的目标和关键结果信息）

---

## 2. 架构分层设计

### 2.1 领域模型 (Domain Layer)

#### Goal 模块 (packages/domain-server/goal/)

**聚合根**: `Goal`

**核心属性**:
```typescript
class Goal extends AggregateRoot {
  // 基本信息
  private _accountUuid: string;
  private _title: string;                    // 目标标题（Objective）
  private _description: string | null;       // 详细描述
  private _color: string | null;             // 主题色（hex 格式，如 #FF5733）
  private _feasibilityAnalysis: string | null; // 可行性分析
  private _motivation: string | null;        // 实现动机
  
  // 时间管理
  private _startDate: Date | null;           // 开始日期
  private _endDate: Date | null;             // 结束日期
  private _reminderDays: number[];           // 提醒天数（例如 [7, 3, 1]）
  
  // 关键结果
  private _keyResults: KeyResult[];          // 关键结果集合
  
  // 元数据
  private _importance: ImportanceLevel;      // 重要性等级
  private _urgency: UrgencyLevel;            // 紧急性等级
  private _tags: string[];                   // 标签
  private _customFields: Map<string, any>;   // 自定义字段
  
  // 组织结构
  private _folderUuid: string | null;        // 所属文件夹
  
  // 生命周期
  private _status: GoalStatus;               // 状态（DRAFT|ACTIVE|COMPLETED|ARCHIVED）
  private _createdAt: Date;
  private _updatedAt: Date;
  private _completedAt: Date | null;
  private _archivedAt: Date | null;
}
```

**工厂方法**: `Goal.create()`
```typescript
public static create(params: {
  accountUuid: string;
  title: string;
  description?: string | null;
  color?: string | null;
  feasibilityAnalysis?: string | null;
  motivation?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  reminderDays?: number[];
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  tags?: string[];
  folderUuid?: string | null;
  keyResults?: CreateKeyResultParams[];
}): Goal
```

**业务方法**:
- `addKeyResult(params: CreateKeyResultParams): KeyResult` - 添加关键结果
- `activate(): void` - 激活目标（DRAFT -> ACTIVE）
- `updateTitle(title: string): void` - 更新标题
- `updateDescription(description: string | null): void` - 更新描述
- `updateColor(color: string | null): void` - 更新主题色
- `updateFeasibilityAnalysis(analysis: string | null): void` - 更新可行性分析
- `updateMotivation(motivation: string | null): void` - 更新实现动机
- `moveToFolder(folderUuid: string | null): void` - 移动到文件夹
- `getOverallProgress(): number` - 计算总体进度（基于关键结果）
- `getRemainingDays(): number | null` - 获取剩余天数

**实体**: `KeyResult`
```typescript
class KeyResult extends Entity {
  private _title: string;                    // 关键结果标题
  private _description: string | null;       // 描述
  private _valueType: KeyResultValueType;    // 值类型（INCREMENTAL|ABSOLUTE|PERCENTAGE|BINARY）
  private _targetValue: number;              // 目标值
  private _currentValue: number;             // 当前值
  private _unit: string | null;              // 单位（如 "次"、"小时"、"%" 等）
  private _aggregationMethod: AggregationMethod; // 聚合方式（SUM|AVERAGE|MAX|MIN|LAST）
  private _endDate: Date | null;             // 关键结果截止日期
  private _completedAt: Date | null;
  private _order: number;                    // 排序
}
```

**领域服务**: `GoalDomainService`
- 职责:
  - 验证目标标题合法性
  - 验证时间范围合理性（endDate >= startDate）
  - 验证关键结果配置
  - 计算目标总体进度
  - 判断目标是否过期

**仓储接口**: `IGoalRepository`
```typescript
interface IGoalRepository {
  save(goal: Goal): Promise<void>;
  findByUuid(uuid: string): Promise<Goal | null>;
  findByAccountUuid(accountUuid: string, includeDeleted?: boolean): Promise<Goal[]>;
  findByStatus(accountUuid: string, status: GoalStatus): Promise<Goal[]>;
  findByFolder(folderUuid: string): Promise<Goal[]>;
  existsByTitle(accountUuid: string, title: string): Promise<boolean>;
}
```

---

### 2.2 应用层 (Application Layer)

#### 创建目标应用服务 (apps/api/modules/goal/application/services/)

**服务**: `GoalApplicationService`

**核心用例**: `createGoal()`

**输入 DTO**:
```typescript
interface CreateGoalRequest {
  title: string;                            // 必填，1-256 字符
  description?: string | null;              // 可选
  color?: string | null;                    // 可选，hex 格式如 #FF5733
  feasibilityAnalysis?: string | null;      // 可选，可行性分析
  motivation?: string | null;               // 可选，实现动机
  startDate?: string | null;                // 可选，ISO 8601 格式
  endDate?: string | null;                  // 可选，ISO 8601 格式
  reminderDays?: number[];                  // 可选，例如 [7, 3, 1]
  importance?: ImportanceLevel;             // 可选，默认 MODERATE
  urgency?: UrgencyLevel;                   // 可选，默认 MEDIUM
  tags?: string[];                          // 可选
  folderUuid?: string | null;               // 可选
  keyResults?: Array<{                      // 可选，关键结果列表
    title: string;
    description?: string | null;
    valueType: KeyResultValueType;
    targetValue: number;
    currentValue?: number;
    unit?: string | null;
    endDate?: string | null;
  }>;
}
```

**输出 DTO**:
```typescript
interface CreateGoalResponse {
  goal: GoalClientDTO;
  message: string;
}

interface GoalClientDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description: string | null;
  color: string | null;
  feasibilityAnalysis: string | null;
  motivation: string | null;
  startDate: number | null;                 // timestamp
  endDate: number | null;                   // timestamp
  reminderDays: number[];
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  tags: string[];
  folderUuid: string | null;
  status: GoalStatus;
  keyResults: KeyResultClientDTO[];
  overallProgress: number;                  // 0-100
  remainingDays: number | null;
  createdAt: number;                        // timestamp
  updatedAt: number;                        // timestamp
}
```

**职责**:
1. 参数验证（格式、长度、必填项）
2. 业务规则验证（时间范围、颜色格式）
3. 调用领域服务创建 Goal 聚合根
4. 添加关键结果到 Goal
5. 持久化 Goal
6. 发布领域事件 `GoalCreatedEvent`
7. 返回 GoalClientDTO

---

## 3. 详细流程设计

### 3.1 前端层 (Web - Presentation Layer)

**文件**: `apps/web/src/modules/goal/presentation/components/GoalCreateForm.vue`

**用户交互**:
1. 用户点击"创建目标"按钮
2. 打开目标创建表单模态框
3. 填写必填信息（标题）
4. 填写可选信息（描述、颜色、可行性分析、动机、时间范围、标签等）
5. 添加关键结果（可选）
6. 选择所属文件夹（可选）
7. 点击"创建"按钮

**表单验证**:
```typescript
const validationRules = {
  title: [
    { required: true, message: '请输入目标标题' },
    { min: 1, max: 256, message: '标题长度应在 1-256 字符之间' }
  ],
  color: [
    { pattern: /^#[0-9A-Fa-f]{6}$/, message: '请输入有效的颜色值（如 #FF5733）' }
  ],
  endDate: [
    { validator: (value) => !startDate || !value || new Date(value) >= new Date(startDate), 
      message: '结束日期必须晚于开始日期' }
  ]
};
```

**Composable**: `useGoalCreate()`
```typescript
// apps/web/src/modules/goal/presentation/composables/useGoalCreate.ts
export function useGoalCreate() {
  const goalStore = useGoalStore();
  const isCreating = ref(false);
  const error = ref<string | null>(null);

  async function createGoal(data: CreateGoalRequest) {
    isCreating.value = true;
    error.value = null;

    try {
      // 乐观更新：立即在本地创建临时目标
      const tempGoal = {
        uuid: `temp-${Date.now()}`,
        ...data,
        status: 'DRAFT' as GoalStatus,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        keyResults: data.keyResults || [],
        overallProgress: 0,
        remainingDays: null,
      };
      
      goalStore.addGoalOptimistic(tempGoal);

      // 调用 API
      const response = await goalApiClient.createGoal(data);

      // 成功：用服务器返回的数据替换临时数据
      goalStore.replaceGoal(tempGoal.uuid, response.goal);

      return { success: true, goal: response.goal };
    } catch (err: any) {
      // 失败：回滚乐观更新
      goalStore.removeGoal(tempGoal.uuid);
      error.value = err.message || '创建目标失败';
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  return {
    createGoal,
    isCreating,
    error,
  };
}
```

---

### 3.2 基础设施层 - API 客户端 (Infrastructure Layer)

**文件**: `apps/web/src/modules/goal/infrastructure/api/goalApiClient.ts`

```typescript
import { apiClient } from '@/shared/api/apiClient';
import type { CreateGoalRequest, CreateGoalResponse, GoalClientDTO } from '@daily-use/contracts';

export const goalApiClient = {
  /**
   * 创建新目标
   */
  async createGoal(data: CreateGoalRequest): Promise<CreateGoalResponse> {
    const response = await apiClient.post<CreateGoalResponse>(
      '/api/goals',
      data
    );
    return response.data;
  },

  /**
   * 获取用户所有目标
   */
  async getGoals(accountUuid: string): Promise<GoalClientDTO[]> {
    const response = await apiClient.get<GoalClientDTO[]>(
      `/api/goals?accountUuid=${accountUuid}`
    );
    return response.data;
  },
};
```

---

### 3.3 后端层 - API 路由 (API Layer)

**文件**: `apps/api/src/modules/goal/presentation/routes/goalRoutes.ts`

```typescript
import { Router } from 'express';
import { GoalController } from '../controllers/GoalController';
import { authenticateToken } from '@/shared/middleware/auth';

const router = Router();
const goalController = new GoalController();

// 创建目标
router.post(
  '/goals',
  authenticateToken,
  goalController.createGoal.bind(goalController)
);

// 获取用户目标列表
router.get(
  '/goals',
  authenticateToken,
  goalController.getGoals.bind(goalController)
);

export { router as goalRoutes };
```

---

### 3.4 后端层 - 控制器 (Controller Layer)

**文件**: `apps/api/src/modules/goal/presentation/controllers/GoalController.ts`

```typescript
import { Request, Response } from 'express';
import { GoalApplicationService } from '../../application/services/GoalApplicationService';
import type { CreateGoalRequest } from '@daily-use/contracts';

export class GoalController {
  private goalApplicationService: GoalApplicationService;

  constructor() {
    this.goalApplicationService = GoalApplicationService.getInstance();
  }

  /**
   * 创建目标
   * POST /api/goals
   */
  async createGoal(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = req.user!.accountUuid; // 从 JWT 中获取
      const request: CreateGoalRequest = {
        ...req.body,
        accountUuid, // 注入当前用户
      };

      // 调用应用服务
      const response = await this.goalApplicationService.createGoal(request);

      res.status(201).json(response);
    } catch (error: any) {
      console.error('[GoalController] Create goal error:', error);

      if (error.message.includes('已存在')) {
        res.status(409).json({ error: error.message });
      } else if (error.message.includes('验证失败')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: '创建目标失败' });
      }
    }
  }
}
```

---

### 3.5 后端层 - 应用服务 (Application Service)

**文件**: `apps/api/src/modules/goal/application/services/GoalApplicationService.ts`

```typescript
import { Goal } from '@daily-use/domain-server/goal';
import { IGoalRepository } from '@daily-use/domain-server/goal';
import { GoalDomainService } from '@daily-use/domain-server/goal';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';
import { eventBus } from '@/shared/events/eventBus';
import type { CreateGoalRequest, CreateGoalResponse, GoalClientDTO } from '@daily-use/contracts';

export class GoalApplicationService {
  private static instance: GoalApplicationService;
  private domainService: GoalDomainService;
  private goalRepository: IGoalRepository;

  private constructor(goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService();
    this.goalRepository = goalRepository;
  }

  static async createInstance(
    goalRepository?: IGoalRepository
  ): Promise<GoalApplicationService> {
    const container = GoalContainer.getInstance();
    const repo = goalRepository || container.getGoalRepository();
    GoalApplicationService.instance = new GoalApplicationService(repo);
    return GoalApplicationService.instance;
  }

  static getInstance(): GoalApplicationService {
    if (!GoalApplicationService.instance) {
      throw new Error('GoalApplicationService not initialized');
    }
    return GoalApplicationService.instance;
  }

  /**
   * 创建目标
   */
  async createGoal(request: CreateGoalRequest): Promise<CreateGoalResponse> {
    // 1. 参数验证
    this.validateCreateGoalRequest(request);

    // 2. 检查标题唯一性（可选，根据业务需求）
    const exists = await this.goalRepository.existsByTitle(
      request.accountUuid,
      request.title
    );
    if (exists) {
      throw new Error(`目标标题"${request.title}"已存在`);
    }

    // 3. 验证时间范围
    if (request.startDate && request.endDate) {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      if (end < start) {
        throw new Error('结束日期必须晚于开始日期');
      }
    }

    // 4. 验证颜色格式
    if (request.color && !/^#[0-9A-Fa-f]{6}$/.test(request.color)) {
      throw new Error('无效的颜色格式，请使用 hex 格式（如 #FF5733）');
    }

    // 5. 使用领域服务创建 Goal 聚合根
    const goal = Goal.create({
      accountUuid: request.accountUuid,
      title: request.title,
      description: request.description || null,
      color: request.color || null,
      feasibilityAnalysis: request.feasibilityAnalysis || null,
      motivation: request.motivation || null,
      startDate: request.startDate ? new Date(request.startDate) : null,
      endDate: request.endDate ? new Date(request.endDate) : null,
      reminderDays: request.reminderDays || [],
      importance: request.importance || 'MODERATE',
      urgency: request.urgency || 'MEDIUM',
      tags: request.tags || [],
      folderUuid: request.folderUuid || null,
      keyResults: request.keyResults || [],
    });

    // 6. 持久化
    await this.goalRepository.save(goal);

    // 7. 发布领域事件
    eventBus.publish({
      eventType: 'GoalCreatedEvent',
      aggregateId: goal.uuid,
      aggregateName: 'Goal',
      occurredOn: new Date(),
      payload: {
        accountUuid: goal.accountUuid,
        goalUuid: goal.uuid,
        title: goal.title,
        endDate: goal.endDate,
        reminderDays: goal.reminderDays,
      },
    });

    // 8. 返回 ClientDTO
    return {
      goal: goal.toClientDTO(true), // includeChildren = true
      message: '目标创建成功',
    };
  }

  private validateCreateGoalRequest(request: CreateGoalRequest): void {
    if (!request.accountUuid) {
      throw new Error('accountUuid is required');
    }
    if (!request.title || request.title.trim().length === 0) {
      throw new Error('标题不能为空');
    }
    if (request.title.length > 256) {
      throw new Error('标题长度不能超过 256 字符');
    }
  }
}
```

---

### 3.6 后端层 - 仓储实现 (Infrastructure Layer)

**文件**: `apps/api/src/modules/goal/infrastructure/persistence/GoalRepository.ts`

```typescript
import { IGoalRepository, Goal } from '@daily-use/domain-server/goal';
import { prisma } from '@/shared/database/prisma';
import type { GoalPersistenceDTO } from '@daily-use/contracts';

export class GoalRepository implements IGoalRepository {
  async save(goal: Goal): Promise<void> {
    const dto = goal.toPersistenceDTO();

    await prisma.goal.upsert({
      where: { uuid: dto.uuid },
      create: {
        uuid: dto.uuid,
        accountUuid: dto.accountUuid,
        title: dto.title,
        description: dto.description,
        color: dto.color,
        feasibilityAnalysis: dto.feasibilityAnalysis,
        motivation: dto.motivation,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        reminderDays: dto.reminderDays,
        importance: dto.importance,
        urgency: dto.urgency,
        tags: dto.tags,
        folderUuid: dto.folderUuid,
        status: dto.status,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      },
      update: {
        title: dto.title,
        description: dto.description,
        color: dto.color,
        feasibilityAnalysis: dto.feasibilityAnalysis,
        motivation: dto.motivation,
        // ... 其他字段
        updatedAt: new Date(dto.updatedAt),
      },
    });

    // 保存关键结果
    for (const kr of dto.keyResults) {
      await prisma.keyResult.upsert({
        where: { uuid: kr.uuid },
        create: { ...kr, goalUuid: dto.uuid },
        update: kr,
      });
    }
  }

  async findByUuid(uuid: string): Promise<Goal | null> {
    const record = await prisma.goal.findUnique({
      where: { uuid },
      include: { keyResults: true },
    });

    if (!record) return null;

    return Goal.fromPersistenceDTO({
      ...record,
      startDate: record.startDate?.getTime() || null,
      endDate: record.endDate?.getTime() || null,
      createdAt: record.createdAt.getTime(),
      updatedAt: record.updatedAt.getTime(),
      completedAt: record.completedAt?.getTime() || null,
      archivedAt: record.archivedAt?.getTime() || null,
      keyResults: record.keyResults.map(kr => ({
        ...kr,
        endDate: kr.endDate?.getTime() || null,
        completedAt: kr.completedAt?.getTime() || null,
        createdAt: kr.createdAt.getTime(),
        updatedAt: kr.updatedAt.getTime(),
      })),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<Goal[]> {
    const records = await prisma.goal.findMany({
      where: { accountUuid, status: { not: 'DELETED' } },
      include: { keyResults: true },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(record => Goal.fromPersistenceDTO({
      ...record,
      startDate: record.startDate?.getTime() || null,
      endDate: record.endDate?.getTime() || null,
      createdAt: record.createdAt.getTime(),
      updatedAt: record.updatedAt.getTime(),
      completedAt: record.completedAt?.getTime() || null,
      archivedAt: record.archivedAt?.getTime() || null,
      keyResults: record.keyResults.map(kr => ({
        ...kr,
        endDate: kr.endDate?.getTime() || null,
        completedAt: kr.completedAt?.getTime() || null,
        createdAt: kr.createdAt.getTime(),
        updatedAt: kr.updatedAt.getTime(),
      })),
    }));
  }

  async existsByTitle(accountUuid: string, title: string): Promise<boolean> {
    const count = await prisma.goal.count({
      where: {
        accountUuid,
        title,
        status: { not: 'DELETED' },
      },
    });
    return count > 0;
  }

  async findByStatus(accountUuid: string, status: string): Promise<Goal[]> {
    // 实现略...
    return [];
  }

  async findByFolder(folderUuid: string): Promise<Goal[]> {
    // 实现略...
    return [];
  }
}
```

---

## 4. 领域事件设计

### 4.1 GoalCreatedEvent

**事件定义**:
```typescript
interface GoalCreatedEvent {
  eventType: 'GoalCreatedEvent';
  aggregateId: string;           // goalUuid
  aggregateName: 'Goal';
  occurredOn: Date;
  payload: {
    accountUuid: string;
    goalUuid: string;
    title: string;
    endDate: Date | null;
    reminderDays: number[];
  };
}
```

**事件订阅者**:

1. **Reminder 模块**（创建提醒任务）
```typescript
// apps/api/src/modules/reminder/initialization/eventHandlers.ts
eventBus.on('GoalCreatedEvent', async (event: GoalCreatedEvent) => {
  const { goalUuid, endDate, reminderDays } = event.payload;
  
  if (endDate && reminderDays.length > 0) {
    for (const days of reminderDays) {
      const triggerDate = new Date(endDate);
      triggerDate.setDate(triggerDate.getDate() - days);
      
      await reminderService.createReminder({
        entityType: 'Goal',
        entityUuid: goalUuid,
        triggerDate,
        message: `目标还有 ${days} 天到期`,
      });
    }
  }
});
```

2. **Statistics 模块**（更新统计数据）
```typescript
eventBus.on('GoalCreatedEvent', async (event: GoalCreatedEvent) => {
  await statisticsService.incrementGoalCount(event.payload.accountUuid);
});
```

---

## 5. 数据库模型设计

### 5.1 Prisma Schema

```prisma
model Goal {
  uuid                  String       @id @default(uuid())
  accountUuid           String
  title                 String       @db.VarChar(256)
  description           String?      @db.Text
  color                 String?      @db.VarChar(7)    // #RRGGBB
  feasibilityAnalysis   String?      @db.Text
  motivation            String?      @db.Text
  startDate             DateTime?
  endDate               DateTime?
  reminderDays          Int[]
  importance            String       @default("MODERATE")
  urgency               String       @default("MEDIUM")
  tags                  String[]
  folderUuid            String?
  status                String       @default("DRAFT")
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt
  completedAt           DateTime?
  archivedAt            DateTime?

  // 关系
  account               Account      @relation(fields: [accountUuid], references: [uuid])
  folder                GoalFolder?  @relation(fields: [folderUuid], references: [uuid])
  keyResults            KeyResult[]

  @@index([accountUuid])
  @@index([status])
  @@index([folderUuid])
  @@map("goals")
}

model KeyResult {
  uuid                  String       @id @default(uuid())
  goalUuid              String
  title                 String       @db.VarChar(256)
  description           String?      @db.Text
  valueType             String       // INCREMENTAL|ABSOLUTE|PERCENTAGE|BINARY
  targetValue           Float
  currentValue          Float        @default(0)
  unit                  String?      @db.VarChar(50)
  aggregationMethod     String       @default("SUM")
  endDate               DateTime?
  completedAt           DateTime?
  order                 Int          @default(0)
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  // 关系
  goal                  Goal         @relation(fields: [goalUuid], references: [uuid], onDelete: Cascade)

  @@index([goalUuid])
  @@map("key_results")
}
```

---

## 6. 错误处理

### 6.1 常见错误场景

| 错误场景     | HTTP 状态码 | 错误信息                 | 处理方式            |
| ------------ | ----------- | ------------------------ | ------------------- |
| 标题为空     | 400         | 标题不能为空             | 前端校验 + 后端验证 |
| 标题重复     | 409         | 目标标题已存在           | 后端检查唯一性      |
| 时间范围无效 | 400         | 结束日期必须晚于开始日期 | 前端校验 + 后端验证 |
| 颜色格式错误 | 400         | 无效的颜色格式           | 前端校验 + 后端验证 |
| 文件夹不存在 | 404         | 指定的文件夹不存在       | 后端检查外键        |
| 网络错误     | 500         | 创建目标失败             | 前端回滚乐观更新    |

### 6.2 乐观更新回滚机制

```typescript
// 前端乐观更新失败处理
try {
  const tempGoal = createTempGoal(data);
  goalStore.addGoalOptimistic(tempGoal);
  
  const response = await goalApiClient.createGoal(data);
  goalStore.replaceGoal(tempGoal.uuid, response.goal);
} catch (error) {
  // 回滚乐观更新
  goalStore.removeGoal(tempGoal.uuid);
  
  // 显示错误提示
  ElMessage.error(error.message || '创建失败');
  
  // 记录错误日志
  console.error('[CreateGoal] Error:', error);
}
```

---

## 7. 测试用例

### 7.1 单元测试（领域层）

```typescript
describe('Goal.create()', () => {
  it('should create goal with valid data', () => {
    const goal = Goal.create({
      accountUuid: 'acc-123',
      title: 'Learn TypeScript',
      description: 'Master TypeScript in 3 months',
      color: '#FF5733',
      feasibilityAnalysis: 'High feasibility with online resources',
      motivation: 'Career advancement',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      importance: 'VITAL',
      urgency: 'HIGH',
    });

    expect(goal.title).toBe('Learn TypeScript');
    expect(goal.color).toBe('#FF5733');
    expect(goal.status).toBe('DRAFT');
  });

  it('should throw error when title is empty', () => {
    expect(() => {
      Goal.create({
        accountUuid: 'acc-123',
        title: '',
      });
    }).toThrow('标题不能为空');
  });

  it('should calculate overall progress correctly', () => {
    const goal = Goal.create({
      accountUuid: 'acc-123',
      title: 'Test Goal',
    });

    goal.addKeyResult({
      title: 'KR1',
      valueType: 'PERCENTAGE',
      targetValue: 100,
      currentValue: 50,
    });

    goal.addKeyResult({
      title: 'KR2',
      valueType: 'PERCENTAGE',
      targetValue: 100,
      currentValue: 80,
    });

    expect(goal.getOverallProgress()).toBe(65); // (50 + 80) / 2
  });
});
```

### 7.2 集成测试（应用层）

```typescript
describe('GoalApplicationService.createGoal()', () => {
  it('should create goal and publish event', async () => {
    const request: CreateGoalRequest = {
      accountUuid: 'acc-123',
      title: 'Test Goal',
      color: '#FF5733',
      feasibilityAnalysis: 'Feasible',
      motivation: 'Learning',
    };

    const response = await service.createGoal(request);

    expect(response.goal.uuid).toBeDefined();
    expect(response.goal.title).toBe('Test Goal');
    expect(response.goal.color).toBe('#FF5733');
    expect(eventBus.events).toContainEqual(
      expect.objectContaining({ eventType: 'GoalCreatedEvent' })
    );
  });
});
```

---

## 8. 性能优化

### 8.1 数据库查询优化

- 添加索引：accountUuid, status, folderUuid
- 使用 `include` 批量加载关键结果
- 分页查询（前端虚拟滚动）

### 8.2 缓存策略

- Redis 缓存用户的活跃目标列表（TTL 5 分钟）
- 前端状态管理缓存（Pinia Store）

---

## 9. 安全考虑

- **权限控制**: 只能创建/查看自己的目标
- **输入验证**: 防止 XSS（标题、描述）
- **速率限制**: 每用户每分钟最多创建 10 个目标

---

## 10. 未来扩展

- 支持目标模板（快速创建）
- 支持目标依赖关系（前置目标）
- 支持目标分享与协作
- AI 辅助生成可行性分析和实现动机

---

## 11. 参考文档

- [Goal 模块设计规划](../GOAL_MODULE_PLAN.md)
- [DDD 架构规范](../../DDD规范.md)
- [用户注册流程](../../auth-flows/USER_REGISTRATION_FLOW.md)
