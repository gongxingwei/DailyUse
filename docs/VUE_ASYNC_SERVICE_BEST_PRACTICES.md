# Vue Composables 异步服务管理最佳实践

## 问题描述

在 Vue 3 Composition API 中，直接在 composable 中使用 `await` 会导致以下问题：

```typescript
// ❌ 错误的做法
export function useAuthenticationService() {
  const authService = await AuthApplicationService.getInstance(); // 语法错误
  // ...
}
```

## 解决方案

### 方案一：ref + onMounted（推荐用于简单场景）

```vue
<template>
  <div>
    <button @click="handleLogin" :disabled="!isServiceReady">
      {{ isServiceReady ? '登录' : '服务加载中...' }}
    </button>
  </div>
</template>

<script setup>
import { useAuthenticationService } from '@/composables/useAuthenticationService';

const { handleLogin, isServiceReady, serviceError } = useAuthenticationService();
</script>
```

**优点：**

- 简单直接，易于理解
- 适合单组件使用
- 状态管理简单

**缺点：**

- 每个组件都会重新初始化服务
- 不利于服务实例复用

### 方案二：全局服务管理器（推荐用于服务复用）

```typescript
// 使用服务管理器
import { useAuthenticationServiceSuspense } from '@/composables/useAuthenticationServiceSuspense';

const { handleLogin, isServiceReady, warmupService } = useAuthenticationServiceSuspense();

// 可以在应用启动时预热服务
warmupService();
```

**优点：**

- 服务实例全局共享
- 延迟初始化，性能好
- 支持预热

**缺点：**

- 需要额外的服务管理器层

### 方案三：Pinia Store（推荐用于复杂状态管理）

```vue
<script setup>
import { useAuthenticationServiceStore } from '@/composables/useAuthenticationServiceStore';

const { handleLogin, isServiceReady, isLoading, serviceError, initializeService } =
  useAuthenticationServiceStore();

// 组件挂载时初始化
onMounted(() => {
  initializeService();
});
</script>
```

**优点：**

- 状态管理完善
- 支持 DevTools 调试
- 全局状态共享
- 持久化支持

**缺点：**

- 引入额外依赖
- 复杂度较高

## 组件中的使用模式

### 1. 基础使用

```vue
<template>
  <div>
    <!-- 服务就绪检查 -->
    <div v-if="!isServiceReady" class="loading">服务初始化中...</div>

    <!-- 错误处理 -->
    <div v-else-if="serviceError" class="error">
      {{ serviceError }}
    </div>

    <!-- 主要内容 -->
    <div v-else>
      <LoginForm @submit="handleLogin" />
    </div>
  </div>
</template>
```

### 2. 带加载状态

```vue
<template>
  <div>
    <button
      @click="handleLogin"
      :disabled="!isServiceReady || isLoading"
      :class="{ loading: isLoading }"
    >
      <span v-if="isLoading">登录中...</span>
      <span v-else-if="!isServiceReady">服务加载中...</span>
      <span v-else>登录</span>
    </button>
  </div>
</template>
```

### 3. 使用 Suspense（Vue 3.2+）

```vue
<template>
  <Suspense>
    <template #default>
      <LoginComponent />
    </template>
    <template #fallback>
      <div class="loading">服务初始化中...</div>
    </template>
  </Suspense>
</template>
```

## 错误处理策略

### 1. 服务初始化失败

```typescript
const handleLogin = async (credentials) => {
  if (!authService.value) {
    showError('认证服务未就绪，请刷新页面重试');
    return;
  }
  // ... 登录逻辑
};
```

### 2. 服务重试机制

```typescript
const retryServiceInit = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await initializeService();
      break;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## 性能优化建议

### 1. 服务预热

```typescript
// 在应用启动时预热重要服务
// main.ts
import { serviceManager } from '@/shared/services/ServiceManager';

const app = createApp(App);

// 预热服务
serviceManager.getAuthService().catch(console.error);

app.mount('#app');
```

### 2. 懒加载

```typescript
// 只在需要时初始化服务
const handleLogin = async (credentials) => {
  try {
    const authService = await serviceManager.getAuthService();
    return await authService.login(credentials);
  } catch (error) {
    // 错误处理
  }
};
```

### 3. 缓存策略

```typescript
// 服务管理器中实现缓存
class ServiceManager {
  private cache = new Map<string, Promise<any>>();

  async getService<T>(key: string, factory: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const promise = factory();
    this.cache.set(key, promise);
    return promise;
  }
}
```

## 最佳实践总结

1. **避免在 composable 中直接使用 await**
2. **使用 ref + onMounted 处理异步初始化**
3. **提供服务就绪状态检查**
4. **实现合适的错误处理和重试机制**
5. **考虑服务实例的复用和缓存**
6. **在复杂场景下使用状态管理工具**

选择哪种方案取决于您的具体需求：

- 简单应用：方案一
- 需要服务复用：方案二
- 复杂状态管理：方案三
