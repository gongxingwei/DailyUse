# Task 模块 DomainService 重构总结

## 重构目标

将 Task 模块的子实体（TaskInstance）管理方式从错误的独立仓储模式重构为符合 DDD 的聚合根模式。

## DDD 聚合根模式（参考 Goal 模块）

### ❌ 错误模式（重构前）
```typescript
// 独立的子实体仓储（违反 DDD）
interface ITaskInstanceRepository {
  createInstance(data): TaskInstance;
  updateInstance(uuid, data): void;
}

// 服务层直接操作子实体
const instance = await instanceRepository.createInstance(data);
```

**问题**:
- 破坏聚合一致性边界
- 事务边界不正确
- 无法通过聚合根执行业务规则
- Domain Event 无法正确触发

### ✅ 正确模式（重构后）

#### 1. 聚合根拥有子实体（Goal.createReview 模式）
```typescript
// TaskTemplate.ts - 聚合根
class TaskTemplate {
  private _instances: TaskInstance[] = [];
  
  // ✅ 子实体通过聚合根创建
  createInstance(data): string {
    const uuid = generateUUID();
    const instance = TaskInstance.create({uuid, ...data});
    this._instances.push(instance);
    this.updateStats(...);
    this.addDomainEvent({eventType: 'TaskInstanceCreated', ...});
    return uuid;
  }
  
  // ✅ 子实体通过聚合根查询
  getInstance(uuid): TaskInstance | undefined {
    return this._instances.find(i => i.uuid === uuid);
  }
  
  // ✅ 子实体通过聚合根删除
  removeInstance(uuid): void {
    this._instances = this._instances.filter(i => i.uuid !== uuid);
    this.updateStats(...);
  }
}
```

#### 2. 仓储保存整个聚合
```typescript
// PrismaTaskTemplateAggregateRepository.ts
async saveTemplate(accountUuid: string, template: TaskTemplate) {
  await this.prisma.$transaction(async (tx) => {
    // 保存聚合根
    await tx.taskTemplate.upsert({...});
    
    // 保存所有子实体（在同一事务中）
    for (const instance of template.instances) {
      await tx.taskInstance.upsert({...});
    }
  });
  
  // ✅ 事务边界 = 聚合边界
  // ✅ 聚合内部一致性得到保证
}
```

#### 3. 领域服务使用聚合方法
```typescript
// TaskTemplateDomainService.ts
async createInstance(accountUuid, request) {
  // 1. 获取聚合根
  const template = await repository.getTemplateByUuid(accountUuid, request.templateUuid);
  
  // 2. 通过聚合根创建子实体（非直接创建）
  const instanceUuid = template.createInstance(request);
  
  // 3. 保存整个聚合（包含所有子实体）
  const saved = await repository.saveTemplate(accountUuid, template);
  
  // 4. 返回创建的子实体
  const instance = saved.getInstance(instanceUuid);
  return instance.toDTO();
}

async updateInstance(accountUuid, instanceUuid, request) {
  // 1. 找到包含该实例的模板（聚合根）
  const {templates} = await repository.getAllTemplates(accountUuid, {});
  const template = templates.find(t => t.getInstance(instanceUuid));
  
  // 2. 获取实例并更新
  const instance = template.getInstance(instanceUuid);
  const updatedDTO = {...instance.toDTO(), ...request};
  
  // 3. 通过聚合根替换实例
  template.removeInstance(instanceUuid);
  template.addInstance(TaskInstance.fromDTO(updatedDTO));
  
  // 4. 保存聚合根
  await repository.saveTemplate(accountUuid, template);
  
  return template.getInstance(instanceUuid).toDTO();
}
```

## 实现的方法列表

### ✅ 已完成 - Template 管理
- `createTemplate` - 创建任务模板
- `getTemplates` - 查询模板列表
- `getTemplateById` - 获取单个模板
- `updateTemplate` - 更新模板
- `deleteTemplate` - 删除模板
- `activateTemplate` - 激活模板
- `pauseTemplate` - 暂停模板
- `archiveTemplate` - 归档模板

### ✅ 已完成 - Instance 管理（通过聚合根）
- `createInstance` - ✅ **已实现** 通过 `TaskTemplate.createInstance()` 创建
- `getInstanceById` - 通过遍历模板查找
- `getInstances` - 跨所有模板查询
- `updateInstance` - 通过 DTO 重建实例
- `deleteInstance` - 通过 `template.removeInstance()`

### ✅ 已完成 - Instance 状态管理
- `completeTask` - 调用 `instance.complete()`
- `undoCompleteTask` - 调用 `instance.undoComplete()`
- `cancelTask` - 调用 `instance.cancel()`
- `startTask` - 调用 `instance.start()`
- `rescheduleTask` - 调用 `instance.reschedule()`

