# DDD聚合根工厂方法重构 - 移除冗余工厂方法

## 🎯 重构背景

在之前的DDD聚合根实现中，我们为实体创建维护了两套机制：

1. **实体类自身的工厂方法** - `KeyResult.fromDTO()`, `GoalRecord.fromDTO()`
2. **聚合根中的工厂方法** - `createKeyResultEntity()`, `createGoalRecordEntity()`

这造成了代码重复和维护复杂性。

## ❌ 重构前的问题

### 代码重复
```typescript
// 在聚合根中维护工厂方法
protected abstract createKeyResultEntity(dto: IKeyResult): KeyResultCore;
protected abstract createGoalRecordEntity(dto: IGoalRecord): GoalRecordCore;

// 在子类中实现
protected createKeyResultEntity(dto: IKeyResult): KeyResult {
  return KeyResult.fromDTO({
    uuid: dto.uuid,
    accountUuid: dto.accountUuid,
    // ... 大量重复的转换代码
  });
}

// 而实体类已经有了相同功能
static fromDTO(dto: GoalContracts.KeyResultDTO): KeyResult {
  return new KeyResult({
    uuid: dto.uuid,
    accountUuid: dto.accountUuid,
    // ... 同样的转换逻辑
  });
}
```

### 维护复杂性
- ✅ 实体添加新字段 → ❌ 需要同时更新两处代码
- ✅ 修复转换逻辑 → ❌ 需要在多个地方重复修改
- ✅ 添加验证逻辑 → ❌ 不确定在哪里添加

## ✅ 重构后的简化

### 1. 移除聚合根中的冗余工厂方法

```typescript
// ❌ 删除：不再需要抽象工厂方法
// protected abstract createKeyResultEntity(dto: IKeyResult): KeyResultCore;
// protected abstract createGoalRecordEntity(dto: IGoalRecord): GoalRecordCore;

// ❌ 删除：不再需要具体实现
// protected createKeyResultEntity(dto: IKeyResult): KeyResult { ... }
// protected createGoalRecordEntity(dto: IGoalRecord): GoalRecord { ... }
```

### 2. 直接使用实体的静态工厂方法

```typescript
// ✅ 现在：直接使用实体的 fromDTO 方法
addKeyResult(keyResult: IKeyResult): void {
  // 转换接口格式到 DTO 格式
  const keyResultDTO: GoalContracts.KeyResultDTO = {
    uuid: keyResult.uuid,
    accountUuid: keyResult.accountUuid,
    // ... 其他字段
    lifecycle: {
      createdAt: keyResult.lifecycle.createdAt.getTime(), // Date → number
      updatedAt: keyResult.lifecycle.updatedAt.getTime(), // Date → number
      status: keyResult.lifecycle.status,
    },
  };

  // 直接使用实体的工厂方法
  const keyResultEntity = KeyResult.fromDTO(keyResultDTO);
  this.keyResults.push(keyResultEntity);
  this.updateVersion();
}
```

### 3. 处理类型转换

```typescript
// ✅ 智能类型转换：自动处理 Date ↔ number 转换
constructor(params: { keyResults?: any[] }) {
  super(params);
  
  this.keyResults = (params.keyResults || []).map((dto) => {
    // 如果是接口格式（Date 类型），转换为 DTO 格式（number 类型）
    if (dto.lifecycle && dto.lifecycle.createdAt instanceof Date) {
      const convertedDto: GoalContracts.KeyResultDTO = {
        ...dto,
        lifecycle: {
          ...dto.lifecycle,
          createdAt: dto.lifecycle.createdAt.getTime(),
          updatedAt: dto.lifecycle.updatedAt.getTime(),
        }
      };
      return KeyResult.fromDTO(convertedDto);
    }
    // 如果已经是 DTO 格式，直接使用
    return KeyResult.fromDTO(dto);
  });
}
```

## 🏆 重构收益

