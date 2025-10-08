# 错误清理进度报告 - Step 1 & 2

## ✅ 已完成的工作

### Step 1: 清理 domain-server/ScheduleTask ✅

**删除的文件**:
- `packages/domain-server/src/schedule/aggregates/ScheduleTask.ts`
- `packages/domain-server/src/schedule/aggregates/ScheduleTask.test.ts`
- `apps/api/src/modules/schedule/domain/services/ScheduleDomainService.ts`

**重写的文件**:
- `packages/domain-server/src/schedule/repositories/IScheduleTaskRepository.ts`
  - 从 ~200 行复杂接口简化为 ~60 行核心接口
  - 移除所有旧的、不存在的 DTO 类型
  - 只保留实际使用的方法

**结果**:
- ✅ 清除了 26+ 个 ScheduleTask 相关的编译错误
- ✅ 所有 Schedule 相关测试文件编译通过
- ✅ 新的仓储实现正常工作

---

### Step 2: 修复 Reminder API 客户端 ⚠️ 部分完成

**已修复**:
1. ✅ 重命名类型错误（2 处）
   - `CreateReminderGroupRequest` → `CreateReminderTemplateGroupRequest`

2. ✅ 响应类型访问错误（19 处）
   - 移除所有 `['data']` 访问
   - 响应类型映射：
     - `ReminderTemplateResponse['data']` → `ReminderTemplateClientDTO`
     - `ReminderInstanceResponse['data']` → `ReminderInstanceClientDTO`
     - `ReminderInstanceListResponse['data']` → `ReminderInstanceListResponse`
     - `ReminderStatsResponse['data']` → `ReminderStatsResponse`
     - `UpcomingRemindersResponse['data']` → `UpcomingRemindersResponse`

**剩余问题** (需要更大重构):
- ⚠️ 4 个未实现的 API 方法（Instance 相关）:
  - `createReminderInstance`
  - `getReminderInstances`
  - `respondToReminder`
  - `batchProcessInstances`

**建议处理方式**:
这些方法涉及 "ReminderInstance" 功能，需要：
1. 检查后端 API 是否实现了这些端点
2. 如果实现了，在 ReminderApiClient 中添加方法
3. 如果没实现，注释掉前端调用或标记为 TODO
4. **不要创建 mock 或占位符**（遵循项目原则）

---

## 📊 错误统计

| 阶段 | 预计减少 | 实际减少 | 剩余错误 |
|------|---------|---------|---------|
| 初始 | - | - | ~680 |
| Step 1 | -26 | **-26** ✅ | ~654 |
| Step 2 | -30 | **-21** ⚠️ | ~633 |

**说明**: Step 2 还有 4 个方法不存在的错误需要处理（需要后端配合）

---

## 🎯 下一步

### Step 3: 修复 Assets 配置 (预计 -10 错误)

修复 tsconfig.json 中的 baseUrl 问题：
- `packages/assets/tsconfig.json`
- `packages/utils/tsconfig.json`

添加 `"baseUrl": "."` 到 compilerOptions

---

## 💡 经验总结

### 成功的清理模式

1. **删除旧代码，不保留兼容层** ✅
   - 直接删除旧的 ScheduleTask.ts
   - 不创建适配器或别名

2. **简化接口，只保留核心方法** ✅
   - IScheduleTaskRepository 从 ~200 行简化到 ~60 行
   - 移除所有未使用的复杂方法

3. **响应类型扁平化** ✅
   - 移除 `['data']` 包装
   - 直接返回 DTO 对象

### 需要注意的问题

1. **未实现的方法**
   - 不要创建空方法或 mock
   - 直接注释或删除调用
   - 标记为 TODO，等后端实现

2. **跨模块依赖**
   - Reminder Instance 功能可能依赖后端 API
   - 需要协调前后端开发

---

**创建时间**: 2025-10-07  
**Step 1 状态**: ✅ 完成  
**Step 2 状态**: ⚠️ 部分完成（21/25 错误已修复）  
**总进度**: ~47 个错误已清除