### ⏸️ 部分完成 - 提醒管理
- `triggerReminder` - ⏸️ 需在实体中添加方法
- `snoozeReminder` - ⏸️ 需在实体中添加方法
- `dismissReminder` - ⏸️ 需在实体中添加方法

### ✅ 已完成 - 统计和查询
- `getTaskStats` - 使用合并后的仓储统计方法
- `searchTasks` - 跨模板搜索实例
- `getUpcomingTasks` - 查询即将到来的任务
- `getOverdueTasks` - 查询逾期任务
- `getTodayTasks` - 查询今日任务

## 下一步工作

### ~~Priority 1 - 完善聚合根方法~~ ✅ 已完成
1. ~~**在 TaskTemplate 聚合根中添加 `createInstance()` 方法**~~ ✅
   ```typescript
   createInstance(instanceData): string {
     const instanceUuid = this.generateUUID();
     const instance = TaskInstance.create({...});
     this._instances.push(instance);
     this.updateStats(...);
     this.addDomainEvent({eventType: 'TaskInstanceCreated', ...});
     return instanceUuid;
   }
   ```

2. ~~**实现 DomainService.createInstance()**~~ ✅
   ```typescript
   async createInstance(accountUuid, request) {
     const template = await repo.getTemplateByUuid(accountUuid, request.templateUuid);
     const instanceUuid = template.createInstance(request);
     const saved = await repo.saveTemplate(accountUuid, template);
     const instance = saved.getInstance(instanceUuid);
     return instance.toDTO();
   }
   ```

### Priority 2 - 提醒管理方法
在 TaskInstance 实体中添加：
- `triggerReminder()`
- `snoozeReminder(snoozeUntil: Date)`
- `dismissReminder()`

### Priority 3 - 优化查询性能
当前 `getInstanceById` 等方法需要遍历所有模板，性能较差。可以考虑：
- 在仓储层添加辅助查询方法（不违反 DDD，只是查询优化）
- 使用缓存或索引优化

## 关键原则

### DDD 聚合根规则
1. **Aggregate Root 是一致性边界**
   - TaskTemplate 是聚合根
   - TaskInstance 是子实体，必须通过 TaskTemplate 访问
   
2. **事务边界 = 聚合边界**
   - 一个事务只能修改一个聚合
   - `saveTemplate()` 保存整个聚合（template + instances）
   
3. **外部引用只能通过聚合根**
   - 外部系统持有 `templateUuid`，而非 `instanceUuid`
   - 查询实例需要先获取模板
   
4. **Domain Events 从聚合根发出**
   - 实例创建时，`TaskTemplate` 触发 `TaskInstanceCreated` 事件
   - 事件包含聚合根 ID 和实例 ID

### 与 Goal 模块对比

| 概念 | Goal 模块 | Task 模块 |
|------|----------|----------|
| 聚合根 | `Goal` | `TaskTemplate` |
| 子实体 | `GoalReview` | `TaskInstance` |
| 创建方法 | `goal.createReview()` | `template.createInstance()` ⏸️ |
| 仓储接口 | `IGoalAggregateRepository` | `ITaskTemplateAggregateRepository` |
| 保存方法 | `saveGoal(accountUuid, goal)` | `saveTemplate(accountUuid, template)` |
| 服务方法 | `createReviewForGoal()` | `createInstance()` |

## 参考文件

- 参考实现：`Goal.ts` - `createReview()` 方法
- 参考服务：`GoalDomainService.ts` - `createReviewForGoal()` 方法
- 参考仓储：`PrismaGoalAggregateRepository.ts` - `saveGoal()` 方法
- 当前实现：`TaskTemplateDomainService.ts` - 所有实例方法

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     TaskTemplate (聚合根)                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 子实体集合                                             │    │
│  │  - _instances: TaskInstance[]                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 业务方法（管理子实体）                                  │    │
│  │  + createInstance(data): string ⏸️                   │    │
│  │  + getInstance(uuid): TaskInstance                  │    │
│  │  + removeInstance(uuid): void                       │    │
│  │  + addInstance(instance): void                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓ saveTemplate()
┌─────────────────────────────────────────────────────────────┐
│            ITaskTemplateAggregateRepository                  │
│                                                               │
│  + saveTemplate(accountUuid, template): Template            │
│  + getTemplateByUuid(accountUuid, uuid): Template           │
│                                                               │
│  保存整个聚合（template + instances）在一个事务中              │
└─────────────────────────────────────────────────────────────┘
                          ↓ Prisma Transaction
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
│                                                               │
│  TaskTemplate Table  ←→  TaskInstance Table                 │
│                                                               │
│  事务保证一致性                                                │
└─────────────────────────────────────────────────────────────┘
```
