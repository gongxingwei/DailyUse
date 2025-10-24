# STORY-GOAL-002-003: KR 权重快照 - Repository & Infrastructure

> **Story ID**: STORY-GOAL-002-003  
> **Epic**: EPIC-GOAL-002 - KR 权重快照  
> **Sprint**: Sprint 2a  
> **Story Points**: 3 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Backend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 后端开发者  
**我想要** 实现权重快照的持久化层  
**以便于** 将快照数据安全地存储到数据库

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: Prisma Schema 定义

```gherkin
Scenario: 添加 KeyResultWeightSnapshot 表
  Given 需要持久化权重快照数据
  When 更新 Prisma schema
  Then 应该定义 KeyResultWeightSnapshot model
  And 应该包含所有必需字段
  And 应该定义与 Goal 和 KeyResult 的关联关系
  And 应该添加必要的索引 (goalUuid, keyResultUuid, snapshotTime)

  Examples: Prisma Model 字段
  | Field           | Type     | Constraint        |
  | uuid            | String   | @id @default(uuid()) |
  | goalUuid        | String   |                   |
  | keyResultUuid   | String   |                   |
  | oldWeight       | Float    |                   |
  | newWeight       | Float    |                   |
  | weightDelta     | Float    |                   |
  | snapshotTime    | BigInt   |                   |
  | trigger         | String   |                   |
  | reason          | String?  | @optional         |
  | operatorUuid    | String   |                   |
  | createdAt       | DateTime | @default(now())   |
```

### Scenario 2: 数据库迁移

```gherkin
Scenario: 生成并执行数据库迁移
  Given Prisma schema 已更新
  When 运行 prisma migrate dev
  Then 应该生成迁移文件
  And 应该执行迁移成功
  And 数据库表结构应该正确创建

Scenario: 回滚测试
  Given 数据库迁移已执行
  When 需要回滚
  Then 应该能成功回滚迁移
  And 表应该被删除
```

### Scenario 3: 实现 WeightSnapshotRepository

```gherkin
Scenario: 实现 save() 方法
  Given 一个 KeyResultWeightSnapshot 实例
  When 调用 repository.save(snapshot)
  Then 应该插入数据到数据库
  And 应该返回保存成功

Scenario: 实现 findByGoal() 方法
  Given 一个 Goal 有多个快照
  When 调用 repository.findByGoal(goalUuid, page, pageSize)
  Then 应该返回该 Goal 的快照列表
  And 应该按 snapshotTime 倒序排序
  And 应该支持分页
  And 应该返回总数

Scenario: 实现 findByKeyResult() 方法
  Given 一个 KeyResult 有多个快照
  When 调用 repository.findByKeyResult(krUuid, page, pageSize)
  Then 应该返回该 KR 的快照列表
  And 应该按 snapshotTime 倒序排序

Scenario: 实现 findByTimeRange() 方法
  Given 数据库有多个时间点的快照
  When 调用 repository.findByTimeRange(startTime, endTime)
  Then 应该返回时间范围内的快照
  And 应该包含边界值
```

### Scenario 4: Prisma Mapper 实现

```gherkin
Scenario: Domain 转 Prisma Model
  Given 一个 KeyResultWeightSnapshot 域对象
  When 调用 mapper.toPrisma(snapshot)
  Then 应该转换为 Prisma create input
  And 所有字段应该正确映射

Scenario: Prisma Model 转 Domain
  Given 一个 Prisma 查询结果
  When 调用 mapper.toDomain(prismaSnapshot)
  Then 应该转换为 KeyResultWeightSnapshot 实例
  And 所有字段应该正确恢复
```

### Scenario 5: 编写集成测试

```gherkin
Scenario: 测试完整持久化流程
  Given 一个测试数据库
  When 创建并保存快照
  Then 可以从数据库查询到该快照
  And 查询结果与原始数据一致

Scenario: 测试分页查询
  Given 数据库有 50 个快照
  When 查询第 2 页，每页 20 条
  Then 应该返回第 21-40 条记录
  And total 应该等于 50

Scenario: 测试时间范围查询
  Given 数据库有不同时间的快照
  When 查询 2025-01-01 到 2025-12-31 范围
  Then 应该只返回该范围内的快照
  And 不包含范围外的快照
```

