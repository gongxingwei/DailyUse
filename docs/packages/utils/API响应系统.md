# API 响应系统

> **位置**: `packages/contracts/src/response` + `packages/utils/src/response`  
> **适用范围**: API 项目（后端）、Web 项目（前端）  
> **依赖**: 无

---

## 📋 概述

DailyUse 的 API 响应系统提供统一的 RESTful API 响应格式,确保前后端的类型安全和一致性。系统包含类型定义、响应构建器、HTTP 状态码映射和 Express 辅助函数。

### 核心特性

- ✅ **统一格式**: 所有 API 使用相同的响应结构
- ✅ **类型安全**: 完整的 TypeScript 泛型支持
- ✅ **自动映射**: ResponseCode → HTTP 状态码
- ✅ **前端友好**: Axios 拦截器自动提取 data
- ✅ **链路追踪**: 支持 traceId
- ✅ **分页支持**: 内置分页信息结构

---

## 🏗️ 架构设计

### 核心组件

```
┌──────────────────────────────────────┐
│  @dailyuse/contracts (类型定义)      │
│  - ResponseCode (枚举)                │
│  - ApiResponse<T> (泛型接口)          │
│  - SuccessResponse<T>                 │
│  - ErrorResponse                      │
│  - getHttpStatusCode()                │
└──────────────┬───────────────────────┘
               │
        ┌──────┴──────┐
        ↓             ↓
┌──────────────┐  ┌──────────────┐
│  后端工具     │  │  前端工具     │
│ (utils)      │  │ (axios)      │
│              │  │              │
│ Response.ok  │  │ apiClient    │
│ .created     │  │ .get<T>      │
│ .error       │  │ .post<T>     │
└──────────────┘  └──────────────┘
```

### 文件结构

```
packages/
├── contracts/src/response/
│   ├── index.ts              # 类型定义和枚举
│   └── responseBuilder.ts    # 响应构建器（可选）
│
├── utils/src/response/
│   ├── expressResponseHelper.ts  # Express 辅助函数
│   └── index.ts
│
apps/
├── api/src/
│   └── 使用 Response.ok/error 等辅助函数
│
└── web/src/shared/api/
    └── 使用 apiClient.get<T> 自动提取 data
```

---

## 🚀 快速开始

### 后端使用

#### 1. 成功响应

```typescript
import * as Response from '@/shared/utils/response';
import type { Request, Response as ExpressResponse } from 'express';
import type { GoalClientDTO } from '@dailyuse/contracts';

// 获取单个资源
export async function getGoalById(req: Request, res: ExpressResponse) {
  const goal = await goalService.findById(req.params.id);

  if (!goal) {
    return Response.notFound(res, '目标不存在');
  }

  return Response.ok(res, goal, '获取目标成功');
}

// 创建资源（201 Created）
export async function createGoal(req: Request, res: ExpressResponse) {
  const goal = await goalService.create(req.body);
  return Response.created(res, goal, '目标创建成功');
}

// 列表响应（带分页）
export async function getGoals(req: Request, res: ExpressResponse) {
  const { items, total } = await goalService.findAll(req.query);

  const pagination = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    total,
    totalPages: Math.ceil(total / 20),
  };

  return Response.list(res, items, pagination, '获取目标列表成功');
}
```

#### 2. 错误响应

```typescript
// 400 - 请求参数错误
if (!req.body.email) {
  return Response.badRequest(res, '邮箱不能为空');
}

// 401 - 未授权
if (!req.user) {
  return Response.unauthorized(res, '请先登录');
}

// 403 - 禁止访问
if (!req.user.isAdmin) {
  return Response.forbidden(res, '只有管理员可以执行此操作');
}

// 404 - 资源不存在
if (!goal) {
  return Response.notFound(res, '目标不存在');
}

// 409 - 资源冲突
if (existingUser) {
  return Response.conflict(res, '该邮箱已被注册');
}

// 422 - 验证错误
const errors = validateInput(req.body);
if (errors.length > 0) {
  return Response.validationError(res, '输入数据验证失败', errors);
}

// 500 - 服务器错误
try {
  await goalService.create(data);
} catch (error) {
  return Response.error(res, '创建目标失败');
}
```

### 前端使用

#### 1. API 调用（自动提取 data）

