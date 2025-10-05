# Reminder 模块 ClientDTO 重构总结

## ✅ 已完成工作

### 1. Contracts 层 - DTOs 定义修复
**文件**: `packages/contracts/src/modules/reminder/dtos.ts`

#### 修改内容：
- ✅ 从 `ReminderTemplateDTO` 移除 `accountUuid`  
- ✅ 从 `ReminderInstanceDTO` 移除 `accountUuid`  
- ✅ `accountUuid` 只保留在 `PersistenceDTO` 中（符合 DDD 原则）

#### 对比 Goal 模块：
```typescript
// Goal 模块 (正确示例)
export interface GoalDTO {
  uuid: string;
  name: string;
  // ... 没有 accountUuid
}

export interface GoalPersistenceDTO {
  uuid: string;
  accountUuid: string;  // ✅ 只在持久化层有
  // ...
}

// Reminder 模块 (已修复)
export interface ReminderTemplateDTO {
  uuid: string;
  name: string;
  // ... 没有 accountUuid ✅
}

export interface ReminderTemplatePersistenceDTO {
  uuid: string;
  accountUuid: string;  // ✅ 只在持久化层有
  // ...
}
```

### 2. Domain-Server 层 - `toClient()` 方法重构
**文件**: 
- `packages/domain-server/src/reminder/aggregates/ReminderTemplate.ts`
- `packages/domain-server/src/reminder/entities/ReminderInstance.ts`

#### 修改前（错误）：
```typescript
// ❌ 错误：需要传递 accountUuid 参数
toClient(accountUuid: string, groupName?: string): ReminderTemplateClientDTO {
  return {
    uuid: this.uuid,
    accountUuid,  // ❌ 手动传入
    groupName,    // ❌ 手动传入
    // ... 重复所有字段
  };
}
```

#### 修改后（正确）：
```typescript
// ✅ 正确：无参数，像 Goal 模块一样
toClient(): ReminderTemplateClientDTO {
  const baseDTO = this.toDTO();
  
  return {
    uuid: baseDTO.uuid,
    name: baseDTO.name,
    // ... 使用 baseDTO 的字段
    lifecycle: {
      createdAt: baseDTO.lifecycle.createdAt.getTime(),  // Date → number
      updatedAt: baseDTO.lifecycle.updatedAt.getTime(),
      // ...
    },
    // 计算属性
    effectiveEnabled: this.enabled && this.selfEnabled,
    nextTriggerTime: this.getNextTriggerTime()?.getTime(),
    activeInstancesCount: this.instances.filter(...).length,
  };
}
```

#### 对比 Goal 模块：
```typescript
// Goal.toClient() - 参考示例
toClient(): GoalClientDTO {
  const baseDTO = this.toDTO();
  
  return {
    ...baseDTO,  // ⚠️ 注意：不能直接展开，需要转换 Date → number
    // 计算属性
    overallProgress: ...,
    weightedProgress: ...,
    // ...
  };
}
```

---

## ⏳ 下一步工作

### 3. Repository 层重构
**文件**: `apps/api/src/modules/reminder/infrastructure/repositories/prisma/PrismaReminderAggregateRepository.ts`

#### 当前问题：
```typescript
// ❌ 当前：返回 Prisma 原始数据
async getReminderTemplate(templateUuid: string): Promise<any> {
  const template = await this.prisma.reminderTemplate.findUnique({
    where: { uuid: templateUuid },
    include: { instances: true },
  });
  
  return template;  // ❌ 返回 Prisma 对象
}
```

#### 需要改为（参考 Goal 模块）：
```typescript
// ✅ 目标：返回领域实体对象
async getReminderTemplate(
  accountUuid: string, 
  templateUuid: string
): Promise<ReminderTemplate | null> {
  const data = await this.prisma.reminderTemplate.findUnique({
    where: { 
      uuid: templateUuid,
      accountUuid  // ✅ 在查询中使用 accountUuid
    },
    include: { instances: true },
  });
  
  if (!data) return null;
  
  // ✅ 转换为领域实体
  return this.mapTemplateToEntity(data);
}

// 辅助方法
private mapTemplateToEntity(data: any): ReminderTemplate {
  return ReminderTemplate.fromPersistence({
    ...data,
    // 转换字段类型
  });
}
```

