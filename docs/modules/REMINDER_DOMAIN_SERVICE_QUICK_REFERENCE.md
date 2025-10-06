# Reminder Domain Service 快速参考

## 📋 方法速查

### CRUD 操作

#### ✅ `createReminderTemplate(accountUuid, request, options?)`
创建新的提醒模板（**推荐使用**）

**智能特性**：
- ✅ 自动判断启用状态
- ✅ 启用时自动生成未来 7 天的提醒实例
- ✅ 节省手动操作步骤

```typescript
const result = await domainService.createReminderTemplate('account-uuid', {
  uuid: generateUuid(),
  name: '每日站会提醒',
  message: '记得参加每日站会',
  timeConfig: {
    type: 'daily',
    times: ['09:00']
  },
  priority: 'high',
  category: 'work',
  tags: ['meeting', 'daily'],
  enabled: true  // 设为 true 时会自动生成实例
});
// 返回: ReminderTemplateClientDTO（包含已生成的 instances）

// 高级选项
const result = await domainService.createReminderTemplate('account-uuid', request, {
  autoGenerateInstances: true,  // 是否自动生成实例，默认 true
  instanceDays: 14              // 生成未来 14 天的实例，默认 7 天
});
```

**业务逻辑**：
1. 创建聚合根实例
2. 持久化模板
3. **如果 `enabled=true` 且 `selfEnabled=true`，自动生成实例**
4. 返回包含实例的完整模板数据

---

#### ⚠️ `createTemplate(accountUuid, request)` - 已废弃
旧的创建方法（保持向后兼容）

```typescript
// ⚠️ 已废弃，建议使用 createReminderTemplate
const result = await domainService.createTemplate('account-uuid', request);
```

**为什么废弃**：
- ❌ 不会自动生成实例
- ❌ 需要手动调用 `generateInstances()`
- ✅ 新方法 `createReminderTemplate` 更智能

---

#### ✅ `getAllTemplates(accountUuid, params?)`
获取所有模板（支持分页和过滤）

```typescript
const result = await domainService.getAllTemplates('account-uuid', {
  groupUuid: 'group-uuid',  // 可选：按分组过滤
  isActive: true,           // 可选：只获取启用的
  limit: 20,
  offset: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
// 返回: { templates: ReminderTemplateClientDTO[], total: number }
```

---

#### ✅ `getTemplateByUuid(accountUuid, uuid)`
获取单个模板详情

```typescript
const template = await domainService.getTemplateByUuid('account-uuid', 'template-uuid');
// 返回: ReminderTemplateClientDTO | null
```

---

#### ✅ `updateTemplate(accountUuid, uuid, request)`
更新模板（支持部分更新）

```typescript
const updated = await domainService.updateTemplate('account-uuid', 'template-uuid', {
  name: '新名称',
  enabled: false,
  timeConfig: {
    type: 'weekly',
    weekDays: [1, 3, 5],  // 周一、周三、周五
    times: ['14:00']
  }
});
// 返回: ReminderTemplateClientDTO
```

**会触发的领域事件**:
- `ReminderTemplateTimeConfigChanged` - 修改 timeConfig 时
- `ReminderTemplateStatusChanged` - 修改 enabled/selfEnabled 时

---

#### ✅ `deleteTemplate(accountUuid, uuid)`
删除模板

```typescript
const success = await domainService.deleteTemplate('account-uuid', 'template-uuid');
// 返回: boolean
```

---

#### ✅ `searchTemplates(accountUuid, keyword, params?)`
搜索模板

```typescript
const result = await domainService.searchTemplates('account-uuid', '站会', {
  limit: 10,
  offset: 0
});
// 返回: { templates: ReminderTemplateClientDTO[], total: number }
```

**搜索范围**: name, message, description, tags, category

---

### 业务逻辑方法

#### ✅ `toggleTemplateEnabled(accountUuid, uuid, enabled)`
切换启用状态

```typescript
const updated = await domainService.toggleTemplateEnabled('account-uuid', 'template-uuid', false);
// 返回: ReminderTemplateClientDTO
```

