# 🏗️ DailyUse 前端架构规范

## 🎯 核心原则

### 1. Domain 层代码必须放在独立包中

**规则**：

- ❌ **禁止**在 `apps/web/src/modules/*/domain/` 创建领域代码
- ✅ **必须**将领域代码放入：
  - `packages/domain-client/` (客户端领域模型)
  - `packages/domain-server/` (服务端领域模型)

**原因**：

- 领域模型需要在前端和后端共享
- 确保业务逻辑的一致性
- 便于跨应用复用（Web、Desktop）
- 类型定义和业务规则的单一来源

**正确示例**：

```typescript
// ✅ 正确：领域实体在 domain-client 包中
// packages/domain-client/src/goal/aggregates/GoalClient.ts
export class GoalClient extends AggregateRoot {
  // 领域模型定义
}

// ✅ 正确：前端应用导入
// apps/web/src/modules/goal/application/services/GoalService.ts
import { GoalClient } from '@dailyuse/domain-client';
```

**错误示例**：

```typescript
// ❌ 错误：不要在应用中创建领域代码
// apps/web/src/modules/goal/domain/entities/Goal.ts ❌
export class Goal {
  // 这应该在 packages/domain-client/ 中！
}
```

**临时例外**（仅限以下场景）：

- `domain/templates/` - 模板数据（非核心领域逻辑）
- `domain/constants/` - UI 特定常量
- 迁移期间的过渡代码（需要添加 TODO 注释标记迁移计划）

---

### 2. Monorepo 依赖管理规范

**规则**：

- ✅ **所有 Node.js 依赖必须在根目录的 `package.json` 中声明**
- ✅ **应用和包只能使用根目录安装的依赖**
- ❌ **禁止在子包的 `package.json` 中添加新依赖**

**原因**：

- 确保版本一致性（避免多个版本冲突）
- 减少 `node_modules` 大小（PNPM workspace 共享）
- 统一依赖管理和升级
- 避免构建和运行时错误

**正确操作流程**：

```bash
# ✅ 正确：在根目录添加依赖
cd /path/to/DailyUse
pnpm add html2canvas jspdf -w

# ✅ 正确：为特定包添加开发依赖
pnpm add -D vitest --filter @dailyuse/domain-client
```

**错误操作**：

```bash
# ❌ 错误：不要在子目录直接安装
cd apps/web
pnpm add axios  # ❌ 应该在根目录执行！
```

**package.json 配置规范**：

```json
// ✅ 根目录 package.json
{
  "dependencies": {
    "vue": "^3.4.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}

// ✅ 子包 package.json (只声明 workspace 依赖)
{
  "name": "@dailyuse/web",
  "dependencies": {
    "@dailyuse/domain-client": "workspace:*",
    "@dailyuse/ui": "workspace:*"
    // 外部依赖从根目录继承，不需要重复声明
  }
}
```

---

## 📂 目录结构规范

### 模块分层架构 (Clean Architecture)

每个功能模块应遵循以下分层结构：

```
src/modules/{module-name}/
├── application/           # 应用层（用例、应用服务）
│   ├── services/         # 应用服务（业务流程编排）
│   │   └── *.Service.ts
│   └── use-cases/        # 用例（单一职责的业务操作）
│       └── *.UseCase.ts
│
├── domain/               # 领域层（实体、值对象、领域服务）
│   ├── entities/         # 领域实体
│   │   └── *.entity.ts
│   ├── value-objects/    # 值对象
│   │   └── *.vo.ts
│   └── services/         # 领域服务（纯业务逻辑）
│       └── *DomainService.ts
│
├── infrastructure/       # 基础设施层（API、存储、第三方集成）
│   ├── api/             # API 客户端
│   │   └── *Api.ts
│   ├── repositories/    # 仓储实现
│   │   └── *Repository.ts
│   └── adapters/        # 适配器（外部服务）
│       └── *Adapter.ts
│
└── presentation/        # 表现层（UI 组件、视图模型）
    ├── components/      # UI 组件
    │   ├── {feature}/   # 功能组件目录
    │   │   ├── *.vue
    │   │   └── *.spec.ts
    │   └── shared/      # 共享组件
    ├── composables/     # Vue Composables（视图逻辑）
    │   └── use*.ts
    ├── stores/          # Pinia 状态管理
    │   └── *.store.ts
    └── views/           # 页面视图
        └── *.vue
```

---

## 📋 各层职责说明

### 1. **Application 层** - 应用服务

**职责**：

- 编排多个领域服务完成业务流程
- 处理跨模块的业务逻辑
- 事务管理
- 外部服务集成的业务包装

**示例**：

