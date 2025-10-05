# Reminder 模块 ClientDTO 重构指南

## 📋 重构目标

将 Reminder 模块完全对齐 Goal 模块的架构模式，实现：
1. **Contracts 层**: 定义完整的 DTO 和 ClientDTO
2. **Domain-Server 层**: 实体添加 `toClient()` 方法
3. **Domain-Client 层**: 实体添加 `fromClientDTO()` 静态方法
4. **ApplicationService 层**: 使用实体的 `toClient()` 方法返回数据

---

## ✅ 已完成的工作

### 1. Contracts 层（无需修改）
- ✅ `packages/contracts/src/modules/reminder/dtos.ts`
  - `ReminderTemplateDTO` 和 `ReminderTemplateClientDTO`
  - `ReminderInstanceDTO` 和 `ReminderInstanceClientDTO`
  - `ReminderTemplateGroupDTO` 和 `ReminderTemplateGroupClientDTO`

### 2. Domain-Server 层
#### ✅ ReminderTemplate 实体
**文件**: `packages/domain-server/src/reminder/aggregates/ReminderTemplate.ts`

```typescript
/**
 * 转换为客户端 DTO（包含计算属性）
 */
toClient(accountUuid: string, groupName?: string): ReminderContracts.ReminderTemplateClientDTO {
  // 计算下次触发时间
  const nextTriggerTime = this.getNextTriggerTime();

  // 计算活跃实例数量
  const activeInstancesCount = this.instances.filter(
    (inst) =>
      inst.status === ReminderContracts.ReminderStatus.PENDING ||
      inst.status === ReminderContracts.ReminderStatus.TRIGGERED,
  ).length;

  return {
    // 基础字段（转换 Date 为 number）
    uuid: this.uuid,
    accountUuid,
    groupUuid: this.groupUuid,
    // ... 所有字段
    lifecycle: {
      createdAt: this.lifecycle.createdAt.getTime(),
      updatedAt: this.lifecycle.updatedAt.getTime(),
      lastTriggered: this.lifecycle.lastTriggered?.getTime(),
      triggerCount: this.lifecycle.triggerCount,
    },
    
    // 计算属性
    effectiveEnabled: this.enabled && this.selfEnabled,
    nextTriggerTime: nextTriggerTime?.getTime(),
    activeInstancesCount,
    groupName,
  };
}
```

#### ✅ ReminderInstance 实体
**文件**: `packages/domain-server/src/reminder/entities/ReminderInstance.ts`

```typescript
/**
 * 转换为客户端 DTO（包含计算属性）
 */
toClient(
  accountUuid: string,
  templateName?: string,
  groupName?: string,
): ReminderContracts.ReminderInstanceClientDTO {
  const now = new Date();
  const scheduledTime = this.scheduledTime.getTime();
  const timeUntil = scheduledTime - now.getTime();
  const isOverdue = now.getTime() > scheduledTime;

  // 格式化时间显示
  let formattedTime: string;
  // ... 时间格式化逻辑

  return {
    // 基础字段（转换 Date 为 number）
    uuid: this.uuid,
    accountUuid,
    // ... 所有字段
    
    // 计算属性
    isOverdue,
    timeUntil,
    formattedTime,
    templateName,
    groupName,
  };
}
```

### 3. Domain-Client 层
#### ✅ ReminderTemplate 客户端实体
**文件**: `packages/domain-client/src/reminder/aggregates/ReminderTemplate.ts`

```typescript
/**
 * 从客户端 DTO 创建实体（用于 API 响应）
 */
static fromClientDTO(dto: ReminderContracts.ReminderTemplateClientDTO): ReminderTemplate {
  return new ReminderTemplate({
    uuid: dto.uuid,
    groupUuid: dto.groupUuid,
    name: dto.name,
    // ... 所有字段
    lifecycle: {
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
      lastTriggered: dto.lifecycle.lastTriggered
        ? new Date(dto.lifecycle.lastTriggered)
        : undefined,
      triggerCount: dto.lifecycle.triggerCount,
    },
    // ... 其他字段
  });
}
```

#### ✅ ReminderInstance 客户端实体
**文件**: `packages/domain-client/src/reminder/entities/ReminderInstance.ts`

