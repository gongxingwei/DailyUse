# Goal 模块 DDD 架构优化：子实体自治

## 🎯 设计原则

### 核心思想
**子实体负责自己的更新逻辑，聚合根只处理聚合级别的业务规则**

这是一个非常重要的 DDD 设计改进：
- ✅ **职责分离**：每个实体管理自己的内部状态和业务规则
- ✅ **聚合根简化**：聚合根专注于跨实体的业务规则和一致性保证
- ✅ **代码复用**：子实体的更新逻辑可以在不同场景下复用
- ✅ **易于维护**：修改子实体逻辑不影响聚合根

## 📐 架构对比

### ❌ **旧设计（错误）**

```typescript
// 聚合根处理所有细节
class Goal {
  updateKeyResult(uuid, updates) {
    const kr = this.keyResults.find(...);
    
    // ❌ 聚合根处理实体内部的验证和更新
    if (updates.name) kr._name = updates.name;
    if (updates.targetValue) {
      if (updates.targetValue <= 0) throw new Error('...');
      kr._targetValue = updates.targetValue;
    }
    // ... 所有字段的更新逻辑都在聚合根中
    
    // 聚合根级别的业务规则
    if (totalWeight > 100) throw new Error('...');
  }
}
```

**问题**：
- 聚合根承担了太多责任
- 子实体的业务逻辑分散在聚合根中
- 难以复用子实体的更新逻辑
- 违反了单一职责原则

### ✅ **新设计（正确）**

```typescript
// 子实体负责自己的更新逻辑
class KeyResult {
  update(updates) {
    // ✅ 实体内部验证和更新自己的字段
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new Error('关键结果名称不能为空');
      }
      this._name = updates.name;
    }
    
    if (updates.targetValue !== undefined) {
      if (updates.targetValue <= 0) {
        throw new Error('目标值必须大于0');
      }
      this._targetValue = updates.targetValue;
    }
    
    // 更新时间戳
    this._lifecycle.updatedAt = new Date();
  }
}

// 聚合根只处理聚合级别的业务规则
class Goal {
  updateKeyResult(uuid, updates) {
    const keyResult = this.keyResults.find(...);
    
    // ✅ 聚合根级别的业务规则：权重验证
    if (updates.weight !== undefined) {
      const otherWeight = this.keyResults
        .filter(kr => kr.uuid !== uuid)
        .reduce((sum, kr) => sum + kr.weight, 0);
      
      if (otherWeight + updates.weight > 100) {
        throw new Error('关键结果权重总和不能超过100%');
      }
    }
    
    // ✅ 调用子实体的 update 方法
    keyResult.update(updates);
    
    // ✅ 聚合根级别的后续处理
    this.updateVersion();
    this.addDomainEvent({ ... });
  }
}
```

**优势**：
- 职责清晰：实体管理自己，聚合根管理协调
- 代码复用：KeyResult.update() 可以在任何地方调用
- 易于测试：可以单独测试实体的更新逻辑
- 符合 OOP 原则：封装、单一职责

## 🏗️ 实现细节

### 1. KeyResult 实体

**文件**: `packages/domain-server/src/goal/entities/KeyResult.ts`

```typescript
export class KeyResult extends KeyResultCore {
  /**
   * 更新关键结果（实体内部方法）
   * 封装自身的更新逻辑和验证
   */
  update(updates: {
    name?: string;
    description?: string;
    startValue?: number;
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    weight?: number;
    calculationMethod?: GoalContracts.KeyResultCalculationMethod;
  }): void {
    // 验证并更新字段
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new Error('关键结果名称不能为空');
      }
      this._name = updates.name;
    }

    if (updates.targetValue !== undefined) {
      if (updates.targetValue <= 0) {
        throw new Error('目标值必须大于0');
      }
      this._targetValue = updates.targetValue;
    }

    if (updates.weight !== undefined) {
      if (updates.weight <= 0 || updates.weight > 100) {
        throw new Error('权重必须在1-100之间');
      }
      this._weight = updates.weight;
    }

    // ... 其他字段的更新逻辑

    // 更新时间戳
    this._lifecycle.updatedAt = new Date();
  }
}
```

