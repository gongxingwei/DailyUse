# Token 管理最佳实践文档（优化版）

## 📋 概述

本文档描述了前端项目中 Token 管理的完整最佳实践方案，基于 **Pinia + Pinia 持久化插件 + 增强的 Axios 拦截器** 的架构设计。

## 🏗️ 架构设计

### 整体架构图

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │────│  Authentication  │────│  Application    │
│                 │    │   Composables    │    │   Services      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                         │
                       ┌────────▼────────┐               │
                       │  Pinia Store    │               │
                       │ (Token State)   │               │
                       │ + Persist Plugin│               │
                       └────────┬────────┘               │
                                │                         │
                       ┌────────▼────────┐    ┌─────────▼─────────┐
                       │   AuthManager   │    │ InterceptorManager│
                       │ (Token Sync)    │    │ (HTTP + Refresh)  │
                       └─────────────────┘    └───────────────────┘
```

### 核心组件

1. **Pinia Store + Persist Plugin**: 统一状态管理和持久化
2. **Enhanced InterceptorManager**: 处理 HTTP 请求/响应和 Token 刷新
3. **AuthManager**: 提供 Token 同步接口
4. **useAuthenticationService**: 业务逻辑协调
5. **useAuthInit**: 应用初始化处理

## 🔐 Token 类型说明

### Token 种类

| Token 类型 | 用途 | 存储位置 | 生命周期 |
|-----------|------|----------|----------|
| **accessToken** | API 访问认证 | Pinia Store (持久化) | 短期（1-2小时） |
| **refreshToken** | 刷新访问令牌 | Pinia Store (持久化) | 长期（7-30天） |
| **rememberToken** | 记住登录状态 | Pinia Store (持久化) | 超长期（90天+） |

### Token 生命周期管理

```typescript
interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  rememberToken?: string;
  expiresIn?: number; // 过期时间（秒）
}
```

## 📦 核心实现

### 1. Pinia Store + 持久化

使用 Pinia 持久化插件自动管理 Token 存储：

```typescript
export const useAuthStore = defineStore('authentication', () => {
  // Token 状态
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const rememberToken = ref<string | null>(null);
  const tokenExpiry = ref<number | null>(null);

  // 计算属性
  const isAuthenticated = computed(() => 
    !!user.value && !!accessToken.value && AuthManager.isAuthenticated()
  );

  const needsRefresh = computed(() => {
    if (!tokenExpiry.value) return false;
    return Date.now() >= (tokenExpiry.value - 5 * 60 * 1000);
  });

  // Token 管理方法
  const setTokens = (tokens: TokenInfo) => {
    // 更新 Pinia 状态（自动持久化）
    accessToken.value = tokens.accessToken;
    refreshToken.value = tokens.refreshToken;
    // ...
    
    // 同步到 AuthManager
    AuthManager.setTokens(tokens.accessToken, tokens.refreshToken, ...);
  };

  return { /* ... */ };
}, {
  // 启用持久化
  persist: true
});
```

**特性**：
- ✅ 自动持久化到 localStorage
- ✅ 自动恢复状态
- ✅ 响应式计算属性
- ✅ TypeScript 类型安全

### 2. 增强的拦截器

合并原有拦截器，添加 Token 刷新功能：

```typescript
export class InterceptorManager {
  private isRefreshing = false;
  private failedQueue: Array<{resolve: Function, reject: Function}> = [];