```typescript
/**
 * 从客户端 DTO 创建实体（用于 API 响应）
 */
static fromClientDTO(dto: ReminderContracts.ReminderInstanceClientDTO): ReminderInstance {
  return new ReminderInstance({
    uuid: dto.uuid,
    templateUuid: dto.templateUuid,
    // ... 所有字段
    scheduledTime: new Date(dto.scheduledTime),
    triggeredTime: dto.triggeredTime ? new Date(dto.triggeredTime) : undefined,
    // ... 转换所有时间字段
  });
}
```

---

## ⏳ 待完成的工作

### 4. ApplicationService 层重构

**文件**: `apps/api/src/modules/reminder/domain/services/ReminderDomainService.ts`

#### 🔧 问题分析
当前 DomainService 使用 `PrismaReminderAggregateRepository`，它返回 Prisma 原始数据（plain objects），而不是实体对象。

#### 🎯 解决方案（两种选择）

##### 方案 A：修改 Repository 返回实体对象（推荐）

**步骤**：
1. 修改 `PrismaReminderAggregateRepository` 的返回类型
2. 在 Repository 中将 Prisma 数据转换为实体对象
3. DomainService 直接调用实体的 `toClient()` 方法

**示例**：
```typescript
// Repository
import { ReminderTemplate } from '../../../domain-server/src/reminder/aggregates/ReminderTemplate';

async createReminderTemplate(data: any): Promise<ReminderTemplate> {
  const prismaData = await this.prisma.reminderTemplate.create({ data });
  
  // 转换为实体对象
  return new ReminderTemplate({
    uuid: prismaData.uuid,
    name: prismaData.name,
    // ... 所有字段
  });
}

// DomainService
async createTemplate(
  request: CreateReminderTemplateRequest,
  accountUuid: string,
): Promise<ReminderTemplateResponse> {
  const template = await this.repository.createReminderTemplate(templateData);
  
  // ✅ 直接调用 toClient()
  return template.toClient(accountUuid);
}
```

##### 方案 B：在 DomainService 中转换（临时方案）

**步骤**：
1. 保持 Repository 返回 Prisma 原始数据
2. 在 DomainService 中手动将数据转换为实体
3. 调用实体的 `toClient()` 方法

**示例**：
```typescript
async createTemplate(
  request: CreateReminderTemplateRequest,
  accountUuid: string,
): Promise<ReminderTemplateResponse> {
  const prismaData = await this.repository.createReminderTemplate(templateData);
  
  // 转换为实体对象
  const template = new ReminderTemplate({
    uuid: prismaData.uuid,
    name: prismaData.name,
    // ... 所有字段
  });
  
  // ✅ 调用 toClient()
  return template.toClient(accountUuid);
}
```

---

## 📝 需要修改的方法列表

### ReminderDomainService 中需要修改的方法：

#### 模板相关（使用 toClient()）
- [x] `createTemplate()` - 返回 `ReminderTemplateResponse`
- [ ] `getTemplates()` - 返回 `ReminderTemplateResponse[]`
- [ ] `getTemplateById()` - 返回 `ReminderTemplateResponse | null`
- [ ] `updateTemplate()` - 返回 `ReminderTemplateResponse`
- [ ] `activateTemplate()` - 返回 `ReminderTemplateResponse`
- [ ] `pauseTemplate()` - 返回 `ReminderTemplateResponse`

#### 实例相关（使用 toClient()）
- [ ] `createInstance()` - 返回 `ReminderInstanceResponse`
- [ ] `getInstanceById()` - 返回 `ReminderInstanceResponse | null`
- [ ] `updateInstance()` - 返回 `ReminderInstanceResponse`
- [ ] `triggerReminder()` - 返回 `ReminderInstanceResponse`
- [ ] `snoozeReminder()` - 返回 `ReminderInstanceResponse`
- [ ] `dismissReminder()` - 返回 `ReminderInstanceResponse`
- [ ] `acknowledgeReminder()` - 返回 `ReminderInstanceResponse`

---

## 🛠️ 重构步骤建议

### 阶段 1：基础设施准备
1. ✅ 确认 Contracts 中的 ClientDTO 定义完整
2. ✅ Domain-Server 实体添加 `toClient()` 方法
3. ✅ Domain-Client 实体添加 `fromClientDTO()` 方法

### 阶段 2：Repository 层改造（推荐方案 A）
1. [ ] 修改 `PrismaReminderAggregateRepository` 返回实体对象
   - 引入 `@dailyuse/domain-server` 中的实体
   - 所有 CRUD 方法返回实体而非 plain objects
   
