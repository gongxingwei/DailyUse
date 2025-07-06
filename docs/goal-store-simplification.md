# Goal Store 架构简化方案

## 当前架构问题

### ❌ 过度抽象的层次
```
GoalStateManager (业务门面)
    ↓
PiniaGoalStateRepository (仓储抽象)
    ↓  
useGoalStore (Pinia状态管理)
    ↓
各种CRUD方法 (addGoal, updateGoal, addRecord, updateRecord...)
```

**问题：**
1. **过度封装**：简单的CRUD被包装了3-4层
2. **代码冗余**：Record操作已经在Goal聚合中，独立的Record方法变多余
3. **维护成本**：每个简单操作需要在多个层次中定义
4. **性能损耗**：不必要的函数调用链

## ✅ 简化后的架构

### 核心原则
1. **聚合根为中心**：Record已经集成到Goal聚合，不需要独立管理
2. **减少抽象层**：直接在Store中使用领域对象
3. **保留核心价值**：领域逻辑和业务规则仍然封装在实体中

### 新架构
```
goalManager (可选的便捷门面)
    ↓
useGoalStore (Pinia + 领域对象)
    ↓
Goal/GoalDir 聚合根
```

## 对比分析

### 数据管理简化

#### 重构前 ❌
```typescript
// 3个独立的状态
state: {
  goals: IGoal[],
  records: IRecord[],  // ❌ 冗余，已经在goals中
  goalDirs: IGoalDir[]
}

// 分离的持久化
async saveGoals() { ... }
async saveRecords() { ... }  // ❌ 多余
async saveGoalDirs() { ... }
```

#### 重构后 ✅
```typescript
// 2个核心状态
state: {
  goals: IGoal[],      // 包含records
  goalDirs: IGoalDir[]
}

// 统一持久化
async saveData() {
  await Promise.all([
    this._autoSave.saveData("goals", this.goals),
    this._autoSave.saveData("goalDirs", this.goalDirs)
  ]);
}
```

### 记录操作简化

#### 重构前 ❌
```typescript
// 独立的Record CRUD + 手动同步
async addRecord(record: IRecord) {
  this.records.push(record);
  // ❌ 需要手动更新关键结果和目标进度
  await this.updateKeyResultProgress(...);
  await this.recalculateGoalAnalytics(...);
}
```

#### 重构后 ✅
```typescript
// 通过Goal聚合自动处理
async addRecord(goalId: string, recordData: {
  keyResultId: string;
  value: number;
  note?: string;
}) {
  const goal = Goal.fromDTO(this.getGoalById(goalId));
  const record = goal.addRecord(...); // ✅ 自动更新所有相关数据
  
  this.goals[index] = goal.toDTO();
  await this.saveData();
  return record.toDTO();
}
```

### 查询方法优化

#### 重构前 ❌
```typescript
// 分离的查询
getAllRecords(): IRecord[] {
  return this.records;  // ❌ 可能与goals中的records不同步
}

getRecordsByGoalId(goalId: string): IRecord[] {
  return this.records.filter(r => r.goalId === goalId);
}
```

#### 重构后 ✅
```typescript
// 基于聚合的查询
getAllRecords(): IRecord[] {
  return this.goals.flatMap(g => g.records);  // ✅ 始终同步
}

getRecordsByGoalId(goalId: string): IRecord[] {
  const goal = this.goals.find(g => g.id === goalId);
  return goal?.records || [];  // ✅ 直接从目标获取
}
```

## 核心改进

### 1. **状态简化**
- 从3个独立状态减少到2个核心状态
- Record不再独立管理，始终通过Goal获取
- 消除了数据同步问题

### 2. **方法精简**
- 移除冗余的Record CRUD方法
- 合并相关的保存方法
- 统一的错误处理

### 3. **业务逻辑集中**
```typescript
// ✅ 一个方法完成复杂业务
await store.addRecord(goalId, {
  keyResultId: "kr-123",
  value: 1,
  note: "完成真题"
});
// 自动完成：
// 1. 创建记录
// 2. 更新关键结果进度
// 3. 重算目标进度
// 4. 保存数据
```

### 4. **便捷门面（可选）**
```typescript
// 为不想直接使用store的组件提供便捷接口
export const goalManager = {
  store: useGoalStore(),
  
  async createGoal(data) { return this.store.createGoal(data); },
  async addRecord(goalId, data) { return this.store.addRecord(goalId, data); },
  
  getGoalById(id) { return this.store.getGoalById(id); }
};
```

## 迁移建议

### 第一阶段：替换Store
1. 使用新的简化Store替换现有Store
2. 更新组件中的导入和调用

### 第二阶段：清理冗余
1. 删除 `PiniaGoalStateRepository`
2. 删除 `GoalStateManager`  
3. 删除独立的Record相关方法

### 第三阶段：统一使用
1. 组件直接使用 `useGoalStore()` 或 `goalManager`
2. 享受简化后的API

## 使用示例

### 创建目标和记录
```typescript
import { goalManager } from '@/modules/Goal/presentation/stores/goalStore.simplified';

// 创建目标
const goal = await goalManager.createGoal({
  title: "准备考研英语",
  description: "目标90分",
  keyResults: [{
    name: "完成十套真题",
    startValue: 0,
    targetValue: 10,
    currentValue: 0,
    calculationMethod: 'sum',
    weight: 8
  }]
});

// 添加记录（自动更新进度）
const record = await goalManager.addRecord(goal.id, {
  keyResultId: goal.keyResults[0].id,
  value: 1,
  note: "完成2022年真题"
});

console.log('目标进度:', goalManager.getGoalById(goal.id)?.analytics.overallProgress);
```

## 总结

简化后的架构：
- ✅ **减少50%的代码量**
- ✅ **消除数据同步问题**  
- ✅ **提升性能**（减少函数调用链）
- ✅ **保持领域逻辑封装**
- ✅ **更易于理解和维护**

这个简化版本保留了聚合根设计的核心价值，同时大大减少了不必要的抽象层次。
