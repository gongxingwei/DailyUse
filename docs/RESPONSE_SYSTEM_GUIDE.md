# 响应系统 (Response System)

这是一套完整的API响应系统，提供统一的响应格式、错误处理和状态管理。

## 架构设计

- **`packages/contracts`**: 响应类型定义，所有数据类型以该处为准
- **`packages/utils`**: 响应构建工具和Express集成助手

## 核心特性

### ✅ 统一的响应格式
- 标准化的成功和错误响应结构
- 详细的响应元数据（请求ID、时间戳、处理时长等）
- 支持分页、批量操作等复杂场景

### ✅ 丰富的错误处理
- 多种错误类型（客户端错误、服务器错误、业务错误）
- 详细的错误信息和字段级验证错误
- 错误严重级别分类
- 可选的调试信息（开发环境）

### ✅ HTTP状态码映射
- 自动将响应状态映射到正确的HTTP状态码
- 支持自定义状态码映射

### ✅ Express框架集成
- 便捷的Express响应助手
- 可选的中间件集成
- 类型安全的响应方法

## 安装和配置

```bash
# 安装依赖包
pnpm add @dailyuse/contracts @dailyuse/utils
```

## 基础使用

### 1. 创建响应构建器

```typescript
import { createResponseBuilder } from '@dailyuse/utils';

const responseBuilder = createResponseBuilder({
  requestId: 'req-123',
  version: '1.0.0',
  includeDebug: process.env.NODE_ENV === 'development'
});
```

### 2. 成功响应

```typescript
// 简单成功响应
const response = responseBuilder.success(
  { id: 1, name: '用户' }, 
  '获取用户成功'
);

// 列表响应
const listResponse = responseBuilder.list(
  users,
  {
    page: 1,
    pageSize: 20,
    total: 100,
    totalPages: 5,
    hasNext: true,
    hasPrev: false
  },
  '获取用户列表成功'
);
```

### 3. 错误响应

```typescript
// 请求参数错误
const badRequest = responseBuilder.badRequest('请求参数错误', [
  {
    field: 'email',
    code: 'INVALID_EMAIL',
    message: '邮箱格式不正确',
    value: 'invalid-email'
  }
]);

// 业务逻辑错误
const businessError = responseBuilder.businessError(
  '用户账户余额不足',
  'INSUFFICIENT_BALANCE'
);

// 内部服务器错误
const internalError = responseBuilder.internalError(
  '数据库连接失败',
  { stack: error.stack }
);
```

## Express 集成

### 方式一：响应助手

```typescript
import { createExpressResponseHelper, createResponseBuilder } from '@dailyuse/utils';

app.get('/users/:id', async (req, res) => {
  const responseHelper = createExpressResponseHelper(
    res,
    createResponseBuilder({
      requestId: req.headers['x-request-id'],
      startTime: Date.now()
    })
  );

  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return responseHelper.notFound('用户不存在');
    }
    
    return responseHelper.success(user, '获取用户成功');
  } catch (error) {
    return responseHelper.internalError('服务器内部错误', error);
  }
});
```

### 方式二：中间件（待实现）

```typescript
import { responseMiddleware } from '@dailyuse/utils';

app.use(responseMiddleware({
  version: '1.0.0',
  includeDebug: process.env.NODE_ENV === 'development'
}));

app.get('/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    return res.apiSuccess(user, '获取用户成功');
  } catch (error) {
    return res.apiInternalError('服务器内部错误');
  }
});
```

## 响应格式

### 成功响应格式

```typescript
{
  "status": "SUCCESS",
  "success": true,
  "message": "操作成功",
  "data": { /* 响应数据 */ },
  "pagination": { /* 分页信息（可选） */ },
  "metadata": {
    "requestId": "uuid-123",
    "timestamp": 1234567890,
    "version": "1.0.0",
    "duration": 150,
    "nodeId": "server-01"
  }
}
```

### 错误响应格式

```typescript
{
  "status": "VALIDATION_ERROR",
  "success": false,
  "message": "数据验证失败",
  "severity": "warning",
  "errorCode": "INVALID_DATA",
  "errors": [
    {
      "field": "email",
      "code": "INVALID_EMAIL",
      "message": "邮箱格式不正确",
      "value": "invalid-email"
    }
  ],
  "debug": { /* 调试信息（仅开发环境） */ },
  "metadata": { /* 同成功响应 */ }
}
```

## 响应状态码

| 状态码 | HTTP状态码 | 说明 |
|--------|------------|------|
| SUCCESS | 200 | 操作成功 |
| BAD_REQUEST | 400 | 请求参数错误 |
| UNAUTHORIZED | 401 | 未授权 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源未找到 |
| VALIDATION_ERROR | 422 | 数据验证失败 |
| CONFLICT | 409 | 资源冲突 |
| INTERNAL_ERROR | 500 | 内部服务器错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |
| DATABASE_ERROR | 500 | 数据库错误 |
| EXTERNAL_SERVICE_ERROR | 502 | 外部服务错误 |
| BUSINESS_ERROR | 400 | 业务逻辑错误 |
| DOMAIN_ERROR | 400 | 领域错误 |

## 错误严重级别

- **INFO**: 信息级别
- **WARNING**: 警告级别
- **ERROR**: 错误级别
- **CRITICAL**: 严重错误级别

## 高级用法

### 批量操作响应

```typescript
const batchResult = {
  successCount: 8,
  failureCount: 2,
  totalCount: 10,
  successes: [/* 成功的项目 */],
  failures: [
    {
      item: { id: 3, name: '用户3' },
      error: {
        code: 'DUPLICATE_EMAIL',
        message: '邮箱已存在'
      }
    }
  ]
};

const batchResponse = responseBuilder.batch(batchResult, '批量创建用户完成');
```

### 自定义错误响应

```typescript
const customError = responseBuilder.error(
  ResponseStatus.BUSINESS_ERROR,
  '自定义业务错误',
  {
    errorCode: 'CUSTOM_ERROR',
    severity: ResponseSeverity.WARNING,
    errors: [/* 详细错误信息 */],
    debug: { /* 调试信息 */ }
  }
);
```

## 迁移指南

### 从旧的 TResponse 迁移

**旧版本:**
```typescript
type TResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};
```

**新版本:**
```typescript
// 成功响应
const response = responseBuilder.success(data, message);

// 错误响应
const error = responseBuilder.badRequest(message);
```

### 更新现有的Express路由

**旧版本:**
```typescript
return res.json({ success: true, message: 'ok', data: user });
```

**新版本:**
```typescript
const helper = createExpressResponseHelper(res);
return helper.success(user, '获取用户成功');
```

## 类型定义

所有类型定义都在 `@dailyuse/contracts` 包中：

```typescript
import {
  type ApiResponse,
  type SuccessResponse,
  type ApiErrorResponse,
  type ResponseBuilderOptions,
  type ErrorDetail,
  type PaginationInfo,
  ResponseStatus,
  ResponseSeverity
} from '@dailyuse/contracts';
```

## 注意事项

1. **包依赖**: `@dailyuse/utils` 依赖于 `@dailyuse/contracts`
2. **Express集成**: Express类型定义是可选的，使用Express集成时需要安装 `@types/express`
3. **调试信息**: 只在开发环境下包含调试信息，生产环境会自动过滤
4. **请求ID**: 建议在每个请求中传递唯一的请求ID用于链路追踪

## 示例代码

查看 `packages/utils/src/response/examples.ts` 文件获取更多使用示例。