  // 请求拦截器 - 自动添加认证头
  // 响应拦截器 - 401 错误自动刷新 Token
  // 请求队列管理 - 防止重复刷新
  
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = AuthManager.getRefreshToken();
    // 调用刷新 API
    // 更新 AuthManager
    // 通知 Pinia Store
  }
}
```

**特性**：
- ✅ 智能 Token 刷新
- ✅ 请求队列管理
- ✅ 统一错误处理
- ✅ 事件通知系统

### 3. 简化的应用服务

移除 TokenManager，直接使用 AuthManager：

```typescript
export class AuthApplicationService {
  async login(request: AuthByPasswordForm) {
    const response = await AuthApiService.loginCompat(request);
    
    // 直接使用 AuthManager
    AuthManager.setTokens(
      response.data.accessToken,
      response.data.refreshToken,
      response.data.rememberToken,
      response.data.expiresIn
    );
  }
}
```

## 🚀 使用指南

### 1. 应用启动初始化

```typescript
import { useAuthInit } from '@/modules/authentication/presentation/composables/useAuthInit';

// Pinia 持久化插件自动恢复状态
const { initialize } = useAuthInit();
await initialize();
```

### 2. 组件中使用认证

```vue
<script setup lang="ts">
import { useAuthenticationService } from '@/modules/authentication/presentation/composables/useAuthenticationService';

const {
  isAuthenticated,
  user,
  handleLogin,
  handleLogout
} = useAuthenticationService();
</script>
```

### 3. 自动 Token 管理

- **自动持久化**: Pinia 插件自动保存到 localStorage
- **自动恢复**: 应用启动时自动恢复认证状态  
- **自动刷新**: 401 错误时自动刷新 Token
- **自动清理**: 刷新失败时自动清除状态

## 🎯 优化亮点

### 1. 移除重复代码
- ❌ 删除重复的 ApiInterceptor
- ❌ 删除独立的 TokenManager 服务
- ✅ 统一使用增强的 InterceptorManager
- ✅ Pinia + 持久化插件管理状态

### 2. 简化架构
- **之前**: UI → Composable → Service → TokenManager + AuthManager → Storage
- **现在**: UI → Composable → Service → AuthManager ↔ Pinia Store (Auto Persist)

### 3. 更好的开发体验
- ✅ 自动持久化，无需手动管理存储
- ✅ 响应式状态，组件自动更新
- ✅ 类型安全，编译时错误检查
- ✅ 统一拦截器，避免重复逻辑

## 📊 性能优势

1. **减少代码量**: 移除重复的 Token 管理逻辑
2. **统一存储**: Pinia 持久化插件优化存储性能
3. **智能刷新**: 避免重复刷新请求
4. **内存优化**: 响应式状态，按需更新

## 🔧 迁移指南

如果你的项目中使用了旧的 TokenManager：

```typescript
// 旧方式
import { TokenManager } from '@/shared/services/TokenManager';
TokenManager.setTokens(tokens);

// 新方式  
import { useAuthStore } from '@/modules/authentication/presentation/stores/useAuthStore';
const authStore = useAuthStore();
authStore.setTokens(tokens); // 自动持久化 + 同步到 AuthManager
```

## 📋 检查清单

### 实施检查
- [x] 删除重复的 ApiInterceptor
- [x] 删除 TokenManager 服务类  
- [x] 增强现有 InterceptorManager
- [x] 配置 Pinia 持久化
- [x] 更新相关引用
- [x] 测试 Token 刷新流程

### 架构优化
- [x] 统一拦截器逻辑
- [x] 简化状态管理
- [x] 自动持久化配置
- [x] 响应式计算属性
- [x] 类型安全保证

## 🎯 最佳实践总结

1. **避免重复**: 一个系统一套拦截器，一个地方管理 Token
2. **利用工具**: Pinia 持久化插件 > 手动 localStorage 操作
3. **响应式优先**: 计算属性 > 手动状态同步
4. **统一接口**: AuthManager 作为不同系统间的桥梁
5. **自动化**: 让框架和插件处理重复性工作

这套优化方案消除了代码重复，简化了架构，提升了开发体验！🎉

## 🔐 Token 类型说明

### Token 种类

| Token 类型 | 用途 | 存储位置 | 生命周期 |
|-----------|------|----------|----------|
| **accessToken** | API 访问认证 | localStorage + sessionStorage | 短期（1-2小时） |
| **refreshToken** | 刷新访问令牌 | localStorage | 长期（7-30天） |
| **rememberToken** | 记住登录状态 | localStorage | 超长期（90天+） |

### Token 生命周期管理

```typescript
interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  rememberToken?: string;
  expiresIn?: number; // 过期时间（秒）
}
```

## 📦 核心实现

### 1. TokenManager 服务

负责 Token 的统一管理和持久化：

```typescript
// 设置 Tokens
TokenManager.setTokens({
  accessToken: 'eyJ...',
  refreshToken: 'refresh_token',
  rememberToken: 'remember_token',
  expiresIn: 3600
});

