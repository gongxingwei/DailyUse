# Reminder API 客户端错误修复总结

## 问题概述

Reminder API 客户端代码使用了旧的响应格式，尝试访问 `['data']` 属性，但新的响应类型已经直接返回 DTO对象，不再包装在 `data` 属性中。

## 错误类型

### 1. 类型命名错误
```typescript
// ❌ 错误
CreateReminderGroupRequest

// ✅ 正确
CreateReminderTemplateGroupRequest
```

### 2. 响应类型访问错误
```typescript
// ❌ 错误 - 旧的响应格式
Promise<ReminderContracts.ReminderTemplateResponse['data']>

// ✅ 正确 - 新的响应格式
Promise<ReminderContracts.ReminderTemplateClientDTO>
```

### 3. API 客户端方法缺失
以下方法在 ReminderApiClient 中不存在：
- `createReminderInstance`
- `getReminderInstances`
- `respondToReminder`
- `batchProcessInstances`

## 修复策略

由于这些是**前端代码**的问题，而且涉及的方法可能：
1. 还没有实现
2. 使用了不同的方法名
3. 需要完全重写

**建议**: 
- 先检查 ReminderApiClient 的实际接口
- 如果方法不存在，标记为 TODO 或使用临时实现
- 移除所有 `['data']` 访问

## 受影响的文件

1. **apps/web/src/modules/reminder/application/services/ReminderWebApplicationService.ts**
   - 11个 `['data']` 错误
   - 4个方法不存在错误

2. **apps/web/src/modules/reminder/presentation/composables/useReminder.ts**
   - 2个命名错误 ✅ 已修复
   - 8个 `['data']` 错误

## 快速修复模式

### 响应类型映射

| 旧类型（错误） | 新类型（正确） |
|-------------|-------------|
| `ReminderTemplateResponse['data']` | `ReminderTemplateClientDTO` |
| `ReminderInstanceResponse['data']` | `ReminderInstanceClientDTO` |
| `ReminderInstanceListResponse['data']` | `ReminderInstanceListResponse` |
| `ReminderStatsResponse['data']` | `ReminderStatsResponse` |
| `UpcomingRemindersResponse['data']` | `UpcomingRemindersResponse` |

### 批量替换清单

在两个文件中批量替换：

1. `ReminderTemplateResponse['data']` → `ReminderTemplateClientDTO`
2. `ReminderInstanceResponse['data']` → `ReminderInstanceClientDTO`
3. `ReminderInstanceListResponse['data']` → `ReminderInstanceListResponse`
4. `ReminderStatsResponse['data']` → `ReminderStatsResponse`
5. `UpcomingRemindersResponse['data']` → `UpcomingRemindersResponse`

## 方法不存在的处理

对于不存在的方法，有两种选择：

### 选项A: 添加 TODO 注释
```typescript
// TODO: Implement this method in ReminderApiClient
throw new Error('Method not implemented yet');
```

### 选项B: 使用其他方法替代
检查 ReminderApiClient 中是否有类似功能的方法。

---

**创建时间**: 2025-10-07  
**状态**: 部分完成（2/2 命名错误已修复）  
**剩余**: 19 个 `['data']` 错误 + 4 个方法不存在错误