#### Goal 模块参考：
```typescript
// PrismaGoalRepository.ts
private mapGoalToEntity(goal: any): Goal {
  const goalEntity = Goal.fromPersistence({
    ...goal,
    tags: typeof goal.tags === 'string' ? goal.tags : JSON.stringify(goal.tags || []),
    // ...
  });
  
  // 转换子实体
  if (goal.keyResults) {
    goalEntity.keyResults = goal.keyResults.map((kr: any) =>
      KeyResult.fromPersistence(kr)
    );
  }
  
  return goalEntity;
}
```

### 4. Service 层重构
**文件**: `apps/api/src/modules/reminder/domain/services/ReminderDomainService.ts`

#### 当前问题：
```typescript
// ❌ 当前：手动构建响应对象
async getTemplate(templateUuid: string): Promise<ReminderTemplateResponse> {
  const template = await this.repository.getReminderTemplate(templateUuid);
  
  return {
    uuid: template.uuid,
    name: template.name,
    // ... 手动映射所有字段
  };
}
```

#### 需要改为（参考 Goal 模块）：
```typescript
// ✅ 目标：直接调用 entity.toClient()
async getTemplate(
  accountUuid: string,
  templateUuid: string
): Promise<ReminderTemplateClientDTO | null> {
  const entity = await this.repository.getReminderTemplate(accountUuid, templateUuid);
  
  if (!entity) return null;
  
  return entity.toClient();  // ✅ 直接调用
}
```

#### Goal 模块参考：
```typescript
// GoalDomainService.ts
async getGoalByUuid(
  accountUuid: string,
  goalUuid: string,
): Promise<GoalResponse | null> {
  const goalEntity = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
  if (!goalEntity) return null;
  
  return goalEntity.toClient();  // ✅ 简洁明了
}
```

---

## 🎯 重构要点总结

### DDD 架构原则
1. **DTO vs PersistenceDTO**
   - `DTO`: 领域对象传输，不包含 `accountUuid`
   - `PersistenceDTO`: 持久化对象，包含 `accountUuid`（用于数据库查询）

2. **toClient() 方法**
   - **无参数**（accountUuid 从持久化层获取，不需要在运行时传递）
   - 使用 `toDTO()` 获取基础数据
   - 添加计算属性

3. **Repository 返回值**
   - 返回**领域实体对象**，不是 Prisma 原始数据
   - 使用 `fromPersistence()` 重建实体

4. **Service 层职责**
   - 调用 Repository 获取实体
   - 调用 `entity.toClient()` 转换为 ClientDTO
   - **不手动构建响应对象**

---

## 📂 文件清单

### 已修改文件：
- ✅ `packages/contracts/src/modules/reminder/dtos.ts`
- ✅ `packages/domain-server/src/reminder/aggregates/ReminderTemplate.ts`
- ✅ `packages/domain-server/src/reminder/entities/ReminderInstance.ts`

### 待修改文件：
- ⏳ `apps/api/src/modules/reminder/infrastructure/repositories/prisma/PrismaReminderAggregateRepository.ts`
- ⏳ `apps/api/src/modules/reminder/domain/services/ReminderDomainService.ts`
- ⏳ `packages/domain-client/src/reminder/aggregates/ReminderTemplate.ts` (fromClientDTO)
- ⏳ `packages/domain-client/src/reminder/entities/ReminderInstance.ts` (fromClientDTO)

---

## 🔍 验证检查清单

### 编译检查
- [x] domain-server `toClient()` 无编译错误
- [ ] domain-client `fromClientDTO()` 无编译错误
- [ ] API Service 层无编译错误
- [ ] Repository 层无编译错误

### 功能测试
- [ ] 创建 ReminderTemplate 正常返回
- [ ] 查询 ReminderTemplate 正常返回
- [ ] 创建 ReminderInstance 正常返回
- [ ] ClientDTO 包含正确的计算属性

### 架构验证
- [x] DTO 无 accountUuid
- [x] toClient() 无参数
- [ ] Repository 返回实体对象
- [ ] Service 使用 entity.toClient()
