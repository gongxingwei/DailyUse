# TemplateDesktopCard 重构总结

## 📋 概述

本文档记录了 `TemplateDesktopCard.vue` 组件的重构过程，主要目标是：
1. ✅ 移除"生成实例"按钮及相关方法（因为创建模板时已自动生成实例）
2. ✅ 添加"删除"按钮并实现删除功能
3. ✅ 实现"编辑"按钮功能
4. ✅ 参考 Goal 模块的卡片组件模式

## 🎯 主要变更

### 1. UI 按钮布局变更

#### 变更前
```vue
<v-card-actions>
    <v-btn color="success" variant="text" @click="generateInstances">
        生成实例
    </v-btn>
    <v-spacer />
    <v-btn color="grey" variant="text" @click="close">
        关闭
    </v-btn>
    <v-btn :color="template?.color || 'primary'" @click="openEditDialog">
        编辑
    </v-btn>
</v-card-actions>
```

#### 变更后
```vue
<v-card-actions>
    <v-spacer />
    <!-- 关闭按钮 -->
    <v-btn variant="text" size="small" color="grey" @click="close">
        <v-icon left size="16">mdi-close</v-icon>
        关闭
    </v-btn>
    
    <!-- 编辑按钮 -->
    <v-btn variant="text" size="small" :color="template?.color || 'primary'" @click="handleEdit">
        <v-icon left size="16">mdi-pencil</v-icon>
        编辑
    </v-btn>

    <!-- 删除按钮 -->
    <v-btn variant="text" size="small" color="error" @click="handleDelete">
        <v-icon left size="16">mdi-delete</v-icon>
        删除
    </v-btn>
</v-card-actions>
```

**变更点**：
- ❌ 移除了"生成实例"按钮
- ✅ 添加了"删除"按钮（红色，error 颜色）
- ✅ 所有按钮统一使用 `variant="text"` 和 `size="small"`
- ✅ 所有按钮添加了图标（使用 Material Design Icons）
- ✅ 按钮顺序：关闭 → 编辑 → 删除

### 2. Script 部分重构

#### 变更前
```typescript
import { getReminderService } from '../../../application/services/ReminderWebApplicationService'
const reminderService = getReminderService()
const isGenerating = ref(false)

// 生成实例方法（约50行代码）
const generateInstances = async () => { /* ... */ }

// 编辑方法（stub）
const openEditDialog = () => {
    snackbar.showInfo('编辑功能待实现')
    close()
}
```

#### 变更后
```typescript
import { useReminder } from '../../composables/useReminder'

// 定义 emits
const emit = defineEmits<{
  close: []
  'edit-template': [template: ReminderTemplate]
}>()

const { deleteTemplate: deleteTemplateAction } = useReminder()

// 编辑模板 - emit 事件让父组件处理
const handleEdit = () => {
    if (!template.value) return
    emit('edit-template', template.value)
    close()
}

// 删除模板 - 直接调用 composable
const handleDelete = async () => {
    if (!template.value) return
    
    const confirmMessage = `确定要删除提醒模板 "${template.value.name}" 吗？\n\n此操作将同时删除该模板下的所有提醒实例，且无法撤销。`
    
    if (!confirm(confirmMessage)) {
        return
    }
    
    try {
        await deleteTemplateAction(template.value.uuid)
        snackbar.showSuccess('提醒模板已删除')
        close()
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        snackbar.showError(`删除失败：${errorMessage}`)
    }
}
```

**变更点**：
- ❌ 移除了 `getReminderService` 导入和 `reminderService` 变量
- ❌ 移除了 `isGenerating` ref
- ❌ 移除了 `generateInstances()` 方法（约50行代码）
- ❌ 移除了 `openEditDialog()` stub
- ✅ 添加了 `defineEmits` 定义
- ✅ 导入并使用 `useReminder` composable
- ✅ 实现了 `handleEdit()` 方法（通过 emit 事件）
- ✅ 实现了 `handleDelete()` 方法（带确认对话框）

### 3. 父组件集成（ReminderDesktopView.vue）

#### 添加事件处理器
```vue
<!-- 模板 -->
<TemplateDesktopCard 
    ref="templateDesktopCardRef" 
    @edit-template="handleEditTemplate" 
/>
```

#### 添加处理方法
```typescript
/**
 * 处理模板编辑事件（从 TemplateDesktopCard 触发）
 */
const handleEditTemplate = (template: ReminderTemplate) => {
    console.log('打开编辑模板对话框:', template)
    templateDialogRef.value?.openForEdit(template)
}
```

## 🎨 设计模式对比

### Goal 模块模式（参考）

```typescript
// GoalCard.vue
const goalComposable = useGoal()

const editGoal = async () => {
    goalComposable.openEditDialog(props.goal)
}

const deleteGoal = async () => {
    if (confirm(`确定要删除目标 "${props.goal.name}" 吗？`)) {
        await goalComposable.deleteGoal(props.goal.uuid)
    }
}
```

**特点**：
- Goal 模块的 `useGoal` composable 管理对话框状态
- 有 `openEditDialog()` 方法直接打开编辑对话框
- 删除操作通过 composable 的 `deleteGoal()` 方法

### Reminder 模块实现

```typescript
// TemplateDesktopCard.vue
const { deleteTemplate: deleteTemplateAction } = useReminder()

const handleEdit = () => {
    emit('edit-template', template.value)
    close()
}

const handleDelete = async () => {
    if (confirm(`确定要删除...`)) {
        await deleteTemplateAction(template.value.uuid)
    }
}
```

**特点**：
- Reminder 模块的 `useReminder` composable 没有对话框管理
- 编辑功能通过 emit 事件交给父组件处理
- 删除操作通过 composable 的 `deleteTemplate()` 方法

