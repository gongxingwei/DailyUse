---
title: 防抖节流工具
created: 2025-10-10
updated: 2025-10-10
tags:
  - utils
  - frontend
  - performance
category: 工具函数
---

# 防抖节流工具系统

> **位置**: `packages/utils/src/frontend/debounce.ts` & `throttle.ts`  
> **适用范围**: Web、Desktop 项目（性能优化）  
> **依赖**: 无（纯 TypeScript 实现）

---

## 📋 概述

防抖（Debounce）和节流（Throttle）是前端性能优化的重要工具，用于控制函数的执行频率。

**防抖**：在事件触发后延迟执行，如果在延迟期间再次触发，则重新计时。
**节流**：限制函数在一定时间内只执行一次。

---

## 🏗️ 架构设计

### 核心组件

```
packages/utils/src/frontend/
├── debounce.ts         # 防抖工具集
│   ├── createDebounce        # 基础防抖
│   ├── createDebouncePromise # Promise 防抖
│   ├── createBatchDebounce   # 批量防抖
│   └── debounce             # 装饰器
│
└── throttle.ts         # 节流工具集
    ├── createThrottle         # 基础节流
    ├── createWindowThrottle   # 时间窗口节流
    ├── createRAFThrottle      # RAF 节流
    ├── createThrottleDebounce # 组合节流防抖
    └── throttle              # 装饰器
```

---

## 🚀 防抖工具

### 1. 基础防抖 `createDebounce`

用于延迟执行函数，支持取消和立即执行。

```typescript
import { createDebounce } from '@dailyuse/utils'

const { debouncedFn, cancel, flush } = createDebounce(
  (keyword: string) => {
    console.log('搜索:', keyword)
  },
  500
)

// 用户输入时调用
input.addEventListener('input', (e) => debouncedFn(e.target.value))

// 取消执行
cancel()

// 立即执行
flush()
```

**适用场景**：
- ✅ 搜索框输入
- ✅ 窗口 resize 事件
- ✅ 表单输入验证

### 2. Promise 防抖 `createDebouncePromise`

用于 API 调用防抖，只保留最后一次调用的结果。

```typescript
import { createDebouncePromise } from '@dailyuse/utils'

const { debouncedFn: searchUser } = createDebouncePromise(
  async (keyword: string) => {
    const res = await searchApi(keyword)
    return res.data
  },
  300
)

// Vue 组件中
watch(keyword, async (value) => {
  if (value) {
    users.value = await searchUser(value)
  }
})
```

**适用场景**：
- ✅ 自动补全
- ✅ 实时搜索
- ✅ 联想输入

### 3. 批量防抖 `createBatchDebounce`

收集多次调用的参数，延迟后一次性处理。

```typescript
import { createBatchDebounce } from '@dailyuse/utils'

const { debouncedFn: batchDelete } = createBatchDebounce(
  async (ids: number[]) => {
    await batchDeleteApi(ids)
    message.success(`已删除 ${ids.length} 条记录`)
  },
  1000
)

// 用户快速点击多个删除按钮
items.forEach(item => {
  batchDelete(item.id)
})
// 1秒后统一处理：[1, 2, 3, 4, 5]
```

**适用场景**：
- ✅ 批量操作
- ✅ 日志上报
- ✅ 统计打点

### 4. 装饰器 `@debounce`

用于类方法的防抖。

```typescript
import { debounceDecorator } from '@dailyuse/utils'

class SearchService {
  @debounceDecorator(500)
  search(keyword: string) {
    console.log('搜索:', keyword)
  }
}
```

---

## 🎯 节流工具

### 1. 基础节流 `createThrottle`

限制函数在一定时间内只执行一次。

```typescript
import { createThrottle } from '@dailyuse/utils'

const { throttledFn, cancel, flush } = createThrottle(
  () => {
    console.log('滚动位置:', window.scrollY)
  },
  200,
  {
    leading: true,  // 立即执行第一次
    trailing: true, // 延迟执行最后一次
  }
)

window.addEventListener('scroll', throttledFn)
```

**适用场景**：
- ✅ 滚动事件
- ✅ 鼠标移动
- ✅ 窗口 resize

### 2. 时间窗口节流 `createWindowThrottle`

固定时间窗口内只执行一次，返回剩余时间。

```typescript
import { createWindowThrottle } from '@dailyuse/utils'

const { throttledFn: handleLike, getRemainingTime } = createWindowThrottle(
  async () => {
    await likeApi(postId)
    message.success('点赞成功')
  },
  1000
)

const onClick = () => {
  const success = handleLike()
  if (!success) {
    const remaining = getRemainingTime()
    message.warning(`请等待 ${Math.ceil(remaining / 1000)} 秒`)
  }
}
```

**适用场景**：
- ✅ 点赞、收藏
- ✅ 表单提交
- ✅ 验证码发送

### 3. RAF 节流 `createRAFThrottle`

使用 `requestAnimationFrame` 节流，适用于动画场景。

```typescript
import { createRAFThrottle } from '@dailyuse/utils'

const { throttledFn: updateProgress } = createRAFThrottle(() => {
  const progress = window.scrollY / document.body.scrollHeight
  progressBar.value = progress * 100
})

window.addEventListener('scroll', updateProgress)
```

**适用场景**：
- ✅ 滚动动画
- ✅ 拖拽效果
- ✅ 实时渲染