---

## 📋 任务清单 (Task Breakdown)

### Prisma Schema 任务

- [ ] **Task 1.1**: 更新 `apps/api/prisma/schema.prisma`
  - [ ] 定义 `KeyResultWeightSnapshot` model
  - [ ] 添加所有字段定义
  - [ ] 定义关联关系 (Goal, KeyResult)
  - [ ] 添加索引:
    - `@@index([goalUuid])`
    - `@@index([keyResultUuid])`
    - `@@index([snapshotTime])`
    - `@@index([goalUuid, snapshotTime])`

- [ ] **Task 1.2**: 生成数据库迁移
  - [ ] 运行 `pnpm prisma migrate dev --name add_weight_snapshot`
  - [ ] 检查生成的 SQL 迁移文件
  - [ ] 测试迁移执行

- [ ] **Task 1.3**: 测试数据库迁移
  - [ ] 在本地数据库执行迁移
  - [ ] 验证表结构正确
  - [ ] 测试回滚 (如需要)

### Repository 实现任务

- [ ] **Task 2.1**: 创建 Repository 接口
  - [ ] 创建 `apps/api/src/domain/goal/repositories/WeightSnapshotRepository.ts`
  - [ ] 定义接口方法签名:
    - `save(snapshot: KeyResultWeightSnapshot): Promise<void>`
    - `findByGoal(goalUuid: string, page: number, pageSize: number): Promise<{ snapshots: KeyResultWeightSnapshot[]; total: number }>`
    - `findByKeyResult(krUuid: string, page: number, pageSize: number): Promise<{ snapshots: KeyResultWeightSnapshot[]; total: number }>`
    - `findByTimeRange(startTime: number, endTime: number, page: number, pageSize: number): Promise<{ snapshots: KeyResultWeightSnapshot[]; total: number }>`

- [ ] **Task 2.2**: 创建 Prisma Mapper
  - [ ] 创建 `apps/api/src/infrastructure/goal/PrismaWeightSnapshotMapper.ts`
  - [ ] 实现 `toPrisma(snapshot: KeyResultWeightSnapshot)`
  - [ ] 实现 `toDomain(prismaSnapshot: PrismaWeightSnapshot)`
  - [ ] 处理类型转换 (BigInt, Date, etc.)

- [ ] **Task 2.3**: 实现 Prisma Repository
  - [ ] 创建 `apps/api/src/infrastructure/goal/PrismaWeightSnapshotRepository.ts`
  - [ ] 实现 save() 方法 (使用 prisma.create)
  - [ ] 实现 findByGoal() 方法 (分页 + 排序)
  - [ ] 实现 findByKeyResult() 方法
  - [ ] 实现 findByTimeRange() 方法
  - [ ] 添加错误处理

### 测试任务

- [ ] **Task 3.1**: 编写单元测试
  - [ ] 测试 PrismaWeightSnapshotMapper
  - [ ] 测试 toPrisma() 转换
  - [ ] 测试 toDomain() 转换

- [ ] **Task 3.2**: 编写集成测试
  - [ ] 创建 `__tests__/PrismaWeightSnapshotRepository.integration.test.ts`
  - [ ] 测试 save() 方法
  - [ ] 测试 findByGoal() 方法 (分页)
  - [ ] 测试 findByKeyResult() 方法
  - [ ] 测试 findByTimeRange() 方法
  - [ ] 测试边界条件 (空结果、大数据量)

---

## 🔧 技术实现细节

### Prisma Schema

**apps/api/prisma/schema.prisma** (新增部分):

```prisma
model KeyResultWeightSnapshot {
  uuid            String   @id @default(uuid())
  goalUuid        String
  keyResultUuid   String
  oldWeight       Float
  newWeight       Float
  weightDelta     Float
  snapshotTime    BigInt   // 使用 BigInt 存储毫秒时间戳
  trigger         String   // 'manual' | 'auto' | 'restore' | 'import'
  reason          String?
  operatorUuid    String
  createdAt       DateTime @default(now())

  // 关联关系
  goal          Goal       @relation(fields: [goalUuid], references: [uuid], onDelete: Cascade)
  keyResult     KeyResult  @relation(fields: [keyResultUuid], references: [uuid], onDelete: Cascade)

  // 索引
  @@index([goalUuid])
  @@index([keyResultUuid])
  @@index([snapshotTime])
  @@index([goalUuid, snapshotTime])
  @@map("key_result_weight_snapshots")
}
```

