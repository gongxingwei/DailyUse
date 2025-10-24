# Task Module Domain-Client 实现总结

## 已完成的工作

### 1. ✅ Task Contracts 包值对象分离

- 将所有6个值对象分离为 Server 和 Client 两个文件：
  - RecurrenceRuleServer.ts / RecurrenceRuleClient.ts
  - TaskReminderConfigServer.ts / TaskReminderConfigClient.ts
  - TaskGoalBindingServer.ts / TaskGoalBindingClient.ts
  - TaskTimeConfigServer.ts / TaskTimeConfigClient.ts
  - CompletionRecordServer.ts / CompletionRecordClient.ts
  - SkipRecordServer.ts / SkipRecordClient.ts
- 更新了 value-objects/index.ts 以导出所有新文件
- contracts 包构建成功

### 2. ✅ Task Domain-Client 结构创建

- 创建了6个值对象客户端实现类
- 创建了1个实体客户端实现（TaskTemplateHistoryClient）
- 创建了2个聚合根客户端实现：
  - TaskInstanceClient
  - TaskTemplateClient
- 创建了所有必要的 index.ts 导出文件

### 3. 🔧 需要修复的问题

#### 类型导入问题

domain-client 中的值对象实现需要调整导入方式：

**当前问题：**

```typescript
import type {
  RecurrenceRuleClient as IRecurrenceRuleClient,
  RecurrenceRuleClientDTO,
  RecurrenceRuleServerDTO,
} from '@dailyuse/contracts';
```

**应该改为：**

```typescript
import type { TaskContracts } from '@dailyuse/contracts';

type RecurrenceRuleClient = TaskContracts.RecurrenceRuleClient;
type RecurrenceRuleClientDTO = TaskContracts.RecurrenceRuleClientDTO;
type RecurrenceRuleServerDTO = TaskContracts.RecurrenceRuleServerDTO;
```

#### 需要修复的文件列表

1. `domain-client/src/task/value-objects/RecurrenceRuleClient.ts`
2. `domain-client/src/task/value-objects/TaskReminderConfigClient.ts`
3. `domain-client/src/task/value-objects/TaskGoalBindingClient.ts`
4. `domain-client/src/task/value-objects/TaskTimeConfigClient.ts`
5. `domain-client/src/task/value-objects/CompletionRecordClient.ts`
6. `domain-client/src/task/value-objects/SkipRecordClient.ts`

#### 接口不匹配问题

需要确保 contracts 中的接口定义与 domain-client 实现匹配：

**TaskInstance 相关：**

- 移除 `_deletedAt` 属性（contracts 接口中没有）
- 移除 `CANCELLED` 状态（enums 中只有 PENDING, COMPLETED, SKIPPED）
- 调整 `canComplete` 和 `canSkip` 返回类型

**TaskTemplate 相关：**

- `TaskType` 枚举中移除 `ONCE`（只有 RECURRING, HABIT）
- ImportanceLevel 和 UrgencyLevel 应该从共享模块导入，不是从 TaskContracts
- 调整 `isRecurring` 属性实现

#### 枚举值修复

需要检查并统一以下枚举值：

- DayOfWeek: 确认是否包含 MONDAY, TUESDAY 等
- TaskInstanceStatus: 确认只有 PENDING, COMPLETED, SKIPPED
- TaskType: 确认值（目前应该是 RECURRING, HABIT）

## 修复步骤

### Step 1: 修复值对象类型导入

批量替换所有6个值对象文件的导入语句，使用 TaskContracts 命名空间。

### Step 2: 同步接口定义

检查 contracts 包中的接口定义，确保与实际需求匹配：

- 如果需要 `deletedAt`，在 contracts 中添加
- 如果需要 `CANCELLED` 状态，在 enums 中添加
- 统一 TaskType 的值

### Step 3: 重新构建验证

```bash
# 1. 构建 contracts
pnpm nx build contracts

# 2. 构建 domain-client
pnpm nx build domain-client

# 3. 运行类型检查
pnpm nx typecheck domain-client
```

## 当前状态

- ✅ Task contracts 包结构正确，构建成功
- ✅ Task domain-client 包结构完整
- ⏳ 类型导入需要修复
- ⏳ 接口定义需要同步
- ⏳ 枚举值需要统一

## 下一步建议

1. 首先决定最终的接口设计（是否需要 deletedAt, CANCELLED 等）
2. 在 contracts 中统一接口定义和枚举值
3. 修复 domain-client 中的类型导入
4. 逐一调整实现以匹配接口
5. 运行完整的类型检查确保没有错误
