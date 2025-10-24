# API 响应系统快速参考

## 响应格式

### ✅ 成功响应

```typescript
{
  code: 200,
  success: true,
  message: "操作成功",
  data: { ... },
  timestamp: 1704067200000,
  traceId?: "trace-xxx",
  pagination?: { page, limit, total, totalPages }
}
```

### ❌ 错误响应

```typescript
{
  code: 400,
  success: false,
  message: "错误消息",
  timestamp: 1704067200000,
  traceId?: "trace-xxx",
  errorCode?: "BUSINESS_CODE",
  errors?: [{ code, field, message, value?, constraints? }],
  debug?: { stack, environment }
}
```

---

## 响应代码速查表

| 代码 | 常量                               | HTTP | 说明         |
| ---- | ---------------------------------- | ---- | ------------ |
| 200  | `ResponseCode.SUCCESS`             | 200  | 成功         |
| 400  | `ResponseCode.BAD_REQUEST`         | 400  | 请求参数错误 |
| 401  | `ResponseCode.UNAUTHORIZED`        | 401  | 未授权       |
| 403  | `ResponseCode.FORBIDDEN`           | 403  | 禁止访问     |
| 404  | `ResponseCode.NOT_FOUND`           | 404  | 资源不存在   |
| 409  | `ResponseCode.CONFLICT`            | 409  | 资源冲突     |
| 422  | `ResponseCode.VALIDATION_ERROR`    | 422  | 验证错误     |
| 429  | `ResponseCode.TOO_MANY_REQUESTS`   | 429  | 请求过于频繁 |
| 500  | `ResponseCode.INTERNAL_ERROR`      | 500  | 服务器错误   |
| 503  | `ResponseCode.SERVICE_UNAVAILABLE` | 503  | 服务不可用   |
| 1000 | `ResponseCode.BUSINESS_ERROR`      | 400  | 业务错误     |
| 1001 | `ResponseCode.DOMAIN_ERROR`        | 400  | 领域错误     |

---

## 后端使用

### 导入

```typescript
import * as Response from '@/shared/utils/response';
```

### 常用函数

#### ✅ 成功响应

```typescript
// 返回数据
Response.ok(res, data, '操作成功');

// 创建资源
Response.created(res, data, '创建成功');

// 返回列表（带分页）
Response.list(res, items, pagination, '获取列表成功');
```

#### ❌ 错误响应

```typescript
// 400 - 请求参数错误
Response.badRequest(res, '参数错误');

// 401 - 未授权
Response.unauthorized(res, '请先登录');

// 403 - 禁止访问
Response.forbidden(res, '权限不足');

// 404 - 资源不存在
Response.notFound(res, '资源不存在');

// 409 - 资源冲突
Response.conflict(res, '邮箱已被注册');

// 422 - 验证错误
Response.validationError(res, '验证失败', errors);

// 1000 - 业务错误
Response.businessError(res, '余额不足', 'INSUFFICIENT_BALANCE', errors);

// 500 - 服务器错误
Response.error(res, '服务器错误', debugInfo);

// 503 - 服务不可用
Response.serviceUnavailable(res, '服务维护中');
```

### 完整示例

```typescript
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id);

    if (!user) {
      return Response.notFound(res, '用户不存在');
    }

    return Response.ok(res, user, '获取用户成功');
  } catch (error: any) {
    return Response.error(res, error.message);
  }
});

router.post('/users', async (req: Request, res: Response) => {
  // 验证输入
  const errors = validateInput(req.body);
  if (errors.length > 0) {
    return Response.validationError(res, '验证失败', errors);
  }

  // 检查冲突
  const existing = await findByEmail(req.body.email);
  if (existing) {
    return Response.conflict(res, '邮箱已被注册');
  }

  const user = await createUser(req.body);
  return Response.created(res, user, '用户创建成功');
});
```

---

## 前端使用

### 导入

```typescript
import { apiClient } from '@/shared/api';
import { ResponseCode } from '@dailyuse/contracts';
import type { ErrorResponse } from '@/shared/api/core/types';
```

### 发起请求