// 获取 Token
const token = TokenManager.getAccessToken();
const authHeader = TokenManager.getAuthorizationHeader();

// 检查状态
const hasTokens = TokenManager.hasTokens();
const isExpired = TokenManager.isTokenExpired();
const needsRefresh = TokenManager.needsRefresh();

// 清除 Tokens
TokenManager.clearTokens();
```

**特性**：
- ✅ 支持多种 Token 类型
- ✅ 自动过期检测
- ✅ 提前刷新提醒
- ✅ 双重存储（localStorage + sessionStorage）

### 2. Axios 拦截器

智能处理 HTTP 请求和 Token 刷新：

```typescript
// 请求拦截器
- 自动添加 Authorization 头
- 添加请求追踪 ID
- 请求日志记录

// 响应拦截器
- 401 错误自动刷新 Token
- 请求队列管理（防止重复刷新）
- 错误统一处理
- 自动登出处理
```

**特性**：
- ✅ 自动 Token 刷新
- ✅ 请求队列管理
- ✅ 统一错误处理
- ✅ 智能重试机制

### 3. Pinia Store

纯状态管理，不包含业务逻辑：

```typescript
const authStore = useAuthStore();

// 状态访问
authStore.isAuthenticated
authStore.user
authStore.loading
authStore.accessToken

// 状态管理
authStore.setUser(userData);
authStore.setTokens(tokens);
authStore.clearAuth();
```

**特性**：
- ✅ 响应式状态
- ✅ 计算属性支持
- ✅ TypeScript 类型安全
- ✅ 开发工具支持

### 4. 业务服务层

处理认证相关的业务逻辑：

```typescript
const authService = await AuthApplicationService.getInstance();

// 登录
await authService.login(credentials);

// 登出
await authService.logout();

// 刷新用户信息
await authService.refreshUser();

// 刷新 Token
await authService.refreshToken();
```

**特性**：
- ✅ 单例模式
- ✅ 业务逻辑封装
- ✅ 错误处理
- ✅ 依赖注入支持

## 🚀 使用指南

### 1. 应用启动初始化

在 `main.ts` 或根组件中：

```typescript
import { useAuthInit } from '@/modules/authentication/presentation/composables/useAuthInit';

// 在应用启动时
const { initialize } = useAuthInit();
await initialize();
```

### 2. 组件中使用认证

```vue
<template>
  <div v-if="isAuthenticated">
    <p>欢迎, {{ user?.name }}</p>
    <button @click="handleLogout">登出</button>
  </div>
  <div v-else>
    <LoginForm @submit="handleLogin" />
  </div>
</template>

<script setup lang="ts">
import { useAuthenticationService } from '@/modules/authentication/presentation/composables/useAuthenticationService';

const {
  isAuthenticated,
  user,
  handleLogin,
  handleLogout
} = useAuthenticationService();
</script>
```

### 3. API 调用

使用增强的 axios 实例：

```typescript
import apiClient from '@/shared/api/interceptors/ApiInterceptor';

