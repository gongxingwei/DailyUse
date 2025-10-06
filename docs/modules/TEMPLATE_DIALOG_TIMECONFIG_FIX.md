# TemplateDialog TimeConfig 修复总结

## 🐛 问题描述

### 症状
通过创建提醒模板接口（`POST /api/v1/reminders/templates`）创建模板后，返回的数据中 `timeConfig` 字段为空对象 `{}`，而不是预期的时间配置。

### 用户报告的数据
```json
{
    "uuid": "ebc70a6f-df6a-4137-8c00-e669a89c2ef1",
    "name": "11111111",
    "message": "11111111",
    "timeConfig": {},  // ❌ 应该包含 type、times 等字段
    // ... 其他字段
}
```

### 预期数据
```json
{
    "timeConfig": {
        "type": "daily",
        "times": ["09:00"]
    }
}
```

## 🔍 根本原因分析

### 问题定位
问题出在 `TemplateDialog.vue` 中 `timeConfig` 相关的 computed setter 实现上。

### 错误代码（修复前）

```typescript
const timeConfigTimes = computed({
    get: () => localReminderTemplate.value.timeConfig?.times || ['09:00'],
    set: (val: string[]) => {
        // ❌ 问题：如果 timeConfig 是 undefined，spread 会创建空对象
        const newConfig = { ...localReminderTemplate.value.timeConfig, times: val };
        localReminderTemplate.value.updateTimeConfig(newConfig as any);
    }
});
```

### 问题剖析

1. **默认值正确**：`ReminderTemplate.forCreate()` 创建的默认 `timeConfig` 是正确的：
   ```typescript
   timeConfig: {
       type: ReminderTimeConfigTypeEnum.DAILY,
       times: ['09:00'],
   }
   ```

2. **Setter 丢失字段**：当 computed setter 执行时：
   ```typescript
   const newConfig = { ...undefined, times: val };
   // 结果：{ times: ['09:00'] }  ← 缺少 type 字段！
   ```

3. **级联效应**：
   - 用户修改了任意时间配置字段（times、weekdays、monthDays 等）
   - Setter 创建了不完整的 `newConfig` 对象
   - `updateTimeConfig()` 接收到不完整的配置
   - `toDTO()` 序列化时保存了不完整的 `timeConfig`
   - 后端接收到的请求中 `timeConfig` 缺少必需字段

### 为什么会发生？

Vue 3 的 computed setter 在表单绑定时会被频繁触发。即使用户没有明确修改时间配置，以下情况也可能触发 setter：

- 表单初始化时
- v-model 双向绑定时
- 组件重新渲染时

如果此时 `localReminderTemplate.value.timeConfig` 因某种原因变成 `undefined`（比如对象重建、响应式追踪问题等），spread 操作就会失败。

## ✅ 修复方案

### 核心思路
在 spread 之前，确保有一个有效的默认配置对象，包含必需的 `type` 字段。

### 修复后的代码

```typescript
const timeConfigTimes = computed({
    get: () => localReminderTemplate.value.timeConfig?.times || ['09:00'],
    set: (val: string[]) => {
        // ✅ 修复：提供默认配置对象
        const currentConfig = localReminderTemplate.value.timeConfig || { type: 'daily' };
        const newConfig = { ...currentConfig, times: val };
        localReminderTemplate.value.updateTimeConfig(newConfig as any);
    }
});
```

### 其他相关修复

#### 1. weekdays setter
```typescript
const weekdays = computed({
    get: () => localReminderTemplate.value.timeConfig?.weekdays || [],
    set: (val: number[]) => {
        const currentConfig = localReminderTemplate.value.timeConfig || { type: 'weekly' };
        const newConfig = { ...currentConfig, weekdays: val };
        localReminderTemplate.value.updateTimeConfig(newConfig as any);
    }
});
```

#### 2. monthDays setter
```typescript
const monthDays = computed({
    get: () => localReminderTemplate.value.timeConfig?.monthDays || [],
    set: (val: number[]) => {
        const currentConfig = localReminderTemplate.value.timeConfig || { type: 'monthly' };
        const newConfig = { ...currentConfig, monthDays: val };
        localReminderTemplate.value.updateTimeConfig(newConfig as any);
    }
});
```

#### 3. customInterval setter
```typescript
const customInterval = computed({
    get: () => localReminderTemplate.value.timeConfig?.customPattern?.interval || 1,
    set: (val: number) => {
        const currentConfig = localReminderTemplate.value.timeConfig || { type: 'custom' };
        const newConfig = {
            ...currentConfig,
            customPattern: {
                ...(currentConfig.customPattern || {}),
                interval: val
            }
        };
        localReminderTemplate.value.updateTimeConfig(newConfig as any);
    }
});
```

#### 4. customUnit setter
```typescript
const customUnit = computed({
    get: () => (localReminderTemplate.value.timeConfig?.customPattern?.unit as any) || 'hours',
    set: (val: 'minutes' | 'hours' | 'days') => {
        const currentConfig = localReminderTemplate.value.timeConfig || { type: 'custom' };
        const newConfig = {
            ...currentConfig,
            customPattern: {
                ...(currentConfig.customPattern || {}),
                unit: val
            }
        };
        localReminderTemplate.value.updateTimeConfig(newConfig as any);
    }
});
```

## 📊 修复效果

### 修复前
```typescript
// 用户创建模板，没有修改任何默认配置
localReminderTemplate.timeConfig = { type: 'daily', times: ['09:00'] }

// 某个时刻 setter 被触发（可能是表单初始化）
// 如果 timeConfig 变成 undefined
const newConfig = { ...undefined, times: ['09:00'] }
// newConfig = { times: ['09:00'] }  ← 缺少 type

// 发送到后端
{
    "timeConfig": {
        "times": ["09:00"]
    }
}
// ❌ 后端验证失败或存储不完整数据
```