### 4. 组合节流防抖 `createThrottleDebounce`

先节流限制频率，再防抖等待停止。

```typescript
import { createThrottleDebounce } from '@dailyuse/utils'

const { combinedFn: handleInput } = createThrottleDebounce(
  (value: string) => {
    console.log('处理输入:', value)
  },
  200,  // 节流间隔
  500   // 防抖延迟
)
```

**适用场景**：
- ✅ 复杂输入处理
- ✅ 实时预览
- ✅ 持续监控

### 5. 装饰器 `@throttle`

用于类方法的节流。

```typescript
import { throttleDecorator } from '@dailyuse/utils'

class ScrollHandler {
  @throttleDecorator(200)
  handleScroll() {
    console.log('滚动')
  }
}
```

---

## 💡 最佳实践

### 1. 选择合适的工具

| 场景 | 推荐工具 | 原因 |
|------|---------|------|
| 搜索输入 | `createDebounce` | 等待用户停止输入 |
| API 自动补全 | `createDebouncePromise` | 只关心最后结果 |
| 批量操作 | `createBatchDebounce` | 减少请求次数 |
| 滚动事件 | `createThrottle` | 限制执行频率 |
| 点赞按钮 | `createWindowThrottle` | 防止重复点击 |
| 滚动动画 | `createRAFThrottle` | 流畅的动画效果 |

### 2. 合理设置延迟时间

```typescript
// 输入防抖：300-500ms
createDebounce(search, 300)

// 滚动节流：100-200ms
createThrottle(handleScroll, 200)

// API 调用：500-800ms
createDebouncePromise(fetchData, 500)
```

### 3. 记得清理

```typescript
const { debouncedFn, cancel } = createDebounce(fn, 500)

// 组件卸载时清理
onUnmounted(() => {
  cancel()
})
```

### 4. 错误处理

```typescript
const { debouncedFn } = createDebouncePromise(
  async (keyword: string) => {
    try {
      return await searchApi(keyword)
    } catch (error) {
      console.error('搜索失败:', error)
      throw error
    }
  },
  500
)
```

---

## 📐 实战案例

### 案例 1: 搜索框

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { createDebounce } from '@dailyuse/utils'

const keyword = ref('')
const results = ref([])

const { debouncedFn: handleSearch } = createDebounce(
  async (value: string) => {
    if (!value) {
      results.value = []
      return
    }
    const res = await searchApi(value)
    results.value = res.data
  },
  500
)

watch(keyword, (value) => {
  handleSearch(value)
})
</script>

<template>
  <v-text-field
    v-model="keyword"
    label="搜索"
    placeholder="输入关键词..."
  />
  <div v-for="item in results" :key="item.id">
    {{ item.name }}
  </div>
</template>
```

### 案例 2: 滚动加载

```typescript
import { createThrottle } from '@dailyuse/utils'

const { throttledFn: handleScroll } = createThrottle(
  async () => {
    const scrollTop = window.scrollY
    const scrollHeight = document.body.scrollHeight
    const clientHeight = window.innerHeight

    // 距离底部 100px 时加载
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (!loading.value && hasMore.value) {
        await loadMore()
      }
    }
  },
  200
)

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
```

### 案例 3: 批量删除

```typescript
import { createBatchDebounce } from '@dailyuse/utils'
import { useMessage } from '@dailyuse/ui'

const message = useMessage()

const { debouncedFn: batchDelete } = createBatchDebounce(
  async (ids: number[]) => {
    try {
      await batchDeleteApi(ids)
      message.success(`已删除 ${ids.length} 条记录`)
      await refreshList()
    } catch (error) {
      message.error('删除失败')
    }
  },
  1000
)

const handleDelete = (id: number) => {
  batchDelete(id)
}
```

---

## 📚 API 参考

### createDebounce

```typescript
function createDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): {
  debouncedFn: T;
  cancel: () => void;
  flush: () => void;
}
```

### createDebouncePromise

```typescript
function createDebouncePromise<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): {
  debouncedFn: (...args: Parameters<T>) => Promise<ReturnType<T>>;
  cancel: () => void;
}
```

### createBatchDebounce

```typescript
function createBatchDebounce<T>(
  fn: (args: T[]) => void | Promise<void>,
  delay: number
): {
  debouncedFn: (arg: T) => void;
  cancel: () => void;
  flush: () => void;
}
```

### createThrottle

```typescript
function createThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options?: { leading?: boolean; trailing?: boolean }
): {
  throttledFn: T;
  cancel: () => void;
  flush: () => void;
}
```

### createWindowThrottle

```typescript
function createWindowThrottle<T extends (...args: any[]) => any>(
  fn: T,
  windowMs: number
): {
  throttledFn: () => boolean;
  cancel: () => void;
  getRemainingTime: () => number;
}
```

### createRAFThrottle

```typescript
function createRAFThrottle<T extends (...args: any[]) => any>(
  fn: T
): {
  throttledFn: T;
  cancel: () => void;
}
```

---

## 🔗 相关文档

- [[frontend-tools-usage|前端工具使用指南]]
- [[frontend-elegant-patterns|前端优雅模式]]
- [[loading-state|加载状态管理]]

---

## 📝 变更历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2025-10-10 | 初始版本，完整实现防抖节流工具集 |

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-10