```typescript
// GET - 自动提取 data
const user = await apiClient.get<User>('/users/123');

// POST
const newUser = await apiClient.post<User>('/users', data);

// PUT
const updated = await apiClient.put<User>('/users/123', data);

// DELETE
await apiClient.delete('/users/123');

// 带参数
const users = await apiClient.get<User[]>('/users', {
  params: { page: 1, limit: 20 },
});
```

### 错误处理

```typescript
try {
  const user = await apiClient.get<User>('/users/123');
} catch (err: any) {
  const error = err.response?.data as ErrorResponse;

  // 根据错误代码处理
  switch (error.code) {
    case ResponseCode.NOT_FOUND:
      console.log('用户不存在');
      break;

    case ResponseCode.VALIDATION_ERROR:
      // 显示验证错误
      error.errors?.forEach((e) => {
        console.log(`${e.field}: ${e.message}`);
      });
      break;

    case ResponseCode.UNAUTHORIZED:
      router.push('/login');
      break;

    case ResponseCode.BUSINESS_ERROR:
      console.log('业务错误:', error.errorCode);
      break;

    default:
      console.log('错误:', error.message);
  }
}
```

### Vue Composable 模式

```typescript
export function useUsers() {
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchUsers = async () => {
    loading.value = true;
    try {
      users.value = await apiClient.get<User[]>('/users');
    } catch (err: any) {
      error.value = err.response?.data?.message || '请求失败';
    } finally {
      loading.value = false;
    }
  };

  return { users, loading, error, fetchUsers };
}
```

---

## ErrorDetail 格式

### 验证错误示例

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
    value: 'invalid@',
    constraints: {
      isEmail: '必须是有效的邮箱地址',
    },
  },
  {
    code: 'OUT_OF_RANGE',
    field: 'age',
    message: '年龄必须在 0-150 之间',
    value: 200,
    constraints: {
      min: '0',
      max: '150',
    },
  },
];
```

---

## 常见错误代码

### 验证错误代码

- `REQUIRED` - 字段必填
- `INVALID_FORMAT` - 格式不正确
- `INVALID_LENGTH` - 长度不符合要求
- `OUT_OF_RANGE` - 超出范围
- `WEAK_PASSWORD` - 密码强度不足

### 业务错误代码

- `INSUFFICIENT_BALANCE` - 余额不足
- `INVALID_PRODUCT` - 商品无效
- `ORDER_ALREADY_DELIVERED` - 订单已发货
- `ACCOUNT_LOCKED` - 账户已锁定
- `QUOTA_EXCEEDED` - 配额已用尽

---

## 类型导入

### 从 contracts

```typescript
import type {
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  ResponseCode,
  ErrorDetail,
  PaginationInfo,
} from '@dailyuse/contracts';
```

### 从 API 核心

```typescript
import type {
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  ErrorDetail,
  PaginationInfo,
} from '@/shared/api/core/types';
```

---

## 工具函数

### 状态码工具

```typescript
import {
  getHttpStatusCode,
  isSuccessCode,
  isClientError,
  isServerError,
  isBusinessError,
  getResponseCodeMessage,
} from '@dailyuse/contracts';

// 获取 HTTP 状态码
getHttpStatusCode(ResponseCode.VALIDATION_ERROR); // 422

// 判断类型
isSuccessCode(200); // true
isClientError(400); // true
isServerError(500); // true
isBusinessError(1000); // true

// 获取默认消息
getResponseCodeMessage(404); // "资源不存在"
```

---

## 最佳实践

### ✅ 推荐

```typescript
// 后端：使用响应工具函数
return Response.ok(res, user);

// 前端：明确类型
const user = await apiClient.get<User>('/users/123');

// 错误处理：根据代码分类处理
if (error.code === ResponseCode.VALIDATION_ERROR) {
  showValidationErrors(error.errors);
}
```

### ❌ 避免

```typescript
// 后端：不要手动构造响应
res.json({ success: true, data: user });

// 前端：不要忽略类型
const user = await apiClient.get('/users/123');

// 错误处理：不要忽略错误代码
console.log(error.message); // 丢失了错误分类信息
```

---

## 相关文档

- [完整使用指南](API_RESPONSE_SYSTEM_GUIDE.md)
- [示例代码](api-response-examples.md)
- [类型定义](../packages/contracts/src/response/index.ts)

---

**提示**: 将此文件加入书签，随时查阅！
