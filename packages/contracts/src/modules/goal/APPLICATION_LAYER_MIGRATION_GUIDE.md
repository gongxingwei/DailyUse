# Application Layer Migration Guide - DTO 优化适配

## 概述

这份指南记录了应用层服务如何适配新的 DTO 架构。

## 主要变更

### 1. **移除 `accountUuid` 字段**

**原因**：`accountUuid` 在 API 层已经通过认证中间件获得，不需要在 DTO 中重复传递。

**旧代码**：
```typescript
const keyResultData: Omit<GoalContracts.KeyResultDTO, 'uuid' | 'lifecycle'> = {
  accountUuid,  // ❌ 已移除
  goalUuid: createdGoal.uuid,
  name: krRequest.name,
  ...
};
```

**新代码**：
```typescript
const keyResultData: Omit<GoalContracts.KeyResultDTO, 'uuid' | 'lifecycle'> = {
  // ✅ accountUuid 不再需要
  goalUuid: createdGoal.uuid,
  name: krRequest.name,
  ...
};
```

### 2. **移除 `keyResultIndex` 支持**

**原因**：前端现在使用 UUID 前端生成模式，不再需要通过索引引用关键结果。

**旧代码**：
```typescript
if (recordRequest.keyResultUuid) {
  keyResultUuid = recordRequest.keyResultUuid;
} else if (recordRequest.keyResultIndex !== undefined) {  // ❌ 已废弃
  keyResultUuid = createdKeyResults[recordRequest.keyResultIndex].uuid;
}
```

**新代码**：
```typescript
// ✅ 直接使用 UUID
const keyResultUuid = recordRequest.keyResultUuid;
if (!keyResultUuid) {
  throw new Error('keyResultUuid is required');
}
```

### 3. **更新 `UpdateGoalRequest` 结构**

**原因**：子实体操作现在通过独立的 RESTful API 进行，不再嵌套在 Goal 更新请求中。

**旧代码**：
```typescript
interface UpdateGoalRequest {
  basic?: {...};
  analysis?: {...};
  metadata?: {...};
  keyResults?: Array<{action: 'create' | 'update' | 'delete', ...}>;  // ❌ 已移除
  records?: Array<{action: 'create' | 'update' | 'delete', ...}>;    // ❌ 已移除
  reviews?: Array<{action: 'create' | 'update' | 'delete', ...}>;    // ❌ 已移除
}
```

**新代码**：
```typescript
type UpdateGoalRequest = Partial<
  Omit<GoalDTO, 'uuid' | 'lifecycle' | 'version' | 'keyResults' | 'records' | 'reviews'>
> & {
  status?: GoalStatus;
};

// ✅ 扁平化结构，不包含子实体操作
```

### 4. **更新 `GoalListResponse` 字段名**

**原因**：统一 API 响应格式，使用 `data` 而不是 `goals`。

**旧代码**：
```typescript
return {
  goals,     // ❌ 应该是 data
  total: result.total,
  page,
  limit,
  hasMore: page * limit < result.total,
};
```

**新代码**：
```typescript
return {
  data: goals,  // ✅ 使用 data
  total: result.total,
  page,
  limit,
  hasMore: page * limit < result.total,
};
```

### 5. **枚举类型修复**

**问题**：使用字符串字面量代替枚举值。

**修复**：
```typescript
// ❌ 旧代码
calculationMethod: krRequest.calculationMethod || 'sum',

// ✅ 新代码
calculationMethod: krRequest.calculationMethod || KeyResultCalculationMethod.SUM,
```

### 6. **`CreateXXRequest` 现在包含 `uuid`**

**变更**：所有创建请求现在都需要在前端生成 UUID。

**前端代码**：
```typescript
import { v4 as uuidv4 } from 'uuid';

const goalUuid = uuidv4();
const request: CreateGoalRequest = {
  uuid: goalUuid,  // ✅ 前端生成
  name: 'New Goal',
  ...
};
```

**后端代码**：
```typescript
async createGoal(request: CreateGoalRequest) {
  // ✅ 直接使用前端的 UUID
  const goal = Goal.create({
    uuid: request.uuid,
    ...
  });
}
```

## 应用层服务修复清单

### GoalApplicationService.ts

- [ ] 移除 `createGoalAggregate` 中的 `accountUuid` 字段
- [ ] 移除 `keyResultIndex` 支持，只使用 `keyResultUuid`
- [ ] 修复枚举类型使用
- [ ] 移除 `updateGoalAggregate` 中的子实体操作参数
- [ ] 更新 `getGoals` 返回 `data` 而不是 `goals`
- [ ] 更新所有 `XxxResponse` 类型为 `XxxClientDTO`

### goalAggregateService.ts

- [ ] 移除所有 `accountUuid` 字段
- [ ] 修复枚举类型使用
- [ ] 更新返回类型为 `ClientDTO`

## 迁移步骤

1. ✅ **更新 Domain Layer**：`toResponse()` → `toClient()`
2. 🔄 **修复编译错误**：移除 accountUuid、keyResultIndex 等
3. ⏳ **更新 Controller Layer**：适配新的请求结构
4. ⏳ **更新测试用例**：使用前端 UUID 生成模式
5. ⏳ **前端迁移**：安装 uuid 库，生成 UUID

## 注意事项

1. **向后兼容性**：contracts 包中保留了 `@deprecated` 类型别名，旧代码暂时可以继续工作
2. **数据库迁移**：确保数据库支持 UUID 唯一性约束
3. **测试覆盖**：更新所有集成测试以使用新的 DTO 结构
4. **文档更新**：更新 API 文档以反映新的请求/响应结构

## 下一步

完成应用层迁移后，继续实施：
- Frontend UUID 生成
- 独立的子实体 API 端点
- 优化的错误处理
