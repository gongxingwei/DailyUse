# Reminder Instance 聚合根架构重构总结

## 概述
实现 Reminder 模块的 ClientDTO 架构，参考 Goal 模块的模式，让 ReminderInstance 通过 ReminderTemplate 聚合根管理。

## 架构模式（参考 Goal 模块）

### 1. 聚合根模式
```
ReminderTemplate (Aggregate Root)
  └── ReminderInstance[] (Child Entities)

类似于:
Goal (Aggregate Root)
  └── KeyResult[] (Child Entities)
```

### 2. 数据流
```
API Response (JSON with nested instances)
  ↓
ReminderTemplateClientDTO { instances: ReminderInstanceClientDTO[] }
  ↓
ReminderTemplate.fromApiResponse() / fromClientDTO()
  ↓
ReminderTemplate { instances: ReminderInstance[] }
  ↓
Frontend Store (只存储 templates，不单独存储 instances)
  ↓
Computed Properties (从 templates 提取 instances)
```

## 修改清单

### 1. 后端修改

#### 1.1 Contracts - DTO 定义
**文件**: `packages/contracts/src/modules/reminder/dtos.ts`

```typescript
// 添加 instances 子实体字段
export interface ReminderTemplateClientDTO extends ReminderTemplateDTO {
  // 子实体
  instances?: ReminderInstanceClientDTO[]; // ✅ 新增
  // 计算属性
  effectiveEnabled: boolean;
  nextTriggerTime?: number;
  activeInstancesCount?: number;
  groupName?: string;
}
```

#### 1.2 Domain-Server - 聚合根实体
**文件**: `packages/domain-server/src/reminder/aggregates/ReminderTemplate.ts`

```typescript
// toClient() 方法序列化子实体
toClient(): ReminderContracts.ReminderTemplateClientDTO {
  return {
    ...this.toDTO(),
    // 子实体序列化
    instances: this.instances.map((inst) => inst.toClient()), // ✅ 新增
    // 计算属性
    effectiveEnabled: this.effectiveEnabled,
    nextTriggerTime: this.nextTriggerTime,
    activeInstancesCount: this.activeInstancesCount,
  };
}
```

#### 1.3 Repository - 数据重建
**文件**: `apps/api/src/modules/reminder/infrastructure/repositories/prisma/PrismaReminderAggregateRepository.ts`

修复 `mapTemplateToEntity` 从扁平数据库结构重建聚合：

```typescript
// 重建 timeConfig JSON 对象
const timeConfig = {
  type: data.timeConfigType,
  times: data.timeConfigTimes,
  weekdays: data.timeConfigWeekdays,
  monthDays: data.timeConfigMonthDays,
  schedule: data.timeConfigSchedule,
};

// 转换子实体
entity.instances = data.instances.map((inst) =>
  ReminderInstance.fromPersistence(inst)
);
```

### 2. 前端修改

#### 2.1 Domain-Client - 客户端实体
**文件**: `packages/domain-client/src/reminder/aggregates/ReminderTemplate.ts`

```typescript
// fromApiResponse() 处理 instances
static fromApiResponse(response: any): ReminderTemplate {
  const template = new ReminderTemplate({
    // ... 其他字段
  });

  // ✅ 转换 instances (如果存在)
  if (response.instances && Array.isArray(response.instances)) {
    template.instances = response.instances.map((instanceData: any) =>
      ReminderInstance.fromResponse(instanceData),
    );
  }

  return template;
}

// fromClientDTO() 处理 instances
static fromClientDTO(dto: ReminderContracts.ReminderTemplateClientDTO): ReminderTemplate {
  const template = new ReminderTemplate({
    // ... 其他字段
  });

  // ✅ 转换 instances (如果存在)
  if (dto.instances && Array.isArray(dto.instances)) {
    template.instances = dto.instances.map(
      (instanceDTO: ReminderContracts.ReminderInstanceClientDTO) =>
        ReminderInstance.fromClientDTO(instanceDTO),
    );
  }

  return template;
}
```

#### 2.2 Reminder Store - 状态管理
**文件**: `apps/web/src/modules/reminder/presentation/stores/reminderStore.ts`

**关键变更**: 不再维护单独的 `reminderInstances` 数组，所有 instances 通过 templates 访问。