### 1. **代码简化**
- ❌ **删除** 4个抽象工厂方法声明
- ❌ **删除** 2个具体工厂方法实现
- ✅ **保留** 实体自身的 `fromDTO()` 方法（单一职责）

### 2. **维护性提升**
- ✅ **单一数据源** - 只在实体类中维护转换逻辑
- ✅ **一处修改** - 添加字段只需修改实体类
- ✅ **类型安全** - TypeScript 确保转换正确性

### 3. **架构清晰**
- ✅ **职责分离** - 实体负责自己的创建逻辑
- ✅ **聚合专注** - 聚合根专注业务规则而非数据转换
- ✅ **符合DDD** - 实体封装自己的生命周期管理

## 🔧 实现要点

### 1. 类型转换处理
```typescript
// 关键：正确处理 Interface ↔ DTO 的类型差异
// IKeyResult.lifecycle.createdAt: Date
// KeyResultDTO.lifecycle.createdAt: number

// 解决方案：转换时处理类型差异
const keyResultDTO: GoalContracts.KeyResultDTO = {
  ...keyResult,
  lifecycle: {
    ...keyResult.lifecycle,
    createdAt: keyResult.lifecycle.createdAt.getTime(), // Date → number
    updatedAt: keyResult.lifecycle.updatedAt.getTime(),
  },
};
```

### 2. 聚合根架构调整
```typescript
// domain-core: 定义抽象接口
export abstract class GoalCore extends AggregateRoot {
  abstract addKeyResult(keyResult: IKeyResult): void;
  abstract updateKeyResultProgress(keyResultUuid: string, increment: number, note?: string): void;
}

// domain-client: 实现具体逻辑
export class Goal extends GoalCore {
  addKeyResult(keyResult: IKeyResult): void {
    // 使用实体的 fromDTO 而不是聚合根的工厂方法
    const entity = KeyResult.fromDTO(convertToDTO(keyResult));
    this.keyResults.push(entity);
  }
}
```

### 3. 智能构造函数
```typescript
constructor(params: { keyResults?: any[] }) {
  // 智能检测数据格式并转换
  this.keyResults = (params.keyResults || []).map((dto) => {
    if (dto.lifecycle?.createdAt instanceof Date) {
      // Interface 格式 → DTO 格式 → 实体
      return KeyResult.fromDTO(convertInterfaceToDTO(dto));
    }
    // 已经是 DTO 格式 → 直接创建实体
    return KeyResult.fromDTO(dto);
  });
}
```

## 🚀 最佳实践总结

### ✅ DO - 推荐做法
1. **实体负责自己的创建** - `Entity.fromDTO()`, `Entity.forCreate()`
2. **聚合根调用实体方法** - 不重复实现转换逻辑
3. **类型转换集中处理** - 在调用点处理类型差异
4. **智能构造函数** - 自动检测数据格式

### ❌ DON'T - 避免做法
1. **重复工厂方法** - 聚合根和实体都有创建逻辑
2. **硬编码类型转换** - 散布在多个地方的转换代码
3. **忽略类型差异** - Interface vs DTO 的字段类型不一致
4. **混合职责** - 聚合根既做业务又做数据转换

## 🎯 架构价值

这次重构体现了几个重要的设计原则：

1. **DRY (Don't Repeat Yourself)** - 消除重复代码
2. **SRP (Single Responsibility Principle)** - 实体负责自己的创建
3. **Open/Closed Principle** - 扩展实体不需要修改聚合根
4. **Dependency Inversion** - 聚合根依赖实体接口而非具体实现

通过这次重构，我们的DDD架构变得更加纯粹和易维护！🎉

## 📊 重构统计

- **删除代码行数**: ~80 行
- **新增代码行数**: ~40 行  
- **净减少**: ~40 行代码
- **消除重复**: 4个工厂方法
- **提升维护性**: 单一数据源，一处修改
- **增强类型安全**: 智能类型转换
