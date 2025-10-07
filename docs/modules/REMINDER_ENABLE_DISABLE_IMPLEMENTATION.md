# Reminder 模块启用/禁用功能实现总结

**实现日期**: 2025-01-10  
**功能**: Reminder 模板和分组的启用/禁用业务逻辑  
**状态**: ✅ 后端完成，⏳ 前端待测试

---

## 📋 需求概述

1. **Template 启用/禁用**: 单个提醒模板的启用状态切换
2. **Group 启用状态切换**: 分组整体的启用/禁用
3. **Group 启用模式切换**: `group` (所有模板跟随) vs `individual` (独立控制)
4. **Schedule 同步**: 启用/禁用时自动同步 RecurringScheduleTask

---

## ✅ 已完成的工作

### 1. 核心层 (packages/domain-core)

#### ReminderTemplateCore.ts
- ✅ `toggleEnabled(enabled, context)` - 切换启用状态
- ✅ `toggleSelfEnabled(selfEnabled, context)` - 切换自我启用状态
- ✅ 发布领域事件: `ReminderTemplateStatusChanged`

```typescript
toggleEnabled(enabled: boolean, context?: { accountUuid: string }): void {
  const oldEnabled = this._enabled;
  this._enabled = enabled;
  
  // 发布领域事件给 Schedule 模块
  this.addDomainEvent({
    eventType: 'ReminderTemplateStatusChanged',
    aggregateId: this.uuid,
    payload: {
      templateUuid: this.uuid,
      oldEnabled,
      newEnabled: enabled,
      template: this.toDTO(),
      accountUuid: context?.accountUuid,
    },
  });
}
```

#### ReminderTemplateGroupCore.ts
- ✅ `toggleEnabled(enabled)` - 切换组启用状态
  - GROUP 模式: 自动切换所有子模板
  - INDIVIDUAL 模式: 仅切换组标识
- ✅ `updateEnableMode(enableMode)` - 切换启用模式
  - 切换到 GROUP 时自动同步所有模板状态

```typescript
updateEnableMode(enableMode: ReminderTemplateEnableMode): void {
  if (this._enableMode === enableMode) return;
  
  this._enableMode = enableMode;
  
  // 切换到 GROUP 模式时，同步所有模板
  if (enableMode === ReminderContracts.ReminderTemplateEnableMode.GROUP) {
    this.templates.forEach((template) => {
      template.toggleEnabled(this._enabled);
    });
  }
}
```

### 2. 领域服务层 (apps/api/src/modules/reminder/domain/services)

#### ReminderTemplateDomainService.ts
- ✅ `toggleTemplateEnabled(accountUuid, uuid, enabled)` - 已存在
- ✅ 调用聚合根方法，自动发布领域事件

#### ReminderTemplateGroupDomainService.ts
- ✅ `toggleGroupEnabled(accountUuid, uuid, enabled)` - **新增**
- ✅ `updateGroupEnableMode(accountUuid, uuid, enableMode)` - **新增**

```typescript
async toggleGroupEnabled(
  accountUuid: string,
  uuid: string,
  enabled: boolean,
): Promise<any> {
  const group = await this.groupRepository.getGroupByUuid(accountUuid, uuid);
  if (!group) throw new Error(`Group ${uuid} not found`);
  
  // 调用聚合根方法（自动发布事件并更新所有模板）
  group.toggleEnabled(enabled);
  
  // 持久化更新（包括组和所有模板）
  const updatedGroup = await this.groupRepository.saveGroup(accountUuid, group);
  
  return updatedGroup.toClient();
}
```

### 3. API 控制器层 (apps/api/src/modules/reminder/interface/http)

#### ReminderTemplateGroupController.ts
- ✅ `toggleTemplateGroupEnabled(req, res)` - **新增实现**
  - 路由: `PATCH /reminders/groups/:groupUuid/toggle`
  - Body: `{ enabled: boolean }`
- ✅ `updateGroupEnableMode(req, res)` - **新增实现**
  - 路由: `PUT /reminders/groups/:groupUuid/enable-mode`
  - Body: `{ enableMode: 'group' | 'individual' }`

```typescript
static async toggleTemplateGroupEnabled(req: Request, res: Response) {
  const { groupUuid } = req.params;
  const { enabled } = req.body;
  const accountUuid = (req as any).user?.accountUuid;
  
  const updatedGroup = await ReminderTemplateGroupController
    .groupDomainService.toggleGroupEnabled(accountUuid, groupUuid, enabled);
  
  return responseBuilder.sendSuccess(res, updatedGroup, 
    enabled ? 'Group enabled successfully' : 'Group disabled successfully');
}
```

### 4. 路由注册 (apps/api/src/modules/reminder/interface/http/routes)

