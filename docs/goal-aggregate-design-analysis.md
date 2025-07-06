# Goal 模块聚合设计分析

## 当前实体关系

```
GoalDir (目标节点/文件夹)
├── Goal (目标)
    ├── KeyResult (关键结果)
    └── Record (记录) -> 关联到 KeyResult
```

## 推荐的聚合边界设计

### 1. Goal 聚合根 (主聚合)

**聚合边界：**
- Goal (聚合根)
- KeyResult (实体)
- Record (实体)

**设计理由：**
- Goal、KeyResult、Record 之间有强业务一致性要求
- 记录的创建会影响关键结果的当前值
- 关键结果的变化会影响目标的整体进度
- 需要在一个事务中保证数据一致性

**业务规则示例：**
```typescript
// 在 Goal 聚合内管理记录和关键结果的一致性
class Goal extends AggregateRoot {
  addRecord(keyResultId: string, value: number, note?: string): void {
    // 1. 验证关键结果存在
    const keyResult = this.getKeyResult(keyResultId);
    if (!keyResult) throw new Error("关键结果不存在");
    
    // 2. 创建记录
    const record = new Record(generateId(), this.id, keyResultId, value, note);
    this._records.push(record);
    
    // 3. 更新关键结果当前值
    keyResult.addValue(value);
    
    // 4. 重新计算目标进度
    this.recalculateProgress();
    
    // 5. 发布领域事件
    this.addDomainEvent(new RecordAddedEvent(this.id, keyResultId, record.id));
  }
}
```

### 2. GoalDir 聚合根 (独立聚合)

**聚合边界：**
- GoalDir (聚合根，单一实体)

**设计理由：**
- 目录结构是独立的组织概念
- 目录的增删改不影响目标的业务逻辑
- 目录之间可能有层次关系，但不需要与目标保持强一致性

### 3. 聚合间的关系

```typescript
// 通过 ID 引用，而非对象引用
interface IGoal {
  dirId: string; // 引用 GoalDir.id，而非 GoalDir 对象
  // ...
}

interface IRecord {
  goalId: string; // 引用 Goal.id
  keyResultId: string; // 引用 KeyResult.id
  // ...
}
```

## 对比：当前设计 vs 推荐设计

### 当前设计问题

```typescript
// ❌ 当前设计：Record 作为独立聚合根
class Record extends AggregateRoot {
  // 问题1：记录更新时，无法保证关键结果的一致性
  // 问题2：需要跨聚合协调数据一致性
  // 问题3：增加了系统复杂度
}
```

### 推荐设计优势

```typescript
// ✅ 推荐设计：Record 作为 Goal 聚合内的实体
class Goal extends AggregateRoot {
  private _records: Record[] = [];
  private _keyResults: KeyResult[] = [];
  
  // 优势1：在一个事务中保证一致性
  // 优势2：业务规则集中管理
  // 优势3：简化数据同步逻辑
}
```

## 实现建议

### 1. 重构 Record 实体

```typescript
// 从聚合根改为普通实体
export class Record {  // 移除 extends AggregateRoot
  // 保持现有属性和方法
  // 移除领域事件发布（由 Goal 聚合根负责）
}
```

### 2. 增强 Goal 聚合根

```typescript
export class Goal extends AggregateRoot {
  private _records: Record[] = [];
  
  // 新增记录管理方法
  addRecord(keyResultId: string, value: number, note?: string): Record;
  updateRecord(recordId: string, updates: Partial<RecordUpdateData>): void;
  removeRecord(recordId: string): void;
  getRecordsByKeyResult(keyResultId: string): Record[];
  
  // 新增业务规则方法
  private recalculateProgress(): void;
  private validateKeyResultExists(keyResultId: string): void;
}
```

### 3. 数据访问层调整

```typescript
// 仓储接口调整
interface IGoalRepository {
  save(goal: Goal): Promise<void>; // 保存整个聚合
  findById(id: string): Promise<Goal | null>;
  findByDirId(dirId: string): Promise<Goal[]>;
  // 移除单独的 Record 仓储方法
}

interface IGoalDirRepository {
  save(goalDir: GoalDir): Promise<void>;
  findById(id: string): Promise<GoalDir | null>;
  findAll(): Promise<GoalDir[]>;
}
```

## 迁移路径

1. **第一阶段**：保持当前接口不变，内部重构聚合边界
2. **第二阶段**：更新应用服务，使用新的聚合方法
3. **第三阶段**：清理旧的 Record 仓储和服务
4. **第四阶段**：更新前端调用，使用新的业务接口

## 总结

将 Record 纳入 Goal 聚合的优势：
- ✅ **业务一致性**：记录和关键结果的更新在同一事务中
- ✅ **简化设计**：减少聚合间的复杂协调
- ✅ **性能优化**：减少跨聚合的数据查询
- ✅ **领域完整性**：更好地表达业务概念的内聚性

最终聚合结构：
- **Goal 聚合**：Goal (根) + KeyResult (实体) + Record (实体)
- **GoalDir 聚合**：GoalDir (根，单实体)