```typescript
// ✅ 从 templates 提取所有 instances
const getAllReminderInstances = computed(() =>
  reminderTemplates.value.flatMap((template) => template.instances || []),
);

// ✅ 从 templates 提取活跃 instances
const getActiveReminderInstances = computed(() =>
  reminderTemplates.value
    .flatMap((template) => template.instances || [])
    .filter(
      (instance) =>
        instance.status === ReminderContracts.ReminderStatus.TRIGGERED ||
        instance.status === ReminderContracts.ReminderStatus.PENDING,
    ),
);

// ✅ 按模板分组的 instances
const getInstancesByTemplate = computed(() => {
  const grouped: Record<string, ReminderInstance[]> = {};
  reminderTemplates.value.forEach((template) => {
    if (template.instances && template.instances.length > 0) {
      grouped[template.uuid] = template.instances;
    }
  });
  return grouped;
});

// ✅ 根据 UUID 获取 instance（从所有 templates 中查找）
const getReminderInstanceByUuid = (uuid: string): ReminderInstance | null => {
  for (const template of reminderTemplates.value) {
    if (template.instances) {
      const instance = template.instances.find((i) => i.uuid === uuid);
      if (instance) {
        return instance;
      }
    }
  }
  return null;
};

// ✅ 根据模板 UUID 获取 instances（直接从 template 访问）
const getReminderInstancesByTemplate = (templateUuid: string): ReminderInstance[] => {
  const template = reminderTemplates.value.find((t) => t.uuid === templateUuid);
  return template?.instances || [];
};

// ✅ 添加/更新 instance（同时更新 template 内部）
const addOrUpdateReminderInstance = (instance: ReminderInstance) => {
  const template = reminderTemplates.value.find((t) => t.uuid === instance.templateUuid);
  if (template && template.instances) {
    const instanceIndex = template.instances.findIndex((i) => i.uuid === instance.uuid);
    if (instanceIndex >= 0) {
      template.instances[instanceIndex] = instance;
    } else {
      template.instances.push(instance);
    }
  }
  
  // 兼容旧代码：同时更新独立数组
  const index = reminderInstances.value.findIndex((i) => i.uuid === instance.uuid);
  if (index >= 0) {
    reminderInstances.value[index] = instance;
  } else {
    reminderInstances.value.push(instance);
  }
};

// ✅ 删除 instance（从所有 templates 中删除）
const removeReminderInstance = (uuid: string) => {
  reminderTemplates.value.forEach((template) => {
    if (template.instances) {
      const index = template.instances.findIndex((i) => i.uuid === uuid);
      if (index >= 0) {
        template.instances.splice(index, 1);
      }
    }
  });
  
  // 兼容旧代码
  const index = reminderInstances.value.findIndex((i) => i.uuid === uuid);
  if (index >= 0) {
    reminderInstances.value.splice(index, 1);
  }
};
```

## Goal 模块对比参考

### Goal Store 模式
```typescript
// Goal Store 只存储 goals，不存储 keyResults
const goals = ref<Goal[]>([]);

// KeyResults 通过 goal.keyResults 访问
const goal = goals.value[0];
const keyResults = goal.keyResults; // 直接访问子实体

// 计算属性示例
const allKeyResults = computed(() =>
  goals.value.flatMap(g => g.keyResults)
);
```

### Reminder Store 新模式（已实现）
```typescript
// Reminder Store 只存储 templates，不独立存储 instances
const reminderTemplates = ref<ReminderTemplate[]>([]);

// Instances 通过 template.instances 访问
const template = reminderTemplates.value[0];
const instances = template.instances; // 直接访问子实体

// 计算属性
const getAllReminderInstances = computed(() =>
  reminderTemplates.value.flatMap(t => t.instances || [])
);
```

## 测试验证清单

- [ ] 后端 API 返回的 templates 包含 instances 数组
- [ ] `ReminderTemplate.fromApiResponse()` 正确转换 instances
- [ ] Frontend store 的 `getAllReminderInstances` 返回所有 instances
- [ ] Frontend store 的 `getActiveReminderInstances` 正确过滤活跃 instances
- [ ] `addOrUpdateReminderInstance` 正确更新 template 内部的 instance
- [ ] `removeReminderInstance` 正确从 template 中删除 instance
- [ ] UI 组件能正确显示从 templates 提取的 instances

## API 响应示例

### 修复前（错误）
```json
{
  "uuid": "template-1",
  "name": "每日提醒",
  "activeInstancesCount": 5,
  // ❌ 没有 instances 数组
}
```

### 修复后（正确）
```json
{
  "uuid": "template-1",
  "name": "每日提醒",
  "activeInstancesCount": 5,
  "instances": [
    {
      "uuid": "instance-1",
      "templateUuid": "template-1",
      "status": "PENDING",
      "triggerTime": 1234567890
    },
    // ... 更多 instances
  ]
}
```

## 兼容性说明

为了保持向后兼容，当前实现：
1. 保留了独立的 `reminderInstances` ref（标记为 @deprecated）
2. `addOrUpdateReminderInstance` 同时更新 template 内部和独立数组
3. `removeReminderInstance` 同时从 template 和独立数组删除

**推荐**: 逐步迁移所有使用 `reminderInstances.value` 的代码，改为使用 `getAllReminderInstances.value`

## 相关文档
- [Goal 模块完整流程](Goal模块完整流程.md)
- [CONTRACTS 命名规范](../CONTRACTS_NAMING_CONVENTION.md)