```typescript
// ✅ 正确：应用服务放在 application/services/
// apps/web/src/modules/goal/application/services/DAGExportService.ts

export class DAGExportService {
  async exportPNG(chart: ECharts, options: ExportOptions): Promise<Blob> {
    // 编排导出流程：获取数据 → 渲染 → 转换格式 → 返回
  }
}
```

**反例**：

```typescript
// ❌ 错误：不要放在 services/ 根目录
// apps/web/src/modules/goal/services/DAGExportService.ts ❌
```

---

### 2. **Domain 层** - 领域服务

**职责**：

- 纯业务逻辑，不依赖外部服务
- 领域规则验证
- 复杂的业务计算

**示例**：

```typescript
// ✅ 正确：领域服务
// apps/web/src/modules/goal/domain/services/WeightCalculationService.ts

export class WeightCalculationService {
  calculateTotalWeight(keyResults: KeyResult[]): number {
    return keyResults.reduce((sum, kr) => sum + kr.weight, 0);
  }

  validateWeightDistribution(weights: number[]): boolean {
    const total = weights.reduce((a, b) => a + b, 0);
    return total === 100;
  }
}
```

---

### 3. **Infrastructure 层** - 外部依赖

**职责**：

- HTTP API 调用
- 数据持久化
- 第三方服务集成（支付、AI、消息队列）

**示例**：

```typescript
// ✅ 正确：API 客户端
// apps/web/src/modules/goal/infrastructure/api/GoalApi.ts

export class GoalApi {
  async fetchGoal(id: string): Promise<Goal> {
    const response = await axios.get(`/api/goals/${id}`);
    return response.data;
  }
}
```

---

### 4. **Presentation 层** - UI 组件

**职责**：

- 渲染 UI
- 用户交互处理
- 表单验证（UI 层面）
- 调用 Application 层服务

**示例**：

```vue
<!-- ✅ 正确：组件调用应用服务 -->
<!-- apps/web/src/modules/goal/presentation/components/dag/GoalDAGVisualization.vue -->

<script setup lang="ts">
import { dagExportService } from '../../../application/services/DAGExportService';

async function handleExport() {
  const blob = await dagExportService.exportPNG(chart, options);
  // UI 逻辑
}
</script>
```

---

## 🔄 依赖方向规则

**从外到内**：单向依赖，禁止反向依赖

```
Presentation → Application → Domain
      ↓              ↓
Infrastructure  (可以依赖所有层)
```

**禁止**：

- ❌ Domain 层依赖 Application 层
- ❌ Domain 层依赖 Infrastructure 层
- ❌ Application 层依赖 Presentation 层

---

## 📝 命名约定

### 服务类命名

| 层级           | 命名规则                          | 示例                                         |
| -------------- | --------------------------------- | -------------------------------------------- |
| Application    | `*Service`                        | `DAGExportService`, `GoalCreationService`    |
| Domain         | `*DomainService`                  | `WeightCalculationDomainService`             |
| Infrastructure | `*Api`, `*Repository`, `*Adapter` | `GoalApi`, `GoalRepository`, `OpenAIAdapter` |

### 文件路径示例

```typescript
// ✅ 正确示例
application / services / DAGExportService.ts;
application / use - cases / CreateGoalUseCase.ts;
domain / services / WeightCalculationDomainService.ts;
domain / entities / Goal.entity.ts;
infrastructure / api / GoalApi.ts;
infrastructure / repositories / GoalRepository.ts;
presentation / components / dag / GoalDAGVisualization.vue;
presentation / composables / useGoal.ts;

// ❌ 错误示例
services / DAGExportService.ts; // ❌ 层级不明确
utils / goalUtils.ts; // ❌ 应该按层级分类
helpers / exportHelper.ts; // ❌ 职责不清晰
```

---

## 🎯 应用服务 vs 领域服务区分

### Application Service（应用服务）

**特征**：

- 编排多个领域服务
- 调用外部服务（API、数据库）
- 处理事务
- 依赖 Infrastructure 层

**示例场景**：

```typescript
// ✅ 应用服务：编排导出流程
class DAGExportService {
  constructor(
    private chartRenderer: ChartRenderer, // Infrastructure
    private fileStorage: FileStorage, // Infrastructure
    private notificationService: NotificationService, // Infrastructure
  ) {}

  async exportAndNotify(goalId: string) {
    // 1. 获取数据
    const goal = await this.goalApi.fetch(goalId);

    // 2. 渲染图表
    const blob = await this.chartRenderer.render(goal);

    // 3. 上传存储
    const url = await this.fileStorage.upload(blob);

    // 4. 发送通知
    await this.notificationService.notify(`导出完成: ${url}`);
  }
}
```

