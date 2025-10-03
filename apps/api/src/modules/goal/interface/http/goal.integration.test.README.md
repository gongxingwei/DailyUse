# Goal 集成测试说明文档

## 测试文件概述

- **文件**: `goal.integration.new-dto.test.ts`
- **类型**: API 集成测试
- **目的**: 验证 Goal 模块的 RESTful API 端点，确保新 DTO 架构正确实现

## Mock 数据类型说明

### 使用的 DTO 类型

```typescript
// 从 @dailyuse/contracts 导入
import { GoalContracts, ImportanceLevel, UrgencyLevel, GoalStatus, ... } from '@dailyuse/contracts';

// 类型别名
type GoalPersistenceDTO = GoalContracts.GoalPersistenceDTO;
type KeyResultPersistenceDTO = GoalContracts.KeyResultPersistenceDTO;
type GoalRecordPersistenceDTO = GoalContracts.GoalRecordPersistenceDTO;
```

### Mock 数据结构要点

#### 1. Goal Mock 数据（扁平化结构）

```typescript
const mockGoalDTO: Partial<GoalPersistenceDTO> = {
  uuid: string,
  accountUuid: string,
  name: string,
  color: string,
  startTime: Date,
  endTime: Date,
  
  // ✅ 扁平化的分析字段
  motive: string,                          // 不是 analysis.motive
  feasibility: string,                     // 不是 analysis.feasibility
  importanceLevel: ImportanceLevel.Important,  // 枚举类型
  urgencyLevel: UrgencyLevel.High,             // 枚举类型
  
  // ✅ 扁平化的元数据
  tags: JSON.stringify(['tag1', 'tag2']), // JSON 字符串，不是数组
  category: string,                        // 直接字符串
  
  // ✅ 状态字段
  status: GoalStatus.ACTIVE,               // 枚举类型
  version: number,
  createdAt: Date,
  updatedAt: Date,
};
```

#### 2. KeyResult Mock 数据

```typescript
const mockKrDTO: Partial<KeyResultPersistenceDTO> = {
  uuid: string,
  goalUuid: string,  // 关联的目标 UUID
  name: string,
  startValue: number,
  targetValue: number,
  currentValue: number,
  unit: string,
  weight: number,
  calculationMethod: KeyResultCalculationMethod.SUM,  // 枚举
  status: KeyResultStatus.ACTIVE,                     // 枚举
  createdAt: Date,
  updatedAt: Date,
};
```

#### 3. GoalRecord Mock 数据

```typescript
const mockRecordDTO: Partial<GoalRecordPersistenceDTO> = {
  uuid: string,
  keyResultUuid: string,  // 关联的关键结果 UUID
  value: number,
  note?: string,
  createdAt: Date,
};
```

### 枚举值参考

```typescript
// 重要性等级
ImportanceLevel.Vital      // 极其重要
ImportanceLevel.Important  // 非常重要
ImportanceLevel.Moderate   // 中等重要
ImportanceLevel.Minor      // 不太重要
ImportanceLevel.Trivial    // 无关紧要

// 紧急程度
UrgencyLevel.Critical  // 非常紧急
UrgencyLevel.High      // 高度紧急
UrgencyLevel.Medium    // 中等紧急
UrgencyLevel.Low       // 低度紧急
UrgencyLevel.None      // 无期限

// 目标状态
GoalStatus.ACTIVE      // 活跃
GoalStatus.COMPLETED   // 已完成
GoalStatus.PAUSED      // 暂停
GoalStatus.ARCHIVED    // 已归档

// 关键结果状态
KeyResultStatus.ACTIVE    // 活跃
KeyResultStatus.COMPLETED // 已完成
KeyResultStatus.ARCHIVED  // 已归档

// 计算方法
KeyResultCalculationMethod.SUM     // 求和
KeyResultCalculationMethod.AVERAGE // 平均
KeyResultCalculationMethod.MAX     // 最大值
KeyResultCalculationMethod.MIN     // 最小值
KeyResultCalculationMethod.CUSTOM  // 自定义
```

