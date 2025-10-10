---
title: 加载状态管理
created: 2025-10-10
updated: 2025-10-10
tags:
  - utils
  - frontend
  - state-management
category: 状态管理
---

# 加载状态管理系统

> **位置**: `packages/utils/src/frontend/loadingState.ts`  
> **适用范围**: Web、Desktop 项目（异步状态管理）  
> **依赖**: 无（纯 TypeScript 实现）

---

## 📋 概述

加载状态管理系统提供了一套框架无关的异步状态管理解决方案，用于处理加载状态、数据和错误。

**核心特性**：
- ✅ **类型安全** - 完整的 TypeScript 泛型支持
- ✅ **订阅模式** - 状态变化自动通知
- ✅ **重试机制** - 自动重试失败的请求
- ✅ **缓存支持** - 减少重复请求
- ✅ **轮询加载** - 定时刷新数据

---

## 🏗️ 架构设计

### 核心类

```typescript
class LoadingState<T, E> {
  // 状态属性
  isLoading: boolean
  data: T | null
  error: E | null
  
  // 核心方法
  execute(fn): Promise<T>
  retry(fn, maxRetries, delay): Promise<T>
  subscribe(listener): () => void
  reset(): void
}
```

### 工具函数

```
packages/utils/src/frontend/loadingState.ts
├── LoadingState              # 核心状态管理类
├── createLoadingWrapper      # 函数包装器
├── combineLoadingStates      # 组合多个状态
├── createPollingLoader       # 轮询加载
└── createCachedLoader        # 缓存加载
```

---

## 🚀 快速开始

### 1. 基础用法

```typescript
import { LoadingState } from '@dailyuse/utils'

// 创建状态实例
const userState = new LoadingState<User>()

// 执行异步操作
async function loadUser(userId: string) {
  await userState.execute(async () => {
    const res = await fetchUser(userId)
    return res.data
  })
}

// 使用状态
if (userState.isLoading) {
  console.log('加载中...')
} else if (userState.error) {
  console.error('错误:', userState.error)
} else if (userState.data) {
  console.log('数据:', userState.data)
}
```

### 2. 订阅状态变化

```typescript
const userState = new LoadingState<User>()

// 订阅状态变化
const unsubscribe = userState.subscribe((snapshot) => {
  console.log('状态变化:', snapshot)
  // { isLoading, data, error, hasData, hasError }
})

// 取消订阅
unsubscribe()
```

---

## 📐 核心功能

### 1. LoadingState 类

完整的加载状态管理。

```typescript
import { LoadingState } from '@dailyuse/utils'

interface User {
  id: string
  name: string
}

const userState = new LoadingState<User>()

// 执行异步操作
await userState.execute(async () => {
  return await fetchUser('123')
})

// 访问状态
console.log(userState.data)       // User 数据
console.log(userState.isLoading)  // false
console.log(userState.error)      // null
console.log(userState.hasData)    // true
console.log(userState.hasError)   // false

// 重置状态
userState.reset()
```

### 2. 函数包装器

将普通函数包装为带状态的版本。

```typescript
import { createLoadingWrapper } from '@dailyuse/utils'

const { execute, state, reset } = createLoadingWrapper(
  async (userId: string) => {
    return await fetchUser(userId)
  }
)

// 执行函数
await execute('123')

// 访问状态
console.log(state.data)
console.log(state.isLoading)
console.log(state.error)

// 重置
reset()
```

### 3. 重试机制

自动重试失败的请求。

```typescript
const userState = new LoadingState<User>()

// 最多重试 3 次，每次间隔 1 秒
await userState.retry(
  async () => fetchUser(userId),
  3,        // 最大重试次数
  1000      // 重试间隔（毫秒）
)
```

### 4. 组合状态

组合多个加载状态。

```typescript
import { combineLoadingStates, LoadingState } from '@dailyuse/utils'

const userState = new LoadingState<User>()
const postsState = new LoadingState<Post[]>()

const combined = combineLoadingStates(userState, postsState)

// combined.isLoading - 任一正在加载则为 true
// combined.hasError - 任一有错误则为 true
// combined.allLoaded - 全部加载完成则为 true
```

### 5. 轮询加载

定时刷新数据。

```typescript
import { createPollingLoader } from '@dailyuse/utils'

const { start, stop, state, isPolling } = createPollingLoader(
  async () => {
    return await fetchLatestData()
  },
  5000  // 每 5 秒轮询一次
)

// 开始轮询
start()

// 停止轮询
stop()

// 访问状态
console.log(state.data)
console.log(isPolling())
```

### 6. 缓存加载

带缓存的加载器。

```typescript
import { createCachedLoader } from '@dailyuse/utils'

const { execute, state, clearCache, getCacheInfo } = createCachedLoader(
  async (userId: string) => fetchUser(userId),
  (userId) => `user-${userId}`,  // 缓存 key 生成函数
  60000                          // 缓存时间 60 秒
)

// 第一次调用会请求 API
await execute('123')

// 第二次调用会使用缓存
await execute('123')

// 清除缓存
clearCache('user-123')

// 获取缓存信息
const info = getCacheInfo('user-123')
console.log(info.exists, info.age, info.isValid)
```

---

## 💡 最佳实践

### 1. 错误处理

```typescript
const userState = new LoadingState<User, string>()

try {
  await userState.execute(async () => {
    const res = await fetchUser(userId)
    if (!res.success) {
      throw new Error(res.message)
    }
    return res.data
  })
} catch (error) {
  console.error('加载失败:', userState.error)
}
```

