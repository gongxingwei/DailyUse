# TimeConfig Setter 修复 - 快速参考

## 🐛 问题
创建提醒模板后，`timeConfig` 为空对象 `{}`

## 🔍 原因
Computed setter 在 spread 操作时丢失了 `type` 字段：

```typescript
// ❌ 错误写法
const newConfig = { ...localReminderTemplate.value.timeConfig, times: val };
// 如果 timeConfig 是 undefined，结果是 { times: val }，缺少 type！
```

## ✅ 解决方案
在 spread 前提供默认配置对象：

```typescript
// ✅ 正确写法
const currentConfig = localReminderTemplate.value.timeConfig || { type: 'daily' };
const newConfig = { ...currentConfig, times: val };
// 结果：{ type: 'daily', times: val } ✓
```

## 📋 修复清单

### timeConfigTimes
```typescript
set: (val: string[]) => {
    const currentConfig = localReminderTemplate.value.timeConfig || { type: 'daily' };
    const newConfig = { ...currentConfig, times: val };
    localReminderTemplate.value.updateTimeConfig(newConfig as any);
}
```

### weekdays
```typescript
set: (val: number[]) => {
    const currentConfig = localReminderTemplate.value.timeConfig || { type: 'weekly' };
    const newConfig = { ...currentConfig, weekdays: val };
    localReminderTemplate.value.updateTimeConfig(newConfig as any);
}
```

### monthDays
```typescript
set: (val: number[]) => {
    const currentConfig = localReminderTemplate.value.timeConfig || { type: 'monthly' };
    const newConfig = { ...currentConfig, monthDays: val };
    localReminderTemplate.value.updateTimeConfig(newConfig as any);
}
```

### customInterval
```typescript
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
```

### customUnit
```typescript
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
```

## 🎯 最佳实践

### Spread 操作的安全模式
```typescript
// ❌ 不安全
const result = { ...obj.prop, newValue };

// ✅ 安全
const current = obj.prop || defaultValue;
const result = { ...current, newValue };
```

### 嵌套对象更新
```typescript
// ✅ 推荐
const current = obj.outer || { type: 'default' };
const inner = current.inner || {};
const result = {
    ...current,
    inner: { ...inner, newProp: value }
};
```

## 🧪 验证方法

### 浏览器控制台
```javascript
// 创建模板后检查
console.log(template.timeConfig);
// 应该输出：{ type: 'daily', times: ['09:00'] }
// 而不是：{}
```

### Network Tab
查看 POST 请求体中的 `timeConfig`：
```json
{
    "timeConfig": {
        "type": "daily",     // ✓ 必需字段
        "times": ["09:00"]
    }
}
```

## 📁 修改的文件
`apps/web/src/modules/reminder/presentation/components/dialogs/TemplateDialog.vue`

---

**详细文档**: [TEMPLATE_DIALOG_TIMECONFIG_FIX.md](./TEMPLATE_DIALOG_TIMECONFIG_FIX.md)