### Repository 接口

**apps/api/src/domain/goal/repositories/WeightSnapshotRepository.ts**:

```typescript
import type { KeyResultWeightSnapshot } from '@dailyuse/domain-server';

export interface SnapshotQueryResult {
  snapshots: KeyResultWeightSnapshot[];
  total: number;
}

export interface WeightSnapshotRepository {
  /**
   * 保存权重快照
   */
  save(snapshot: KeyResultWeightSnapshot): Promise<void>;

  /**
   * 查询 Goal 的所有快照
   */
  findByGoal(goalUuid: string, page: number, pageSize: number): Promise<SnapshotQueryResult>;

  /**
   * 查询 KeyResult 的所有快照
   */
  findByKeyResult(krUuid: string, page: number, pageSize: number): Promise<SnapshotQueryResult>;

  /**
   * 查询时间范围内的快照
   */
  findByTimeRange(
    startTime: number,
    endTime: number,
    page: number,
    pageSize: number,
  ): Promise<SnapshotQueryResult>;
}
```

### Prisma Mapper

**apps/api/src/infrastructure/goal/PrismaWeightSnapshotMapper.ts**:

```typescript
import { KeyResultWeightSnapshot } from '@dailyuse/domain-server';
import type { KeyResultWeightSnapshot as PrismaSnapshot } from '@prisma/client';
import type { SnapshotTrigger } from '@dailyuse/contracts';

export class PrismaWeightSnapshotMapper {
  /**
   * Domain 转 Prisma
   */
  static toPrisma(snapshot: KeyResultWeightSnapshot) {
    return {
      uuid: snapshot.uuid,
      goalUuid: snapshot.goalUuid,
      keyResultUuid: snapshot.keyResultUuid,
      oldWeight: snapshot.oldWeight,
      newWeight: snapshot.newWeight,
      weightDelta: snapshot.weightDelta,
      snapshotTime: BigInt(snapshot.snapshotTime),
      trigger: snapshot.trigger,
      reason: snapshot.reason ?? null,
      operatorUuid: snapshot.operatorUuid,
      createdAt: new Date(snapshot.createdAt ?? Date.now()),
    };
  }

  /**
   * Prisma 转 Domain
   */
  static toDomain(prismaSnapshot: PrismaSnapshot): KeyResultWeightSnapshot {
    return new KeyResultWeightSnapshot(
      prismaSnapshot.uuid,
      prismaSnapshot.goalUuid,
      prismaSnapshot.keyResultUuid,
      prismaSnapshot.oldWeight,
      prismaSnapshot.newWeight,
      Number(prismaSnapshot.snapshotTime),
      prismaSnapshot.trigger as SnapshotTrigger,
      prismaSnapshot.operatorUuid,
      prismaSnapshot.reason ?? undefined,
      prismaSnapshot.createdAt.getTime(),
    );
  }
}
```

### Prisma Repository 实现

**apps/api/src/infrastructure/goal/PrismaWeightSnapshotRepository.ts**:

