# Task 模块序列化/反序列化实现总结

## 概述

在 Task 模块的主进程-渲染进程分离重构中，我们为所有领域实体实现了完整的序列化/反序列化机制，确保数据能够在不同进程间安全传输，并能够正确地持久化和恢复。

## 实现的方法

### 1. 序列化方法：`toJSON()`

所有领域实体（`TaskTemplate`、`TaskInstance`、`TaskMetaTemplate`）都实现了 `toJSON()` 方法：

```typescript
toJSON(): any {
  return {
    id: this.id,
    title: this._title,
    description: this._description,
    timeConfig: this._timeConfig,
    reminderConfig: this._reminderConfig,
    schedulingPolicy: this._schedulingPolicy,
    metadata: this._metadata,
    lifecycle: this._lifecycle,
    analytics: this._analytics,
    keyResultLinks: this._keyResultLinks,
    version: this._version,
  };
}
```

**特点：**
- 导出所有需要持久化的私有字段
- DateTime 对象自动序列化为 ISO 字符串
- 直接用于 IPC 通信和数据持久化

### 2. 反序列化方法

每个领域实体提供三个静态反序列化方法：

#### `fromCompleteData(data: any)` - 核心实现

```typescript
static fromCompleteData(data: any): TaskTemplate {
  // 创建基础实例
  const instance = new TaskTemplate(
    data.id || data._id,
    data.title || data._title,
    data.timeConfig || data._timeConfig,
    data.reminderConfig || data._reminderConfig,
    {
      description: data.description || data._description,
      // ... 其他选项
    }
  );

  // 恢复完整状态
  if (data.lifecycle || data._lifecycle) {
    const lifecycle = data.lifecycle || data._lifecycle;
    instance._lifecycle = {
      status: lifecycle.status || "draft",
      createdAt: TimeUtils.ensureDateTime(lifecycle.createdAt),
      updatedAt: TimeUtils.ensureDateTime(lifecycle.updatedAt),
      // ... 其他字段
    };
  }

  return instance;
}
```

#### `fromJSON(data: any)` - 标准别名

```typescript
static fromJSON(data: any): TaskTemplate {
  return TaskTemplate.fromCompleteData(data);
}
```

#### `fromDto(dto: any)` - DTO 转换别名

```typescript
static fromDto(dto: any): TaskTemplate {
  return TaskTemplate.fromCompleteData(dto);
}
```

#### `createFromDto(dto: CreateTaskTemplateDto)` - 创建场景专用

```typescript
static createFromDto(dto: CreateTaskTemplateDto): TaskTemplate {
  const id = crypto.randomUUID();
  
  // 转换 DTO 到领域模型格式
  const timeConfig: TaskTimeConfig = {
    type: "timed",
    baseTime: {
      start: dto.timeConfig.startTime || TimeUtils.now(),
      end: dto.timeConfig.endTime,
      duration: dto.timeConfig.duration,
    },
    recurrence: dto.timeConfig.recurrence || { type: "none" },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dstHandling: "auto",
  };

  const reminderConfig: TaskReminderConfig = {
    enabled: dto.reminderConfig.enabled,
    alerts: dto.reminderConfig.alerts.map(alert => ({
      id: alert.id,
      timing: { type: "relative", minutesBefore: 15 },
      type: "notification",
      message: alert.message,
    })),
    snooze: {
      enabled: dto.reminderConfig.snoozeSettings.enabled,
      interval: dto.reminderConfig.snoozeSettings.defaultDuration,
      maxCount: dto.reminderConfig.snoozeSettings.maxSnoozeCount,
    },
  };

  return new TaskTemplate(id, dto.title, timeConfig, reminderConfig, {
    description: dto.description,
    keyResultLinks: dto.keyResultLinks?.map(link => ({
      goalId: link.goalId,
      keyResultId: link.keyResultId,
      incrementValue: link.contribution || 1,
    })),
    // ... 其他选项
  });
}
```

### 3. 对象克隆：`clone()`