```typescript
import { apiClient } from '@/shared/api';
import type { GoalClientDTO, GoalListResponse } from '@dailyuse/contracts';

// GET 请求
const goal = await apiClient.get<GoalClientDTO>('/goals/123');
// goal 直接是 GoalClientDTO 类型，不需要 goal.data

// POST 请求
const newGoal = await apiClient.post<GoalClientDTO>('/goals', {
  name: 'Learn TypeScript',
  color: '#4CAF50',
});

// 列表请求（带分页）
const goalsResponse = await apiClient.get<GoalListResponse>('/goals', {
  params: { page: 1, limit: 20 },
});
// goalsResponse.data 是 GoalClientDTO[]
// goalsResponse.pagination 包含分页信息
```

#### 2. 错误处理

```typescript
import type { ErrorResponse, ResponseCode } from '@dailyuse/contracts';

try {
  const goal = await apiClient.get<GoalClientDTO>('/goals/123');
  console.log('获取成功:', goal);
} catch (error: any) {
  const errorResponse = error.response?.data as ErrorResponse;

  // 判断错误类型
  if (errorResponse.code === 401) {
    // 未授权，跳转登录
    router.push('/login');
  } else if (errorResponse.code === 404) {
    // 资源不存在
    showNotification({ type: 'error', message: '目标不存在' });
  } else if (errorResponse.code === 422 && errorResponse.errors) {
    // 验证错误，显示详细信息
    errorResponse.errors.forEach((err) => {
      console.error(`${err.field}: ${err.message}`);
    });
  }

  // 显示通用错误消息
  showNotification({
    type: 'error',
    message: errorResponse.message || '操作失败',
  });
}
```

---

## 📐 响应格式

### 成功响应

```typescript
interface SuccessResponse<T> {
  code: 200; // ResponseCode
  success: true; // 成功标识
  message: string; // 提示消息
  data: T; // 业务数据（泛型）
  timestamp: number; // 时间戳（毫秒）
  traceId?: string; // 链路追踪 ID
  pagination?: PaginationInfo; // 分页信息（列表接口）
}
```

**示例**:

```json
{
  "code": 200,
  "success": true,
  "message": "获取目标成功",
  "data": {
    "uuid": "goal-123",
    "name": "学习 TypeScript",
    "color": "#4CAF50",
    "startTime": 1696291200000,
    "endTime": 1698969600000
  },
  "timestamp": 1696318234567
}
```

### 错误响应

```typescript
interface ErrorResponse {
  code: number; // ResponseCode (400/401/404/422/500...)
  success: false; // 失败标识
  message: string; // 错误消息
  timestamp: number; // 时间戳（毫秒）
  traceId?: string; // 链路追踪 ID
  errorCode?: string; // 业务错误代码
  errors?: ErrorDetail[]; // 详细错误列表
  debug?: any; // 调试信息（仅开发环境）
}

interface ErrorDetail {
  code: string; // 错误代码
  field?: string; // 相关字段
  message: string; // 错误消息
  value?: any; // 当前值
  constraints?: Record<string, string>; // 约束信息
}
```

**示例 - 验证错误**:

```json
{
  "code": 422,
  "success": false,
  "message": "输入数据验证失败",
  "timestamp": 1696318234567,
  "errors": [
    {
      "code": "REQUIRED",
      "field": "email",
      "message": "邮箱不能为空"
    },
    {
      "code": "INVALID_FORMAT",
      "field": "email",
      "message": "邮箱格式不正确",
      "value": "invalid-email",
      "constraints": {
        "isEmail": "必须是有效的邮箱地址"
      }
    }
  ]
}
```

### 分页信息

```typescript
interface PaginationInfo {
  page: number; // 当前页码
  limit: number; // 每页数量
  total: number; // 总记录数
  totalPages: number; // 总页数
}
```

**示例 - 列表响应**:

```json
{
  "code": 200,
  "success": true,
  "message": "获取目标列表成功",
  "data": [
    { "uuid": "goal-1", "name": "目标1" },
    { "uuid": "goal-2", "name": "目标2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  },
  "timestamp": 1696318234567
}
```

---

## 🔢 响应代码

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

```typescript
import { getHttpStatusCode, ResponseCode } from '@dailyuse/contracts';

getHttpStatusCode(ResponseCode.SUCCESS); // 200
getHttpStatusCode(ResponseCode.UNAUTHORIZED); // 401
getHttpStatusCode(ResponseCode.NOT_FOUND); // 404
getHttpStatusCode(ResponseCode.VALIDATION_ERROR); // 422
getHttpStatusCode(ResponseCode.INTERNAL_ERROR); // 500
getHttpStatusCode(ResponseCode.BUSINESS_ERROR); // 400 (业务错误映射到 400)
```

---

## 🛠️ 后端工具函数

### 可用函数

