# TaskTemplate 聚合根增强 - 完整子实体支持

**日期**: 2025-10-05  
**作者**: GitHub Copilot  
**目的**: 完善 TaskTemplate 聚合根的子实体（TaskInstance）支持，实现完整的 DTO 转换

---

## 概述

本次修改为 `TaskTemplate` 聚合根添加了完整的子实体支持，确保在 `toDTO` 和 `fromDTO` 转换过程中，能够正确处理 `TaskInstance` 子实体的序列化和反序列化。

---

## 修改内容

### 1. 服务端 TaskTemplate (domain-server)

**文件**: `packages/domain-server/src/task/aggregates/TaskTemplate.ts`

#### 新增属性

```typescript
export class TaskTemplate extends TaskTemplateCore {
  // 聚合根包含子实体：TaskInstance 列表
  private _instances: TaskInstance[] = [];
```

#### 新增方法

```typescript
/**
 * 获取所有实例（只读）
 */
get instances(): TaskInstance[] {
  return [...this._instances];
}

/**
 * 添加实例到聚合根
 */
addInstance(instance: TaskInstance): void {
  this._instances.push(instance);
  this.updateStats(this._instances.length, this._instances.filter(i => i.isCompleted).length);
}

/**
 * 移除实例
 */
removeInstance(instanceUuid: string): void {
  this._instances = this._instances.filter(i => i.uuid !== instanceUuid);
  this.updateStats(this._instances.length, this._instances.filter(i => i.isCompleted).length);
}

/**
 * 获取特定实例
 */
getInstance(instanceUuid: string): TaskInstance | undefined {
  return this._instances.find(i => i.uuid === instanceUuid);
}
```

#### 修改的方法

**1. constructor** - 接收并初始化子实体

```typescript
constructor(params: {
  // ... 其他参数
  instances?: TaskInstance[]; // 直接接收实体形式
}) {
  super(params);
  
  // 初始化子实体列表
  if (params.instances) {
    this._instances = params.instances;
  }
}
```

**2. fromDTO** - 从 DTO 恢复完整的聚合根（包括子实体）

```typescript
static fromDTO(dto: TaskContracts.TaskTemplateDTO): TaskTemplate {
  // 首先转换子实体
  const instances = dto.instances?.map(instanceDTO => TaskInstance.fromDTO(instanceDTO)) || [];

  return new TaskTemplate({
    // ... 其他字段
    instances: instances, // 传入转换后的子实体
  });
}
```

**3. toDTO** - 转换为 DTO（包括子实体）

```typescript
toDTO(): TaskContracts.TaskTemplateDTO {
  return {
    // ... 其他字段
    // 转换子实体为 DTO
    instances: this._instances.map(instance => instance.toDTO()),
  };
}
```

---

### 2. 客户端 TaskTemplate (domain-client)

**文件**: `packages/domain-client/src/task/aggregates/TaskTemplate.ts`

客户端的 TaskTemplate 已经有完整的聚合根管理功能，本次主要修复了两个问题：

#### 修复 1: fromDTO 中的数组包装错误

**修改前**:
```typescript
instances: [
  dto.instances ? dto.instances.map((inst) => TaskInstance.fromDTO(inst)) : [],
], // ❌ 多了一层数组包装！
```

**修改后**:
```typescript
instances: dto.instances ? dto.instances.map((inst) => TaskInstance.fromDTO(inst)) : [],
// ✅ 直接返回 TaskInstance[]
```

#### 修复 2: toDTO 中缺少子实体转换

**修改前**:
```typescript
toDTO(): TaskContracts.TaskTemplateDTO {
  return {
    // ... 其他字段
    goalLinks: this.goalLinks ? [...this.goalLinks] : undefined,
    // ❌ 缺少 instances 字段！
  };
}
```

**修改后**:
```typescript
toDTO(): TaskContracts.TaskTemplateDTO {
  return {
    // ... 其他字段
    goalLinks: this.goalLinks ? [...this.goalLinks] : undefined,
    // ✅ 添加子实体转换
    instances: this.instances.map(instance => instance.toDTO()),
  };
}
```

---

## 数据流示例

### 从后端到前端（反序列化）

