# 前端API系统迁移总结

## 项目背景

DailyUse 项目从简单的 Electron + Vue3 架构扩展为 monorepo 架构，包含 web 端和 API 端。在这个过程中，我们需要统一前后端的类型定义和API调用方式。

## 当前API系统架构

### 1. 类型定义层次（packages/contracts）

```
packages/contracts/src/
├── core/                     # 核心类型定义（权威来源）
│   ├── authentication.ts    # 认证相关核心类型
│   ├── account.ts           # 账户相关核心类型
│   └── ...
├── frontend/                # 前端扩展类型
│   └── api.ts              # 前端API响应封装和扩展
└── backend/                # 后端扩展类型（未来）
    └── ...
```

#### 核心设计原则：
- **contracts** 作为类型中心，所有类型以此为准
- **core** 包含权威的业务类型定义
- **frontend/backend** 提供特定环境的扩展和封装

### 2. 新API客户端系统（apps/web/src/shared/api）

```
apps/web/src/shared/api/
├── core/                    # 核心API客户端实现
│   ├── client.ts           # 主要的ApiClient类
│   ├── types.ts            # API客户端类型定义
│   ├── config.ts           # 环境配置
│   └── interceptors.ts     # 请求/响应拦截器
├── instances/              # 预配置的客户端实例
│   └── index.ts           # api, publicApiClient, uploadClient等
├── services/               # 业务API服务
│   ├── authService.ts     # 认证相关API
│   └── accountService.ts  # 账户相关API
└── composables/           # Vue组合式API（未来）
    └── useAuth.ts
```

### 3. 旧系统（即将废弃）

- `apps/web/src/shared/axios/index.ts` - 旧的axios配置，已标记废弃
- 各模块中的独立ApiClient类 - 逐步迁移到统一API服务

## API响应格式标准化

### 1. 后端响应封装格式

所有API响应都采用统一的封装格式：

```typescript
// 成功响应
interface SuccessResponse<T> {
  status: 'success';
  message?: string;
  data: T;                    // 实际业务数据
  timestamp: string;
  path?: string;
}

// 错误响应  
interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  errors?: Array<{           // 验证错误详情
    field: string;
    message: string;
    code?: string;
  }>;
  timestamp: string;
  path?: string;
}
```

### 2. 类型重用策略

#### 认证模块示例：

```typescript
// core/authentication.ts - 核心类型
export interface UserInfoDTO {
  id: string;
  uuid: string;
  username: string;
  email: string;
  // ...
}

export interface LoginResponseDTO {
  user: UserInfoDTO;
  accessToken: string;
  refreshToken: string;
  // ...
}

// frontend/api.ts - 前端扩展
export const FrontendLoginResponseSchema = z.object({
  user: FrontendUserInfoSchema,
  accessToken: z.string(),
  // ...
});

export type FrontendLoginResponse = LoginResponseDTO; // 重用核心类型

// 带封装的完整响应类型
export type FrontendLoginSuccessResponse = SuccessResponse<FrontendLoginResponse>;
```

## 迁移指南

### 1. API调用方式迁移

#### 旧方式（即将废弃）：
```typescript
import duAxios from '@/shared/axios';

// 手动处理认证和响应提取
const response = await duAxios.post('/auth/login', data);
const result = response.data;
```

#### 新方式（推荐）：
```typescript
import { AuthService } from '@/shared/api';

// 自动处理认证、响应提取和类型安全
const loginResult = await AuthService.login(data);
```

### 2. 类型导入策略

#### 核心类型（权威来源）：
```typescript
import { UserInfoDTO, LoginResponseDTO } from '@dailyuse/contracts';
```

#### 前端扩展类型：
```typescript
import { 
  FrontendLoginResponse, 
  FrontendLoginSuccessResponse 
} from '@dailyuse/contracts';
```

#### API服务：
```typescript
import { AuthService, AccountService } from '@/shared/api';
```

## 当前状态和待办事项

### ✅ 已完成
- [x] 统一的API响应格式定义
- [x] 核心类型定义整理
- [x] 新API客户端系统实现
- [x] 认证和账户API服务封装
- [x] 旧axios配置标记废弃

### 🔄 进行中
- [ ] 模块中的旧ApiClient迁移到新API服务
- [ ] 完善错误处理和重试机制
- [ ] 添加更多业务API服务

### 📋 待办事项
- [ ] 实现Vue组合式API（useAuth, useAccount等）
- [ ] 添加API调用缓存机制
- [ ] 完善API日志和监控
- [ ] 编写单元测试
- [ ] 完整移除旧的axios配置

## 最佳实践

### 1. 类型定义
- 在 `packages/contracts` 中定义权威类型
- 优先从核心类型重用，避免重复定义
- 使用 Zod schema 提供运行时验证

### 2. API调用
- 使用预配置的API服务而非直接调用客户端
- 遵循统一的错误处理模式
- 利用TypeScript类型检查确保类型安全

### 3. 响应处理
- 后端始终返回封装格式的响应
- 前端API服务自动提取 `data` 字段
- 统一处理错误和加载状态

## 架构优势

1. **类型安全**: 前后端共享类型定义，避免类型不匹配
2. **代码复用**: 核心类型定义一次，多处使用
3. **维护性**: 统一的API调用方式，便于维护和升级
4. **可扩展性**: 清晰的分层架构，易于添加新功能
5. **开发体验**: 完整的TypeScript支持和IDE智能提示

这个新的API系统为项目的长期发展奠定了坚实的基础，支持从简单的Electron应用到复杂的Web应用的平滑过渡。
