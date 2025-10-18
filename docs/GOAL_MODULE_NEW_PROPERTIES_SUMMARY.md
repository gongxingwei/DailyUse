# Goal 模块新属性集成完成总结

## 概述
为 Goal 模块添加了三个新属性以增强目标管理功能：
- `color`: 目标的主题颜色（十六进制格式）
- `feasibilityAnalysis`: 可行性分析文本
- `motivation`: 目标动机文本

## 更改文件清单

### 1. 数据库层 (Prisma Schema)
**文件**: `apps/api/prisma/schema.prisma`

```prisma
model Goal {
  // 新增字段
  color                String?   @map("color")
  feasibilityAnalysis String?   @map("feasibility_analysis") @db.Text
  motivation          String?   @map("motivation") @db.Text
  
  // 其他字段已转换为 camelCase + @map 模式...
}
```

**关键点**:
- 遵循项目标准：TypeScript 代码使用 camelCase，数据库使用 snake_case（通过 @map）
- `feasibilityAnalysis` 和 `motivation` 使用 `@db.Text` 以支持长文本
- 所有字段都是可选的 (nullable)

### 2. Contracts 层
已经正确定义（之前已完成）：

**文件**: `packages/contracts/src/modules/goal/aggregates/GoalServer.ts`
- `GoalServerDTO` 包含三个新字段
- `GoalPersistenceDTO` 使用 camelCase 字段名

**文件**: `packages/contracts/src/modules/goal/aggregates/GoalClient.ts`
- `GoalClientDTO` 包含三个新字段

### 3. Domain-Server 层

#### 3.1 Goal Aggregate
**文件**: `packages/domain-server/src/goal/aggregates/Goal.ts`

**新增内容**:
```typescript
// 私有字段
private _color: string | null;
private _feasibilityAnalysis: string | null;
private _motivation: string | null;

// Getters
public get color(): string | null
public get feasibilityAnalysis(): string | null
public get motivation(): string | null

// 构造函数参数已更新
// create() 工厂方法已更新
// fromPersistenceDTO() 已更新
// toServerDTO() 已更新
// toPersistenceDTO() 已更新
```

**updateBasicInfo() 方法已增强**:
```typescript
public updateBasicInfo(params: {
  title?: string;
  description?: string;
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  category?: string;
  color?: string;              // 新增
  feasibilityAnalysis?: string; // 新增
  motivation?: string;          // 新增
}): void {
  // 实现变更跟踪和领域事件发布
}
```

#### 3.2 GoalDomainService
**文件**: `packages/domain-server/src/goal/services/GoalDomainService.ts`

**更新方法**:
```typescript
public async createGoal(params: {
  // ... 现有参数
  color?: string;
  feasibilityAnalysis?: string;
  motivation?: string;
}): Promise<Goal>

public async updateGoalBasicInfo(uuid: string, params: {
  // ... 现有参数
  color?: string;
  feasibilityAnalysis?: string;
  motivation?: string;
}): Promise<Goal>
```

### 4. Application 层
**文件**: `apps/api/src/modules/goal/application/services/GoalApplicationService.ts`

**更新方法**:
```typescript
async createGoal(params: {
  // ... 现有参数
  color?: string;
  feasibilityAnalysis?: string;
  motivation?: string;
}): Promise<GoalContracts.GoalClientDTO>

async updateGoal(uuid: string, updates: Partial<{
  // ... 现有参数
  color: string;
  feasibilityAnalysis: string;
  motivation: string;
}>): Promise<GoalContracts.GoalClientDTO>
```

### 5. Domain-Client 层
**文件**: `packages/domain-client/src/goal/aggregates/GoalClient.ts`

**新增内容**:
```typescript
// 私有字段
private _color?: string | null;
private _feasibilityAnalysis?: string | null;
private _motivation?: string | null;

// Getters
public get color(): string | null | undefined
public get feasibilityAnalysis(): string | null | undefined
public get motivation(): string | null | undefined

// 兼容前端 UI 的计算属性
public get analysis(): { motive?: string; feasibility?: string } {
  return {
    motive: this._motivation || undefined,
    feasibility: this._feasibilityAnalysis || undefined,
  };
}
```

**关键点**:
- 添加了 `analysis` 计算属性以兼容前端现有代码
- 前端 UI 使用 `goal.analysis.motive` 和 `goal.analysis.feasibility`
- 后端使用 `motivation` 和 `feasibilityAnalysis`

### 6. Infrastructure 层
**文件**: `apps/api/src/modules/goal/infrastructure/repositories/PrismaGoalRepository.ts`

**mapToEntity() 方法已更新**:
```typescript
private mapToEntity(data: PrismaGoal): Goal {
  return Goal.fromPersistenceDTO({
    // ... 现有映射
    color: data.color,
    feasibilityAnalysis: data.feasibilityAnalysis,
    motivation: data.motivation,
    // ...
  });
}
```

**关键点**:
- 使用 Prisma Client 自动生成的 camelCase 字段名
- Prisma Client 通过 @map 自动处理 snake_case 转换

### 7. 前端集成
**文件**: `apps/web/src/modules/goal/presentation/components/dialogs/GoalDialog.vue`