```typescript
// 1. 后端返回 DTO
const dto: TaskTemplateDTO = {
  uuid: "template-123",
  title: "每日任务",
  // ... 其他字段
  instances: [
    {
      uuid: "instance-1",
      title: "2025-10-05 的任务",
      // ... 其他字段
    },
    {
      uuid: "instance-2",
      title: "2025-10-06 的任务",
      // ... 其他字段
    }
  ]
};

// 2. 前端使用 fromDTO 恢复完整对象
const template = TaskTemplate.fromDTO(dto);

// 3. 自动转换子实体
console.log(template.instances.length); // 2
console.log(template.instances[0] instanceof TaskInstance); // true
```

### 从前端到后端（序列化）

```typescript
// 1. 前端有完整的聚合根对象
const template = new TaskTemplate({
  title: "每日任务",
  // ... 其他字段
});

// 2. 添加子实体
template.addInstance(new TaskInstance({
  title: "今天的任务",
  // ... 其他字段
}));

// 3. 转换为 DTO 发送到后端
const dto = template.toDTO();

// 4. DTO 包含完整的子实体数据
console.log(dto.instances); 
// [{ uuid: "...", title: "今天的任务", ... }]
```

---

## DDD 聚合根模式优势

### 1. 数据一致性保证

```typescript
// ❌ 错误方式：直接操作子实体
taskInstance.complete();
// 问题：模板统计信息没有更新

// ✅ 正确方式：通过聚合根操作
template.completeInstance(instanceUuid);
// 自动更新模板统计信息、发布领域事件
```

### 2. 业务规则集中管理

```typescript
// 聚合根控制子实体的创建
template.createInstance({
  accountUuid: "user-123",
  scheduledDate: tomorrow,
});

// 聚合根验证业务规则
// - 只有激活的模板才能创建实例
// - 不能创建过去时间的实例
// - 自动继承模板的配置（标签、重要性等）
```

### 3. 级联操作自动化

```typescript
// 删除模板时，自动处理所有子实体
template.archive();
// 自动：
// 1. 更新所有待执行实例的状态
// 2. 取消所有提醒
// 3. 发布领域事件
// 4. 更新统计信息
```

---

## 完整的 DTO 结构

```typescript
interface TaskTemplateDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string;
  
  timeConfig: {
    time: { ... };
    date: { ... };
    schedule: { ... };
    timezone: string;
  };
  
  reminderConfig: { ... };
  properties: { ... };
  
  lifecycle: {
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    createdAt: string;
    updatedAt: string;
  };
  
  stats: {
    totalInstances: number;
    completedInstances: number;
    completionRate: number;
    lastInstanceDate?: string;
  };
  
  goalLinks?: KeyResultLink[];
  
  // 🔥 核心修改：包含完整的子实体数组
  instances?: TaskInstanceDTO[];
}
```

---

## 使用场景

### 场景 1: 获取带实例的模板

```typescript
// 后端 Repository
async getTemplateWithInstances(templateUuid: string): Promise<TaskTemplate> {
  const dto = await prisma.taskTemplate.findUnique({
    where: { uuid: templateUuid },
    include: {
      instances: {
        where: { scheduledDate: { gte: new Date() } },
        orderBy: { scheduledDate: 'asc' },
        take: 100
      }
    }
  });
  
  // ✅ 一次性转换完整的聚合根（包括所有子实体）
  return TaskTemplate.fromDTO(dto);
}
```

### 场景 2: 保存完整的聚合根

```typescript
// 后端 Repository
async saveTemplate(template: TaskTemplate): Promise<void> {
  // ✅ 一次性获取完整的 DTO（包括所有子实体）
  const dto = template.toDTO();
  
  await prisma.taskTemplate.update({
    where: { uuid: dto.uuid },
    data: {
      ...dto,
      instances: {
        // 使用 instances 数据进行级联更新
        upsert: dto.instances?.map(inst => ({
          where: { uuid: inst.uuid },
          create: inst,
          update: inst
        }))
      }
    }
  });
}
```

### 场景 3: 前端完整数据同步

```typescript
// 前端 Application Service
async syncTaskTemplate(templateUuid: string): Promise<void> {
  // 从后端获取完整的聚合根 DTO
  const dto = await taskApiClient.getTemplateById(templateUuid);
  
  // ✅ 一次性恢复完整的对象（包括所有子实例）
  const template = TaskTemplate.fromDTO(dto);
  
  // 存储到 Pinia store
  taskStore.updateTemplate(template);
  
  // 所有子实例也已经加载完毕
  console.log(`已同步 ${template.instances.length} 个实例`);
}
```