#### reminderTemplateGroupRoutes.ts
- ✅ 已存在: `router.patch('/:groupUuid/toggle', ...)`
- ✅ 新增: `router.put('/:groupUuid/enable-mode', ...)`

### 5. Schedule 模块事件监听器 (apps/api/src/modules/schedule)

#### ReminderTemplateStatusChangedHandler.ts - **新建文件**
- ✅ 监听 `ReminderTemplateStatusChanged` 事件
- ✅ 查找关联的 `RecurringScheduleTask`
- ✅ 调用 `updateTask(uuid, { enabled })` 同步启用状态

```typescript
async handle(event: DomainEvent): Promise<void> {
  const { templateUuid, oldEnabled, newEnabled } = event.payload;
  
  // 查找关联的调度任务
  const tasks = await this.recurringScheduleTaskDomainService
    .findBySource('reminder', templateUuid);
  
  // 更新所有关联任务的启用状态
  for (const task of tasks) {
    await this.recurringScheduleTaskDomainService.updateTask(task.uuid, {
      enabled: newEnabled,
    });
  }
}
```

#### ScheduleEventHandlers.ts - **新建文件**
- ✅ 注册 Schedule 模块的所有事件处理器
- ✅ 初始化 `ReminderTemplateStatusChangedHandler`

#### unifiedEventSystem.ts
- ✅ 添加 `initializeScheduleEventHandlers()` 调用

---

## 🔄 业务流程

### Template 启用/禁用流程

```
用户点击启用/禁用按钮
   ↓
前端: PATCH /reminders/templates/:uuid (enabled: true/false)
   ↓
Controller: ReminderTemplateController.updateTemplate()
   ↓
DomainService: templateDomainService.updateTemplate()
   ↓
Aggregate: template.toggleEnabled(enabled)
   ↓
发布事件: ReminderTemplateStatusChanged
   ↓
EventBus: getEventBus().publish([event])
   ↓
Schedule 监听器: ReminderTemplateStatusChangedHandler.handle()
   ↓
查找任务: recurringScheduleTaskDomainService.findBySource('reminder', templateUuid)
   ↓
更新任务: recurringScheduleTaskDomainService.updateTask(taskUuid, { enabled })
   ↓
SchedulerService: 启用/禁用 cron job
   ↓
✅ 完成同步
```

### Group 启用模式切换流程

```
用户切换启用模式 (group/individual)
   ↓
前端: PUT /reminders/groups/:uuid/enable-mode { enableMode: 'group' }
   ↓
Controller: ReminderTemplateGroupController.updateGroupEnableMode()
   ↓
DomainService: groupDomainService.updateGroupEnableMode()
   ↓
Aggregate: group.updateEnableMode('group')
   ↓
自动同步: group.templates.forEach(t => t.toggleEnabled(group.enabled))
   ↓
批量发布事件: 每个模板的 ReminderTemplateStatusChanged
   ↓
Schedule 监听器: 批量处理每个模板的调度任务
   ↓
✅ 完成同步
```

---

## 📡 API 接口文档

### 1. 切换分组启用状态

**Endpoint**: `PATCH /api/v1/reminders/groups/:groupUuid/toggle`

**Request Body**:
```json
{
  "enabled": true
}
```

**Response**:
```json
{
  "code": 200,
  "success": true,
  "message": "Group enabled successfully",
  "data": {
    "uuid": "group-123",
    "name": "工作提醒",
    "enabled": true,
    "enableMode": "group",
    "templates": [
      {
        "uuid": "template-456",
        "name": "站立会议",
        "enabled": true,  // ← 如果是 group 模式，会自动更新
        "selfEnabled": true
      }
    ]
  }
}
```

### 2. 更新分组启用模式

**Endpoint**: `PUT /api/v1/reminders/groups/:groupUuid/enable-mode`

**Request Body**:
```json
{
  "enableMode": "group"  // 或 "individual"
}
```

**Response**:
```json
{
  "code": 200,
  "success": true,
  "message": "Enable mode updated to group",
  "data": {
    "uuid": "group-123",
    "enableMode": "group",
    "enabled": true,
    "templates": [...]
  }
}
```

### 3. 切换模板启用状态 (已存在)

**Endpoint**: `PUT /api/v1/reminders/templates/:templateUuid`

**Request Body**:
```json
{
  "enabled": true
}
```

---

## 🔍 前端检查清单

### Web 端 (apps/web)

#### 需要确认的点:

1. **API Client** (`src/modules/reminder/infrastructure/api/reminderApiClient.ts`)
   - ✅ 已存在: `toggleGroupEnabled(groupUuid, enabled)`
   - ✅ 已存在: `toggleGroupEnableMode(groupUuid, request)`
   - ✅ 已存在: `toggleTemplateSelfEnabled(templateUuid, request)`

