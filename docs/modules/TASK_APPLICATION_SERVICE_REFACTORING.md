# Task 模块 Application 层架构重构总结

## 📋 重构概述

将 Task 模块的 Application Service 层重构为符合 DDD 原则的架构，参考 Goal 模块的成熟实现，实现**聚合根驱动**的设计模式。

## 🎯 重构目标

- ✅ 只保留两个聚合根的 Application Service（TaskTemplate 和 TaskMetaTemplate）
- ✅ 所有子实体（TaskInstance）的操作必须通过聚合根（TaskTemplate）来控制
- ✅ 将领域逻辑从 Application 层移动到 Domain Service 层
- ✅ 与 Goal 模块保持一致的架构模式

## 📊 架构对比

### 重构前（错误的架构）
```
Application Layer:
├── TaskTemplateApplicationService.ts
├── TaskInstanceApplicationService.ts      ❌ 独立的子实体服务（违反DDD）
├── TaskAggregateService.ts
└── TaskApplicationService.ts              ❌ 混杂的服务

Domain Layer:
└── TaskDomainService.ts                   ❌ 混合了所有业务逻辑
```

### 重构后（正确的DDD架构）
```
Application Layer:
├── TaskTemplateApplicationService.ts      ✅ TaskTemplate 聚合根服务
└── TaskMetaTemplateApplicationService.ts  ✅ TaskMetaTemplate 聚合根服务

Domain Layer:
├── TaskTemplateDomainService.ts           ✅ TaskTemplate 领域逻辑
└── TaskMetaTemplateDomainService.ts       ✅ TaskMetaTemplate 领域逻辑
```

## 🏗️ 新架构详解

### 1. **TaskTemplateApplicationService**（主聚合根）

**职责**：
- 管理 TaskTemplate 聚合根的生命周期
- **通过聚合根控制** TaskInstance 子实体
- 协调跨聚合根的操作

**核心方法**：

```typescript
// ===== TaskTemplate 聚合根管理 =====
createTemplate()           // 创建任务模板
getTemplates()             // 获取模板列表
getTemplateById()          // 获取模板详情
updateTemplate()           // 更新模板
deleteTemplate()           // 删除模板
activateTemplate()         // 激活模板
pauseTemplate()            // 暂停模板
completeTemplate()         // 完成模板
archiveTemplate()          // 归档模板

// ===== DDD 聚合根控制 - TaskInstance 子实体 =====
createInstance()           // ✅ 通过聚合根创建实例
updateInstance()           // ✅ 通过聚合根更新实例
deleteInstance()           // ✅ 通过聚合根删除实例
getTemplateInstances()     // ✅ 获取模板的所有实例
completeInstance()         // ✅ 通过聚合根完成实例
cancelInstance()           // ✅ 通过聚合根取消实例
rescheduleInstance()       // ✅ 通过聚合根重新调度实例

// ===== 聚合根完整视图 =====
getTemplateAggregateView() // 获取完整聚合视图（含所有子实体）
getTemplateStats()         // 获取统计信息
generateScheduledInstances() // 批量生成实例
```

**DDD 原则体现**：
- ✅ TaskInstance 不能独立创建，必须通过 TaskTemplate
- ✅ 所有子实体操作都以 `xxxForTemplate` 命名，强调聚合根控制
- ✅ 完整的聚合视图展示聚合根及其子实体

### 2. **TaskMetaTemplateApplicationService**（独立聚合根）

**职责**：
- 管理 TaskMetaTemplate 聚合根（任务模板的预设配置）
- 提供元模板的分类、收藏、统计功能
- 支持基于元模板创建任务模板

**核心方法**：

```typescript
// ===== TaskMetaTemplate 聚合根管理 =====
createMetaTemplate()        // 创建元模板
getMetaTemplates()          // 获取元模板列表
getMetaTemplateById()       // 获取元模板详情
updateMetaTemplate()        // 更新元模板
deleteMetaTemplate()        // 删除元模板
activateMetaTemplate()      // 激活元模板
deactivateMetaTemplate()    // 停用元模板
toggleFavorite()            // 切换收藏状态

// ===== 基于元模板创建任务模板 =====
createTemplateFromMetaTemplate() // 使用元模板创建任务模板

// ===== 查询和统计 =====
getMetaTemplatesByCategory()     // 按分类查询
getFavoriteMetaTemplates()       // 获取收藏的元模板
getPopularMetaTemplates()        // 获取热门元模板
getRecentlyUsedMetaTemplates()   // 获取最近使用的元模板
```

## 📁 文件结构

### 新增文件

```bash
apps/api/src/modules/task/
├── application/
│   └── services/
│       ├── TaskTemplateApplicationService.new.ts       ✅ 新建
│       └── TaskMetaTemplateApplicationService.new.ts   ✅ 新建
└── domain/
    └── services/
        ├── TaskTemplateDomainService.ts                ✅ 新建（从 TaskDomainService 复制）
        └── TaskMetaTemplateDomainService.ts            ✅ 新建
```

### 待删除文件（下一步）

