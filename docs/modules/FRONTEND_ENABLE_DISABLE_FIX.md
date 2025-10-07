# 前端启用/禁用功能修复总结

**日期**: 2025-01-10  
**状态**: ✅ 完成

---

## 🔧 修复内容

### 1. Template 启用/禁用按钮修复

**文件**: `apps/web/src/modules/reminder/presentation/components/cards/TemplateDesktopCard.vue`

**问题**: 
- 原代码直接调用域对象的 `toggleEnabled()` 方法，没有调用后端 API
- 状态变更没有持久化到数据库

**修复**:
```typescript
const toggleEnabled = async () => {
    if (!template.value) return

    const previousValue = enabled.value
    
    try {
        // ✅ 调用 API 更新模板启用状态
        await updateTemplate(template.value.uuid, { enabled: enabled.value })
        snackbar.showSuccess(`提醒模板已${enabled.value ? '启用' : '禁用'}`)
    } catch (error) {
        // 回滚状态
        enabled.value = previousValue
        snackbar.showError('操作失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
}
```

**效果**:
- ✅ 调用 `PUT /api/v1/reminders/templates/:uuid` API
- ✅ 状态持久化到数据库
- ✅ 触发领域事件 `ReminderTemplateStatusChanged`
- ✅ Schedule 模块自动同步调度任务状态

---

### 2. Group 启用/禁用按钮修复

**文件**: `apps/web/src/modules/reminder/presentation/components/cards/GroupDesktopCard.vue`

**问题**:
- 调用了 API 但没有刷新分组数据
- GROUP 模式下子模板状态更新不同步

**修复 (toggleGroupEnabled)**:
```typescript
const toggleGroupEnabled = async () => {
    if (!group.value) return

    const previousValue = groupEnabled.value
    
    try {
        // ✅ 调用 API 更新分组启用状态
        await reminderService.toggleReminderTemplateGroupEnabled(group.value.uuid, groupEnabled.value)
        snackbar.showSuccess(`模板组已${groupEnabled.value ? '启用' : '禁用'}`)
        
        // ✅ 刷新分组数据以获取最新状态（包括子模板的状态更新）
        const refreshedGroup = await reminderService.getReminderTemplateGroup(group.value.uuid)
        if (refreshedGroup) {
            group.value = refreshedGroup
        }
    } catch (error) {
        // 回滚状态
        groupEnabled.value = previousValue
        snackbar.showError('操作失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
}
```

**修复 (toggleTemplateEnabled)**:
```typescript
const toggleTemplateEnabled = async (template: ReminderTemplate) => {
    const newEnabled = !template.enabled
    
    try {
        // ✅ 调用 API 更新模板启用状态
        await reminderService.updateReminderTemplate(template.uuid, { enabled: newEnabled })
        snackbar.showSuccess(`模板已${newEnabled ? '启用' : '禁用'}`)
        
        // ✅ 刷新分组数据以获取最新状态
        if (group.value) {
            const refreshedGroup = await reminderService.getReminderTemplateGroup(group.value.uuid)
            if (refreshedGroup) {
                group.value = refreshedGroup
            }
        }
    } catch (error) {
        snackbar.showError('操作失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
}
```

**效果**:
- ✅ 调用 `PATCH /api/v1/reminders/groups/:uuid/toggle` API
- ✅ GROUP 模式下所有子模板状态同步更新
- ✅ 每个模板触发 `ReminderTemplateStatusChanged` 事件
- ✅ Schedule 模块批量更新所有关联的调度任务

---

## 🔄 完整的启用/禁用流程

### Template 启用流程

```
用户点击模板启用开关
  ↓
前端: toggleEnabled() 调用 updateTemplate()
  ↓
API: PUT /reminders/templates/:uuid { enabled: true }
  ↓
Controller → DomainService → Aggregate
  ↓
ReminderTemplate.toggleEnabled(true)
  ↓ (聚合根内部)
发布事件: ReminderTemplateStatusChanged
  ↓
EventBus 分发
  ↓
ReminderTemplateStatusChangedHandler.handle()
  ↓
查找关联任务: findBySource('reminder', templateUuid)
  ↓
更新任务: updateTask(uuid, { enabled: true })
  ↓
SchedulerService: 启用 cron job
  ↓
✅ 完成: 模板状态 + 调度任务状态同步更新
```