// 自动添加认证头，自动处理 Token 刷新
const response = await apiClient.get('/api/user/profile');
```

### 4. 路由守卫

```typescript
import { useAuthStore } from '@/modules/authentication/presentation/stores/useAuthStore';

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});
```

## 🔒 安全考虑

### 1. Token 存储安全

- **accessToken**: 存储在 localStorage 和 sessionStorage，便于跨标签页共享
- **refreshToken**: 仅存储在 localStorage，生命周期较长
- **rememberToken**: 用于长期免登录，需要后端配合验证

### 2. XSS 防护

- 所有 Token 都存储在浏览器存储中，需要配合 CSP 策略
- 敏感操作需要额外验证
- 定期轮换 Token

### 3. CSRF 防护

- 使用 SameSite Cookie 策略
- API 请求添加 CSRF Token
- 验证 Referer 头

### 4. 传输安全

- 仅在 HTTPS 环境下使用
- Token 传输加密
- 敏感信息不在 URL 中传递

## 📊 监控和调试

### 1. 日志记录

```typescript
// 请求日志
🚀 API Request: POST /api/auth/login
✅ API Response: 200 /api/auth/login

// 认证日志
🔄 Token expired, attempting refresh...
✅ Auth state initialized successfully
🚪 Received logout event: { reason: 'token_refresh_failed' }
```

### 2. 事件系统

```typescript
// 监听认证事件
window.addEventListener('auth:logout', handleLogout);
window.addEventListener('api:forbidden', showForbiddenMessage);
window.addEventListener('api:rate_limit', showRateLimitMessage);
```

### 3. 开发工具

- Pinia DevTools: 状态变化追踪
- Network Tab: 请求响应查看
- Console: 详细日志信息

## ⚡ 性能优化

### 1. Token 自动刷新

- 提前 5 分钟刷新 Token
- 避免用户感知的认证中断
- 智能重试机制

### 2. 请求队列管理

- Token 刷新期间暂存请求
- 避免重复刷新
- 批量重发失败请求

### 3. 缓存策略

- 用户信息缓存
- API 响应缓存
- 离线数据支持

## 🔧 配置和扩展

### 1. 环境配置

```typescript
// 开发环境
const config = {
  tokenExpiry: 60 * 60, // 1小时
  refreshThreshold: 5 * 60, // 提前5分钟
  apiBaseURL: '/api'
};

// 生产环境
const config = {
  tokenExpiry: 2 * 60 * 60, // 2小时
  refreshThreshold: 10 * 60, // 提前10分钟
  apiBaseURL: 'https://api.yourdomain.com'
};
```

### 2. 自定义扩展

```typescript
// 扩展 TokenManager
export class CustomTokenManager extends TokenManager {
  static encryptToken(token: string): string {
    // 自定义加密逻辑
  }
}

// 扩展拦截器
export class CustomApiInterceptor extends ApiInterceptor {
  protected handleCustomError(error: any): void {
    // 自定义错误处理
  }
}
```

## 📋 检查清单

### 实施检查

- [ ] TokenManager 服务实现
- [ ] Axios 拦截器配置
- [ ] Pinia Store 设置
- [ ] 业务服务层完成
- [ ] 应用初始化逻辑
- [ ] 路由守卫配置
- [ ] 错误处理机制
- [ ] 日志记录系统

### 安全检查

- [ ] HTTPS 强制使用
- [ ] XSS 防护措施
- [ ] CSRF 防护配置
- [ ] Token 过期处理
- [ ] 敏感信息保护
- [ ] 安全头配置

### 性能检查

- [ ] Token 自动刷新
- [ ] 请求队列优化
- [ ] 缓存策略实施
- [ ] 内存泄漏检查
- [ ] 网络请求优化

## 🎯 最佳实践总结

1. **分层架构**: Store 只管状态，Service 处理业务，Composable 协调交互
2. **安全优先**: 多重防护，定期轮换，加密传输
3. **用户体验**: 自动刷新，无感知登录，智能重试
4. **可维护性**: 模块化设计，类型安全，完善日志
5. **性能优化**: 缓存策略，请求优化，内存管理

这套方案提供了完整的 Token 管理解决方案，兼顾了安全性、性能和用户体验。