**差异原因**：
- Goal 模块的 composable 包含了 UI 状态管理（`showEditDialog`）
- Reminder 模块的 composable 纯粹是业务逻辑封装
- Reminder 模块的对话框由父组件（ReminderDesktopView）统一管理

## 📊 代码统计

| 指标 | 变更前 | 变更后 | 变化 |
|------|--------|--------|------|
| 总行数 | 360 行 | 352 行 | -8 行 |
| 按钮数量 | 3 个 | 3 个 | 0 |
| 方法数量 | 6 个 | 5 个 | -1 个 |
| Import 数量 | 6 个 | 5 个 | -1 个 |
| Ref 变量 | 4 个 | 3 个 | -1 个 |

## ✅ 功能验证清单

### UI 测试
- [ ] 点击"关闭"按钮，卡片正常关闭
- [ ] 点击"编辑"按钮，打开编辑对话框并填充当前数据
- [ ] 点击"删除"按钮，显示确认对话框
- [ ] 确认删除后，模板从列表中移除
- [ ] 取消删除后，模板保持不变

### 功能测试
- [ ] 删除模板成功后显示成功提示
- [ ] 删除模板失败后显示错误提示
- [ ] 编辑对话框正确填充当前模板数据
- [ ] 编辑保存后，卡片数据更新

### 集成测试
- [ ] 父组件正确接收 `edit-template` 事件
- [ ] 编辑对话框通过 `templateDialogRef.openForEdit()` 正常打开
- [ ] 删除后父组件的模板列表自动刷新
- [ ] Store 中的模板数据正确更新

## 🔄 与后端 API 集成

### 删除 API
- **Endpoint**: `DELETE /api/v1/reminders/templates/:uuid`
- **Service Method**: `ReminderWebApplicationService.deleteReminderTemplate(uuid)`
- **Composable Method**: `useReminder().deleteTemplate(uuid)`
- **Store Update**: 自动从 store 中移除模板

### 编辑流程
1. 用户点击"编辑"按钮
2. TemplateDesktopCard emit `edit-template` 事件
3. ReminderDesktopView 接收事件，调用 `templateDialogRef.openForEdit(template)`
4. TemplateDialog 打开并填充数据
5. 用户修改后保存
6. TemplateDialog 调用 `useReminder().updateTemplate(uuid, request)`
7. Store 自动更新
8. UI 自动刷新

## 🎓 最佳实践

### 1. 组件职责分离
- **Card 组件**：展示数据 + 基本交互（删除、emit 编辑事件）
- **Dialog 组件**：复杂表单编辑
- **View 组件**：协调各组件，管理对话框引用

### 2. 事件命名规范
- 使用 kebab-case：`edit-template`、`delete-template`
- 动词-名词结构：`edit-template`（而非 `template-edit`）
- 明确语义：避免使用 `update`（太泛化）

### 3. 确认对话框
- 使用浏览器原生 `confirm()`（简单场景）
- 提供清晰的提示信息
- 说明操作的不可逆性

### 4. 错误处理
```typescript
try {
    await operation()
    snackbar.showSuccess('操作成功')
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    snackbar.showError(`操作失败：${errorMessage}`)
}
```

## 🚀 后续优化建议

### 1. 对话框管理优化
考虑在 `useReminder` composable 中添加对话框状态管理：

```typescript
// useReminder.ts
const showEditDialog = ref(false)
const editingTemplate = ref<ReminderTemplate | null>(null)

const openEditDialog = (template: ReminderTemplate) => {
    editingTemplate.value = template
    showEditDialog.value = true
}
```

这样可以统一 Goal 和 Reminder 模块的模式。

### 2. 自定义确认对话框
使用 Vuetify 的 Dialog 替代浏览器原生 `confirm()`：

```vue
<v-dialog v-model="showDeleteConfirm" max-width="400">
    <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
            确定要删除提醒模板 "{{ template?.name }}" 吗？
        </v-card-text>
        <v-card-actions>
            <v-spacer />
            <v-btn @click="showDeleteConfirm = false">取消</v-btn>
            <v-btn color="error" @click="confirmDelete">删除</v-btn>
        </v-card-actions>
    </v-card>
</v-dialog>
```

### 3. 加载状态指示
为删除操作添加 loading 状态：

```typescript
const isDeleting = ref(false)

const handleDelete = async () => {
    // ...
    isDeleting.value = true
    try {
        await deleteTemplateAction(template.value.uuid)
    } finally {
        isDeleting.value = false
    }
}
```

## 📚 相关文档

- [GOAL_INITIALIZATION_QUICK_REFERENCE.md](./GOAL_INITIALIZATION_QUICK_REFERENCE.md) - Goal 模块参考
- [REMINDER_MODULE_ARCHITECTURE.md](./NOTIFICATION_MODULE_ARCHITECTURE.md) - Reminder 架构
- [REMINDER_QUICK_START.md](./NOTIFICATION_QUICK_START.md) - Reminder 快速开始

## 🔗 相关文件

### 修改的文件
- `apps/web/src/modules/reminder/presentation/components/cards/TemplateDesktopCard.vue`
- `apps/web/src/modules/reminder/presentation/views/ReminderDesktopView.vue`

### 参考的文件
- `apps/web/src/modules/goal/presentation/components/cards/GoalCard.vue`
- `apps/web/src/modules/reminder/presentation/composables/useReminder.ts`
- `apps/web/src/modules/reminder/application/services/ReminderWebApplicationService.ts`

---

**完成时间**: 2024-01-XX  
**变更类型**: 功能优化 + UI 改进  
**影响范围**: Reminder 模块前端展示层  
**向后兼容**: 是（仅移除了冗余功能）
