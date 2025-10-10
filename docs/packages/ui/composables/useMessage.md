---
title: useMessage 消息提示
created: 2025-10-10
updated: 2025-10-10
tags:
  - ui
  - composables
  - vuetify
  - feedback
category: UI组合函数
---

# useMessage 消息提示系统

> **位置**: `packages/ui/src/composables/useMessage.ts`  
> **框架**: Vue 3 + Vuetify 3  
> **依赖**: `DuMessageProvider` 组件

---

## 📋 概述

`useMessage` 提供了优雅的消息提示和确认框封装，基于 Promise 的 API 设计，支持多种消息类型和场景化快捷方式。

**核心特性**：
- ✅ **Promise 封装** - 异步等待用户确认
- ✅ **类型安全** - 完整的 TypeScript 支持
- ✅ **全局单例** - 跨组件访问
- ✅ **场景化** - 提供常用场景快捷方式

---

## 🚀 快速开始

### 1. 安装组件

在 `App.vue` 中添加 `DuMessageProvider`：

```vue
<template>
  <div id="app">
    <router-view />
    <DuMessageProvider />
  </div>
</template>

<script setup>
import { DuMessageProvider } from '@dailyuse/ui'
</script>
```

### 2. 基础用法

```vue
<script setup lang="ts">
import { useMessage } from '@dailyuse/ui'

const message = useMessage()

// 成功提示
message.success('操作成功')

// 错误提示
message.error('操作失败')

// 警告提示
message.warning('请注意')

// 信息提示
message.info('提示信息')
</script>
```

---

## 📐 核心功能

### 1. 消息提示

#### success - 成功提示

```typescript
message.success('保存成功', 3000)  // 3秒后自动关闭
```

#### error - 错误提示

```typescript
message.error('保存失败', 4000)  // 4秒后自动关闭
```

#### warning - 警告提示

```typescript
message.warning('请先保存', 3500)
```

#### info - 信息提示

```typescript
message.info('提示信息', 3000)
```

### 2. 确认框

#### confirm - 通用确认框

返回 Promise，用户点击确认返回 `true`，取消返回 `false`。

```typescript
const confirmed = await message.confirm({
  title: '确认操作',
  message: '确定要执行此操作吗？',
  type: 'warning',
  confirmText: '确定',
  cancelText: '取消'
})

if (confirmed) {
  console.log('用户确认')
} else {
  console.log('用户取消')
}
```

#### delConfirm - 删除确认

```typescript
try {
  await message.delConfirm('确定要删除这条记录吗？')
  // 用户点击确认
  await deleteApi(id)
  message.success('删除成功')
} catch {
  // 用户点击取消
  console.log('取消删除')
}
```

#### saveConfirm - 保存确认

```typescript
try {
  await message.saveConfirm('确定要保存修改吗？')
  await saveApi(data)
  message.success('保存成功')
} catch {
  console.log('取消保存')
}
```

#### leaveConfirm - 离开确认

```typescript
// 路由守卫中使用
onBeforeRouteLeave(async (to, from, next) => {
  if (hasUnsavedChanges.value) {
    const leave = await message.leaveConfirm()
    next(leave)
  } else {
    next()
  }
})
```

---

## 💡 最佳实践

### 1. 错误处理

使用 try-catch 处理用户取消：

```typescript
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm('确定要删除吗？')
    await deleteApi(id)
    message.success('删除成功')
    await refreshList()
  } catch {
    // 用户取消，静默处理
    console.log('用户取消删除')
  }
}
```

### 2. 全局访问

创建全局实例：

```typescript
// utils/message.ts
import { getGlobalMessage } from '@dailyuse/ui'

export const message = getGlobalMessage()

// 在任何地方使用
import { message } from '@/utils/message'
message.success('操作成功')
```

### 3. 自定义样式

```typescript
message.confirm({
  title: '重要操作',
  message: '此操作不可撤销',
  type: 'error',
  confirmText: '我已了解',
  cancelText: '再想想'
})
```

### 4. 链式调用