---

## 性能优化建议

### 1. 懒加载子实例

对于有大量实例的模板，可以选择性加载：

```typescript
// 只加载基本信息（不含实例）
const template = await taskApiClient.getTemplate(uuid);

// 按需加载实例
if (needInstances) {
  const instances = await taskApiClient.getInstances(uuid, {
    page: 1,
    limit: 50
  });
  
  // 手动添加到聚合根
  instances.data.forEach(inst => {
    template.addInstance(TaskInstance.fromDTO(inst));
  });
}
```

### 2. 分页加载实例

```typescript
// Repository 支持分页
async getTemplateWithInstancesPaginated(
  templateUuid: string,
  page: number = 1,
  limit: number = 50
): Promise<TaskTemplate> {
  const dto = await prisma.taskTemplate.findUnique({
    where: { uuid: templateUuid },
    include: {
      instances: {
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledDate: 'desc' }
      }
    }
  });
  
  return TaskTemplate.fromDTO(dto);
}
```

### 3. 选择性序列化

在某些场景下，可以不序列化子实体：

```typescript
// 仅更新模板基本信息，不包含实例
toDTOWithoutInstances(): Omit<TaskTemplateDTO, 'instances'> {
  const dto = this.toDTO();
  delete dto.instances;
  return dto;
}
```

---

## 测试验证

### 单元测试示例

```typescript
describe('TaskTemplate 子实体转换', () => {
  it('应该正确序列化子实体', () => {
    const template = new TaskTemplate({
      title: "测试模板",
      // ... 其他字段
    });
    
    // 添加子实例
    template.addInstance(new TaskInstance({
      title: "测试实例",
      // ... 其他字段
    }));
    
    // 转换为 DTO
    const dto = template.toDTO();
    
    // 验证
    expect(dto.instances).toHaveLength(1);
    expect(dto.instances[0].title).toBe("测试实例");
  });
  
  it('应该正确反序列化子实体', () => {
    const dto: TaskTemplateDTO = {
      uuid: "test-123",
      title: "测试模板",
      instances: [
        { uuid: "inst-1", title: "实例1", /* ... */ },
        { uuid: "inst-2", title: "实例2", /* ... */ }
      ],
      // ... 其他字段
    };
    
    // 从 DTO 恢复
    const template = TaskTemplate.fromDTO(dto);
    
    // 验证
    expect(template.instances).toHaveLength(2);
    expect(template.instances[0]).toBeInstanceOf(TaskInstance);
    expect(template.instances[0].title).toBe("实例1");
  });
});
```

---

## 总结

### ✅ 已实现的功能

1. **完整的聚合根支持**
   - TaskTemplate 可以包含 TaskInstance[] 子实体
   - 通过 `_instances` 私有属性管理子实体

2. **双向 DTO 转换**
   - `fromDTO`: 从 DTO 恢复完整的聚合根（包括子实体）
   - `toDTO`: 转换为 DTO（包括子实体）

3. **子实体管理方法**
   - `addInstance()`: 添加子实体
   - `removeInstance()`: 删除子实体
   - `getInstance()`: 获取子实体
   - 自动更新统计信息

4. **DDD 最佳实践**
   - 聚合根控制子实体的生命周期
   - 业务规则集中在聚合根
   - 保证数据一致性

### 🎯 使用建议

1. **始终通过聚合根操作子实体**
   ```typescript
   // ✅ 推荐
   template.completeInstance(instanceUuid);
   
   // ❌ 不推荐
   const instance = template.getInstance(instanceUuid);
   instance.complete();
   ```

2. **利用完整的 DTO 转换**
   ```typescript
   // ✅ 一次性获取完整数据
   const template = TaskTemplate.fromDTO(dto);
   
   // ❌ 分别处理
   const template = TaskTemplate.fromDTO(dto);
   dto.instances.forEach(inst => {
     template.addInstance(TaskInstance.fromDTO(inst));
   });
   ```

3. **注意性能优化**
   - 大量实例时使用分页
   - 按需加载实例
   - 选择性序列化

---

## 相关文档

- [Task 模块架构说明](./TASK_INSTANCE_AGGREGATE_ROOT_FIX.md)
- [DDD 聚合根模式](./systems/DDD_AGGREGATE_ROOT_PATTERN.md)
- [API 响应格式](./API_RESPONSE_FORMAT_REFACTORING.md)
