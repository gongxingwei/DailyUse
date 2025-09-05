# API架构重构总结 - DDD模块化

## 重构概述

按照DDD（领域驱动设计）原则，将API服务从集中式管理重构为模块化管理，每个领域模块的API服务位于其`infrastructure/api`目录中。

## 重构前后对比

### 重构前 ❌
```
src/shared/api/services/
├── authService.ts        # 认证API服务
└── accountService.ts     # 账户API服务
```

### 重构后 ✅
```
src/modules/authentication/infrastructure/api/
└── ApiClient.ts          # AuthApiService + 兼容层

src/modules/account/infrastructure/api/
└── ApiClient.ts          # AccountApiService + 兼容层

src/shared/api/
├── core/                 # 核心API客户端
├── instances/            # 预配置实例
└── index.ts             # 仅导出核心工具
```

## 架构改进

### 1. 符合DDD原则
- **领域隔离**: 每个模块的API服务独立管理
- **基础设施层**: API客户端位于`infrastructure/api`
- **依赖方向**: 应用服务依赖基础设施，不跨模块依赖

### 2. 新的API服务类

#### 认证模块 (`modules/authentication/infrastructure/api/ApiClient.ts`)
```typescript
export class AuthApiService {
  static async login(data: LoginRequest): Promise<LoginResponse>
  static async logout(): Promise<void>
  static async refreshToken(data: RefreshTokenRequest): Promise<LoginResponse>
  static async getCurrentUser(): Promise<UserInfo>
  // ... 其他认证相关方法
}

// 向后兼容的旧API
export class ApiClient {
  async login(credentials: AuthByPasswordRequestDTO): Promise<TResponse<AuthResponseDTO>>
  // ... 兼容旧接口
}
```

#### 账户模块 (`modules/account/infrastructure/api/ApiClient.ts`)
```typescript
export class AccountApiService {
  static async register(data: RegistrationByUsernameAndPasswordRequestDTO): Promise<RegistrationResponseDTO>
  static async createAccount(data: CreateAccountRequest): Promise<AccountInfo>
  static async getAccountById(id: string): Promise<AccountInfo>
  // ... 其他账户相关方法
}

// 向后兼容的旧API
export class ApiClient {
  static async register(data: RegistrationByUsernameAndPasswordRequestDTO): Promise<TResponse<RegistrationResponseDTO>>
  // ... 兼容旧接口
}
```

### 3. 应用服务更新

#### 认证应用服务
```typescript
// 之前
constructor() {
  this.apiClient = new ApiClient();
}

async authenticate(request: AuthByPasswordForm): Promise<TResponse<AuthResponseDTO>> {
  const response = await this.apiClient.login(authRequest);
  // ...
}

// 现在
constructor() {
  // 不再需要实例化ApiClient
}

async authenticate(request: AuthByPasswordForm): Promise<TResponse<AuthResponseDTO>> {
  const response = await AuthApiService.loginCompat(authRequest);
  // ...
}
```

#### 账户应用服务
```typescript
// 之前
constructor() {
  this.accountApiClient = new ApiClient();
}

async register(accountData: RegistrationByUsernameAndPasswordRequestDTO): Promise<RegistrationResponseDTO> {
  const response = await this.accountApiClient.register(accountData);
  return response.data;
}

// 现在
constructor() {
  // 不再需要实例化ApiClient
}

async register(accountData: RegistrationByUsernameAndPasswordRequestDTO): Promise<RegistrationResponseDTO> {
  const response = await AccountApiService.register(accountData);
  return response; // 直接返回数据，无需.data
}
```

## 兼容性策略

### 1. 双API设计
- **新API**: 基于现代API客户端，类型安全，支持请求选项
- **旧API**: 保持原有接口签名，内部调用新API并转换格式

### 2. 渐进式迁移
- 保留旧的`ApiClient`类作为兼容层
- 应用服务优先使用新API
- 逐步移除旧API依赖

### 3. 类型兼容
```typescript
// 新API - 直接返回业务数据
static async login(data: LoginRequest): Promise<LoginResponse>

// 旧API - 返回包装格式
async login(credentials: AuthByPasswordRequestDTO): Promise<TResponse<AuthResponseDTO>>

// 内部转换
static async loginCompat(credentials: AuthByPasswordRequestDTO): Promise<TResponse<AuthResponseDTO>> {
  const result = await this.login(loginData);
  return {
    data: { /* 转换格式 */ },
    message: 'Login successful',
    success: true,
  };
}
```

## 核心基础设施保留

### shared/api 现在只包含
1. **核心API客户端** (`core/client.ts`)
2. **预配置实例** (`instances/index.ts`)
3. **拦截器管理** (`core/interceptors.ts`)
4. **类型定义** (`core/types.ts`)
5. **环境配置** (`core/config.ts`)

### 删除的文件
- ✅ `src/shared/api/services/authService.ts`
- ✅ `src/shared/api/services/accountService.ts`
- ✅ `src/shared/api/services/` 目录

## 使用指南

### 在应用服务中使用新API
```typescript
// 认证模块
import { AuthApiService } from '../../infrastructure/api/ApiClient';

// 账户模块  
import { AccountApiService } from '../../infrastructure/api/ApiClient';

// 使用静态方法，无需实例化
const result = await AuthApiService.login(data);
const account = await AccountApiService.getAccountById(id);
```

### 在组件中直接使用（如果需要）
```typescript
// 导入核心API客户端
import { api } from '@/shared/api';

// 或导入模块API服务
import { AuthApiService } from '@/modules/authentication/infrastructure/api/ApiClient';
```

## 架构优势

1. **领域独立**: 每个模块管理自己的API，减少跨模块依赖
2. **单一职责**: API服务专注于HTTP通信，不包含业务逻辑
3. **类型安全**: 基于新的API客户端系统，提供完整的TypeScript支持
4. **易于测试**: 静态方法便于mock和单元测试
5. **符合DDD**: 基础设施层明确分离，依赖方向正确

## 后续计划

1. **逐步移除兼容层**: 当所有调用迁移到新API后，删除旧的`ApiClient`
2. **添加更多模块**: 为其他领域模块（如goal、task等）创建类似的API服务
3. **完善错误处理**: 在模块级别添加特定的错误处理逻辑
4. **添加缓存策略**: 在模块级别实现适合的缓存机制

这次重构确保了API架构与DDD原则的一致性，为项目的长期维护和扩展奠定了良好基础。
