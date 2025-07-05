# 领域对象序列化/反序列化最佳实践

## 概述

在主进程-渲染进程分离的架构中，领域对象需要在以下场景进行序列化和反序列化：

1. **进程间通信**：通过 IPC 在主进程和渲染进程之间传递数据
2. **数据持久化**：存储到数据库或文件系统
3. **对象克隆**：创建对象的深度副本
4. **缓存处理**：序列化对象以供缓存使用

## 设计原则

### 1. 序列化方法：`toJSON()`

所有领域实体都应实现 `toJSON()` 方法：

```typescript
toJSON(): any {
  return {
    id: this.id,
    // 所有私有字段的完整导出
    title: this._title,
    description: this._description,
    // 复杂对象原样导出（DateTime对象会自动序列化为ISO字符串）
    lifecycle: this._lifecycle,
    metadata: this._metadata,
    version: this._version,
  };
}
```

**关键点：**
- 导出所有需要持久化的私有字段
- 不需要手动处理 DateTime 对象，它们会自动序列化为 ISO 字符串
- 返回类型为 `any`，便于跨进程传输

### 2. 反序列化方法：`fromCompleteData()` 和别名

每个领域实体都应提供三个静态反序列化方法：

```typescript
/**
 * 从完整数据创建实例（核心实现）
 */
static fromCompleteData(data: any): DomainEntity {
  // 创建基础实例
  const instance = new DomainEntity(/* 构造参数 */);
  
  // 恢复完整状态
  instance._privateField = data.privateField || data._privateField;
  
  // 处理复杂对象和日期
  if (data.lifecycle) {
    instance._lifecycle = {
      ...data.lifecycle,
      createdAt: TimeUtils.ensureDateTime(data.lifecycle.createdAt),
      updatedAt: TimeUtils.ensureDateTime(data.lifecycle.updatedAt),
    };
  }
  
  return instance;
}

/**
 * 标准反序列化方法（fromCompleteData的别名）
 */
static fromJSON(data: any): DomainEntity {
  return DomainEntity.fromCompleteData(data);
}

/**
 * 从DTO恢复领域对象（fromCompleteData的别名）
 */
static fromDto(dto: any): DomainEntity {
  return DomainEntity.fromCompleteData(dto);
}
```

### 3. 对象克隆：`clone()`

利用序列化/反序列化实现深度克隆：

```typescript
clone(): DomainEntity {
  return DomainEntity.fromCompleteData(this.toJSON());
}
```

## 实现细节

### DateTime 处理

- **序列化时**：DateTime 对象自动转换为 ISO 字符串
- **反序列化时**：使用 `TimeUtils.ensureDateTime()` 将字符串转换回 DateTime 对象

```typescript
// 反序列化时的日期处理
createdAt: TimeUtils.ensureDateTime(data.createdAt),
updatedAt: TimeUtils.ensureDateTime(data.updatedAt),
```

### 兼容性处理

反序列化方法应支持不同的数据格式：

```typescript
// 支持直接属性名和带下划线的私有属性名
title: data.title || data._title,
description: data.description || data._description,

// 支持嵌套对象的不同格式
const lifecycle = data.lifecycle || data._lifecycle;
```

### 类型安全

虽然参数类型是 `any`，但在内部应进行适当的类型检查和默认值处理：

```typescript
status: lifecycle.status || "draft",
priority: data.priority || data._priority || 3,
tags: data.metadata?.tags || data._metadata?.tags || [],
```

## 使用场景

### 1. 主进程 Application Service

```typescript
class MainTaskApplicationService {
  async createTaskTemplate(dto: CreateTaskTemplateDto): Promise<TaskTemplateDto> {
    // 从DTO创建领域对象
    const template = new TaskTemplate(/* ... */);
    
    // 保存到仓储
    await this.repository.save(template);
    
    // 返回DTO
    return template.toJSON();
  }
  
  async getTaskTemplate(id: string): Promise<TaskTemplateDto | null> {
    // 从仓储获取
    const template = await this.repository.findById(id);
    
    // 转换为DTO返回
    return template ? template.toJSON() : null;
  }
}
```

### 2. 渲染进程 Service Client

```typescript
class TaskServiceClient {
  async createTaskTemplate(dto: CreateTaskTemplateDto): Promise<TaskTemplateDto> {
    // 通过IPC发送DTO到主进程
    return await ipcRenderer.invoke('task:createTemplate', dto);
  }
  
  // 如果需要在渲染进程重建领域对象（一般不推荐）
  private toDomainObject(dto: TaskTemplateDto): TaskTemplate {
    return TaskTemplate.fromDto(dto);
  }
}
```

### 3. 数据持久化

```typescript
class TaskRepository {
  async save(template: TaskTemplate): Promise<void> {
    // 序列化为JSON存储
    const data = template.toJSON();
    await this.database.save(data);
  }
  
  async findById(id: string): Promise<TaskTemplate | null> {
    const data = await this.database.findById(id);
    if (!data) return null;
    
    // 从持久化数据反序列化
    return TaskTemplate.fromCompleteData(data);
  }
}
```

## 最佳实践

1. **职责分离**：渲染进程主要使用DTO，主进程使用领域对象
2. **类型一致性**：DTO类型定义要与领域对象的toJSON()返回结构保持一致
3. **防御性编程**：反序列化时提供合理的默认值和类型检查
4. **性能考虑**：避免不必要的序列化/反序列化操作
5. **测试覆盖**：确保序列化/反序列化的往返测试通过

## 示例测试

```typescript
describe('TaskTemplate Serialization', () => {
  it('should serialize and deserialize correctly', () => {
    const original = new TaskTemplate(/* ... */);
    const json = original.toJSON();
    const restored = TaskTemplate.fromJSON(json);
    
    expect(restored.id).toBe(original.id);
    expect(restored.title).toBe(original.title);
    expect(restored.lifecycle.createdAt).toEqual(original.lifecycle.createdAt);
  });
  
  it('should clone correctly', () => {
    const original = new TaskTemplate(/* ... */);
    const cloned = original.clone();
    
    expect(cloned).not.toBe(original);
    expect(cloned.id).toBe(original.id);
    expect(cloned.title).toBe(original.title);
  });
});
```

## 总结

通过实现标准的 `toJSON()` 和 `fromJSON()`/`fromCompleteData()` 方法，我们建立了一套完整的领域对象序列化/反序列化机制，确保了：

- 主进程和渲染进程之间的数据传输
- 领域对象的持久化和恢复
- 对象的深度克隆
- 类型安全和兼容性

这套机制为整个应用的数据流提供了坚实的基础。