### 2. 配置 onSuccess/onError

```typescript
await userState.execute(
  async () => fetchUser(userId),
  {
    onSuccess: (data) => {
      console.log('加载成功:', data)
    },
    onError: (error) => {
      console.error('加载失败:', error)
    }
  }
)
```

### 3. 组件卸载清理

```typescript
import { onUnmounted } from 'vue'

const { start, stop } = createPollingLoader(fetchData, 5000)

onMounted(() => start())
onUnmounted(() => stop())
```

### 4. 乐观更新

```typescript
// 先更新 UI
userState.setData(newUser)

// 后台同步
try {
  await updateUser(newUser)
} catch (error) {
  // 回滚
  userState.setData(oldUser)
  userState.setError(error)
}
```

---

## 📐 实战案例

### 案例 1: 用户详情页

```typescript
import { LoadingState } from '@dailyuse/utils'

interface User {
  id: string
  name: string
  email: string
}

const userState = new LoadingState<User>()

async function loadUser(userId: string) {
  await userState.execute(
    async () => {
      const res = await fetchUser(userId)
      return res.data
    },
    {
      onSuccess: (user) => {
        console.log('用户加载成功:', user.name)
      },
      onError: (error) => {
        message.error('加载失败')
      }
    }
  )
}

// Vue 组件中
onMounted(() => {
  loadUser(route.params.id)
})
```

### 案例 2: 列表加载

```vue
<script setup lang="ts">
import { createLoadingWrapper } from '@dailyuse/utils'

const { execute: loadList, state } = createLoadingWrapper(
  async (page: number) => {
    const res = await fetchList({ page })
    return res.data
  }
)

const list = computed(() => state.data || [])
const loading = computed(() => state.isLoading)
const error = computed(() => state.error)

onMounted(() => {
  loadList(1)
})
</script>

<template>
  <div>
    <v-progress-circular v-if="loading" />
    <v-alert v-else-if="error" type="error">
      {{ error }}
    </v-alert>
    <div v-else>
      <div v-for="item in list" :key="item.id">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>
```

### 案例 3: 实时数据

```typescript
import { createPollingLoader } from '@dailyuse/utils'
import { useMessage } from '@dailyuse/ui'

const message = useMessage()

const { start, stop, state } = createPollingLoader(
  async () => {
    try {
      const res = await fetchLatestData()
      return res.data
    } catch (error) {
      message.error('刷新失败')
      throw error
    }
  },
  5000
)

// 页面显示时开始轮询
onMounted(() => start())

// 页面隐藏时停止轮询
onUnmounted(() => stop())
```

### 案例 4: 带缓存的数据加载

```typescript
import { createCachedLoader } from '@dailyuse/utils'

const { execute, clearCache } = createCachedLoader(
  async (userId: string) => {
    console.log('从 API 加载用户:', userId)
    return await fetchUser(userId)
  },
  (userId) => `user-${userId}`,
  60000  // 缓存 1 分钟
)

// 第一次加载（从 API）
await execute('123')

// 第二次加载（从缓存）
await execute('123')

// 60 秒后缓存过期，重新从 API 加载
await new Promise(resolve => setTimeout(resolve, 60000))
await execute('123')

// 手动清除缓存
clearCache('user-123')
```

---

## 📚 API 参考

### LoadingState

```typescript
class LoadingState<T = any, E = Error> {
  // 只读属性
  readonly isLoading: boolean
  readonly data: T | null
  readonly error: E | null
  readonly hasData: boolean
  readonly hasError: boolean
  
  // 方法
  execute(
    fn: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: E) => void
    }
  ): Promise<T>
  
  retry(
    fn: () => Promise<T>,
    maxRetries: number,
    delay: number
  ): Promise<T>
  
  subscribe(
    listener: (snapshot: LoadingStateSnapshot<T, E>) => void
  ): () => void
  
  setLoading(loading: boolean): void
  setData(data: T): void
  setError(error: E): void
  reset(): void
  
  getSnapshot(): LoadingStateSnapshot<T, E>
}
```

### createLoadingWrapper

```typescript
function createLoadingWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T
): {
  execute: (...args: Parameters<T>) => Promise<ReturnType<T>>
  state: LoadingState<Awaited<ReturnType<T>>>
  reset: () => void
}
```

### combineLoadingStates

```typescript
function combineLoadingStates(
  ...states: LoadingState[]
): {
  isLoading: boolean
  hasError: boolean
  allLoaded: boolean
  errors: any[]
}
```

### createPollingLoader

```typescript
function createPollingLoader<T>(
  fn: () => Promise<T>,
  interval: number
): {
  start: () => void
  stop: () => void
  state: LoadingState<T>
  isPolling: () => boolean
}
```

### createCachedLoader

```typescript
function createCachedLoader<T, Args extends any[] = []>(
  fn: (...args: Args) => Promise<T>,
  cacheKey: (...args: Args) => string,
  ttl: number
): {
  execute: (...args: Args) => Promise<T>
  state: LoadingState<T>
  clearCache: (key: string) => void
  getCacheInfo: (key: string) => {
    exists: boolean
    age: number
    isValid: boolean
  }
}
```

---

## 🔗 相关文档

- [[frontend-tools-usage|前端工具使用指南]]
- [[useLoading|useLoading Composable]]
- [[debounce-throttle|防抖节流工具]]

---

## 📝 变更历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2025-10-10 | 初始版本，完整实现加载状态管理系统 |

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-10
