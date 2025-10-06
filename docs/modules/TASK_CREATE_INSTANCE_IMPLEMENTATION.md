# TaskTemplate.createInstance() 实现完成

## 🎯 目标达成

成功实现了 **DDD 聚合根模式** 的任务实例创建功能，完全遵循 Goal 模块的 `Goal.createReview()` 模式。

## ✅ 完成的工作

### 1. TaskTemplate 聚合根 - 添加业务方法

**文件**: `packages/domain-server/src/task/aggregates/TaskTemplate.ts`

**新增方法**:
```typescript
createInstance(params: {
  title?: string;
  description?: string;
  scheduledDate: Date;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  properties?: {...};
  goalLinks?: TaskContracts.KeyResultLink[];
}): string {
  // 1. 生成 UUID
  const instanceUuid = this.generateUUID();

  // 2. 创建 TaskInstance 子实体
  const instance = TaskInstance.create({...});

  // 3. 添加到聚合根的子实体集合
  this._instances.push(instance);

  // 4. 更新统计信息
  this.updateStats(...);

  // 5. 更新版本号
  this.updateVersion();

  // 6. 发布领域事件
  this.addDomainEvent({
    eventType: 'TaskInstanceCreated',
    aggregateId: this.uuid,
    payload: {instanceUuid, ...}
  });

  // 7. 返回新创建的实例 UUID
  return instanceUuid;
}

// 辅助方法
private generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ...);
}
```

**关键特性**:
- ✅ UUID 生成由聚合根控制
- ✅ 子实体添加到聚合根集合
- ✅ 自动更新统计信息
- ✅ 版本号管理（乐观锁）
- ✅ 领域事件发布
- ✅ 返回 UUID 用于后续查询

### 2. TaskTemplateDomainService - 实现创建逻辑

**文件**: `apps/api/src/modules/task/domain/services/TaskTemplateDomainService.ts`

**实现方法**:
```typescript
async createInstance(
  accountUuid: string,
  request: TaskContracts.CreateTaskInstanceRequest,
): Promise<TaskContracts.TaskInstanceResponse> {
  // 1. 获取聚合根实体
  const template = await this.templateRepository.getTemplateByUuid(
    accountUuid,
    request.templateUuid,
  );
  if (!template) {
    throw new TaskDomainException(
      TaskErrorCode.TEMPLATE_NOT_FOUND,
      `Task template not found: ${request.templateUuid}`,
    );
  }

  // 2. 通过聚合根创建实例（调用聚合根的业务方法）
  const instanceUuid = template.createInstance({
    title: request.title,
    description: request.description,
    scheduledDate: new Date(request.timeConfig.scheduledDate),
    startTime: request.timeConfig.startTime,
    endTime: request.timeConfig.endTime,
    estimatedDuration: request.timeConfig.estimatedDuration,
    properties: request.properties,
    goalLinks: request.goalLinks,
  });

  // 3. 保存整个聚合根（包含新创建的实例）
  const savedTemplate = await this.templateRepository.saveTemplate(accountUuid, template);

  // 4. 获取并返回新创建的实例
  const savedInstance = savedTemplate.getInstance(instanceUuid);
  if (!savedInstance) {
    throw new TaskDomainException(
      TaskErrorCode.INSTANCE_NOT_FOUND,
      'Failed to retrieve created instance',
    );
  }

  return savedInstance.toDTO();
}
```

**遵循的模式** (参考 `GoalDomainService.createReviewForGoal`):
1. ✅ 获取聚合根
2. ✅ 调用聚合根业务方法
3. ✅ 保存整个聚合
4. ✅ 返回创建的子实体

## 🏗️ 架构对比

### Goal 模块 (参考实现)
```typescript
// Goal.ts
createReview(reviewData): string {
  const reviewUuid = this.generateUUID();
  const newReview = new GoalReview({uuid: reviewUuid, ...});
  this.reviews.push(newReview);
  this.updateVersion();
  this.addDomainEvent({...});
  return reviewUuid;
}

// GoalDomainService.ts
async createReviewForGoal(accountUuid, goalUuid, request) {
  const goalEntity = await repo.getGoalByUuid(accountUuid, goalUuid);
  const reviewUuid = goalEntity.createReview(request);
  const savedGoal = await repo.saveGoal(accountUuid, goalEntity);
  const savedReview = savedGoal.reviews.find(r => r.uuid === reviewUuid);
  return savedReview.toClient();
}
```

### Task 模块 (新实现)
```typescript
// TaskTemplate.ts
createInstance(instanceData): string {
  const instanceUuid = this.generateUUID();
  const instance = TaskInstance.create({...});
  this._instances.push(instance);
  this.updateStats(...);
  this.updateVersion();
  this.addDomainEvent({...});
  return instanceUuid;
}

// TaskTemplateDomainService.ts
async createInstance(accountUuid, request) {
  const template = await repo.getTemplateByUuid(accountUuid, request.templateUuid);
  const instanceUuid = template.createInstance(request);
  const savedTemplate = await repo.saveTemplate(accountUuid, template);
  const savedInstance = savedTemplate.getInstance(instanceUuid);
  return savedInstance.toDTO();
}
```