利用序列化/反序列化实现深度克隆：

```typescript
clone(): TaskTemplate {
  return TaskTemplate.fromCompleteData(this.toJSON());
}
```

## 类型转换处理

### DateTime 对象

- **序列化**：DateTime 对象自动转换为 ISO 字符串
- **反序列化**：使用 `TimeUtils.ensureDateTime()` 恢复 DateTime 对象

### 不同模式的类型转换

#### DTO 到领域模型的字段映射

| DTO 字段 | 领域模型字段 | 转换说明 |
|---------|-------------|----------|
| `TaskTimeConfigDto.startTime` | `TaskTimeConfig.baseTime.start` | 时间配置结构不同 |
| `TaskReminderConfigDto.snoozeSettings` | `TaskReminderConfig.snooze` | 字段名称不同 |
| `KeyResultLinkDto.contribution` | `KeyResultLink.incrementValue` | 语义相同，字段名不同 |

#### 兼容性处理

反序列化方法支持多种数据格式：

```typescript
// 支持直接属性名和私有属性名
title: data.title || data._title,
description: data.description || data._description,

// 支持嵌套对象的不同格式
const lifecycle = data.lifecycle || data._lifecycle;
```

## 在应用服务中的使用

### MainTaskApplicationService 中的 DTO 转换

```typescript
export class MainTaskApplicationService {
  // 简单的 DTO 转换方法
  private taskTemplateToDto(template: TaskTemplate): TaskTemplateDto {
    return template.toJSON();
  }

  private taskInstanceToDto(instance: TaskInstance): TaskInstanceDto {
    return instance.toJSON();
  }

  private taskMetaTemplateToDto(metaTemplate: TaskMetaTemplate): TaskMetaTemplateDto {
    return metaTemplate.toJSON();
  }

  // 创建新任务模板
  async createTaskTemplate(dto: CreateTaskTemplateDto): Promise<TaskResponse<TaskTemplateDto>> {
    try {
      // 使用专门的创建方法
      const template = TaskTemplate.createFromDto(dto);
      
      const validation = TaskTemplateValidator.validate(template);
      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(", ") };
      }

      const response = await this.taskTemplateRepo.save(template);
      if (!response.success) {
        return { success: false, message: response.message };
      }
      
      return { success: true, data: this.taskTemplateToDto(template) };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to create task template: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  // 获取任务模板
  async getTaskTemplate(id: string): Promise<TaskResponse<TaskTemplateDto>> {
    try {
      const response = await this.taskTemplateRepo.findById(id);
      if (!response.success || !response.data) {
        return { success: false, message: `Task template with id ${id} not found` };
      }
      return { success: true, data: this.taskTemplateToDto(response.data) };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to get task template: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }
}
```

## 优势

1. **类型安全**：虽然使用 `any` 类型以支持灵活性，但在内部进行严格的类型检查
2. **兼容性**：支持多种数据格式，包括历史数据和不同版本的结构
3. **性能**：直接使用 `toJSON()` 方法，避免额外的序列化开销
4. **可维护性**：清晰的方法命名和职责分离
5. **扩展性**：可以轻松添加新的转换逻辑和字段处理

## 最佳实践

1. **职责分离**：
   - 主进程：使用领域对象进行业务逻辑处理
   - 渲染进程：主要使用 DTO 进行数据展示
   - IPC 通信：始终使用 DTO

2. **防御性编程**：
   - 提供合理的默认值
   - 处理可能的 null/undefined 值
   - 支持多种数据格式

3. **性能优化**：
   - 避免不必要的序列化/反序列化
   - 使用浅拷贝当深拷贝不必要时

4. **测试覆盖**：
   - 序列化/反序列化往返测试
   - 不同数据格式的兼容性测试
   - 边界情况测试

## 下一步

1. 为其他模块（Goal、Account 等）实现类似的序列化机制
2. 添加自动化测试确保序列化/反序列化的正确性
3. 考虑实现版本化序列化以支持数据迁移
4. 优化性能，特别是大量数据的序列化场景
