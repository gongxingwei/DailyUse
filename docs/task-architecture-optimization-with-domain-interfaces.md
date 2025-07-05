# Task 模块架构优化：使用领域接口替代专门的 DTO

## 改进概述

基于你的建议，我们将 Task 模块的数据传输架构从"专门的 DTO" 改为"直接使用领域接口"，这样既保持了类型安全，又减少了代码冗余。

## 架构对比

### 之前的方案：专门的 DTO

```typescript
// 需要维护额外的DTO类型
export interface TaskTemplateDto {
  id: string;
  title: string;
  description?: string;
  // ... 所有字段
}

// 应用服务中的转换
private taskTemplateToDto(template: TaskTemplate): TaskTemplateDto {
  return template.toJSON();
}

async getTaskTemplate(id: string): Promise<TaskResponse<TaskTemplateDto>> {
  const template = await this.repository.findById(id);
  return { success: true, data: this.taskTemplateToDto(template) };
}
```

### 现在的方案：领域接口

```typescript
// 直接使用领域接口
export interface ITaskTemplate {
  id: string;
  title: string;
  description?: string;
  // ... 所有字段
}

// 应用服务中的转换
private taskTemplateToData(template: TaskTemplate): ITaskTemplate {
  return template.toJSON();
}

async getTaskTemplate(id: string): Promise<TaskResponse<ITaskTemplate>> {
  const template = await this.repository.findById(id);
  return { success: true, data: this.taskTemplateToData(template) };
}
```

## 核心改进

### 1. 类型统一化

**领域实体实现接口：**
```typescript
export class TaskTemplate extends AggregateRoot implements ITaskTemplate {
  // ... 实现
  
  toJSON(): ITaskTemplate {
    return {
      id: this.id,
      title: this._title,
      description: this._description,
      // ... 所有字段
    };
  }
}
```

**应用服务直接返回接口类型：**
```typescript
export class MainTaskApplicationService {
  async getAllTaskTemplates(): Promise<TaskResponse<ITaskTemplate[]>> {
    const response = await this.taskTemplateRepo.findAll();
    const data = (response.data || []).map(template => template.toJSON());
    return { success: true, data };
  }
}
```

### 2. 新增的领域接口

我们为三个核心实体创建了对应的接口：

```typescript
// 任务模板接口
export interface ITaskTemplate {
  id: string;
  title: string;
  description?: string;
  timeConfig: TaskTimeConfig;
  reminderConfig: TaskReminderConfig;
  schedulingPolicy: TaskSchedulingPolicy;
  metadata: TaskMetadata;
  lifecycle: TaskLifecycle;
  analytics: TaskAnalytics;
  keyResultLinks?: KeyResultLink[];
  version: number;
}

// 任务实例接口
export interface ITaskInstance {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  timeConfig: TaskInstanceTimeConfig;
  actualStartTime?: DateTime;
  actualEndTime?: DateTime;
  // ... 其他字段
}

// 任务元模板接口
export interface ITaskMetaTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  defaultTimeConfig: TaskTimeConfig;
  defaultReminderConfig: TaskReminderConfig;
  defaultMetadata: TaskMetadata;
  lifecycle: TaskMetaLifecycle;
}
```

### 3. 方法重命名

为了更好地反映其作用，我们将方法重命名：

```typescript
// 之前
private taskTemplateToDto(template: TaskTemplate): TaskTemplateDto
private taskInstanceToDto(instance: TaskInstance): TaskInstanceDto  
private taskMetaTemplateToDto(metaTemplate: TaskMetaTemplate): TaskMetaTemplateDto

// 现在
private taskTemplateToData(template: TaskTemplate): ITaskTemplate
private taskInstanceToData(instance: TaskInstance): ITaskInstance
private taskMetaTemplateToData(metaTemplate: TaskMetaTemplate): ITaskMetaTemplate
```

## 优势分析

### 1. 减少代码冗余
- **之前**：需要维护独立的 DTO 类型定义
- **现在**：直接使用领域接口，减少重复定义

### 2. 类型一致性
- **之前**：DTO 类型和领域接口可能不同步
- **现在**：领域实体直接实现接口，确保类型一致

### 3. 维护简化
- **之前**：需要同时维护 DTO 和领域接口
- **现在**：只需要维护领域接口

### 4. 序列化优化
```typescript
// toJSON() 方法现在有明确的返回类型
toJSON(): ITaskTemplate {
  return {
    id: this.id,
    title: this._title,
    // ... 确保返回符合接口的完整数据
  };
}
```

## 数据流程

### 1. 主进程 → 渲染进程

```typescript
// 主进程应用服务
async getTaskTemplate(id: string): Promise<TaskResponse<ITaskTemplate>> {
  const template = await this.repository.findById(id);
  return { success: true, data: template.toJSON() }; // 返回 ITaskTemplate
}

// IPC 传输：ITaskTemplate 数据
// 渲染进程接收：ITaskTemplate 数据
```

### 2. 渲染进程 → 主进程

```typescript
// 渲染进程发送：CreateTaskTemplateDto
// IPC 传输：CreateTaskTemplateDto 数据

// 主进程应用服务
async createTaskTemplate(dto: CreateTaskTemplateDto): Promise<TaskResponse<ITaskTemplate>> {
  const template = TaskTemplate.createFromDto(dto); // DTO → 领域对象
  await this.repository.save(template);
  return { success: true, data: template.toJSON() }; // 返回 ITaskTemplate
}
```

### 3. 数据持久化

```typescript
// 保存时：领域对象 → toJSON() → ITaskTemplate → 序列化存储
await repository.save(template);

// 加载时：反序列化 → ITaskTemplate → fromJSON() → 领域对象
const template = TaskTemplate.fromJSON(data);
```

## 兼容性处理

我们保留了创建场景的特殊处理：

```typescript
// 创建时仍然使用专门的 CreateTaskTemplateDto
static createFromDto(dto: CreateTaskTemplateDto): TaskTemplate {
  // 处理 DTO 到领域模型的字段转换
  const timeConfig: TaskTimeConfig = {
    type: "timed",
    baseTime: {
      start: dto.timeConfig.startTime || TimeUtils.now(),
      end: dto.timeConfig.endTime,
      duration: dto.timeConfig.duration,
    },
    // ... 其他转换逻辑
  };
  
  return new TaskTemplate(id, dto.title, timeConfig, reminderConfig, options);
}
```

## 总结

通过这次优化，我们实现了：

1. **简化架构**：减少了 DTO 类型定义的维护负担
2. **类型安全**：领域实体直接实现接口，确保类型一致性
3. **代码减少**：消除了重复的类型定义
4. **维护友好**：只需要维护领域接口即可

这种方案在保持类型安全的同时，大大简化了代码结构，正如你所建议的那样，直接传输结构化的数据，而不需要额外的 DTO 结构。

**核心理念**：`toJSON()` 返回的数据结构就是我们需要的传输格式，无需额外的转换层。