```typescript
const result = await message.confirm({
  title: '确认删除',
  message: '删除后无法恢复'
})

if (result) {
  await deleteApi(id)
  message.success('删除成功')
} else {
  message.info('已取消删除')
}
```

---

## 📐 实战案例

### 案例 1: 删除操作

```vue
<script setup lang="ts">
import { useMessage } from '@dailyuse/ui'
import { deleteUser } from '@/api/user'

const message = useMessage()

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm('确定要删除此用户吗？')
    
    await deleteUser(id)
    message.success('删除成功')
    
    // 刷新列表
    await getList()
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <v-btn color="error" @click="handleDelete(user.id)">
    删除
  </v-btn>
</template>
```

### 案例 2: 表单保存

```vue
<script setup lang="ts">
import { useMessage } from '@dailyuse/ui'

const message = useMessage()
const formData = ref({ name: '', email: '' })

const handleSubmit = async () => {
  try {
    await message.saveConfirm('确定要保存修改吗？')
    
    await submitForm(formData.value)
    message.success('保存成功')
    
    // 返回列表页
    router.push('/users')
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <v-form @submit.prevent="handleSubmit">
    <v-text-field v-model="formData.name" label="姓名" />
    <v-text-field v-model="formData.email" label="邮箱" />
    <v-btn type="submit">保存</v-btn>
  </v-form>
</template>
```

### 案例 3: 路由守卫

```vue
<script setup lang="ts">
import { useMessage } from '@dailyuse/ui'
import { onBeforeRouteLeave } from 'vue-router'

const message = useMessage()
const formData = ref({ name: '', email: '' })
const originalData = ref({ name: '', email: '' })

const hasUnsavedChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

onBeforeRouteLeave(async (to, from, next) => {
  if (hasUnsavedChanges.value) {
    try {
      await message.leaveConfirm('你有未保存的修改，确定要离开吗？')
      next()
    } catch {
      next(false)
    }
  } else {
    next()
  }
})
</script>
```

### 案例 4: 批量操作

```vue
<script setup lang="ts">
import { useMessage } from '@dailyuse/ui'

const message = useMessage()
const selectedIds = ref<number[]>([])

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    message.warning('请先选择要删除的项目')
    return
  }
  
  try {
    await message.delConfirm(
      `确定要删除选中的 ${selectedIds.value.length} 条记录吗？`,
      '批量删除'
    )
    
    await batchDeleteApi(selectedIds.value)
    message.success(`已删除 ${selectedIds.value.length} 条记录`)
    
    selectedIds.value = []
    await getList()
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <v-btn color="error" @click="handleBatchDelete">
    批量删除
  </v-btn>
</template>
```

---

## 📚 API 参考

### useMessage

```typescript
function useMessage(): MessageInstance

interface MessageInstance {
  // 消息提示
  success(message: string, duration?: number): void
  error(message: string, duration?: number): void
  warning(message: string, duration?: number): void
  info(message: string, duration?: number): void
  
  // 确认框
  confirm(options: ConfirmOptions): Promise<boolean>
  delConfirm(message?: string, title?: string): Promise<boolean>
  saveConfirm(message?: string, title?: string): Promise<boolean>
  leaveConfirm(message?: string): Promise<boolean>
  
  // 状态
  snackbar: Ref<SnackbarState>
  dialog: Ref<DialogState>
}
```

### ConfirmOptions

```typescript
interface ConfirmOptions {
  title?: string           // 标题
  message: string          // 消息内容
  type?: MessageType       // 类型：success | error | warning | info
  confirmText?: string     // 确认按钮文字
  cancelText?: string      // 取消按钮文字
  persistent?: boolean     // 是否持久化（点击遮罩不关闭）
}
```

### MessageType

```typescript
type MessageType = 'success' | 'error' | 'warning' | 'info'
```

### getGlobalMessage

```typescript
function getGlobalMessage(): MessageInstance
```

---

## 🔗 相关文档

- [[DuMessageProvider|DuMessageProvider 组件]]
- [[frontend-tools-usage|前端工具使用指南]]
- [[useLoading|useLoading Composable]]

---

## 📝 变更历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2025-10-10 | 初始版本，完整实现消息提示系统 |

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-10