**触发领域事件**: `ReminderTemplateStatusChanged`

---

#### ✅ `generateInstances(accountUuid, templateUuid, days)`
生成提醒实例

```typescript
const result = await domainService.generateInstances('account-uuid', 'template-uuid', 7);
console.log(`Created ${result.instanceCount} instances`);
// 返回: { instanceCount: number }
```

**使用场景**:
- 初始化新模板的提醒实例
- 修改时间配置后重新生成
- 定期任务预生成未来的提醒

---

## 🎯 常见使用场景

### 场景 1: 创建每日提醒（智能版）⭐ 推荐
```typescript
// 使用新方法：自动生成实例
const template = await domainService.createReminderTemplate(accountUuid, {
  uuid: generateUuid(),
  name: '喝水提醒',
  message: '记得喝水，保持健康！',
  timeConfig: {
    type: 'daily',
    times: ['10:00', '14:00', '16:00']  // 每天 3 次
  },
  priority: 'normal',
  category: 'health',
  tags: ['健康', '习惯'],
  enabled: true,  // 启用后会自动生成未来 7 天的 21 个实例
  notificationSettings: {
    sound: true,
    vibrate: true,
    led: false
  }
});

// 创建后立即可用，无需额外操作
console.log(`已创建 ${template.instances?.length} 个提醒实例`);
```

**对比旧方法**：
```typescript
// ❌ 旧方法：需要两步操作
const template = await domainService.createTemplate(accountUuid, request);
await domainService.generateInstances(accountUuid, template.uuid, 7);  // 需要手动生成

// ✅ 新方法：一步到位
const template = await domainService.createReminderTemplate(accountUuid, request);
```

---

### 场景 2: 创建周期性会议提醒（自定义天数）
```typescript
await domainService.createReminderTemplate(accountUuid, {
  uuid: generateUuid(),
  name: '周报会议',
  message: '准备周报材料',
  timeConfig: {
    type: 'weekly',
    weekDays: [5],        // 每周五
    times: ['15:00']
  },
  priority: 'high',
  category: 'work',
  tags: ['会议', '周报'],
  enabled: true,
  snoozeConfig: {
    enabled: true,
    type: 'fixed',
    duration: 30,
    unit: 'minutes',
    maxSnoozeCount: 3
  }
}, {
  instanceDays: 30  // 生成未来 30 天的实例（约 4 次会议）
});
```

---

### 场景 3: 创建草稿模板（不生成实例）
```typescript
// 创建模板但不立即启用（草稿状态）
await domainService.createReminderTemplate(accountUuid, {
  uuid: generateUuid(),
  name: '待定的提醒',
  message: '稍后配置',
  timeConfig: { type: 'daily', times: ['09:00'] },
  priority: 'normal',
  category: 'other',
  tags: [],
  enabled: false  // 禁用状态，不会生成实例
});

// 或者禁用自动生成
await domainService.createReminderTemplate(accountUuid, request, {
  autoGenerateInstances: false  // 即使 enabled=true 也不生成
});
```

---

### 场景 4: 批量启用/禁用模板
```typescript
const templates = await domainService.getAllTemplates(accountUuid, {
  category: 'work'
});

// 禁用所有工作类提醒
for (const template of templates.templates) {
  await domainService.toggleTemplateEnabled(accountUuid, template.uuid, false);
}
```

---

### 场景 5: 搜索并更新
```typescript
// 搜索包含"会议"的提醒
const result = await domainService.searchTemplates(accountUuid, '会议');

// 为所有会议提醒添加标签
for (const template of result.templates) {
  await domainService.updateTemplate(accountUuid, template.uuid, {
    tags: [...template.tags, '重要']
  });
}
```

---

## 🔔 领域事件说明

### `ReminderTemplateTimeConfigChanged`
**触发条件**: 调用 `updateTimeConfig()`  
**事件负载**:
```typescript
{
  eventType: 'ReminderTemplateTimeConfigChanged',
  aggregateId: 'template-uuid',
  occurredOn: Date,
  payload: {
    templateUuid: string,
    oldTimeConfig: ReminderTimeConfig,
    newTimeConfig: ReminderTimeConfig,
    template: ReminderTemplateDTO
  }
}
```