```typescript
import { PrismaClient } from '@prisma/client';
import type {
  WeightSnapshotRepository,
  SnapshotQueryResult,
} from '../../domain/goal/repositories/WeightSnapshotRepository';
import { KeyResultWeightSnapshot } from '@dailyuse/domain-server';
import { PrismaWeightSnapshotMapper } from './PrismaWeightSnapshotMapper';

export class PrismaWeightSnapshotRepository implements WeightSnapshotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(snapshot: KeyResultWeightSnapshot): Promise<void> {
    const data = PrismaWeightSnapshotMapper.toPrisma(snapshot);
    await this.prisma.keyResultWeightSnapshot.create({ data });
  }

  async findByGoal(
    goalUuid: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotQueryResult> {
    const skip = (page - 1) * pageSize;

    const [snapshots, total] = await Promise.all([
      this.prisma.keyResultWeightSnapshot.findMany({
        where: { goalUuid },
        orderBy: { snapshotTime: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.keyResultWeightSnapshot.count({
        where: { goalUuid },
      }),
    ]);

    return {
      snapshots: snapshots.map(PrismaWeightSnapshotMapper.toDomain),
      total,
    };
  }

  async findByKeyResult(
    krUuid: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotQueryResult> {
    const skip = (page - 1) * pageSize;

    const [snapshots, total] = await Promise.all([
      this.prisma.keyResultWeightSnapshot.findMany({
        where: { keyResultUuid: krUuid },
        orderBy: { snapshotTime: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.keyResultWeightSnapshot.count({
        where: { keyResultUuid: krUuid },
      }),
    ]);

    return {
      snapshots: snapshots.map(PrismaWeightSnapshotMapper.toDomain),
      total,
    };
  }

  async findByTimeRange(
    startTime: number,
    endTime: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotQueryResult> {
    const skip = (page - 1) * pageSize;

    const [snapshots, total] = await Promise.all([
      this.prisma.keyResultWeightSnapshot.findMany({
        where: {
          snapshotTime: {
            gte: BigInt(startTime),
            lte: BigInt(endTime),
          },
        },
        orderBy: { snapshotTime: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.keyResultWeightSnapshot.count({
        where: {
          snapshotTime: {
            gte: BigInt(startTime),
            lte: BigInt(endTime),
          },
        },
      }),
    ]);

    return {
      snapshots: snapshots.map(PrismaWeightSnapshotMapper.toDomain),
      total,
    };
  }
}
```

---

## ✅ Definition of Done

### 功能完整性

- [ ] Prisma Schema 更新完成
- [ ] 数据库迁移成功执行
- [ ] WeightSnapshotRepository 接口定义完成
- [ ] PrismaWeightSnapshotRepository 实现完成
- [ ] PrismaWeightSnapshotMapper 实现完成
- [ ] 所有 Repository 方法实现并测试

### 代码质量

- [ ] TypeScript strict 模式无错误
- [ ] ESLint 无警告
- [ ] 所有公共方法有 JSDoc 注释
- [ ] 单元测试覆盖率 ≥ 80%

### 测试

- [ ] 单元测试通过 (Mapper)
- [ ] 集成测试通过 (Repository)
- [ ] 测试覆盖分页、排序、时间范围查询
- [ ] 测试覆盖边界条件

### 数据库

- [ ] 迁移文件已生成
- [ ] 迁移在本地环境执行成功
- [ ] 表结构与 Prisma Schema 一致
- [ ] 索引创建正确

### Code Review

- [ ] Code Review 完成
- [ ] Code Review 反馈已解决

---

## 📊 预估时间

| 任务                | 预估时间   |
| ------------------- | ---------- |
| Prisma Schema 设计  | 1 小时     |
| 数据库迁移          | 0.5 小时   |
| Repository 接口定义 | 0.5 小时   |
| Mapper 实现         | 1 小时     |
| Repository 实现     | 2 小时     |
| 单元测试            | 1 小时     |
| 集成测试            | 2 小时     |
| Code Review & 修复  | 1 小时     |
| **总计**            | **9 小时** |

**Story Points**: 3 SP

---

## 🔗 依赖关系

### 上游依赖

- STORY-GOAL-002-001 (Contracts & Domain 层) - 必须完成

### 下游依赖

- STORY-GOAL-002-002 (Application Service) 需要此 Story 提供 Repository
- STORY-GOAL-002-004 (API Endpoints) 间接依赖

---

## 🚨 风险与注意事项

### 技术风险

1. **BigInt 处理**: Prisma BigInt 与 JavaScript Number 转换
   - 缓解: 使用 Number() 显式转换，注意精度损失
2. **迁移失败**: 数据库迁移可能因权限或锁问题失败
   - 缓解: 在测试环境先验证，准备回滚脚本
3. **索引性能**: 多个索引可能影响写入性能
   - 缓解: 监控写入性能，必要时调整索引策略

### 数据风险

1. **级联删除**: Goal 或 KR 删除时快照是否删除
   - 决策: 使用 onDelete: Cascade，快照随 Goal 删除

---

**Story 创建日期**: 2025-10-22  
**Story 创建者**: SM  
**最后更新**: 2025-10-22