**完全一致的模式**! ✅

## 🔒 DDD 原则遵循

### ✅ 聚合根是一致性边界
- TaskTemplate 聚合根管理所有 TaskInstance 子实体
- 所有子实体的创建、修改、删除通过聚合根

### ✅ 事务边界 = 聚合边界
- `saveTemplate()` 在一个事务中保存：
  - TaskTemplate (聚合根)
  - 所有 TaskInstance (子实体)

### ✅ 领域事件从聚合根发出
- `TaskInstanceCreated` 事件包含：
  - `aggregateId`: TaskTemplate UUID
  - `instanceUuid`: 新创建的 TaskInstance UUID
  - 聚合根 UUID 作为事件源

### ✅ 外部引用聚合根
- 客户端持有 `templateUuid`
- 通过模板 UUID 访问实例
- 实例 UUID 用于子实体操作

## 📊 执行流程

```
客户端请求
    ↓
TaskTemplateDomainService.createInstance()
    ↓
1. 获取 TaskTemplate 聚合根
    ↓
2. 调用 template.createInstance()
   ├─ 生成 instanceUuid
   ├─ 创建 TaskInstance 实体
   ├─ 添加到 _instances 集合
   ├─ 更新统计信息
   ├─ 更新版本号
   └─ 发布 TaskInstanceCreated 事件
    ↓
3. 保存聚合根
   PrismaTaskTemplateAggregateRepository.saveTemplate()
   ├─ 开始事务
   ├─ Upsert TaskTemplate
   ├─ Upsert 所有 TaskInstance
   └─ 提交事务
    ↓
4. 重新加载聚合根（包含新实例）
    ↓
5. 获取新创建的实例
    ↓
6. 返回 DTO 给客户端
```

## 🎉 成果

### 已实现的完整功能
1. ✅ TaskTemplate 聚合根的 `createInstance()` 业务方法
2. ✅ TaskTemplateDomainService 的 `createInstance()` 服务方法
3. ✅ 完整的 DDD 聚合根模式
4. ✅ 领域事件发布
5. ✅ 事务一致性保证
6. ✅ 与 Goal 模块架构一致

### 代码质量
- ✅ 0 编译错误
- ✅ 符合 DDD 最佳实践
- ✅ 与现有 Goal 模块模式一致
- ✅ 完整的错误处理
- ✅ 清晰的注释和文档

## 📝 对比分析

| 功能 | Goal 模块 | Task 模块 | 状态 |
|------|----------|----------|------|
| 聚合根业务方法 | `Goal.createReview()` | `TaskTemplate.createInstance()` | ✅ 已实现 |
| UUID 生成 | `Goal.generateUUID()` | `TaskTemplate.generateUUID()` | ✅ 已实现 |
| 服务层方法 | `createReviewForGoal()` | `createInstance()` | ✅ 已实现 |
| 仓储保存 | `saveGoal()` | `saveTemplate()` | ✅ 已存在 |
| 领域事件 | `GoalReviewCreated` | `TaskInstanceCreated` | ✅ 已实现 |
| 事务管理 | Prisma Transaction | Prisma Transaction | ✅ 已存在 |

## 🚀 下一步建议

### Priority 1 - 提醒管理方法 ⏸️
在 TaskInstance 实体中添加：
- `triggerReminder()`
- `snoozeReminder(snoozeUntil: Date)`
- `dismissReminder()`

### Priority 2 - 性能优化 ⏸️
- 添加实例查询的辅助方法（避免遍历所有模板）
- 考虑缓存常用查询
- 添加索引优化

### Priority 3 - 业务增强 ⏸️
- 批量创建实例
- 实例模板继承优化
- 重复任务自动生成

## 📚 参考文件

- ✅ 已实现：`packages/domain-server/src/task/aggregates/TaskTemplate.ts`
- ✅ 已实现：`apps/api/src/modules/task/domain/services/TaskTemplateDomainService.ts`
- 📖 参考：`packages/domain-server/src/goal/aggregates/Goal.ts` (line 584, `createReview`)
- 📖 参考：`apps/api/src/modules/goal/domain/services/GoalDomainService.ts` (line 442, `createReviewForGoal`)
- 📖 参考：`apps/api/src/modules/goal/infrastructure/repositories/PrismaGoalAggregateRepository.ts` (line 78, `saveGoal`)

## ✨ 总结

成功实现了符合 **DDD 聚合根模式** 的任务实例创建功能，与 Goal 模块保持 **100% 架构一致性**。

**核心价值**:
- 🏗️ 正确的 DDD 架构
- 🔒 聚合一致性保证
- 🔄 完整的事务管理
- 📢 领域事件支持
- 🎯 与现有代码库完美契合