**责任范围**：
- ✅ 字段级别的验证（名称非空、目标值大于0、权重范围等）
- ✅ 字段的赋值
- ✅ 时间戳更新
- ❌ 跨实体的业务规则（如权重总和不超过100%）

### 2. GoalRecord 实体

**文件**: `packages/domain-server/src/goal/entities/GoalRecord.ts`

```typescript
export class GoalRecord extends GoalRecordCore {
  /**
   * 更新记录（实体内部方法）
   * 封装自身的更新逻辑和验证
   */
  update(updates: { value?: number; note?: string }): void {
    if (updates.value !== undefined) {
      this.updateValue(updates.value);
    }

    if (updates.note !== undefined) {
      this.updateNote(updates.note);
    }
  }
}
```

**责任范围**：
- ✅ 值和备注的更新
- ✅ 调用基类方法
- ❌ 关键结果进度的同步（由聚合根处理）

### 3. GoalReview 实体

**文件**: `packages/domain-server/src/goal/entities/GoalReview.ts`

```typescript
export class GoalReview extends AggregateRoot {
  /**
   * 更新复盘（实体内部方法）
   * 封装自身的更新逻辑和验证
   */
  update(updates: {
    title?: string;
    content?: { ... };
    rating?: { ... };
  }): void {
    if (updates.title !== undefined) {
      if (!updates.title.trim()) {
        throw new Error('复盘标题不能为空');
      }
      if (updates.title.length > 200) {
        throw new Error('复盘标题不能超过200个字符');
      }
      this._title = updates.title;
    }

    if (updates.content) {
      this.updateContent(updates.content);
    }

    if (updates.rating) {
      this.updateRating(updates.rating);
    }

    this._updatedAt = new Date();
  }
}
```

**责任范围**：
- ✅ 标题验证（非空、长度限制）
- ✅ 内容和评分的更新
- ✅ 调用内部方法
- ❌ 跨实体的业务规则

### 4. Goal 聚合根

**文件**: `packages/domain-server/src/goal/aggregates/Goal.ts`

#### 更新关键结果

```typescript
/**
 * 更新关键结果（聚合根方法）
 * 调用子实体的 update 方法，聚合根只处理聚合级别的业务规则
 */
updateKeyResult(
  keyResultUuid: string,
  updates: { ... },
): void {
  const keyResult = this.keyResults.find((kr) => kr.uuid === keyResultUuid);
  if (!keyResult) {
    throw new Error('关键结果不存在');
  }

  // 🎯 聚合根级别的业务规则：验证权重总和
  if (updates.weight !== undefined) {
    const otherWeight = this.keyResults
      .filter((kr) => kr.uuid !== keyResultUuid)
      .reduce((sum, kr) => sum + kr.weight, 0);

    if (otherWeight + updates.weight > 100) {
      throw new Error('关键结果权重总和不能超过100%');
    }
  }

  // ✅ 调用子实体的 update 方法，处理实体级别的逻辑
  (keyResult as KeyResult).update(updates);

  // 🎯 聚合根级别的后续处理
  this.updateVersion();
  this.addDomainEvent({ ... });
}
```

#### 更新记录

```typescript
/**
 * 更新记录（聚合根方法）
 * 调用子实体的 update 方法
 */
updateRecord(recordUuid: string, updates: { value?: number; note?: string }): void {
  const record = this.records.find((r) => r.uuid === recordUuid);
  if (!record) {
    throw new Error('记录不存在');
  }

  // ✅ 调用子实体的 update 方法
  (record as GoalRecord).update(updates);

  // 🎯 聚合根级别的业务逻辑：同步更新关键结果进度
  if (updates.value !== undefined && record.keyResultUuid) {
    const keyResult = this.keyResults.find((kr) => kr.uuid === record.keyResultUuid);
    if (keyResult) {
      keyResult.updateProgress(updates.value, 'set');
    }
  }

  // 🎯 聚合根级别的后续处理
  this.updateVersion();
  this.addDomainEvent({ ... });
}
```

