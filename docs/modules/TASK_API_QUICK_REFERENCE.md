# Task 模块 API 调用快速参考 🚀

## ✅ 正确的调用方式

### 1. 获取所有任务模板（含实例）

```typescript
// ✅ 正确
GET /api/v1/tasks/templates

// Response
{
  "code": "OK",
  "data": {
    "data": [
      {
        "uuid": "template-1",
        "title": "每日锻炼",
        "instances": [  // ✅ 包含所有实例
          {
            "uuid": "instance-1",
            "title": "今日锻炼",
            "execution": { "status": "pending" }
          }
        ]
      }
    ]
  }
}
```

### 2. 前端 Store 设计

```typescript
// Pinia/Vuex Store
export const useTaskStore = defineStore('task', {
  state: () => ({
    templates: [] as TaskTemplateDTO[],  // 聚合根数据
  }),
  
  getters: {
    // 自动扁平化所有实例
    instances: (state) => 
      state.templates.flatMap(t => t.instances || []),
    
    // 按 templateUuid 过滤
    getInstancesByTemplate: (state) => (templateUuid: string) =>
      state.templates
        .find(t => t.uuid === templateUuid)
        ?.instances || [],
  },
  
  actions: {
    async fetchTemplates() {
      const response = await api.get('/api/v1/tasks/templates');
      this.templates = response.data.data;
      // instances getter 自动更新 ✅
    },
  },
});
```

### 3. 组件中使用

```vue
<script setup lang="ts">
import { useTaskStore } from '@/stores/task';
import { computed } from 'vue';

const taskStore = useTaskStore();

// 获取所有实例（扁平化）
const allInstances = computed(() => taskStore.instances);

// 按模板过滤
const currentTemplateInstances = computed(() => 
  taskStore.getInstancesByTemplate(selectedTemplateId.value)
);

// 待办任务
const pendingTasks = computed(() =>
  taskStore.instances.filter(i => i.execution.status === 'pending')
);
</script>

<template>
  <div>
    <!-- 展示所有待办任务 -->
    <TaskList :tasks="pendingTasks" />
    
    <!-- 按模板分组展示 -->
    <TemplateGroup 
      v-for="template in taskStore.templates"
      :key="template.uuid"
      :template="template"
      :instances="template.instances"
    />
  </div>
</template>
```

---

## ❌ 错误的调用方式（已废弃）

```typescript
// ❌ 不再支持：独立的 instances API
GET /api/v1/tasks/instances?templateUuid=xxx

// 返回：404 Not Found
```

---

## 🔄 数据流转

```
Backend (DDD聚合根)
    ↓
Template {
  uuid,
  title,
  instances: [
    { uuid, title, status },
    { uuid, title, status }
  ]
}
    ↓
Frontend Store
    ├── templates: Template[]    (聚合视图)
    └── instances: Instance[]    (扁平视图 - computed getter)
    ↓
UI Components
```

---

## 📝 API 端点总结

| 端点 | 方法 | 说明 | 返回 instances |
|-----|------|------|--------------|
| `/api/v1/tasks/templates` | GET | 获取所有模板 | ✅ |
| `/api/v1/tasks/templates/:id` | GET | 获取单个模板 | ✅ |
| `/api/v1/tasks/templates/instances` | POST | 创建实例 | - |
| `/api/v1/tasks/templates/instances/:id` | PUT | 更新实例 | - |
| `/api/v1/tasks/templates/instances/:id/complete` | POST | 完成任务 | - |

---

## 💡 最佳实践

### 1. 数据获取
```typescript
// ✅ 一次请求获取完整数据
await taskStore.fetchTemplates();

// ❌ 避免多次请求
await taskStore.fetchTemplates();
await taskStore.fetchInstances();  // 不需要！
```

### 2. 数据过滤
```typescript
// ✅ 前端过滤（已有数据）
const filtered = instances.value.filter(i => i.templateUuid === templateId);

// ❌ 后端过滤（额外请求）
const filtered = await api.get(`/instances?templateUuid=${templateId}`);
```

### 3. 状态管理
```typescript
// ✅ 单一数据源
const templates = ref([]);  // 唯一存储
const instances = computed(() => templates.value.flatMap(t => t.instances));

// ❌ 重复数据源（同步问题）
const templates = ref([]);
const instances = ref([]);  // 可能不一致！
```

---

查看完整文档：`docs/modules/TASK_DDD_AGGREGATE_ROOT_REFACTORING.md`
