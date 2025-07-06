# Goal State Manager 面向对象重构

## 重构前后对比

### ❌ 重构前：过程式数据构造

```typescript
// 过程式创建 - 手动构造数据结构
async createGoal(goalData: Partial<IGoal>): Promise<void> {
  const goal: IGoal = {
    id: goalData.id || `goal-${Date.now()}`,
    title: goalData.title || '',
    description: goalData.description || '',
    color: goalData.color || '#FF5733',
    dirId: goalData.dirId || 'default',
    // ... 大量手动赋值
    keyResults: goalData.keyResults || [],
    analytics: goalData.analytics || {
      overallProgress: 0,
      weightedProgress: 0,
      completedKeyResults: 0,
      totalKeyResults: 0
    },
    version: goalData.version || 1
  };

  await this.repository.addGoal(goal);
}

// 分离的记录创建
async addRecord(recordData: Partial<IRecord>): Promise<void> {
  const record: IRecord = {
    id: recordData.id || `record-${Date.now()}`,
    goalId: recordData.goalId || '',
    keyResultId: recordData.keyResultId || '',
    value: recordData.value || 0,
    // ... 手动构造
  };

  await this.repository.addRecord(record);
  // ❌ 需要手动同步关键结果和目标进度！
}
```

### ✅ 重构后：面向对象领域驱动

```typescript
// ✅ 使用领域对象创建
async createGoal(goalData: {
  title: string;
  description?: string;
  // ... 明确的接口
}): Promise<IGoal> {
  // 使用 Goal 聚合根创建
  const goal = new Goal(uuidv4(), goalData.title, {
    description: goalData.description,
    color: goalData.color,
    dirId: goalData.dirId,
    startTime: goalData.startTime,
    endTime: goalData.endTime,
    note: goalData.note,
    analysis: goalData.analysis,
  });

  // 添加关键结果（如果有）
  if (goalData.keyResults) {
    for (const krData of goalData.keyResults) {
      goal.addKeyResult({
        name: krData.name,
        startValue: krData.startValue,
        targetValue: krData.targetValue,
        currentValue: krData.currentValue,
        calculationMethod: krData.calculationMethod,
        weight: krData.weight
      });
    }
  }

  // 保存并返回 DTO
  const goalDTO = goal.toDTO();
  await this.repository.addGoal(goalDTO);
  
  return goalDTO;
}

// ✅ 通过聚合根管理记录
async addRecord(recordData: {
  goalId: string;
  keyResultId: string;
  value: number;
  note?: string;
}): Promise<IRecord> {
  // 1. 获取目标聚合
  const goalDTO = this.repository.store.getGoalById(recordData.goalId);
  if (!goalDTO) {
    throw new Error(`目标不存在: ${recordData.goalId}`);
  }

  // 2. 重建 Goal 聚合
  const goal = Goal.fromDTO(goalDTO);
  
  // 3. 添加记录（会自动更新关键结果和目标进度）
  const record = goal.addRecord(
    recordData.keyResultId,
    recordData.value,
    recordData.note
  );

  // 4. 保存更新后的目标
  await this.repository.updateGoal(goal.toDTO());
  
  return record.toDTO();
}
```

## 核心改进

### 1. **业务逻辑集中化**

#### 重构前 ❌
- 数据构造分散在各个方法中
- 手动处理默认值和验证
- 业务规则重复实现
- 容易遗漏数据一致性

#### 重构后 ✅
- 业务逻辑封装在领域对象中
- 聚合根保证数据一致性
- 自动处理复杂的业务规则
- 单一职责，易于维护

### 2. **数据一致性保证**

```typescript
// ✅ 自动保证一致性
goal.addRecord(keyResultId, 10, "完成了今天的任务");
// 内部自动完成：
// 1. 验证关键结果存在
// 2. 创建记录
// 3. 更新关键结果当前值
// 4. 重新计算目标进度
// 5. 更新版本号和时间戳
```

### 3. **类型安全提升**

