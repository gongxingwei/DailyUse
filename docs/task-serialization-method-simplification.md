# Task 模块序列化方法简化

## 简化前后对比

### 简化前

每个领域实体都有多个反序列化方法：

```typescript
export class TaskTemplate {
  // 核心实现
  static fromCompleteData(data: any): TaskTemplate { ... }
  
  // 别名方法（冗余）
  static fromJSON(data: any): TaskTemplate {
    return TaskTemplate.fromCompleteData(data);
  }
  
  static fromDto(dto: any): TaskTemplate {
    return TaskTemplate.fromCompleteData(dto);
  }
  
  // 创建专用方法
  static createFromDto(dto: CreateTaskTemplateDto): TaskTemplate { ... }
}
```

### 简化后

移除冗余的 `fromDto` 方法，保留核心功能：

```typescript
export class TaskTemplate {
  // 核心实现（内部使用）
  static fromCompleteData(data: any): TaskTemplate { ... }
  
  // 标准反序列化方法（对外接口）
  static fromJSON(data: any): TaskTemplate {
    return TaskTemplate.fromCompleteData(data);
  }
  
  // 创建专用方法（处理类型转换）
  static createFromDto(dto: CreateTaskTemplateDto): TaskTemplate { ... }
}
```

## 设计理念

### 1. 方法职责明确

- **`fromCompleteData()`**：核心反序列化实现，处理各种数据格式的兼容性
- **`fromJSON()`**：标准反序列化接口，用于所有序列化数据的恢复
- **`createFromDto()`**：创建场景专用，处理DTO到领域模型的类型转换

### 2. 使用场景分离

```typescript
// 场景1: 从持久化数据恢复领域对象
const template = TaskTemplate.fromJSON(persistedData);

// 场景2: 从IPC传输的数据恢复领域对象  
const template = TaskTemplate.fromJSON(ipcData);

// 场景3: 创建新的领域对象（需要类型转换）
const template = TaskTemplate.createFromDto(createDto);
```

### 3. 简化的调用路径

**数据恢复（使用 fromJSON）：**
```
序列化数据 → fromJSON() → fromCompleteData() → 领域对象
```

**对象创建（使用 createFromDto）：**
```
创建DTO → createFromDto() → 类型转换 → new TaskTemplate() → 领域对象
```

## 核心优势

### 1. 减少API复杂度
- 移除了功能重复的 `fromDto()` 方法
- 使API更加简洁明了

### 2. 职责更加清晰
- `fromJSON()`: 处理已序列化的完整数据
- `createFromDto()`: 处理创建场景的类型转换

### 3. 更好的语义表达
```typescript
// 清晰的语义：从JSON数据恢复
const template = TaskTemplate.fromJSON(jsonData);

// 清晰的语义：从DTO创建新对象
const newTemplate = TaskTemplate.createFromDto(createDto);
```

## 统一的序列化/反序列化模式

### 三个核心实体的统一接口

```typescript
// TaskTemplate
class TaskTemplate {
  static fromCompleteData(data: any): TaskTemplate
  static fromJSON(data: any): TaskTemplate  
  static createFromDto(dto: CreateTaskTemplateDto): TaskTemplate
  toJSON(): ITaskTemplate
}

// TaskInstance  
class TaskInstance {
  static fromCompleteData(data: any): TaskInstance
  static fromJSON(data: any): TaskInstance
  toJSON(): ITaskInstance
}

// TaskMetaTemplate
class TaskMetaTemplate {
  static fromCompleteData(data: any): TaskMetaTemplate
  static fromJSON(data: any): TaskMetaTemplate
  toJSON(): ITaskMetaTemplate
}
```

### 注意差异

- **TaskTemplate**: 有 `createFromDto()` 方法，因为需要处理创建场景的复杂类型转换
- **TaskInstance/TaskMetaTemplate**: 没有 `createFromDto()` 方法，因为它们的创建逻辑相对简单

## 实际使用示例

### 应用服务中的使用

```typescript
export class MainTaskApplicationService {
  // 获取数据：返回序列化后的接口数据
  async getTaskTemplate(id: string): Promise<TaskResponse<ITaskTemplate>> {
    const template = await this.repository.findById(id);
    return { success: true, data: template.toJSON() };
  }
  
  // 创建数据：从DTO创建新对象
  async createTaskTemplate(dto: CreateTaskTemplateDto): Promise<TaskResponse<ITaskTemplate>> {
    const template = TaskTemplate.createFromDto(dto);
    await this.repository.save(template);
    return { success: true, data: template.toJSON() };
  }
}
```

### 仓储层中的使用

```typescript
export class TaskRepository {
  async findById(id: string): Promise<TaskTemplate | null> {
    const data = await this.database.findById(id);
    return data ? TaskTemplate.fromJSON(data) : null;
  }
  
  async save(template: TaskTemplate): Promise<void> {
    const data = template.toJSON();
    await this.database.save(data);
  }
}
```

## 总结

通过这次简化，我们实现了：

1. **API简洁性**: 移除了冗余的 `fromDto()` 方法
2. **职责明确性**: 每个方法都有清晰的使用场景
3. **一致性**: 所有实体都遵循相同的序列化/反序列化模式
4. **可维护性**: 减少了需要维护的方法数量

现在的设计更加简洁和一致，同时保持了所有必要的功能。