## 测试结构

### 1. POST /api/v1/goals - 创建目标
- ✅ 前端 UUID 生成
- ✅ 扁平化的 request 数据
- ✅ 同时创建关键结果
- ✅ UUID 格式验证

### 2. PUT /api/v1/goals/:id - 更新目标
- ✅ 部分更新（只传需要更新的字段）
- ✅ 更新分析信息
- ✅ 更新元数据
- ✅ 忽略子实体操作

### 3. POST /api/v1/goals/:goalId/key-results - 添加关键结果
- ✅ 通过聚合根访问
- ✅ 目标存在性验证

### 4. PUT /api/v1/goals/:goalId/key-results/:krId - 更新关键结果
- ✅ 部分更新
- ✅ 计算属性验证

### 5. DELETE /api/v1/goals/:goalId/key-results/:krId - 删除关键结果
- ✅ 级联删除

### 6. POST /api/v1/goals/:goalId/records - 添加进度记录
- ✅ 使用 keyResultUuid 而不是 index
- ✅ KeyResult 存在性验证

### 7. GET /api/v1/goals/:id - 获取目标详情
- ✅ 返回 ClientDTO（包含计算属性）

### 8. GET /api/v1/goals - 获取目标列表
- ✅ 分页参数
- ✅ 使用 `data` 字段

## 常见错误和修复

### 错误1: 类型导入错误

❌ **错误**:
```typescript
import { GoalPersistenceDTO } from '@dailyuse/contracts';
// Error: Module has no exported member 'GoalPersistenceDTO'
```

✅ **正确**:
```typescript
import { GoalContracts } from '@dailyuse/contracts';
type GoalPersistenceDTO = GoalContracts.GoalPersistenceDTO;
```

### 错误2: Mock 数据结构错误

❌ **错误**:
```typescript
{
  analysis: {
    motive: '动机',
    importanceLevel: 'high',  // 字符串
  },
  metadata: {
    tags: ['tag1'],  // 数组
  }
}
```

✅ **正确**:
```typescript
{
  motive: '动机',                         // 扁平化
  importanceLevel: ImportanceLevel.Important,  // 枚举
  tags: JSON.stringify(['tag1']),         // JSON 字符串
}
```

### 错误3: 枚举值使用错误

❌ **错误**:
```typescript
importanceLevel: 'high'  // 字符串
```

✅ **正确**:
```typescript
importanceLevel: ImportanceLevel.Important  // 枚举
```

### 错误4: Mock 数据表名错误

❌ **错误**:
```typescript
setMockData('goalRecord', [mockRecordDTO])  // 错误的表名
```

✅ **正确**:
```typescript
setMockData('progressRecord', [mockRecordDTO])  // 正确的表名
```

## 运行测试

```bash
# 运行单个测试文件
pnpm vitest run goal.integration.new-dto.test.ts

# 运行完整路径
pnpm vitest run apps/api/src/modules/goal/interface/http/goal.integration.new-dto.test.ts

# Watch 模式
pnpm vitest goal.integration.new-dto.test.ts

# UI 模式
pnpm test:ui
```

## 测试数据准确性检查清单

- [ ] 所有 mock 数据都有明确的类型标注
- [ ] 使用 `Partial<T>` 包装可选字段
- [ ] 枚举值使用正确的枚举类型而不是字符串
- [ ] 日期字段使用 `new Date()` 而不是时间戳
- [ ] `tags` 字段使用 `JSON.stringify()` 转换
- [ ] UUID 字段使用 `uuidv4()` 生成
- [ ] 关联关系正确（goalUuid, keyResultUuid 等）
- [ ] Mock 数据表名正确（goal, keyResult, progressRecord）

## 相关文档

- [API 响应系统文档](../../../../API_RESPONSE_SYSTEM_GUIDE.md)
- [DTO 架构文档](../../../../../DOMAIN_CLIENT_GOAL_OPTIMIZATION_COMPLETE.md)
- [Vitest 配置文档](../../../../../VITEST_WORKSPACE_GUIDE.md)