#### 重构前 ❌
```typescript
// 类型不够精确，容易出错
async createGoal(goalData: Partial<IGoal>): Promise<void>
```

#### 重构后 ✅
```typescript
// 明确的接口，编译时类型检查
async createGoal(goalData: {
  title: string;           // 必填
  description?: string;    // 可选
  color?: string;          // 可选
  // ...
}): Promise<IGoal>        // 明确返回类型
```

### 4. **错误处理改进**

```typescript
// ✅ 领域层的业务规则验证
goal.addRecord(keyResultId, -5, "note"); 
// 抛出: "记录值必须大于0"

goal.addKeyResult({
  name: "",
  startValue: 100,
  targetValue: 50  // 错误：目标值小于起始值
});
// 抛出: "目标值必须大于起始值"
```

### 5. **操作原子性**

#### 重构前 ❌
```typescript
// 多步操作，可能出现不一致
await addRecord(record);
await updateKeyResult(keyResultId, newValue);
await updateGoalProgress(goalId);
// ❌ 如果中间步骤失败，数据不一致
```

#### 重构后 ✅
```typescript
// 单一操作，原子性保证
const record = goal.addRecord(keyResultId, value, note);
await repository.updateGoal(goal.toDTO());
// ✅ 要么全部成功，要么全部失败
```

## 新增的便捷方法

### 关键结果管理
```typescript
// 添加关键结果
await goalStateManager.addKeyResult(goalId, {
  name: "完成十套真题",
  startValue: 0,
  targetValue: 10,
  currentValue: 0,
  calculationMethod: 'sum',
  weight: 8
});

// 更新关键结果
await goalStateManager.updateKeyResult(goalId, keyResultId, {
  targetValue: 12,  // 调整目标
  weight: 9         // 调整权重
});

// 移除关键结果（会自动清理相关记录）
await goalStateManager.removeKeyResult(goalId, keyResultId);
```

### 记录管理
```typescript
// 添加记录（会自动更新关键结果和目标进度）
const record = await goalStateManager.addRecord({
  goalId: "goal-123",
  keyResultId: "kr-456", 
  value: 1,
  note: "完成了2022年真题"
});

// 更新记录（会自动调整关键结果）
const updatedRecord = await goalStateManager.updateRecord(recordId, {
  value: 2,  // 修正记录值
  note: "完成了2022年和2021年真题"
});
```

## 使用示例

### 创建考研目标
```typescript
const goal = await goalStateManager.createGoal({
  title: "准备考研英语",
  description: "目标90分以上",
  color: "#4CAF50",
  dirId: "study-dir",
  startTime: TimeUtils.now(),
  endTime: TimeUtils.addMonths(TimeUtils.now(), 6),
  analysis: {
    motive: "提升英语水平，考研需要",
    feasibility: "每天2小时，可行"
  },
  keyResults: [
    {
      name: "完成十套真题",
      startValue: 0,
      targetValue: 10,
      currentValue: 0,
      calculationMethod: 'sum',
      weight: 8
    },
    {
      name: "背完6000个单词",
      startValue: 0,
      targetValue: 6000,
      currentValue: 0,
      calculationMethod: 'sum',
      weight: 7
    }
  ]
});

// 添加记录
const record = await goalStateManager.addRecord({
  goalId: goal.id,
  keyResultId: goal.keyResults[0].id,
  value: 1,
  note: "完成了2022年真题"
});

console.log('目标进度:', goal.analytics.overallProgress);
// 自动计算的进度更新
```

## 总结

这次重构的核心价值：

1. **🎯 业务逻辑封装**：从过程式编程转向面向对象
2. **🔒 数据一致性**：聚合根保证操作的原子性
3. **🛡️ 类型安全**：明确的接口定义，减少运行时错误
4. **🚀 开发效率**：更少的样板代码，更清晰的业务意图
5. **🧹 代码质量**：遵循 DDD 原则，更易于维护和扩展

现在的 `GoalStateManager` 更像一个业务门面（Facade），提供简洁的API来操作复杂的领域模型，而底层的复杂性被很好地封装在领域对象中。
