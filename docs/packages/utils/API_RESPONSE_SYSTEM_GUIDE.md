# API 响应系统使用指南

本文档详细说明了项目中统一的 API 响应格式及其使用方法。

## 目录

- [概述](#概述)
- [响应结构](#响应结构)
- [响应代码](#响应代码)
- [后端使用](#后端使用)
- [前端使用](#前端使用)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)
- [迁移指南](#迁移指南)

---

## 概述

为了提供一致的 API 体验，项目采用了统一的响应格式。所有 API 响应都遵循相同的结构，使用数字状态码（类似 HTTP），并通过 `success` 字段明确标识成功或失败。

### 核心特性

- ✅ **统一结构**：所有 API 响应使用相同的格式
- ✅ **类型安全**：完整的 TypeScript 类型支持
- ✅ **自动映射**：ResponseCode 自动映射到 HTTP 状态码
- ✅ **链路追踪**：支持 traceId 用于请求跟踪
- ✅ **前端友好**：Axios 拦截器自动提取 data 字段

---

## 响应结构

### 成功响应

```typescript
{
  code: 200,                    // 响应代码（ResponseCode 枚举）
  success: true,                // 成功标识
  message: "操作成功",          // 提示消息
  data: { ... },                // 业务数据（类型 T）
  timestamp: 1704067200000,     // 时间戳（毫秒）
  traceId?: "trace-xxx",        // 可选的链路追踪 ID
  pagination?: {                // 可选的分页信息
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

### 错误响应

```typescript
{
  code: 400,                    // 错误代码（ResponseCode 枚举）
  success: false,               // 失败标识
  message: "请求参数错误",      // 错误消息
  timestamp: 1704067200000,     // 时间戳（毫秒）
  traceId?: "trace-xxx",        // 可选的链路追踪 ID
  errorCode?: "INVALID_INPUT",  // 可选的业务错误代码
  errors?: [                    // 可选的详细错误列表
    {
      code: "REQUIRED",
      field: "email",
      message: "邮箱不能为空",
      constraints?: {
        isEmail: "必须是有效的邮箱地址"
      }
    }
  ],
  debug?: {                     // 开发环境调试信息
    stack: "...",
    environment: "development"
  }
}
```

---

## 响应代码

### ResponseCode 枚举

```typescript
export enum ResponseCode {
  // 成功响应
  SUCCESS = 200,

  // 客户端错误 (4xx)
  BAD_REQUEST = 400, // 请求参数错误
  UNAUTHORIZED = 401, // 未授权
  FORBIDDEN = 403, // 禁止访问
  NOT_FOUND = 404, // 资源不存在
  CONFLICT = 409, // 资源冲突
  VALIDATION_ERROR = 422, // 验证错误
  TOO_MANY_REQUESTS = 429, // 请求过于频繁

  // 服务器错误 (5xx)
  INTERNAL_ERROR = 500, // 服务器内部错误
  BAD_GATEWAY = 502, // 网关错误
  SERVICE_UNAVAILABLE = 503, // 服务不可用
  GATEWAY_TIMEOUT = 504, // 网关超时

  // 业务错误 (1xxx)
  BUSINESS_ERROR = 1000, // 通用业务错误
  DOMAIN_ERROR = 1001, // 领域逻辑错误
  EXTERNAL_SERVICE_ERROR = 1002, // 外部服务错误
  DATABASE_ERROR = 1003, // 数据库错误
}
```

### HTTP 状态码映射

ResponseCode 会自动映射到对应的 HTTP 状态码：

```typescript
import { getHttpStatusCode } from '@dailyuse/contracts';

getHttpStatusCode(ResponseCode.SUCCESS); // 200
getHttpStatusCode(ResponseCode.VALIDATION_ERROR); // 422
getHttpStatusCode(ResponseCode.BUSINESS_ERROR); // 400
```

---

## 后端使用

### 基本用法

在 Express 路由中使用响应工具函数：

```typescript
import * as Response from '@/shared/utils/response';
import type { Request, Response } from 'express';

// 成功响应
router.get('/users/:id', async (req: Request, res: Response) => {
  const user = await getUserById(req.params.id);
  return Response.ok(res, user, '获取用户信息成功');
});

// 带分页的列表响应
router.get('/users', async (req: Request, res: Response) => {
  const { items, total } = await getUsers(req.query);
  const pagination = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    total,
    totalPages: Math.ceil(total / (Number(req.query.limit) || 20)),
  };

  return Response.list(res, items, pagination, '获取用户列表成功');
});

// 创建资源
router.post('/users', async (req: Request, res: Response) => {
  const user = await createUser(req.body);
  return Response.created(res, user, '用户创建成功');
});
```

### 错误响应

```typescript
// 404 - 资源不存在
router.get('/users/:id', async (req: Request, res: Response) => {
  const user = await getUserById(req.params.id);

  if (!user) {
    return Response.notFound(res, '用户不存在');
  }

  return Response.ok(res, user);
});

// 400 - 请求参数错误
router.post('/users', async (req: Request, res: Response) => {
  if (!req.body.email) {
    return Response.badRequest(res, '邮箱不能为空');
  }

  const user = await createUser(req.body);
  return Response.created(res, user);
});

// 422 - 验证错误（带详细错误信息）
router.post('/users', async (req: Request, res: Response) => {
  const errors = validateUserInput(req.body);

  if (errors.length > 0) {
    return Response.validationError(res, '输入数据验证失败', errors);
  }

  const user = await createUser(req.body);
  return Response.created(res, user);
});

// 409 - 资源冲突
router.post('/users', async (req: Request, res: Response) => {
  const existingUser = await findUserByEmail(req.body.email);

  if (existingUser) {
    return Response.conflict(res, '该邮箱已被注册');
  }

  const user = await createUser(req.body);
  return Response.created(res, user);
});

// 401 - 未授权
router.get('/profile', async (req: Request, res: Response) => {
  if (!req.user) {
    return Response.unauthorized(res, '请先登录');
  }

  return Response.ok(res, req.user);
});

// 403 - 禁止访问
router.delete('/users/:id', async (req: Request, res: Response) => {
  if (!req.user?.isAdmin) {
    return Response.forbidden(res, '只有管理员可以删除用户');
  }

  await deleteUser(req.params.id);
  return Response.ok(res, null, '用户删除成功');
});
```

### 业务错误

```typescript
// 业务逻辑错误（返回 400 HTTP，code 为 1000）
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const order = await createOrder(req.body);
    return Response.ok(res, order);
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return Response.businessError(res, '余额不足，无法创建订单', 'INSUFFICIENT_BALANCE', [
        {
          code: 'INSUFFICIENT_BALANCE',
          field: 'balance',
          message: '当前余额不足',
          value: error.currentBalance,
        },
      ]);
    }

    throw error; // 其他错误继续抛出
  }
});
```

### 错误处理中间件

```typescript
// 全局错误处理中间件
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('错误:', err);

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    return Response.error(res, err.message || '服务器内部错误', {
      stack: err.stack,
      message: err.message,
    });
  }

  // 生产环境返回通用错误
  return Response.error(res, '服务器内部错误');
});
```

### 可用的响应函数

| 函数                                               | HTTP 状态 | 响应代码 | 说明               |
| -------------------------------------------------- | --------- | -------- | ------------------ |
| `ok(res, data?, message?)`                         | 200       | 200      | 成功响应           |
| `created(res, data?, message?)`                    | 201       | 200      | 资源创建成功       |
| `list(res, data, pagination, message?)`            | 200       | 200      | 列表响应（带分页） |
| `badRequest(res, message, errors?)`                | 400       | 400      | 请求参数错误       |
| `unauthorized(res, message)`                       | 401       | 401      | 未授权             |
| `forbidden(res, message)`                          | 403       | 403      | 禁止访问           |
| `notFound(res, message)`                           | 404       | 404      | 资源不存在         |
| `conflict(res, message)`                           | 409       | 409      | 资源冲突           |
| `validationError(res, message, errors?)`           | 422       | 422      | 验证错误           |
| `businessError(res, message, errorCode?, errors?)` | 400       | 1000     | 业务错误           |
| `error(res, message, debug?)`                      | 500       | 500      | 服务器错误         |
| `serviceUnavailable(res, message)`                 | 503       | 503      | 服务不可用         |

---

## 前端使用

### Axios 自动处理

前端 Axios 拦截器会自动处理 API 响应：

1. **成功响应**：自动提取 `data` 字段
2. **错误响应**：自动抛出异常，包含 `message`

```typescript
import { apiClient } from '@/shared/api';