#### 更新复盘

```typescript
/**
 * 更新复盘（聚合根方法）
 * 调用子实体的 update 方法
 */
updateReview(
  reviewUuid: string,
  updates: { ... },
): void {
  const review = this.reviews.find((r) => r.uuid === reviewUuid) as GoalReview | undefined;
  if (!review) {
    throw new Error('复盘不存在');
  }

  // ✅ 调用子实体的 update 方法
  review.update(updates);

  // 🎯 聚合根级别的后续处理
  this.updateVersion();
  this.addDomainEvent({ ... });
}
```

**聚合根的责任范围**：
- ✅ 查找子实体
- ✅ 聚合级别的业务规则（权重总和、级联更新等）
- ✅ 调用子实体的 update 方法
- ✅ 版本控制
- ✅ 领域事件发布
- ❌ 子实体内部字段的验证和更新

## 📊 职责划分总结

| 层次 | 负责的业务规则 | 示例 |
|------|---------------|------|
| **子实体** | 自身字段的验证和更新 | - 名称非空<br>- 目标值大于0<br>- 权重在1-100之间<br>- 标题长度限制 |
| **聚合根** | 跨实体的业务规则和一致性 | - 权重总和不超过100%<br>- 级联删除相关记录<br>- 级联更新关键结果进度<br>- 版本控制<br>- 领域事件 |
| **应用层** | DTO ↔ 实体转换 | - 将 UpdateGoalRequest 转换为实体操作<br>- 处理增量更新逻辑<br>- 调用聚合根方法 |

## ✅ 改进效果

### 1. 代码更清晰
```typescript
// 之前：聚合根中混杂了实体细节
Goal.updateKeyResult() {
  // 100+ 行代码，混杂验证、更新、业务规则
}

// 现在：职责清晰
KeyResult.update() {
  // 30 行代码，只处理自身字段
}

Goal.updateKeyResult() {
  // 20 行代码，只处理聚合级别的规则
  keyResult.update(updates);
  // 后续处理
}
```

### 2. 更容易测试
```typescript
// 可以单独测试 KeyResult 的更新逻辑
describe('KeyResult.update', () => {
  it('should validate name is not empty', () => {
    const kr = new KeyResult({ ... });
    expect(() => kr.update({ name: '' })).toThrow();
  });
  
  it('should validate target value is positive', () => {
    const kr = new KeyResult({ ... });
    expect(() => kr.update({ targetValue: -1 })).toThrow();
  });
});

// 测试聚合根只需关注聚合级别的规则
describe('Goal.updateKeyResult', () => {
  it('should validate total weight not exceed 100%', () => {
    const goal = new Goal({ ... });
    expect(() => goal.updateKeyResult(uuid, { weight: 60 })).toThrow();
  });
});
```

### 3. 更好的复用性
```typescript
// KeyResult.update() 可以在不同场景使用
// 场景1：通过聚合根更新
goal.updateKeyResult(uuid, updates);

// 场景2：应用层直接更新（如果业务允许）
const keyResult = await keyResultRepository.findByUuid(uuid);
keyResult.update(updates);
await keyResultRepository.save(keyResult);

// 场景3：工厂方法中使用
class KeyResultFactory {
  static createFromTemplate(template, overrides) {
    const kr = new KeyResult(template);
    kr.update(overrides); // 复用更新逻辑
    return kr;
  }
}
```

## 🎓 设计原则总结

1. **单一职责原则 (SRP)**
   - 每个实体只管理自己的状态
   - 聚合根只管理聚合级别的一致性

2. **开闭原则 (OCP)**
   - 修改 KeyResult 的更新逻辑不影响 Goal
   - 新增字段只需修改实体的 update 方法

3. **依赖倒置原则 (DIP)**
   - 聚合根依赖子实体的抽象方法（update）
   - 不直接操作子实体的私有字段

4. **DDD 聚合模式**
   - 聚合根控制一致性边界
   - 子实体保持自治
   - 通过聚合根访问子实体

---

**最后更新**: 2025-01-02
**负责人**: AI Agent
**状态**: ✅ 已完成实现