| 函数                                               | HTTP 状态 | ResponseCode | 说明               |
| -------------------------------------------------- | --------- | ------------ | ------------------ |
| `ok(res, data?, message?)`                         | 200       | 200          | 成功响应           |
| `created(res, data?, message?)`                    | 201       | 200          | 资源创建成功       |
| `list(res, data, pagination, message?)`            | 200       | 200          | 列表响应（带分页） |
| `badRequest(res, message, errors?)`                | 400       | 400          | 请求参数错误       |
| `unauthorized(res, message)`                       | 401       | 401          | 未授权             |
| `forbidden(res, message)`                          | 403       | 403          | 禁止访问           |
| `notFound(res, message)`                           | 404       | 404          | 资源不存在         |
| `conflict(res, message)`                           | 409       | 409          | 资源冲突           |
| `validationError(res, message, errors?)`           | 422       | 422          | 验证错误           |
| `businessError(res, message, errorCode?, errors?)` | 400       | 1000         | 业务错误           |
| `error(res, message, debug?)`                      | 500       | 500          | 服务器错误         |
| `serviceUnavailable(res, message)`                 | 503       | 503          | 服务不可用         |

### 完整示例

```typescript
import * as Response from '@/shared/utils/response';
import type { Request, Response as ExpressResponse } from 'express';

export class GoalController {
  // 成功响应
  static async getGoals(req: Request, res: ExpressResponse) {
    const { items, total } = await goalService.findAll(req.query);

    return Response.list(
      res,
      items,
      {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        total,
        totalPages: Math.ceil(total / 20),
      },
      '获取目标列表成功',
    );
  }

  // 创建资源
  static async createGoal(req: Request, res: ExpressResponse) {
    const goal = await goalService.create(req.body);
    return Response.created(res, goal, '目标创建成功');
  }

  // 资源不存在
  static async getGoalById(req: Request, res: ExpressResponse) {
    const goal = await goalService.findById(req.params.id);

    if (!goal) {
      return Response.notFound(res, '目标不存在');
    }

    return Response.ok(res, goal, '获取目标成功');
  }

  // 验证错误
  static async updateGoal(req: Request, res: ExpressResponse) {
    const errors = validateGoalInput(req.body);

    if (errors.length > 0) {
      return Response.validationError(res, '输入数据验证失败', errors);
    }

    const goal = await goalService.update(req.params.id, req.body);
    return Response.ok(res, goal, '目标更新成功');
  }

  // 业务错误
  static async completeGoal(req: Request, res: ExpressResponse) {
    try {
      const goal = await goalService.complete(req.params.id);
      return Response.ok(res, goal, '目标已完成');
    } catch (error) {
      if (error instanceof GoalAlreadyCompletedError) {
        return Response.businessError(res, '目标已经完成', 'GOAL_ALREADY_COMPLETED');
      }
      throw error;
    }
  }

  // 服务器错误
  static async deleteGoal(req: Request, res: ExpressResponse) {
    try {
      await goalService.delete(req.params.id);
      return Response.ok(res, null, '目标删除成功');
    } catch (error) {
      return Response.error(res, '删除目标失败');
    }
  }
}
```

---

## 📱 前端集成

### Axios 拦截器

前端 Axios 自动处理响应:

```typescript
// apps/web/src/shared/api/core/interceptors.ts
import axios from 'axios';
import type { SuccessResponse, ErrorResponse } from '@dailyuse/contracts';

// 响应拦截器
axios.interceptors.response.use(
  // 成功响应 - 自动提取 data 字段
  (response) => {
    const data = response.data as SuccessResponse<any>;

    if (data.success) {
      // 返回业务数据，而不是整个响应对象
      return data.data;
    }

    return Promise.reject(response);
  },

  // 错误响应 - 抛出包含 message 的异常
  (error) => {
    const errorResponse = error.response?.data as ErrorResponse;

    // 统一错误处理
    if (errorResponse?.code === 401) {
      // 未授权，清除登录状态
      authStore.logout();
      router.push('/login');
    }

    return Promise.reject(error);
  },
);
```

### Vue Composable 示例

```typescript
import { ref } from 'vue';
import { apiClient } from '@/shared/api';
import type { GoalClientDTO, ErrorResponse } from '@dailyuse/contracts';

export function useGoal(goalId: string) {
  const goal = ref<GoalClientDTO | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchGoal = async () => {
    loading.value = true;
    error.value = null;

    try {
      // apiClient.get 自动提取 data，返回 GoalClientDTO
      goal.value = await apiClient.get<GoalClientDTO>(`/goals/${goalId}`);
    } catch (err: any) {
      const errorResponse = err.response?.data as ErrorResponse;
      error.value = errorResponse?.message || '获取目标失败';
    } finally {
      loading.value = false;
    }
  };

  return { goal, loading, error, fetchGoal };
}
```