// GET 请求
const user = await apiClient.get<User>('/users/123');
// user 直接是 User 类型，不需要 user.data

// POST 请求
const newUser = await apiClient.post<User>('/users', {
  name: 'John',
  email: 'john@example.com',
});
// newUser 直接是 User 类型

// 列表请求（带分页）
const users = await apiClient.get<User[]>('/users', {
  params: { page: 1, limit: 20 },
});
// users 直接是 User[] 类型
```

### 错误处理

```typescript
import { apiClient } from '@/shared/api';
import type { ErrorResponse } from '@/shared/api/core/types';

try {
  const user = await apiClient.get<User>('/users/123');
  console.log('获取用户成功:', user);
} catch (error: any) {
  // error.response.data 是 ErrorResponse 类型
  const errorResponse = error.response?.data as ErrorResponse;

  console.error('错误代码:', errorResponse.code);
  console.error('错误消息:', errorResponse.message);

  // 处理验证错误
  if (errorResponse.code === 422 && errorResponse.errors) {
    errorResponse.errors.forEach((err) => {
      console.error(`字段 ${err.field}: ${err.message}`);
    });
  }

  // 处理业务错误
  if (errorResponse.code === 1000) {
    console.error('业务错误代码:', errorResponse.errorCode);
  }
}
```

### Vue Composable 使用

```typescript
import { useRequest } from '@/shared/api/composables/useRequest';

