# Reminder 模块快速参考

> **状态**: ✅ DDD 重构完成  
> **最后更新**: 2024-01-XX  
> **编译状态**: ✅ 无错误

## 📚 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                     Interface Layer (接口层)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ReminderTemplateController                                │  │
│  │ ReminderTemplateGroupController                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ calls
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer (应用层)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ReminderApplicationService (单例)                         │  │
│  │   - createTemplate(accountUuid, request)                  │  │
│  │   - getTemplates(accountUuid, params?)                    │  │
│  │   - getTemplateById(accountUuid, uuid)                    │  │
│  │   - updateTemplate(accountUuid, uuid, request)            │  │
│  │   - deleteTemplate(accountUuid, uuid)                     │  │
│  │   - createGroup(accountUuid, request)                     │  │
│  │   - getGroups(accountUuid)                                │  │
│  │   - ... (更多方法)                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ uses
┌─────────────────────────────────────────────────────────────────┐
│                     Domain Layer (领域层)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ReminderTemplateDomainService                             │  │
│  │ ReminderTemplateGroupDomainService                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ IReminderTemplateAggregateRepository (接口)               │  │
│  │ IReminderTemplateGroupAggregateRepository (接口)          │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ReminderTemplateAggregate (聚合根)                        │  │
│  │ ReminderTemplateGroupAggregate (聚合根)                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ implements
┌─────────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer (基础设施层)                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ReminderTemplateAggregateRepository (Prisma)              │  │
│  │ ReminderTemplateGroupAggregateRepository (Prisma)         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 使用指南

### 在 Controller 中调用 ApplicationService

```typescript
import { ReminderApplicationService } from '../../../application/services/ReminderApplicationService';

export class YourController {
  private static async getApplicationService(): Promise<ReminderApplicationService> {
    return await ReminderApplicationService.getInstance();
  }

  static async yourMethod(req: Request, res: Response): Promise<Response> {
    try {
      // 1. 提取 accountUuid
      const accountUuid = extractAccountUuid(req);
      
      // 2. 获取 ApplicationService 实例
      const applicationService = await YourController.getApplicationService();
      
      // 3. 调用方法
      const result = await applicationService.createTemplate(accountUuid, request);
      
      return sendSuccess(res, result);
    } catch (error) {
      return sendError(res, error);
    }
  }
}
```

### 关键 API

#### Template 相关

```typescript
// 创建模板 - accountUuid 总是第一个参数
const template = await applicationService.createTemplate(accountUuid, {
  title: '每日站会',
  description: '团队每日同步',
  recurrence: { type: 'daily', interval: 1 },
  // ... 更多字段
});

// 获取模板列表 - 返回 { templates: any[], total: number }
const result = await applicationService.getTemplates(accountUuid);
console.log(result.templates); // 模板数组
console.log(result.total);     // 总数

// 获取单个模板 - 需要 accountUuid 确保安全
const template = await applicationService.getTemplateById(accountUuid, templateUuid);

// 更新模板
const updated = await applicationService.updateTemplate(accountUuid, templateUuid, {
  title: '新标题',
});

// 删除模板
await applicationService.deleteTemplate(accountUuid, templateUuid);
```

#### Group 相关

```typescript
// 创建模板组
const group = await applicationService.createGroup(accountUuid, {
  name: '工作提醒',
  color: '#FF5733',
});

// 获取模板组列表
const groups = await applicationService.getGroups(accountUuid);

// 更新模板组
const updated = await applicationService.updateGroup(accountUuid, groupUuid, {
  name: '新名称',
});

// 更新组排序
await applicationService.updateGroupOrder(accountUuid, {
  groupOrders: [
    { uuid: 'group-1', order: 1 },
    { uuid: 'group-2', order: 2 },
  ],
});

// 删除模板组
await applicationService.deleteGroup(accountUuid, groupUuid);
```

## 📋 TODO 方法

以下方法已在 Controller 中临时注释，需要后续实现：

