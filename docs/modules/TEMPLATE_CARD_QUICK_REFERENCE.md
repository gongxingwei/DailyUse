# TemplateDesktopCard 快速参考

## 🎯 卡片功能

### 按钮操作

| 按钮 | 颜色 | 图标 | 功能 | 实现方式 |
|------|------|------|------|----------|
| 关闭 | grey | mdi-close | 关闭卡片 | `close()` 方法 |
| 编辑 | primary/自定义 | mdi-pencil | 打开编辑对话框 | emit `edit-template` 事件 |
| 删除 | error | mdi-delete | 删除模板 | 调用 `useReminder().deleteTemplate()` |

### 卡片信息展示

```typescript
// 基础信息
- 模板名称
- 分类
- 优先级（带颜色标签）
- 描述
- 提醒消息

// 时间配置
- 类型（每日/每周/每月/自定义等）
- 具体时间列表

// 标签
- 所有关联标签

// 统计信息
- 总触发次数
- 已确认次数
- 已忽略次数
- 有效性百分比

// 最近实例
- 最近5个实例
- 每个实例的状态和时间
```

## 💻 使用示例

### 在父组件中使用

```vue
<template>
    <TemplateDesktopCard 
        ref="templateDesktopCardRef" 
        @edit-template="handleEditTemplate"
    />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TemplateDesktopCard from './components/cards/TemplateDesktopCard.vue'
import { ReminderTemplate } from '@dailyuse/domain-client'

const templateDesktopCardRef = ref<InstanceType<typeof TemplateDesktopCard> | null>(null)
const templateDialogRef = ref(null) // TemplateDialog 引用

// 打开卡片
const openTemplateCard = (template: ReminderTemplate) => {
    templateDesktopCardRef.value?.open(template)
}

// 处理编辑事件
const handleEditTemplate = (template: ReminderTemplate) => {
    templateDialogRef.value?.openForEdit(template)
}
</script>
```

## 🔌 API 接口

### Props
无（通过 `open()` 方法传入数据）

### Emits
```typescript
{
  close: []                                    // 卡片关闭时触发
  'edit-template': [template: ReminderTemplate] // 点击编辑按钮时触发
}
```

### Exposed Methods
```typescript
{
  open: (template: ReminderTemplate) => void  // 打开卡片并展示模板信息
  close: () => void                           // 关闭卡片
}
```

## 🎨 UI 规范

### 按钮样式
```vue
<v-btn 
    variant="text"        <!-- 文本按钮样式 -->
    size="small"          <!-- 小尺寸 -->
    color="error"         <!-- 根据功能选择颜色 -->
    @click="handler"
>
    <v-icon left size="16">mdi-icon-name</v-icon>
    按钮文本
</v-btn>
```

### 颜色映射

| 元素 | 颜色 | 说明 |
|------|------|------|
| 优先级 - 低 | success (绿色) | ReminderPriority.LOW |
| 优先级 - 普通 | primary (蓝色) | ReminderPriority.NORMAL |
| 优先级 - 高 | warning (橙色) | ReminderPriority.HIGH |
| 优先级 - 紧急 | error (红色) | ReminderPriority.URGENT |
| 删除按钮 | error (红色) | 危险操作 |
| 关闭按钮 | grey (灰色) | 中性操作 |
| 编辑按钮 | template.color | 继承模板颜色 |

## 🔄 数据流

### 打开卡片
```
父组件
  ↓ 调用 templateDesktopCardRef.open(template)
TemplateDesktopCard
  ↓ 设置 template.value = template
  ↓ 设置 visible.value = true
显示卡片对话框
```

### 编辑模板
```
用户点击"编辑"按钮
  ↓ handleEdit() 方法
  ↓ emit('edit-template', template.value)
父组件接收事件
  ↓ handleEditTemplate(template)
  ↓ templateDialogRef.openForEdit(template)
打开编辑对话框
```

### 删除模板
```
用户点击"删除"按钮
  ↓ handleDelete() 方法
  ↓ 显示确认对话框
用户确认
  ↓ useReminder().deleteTemplate(uuid)
  ↓ ReminderWebApplicationService.deleteReminderTemplate(uuid)
  ↓ API: DELETE /api/v1/reminders/templates/:uuid
  ↓ Store 自动更新
  ↓ snackbar.showSuccess('提醒模板已删除')
  ↓ close() 关闭卡片
父组件列表自动刷新
```

## ⚙️ 内部实现

### 关键依赖
```typescript
import { useReminder } from '../../composables/useReminder'
import { useSnackbar } from '@/shared/composables/useSnackbar'
```

### 核心状态
```typescript
const visible = ref(false)                           // 控制对话框显示
const template = ref<ReminderTemplate | null>(null) // 当前展示的模板
const enabled = ref(false)                           // 模板启用状态
```

### 核心方法
```typescript
// 打开卡片
const open = (templateData: ReminderTemplate) => {
    template.value = templateData
    enabled.value = templateData.enabled
    visible.value = true
}

// 关闭卡片
const close = () => {
    visible.value = false
    template.value = null
}

// 切换启用状态
const toggleEnabled = async () => {
    template.value.toggleEnabled(enabled.value)
    snackbar.showSuccess(`提醒模板已${enabled.value ? '启用' : '禁用'}`)
}

// 编辑模板
const handleEdit = () => {
    emit('edit-template', template.value)
    close()
}

// 删除模板
const handleDelete = async () => {
    if (!confirm('确定要删除...')) return
    await deleteTemplateAction(template.value.uuid)
    snackbar.showSuccess('提醒模板已删除')
    close()
}
```

## 🐛 常见问题

### Q: 为什么编辑功能使用 emit 而不是直接打开对话框？
**A**: 因为 Reminder 模块的 `useReminder` composable 不管理对话框状态，对话框引用在父组件中。这与 Goal 模块的实现略有不同。

### Q: 删除确认使用原生 confirm() 还是自定义对话框？
**A**: 当前使用原生 `confirm()`，简单直接。如需更好的用户体验，可以改用 Vuetify Dialog。

### Q: 为什么没有"生成实例"按钮了？
**A**: 因为创建模板时（使用 `createReminderTemplate` 方法）已经自动生成实例了，不需要手动触发。

### Q: 如何自定义卡片的最大宽度？
**A**: 在 `<v-dialog>` 上修改 `max-width` 属性：
```vue
<v-dialog v-model="visible" max-width="600px" persistent>
```

## 📝 修改历史

### 2024-01-XX - v2.0
- ❌ 移除"生成实例"按钮
- ✅ 添加"删除"按钮
- ✅ 实现编辑功能（通过 emit）
- ✅ 参考 Goal 模块设计模式

### 2024-XX-XX - v1.0
- ✅ 初始版本
- ✅ 基本信息展示
- ✅ 启用/禁用切换

---

**相关文档**:
- [完整重构文档](./TEMPLATE_DESKTOP_CARD_REFACTORING.md)
- [Reminder 模块架构](./NOTIFICATION_MODULE_ARCHITECTURE.md)