export function useUsers() {
  const { data, loading, error, execute } = useRequest<User[]>();

  const fetchUsers = async () => {
    await execute(() => apiClient.get<User[]>('/users'));
  };

  return {
    users: data,
    loading,
    error,
    fetchUsers,
  };
}

// 组件中使用
const { users, loading, error, fetchUsers } = useUsers();

onMounted(() => {
  fetchUsers();
});
```

### 类型导入

```typescript
import type {
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  ResponseCode,
  PaginationInfo,
  ErrorDetail,
} from '@/shared/api/core/types';

// 或者从 contracts
import type {
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  ResponseCode,
} from '@dailyuse/contracts';
```

---

## 错误处理

### 错误类型判断

```typescript
import { ResponseCode } from '@dailyuse/contracts';

if (errorResponse.code === ResponseCode.UNAUTHORIZED) {
  // 跳转到登录页
  router.push('/login');
}

if (errorResponse.code === ResponseCode.VALIDATION_ERROR) {
  // 显示验证错误
  showValidationErrors(errorResponse.errors);
}

if (errorResponse.code === ResponseCode.BUSINESS_ERROR) {
  // 处理业务错误
  handleBusinessError(errorResponse.errorCode);
}
```

### 全局错误处理

```typescript
// 在 Axios 配置中设置全局错误处理
const httpClient = createApiClient({
  errorHandler: (error) => {
    const errorResponse = error.response?.data as ErrorResponse;

    // 显示错误提示
    if (errorResponse?.message) {
      showNotification({
        type: 'error',
        message: errorResponse.message,
      });
    }

    // 特殊状态码处理
    if (errorResponse?.code === ResponseCode.UNAUTHORIZED) {
      // 清除登录状态，跳转到登录页
      authStore.logout();
      router.push('/login');
    }
  },
});
```

---

## 最佳实践

### 1. 始终使用响应工具函数

❌ **不推荐**：

```typescript
res.status(200).json({
  success: true,
  data: user,
  message: '获取成功',
});
```

✅ **推荐**：

```typescript
return Response.ok(res, user, '获取成功');
```

### 2. 提供清晰的错误消息

❌ **不推荐**：

```typescript
return Response.badRequest(res, '错误');
```

✅ **推荐**：

```typescript
return Response.badRequest(res, '邮箱格式不正确，请输入有效的邮箱地址');
```

### 3. 使用适当的错误代码

❌ **不推荐**（所有错误都返回 400）：

```typescript
if (!user) {
  return Response.badRequest(res, '用户不存在');
}
```

✅ **推荐**（使用 404）：

```typescript
if (!user) {
  return Response.notFound(res, '用户不存在');
}
```

### 4. 提供详细的验证错误

✅ **推荐**：

```typescript
const errors: ErrorDetail[] = [
  {
    code: 'REQUIRED',
    field: 'email',
    message: '邮箱不能为空',
  },
  {
    code: 'INVALID_FORMAT',
    field: 'email',
    message: '邮箱格式不正确',
    constraints: {
      isEmail: '必须是有效的邮箱地址',
    },
  },
];

