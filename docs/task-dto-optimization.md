# Task DTO 转换优化方案

## 背景

在 Task 模块的重构过程中，我们需要将领域对象转换为 DTO 以在主进程和渲染进程间进行 IPC 通信。最初的实现是手动映射每个字段，这导致了大量重复代码。

## 问题分析

### 原始实现的问题：
1. **代码重复**：手动映射每个字段，导致 `taskTemplateToDto` 方法超过 50 行
2. **维护困难**：当领域对象新增或修改字段时，需要同步更新 DTO 转换方法
3. **容易出错**：手动映射容易遗漏字段或类型转换错误
4. **DateTime 处理复杂**：需要手动调用 `toISOString()` 方法转换每个日期字段

### 原始代码示例：
```typescript
private taskTemplateToDto(template: TaskTemplate): TaskTemplateDto {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    timeConfig: {
      duration: template.timeConfig.duration,
      startTime: template.timeConfig.startTime?.toISOString(),
      endTime: template.timeConfig.endTime?.toISOString(),
      recurrence: template.timeConfig.recurrence ? {
        type: template.timeConfig.recurrence.type,
        interval: template.timeConfig.recurrence.interval,
        endDate: template.timeConfig.recurrence.endDate?.toISOString(),
        // ... 更多字段
      } : undefined
    },
    // ... 更多嵌套对象的手动映射
  };
}
```

## 优化方案

### 核心思路：
直接使用领域对象的 `toJSON()` 方法，然后只处理 DateTime 序列化。

### 实现要点：

#### 1. 利用领域对象的 toJSON() 方法
所有领域对象（TaskTemplate、TaskInstance、TaskMetaTemplate）都已经实现了 `toJSON()` 方法，可以直接使用。

#### 2. DateTime 类型结构分析
```typescript
export type DateTime = {
  date: DateInfo;
  time?: TimePoint;
  timestamp: number;
  isoString: string;  // 关键：已包含 ISO 字符串
};
```

#### 3. 统一的序列化处理函数
```typescript
private serializeDateTimeObjects(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // 如果是 DateTime 对象（包含 isoString 属性）
  if (obj && typeof obj === 'object' && 'isoString' in obj) {
    return obj.isoString;
  }

  // 递归处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => this.serializeDateTimeObjects(item));
  }

  // 递归处理对象
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.serializeDateTimeObjects(value);
    }
    return result;
  }

  return obj;
}
```

#### 4. 简化后的转换方法
```typescript
private taskTemplateToDto(template: TaskTemplate): TaskTemplateDto {
  const json = template.toJSON();
  return this.serializeDateTimeObjects(json);
}

private taskInstanceToDto(instance: TaskInstance): TaskInstanceDto {
  const json = instance.toJSON();
  return this.serializeDateTimeObjects(json);
}

private taskMetaTemplateToDto(metaTemplate: TaskMetaTemplate): TaskMetaTemplateDto {
  const json = metaTemplate.toJSON();
  return this.serializeDateTimeObjects(json);
}
```

## 优化效果

### 代码行数对比：
- **优化前**：每个转换方法 50+ 行，总计 150+ 行
- **优化后**：每个转换方法 3 行，加上通用处理函数 25 行，总计 34 行

### 维护性提升：
1. **自动同步**：领域对象新增字段时，DTO 自动包含新字段
2. **类型安全**：依赖 TypeScript 类型检查，减少运行时错误
3. **统一处理**：所有 DateTime 转换逻辑集中在一个函数中

### 性能优化：
1. **减少重复代码**：避免手动映射的性能开销
2. **递归优化**：只对包含 DateTime 的对象进行深度遍历
3. **早期返回**：基本类型和空值直接返回，避免不必要的处理

## 注意事项

### 1. DTO 类型定义要求
- DTO 类型定义必须与领域对象的 `toJSON()` 输出结构匹配
- DateTime 字段在 DTO 中应定义为字符串类型

### 2. 序列化边界案例
- 处理 `null` 和 `undefined` 值
- 处理嵌套的数组和对象
- 确保非 DateTime 对象不被错误转换

### 3. 向后兼容性
- 如果领域对象的 `toJSON()` 方法发生变化，需要同步更新 DTO 类型定义
- 考虑版本控制和数据迁移策略

## 最佳实践建议

### 1. DTO 转换原则
- 优先使用领域对象的 `toJSON()` 方法
- 只在必要时进行额外的数据转换
- 保持转换逻辑的简单性和一致性

### 2. 类型定义维护
- DTO 类型定义应该反映序列化后的数据结构
- 使用 TypeScript 的类型检查确保一致性
- 定期review DTO 与领域对象的匹配程度

### 3. 测试策略
- 添加单元测试验证 DTO 转换的正确性
- 测试边界情况（空值、嵌套结构、DateTime 字段）
- 确保序列化后的数据可以正确反序列化

## 总结

通过利用领域对象已有的 `toJSON()` 方法和 DateTime 类型的 `isoString` 属性，我们大幅简化了 DTO 转换逻辑，提高了代码的可维护性和可读性。这种方法不仅减少了重复代码，还确保了 DTO 与领域对象的自动同步，是一个既优雅又实用的解决方案。
