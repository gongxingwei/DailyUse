# DDD聚合根权限控制优化方案

## 当前问题

当前的仓储实现在查询子实体时直接使用冗余的 `accountUuid` 字段：

```typescript
// ❌ 当前实现 - 依赖冗余字段
async getKeyResultsByGoalUuid(accountUuid: string, goalUuid: string) {
  const keyResults = await this.prisma.keyResult.findMany({
    where: {
      accountUuid,  // 冗余字段
      goalUuid,
    },
  });
}
```

## 立即优化方案

### 1. 通过关联查询实现权限控制

```typescript
// ✅ 优化后实现 - 通过聚合根控制权限
async getKeyResultsByGoalUuid(accountUuid: string, goalUuid: string) {
  const keyResults = await this.prisma.keyResult.findMany({
    where: {
      goalUuid,
      goal: {
        accountUuid,  // 通过Goal聚合根验证权限
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  return keyResults.map((kr) => this.mapKeyResultToDTO(kr));
}

async getGoalRecordsByKeyResultUuid(accountUuid: string, keyResultUuid: string) {
  const records = await this.prisma.goalRecord.findMany({
    where: {
      keyResultUuid,
      keyResult: {
        goal: {
          accountUuid,  // 通过Goal聚合根验证权限
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  return records.map((record) => this.mapGoalRecordToDTO(record));
}
```

### 2. 查询性能对比

**当前方式 (冗余字段)**:
```sql
SELECT * FROM key_results 
WHERE account_uuid = ? AND goal_uuid = ?;
```

**优化方式 (关联查询)**:
```sql
SELECT kr.* FROM key_results kr
JOIN goals g ON kr.goal_uuid = g.uuid
WHERE g.account_uuid = ? AND kr.goal_uuid = ?;
```

性能影响很小，因为：
1. `goal_uuid` 上有索引
2. 通常会有 `goals.account_uuid` 索引
3. 查询优化器会选择最优执行计划

### 3. 架构优势

**数据一致性**:
- 单一权限控制点（Goal聚合根）
- 减少数据同步复杂度
- 消除冗余字段不一致风险

**业务清晰度**:
- 明确的聚合边界
- 符合DDD领域模型
- 更易理解和维护

**扩展性**:
- 权限逻辑集中化
- 便于添加复杂权限规则
- 支持多层级权限控制

## 实施建议

### 阶段1: 立即优化查询逻辑
- 修改现有仓储方法使用关联查询
- 保持数据库schema不变
- 确保功能完全兼容

### 阶段2: 逐步移除冗余字段
- 创建数据库迁移脚本
- 更新相关DTO定义
- 更新单元测试

### 阶段3: 完整的DDD重构
- 实现完整的聚合根控制模式
- 优化查询性能
- 添加缓存策略