return Response.validationError(res, '输入数据验证失败', errors);
```

### 5. 前端类型安全

✅ **推荐**：

```typescript
// 明确指定返回类型
const user = await apiClient.get<User>('/users/123');

// TypeScript 会自动推断 user 的类型为 User
console.log(user.name); // ✅ 类型安全
```

### 6. 统一的分页处理

✅ **推荐**：

```typescript
// 后端
const pagination: PaginationInfo = {
  page: Number(query.page) || 1,
  limit: Number(query.limit) || 20,
  total: totalCount,
  totalPages: Math.ceil(totalCount / limit),
};

return Response.list(res, items, pagination);

// 前端
const response = await apiClient.get<User[]>('/users', {
  params: { page: 1, limit: 20 },
});
// response 直接是 User[] 数组
// 分页信息在响应的 pagination 字段中
```

---

## 迁移指南

### 后端迁移

#### 步骤 1：导入响应工具

```typescript
// 旧代码
import { Response } from 'express';

// 新代码
import { Response } from 'express';
import * as ApiResponse from '@/shared/utils/response';
```

#### 步骤 2：替换响应代码

```typescript
// 旧代码
res.status(200).json({
  success: true,
  data: user,
});

// 新代码
return ApiResponse.ok(res, user);
```

```typescript
// 旧代码
res.status(404).json({
  success: false,
  message: '用户不存在',
});

// 新代码
return ApiResponse.notFound(res, '用户不存在');
```

```typescript
// 旧代码
res.status(422).json({
  success: false,
  message: '验证失败',
  errors: validationErrors,
});

// 新代码
return ApiResponse.validationError(res, '验证失败', validationErrors);
```

### 前端迁移

#### 步骤 1：更新类型导入

```typescript
// 旧代码
import type { BaseApiResponse } from '@/shared/api/core/types';

// 新代码
import type { ApiResponse, SuccessResponse, ErrorResponse } from '@/shared/api/core/types';
```

#### 步骤 2：更新响应处理

```typescript
// 旧代码
const response = await apiClient.get('/users');
const users = response.data; // 需要手动提取 data

// 新代码
const users = await apiClient.get<User[]>('/users'); // 自动提取 data
```

#### 步骤 3：更新错误处理

```typescript
// 旧代码
try {
  const user = await apiClient.get('/users/123');
} catch (error: any) {
  console.error(error.message);
}

// 新代码
try {
  const user = await apiClient.get<User>('/users/123');
} catch (error: any) {
  const errorResponse = error.response?.data as ErrorResponse;
  console.error('错误代码:', errorResponse.code);
  console.error('错误消息:', errorResponse.message);

  if (errorResponse.errors) {
    errorResponse.errors.forEach((err) => {
      console.error(`字段 ${err.field}: ${err.message}`);
    });
  }
}
```

---

## 常见问题

### Q: 为什么使用数字代码而不是字符串？

A: 数字代码（ResponseCode）与 HTTP 状态码保持一致，更加直观。同时支持业务错误代码（1000+），便于区分系统错误和业务错误。

### Q: `timestamp` 字段是什么格式？

A: `timestamp` 是毫秒级的 Unix 时间戳（number 类型），可以使用 `new Date(timestamp)` 转换为日期对象。

### Q: `traceId` 有什么用？

A: `traceId` 用于链路追踪，可以在日志中关联前后端请求，便于问题排查。在开发环境中会自动生成。

### Q: 如何处理分页？

A: 使用 `Response.list(res, items, pagination)` 返回列表数据，前端通过 Axios 拦截器自动提取 `data` 字段，分页信息在响应的 `pagination` 字段中。

### Q: 错误响应会自动抛出异常吗？

A: 是的，前端 Axios 拦截器会检查 `success` 字段，如果为 `false` 会自动抛出异常，你可以在 `try-catch` 中捕获。

### Q: 如何在响应中包含调试信息？

A: 在开发环境中，`Response.error()` 会自动包含调试信息。你也可以手动传递 `debug` 参数。

---

## 相关资源

- [TypeScript 类型定义](./packages/contracts/src/response/index.ts)
- [后端响应工具](./apps/api/src/shared/utils/response.ts)
- [前端拦截器](./apps/web/src/shared/api/core/interceptors.ts)
- [API 客户端](./apps/web/src/shared/api/core/client.ts)

---

**最后更新**: 2024-01-01
