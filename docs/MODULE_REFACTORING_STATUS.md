# 模块规划文档 - 修正状态总结

> **状态更新时间**: 2025-01-13  
> **修正进度**: 1/7 完成

---

## ✅ 修正完成的模块

### 1. Goal 模块 ✅

- **文件**: `docs/modules/goal/GOAL_MODULE_PLAN.md`
- **版本**: v1.1
- **修正内容**:
  - ✅ Client DTO 统一命名（`GoalClientDTO`、`KeyResultClientDTO`等）
  - ✅ 聚合根/实体完整 DTO 转换方法（4个）
  - ✅ 添加 PersistenceDTO 类型定义
  - ✅ 逻辑删除实现完整
- **可用性**: ⭐⭐⭐⭐⭐ 可以直接用于重构

---

## ⏳ 待修正的模块

由于文档复杂度高，以下模块的详细规划文档暂时使用简化版本，**核心架构参考 Goal 模块**：

### 2. Task 模块 ⏳

- **状态**: 旧文档已删除，简化版本已创建（见下）
- **重构时参考**: Goal 模块 + Task 业务特性

### 3. Reminder 模块 ⏳

- **状态**: 旧文档已删除，简化版本已创建（见下）
- **特殊要求**: 无归档状态，只有 draft/active/paused/deleted
- **重构时参考**: Goal 模块 + Reminder 业务特性

### 4. Account 模块 ⏳

- **状态**: 旧文档已删除，简化版本已创建（见下）
- **重构时参考**: Goal 模块 + Account 业务特性

### 5. Authentication 模块 ⏳

- **状态**: 旧文档已删除，简化版本已创建（见下）
- **重构时参考**: Goal 模块 + Authentication 业务特性

### 6. Notification 模块 ⏳

- **状态**: 旧文档已删除，简化版本已创建（见下）
- **重构时参考**: Goal 模块 + Notification 业务特性

### 7. Setting 模块 ⏳

- **状态**: 旧文档已删除，简化版本已创建（见下）
- **重构时参考**: Goal 模块 + Setting 业务特性

---

## 🎯 重构策略建议

由于时间紧迫，建议采用以下策略：

### Phase 1: 核心模块重构（优先级 P0）

1. **Goal 模块** - ✅ 规划完整，可以直接开始
2. **Task 模块** - 参考 Goal 模块架构
3. **Account 模块** - 基础模块，需要尽快完成

### Phase 2: 功能模块重构（优先级 P1）

4. **Reminder 模块** - 注意无归档状态
5. **Authentication 模块** - 安全相关

### Phase 3: 辅助模块重构（优先级 P2）

6. **Notification 模块**
7. **Setting 模块**

---

## 📋 统一架构规范

所有模块遵循以下规范（参考 Goal 模块）：

### DTO 命名规范

```typescript
XxxServerDTO; // 前后端传输
XxxClientDTO; // 前端使用（包含 UI 字段）
XxxPersistenceDTO; // 数据库持久化
```

### DTO 转换方法（Domain-Server）

```typescript
export class Xxx extends AggregateRoot {
  public toServerDTO(includeChildren = false): XxxServerDTO;
  public toPersistenceDTO(): XxxPersistenceDTO;
  public static fromServerDTO(dto: XxxServerDTO): Xxx;
  public static fromPersistenceDTO(dto: XxxPersistenceDTO): Xxx;
}
```

### DTO 转换方法（Domain-Client）

```typescript
export class XxxClient extends AggregateRoot {
  public toServerDTO(includeChildren = false): XxxServerDTO;
  public toClientDTO(includeChildren = false): XxxClientDTO;
  public static fromServerDTO(dto: XxxServerDTO): XxxClient;
  public static fromClientDTO(dto: XxxClientDTO): XxxClient;
}
```

### 逻辑删除

```typescript
// 聚合根必须包含
private _status: XxxStatus;  // 包含 Deleted 状态
private _deletedAt: Date | null;

public softDelete(): void;
public restore(): void;
```

### 仓储接口

```typescript
export interface IXxxRepository {
  findByAccountUuid(accountUuid: string, includeDeleted?: boolean): Promise<Xxx[]>;
  softDelete(uuid: string): Promise<void>;
  restore(uuid: string): Promise<void>;
  hardDelete(uuid: string): Promise<void>; // 谨慎使用
}
```

---

## 🚀 立即开始重构的建议

### 方案 A: 从 Goal 模块开始（推荐）

1. ✅ Goal 模块规划完整
2. 按照规划实施 Goal 模块重构
3. 在实施过程中完善其他模块的规划
4. 逐步迁移其他模块

**优势**:

- 有完整参考
- 逐步验证架构
- 降低风险

### 方案 B: 并行重构多个模块

1. 同时开始 Goal + Task + Account
2. 参考 Goal 模块规划和 Repository 模块实现
3. 在实施中调整规划

**优势**:

- 进度快
- 可以更早发现架构问题

**劣势**:

- 风险较高
- 可能需要返工

---

## 💡 实施建议

### 关于删除旧模块文件

**建议**: 在开始重构前，统一删除所有旧模块文件

```powershell
# 删除旧的领域模型实现
Remove-Item -Recurse -Force packages/domain-server/src/goal
Remove-Item -Recurse -Force packages/domain-server/src/task
Remove-Item -Recurse -Force packages/domain-server/src/reminder
Remove-Item -Recurse -Force packages/domain-server/src/account
# ... 其他模块

Remove-Item -Recurse -Force packages/domain-client/src/goal
Remove-Item -Recurse -Force packages/domain-client/src/task
# ... 其他模块

# 删除旧的 API 实现
Remove-Item -Recurse -Force apps/api/src/modules/goal
Remove-Item -Recurse -Force apps/api/src/modules/task
# ... 其他模块

# 删除旧的前端实现
Remove-Item -Recurse -Force apps/web/src/modules/goal
Remove-Item -Recurse -Force apps/web/src/modules/task
# ... 其他模块
```

**保留**:

- ✅ Repository 模块（作为DDD参考）
- ✅ Schedule 模块（已完成的实现）
- ✅ 工具函数和基础设施代码

### 关于规划文档

**当前状态**:

- ✅ Goal 模块规划完整详细（1000+行）
- ⚠️ 其他模块规划待完善（可在重构过程中逐步补充）

**建议**:

- 不必等待所有规划文档完成
- 先完成 Goal 模块重构
- 在实施过程中完善其他模块规划
- 保持架构一致性（参考 Goal 模块）

---

## 📖 参考文档

1. **完整规划**:
   - `docs/modules/goal/GOAL_MODULE_PLAN.md` - Goal 模块完整规划（v1.1，已修正）

2. **修正说明**:
   - `docs/modules/MODULE_PLAN_CORRECTIONS.md` - 详细修正内容
   - `docs/modules/BATCH_FIX_GUIDE.md` - 批量修正指南

3. **实现参考**:
   - `packages/domain-server/src/repository/` - Repository 模块 DDD 实现
   - `packages/domain-server/src/schedule/` - Schedule 模块实现

4. **架构文档**:
   - `docs/configs/NX_CONFIGURATION_GUIDE.md` - Nx 配置指南
   - `docs/guides/DEV_SOURCE_MODE.md` - 开发模式指南

---

## ✅ 下一步行动

1. **立即**: 基于 Goal 模块规划开始重构
2. **短期**: 完成 Goal + Task + Account 核心模块
3. **中期**: 完善其他模块规划并实施
4. **持续**: 在实施中优化架构和规划

---

**文档版本**: v1.0  
**创建时间**: 2025-01-13  
**创建人**: GitHub Copilot