### Group 启用流程 (GROUP 模式)

```
用户点击分组启用开关
  ↓
前端: toggleGroupEnabled() 调用 API
  ↓
API: PATCH /reminders/groups/:uuid/toggle { enabled: true }
  ↓
Controller → DomainService → Aggregate
  ↓
ReminderTemplateGroup.toggleEnabled(true)
  ↓ (enableMode === 'group')
遍历所有模板: template.toggleEnabled(true)
  ↓ (每个模板)
发布事件: ReminderTemplateStatusChanged (多个)
  ↓
EventBus 批量分发
  ↓
ReminderTemplateStatusChangedHandler 批量处理
  ↓
更新所有关联任务: updateTask(uuid, { enabled: true })
  ↓
前端: 刷新分组数据获取最新状态
  ↓
✅ 完成: 分组 + 所有模板 + 所有调度任务同步更新
```

---

## 📁 新增文件

### upcomingReminderCalculator.ts

**路径**: `apps/web/src/modules/reminder/presentation/utils/upcomingReminderCalculator.ts`

**功能**: 前端计算即将到来的提醒（取代从 Schedule 模块获取）

**核心方法**:

```typescript
/**
 * 计算即将到来的提醒
 * 
 * @param templates - 提醒模板列表
 * @param options - 计算选项
 * @returns 即将到来的提醒列表（按时间排序）
 */
export function calculateUpcomingReminders(
  templates: ReminderTemplate[],
  options: {
    withinMinutes?: number;  // 时间范围（分钟），默认 24 小时
    limit?: number;          // 最大返回数量
    enabledOnly?: boolean;   // 只包含启用的模板
  } = {},
): UpcomingReminder[]
```

**支持的时间配置类型**:
- ✅ `DAILY` - 每日提醒（支持多个时间点）
- ✅ `WEEKLY` - 每周提醒（支持多个星期、多个时间点）
- ✅ `MONTHLY` - 每月提醒（支持多个日期、多个时间点）
- ⏳ `CUSTOM` - 自定义提醒（暂不支持，需要后续实现）

**工具方法**:
```typescript
// 格式化显示
formatUpcomingReminder(reminder): string

// 按优先级分组
groupByPriority(reminders): Record<Priority, UpcomingReminder[]>

// 按类别分组
groupByCategory(reminders): Record<string, UpcomingReminder[]>
```

**使用示例**:
```typescript
import { calculateUpcomingReminders } from '@/modules/reminder/presentation/utils/upcomingReminderCalculator'
import { useReminderStore } from '@/modules/reminder/presentation/stores/reminderStore'

const reminderStore = useReminderStore()

// 计算未来 24 小时的提醒
const upcomingReminders = calculateUpcomingReminders(
  reminderStore.reminderTemplates,
  {
    withinMinutes: 60 * 24,  // 24 小时
    limit: 50,               // 最多 50 条
    enabledOnly: true,       // 只包含启用的
  }
)

console.log('即将到来的提醒:', upcomingReminders)
```

**优势**:
- ✅ 前端实时计算，无需请求后端
- ✅ 减轻 Schedule 模块负担
- ✅ 响应速度更快
- ✅ 可自定义时间范围和过滤条件
- ✅ 支持离线计算

---

## 🧪 测试建议

### 1. Template 启用/禁用测试

```bash
# 1. 创建一个提醒模板
# 2. 点击启用开关 → 禁用
# 3. 验证:
#    - 模板状态变为 enabled: false
#    - 对应的 RecurringScheduleTask 被禁用
#    - 不再触发提醒通知
# 4. 再次点击启用开关 → 启用
# 5. 验证:
#    - 模板状态变为 enabled: true
#    - RecurringScheduleTask 被重新启用
#    - 恢复触发提醒通知
```

### 2. Group 启用/禁用测试 (GROUP 模式)