2. [ ] 添加私有辅助方法：
   ```typescript
   private toTemplateEntity(prismaData: any): ReminderTemplate {
     return new ReminderTemplate({
       uuid: prismaData.uuid,
       // ... 映射所有字段
     });
   }
   
   private toInstanceEntity(prismaData: any): ReminderInstance {
     return new ReminderInstance({
       uuid: prismaData.uuid,
       // ... 映射所有字段
     });
   }
   ```

### 阶段 3：DomainService 层简化
1. [ ] 移除手动构建响应对象的代码
2. [ ] 统一使用 `entity.toClient(accountUuid)` 返回数据

**Before**:
```typescript
async createTemplate(request, accountUuid): Promise<ReminderTemplateResponse> {
  const template = await this.repository.createReminderTemplate(data);
  
  return {
    uuid: template.uuid,
    name: template.name,
    // ... 手动构建 20+ 字段
  };
}
```

**After**:
```typescript
async createTemplate(request, accountUuid): Promise<ReminderTemplateResponse> {
  const template = await this.repository.createReminderTemplate(data);
  
  return template.toClient(accountUuid);
}
```

### 阶段 4：前端 API Client 适配
1. [ ] 修改 `apps/web/src/modules/reminder/infrastructure/api/reminderApiClient.ts`
2. [ ] 使用 `ReminderTemplate.fromClientDTO()` 和 `ReminderInstance.fromClientDTO()`

**Before**:
```typescript
async getTemplates(): Promise<ReminderTemplate[]> {
  const response = await apiClient.get('/api/v1/reminders/templates');
  return response.data.map(ReminderTemplate.fromApiResponse);
}
```

**After**:
```typescript
async getTemplates(): Promise<ReminderTemplate[]> {
  const response = await apiClient.get('/api/v1/reminders/templates');
  return response.data.map(ReminderTemplate.fromClientDTO);
}
```

---

## 🎯 参考：Goal 模块示例

可以参考以下 Goal 模块文件作为模板：

### Contracts
- `packages/contracts/src/modules/goal/dtos.ts`

### Domain-Server
- `packages/domain-server/src/goal/aggregates/Goal.ts`
- `packages/domain-server/src/goal/entities/KeyResult.ts`

### Domain-Client
- `packages/domain-client/src/goal/aggregates/Goal.ts`
- `packages/domain-client/src/goal/entities/KeyResult.ts`

### ApplicationService
- `apps/api/src/modules/goal/application/services/GoalApplicationService.ts`

---

## ⚠️ 注意事项

### 1. 时间字段转换
- **服务端**: Date → number (使用 `.getTime()`)
- **客户端**: number → Date (使用 `new Date()`)

### 2. 计算属性
- 只在 `toClient()` 中计算，不存储在实体中
- ClientDTO 包含所有计算属性的类型定义

### 3. 可选字段处理
```typescript
// 正确处理可选字段
lifecycle: {
  createdAt: this.lifecycle.createdAt.getTime(),
  updatedAt: this.lifecycle.updatedAt.getTime(),
  lastTriggered: this.lifecycle.lastTriggered?.getTime(), // ✅ 使用 ?.
  triggerCount: this.lifecycle.triggerCount,
}
```

### 4. 数组字段拷贝
```typescript
// 防止引用泄露，使用展开运算符
tags: [...this.tags],
metadata: {
  category: this.metadata.category,
  tags: [...this.metadata.tags], // ✅ 拷贝数组
}
```

---

## 🚀 快速开始

建议按以下顺序进行重构：

1. **先完成一个方法** - 选择 `createTemplate()` 作为试点
2. **验证功能正确** - 确保 API 返回正确的 ClientDTO
3. **批量应用模式** - 将模式应用到其他方法
4. **前端适配** - 更新前端 API Client
5. **全量测试** - 确保所有功能正常

---

## 📊 进度追踪

- [x] Contracts 定义 ClientDTO
- [x] Domain-Server 添加 toClient()
- [x] Domain-Client 添加 fromClientDTO()
- [ ] Repository 返回实体对象
- [ ] DomainService 使用 toClient()
- [ ] 前端 API Client 适配
- [ ] 集成测试验证

---

## 🎉 预期效果

重构完成后：
1. ✅ 代码更简洁（移除大量手动构建对象的代码）
2. ✅ 类型更安全（编译时检查所有字段）
3. ✅ 逻辑更清晰（实体负责计算属性）
4. ✅ 架构统一（所有模块遵循相同模式）