### 1. toggleTemplateEnabled
```typescript
// TODO: 切换模板启用状态
// await applicationService.toggleTemplateEnabled(accountUuid, templateUuid, enabled);
```

### 2. searchTemplates
```typescript
// TODO: 搜索模板
// const results = await applicationService.searchTemplates(
//   accountUuid,
//   searchTerm,
//   { limit, offset }
// );
```

### 3. getReminderTemplateStats
```typescript
// TODO: 获取模板统计
// const stats = await applicationService.getReminderTemplateStats(templateUuid);
```

### 4. getAccountStats
```typescript
// TODO: 获取账户统计
// const stats = await applicationService.getAccountStats(accountUuid);
```

### 5. generateInstancesAndSchedules
```typescript
// TODO: 生成实例和计划（可能需要与 Schedule 模块集成）
// const result = await applicationService.generateInstancesAndSchedules(
//   templateUuid,
//   { days, regenerate }
// );
```

## ⚠️ 重要注意事项

### 1. accountUuid 参数顺序
```typescript
// ❌ 错误 - 旧 API
domainService.createTemplate(request, accountUuid);

// ✅ 正确 - 新 API
applicationService.createTemplate(accountUuid, request);
```

### 2. getTemplates 返回类型
```typescript
// ❌ 错误 - 假设返回数组
const templates = await applicationService.getTemplates(accountUuid);
console.log(templates.length); // Error!

// ✅ 正确 - 解构返回对象
const result = await applicationService.getTemplates(accountUuid);
console.log(result.templates); // 数组
console.log(result.total);     // 总数
```

### 3. 使用 getApplicationService()
```typescript
// ❌ 错误 - 直接访问可能为 null
await ReminderTemplateController.applicationService.getTemplates(accountUuid);

// ✅ 正确 - 使用 getter 方法
const applicationService = await ReminderTemplateController.getApplicationService();
await applicationService.getTemplates(accountUuid);
```

### 4. 提取 accountUuid
```typescript
// ✅ 推荐 - 使用 extractAccountUuid 辅助方法
const accountUuid = ReminderTemplateController.extractAccountUuid(req);

// ⚠️ 备选 - 手动提取（不推荐）
const accountUuid = (req as any).user?.uuid || '';
```

## 🗂️ 文件位置

```
apps/api/src/modules/reminder/
├── domain/
│   ├── entities/
│   │   ├── ReminderTemplateAggregate.ts        # 模板聚合根
│   │   └── ReminderTemplateGroupAggregate.ts   # 模板组聚合根
│   └── services/
│       ├── ReminderTemplateDomainService.ts    # 模板领域服务
│       └── ReminderTemplateGroupDomainService.ts # 模板组领域服务
├── infrastructure/
│   └── repositories/
│       ├── ReminderTemplateAggregateRepository.ts      # Prisma 仓储
│       └── ReminderTemplateGroupAggregateRepository.ts # Prisma 仓储
├── application/
│   └── services/
│       └── ReminderApplicationService.ts       # 应用服务（单例）
└── interface/
    └── http/
        └── controllers/
            ├── ReminderTemplateController.ts        # HTTP 控制器
            └── ReminderTemplateGroupController.ts   # HTTP 控制器
```

## 📦 依赖包

```
@dailyuse/domain-server   # 仓储接口定义
@dailyuse/contracts       # API 契约
@dailyuse/utils          # 工具函数
```

## 🎓 学习资源

- [DDD 架构文档](../systems/DDD_ARCHITECTURE.md)
- [重构完成总结](./REMINDER_REFACTORING_COMPLETION.md)
- [Contracts 命名规范](../CONTRACTS_NAMING_CONVENTION.md)

---

**快速提示**: 
- 所有方法都需要 `accountUuid` 作为第一个参数
- 使用 `getApplicationService()` 获取单例
- TODO 方法已临时返回模拟数据，不会导致错误
