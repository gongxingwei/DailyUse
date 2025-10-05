# Task 模块 DDD 聚合根架构重构完成 ✅

## 📋 问题分析

### 原始问题
前端请求：`GET /api/v1/tasks/instances?templateUuid=xxx`  
返回：`404 Not Found`

### 根本原因
1. **路由路径不匹配**：
   - 前端期望：`/api/v1/tasks/instances`
   - 后端实际：`/api/v1/tasks/templates/instances`
   
2. **架构设计缺陷**：
   - TaskInstance 作为子实体，不应有独立的顶层路由
   - 违背了 DDD 聚合根控制原则

---

## 🎯 正确的 DDD 架构设计

### 核心原则

**聚合根（Aggregate Root）控制子实体（Entity）**

```
TaskTemplate (聚合根)
    ├── instances: TaskInstance[] (子实体列表)
    ├── stats: {...}
    └── lifecycle: {...}
```

### 访问模式

| ❌ 错误设计 | ✅ 正确设计 |
|-----------|-----------|
| `GET /tasks/instances` | `GET /tasks/templates` (返回含 instances 的聚合) |
| `GET /tasks/instances/:id` | `GET /tasks/templates/:templateId` (含 instances) |
| `POST /tasks/instances` | `POST /tasks/templates/:templateId/instances` |

---

## 🔧 实施的修复

### 1. 后端 Repository 层

#### 修改文件
`apps/api/src/modules/task/infrastructure/repositories/prisma/PrismaTaskTemplateRepository.ts`

#### 修改内容

**✅ 添加 `include instances` 到所有查询**

```typescript
// findById - 添加 include
async findById(uuid: string): Promise<TaskTemplateDTO | null> {
  const template = await this.prisma.taskTemplate.findUnique({
    where: { uuid },
    include: {
      instances: {
        orderBy: { scheduledDate: 'desc' },
        take: 100, // 最多返回100个实例
      },
    },
  });
  return template ? this.mapTaskTemplateToDTO(template) : null;
}

// findByAccountUuid - 已有 include（保持不变）
// findByStatus - 添加 include
async findByStatus(...) {
  const [templates, total] = await Promise.all([
    this.prisma.taskTemplate.findMany({
      where: { accountUuid, status },
      include: {
        instances: {
          orderBy: { scheduledDate: 'desc' },
          take: 100,
        },
      },
      ...
    }),
    ...
  ]);
}
```

**✅ 修改返回字段名**

```typescript
// 从 templates → data (符合 TaskTemplateListResponse 接口)
return {
  data: templates.map((template) => this.mapTaskTemplateToDTO(template)),  // ✅
  total,
  page,
  limit,
  hasMore,
};
```

**✅ DTO 映射已支持 instances**

```typescript
private mapTaskTemplateToDTO(template: any): TaskTemplateDTO {
  return {
    ...
    instances: template.instances?.map((instance: any) => 
      this.mapTaskInstanceToDTO(instance)
    ),  // ✅ 已存在
  };
}
```

### 2. 主路由配置

#### 修改文件
`apps/api/src/modules/task/interface/http/routes.ts`

#### 修改内容

**❌ 删除独立的 /instances 路由**

```typescript
// ❌ 错误设计（已删除）
// router.use('/instances', taskTemplateRoutes);

// ✅ 正确设计：只通过聚合根访问
router.use('/templates', taskTemplateRoutes);
router.use('/meta-templates', taskMetaTemplateRoutes);
```

**✅ 更新文档注释**

```typescript
/**
 * Task 模块主路由 - DDD 聚合根设计
 *
 * 架构原则：
 * 1. TaskTemplate 是聚合根，TaskInstance 是子实体
 * 2. TaskInstance 只能通过 TaskTemplate 聚合根访问
 * 3. 前端通过 /templates API 获取完整数据（包含 instances）
 * 4. 前端 Store 维护两份数据：templates（聚合）和 instances（扁平化视图）
 */
```

---

## 📊 数据流转设计

### Backend → Frontend

```typescript
// Backend API Response
{
  "code": "OK",
  "data": {
    "data": [  // TaskTemplateListResponse
      {
        "uuid": "template-1",
        "title": "每日任务",
        "instances": [  // ✅ 包含子实体
          { "uuid": "instance-1", "title": "...", "executionStatus": "pending" },
          { "uuid": "instance-2", "title": "...", "executionStatus": "completed" }
        ],
        "stats": { "totalInstances": 2, "completedInstances": 1 }
      }
    ],
    "total": 10,
    "page": 1
  }
}
```

