# 项目错误清理计划

## 📊 错误统计（总计 ~680 个）

### 错误分类

| 类别 | 数量 | 严重程度 | 优先级 |
|------|------|---------|--------|
| **domain-server ScheduleTask** | ~26 | 🔴 高 | P0 |
| **Reminder API 客户端** | ~30 | 🟡 中 | P1 |
| **Assets 包配置** | ~10 | 🟡 中 | P1 |
| **其他模块错误** | ~614 | 🟢 低 | P2 |

---

## 🎯 修复策略

### 阶段 1: 高优先级错误（P0）

#### 1.1 删除旧的 domain-server/ScheduleTask.ts

**文件**: `packages/domain-server/src/schedule/aggregates/ScheduleTask.ts`

**问题**:
- 尝试扩展 domain-core 的 ScheduleTask（不可扩展）
- 使用已删除的旧接口（IScheduleTask 等）
- 访问不存在的私有属性（_basic、_scheduling 等）

**解决方案**: 
❌ **删除整个文件** - 这是旧架构的代码，已被新的 domain-core/ScheduleTask 替代

**影响范围**:
- `ScheduleTask.test.ts` - 也需要删除
- `IScheduleTaskRepository.ts` - 需要更新导入
- `ScheduleDomainService.ts` - 需要更新导入
- `PrismaScheduleTaskRepository.ts` - 需要更新导入

**操作步骤**:
1. 备份文件（如果需要参考）
2. 删除 `ScheduleTask.ts`
3. 删除 `ScheduleTask.test.ts`
4. 更新所有依赖文件的导入，从 `@dailyuse/domain-core` 导入

---

### 阶段 2: 中优先级错误（P1）

#### 2.1 修复 Reminder API 客户端类型错误

**文件**:
- `apps/web/src/modules/reminder/application/services/ReminderWebApplicationService.ts`
- `apps/web/src/modules/reminder/presentation/composables/useReminder.ts`

**问题**:
1. `['data']` 属性不存在 - 响应类型已改变
2. `CreateReminderGroupRequest` 不存在 - 应为 `CreateReminderTemplateGroupRequest`
3. API 客户端方法缺失 - `createReminderInstance`、`getReminderInstances` 等

**错误示例**:
```typescript
// ❌ 错误
Promise<ReminderContracts.ReminderTemplateResponse['data']>
CreateReminderGroupRequest

// ✅ 正确
Promise<ReminderContracts.ReminderTemplateClientDTO>
CreateReminderTemplateGroupRequest
```

**解决方案**:
- 移除所有 `['data']` 访问
- 重命名 `CreateReminderGroupRequest` → `CreateReminderTemplateGroupRequest`
- 检查 ReminderApiClient 的方法定义

---

#### 2.2 修复 Assets 包配置

**文件**:
- `packages/assets/tsconfig.json`
- `packages/utils/tsconfig.json`

**问题**: `Non-relative paths are not allowed when 'baseUrl' is not set`

**解决方案**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",  // 添加这一行
    // ...
  }
}
```

**影响**:
- `apps/web/src/components/AssetsDemo.vue`
- `apps/web/src/modules/notification/infrastructure/services/AudioNotificationService.ts`

---

### 阶段 3: 低优先级错误（P2）

**策略**: 在完成 P0 和 P1 后，重新运行编译，获取最新的错误列表再决定

---

## 🚀 执行顺序

### Step 1: 清理 domain-server/ScheduleTask ⚡

1. **删除文件**:
   ```bash
   rm packages/domain-server/src/schedule/aggregates/ScheduleTask.ts
   rm packages/domain-server/src/schedule/aggregates/ScheduleTask.test.ts
   ```

2. **更新导入** - 在以下文件中：
   - `IScheduleTaskRepository.ts`
   - `ScheduleDomainService.ts`  
   - `PrismaScheduleTaskRepository.ts`
   
   修改:
   ```typescript
   // ❌ 旧
   import { ScheduleTask } from '../aggregates/ScheduleTask';
   
   // ✅ 新
   import { ScheduleTask } from '@dailyuse/domain-core';
   ```

3. **验证**: 运行 `npx tsc --noEmit` 检查错误减少

---

### Step 2: 修复 Reminder API 客户端 🔧

1. **批量替换** `['data']`:
   - ReminderWebApplicationService.ts
   - useReminder.ts

2. **重命名类型**:
   ```typescript
   CreateReminderGroupRequest → CreateReminderTemplateGroupRequest
   ```

3. **检查 API 客户端**: 确保方法存在或添加 stub

---

### Step 3: 修复 Assets 配置 ⚙️

1. 添加 `baseUrl: "."` 到 tsconfig.json
2. 验证导入可以解析

---

### Step 4: 完整验证 ✅

```bash
# 编译检查
npx tsc --noEmit

# 运行测试
pnpm test

# 构建项目
nx build api
nx build web
```

---

## 📈 预期结果

| 阶段 | 预期错误减少 | 剩余错误 |
|------|-------------|---------|
| 初始 | 0 | ~680 |
| Step 1 | -26 | ~654 |
| Step 2 | -30 | ~624 |
| Step 3 | -10 | ~614 |
| Step 4 | 待定 | < 600 |

---

## ⚠️ 注意事项

### 不要创建向后兼容层

- ❌ 不要保留旧的 ScheduleTask 作为"适配器"
- ❌ 不要创建类型别名来"兼容"旧代码
- ✅ **直接替换**所有引用
- ✅ **彻底删除**旧代码

### 测试优先

在每个步骤后：
1. 运行编译检查
2. 运行相关测试
3. 记录剩余错误
4. 继续下一步

---

## 📝 进度跟踪

- [ ] Step 1: domain-server/ScheduleTask 清理
- [ ] Step 2: Reminder API 客户端修复
- [ ] Step 3: Assets 配置修复
- [ ] Step 4: 完整验证
- [ ] 最终报告

---

**创建日期**: 2025-10-07  
**目标**: 将项目错误从 ~680 降至 < 100  
**预计时间**: 1-2 小时