### 修复后
```typescript
// 用户创建模板，没有修改任何默认配置
localReminderTemplate.timeConfig = { type: 'daily', times: ['09:00'] }

// setter 被触发
const currentConfig = localReminderTemplate.value.timeConfig || { type: 'daily' };
const newConfig = { ...currentConfig, times: ['09:00'] }
// newConfig = { type: 'daily', times: ['09:00'] }  ← type 字段保留

// 发送到后端
{
    "timeConfig": {
        "type": "daily",
        "times": ["09:00"]
    }
}
// ✅ 完整的配置对象
```

## 🎯 最佳实践总结

### 1. Spread 操作的防御性编程
```typescript
// ❌ 危险：没有默认值
const newConfig = { ...obj.nested, newProp: value };

// ✅ 安全：提供默认值
const currentConfig = obj.nested || { requiredField: 'default' };
const newConfig = { ...currentConfig, newProp: value };
```

### 2. Computed Setter 的注意事项

**问题**：Computed setter 会在意外时机被触发
- Vue 响应式系统重新追踪依赖时
- v-model 初始化时
- 组件重新渲染时

**解决方案**：
- 始终提供默认值
- 确保 setter 是幂等的（多次调用结果相同）
- 避免在 setter 中做复杂的副作用操作

### 3. 嵌套对象的更新模式

```typescript
// ✅ 推荐模式
const currentOuter = obj.outer || { type: 'default' };
const currentInner = currentOuter.inner || {};
const newConfig = {
    ...currentOuter,
    inner: {
        ...currentInner,
        newProp: value
    }
};
```

### 4. 类型安全

```typescript
// 为默认配置定义类型
type TimeConfig = {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    times?: string[];
    weekdays?: number[];
    monthDays?: number[];
    customPattern?: {
        interval: number;
        unit: string;
    };
};

const DEFAULT_TIME_CONFIG: TimeConfig = { type: 'daily' };

// 使用
const currentConfig = localReminderTemplate.value.timeConfig || DEFAULT_TIME_CONFIG;
```

## 🧪 测试建议

### 单元测试
```typescript
describe('TemplateDialog - TimeConfig', () => {
    it('应该保留 timeConfig.type 字段', async () => {
        const template = ReminderTemplate.forCreate();
        template.updateTimeConfig({ type: 'daily', times: ['09:00'] });
        
        // 模拟 setter 触发
        const newTimes = ['10:00'];
        const currentConfig = template.timeConfig || { type: 'daily' };
        const newConfig = { ...currentConfig, times: newTimes };
        
        expect(newConfig).toHaveProperty('type', 'daily');
        expect(newConfig).toHaveProperty('times', ['10:00']);
    });
    
    it('应该处理 timeConfig 为 undefined 的情况', async () => {
        const template = ReminderTemplate.forCreate();
        template._timeConfig = undefined; // 模拟异常情况
        
        const currentConfig = template.timeConfig || { type: 'daily' };
        const newConfig = { ...currentConfig, times: ['09:00'] };
        
        expect(newConfig).toHaveProperty('type', 'daily');
        expect(newConfig).toHaveProperty('times', ['09:00']);
    });
});
```

### E2E 测试
1. 打开创建模板对话框
2. 填写基本信息（名称、消息）
3. **不修改任何时间配置**（保持默认值）
4. 点击"确定"创建
5. 验证返回的数据中 `timeConfig` 包含完整字段

### 手动测试清单
- [ ] 创建每日重复模板，验证 `timeConfig.type = 'daily'`
- [ ] 创建每周重复模板，验证 `timeConfig.type = 'weekly'` 和 `weekdays`
- [ ] 创建每月重复模板，验证 `timeConfig.type = 'monthly'` 和 `monthDays`
- [ ] 创建自定义间隔模板，验证 `timeConfig.type = 'custom'` 和 `customPattern`
- [ ] 修改时间配置后，验证所有字段都保留

## 📝 相关文件

### 修改的文件
- `apps/web/src/modules/reminder/presentation/components/dialogs/TemplateDialog.vue`
  - Lines 241-247: `timeConfigTimes` setter
  - Lines 249-255: `weekdays` setter
  - Lines 257-263: `monthDays` setter
  - Lines 265-277: `customInterval` setter
  - Lines 279-291: `customUnit` setter

### 相关文件
- `packages/domain-client/src/reminder/aggregates/ReminderTemplate.ts` - `forCreate()` 方法
- `packages/domain-core/src/reminder/aggregates/ReminderTemplateCore.ts` - `updateTimeConfig()` 和 `toDTO()` 方法

## 🔗 相关问题

### 是否需要后端验证？
建议在后端也添加 `timeConfig.type` 必需字段验证：

```typescript
// Backend validation
if (!request.timeConfig?.type) {
    throw new ValidationError('timeConfig.type is required');
}
```

### 是否需要 Migration？
如果数据库中已经有 `timeConfig = {}` 的脏数据，需要运行 migration 修复：

```sql
UPDATE reminder_templates
SET time_config = jsonb_set(
    time_config,
    '{type}',
    '"daily"'
)
WHERE time_config->>'type' IS NULL
  AND time_config IS NOT NULL;
```

## 📚 参考资料

- [Vue 3 Computed Properties](https://vuejs.org/guide/essentials/computed.html)
- [JavaScript Spread Operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- [Defensive Programming Principles](https://en.wikipedia.org/wiki/Defensive_programming)

---

**修复日期**: 2025-01-06  
**问题严重级别**: High（数据完整性问题）  
**影响范围**: 所有通过 TemplateDialog 创建的提醒模板  
**向后兼容**: 是（仅修复 bug，不改变 API）