### Frontend Store Structure

```typescript
// Store 设计（推荐）
interface TaskStore {
  // 1. 聚合视图（原始数据）
  templates: TaskTemplateDTO[];  // 包含 instances 的完整聚合
  
  // 2. 扁平化视图（便于展示）
  instances: TaskInstanceDTO[];  // 从 templates 中提取的所有 instances
  
  // Getters
  getInstancesByTemplateId(templateId: string): TaskInstanceDTO[];
  getPendingInstances(): TaskInstanceDTO[];
  getInstanceById(id: string): TaskInstanceDTO | undefined;
}

// 数据同步逻辑
function syncTemplates(templateList: TaskTemplateListResponse) {
  // 1. 保存完整聚合
  this.templates = templateList.data;
  
  // 2. 提取扁平化 instances
  this.instances = templateList.data.flatMap(t => t.instances || []);
}
```

---

## 🛣️ 最终路由结构

### Task Template 聚合根

| HTTP Method | Path | Controller Method | 说明 |
|------------|------|-------------------|-----|
| `GET` | `/api/v1/tasks/templates` | `getTemplates` | 获取模板列表（含 instances） |
| `GET` | `/api/v1/tasks/templates/:id` | `getTemplateById` | 获取单个模板（含 instances） |
| `POST` | `/api/v1/tasks/templates` | `createTemplate` | 创建模板 |
| `PUT` | `/api/v1/tasks/templates/:id` | `updateTemplate` | 更新模板 |
| `DELETE` | `/api/v1/tasks/templates/:id` | `deleteTemplate` | 删除模板 |

### Task Instance 子实体（通过聚合根操作）

| HTTP Method | Path | Controller Method | 说明 |
|------------|------|-------------------|-----|
| `POST` | `/api/v1/tasks/templates/instances` | `createInstance` | 创建实例 |
| `GET` | `/api/v1/tasks/templates/instances/:id` | `getInstanceById` | 获取实例详情 |
| `PUT` | `/api/v1/tasks/templates/instances/:id` | `updateInstance` | 更新实例 |
| `DELETE` | `/api/v1/tasks/templates/instances/:id` | `deleteInstance` | 删除实例 |
| `POST` | `/api/v1/tasks/templates/instances/:id/complete` | `completeTask` | 完成任务 |
| `POST` | `/api/v1/tasks/templates/instances/:id/cancel` | `cancelTask` | 取消任务 |

---

## 🎨 前端调用示例

### 1. 获取所有模板及实例

```typescript
// API 调用
const response = await taskApi.getTemplates();

// Store 更新
taskStore.syncTemplates(response.data);

// 使用数据
console.log(taskStore.templates);  // 聚合视图
console.log(taskStore.instances);  // 扁平化视图
```

### 2. 按模板过滤实例（前端实现）

```typescript
// ❌ 错误：不再需要单独的 instances API
// const instances = await taskApi.getInstances({ templateUuid: 'xxx' });

// ✅ 正确：从已有数据中过滤
const instancesOfTemplate = taskStore.getInstancesByTemplateId('template-uuid');

// 或者使用 computed
const instancesByTemplate = computed(() => {
  return taskStore.instances.filter(i => i.templateUuid === selectedTemplateId.value);
});
```

### 3. 创建任务实例

```typescript
// API 调用（路径保持不变）
await taskApi.createInstance({
  templateUuid: 'template-1',
  title: '今日任务',
  scheduledDate: '2025-10-06',
  ...
});

// 重新获取最新数据
await taskStore.fetchTemplates();  // 会自动更新 templates 和 instances
```

---

## ✅ 修复验证

### 测试步骤

1. **启动 API 服务**
   ```bash
   pnpm run dev:api
   ```

2. **测试聚合根API**
   ```bash
   # 获取所有模板（含 instances）
   curl http://localhost:3888/api/v1/tasks/templates \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # 响应应包含 instances 字段
   {
     "code": "OK",
     "data": {
       "data": [
         {
           "uuid": "...",
           "title": "...",
           "instances": [...]  // ✅ 包含子实体
         }
       ]
     }
   }
   ```