```bash
# 1. 创建一个分组，包含 3 个模板
# 2. 确保启用模式为 GROUP
# 3. 点击分组启用开关 → 禁用
# 4. 验证:
#    - 分组状态: enabled: false
#    - 所有 3 个模板状态: enabled: false
#    - 所有关联的 RecurringScheduleTask 被禁用
# 5. 再次点击启用 → 启用
# 6. 验证:
#    - 分组状态: enabled: true
#    - 所有 3 个模板状态: enabled: true
#    - 所有 RecurringScheduleTask 被重新启用
```

### 3. Group 启用/禁用测试 (INDIVIDUAL 模式)

```bash
# 1. 切换启用模式为 INDIVIDUAL
# 2. 点击分组启用开关 → 禁用
# 3. 验证:
#    - 分组状态: enabled: false
#    - 每个模板状态保持独立（enabled: selfEnabled）
#    - RecurringScheduleTask 根据各自模板状态独立控制
# 4. 点击单个模板的启用开关
# 5. 验证:
#    - 只影响该模板的状态
#    - 不影响其他模板
#    - 只更新该模板对应的 RecurringScheduleTask
```

### 4. 即将到来的提醒计算测试

```typescript
// 创建测试数据
const testTemplates = [
  {
    uuid: '1',
    name: '每日提醒',
    timeConfig: { type: 'DAILY', times: ['09:00', '18:00'] },
    enabled: true,
    // ...
  },
  {
    uuid: '2',
    name: '每周提醒',
    timeConfig: { type: 'WEEKLY', weekdays: [1, 3, 5], times: ['10:00'] },
    enabled: true,
    // ...
  },
]

// 计算即将到来的提醒
const upcoming = calculateUpcomingReminders(testTemplates, {
  withinMinutes: 60 * 24,
  limit: 20,
})

console.log('计算结果:', upcoming)
// 验证:
// - 每日提醒应包含今天 18:00（如果还没到）和明天 09:00
// - 每周提醒应包含本周和下周的时间点
// - 按时间顺序排序
```

---

## 📊 性能考虑

### API 调用优化

**当前实现**:
- ✅ 每次启用/禁用都调用 API
- ✅ 成功后刷新数据

**可能的优化** (未来):
- ⏳ 乐观更新：先更新 UI，后台调用 API
- ⏳ 批量操作：批量启用/禁用多个模板
- ⏳ 防抖处理：避免快速连续点击

### 事件处理优化

**当前实现**:
- ✅ 每个模板状态变更触发一个事件
- ✅ 事件处理器逐个处理

**可能的优化** (未来):
- ⏳ 批量事件：合并相同类型的事件
- ⏳ 异步队列：避免阻塞主流程
- ⏳ 事件去重：避免重复处理

### 即将到来的提醒计算优化

**当前实现**:
- ✅ 每次调用重新计算
- ✅ 时间复杂度: O(n * m)，n=模板数，m=时间点数

**可能的优化** (未来):
- ⏳ 缓存结果：相同参数返回缓存
- ⏳ 增量更新：只计算变更的模板
- ⏳ 懒加载：按需分页计算

---

## ✅ 检查清单

- [x] TemplateDesktopCard 调用正确的 API
- [x] GroupDesktopCard 调用正确的 API
- [x] 启用/禁用后刷新数据
- [x] 错误处理和回滚逻辑
- [x] 用户提示信息
- [x] 创建前端即将到来的提醒计算工具
- [x] 所有 TypeScript 编译错误修复
- [x] 文档完整

---

## 🚀 下一步

1. **用户测试**
   - 测试启用/禁用功能
   - 验证事件流程
   - 检查调度任务同步

2. **即将到来的提醒集成**
   - 在需要显示"即将到来的提醒"的组件中使用 `calculateUpcomingReminders()`
   - 替换现有的从 Schedule 模块获取数据的逻辑
   - 添加缓存机制（如果需要）

3. **性能优化**
   - 添加乐观更新
   - 实现批量操作
   - 优化事件处理

4. **用户体验优化**
   - 添加 loading 状态
   - 添加确认对话框（批量操作）
   - 添加操作历史记录

---

**实现者**: GitHub Copilot  
**状态**: ✅ 前端修复完成