---

## 💡 最佳实践

### 1. 始终使用响应工具函数

❌ **不推荐**:

```typescript
res.status(200).json({
  success: true,
  data: goal,
  message: '成功',
});
```

✅ **推荐**:

```typescript
return Response.ok(res, goal, '获取目标成功');
```

### 2. 提供清晰的错误消息

❌ **不推荐**:

```typescript
return Response.badRequest(res, '错误');
```

✅ **推荐**:

```typescript
return Response.badRequest(res, '邮箱格式不正确，请输入有效的邮箱地址');
```

### 3. 使用适当的错误代码

❌ **不推荐**（所有错误都返回 400）:

```typescript
if (!goal) {
  return Response.badRequest(res, '目标不存在');
}
```

✅ **推荐**（使用 404）:

```typescript
if (!goal) {
  return Response.notFound(res, '目标不存在');
}
```

### 4. 前端明确指定返回类型

❌ **不推荐**:

```typescript
const goal = await apiClient.get('/goals/123'); // goal 类型为 any
```

✅ **推荐**:

```typescript
const goal = await apiClient.get<GoalClientDTO>('/goals/123'); // 类型安全
```

### 5. 统一的分页处理

✅ **后端**:

```typescript
const pagination: PaginationInfo = {
  page: Number(query.page) || 1,
  limit: Number(query.limit) || 20,
  total: totalCount,
  totalPages: Math.ceil(totalCount / limit),
};

return Response.list(res, items, pagination);
```

✅ **前端**:

```typescript
const response = await apiClient.get<GoalListResponse>('/goals', {
  params: { page: 1, limit: 20 },
});

// response.data 是 GoalClientDTO[]
// response.pagination 包含分页信息
```

---

## 🔍 实战案例

### Controller 完整示例

参考 [[GOAL_CONTROLLER_REFACTOR_COMPLETE]] 文档，查看 GoalController 如何使用响应系统：

```typescript
export class GoalController {
  private static sendSuccess<T>(
    res: Response,
    data: T,
    message: string,
    statusCode = 200,
  ): Response {
    const response: SuccessResponse<T> = {
      code: ResponseCode.SUCCESS,
      success: true,
      message,
      data,
      timestamp: Date.now(),
    };
    return res.status(statusCode).json(response);
  }

  private static sendError(
    res: Response,
    code: ResponseCode,
    message: string,
    error?: any,
  ): Response {
    const httpStatus = getHttpStatusCode(code);
    const response: ErrorResponse = {
      code,
      success: false,
      message,
      timestamp: Date.now(),
    };

    logger.error(message, error);
    return res.status(httpStatus).json(response);
  }

  static async createGoal(req: Request, res: Response): Promise<Response> {
    try {
      const goal = await goalService.createGoal(accountUuid, request);
      return GoalController.sendSuccess(res, goal, 'Goal created successfully', 201);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid UUID')) {
          return GoalController.sendError(res, ResponseCode.VALIDATION_ERROR, error.message, error);
        }
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        'Failed to create goal',
        error,
      );
    }
  }
}
```

---

## 📚 类型定义

### 核心类型

```typescript
// 通用响应类型
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// 成功响应
export interface SuccessResponse<T> {
  code: ResponseCode;
  success: true;
  message: string;
  data: T;
  timestamp: number;
  traceId?: string;
  pagination?: PaginationInfo;
}

// 错误响应
export interface ErrorResponse {
  code: ResponseCode;
  success: false;
  message: string;
  timestamp: number;
  traceId?: string;
  errorCode?: string;
  errors?: ErrorDetail[];
  debug?: any;
}

// 分页信息
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 错误详情
export interface ErrorDetail {
  code: string;
  field?: string;
  message: string;
  value?: any;
  constraints?: Record<string, string>;
}
```

---

## 🔗 相关文档

- [[API_RESPONSE_SYSTEM_GUIDE]] - API 响应系统完整指南
- [[GOAL_CONTROLLER_REFACTOR_COMPLETE]] - GoalController 重构示例
- `docs/api-response-quick-reference.md` - 快速参考
- `docs/api-response-examples.md` - 实战示例

---

## 📝 变更历史

| 版本  | 日期       | 变更                    |
| ----- | ---------- | ----------------------- |
| 1.0.0 | 2025-01-01 | 初始版本                |
| 1.1.0 | 2025-10-03 | GoalController 集成完成 |

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-03