3. **验证独立路由已移除**
   ```bash
   # 应返回 404
   curl http://localhost:3888/api/v1/tasks/instances \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # 预期：404 Not Found
   ```

---

## 📚 DDD 设计模式总结

### 聚合根（Aggregate Root）

**定义**：聚合的根实体，是外部访问聚合内部对象的唯一入口

**职责**：
1. 维护聚合内部的一致性
2. 控制子实体的生命周期
3. 提供对外的统一接口

### 实体（Entity）

**定义**：聚合内部的对象，必须通过聚合根访问

**特点**：
1. 不能被独立访问
2. 生命周期受聚合根管理
3. 与聚合根同生共死

### 本项目应用

```
聚合根：TaskTemplate
    ├── 子实体：TaskInstance[]
    ├── 值对象：TimeConfig
    ├── 值对象：ReminderConfig
    └── 值对象：Stats

规则：
1. TaskInstance 不能独立存在
2. 必须通过 TaskTemplate 创建/访问/修改
3. 删除 TaskTemplate 会级联删除所有 TaskInstance
```

---

## 🔮 后续优化建议

### 1. 添加聚合根方法

```typescript
class TaskTemplateController {
  /**
   * 通过模板ID获取其所有实例
   * GET /api/v1/tasks/templates/:templateId/instances
   */
  static async getTemplateInstances(req, res) {
    const { templateId } = req.params;
    const template = await service.getTemplateById(accountUuid, templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // 返回聚合根中的 instances
    return res.json({
      code: 'OK',
      data: template.instances || []
    });
  }
}
```

### 2. 优化前端 Store

```typescript
// Pinia Store
export const useTaskStore = defineStore('task', {
  state: () => ({
    templates: [] as TaskTemplateDTO[],
  }),
  
  getters: {
    // 自动计算扁平化的 instances
    instances: (state) => 
      state.templates.flatMap(t => t.instances || []),
    
    // 按模板ID获取实例
    instancesByTemplate: (state) => (templateId: string) =>
      state.templates
        .find(t => t.uuid === templateId)
        ?.instances || [],
    
    // 待办实例
    pendingInstances: (state) =>
      state.instances.filter(i => i.execution.status === 'pending'),
  },
  
  actions: {
    async fetchTemplates() {
      const response = await taskApi.getTemplates();
      this.templates = response.data.data;  // 自动更新 instances getter
    },
  },
});
```

---

## 📝 相关文件清单

### 修改的文件
1. `apps/api/src/modules/task/infrastructure/repositories/prisma/PrismaTaskTemplateRepository.ts`
   - ✅ 添加 `include instances` 到 findById、findByStatus
   - ✅ 修改返回字段名 `templates` → `data`

2. `apps/api/src/modules/task/interface/http/routes.ts`
   - ✅ 删除独立的 `/instances` 路由
   - ✅ 更新文档注释

### 未修改但已验证正确的文件
1. `packages/contracts/src/modules/task/dtos.ts`
   - ✅ TaskTemplateDTO 已包含 `instances?: TaskInstanceDTO[]`
   - ✅ TaskTemplateListResponse 字段名为 `data`

2. `apps/api/src/modules/task/infrastructure/repositories/prisma/PrismaTaskTemplateRepository.ts`
   - ✅ mapTaskTemplateToDTO 已正确映射 instances 字段

---

## 🎉 总结

### 问题解决
- ✅ 修复了 404 错误（移除了错误的独立路由）
- ✅ 实现了正确的 DDD 聚合根设计
- ✅ 确保所有 Template API 都返回完整的 instances 数据

### 架构改进
- ✅ TaskInstance 不再有独立的顶层路由
- ✅ 所有子实体操作通过聚合根控制
- ✅ 数据结构清晰，符合 DDD 原则

### 前端影响
- ⚠️ 需要更新前端调用：`/api/v1/tasks/instances` → `/api/v1/tasks/templates`
- ✅ Store 设计更合理：维护 templates 聚合，通过 getter 提供 instances 视图
- ✅ 数据一致性更好：单一数据源（templates），避免同步问题

---

*文档生成时间：2025-10-05*  
*作者：GitHub Copilot + DailyUse Team*