### Domain Service（领域服务）

**特征**：

- 纯函数，无外部依赖
- 核心业务逻辑
- 可在任何环境运行（前端、后端、测试）

**示例场景**：

```typescript
// ✅ 领域服务：纯业务逻辑
class WeightAllocationDomainService {
  calculateBalancedWeights(count: number): number[] {
    const baseWeight = Math.floor(100 / count);
    const remainder = 100 - baseWeight * count;

    return Array(count)
      .fill(baseWeight)
      .map((w, i) => (i === 0 ? w + remainder : w));
  }

  validateWeights(weights: number[]): ValidationResult {
    const total = weights.reduce((a, b) => a + b, 0);
    if (total !== 100) {
      return { valid: false, error: '权重总和必须为 100%' };
    }
    return { valid: true };
  }
}
```

---

## 📊 实际案例对比

### ❌ 错误架构（违反规范）

```
src/modules/goal/
├── services/                    # ❌ 层级不明确
│   ├── DAGExportService.ts     # ❌ 应该在 application/
│   ├── goalApi.ts              # ❌ 应该在 infrastructure/
│   └── weightUtils.ts          # ❌ 应该在 domain/
├── components/                  # ❌ 缺少 presentation/ 包裹
│   └── GoalForm.vue
└── utils/                       # ❌ 混杂工具函数
    └── helpers.ts
```

### ✅ 正确架构（符合规范）

```
src/modules/goal/
├── application/
│   └── services/
│       └── DAGExportService.ts      # ✅ 应用服务
├── domain/
│   └── services/
│       └── WeightCalculationDomainService.ts  # ✅ 领域服务
├── infrastructure/
│   └── api/
│       └── GoalApi.ts               # ✅ API 客户端
└── presentation/
    ├── components/
    │   └── dag/
    │       └── GoalDAGVisualization.vue  # ✅ UI 组件
    └── composables/
        └── useGoal.ts               # ✅ Composable
```

---

## 🚀 迁移指南

### 当前问题修复步骤

1. **识别错误放置的服务**：

```bash
# 查找所有 services/ 目录
find . -type d -name "services" | grep -v "application\|domain\|infrastructure"
```

2. **按职责分类**：
   - 有外部依赖（API、文件系统）→ `application/services/`
   - 纯业务逻辑 → `domain/services/`
   - 外部集成 → `infrastructure/api|repositories|adapters/`

3. **移动文件**：

```bash
# 示例：修正 DAGExportService
mv src/modules/goal/services/DAGExportService.ts \
   src/modules/goal/application/services/DAGExportService.ts
```

4. **更新所有 import 路径**

5. **删除空目录**

---

## ✅ 检查清单

提交代码前检查：

### 架构分层

- [ ] 所有应用服务都在 `application/services/`
- [ ] 所有领域服务都在 `domain/services/`
- [ ] API 客户端都在 `infrastructure/api/`
- [ ] UI 组件都在 `presentation/components/`
- [ ] 没有 `utils/`、`helpers/`、`common/` 等模糊目录
- [ ] 依赖方向正确（外层 → 内层）
- [ ] 命名遵循约定（`*Service`, `*DomainService`, `*Api`）

### Domain 层规范 ⭐

- [ ] **所有领域实体、值对象都在 `packages/domain-client/` 或 `packages/domain-server/`**
- [ ] 应用中 `apps/*/src/modules/*/domain/` 目录仅包含模板、常量等非核心代码
- [ ] 如有迁移中的代码，添加了 `// TODO: 迁移到 @dailyuse/domain-client` 注释

### 依赖管理规范 ⭐

- [ ] **所有新依赖都在根目录 `package.json` 中添加**
- [ ] 子包 `package.json` 中只有 `workspace:*` 依赖
- [ ] 使用 `pnpm add <package> -w` 添加根依赖
- [ ] 使用 `pnpm add <package> --filter <package-name>` 添加特定包的开发依赖

---

## 📚 参考资料

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)
- [Vue.js Enterprise Boilerplate](https://github.com/chrisvfritz/vue-enterprise-boilerplate)

---

## 🔄 更新日志

- **2025-10-23**: 添加核心原则规范 ⭐
  - **Domain 层必须放在独立包中** (domain-client/domain-server)
  - **Monorepo 依赖必须在根目录统一管理**
  - 更新检查清单
  - 添加临时例外说明

- **2024-10-22**: 创建初始规范
  - 定义四层架构
  - 明确各层职责
  - 提供迁移指南
  - 修正 DAGExportService 位置

---

**维护者**: Development Team  
**最后更新**: 2025-10-23  
**版本**: 1.1.0