2. **Composable** (`src/modules/reminder/presentation/composables/useReminder.ts`)
   - ✅ 已存在: `toggleGroupEnabled(uuid)`
   - ✅ 已存在: `toggleGroupEnableMode(uuid, enableMode)`

3. **Store** (`src/modules/reminder/presentation/stores/reminderStore.ts`)
   - ✅ 已存在: `setGroupEnableMode(groupUuid, mode)`

4. **组件**:
   - `GroupDesktopCard.vue` - 分组卡片
     - 检查: 启用开关是否调用正确的API
     - 检查: 启用模式切换是否调用正确的API
   - `ReminderTemplateCard.vue` - 模板卡片
     - 检查: 启用开关是否调用正确的API

#### 测试步骤:

1. **测试 Group 启用/禁用**:
   ```
   1. 打开分组卡片
   2. 点击启用开关
   3. 验证:
      - 分组状态更新
      - 如果是 group 模式，所有子模板状态同步更新
      - 对应的 RecurringScheduleTask 被启用/禁用
   ```

2. **测试 Group 启用模式切换**:
   ```
   1. 打开分组卡片
   2. 切换启用模式 (group ↔ individual)
   3. 验证:
      - 模式切换成功
      - group 模式: 所有子模板跟随分组状态
      - individual 模式: 每个模板独立控制
   ```

3. **测试 Template 启用/禁用**:
   ```
   1. 在 individual 模式的分组中
   2. 点击单个模板的启用开关
   3. 验证:
      - 模板状态更新
      - 对应的 RecurringScheduleTask 被启用/禁用
      - 不影响其他模板
   ```

---

## 🧪 后端测试建议

### 单元测试

```typescript
describe('ReminderTemplateStatusChangedHandler', () => {
  it('should enable RecurringScheduleTask when template is enabled', async () => {
    // Arrange
    const event = {
      eventType: 'ReminderTemplateStatusChanged',
      payload: {
        templateUuid: 'template-123',
        oldEnabled: false,
        newEnabled: true,
      },
    };
    
    // Act
    await handler.handle(event);
    
    // Assert
    expect(mockRecurringScheduleTaskService.updateTask).toHaveBeenCalledWith(
      'task-456',
      { enabled: true }
    );
  });
});
```

### 集成测试

```bash
# 1. 创建提醒模板
POST /api/v1/reminders/templates
{
  "name": "测试提醒",
  "timeConfig": { "type": "interval", "interval": 60 }
}

# 2. 检查 RecurringScheduleTask 已创建且启用
GET /api/v1/schedules/upcoming

# 3. 禁用模板
PUT /api/v1/reminders/templates/:uuid
{ "enabled": false }

# 4. 验证 RecurringScheduleTask 已禁用
GET /api/v1/schedules/upcoming
# → 不应包含该提醒

# 5. 重新启用
PUT /api/v1/reminders/templates/:uuid
{ "enabled": true }

# 6. 验证 RecurringScheduleTask 已重新启用
GET /api/v1/schedules/upcoming
# → 应包含该提醒
```

---

## 🚀 部署说明

### 数据库迁移
无需数据库迁移，使用现有字段。

### 环境要求
- Node.js 18+
- TypeScript 5+
- Prisma 5+

### 启动顺序
```bash
# 1. 启动后端
cd apps/api
pnpm dev

# 2. 启动前端
cd apps/web
pnpm dev
```

### 验证日志

启动时应看到:
```
🚀 [EventSystem] 初始化统一事件处理系统...
🗓️ [EventSystem] 注册 Schedule 模块事件处理器...
✅ [Schedule] ReminderTemplateStatusChangedHandler 已注册
✅ [Schedule] Schedule 模块事件处理器初始化完成
```

---

## 📝 注意事项

1. **事件异步处理**: 启用/禁用是异步的，Schedule 任务更新可能有延迟
2. **错误容忍**: 事件处理失败不会影响主流程，只会记录日志
3. **批量操作**: 切换 Group 模式时可能触发大量事件，注意性能
4. **前端同步**: 前端需要在操作后刷新数据以获取最新状态

---

## 🎯 下一步

- [ ] 前端测试启用/禁用按钮功能
- [ ] 验证 Schedule 任务同步是否正常
- [ ] 添加批量操作 API (批量启用/禁用多个模板)
- [ ] 添加操作日志记录
- [ ] 性能优化 (批量事件处理)

---

**实现者**: GitHub Copilot  
**审核者**: 待定  
**状态**: ✅ 后端完成，⏳ 前端待测试