```bash
apps/api/src/modules/task/application/services/
├── TaskInstanceApplicationService.ts      ❌ 删除（违反DDD，子实体不应有独立服务）
├── TaskAggregateService.ts                ❌ 删除（职责混乱）
├── TaskApplicationService.new.ts          ❌ 删除（临时文件）
└── TaskApplicationService.simple.ts       ❌ 删除（临时文件）
```

## 🔍 与 Goal 模块的架构一致性

| 模块 | 主聚合根 Service | 辅助聚合根 Service | 子实体控制 |
|------|------------------|-------------------|------------|
| **Goal** | GoalApplicationService | GoalDirApplicationService | KeyResult, GoalRecord 通过 Goal 控制 ✅ |
| **Task** | TaskTemplateApplicationService | TaskMetaTemplateApplicationService | TaskInstance 通过 TaskTemplate 控制 ✅ |

## 💡 核心设计原则

### 1. **聚合根控制原则**

❌ **错误做法**（旧架构）:
```typescript
// 直接操作子实体 - 违反DDD
const instanceService = new TaskInstanceApplicationService();
instanceService.createInstance(accountUuid, request);
```

✅ **正确做法**（新架构）:
```typescript
// 通过聚合根操作子实体 - 符合DDD
const templateService = new TaskTemplateApplicationService();
templateService.createInstance(accountUuid, templateUuid, request);
```

### 2. **职责分层原则**

```
┌─────────────────────────────────────────┐
│   Application Service                    │
│   - 注入 Repository                      │
│   - 协调领域服务                         │
│   - 处理跨聚合根操作                     │
└──────────────┬──────────────────────────┘
               │ 委托
┌──────────────▼──────────────────────────┐
│   Domain Service                         │
│   - 核心业务逻辑                         │
│   - 验证业务规则                         │
│   - 管理聚合根生命周期                   │
└──────────────┬──────────────────────────┘
               │ 使用
┌──────────────▼──────────────────────────┐
│   Repository Interface                   │
│   - 数据持久化                           │
│   - 查询数据                             │
└─────────────────────────────────────────┘
```

### 3. **命名约定原则**

- **聚合根方法**: `createTemplate()`, `updateTemplate()`
- **子实体方法**: `createInstanceForTemplate()`, `updateInstanceForTemplate()`
- **领域服务**: `TaskTemplateDomainService`, `TaskMetaTemplateDomainService`
- **应用服务**: `TaskTemplateApplicationService`, `TaskMetaTemplateApplicationService`

## 🚀 下一步工作

### 待完成任务

1. **删除旧的 Application Service 文件**
   ```bash
   rm TaskInstanceApplicationService.ts
   rm TaskAggregateService.ts
   rm TaskApplicationService.new.ts
   rm TaskApplicationService.simple.ts
   ```

2. **重命名新文件**
   ```bash
   mv TaskTemplateApplicationService.new.ts → TaskTemplateApplicationService.ts
   mv TaskMetaTemplateApplicationService.new.ts → TaskMetaTemplateApplicationService.ts
   ```

3. **更新 Controller 层**
   - 修改 TaskController 使用新的 Application Service
   - 更新路由绑定
   - 调整方法调用

4. **更新 DI 容器**
   - `TaskContainer.ts`: 注入新的 Application Service
   - 移除旧服务的依赖

5. **更新测试**
   - 更新单元测试以匹配新的服务结构
   - 添加聚合根控制的集成测试

## ✅ 重构验证清单

- ✅ **TaskTemplateDomainService.ts** - 零编译错误
- ✅ **TaskMetaTemplateDomainService.ts** - 零编译错误
- ✅ **TaskTemplateApplicationService.new.ts** - 创建完成（待重命名）
- ✅ **TaskMetaTemplateApplicationService.new.ts** - 创建完成（待重命名）
- ⏳ Controller 层更新 - 待完成
- ⏳ DI 容器更新 - 待完成
- ⏳ 旧文件删除 - 待完成
- ⏳ 测试更新 - 待完成

## 📝 关键收益

1. **符合DDD原则** - 聚合根边界清晰，子实体受控
2. **架构一致性** - 与 Goal 模块保持一致的架构
3. **可维护性提升** - 职责清晰，易于理解和维护
4. **业务规则集中** - 领域逻辑集中在 Domain Service
5. **可测试性增强** - 清晰的分层便于单元测试和集成测试

## 🎯 架构原则总结

```
核心原则：
1. 聚合根是事务边界
2. 子实体不能独立存在
3. 所有子实体操作必须通过聚合根
4. 应用层协调，领域层实现
5. 通过仓储接口解耦基础设施

TaskTemplate (聚合根)
  └── TaskInstance (子实体) ✅ 通过 TaskTemplate 控制

TaskMetaTemplate (独立聚合根)
  └── 无子实体 ✅ 独立管理
```

---

**重构日期**: 2025-10-03  
**影响范围**: apps/api/src/modules/task  
**编译状态**: ✅ 新服务全部通过  
**下一步**: 更新 Controller 和 DI 容器
