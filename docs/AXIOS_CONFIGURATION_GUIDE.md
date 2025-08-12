# Axios 配置架构指南

## 目录

- [问题分析](#问题分析)
- [推荐架构](#推荐架构)
- [实现方案](#实现方案)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)

## 问题分析

### 当前配置的问题

你现在的配置方式确实有一些问题：

1. **直接修改全局axios.defaults**：这会影响整个应用中所有axios实例，包括第三方库使用的axios
2. **缺乏模块化**：不同模块无法有自己的独特配置
3. **配置重复**：存在多个axios配置文件（`shared/axios/index.ts` 和 `plugins/axios.ts`）
4. **初始化时机问题**：`localStorage.getItem('auth_token')` 在模块加载时就执行了，无法动态获取

### 理想的架构

```
全局基础配置 (Base Config)
├── 模块A专用配置 (Module A Config)
├── 模块B专用配置 (Module B Config)
└── 模块C专用配置 (Module C Config)
```

## 推荐架构

### 1. 基础配置层 (Base Layer)

创建一个基础配置工厂，提供默认的axios配置：

```typescript
// src/shared/http/base-config.ts
import type { AxiosRequestConfig } from 'axios';

export interface HttpConfig extends AxiosRequestConfig {
  // 可以扩展自定义配置
  enableAuth?: boolean;
  enableLogging?: boolean;
  retryCount?: number;
}

export const baseConfig: HttpConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  enableAuth: true,
  enableLogging: import.meta.env.DEV,
  retryCount: 3,
};
```

### 2. 拦截器管理层 (Interceptor Layer)

统一管理所有拦截器逻辑：

```typescript
// src/shared/http/interceptors.ts
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/auth'; // 假设你有auth store

export interface InterceptorConfig {
  enableAuth?: boolean;
  enableLogging?: boolean;
  enableRetry?: boolean;
  onAuthFail?: () => void;
}

export class HttpInterceptors {
  private instance: AxiosInstance;
  private config: InterceptorConfig;

  constructor(instance: AxiosInstance, config: InterceptorConfig = {}) {
    this.instance = instance;
    this.config = {
      enableAuth: true,
      enableLogging: true,
      enableRetry: true,
      ...config,
    };
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.setupRequestInterceptors();
    this.setupResponseInterceptors();
  }

  private setupRequestInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        // 认证拦截器
        if (this.config.enableAuth) {
          const token = this.getAuthToken();
          if (token) {
            config.headers.Authorization = \`Bearer \${token}\`;
          }
        }

        // 日志拦截器
        if (this.config.enableLogging) {
          console.log('🚀 Request:', {
            url: config.url,
            method: config.method,
            headers: config.headers,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );
  }

  private setupResponseInterceptors() {
    this.instance.interceptors.response.use(
      (response) => {
        if (this.config.enableLogging) {
          console.log('✅ Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      async (error) => {
        if (this.config.enableLogging) {
          console.error('❌ Response Error:', error);
        }

        // 401错误处理
        if (error.response?.status === 401 && this.config.enableAuth) {
          this.handleAuthError();
        }

        // 重试逻辑
        if (this.config.enableRetry && this.shouldRetry(error)) {
          return this.retry(error.config);
        }

        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // 这里可以从store、localStorage或其他地方获取token
    try {
      const authStore = useAuthStore();
      return authStore.token || localStorage.getItem('auth_token');
    } catch {
      return localStorage.getItem('auth_token');
    }
  }

  private handleAuthError() {
    if (this.config.onAuthFail) {
      this.config.onAuthFail();
    } else {
      // 默认处理
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  }

  private shouldRetry(error: any): boolean {
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  }

  private async retry(config: AxiosRequestConfig): Promise<any> {
    const retryCount = config._retryCount || 0;
    const maxRetries = this.config.enableRetry ? 3 : 0;

    if (retryCount >= maxRetries) {
      throw new Error('Max retries exceeded');
    }

    config._retryCount = retryCount + 1;

    // 延迟重试
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));

    return this.instance.request(config);
  }
}
```

### 3. HTTP客户端工厂 (Factory Layer)

创建不同配置的axios实例：

```typescript
// src/shared/http/http-factory.ts
import axios, { type AxiosInstance } from 'axios';
import { baseConfig, type HttpConfig } from './base-config';
import { HttpInterceptors, type InterceptorConfig } from './interceptors';

export class HttpFactory {
  private static instances = new Map<string, AxiosInstance>();

  static create(
    name: string,
    config: Partial<HttpConfig> = {},
    interceptorConfig: InterceptorConfig = {},
  ): AxiosInstance {
    // 如果已存在相同名称的实例，返回缓存的实例
    if (this.instances.has(name)) {
      return this.instances.get(name)!;
    }

    // 合并配置
    const finalConfig = this.mergeConfig(baseConfig, config);

    // 创建axios实例
    const instance = axios.create(finalConfig);

    // 设置拦截器
    new HttpInterceptors(instance, interceptorConfig);

    // 缓存实例
    this.instances.set(name, instance);

    return instance;
  }

  private static mergeConfig(base: HttpConfig, override: Partial<HttpConfig>): HttpConfig {
    return {
      ...base,
      ...override,
      headers: {
        ...base.headers,
        ...override.headers,
      },
    };
  }

  static getInstance(name: string): AxiosInstance | undefined {
    return this.instances.get(name);
  }

  static getAllInstances(): Map<string, AxiosInstance> {
    return new Map(this.instances);
  }
}
```

### 4. 预定义实例 (Predefined Instances)

为常用场景预定义实例：

```typescript
// src/shared/http/instances.ts
import { HttpFactory } from './http-factory';

// 主API实例 - 需要认证
export const apiClient = HttpFactory.create(
  'api',
  {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  },
  {
    enableAuth: true,
    enableLogging: true,
    enableRetry: true,
  },
);

// 公共API实例 - 不需要认证
export const publicApiClient = HttpFactory.create(
  'public-api',
  {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  },
  {
    enableAuth: false,
    enableLogging: true,
    enableRetry: true,
  },
);

// 文件上传实例 - 特殊配置
export const uploadClient = HttpFactory.create(
  'upload',
  {
    baseURL: import.meta.env.VITE_UPLOAD_BASE_URL || 'http://localhost:3000/api/v1',
    timeout: 60000, // 60秒超时
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  },
  {
    enableAuth: true,
    enableLogging: true,
    enableRetry: false, // 文件上传不重试
  },
);

// 外部服务实例
export const externalApiClient = HttpFactory.create(
  'external',
  {
    baseURL: 'https://api.external-service.com',
    timeout: 5000,
  },
  {
    enableAuth: false,
    enableLogging: false,
    enableRetry: true,
  },
);
```

## 实现方案

### 1. 更新你的ApiClient

现在可以简化你的ApiClient：

```typescript
// src/modules/account/infrastructure/api/ApiClient.ts
import type { AxiosInstance } from 'axios';
import { apiClient } from '../../../../shared/http/instances';
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto,
} from '../../application/dtos/UserDtos';
import type { TResponse } from '../../../../shared/types/response';

export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // 使用预定义的API客户端实例
    this.client = apiClient;
  }

  async testConnection(): Promise<TResponse<string>> {
    const response = await this.client.get('/health');
    return response.data;
  }

  async createAccount(accountData: CreateAccountDto): Promise<TResponse<AccountResponseDto>> {
    const response = await this.client.post('/users/register', accountData);
    return response.data;
  }
}
```

### 2. 特殊模块配置

如果某个模块需要特殊配置，可以创建专用实例：

```typescript
// src/modules/payment/infrastructure/api/PaymentApiClient.ts
import { HttpFactory } from '../../../../shared/http/http-factory';

export class PaymentApiClient {
  private client = HttpFactory.create(
    'payment',
    {
      baseURL: import.meta.env.VITE_PAYMENT_API_URL || 'https://api.payment.com',
      timeout: 30000, // 支付接口需要更长超时
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Version': '2.0',
      },
    },
    {
      enableAuth: true,
      enableLogging: true,
      enableRetry: false, // 支付接口不能重试
      onAuthFail: () => {
        // 支付模块的特殊认证失败处理
        console.error('Payment auth failed');
      },
    },
  );

  async processPayment(data: PaymentData) {
    const response = await this.client.post('/payments', data);
    return response.data;
  }
}
```

## 使用示例

### 基本使用

```typescript
import { apiClient, publicApiClient, uploadClient } from '@/shared/http/instances';

// 使用主API客户端
const userResponse = await apiClient.get('/users/me');

// 使用公共API客户端（无需认证）
const publicData = await publicApiClient.get('/public/config');

// 使用上传客户端
const formData = new FormData();
formData.append('file', file);
const uploadResponse = await uploadClient.post('/upload', formData);
```

### 动态创建实例

```typescript
import { HttpFactory } from '@/shared/http/http-factory';

// 为特殊需求动态创建实例
const specialClient = HttpFactory.create(
  'special',
  {
    baseURL: 'https://special-api.com',
    timeout: 5000,
  },
  {
    enableAuth: false,
    enableLogging: false,
  },
);
```

## 最佳实践

### 1. 实例命名规范

- 使用描述性名称：`api`, `public-api`, `upload`, `payment`
- 避免创建过多实例，优先复用现有实例
- 使用kebab-case命名

### 2. 配置管理

- 所有配置项应该有环境变量支持
- 敏感配置不要硬编码
- 为不同环境提供不同的默认值

### 3. 错误处理

- 统一错误格式
- 提供模块级别的错误处理覆盖
- 记录关键错误日志

### 4. 性能优化

- 实例复用，避免重复创建
- 合理设置超时时间
- 只在需要时启用重试机制

### 5. 测试支持

```typescript
// src/shared/http/__tests__/http-factory.test.ts
import { HttpFactory } from '../http-factory';

// 为测试环境创建mock实例
export const createMockClient = () => {
  return HttpFactory.create(
    'test',
    {
      baseURL: 'http://localhost:3001',
      timeout: 1000,
    },
    {
      enableAuth: false,
      enableLogging: false,
      enableRetry: false,
    },
  );
};
```

## 迁移指南

### 从当前配置迁移

1. **保留现有的全局配置作为基础配置**
2. **创建工厂方法替换直接的axios实例创建**
3. **逐步迁移各模块的ApiClient使用新的实例**
4. **测试确保所有功能正常**

### 迁移步骤

1. 创建上述文件结构
2. 更新你的ApiClient使用新的实例
3. 测试连接功能
4. 逐步迁移其他模块
5. 删除旧的配置文件

这样的架构既保持了全局配置的便利性，又提供了模块级别的灵活性，是一个更加可维护和可扩展的解决方案。
