# DDD聚合根数据库优化方案

## 问题分析

当前数据库设计在子实体中存在冗余的 `accountUuid` 字段，违反了DDD聚合根控制原则。

### 当前设计问题

```prisma
// ❌ 当前设计 - 存在冗余
model KeyResult {
  uuid        String @id
  accountUuid String  // 冗余 - 可通过Goal获取
  goalUuid    String  // 正确 - 聚合根关联
  // ...
}

model GoalRecord {
  uuid          String @id
  accountUuid   String  // 冗余 - 可通过KeyResult→Goal获取
  goalUuid      String  // 冗余 - 可通过KeyResult获取
  keyResultUuid String  // 正确 - 直接父实体关联
  // ...
}

model GoalReview {
  uuid     String @id
  goalUuid String  // ✅ 正确 - 直接关联聚合根
  // ...
}
```

## 优化方案

### 1. 理想的DDD设计

```prisma
// ✅ 优化后设计 - 符合DDD聚合根原则
model KeyResult {
  uuid     String @id @default(cuid())
  goalUuid String @map("goal_uuid")  // 只保留聚合根关联
  
  // 基本信息
  name        String
  description String?
  // ... 其他业务字段
  
  // Relations
  goal    Goal         @relation(fields: [goalUuid], references: [uuid], onDelete: Cascade)
  records GoalRecord[]
  
  @@index([goalUuid])
  @@map("key_results")
}

model GoalRecord {
  uuid          String @id @default(cuid())
  keyResultUuid String @map("key_result_uuid")  // 只保留直接父实体关联
  
  value Float
  note  String?
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relations
  keyResult KeyResult @relation(fields: [keyResultUuid], references: [uuid], onDelete: Cascade)
  
  @@index([keyResultUuid])
  @@index([createdAt])
  @@map("goal_records")
}

model GoalReview {
  uuid     String @id @default(cuid())
  goalUuid String @map("goal_uuid")  // ✅ 已经正确
  
  // ... 其他字段保持不变
  
  // Relations
  goal Goal @relation(fields: [goalUuid], references: [uuid], onDelete: Cascade)
  
  @@index([goalUuid])
  @@map("goal_reviews")
}
```

### 2. 权限控制查询模式

```sql
-- 查询用户的关键结果
SELECT kr.* FROM key_results kr
JOIN goals g ON kr.goal_uuid = g.uuid
WHERE g.account_uuid = $accountUuid;

-- 查询用户的目标记录
SELECT gr.* FROM goal_records gr
JOIN key_results kr ON gr.key_result_uuid = kr.uuid
JOIN goals g ON kr.goal_uuid = g.uuid
WHERE g.account_uuid = $accountUuid;

-- 查询用户的目标复盘 (已经正确)
SELECT rev.* FROM goal_reviews rev
JOIN goals g ON rev.goal_uuid = g.uuid
WHERE g.account_uuid = $accountUuid;
```

## 实施步骤

### 阶段1: 数据库迁移脚本

```sql
-- 1. 移除冗余索引
DROP INDEX IF EXISTS key_results_account_uuid_idx;
DROP INDEX IF EXISTS goal_records_account_uuid_idx;
DROP INDEX IF EXISTS goal_records_goal_uuid_idx;

-- 2. 移除冗余字段
ALTER TABLE key_results DROP COLUMN account_uuid;
ALTER TABLE goal_records DROP COLUMN account_uuid;
ALTER TABLE goal_records DROP COLUMN goal_uuid;

-- 3. 移除冗余外键约束
ALTER TABLE key_results DROP CONSTRAINT key_results_account_uuid_fkey;
ALTER TABLE goal_records DROP CONSTRAINT goal_records_account_uuid_fkey;
ALTER TABLE goal_records DROP CONSTRAINT goal_records_goal_uuid_fkey;
```

### 阶段2: Prisma Schema更新

更新 `apps/api/prisma/schema.prisma` 以反映新的设计。

### 阶段3: 仓储层适配

更新 `PrismaGoalRepository` 中的查询逻辑，使用JOIN查询替代直接的accountUuid过滤。

```typescript
// ✅ 优化后的查询
async getKeyResultsByGoalUuid(accountUuid: string, goalUuid: string): Promise<KeyResultDTO[]> {
  const keyResults = await this.prisma.keyResult.findMany({
    where: {
      goalUuid,
      goal: {
        accountUuid, // 通过关联验证权限
      },
    },
  });
  
  return keyResults.map(kr => this.mapKeyResultToDTO(kr));
}

async getGoalRecordsByKeyResultUuid(accountUuid: string, keyResultUuid: string): Promise<GoalRecordDTO[]> {
  const records = await this.prisma.goalRecord.findMany({
    where: {
      keyResultUuid,
      keyResult: {
        goal: {
          accountUuid, // 通过两层关联验证权限
        },
      },
    },
  });
  
  return records.map(record => this.mapGoalRecordToDTO(record));
}
```

### 阶段4: DTO接口更新

更新Contracts中的DTO定义，移除冗余的accountUuid字段。

```typescript
// packages/contracts/src/modules/goal/dtos.ts

// ✅ 优化后的DTO
export interface KeyResultDTO {
  uuid: string;
  goalUuid: string;  // 只保留聚合根关联
  name: string;
  // ... 其他字段
  // ❌ 移除: accountUuid: string;
}

export interface GoalRecordDTO {
  uuid: string;
  keyResultUuid: string;  // 只保留直接父实体关联
  value: number;
  // ... 其他字段
  // ❌ 移除: accountUuid: string;
  // ❌ 移除: goalUuid: string;
}
```

## 优势分析

### 1. **符合DDD原则**
- 清晰的聚合边界
- 减少数据冗余
- 强化聚合根控制

### 2. **提升数据一致性**
- 单一数据源原则
- 减少数据不一致风险
- 简化数据维护

### 3. **简化业务逻辑**
- 权限控制逻辑集中在聚合根
- 减少字段同步复杂度
- 提高代码可维护性

### 4. **性能优化**
- 减少冗余字段存储空间
- 减少不必要的索引
- 简化查询条件

## 注意事项

### 1. **查询性能**
- JOIN查询可能比直接字段查询稍慢
- 需要适当的索引策略
- 考虑查询缓存优化

### 2. **迁移风险**
- 需要完整的数据备份
- 逐步迁移，确保兼容性
- 充分测试所有查询路径

### 3. **代码适配**
- 更新所有相关的仓储方法
- 修改DTO映射逻辑
- 更新单元测试

## 实施建议

1. **优先级**: 中等 - 不影响核心功能，但提升架构质量
2. **时机**: 在下一个主要版本中实施
3. **策略**: 分阶段实施，确保向后兼容
4. **测试**: 重点测试权限控制和数据完整性