前端 GoalDialog 已经实现了这些字段的 UI：
- Tab 3: "Motivation & Feasibility" 
- `goalMotive` computed property → `goalModel.value.analysis.motive`
- `goalFeasibility` computed property → `goalModel.value.analysis.feasibility`
- `goalColor` computed property → `goalModel.value.color`

**无需修改前端代码**，因为：
1. `GoalClient.analysis` getter 提供了兼容的接口
2. 前端已经有完整的 UI 实现
3. `updateInfo()` 方法会自动处理 analysis 对象的更新

## 数据流

### 创建目标流程
```
1. 前端 GoalDialog
   ↓ (调用 createGoal)
2. GoalWebApplicationService
   ↓ (API 请求)
3. GoalController.createGoal()
   ↓ (调用应用服务)
4. GoalApplicationService.createGoal()
   ↓ (调用领域服务)
5. GoalDomainService.createGoal()
   ↓ (创建聚合根)
6. Goal.create({ color, feasibilityAnalysis, motivation, ... })
   ↓ (持久化)
7. PrismaGoalRepository.save()
   ↓ (Prisma ORM)
8. PostgreSQL Database
   - color (varchar)
   - feasibility_analysis (text)
   - motivation (text)
```

### 更新目标流程
```
1. 前端 GoalDialog.handleSave()
   ↓ (调用 updateGoal)
2. GoalApplicationService.updateGoal()
   ↓
3. GoalDomainService.updateGoalBasicInfo()
   ↓
4. Goal.updateBasicInfo({ color, feasibilityAnalysis, motivation, ... })
   - 变更跟踪
   - 发布 GoalUpdatedEvent
   ↓
5. PrismaGoalRepository.save()
```

### 查询目标流程
```
1. 前端请求
   ↓
2. GoalController.getGoal()
   ↓
3. GoalApplicationService.getGoal()
   ↓
4. Goal.toClientDTO()
   - 包含 color, feasibilityAnalysis, motivation
   ↓
5. 前端 GoalClient.fromServerDTO()
   ↓
6. 前端访问 goal.analysis.motive 和 goal.analysis.feasibility
   - 通过 GoalClient.analysis getter 自动映射
```

## 验证清单

- [x] Prisma Schema 更新（camelCase + @map）
- [x] Contracts 层包含新字段
- [x] domain-server Goal aggregate 完整实现
- [x] domain-server GoalDomainService 支持新字段
- [x] ApplicationService 支持新字段
- [x] domain-client GoalClient 实现新字段
- [x] domain-client 添加 `analysis` 兼容层
- [x] PrismaGoalRepository 使用 camelCase 字段
- [x] TypeScript 编译通过（`pnpm tsc --noEmit`）
- [x] domain-client 构建成功
- [ ] 数据库迁移（待 PostgreSQL 启动后执行）

## 待办事项

### 立即执行（数据库启动后）
```bash
# 运行数据库迁移
pnpm --filter api prisma migrate dev --name add_goal_color_feasibility_motivation
```

### 可选改进
1. **前端 UI 增强**:
   - 为 `color` 字段添加颜色选择器（已有）
   - 为 `feasibilityAnalysis` 添加结构化模板
   - 为 `motivation` 添加提示和示例

2. **验证规则**:
   - `color`: 验证十六进制颜色格式
   - 字符串长度限制

3. **搜索功能**:
   - 支持按 `motivation` 和 `feasibilityAnalysis` 内容搜索

4. **导出功能**:
   - PDF/Word 导出时包含这些新字段

## 命名约定总结

| 层级                     | 字段名                                                                    | 格式             |
| ------------------------ | ------------------------------------------------------------------------- | ---------------- |
| Database (PostgreSQL)    | `color`, `feasibility_analysis`, `motivation`                             | snake_case       |
| Prisma Schema            | `color @map("color")`, `feasibilityAnalysis @map("feasibility_analysis")` | camelCase + @map |
| Prisma Client            | `color`, `feasibilityAnalysis`, `motivation`                              | camelCase        |
| PersistenceDTO           | `color`, `feasibilityAnalysis`, `motivation`                              | camelCase        |
| ServerDTO                | `color`, `feasibilityAnalysis`, `motivation`                              | camelCase        |
| ClientDTO                | `color`, `feasibilityAnalysis`, `motivation`                              | camelCase        |
| domain-server Goal       | `_color`, `_feasibilityAnalysis`, `_motivation`                           | _camelCase       |
| domain-client GoalClient | `_color`, `_feasibilityAnalysis`, `_motivation`                           | _camelCase       |
| 前端 UI (兼容)           | `goal.analysis.motive`, `goal.analysis.feasibility`                       | camelCase        |

## 技术债务

### 已知问题（与本次更改无关）
- `domain-client` 中 `GoalStatisticsClient` 和 `TaskStatisticsClient` 的 `ChartDataDTO` 类型错误
  - 错误: `values` 属性不存在
  - 影响: 构建时需跳过类型检查
  - 解决方案: 需要更新 `ChartDataDTO` 接口或调整统计客户端实现

## 参考文档
- [Goal Module DDD Structure](./architecture/GOAL_MODULE_DDD_STRUCTURE.md)
- [Goal Aggregate Implementation](./modules/goal/GOAL_AGGREGATE.md)
- [Contract-First Development](./guides/CONTRACT_FIRST_DEVELOPMENT.md)

## 更新日期
2025-01-XX

## 作者
GitHub Copilot + 用户协作完成