**监听者**: Schedule 模块

---

### `ReminderTemplateStatusChanged`
**触发条件**: 调用 `toggleEnabled()` 或 `toggleSelfEnabled()`  
**事件负载**:
```typescript
{
  eventType: 'ReminderTemplateStatusChanged',
  aggregateId: 'template-uuid',
  occurredOn: Date,
  payload: {
    templateUuid: string,
    oldEnabled: boolean,
    newEnabled: boolean,
    template: ReminderTemplateDTO,
    accountUuid: string
  }
}
```

**监听者**: Schedule 模块、Notification 模块

---

## 📊 数据流向

```
Controller
    ↓ request
ApplicationService
    ↓ accountUuid + request
DomainService (当前文件)
    ↓ 创建/加载聚合根
ReminderTemplate (聚合根)
    ↓ 调用业务方法
Repository
    ↓ 持久化
Database (Prisma)
```

---

## ⚠️ 注意事项

### 1. 事务管理
Domain Service 不负责事务管理，应该在 Application Service 层处理：

```typescript
// ❌ 错误：在 Domain Service 开启事务
async updateTemplate() {
  await prisma.$transaction(...);  // 不要这样做
}

// ✅ 正确：在 Application Service 开启事务
async updateTemplate() {
  return await prisma.$transaction(async (tx) => {
    // 调用 domain service
  });
}
```

---

### 2. 领域事件处理
领域事件由聚合根发布，Domain Service 不需要手动发布：

```typescript
// ✅ 正确：聚合根自动发布事件
template.toggleEnabled(true, { accountUuid });  // 内部会发布事件

// ❌ 错误：手动发布领域事件
eventBus.publish(new ReminderTemplateStatusChanged(...));  // 不要这样做
```

---

### 3. 参数验证
复杂业务规则验证在聚合根内部，简单参数验证在 Controller 层：

```typescript
// Controller 层：基本验证
if (!request.name || request.name.length > 100) {
  throw new ValidationError('Invalid name');
}

// 聚合根层：业务规则验证
validateName(name: string): void {
  if (name.length < 2) {
    throw new DomainError('名称至少 2 个字符');
  }
  // 更多业务规则...
}
```

---

## 🧪 测试示例

```typescript
import { ReminderTemplateDomainService } from './ReminderTemplateDomainService';
import type { IReminderTemplateAggregateRepository } from '@dailyuse/domain-server';

describe('ReminderTemplateDomainService', () => {
  let service: ReminderTemplateDomainService;
  let mockRepo: jest.Mocked<IReminderTemplateAggregateRepository>;

  beforeEach(() => {
    mockRepo = {
      saveTemplate: jest.fn(),
      getTemplateByUuid: jest.fn(),
      getAllTemplates: jest.fn(),
      deleteTemplate: jest.fn(),
      countTemplates: jest.fn(),
      templateExists: jest.fn(),
    };
    service = new ReminderTemplateDomainService(mockRepo);
  });

  it('should create template with default values', async () => {
    mockRepo.saveTemplate.mockResolvedValue({
      toClient: () => ({ uuid: 'test-uuid' })
    } as any);

    const result = await service.createTemplate('account-uuid', {
      uuid: 'test-uuid',
      name: 'Test',
      message: 'Test message',
      timeConfig: { type: 'daily', times: ['09:00'] },
      priority: 'normal',
      category: 'test',
      tags: []
    });

    expect(mockRepo.saveTemplate).toHaveBeenCalled();
    expect(result.uuid).toBe('test-uuid');
  });
});
```

---

## 🔗 相关资源

- [完整实现文档](./REMINDER_DOMAIN_SERVICE_IMPLEMENTATION.md)
- [Reminder 模块架构](./REMINDER_MODULE_ARCHITECTURE.md)
- [DDD 实现指南](../systems/DDD_IMPLEMENTATION_GUIDE.md)

---

**版本**: 1.0.0  
**最后更新**: 2025-10-06
