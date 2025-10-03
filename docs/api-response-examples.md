# API 响应系统示例

本文档提供了实际的代码示例，展示如何在项目中使用统一的 API 响应系统。

## 后端示例

### 1. 用户 CRUD 操作

```typescript
// apps/api/src/modules/user/user.controller.ts
import { Router, Request, Response } from 'express';
import * as ApiResponse from '@/shared/utils/response';
import { userService } from './user.service';
import { validateUserInput } from './user.validator';

const router = Router();

// 获取用户列表（带分页）
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    
    const { items, total } = await userService.getUsers({ page, limit });
    
    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
    
    return ApiResponse.list(res, items, pagination, '获取用户列表成功');
  } catch (error: any) {
    return ApiResponse.error(res, error.message);
  }
});

// 获取单个用户
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    if (!user) {
      return ApiResponse.notFound(res, '用户不存在');
    }
    
    return ApiResponse.ok(res, user, '获取用户信息成功');
  } catch (error: any) {
    return ApiResponse.error(res, error.message);
  }
});

// 创建用户
router.post('/', async (req: Request, res: Response) => {
  try {
    // 验证输入
    const validationErrors = validateUserInput(req.body);
    if (validationErrors.length > 0) {
      return ApiResponse.validationError(
        res,
        '输入数据验证失败',
        validationErrors
      );
    }
    
    // 检查邮箱是否已存在
    const existingUser = await userService.findByEmail(req.body.email);
    if (existingUser) {
      return ApiResponse.conflict(res, '该邮箱已被注册');
    }
    
    const user = await userService.createUser(req.body);
    return ApiResponse.created(res, user, '用户创建成功');
  } catch (error: any) {
    return ApiResponse.error(res, error.message);
  }
});

// 更新用户
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    if (!user) {
      return ApiResponse.notFound(res, '用户不存在');
    }
    
    // 验证输入
    const validationErrors = validateUserInput(req.body);
    if (validationErrors.length > 0) {
      return ApiResponse.validationError(
        res,
        '输入数据验证失败',
        validationErrors
      );
    }
    
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    return ApiResponse.ok(res, updatedUser, '用户更新成功');
  } catch (error: any) {
    return ApiResponse.error(res, error.message);
  }
});

// 删除用户（需要管理员权限）
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // 权限检查
    if (!req.user?.isAdmin) {
      return ApiResponse.forbidden(res, '只有管理员可以删除用户');
    }
    
    const user = await userService.getUserById(req.params.id);
    
    if (!user) {
      return ApiResponse.notFound(res, '用户不存在');
    }
    
    await userService.deleteUser(req.params.id);
    return ApiResponse.ok(res, null, '用户删除成功');
  } catch (error: any) {
    return ApiResponse.error(res, error.message);
  }
});

export default router;
```

### 2. 业务逻辑错误示例

```typescript
// apps/api/src/modules/order/order.controller.ts
import { Router, Request, Response } from 'express';
import * as ApiResponse from '@/shared/utils/response';
import { orderService } from './order.service';
import { InsufficientBalanceError, InvalidProductError } from './errors';

const router = Router();

// 创建订单
router.post('/', async (req: Request, res: Response) => {
  try {
    const order = await orderService.createOrder(req.user!.id, req.body);
    return ApiResponse.created(res, order, '订单创建成功');
  } catch (error: any) {
    // 处理余额不足错误
    if (error instanceof InsufficientBalanceError) {
      return ApiResponse.businessError(
        res,
        '余额不足，无法创建订单',
        'INSUFFICIENT_BALANCE',
        [
          {
            code: 'INSUFFICIENT_BALANCE',
            field: 'balance',
            message: `当前余额: ¥${error.currentBalance}, 需要: ¥${error.requiredBalance}`,
            value: error.currentBalance,
          },
        ]
      );
    }
    
    // 处理商品无效错误
    if (error instanceof InvalidProductError) {
      return ApiResponse.businessError(
        res,
        '订单中包含无效的商品',
        'INVALID_PRODUCT',
        [
          {
            code: 'INVALID_PRODUCT',
            field: 'productId',
            message: error.message,
            value: error.productId,
          },
        ]
      );
    }
    
    // 其他错误
    return ApiResponse.error(res, error.message);
  }
});

// 取消订单
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    
    if (!order) {
      return ApiResponse.notFound(res, '订单不存在');
    }
    
    // 检查订单所有者
    if (order.userId !== req.user!.id) {
      return ApiResponse.forbidden(res, '无权操作此订单');
    }
    
    // 检查订单状态
    if (order.status === 'DELIVERED') {
      return ApiResponse.businessError(
        res,
        '订单已发货，无法取消',
        'ORDER_ALREADY_DELIVERED'
      );
    }
    
    const cancelledOrder = await orderService.cancelOrder(req.params.id);
    return ApiResponse.ok(res, cancelledOrder, '订单取消成功');
  } catch (error: any) {
    return ApiResponse.error(res, error.message);
  }
});

export default router;
```

### 3. 验证错误示例

```typescript
// apps/api/src/modules/user/user.validator.ts
import type { ErrorDetail } from '@dailyuse/contracts';

export interface UserInput {
  name: string;
  email: string;
  password: string;
  age?: number;
}

export function validateUserInput(input: UserInput): ErrorDetail[] {
  const errors: ErrorDetail[] = [];
  
  // 验证姓名
  if (!input.name || input.name.trim().length === 0) {
    errors.push({
      code: 'REQUIRED',
      field: 'name',
      message: '姓名不能为空',
    });
  } else if (input.name.length < 2 || input.name.length > 50) {
    errors.push({
      code: 'INVALID_LENGTH',
      field: 'name',
      message: '姓名长度必须在 2-50 个字符之间',
      value: input.name,
      constraints: {
        minLength: '2',
        maxLength: '50',
      },
    });
  }
  
  // 验证邮箱
  if (!input.email || input.email.trim().length === 0) {
    errors.push({
      code: 'REQUIRED',
      field: 'email',
      message: '邮箱不能为空',
    });
  } else if (!isValidEmail(input.email)) {
    errors.push({
      code: 'INVALID_FORMAT',
      field: 'email',
      message: '邮箱格式不正确',
      value: input.email,
      constraints: {
        isEmail: '必须是有效的邮箱地址',
      },
    });
  }
  
  // 验证密码
  if (!input.password || input.password.length === 0) {
    errors.push({
      code: 'REQUIRED',
      field: 'password',
      message: '密码不能为空',
    });
  } else if (input.password.length < 8) {
    errors.push({
      code: 'INVALID_LENGTH',
      field: 'password',
      message: '密码长度不能少于 8 个字符',
      constraints: {
        minLength: '8',
      },
    });
  } else if (!hasStrongPassword(input.password)) {
    errors.push({
      code: 'WEAK_PASSWORD',
      field: 'password',
      message: '密码强度不足，必须包含大小写字母、数字和特殊字符',
      constraints: {
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])',
      },
    });
  }
  
  // 验证年龄（可选）
  if (input.age !== undefined) {
    if (input.age < 0 || input.age > 150) {
      errors.push({
        code: 'OUT_OF_RANGE',
        field: 'age',
        message: '年龄必须在 0-150 之间',
        value: input.age,
        constraints: {
          min: '0',
          max: '150',
        },
      });
    }
  }
  
  return errors;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function hasStrongPassword(password: string): boolean {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
  return strongPasswordRegex.test(password);
}
```

---

## 前端示例

### 1. 用户管理 Composable

```typescript
// apps/web/src/features/users/composables/useUsers.ts
import { ref, computed } from 'vue';
import { apiClient } from '@/shared/api';
import type { ErrorResponse } from '@/shared/api/core/types';
import { ResponseCode } from '@dailyuse/contracts';
import { showNotification } from '@/shared/utils/notification';

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
  age?: number;
}

export function useUsers() {
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentPage = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
  
  // 获取用户列表
  const fetchUsers = async (page = 1) => {
    loading.value = true;
    error.value = null;
    
    try {
      currentPage.value = page;
      
      const data = await apiClient.get<User[]>('/users', {
        params: {
          page,
          limit: pageSize.value,
        },
      });
      
      users.value = data;
      
      showNotification({
        type: 'success',
        message: '用户列表加载成功',
      });
    } catch (err: any) {
      const errorResponse = err.response?.data as ErrorResponse;
      error.value = errorResponse?.message || '获取用户列表失败';
      
      showNotification({
        type: 'error',
        message: error.value,
      });
    } finally {
      loading.value = false;
    }
  };
  
  // 获取单个用户
  const fetchUser = async (id: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const user = await apiClient.get<User>(`/users/${id}`);
      return user;
    } catch (err: any) {
      const errorResponse = err.response?.data as ErrorResponse;
      
      if (errorResponse?.code === ResponseCode.NOT_FOUND) {
        showNotification({
          type: 'warning',
          message: '用户不存在',
        });
      } else {
        error.value = errorResponse?.message || '获取用户信息失败';
        showNotification({
          type: 'error',
          message: error.value,
        });
      }
      
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  // 创建用户
  const createUser = async (input: UserInput) => {
    loading.value = true;
    error.value = null;
    
    try {
      const user = await apiClient.post<User>('/users', input);
      
      // 添加到列表
      users.value.unshift(user);
      total.value++;
      
      showNotification({
        type: 'success',
        message: '用户创建成功',
      });
      
      return user;
    } catch (err: any) {
      const errorResponse = err.response?.data as ErrorResponse;
      error.value = errorResponse?.message || '创建用户失败';
      
      // 处理验证错误
      if (errorResponse?.code === ResponseCode.VALIDATION_ERROR && errorResponse.errors) {
        const validationMessages = errorResponse.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(', ');
        
        showNotification({
          type: 'error',
          message: `验证失败: ${validationMessages}`,
          duration: 5000,
        });
      }
      // 处理冲突（邮箱已存在）
      else if (errorResponse?.code === ResponseCode.CONFLICT) {
        showNotification({
          type: 'warning',
          message: errorResponse.message,
        });
      }
      // 其他错误
      else {
        showNotification({
          type: 'error',
          message: error.value,
        });
      }
      
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  // 更新用户
  const updateUser = async (id: string, input: Partial<UserInput>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const user = await apiClient.put<User>(`/users/${id}`, input);
      
      // 更新列表中的用户
      const index = users.value.findIndex((u) => u.id === id);
      if (index !== -1) {
        users.value[index] = user;
      }
      
      showNotification({
        type: 'success',
        message: '用户更新成功',
      });
      
      return user;
    } catch (err: any) {
      const errorResponse = err.response?.data as ErrorResponse;
      error.value = errorResponse?.message || '更新用户失败';
      
      if (errorResponse?.code === ResponseCode.NOT_FOUND) {
        showNotification({
          type: 'warning',
          message: '用户不存在',
        });
      } else if (errorResponse?.code === ResponseCode.VALIDATION_ERROR && errorResponse.errors) {
        const validationMessages = errorResponse.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(', ');
        
        showNotification({
          type: 'error',
          message: `验证失败: ${validationMessages}`,
          duration: 5000,
        });
      } else {
        showNotification({
          type: 'error',
          message: error.value,
        });
      }
      
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  // 删除用户
  const deleteUser = async (id: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      await apiClient.delete(`/users/${id}`);
      
      // 从列表中移除
      const index = users.value.findIndex((u) => u.id === id);
      if (index !== -1) {
        users.value.splice(index, 1);
        total.value--;
      }
      
      showNotification({
        type: 'success',
        message: '用户删除成功',
      });
    } catch (err: any) {
      const errorResponse = err.response?.data as ErrorResponse;
      error.value = errorResponse?.message || '删除用户失败';
      
      if (errorResponse?.code === ResponseCode.FORBIDDEN) {
        showNotification({
          type: 'error',
          message: '权限不足',
        });
      } else if (errorResponse?.code === ResponseCode.NOT_FOUND) {
        showNotification({
          type: 'warning',
          message: '用户不存在',
        });
      } else {
        showNotification({
          type: 'error',
          message: error.value,
        });
      }
      
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    users,
    loading,
    error,
    currentPage,
    pageSize,
    total,
    totalPages,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
  };
}
```

### 2. 订单管理示例

```typescript
// apps/web/src/features/orders/composables/useOrders.ts
import { ref } from 'vue';
import { apiClient } from '@/shared/api';
import type { ErrorResponse } from '@/shared/api/core/types';
import { ResponseCode } from '@dailyuse/contracts';
import { showNotification } from '@/shared/utils/notification';

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export function useOrders() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // 创建订单
  const createOrder = async (input: CreateOrderInput) => {
    loading.value = true;
    error.value = null;
    
    try {
      const order = await apiClient.post<Order>('/orders', input);
      
      showNotification({
        type: 'success',
        message: '订单创建成功',
      });
      
      return order;
    } catch (err: any) {
      const errorResponse = err.response?.data as ErrorResponse;
      error.value = errorResponse?.message || '创建订单失败';
      
      // 处理业务错误
      if (errorResponse?.code === ResponseCode.BUSINESS_ERROR) {
        // 余额不足
        if (errorResponse.errorCode === 'INSUFFICIENT_BALANCE') {
          const balanceError = errorResponse.errors?.[0];
          showNotification({
            type: 'warning',
            message: balanceError?.message || '余额不足',
            duration: 5000,
          });
        }
        // 商品无效
        else if (errorResponse.errorCode === 'INVALID_PRODUCT') {
          showNotification({
            type: 'error',
            message: errorResponse.message,
          });
        }
      }
      // 其他错误
      else {
        showNotification({
          type: 'error',
          message: error.value,
        });
      }
      
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  // 取消订单
  const cancelOrder = async (orderId: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const order = await apiClient.post<Order>(`/orders/${orderId}/cancel`);
      
      showNotification({
        type: 'success',
        message: '订单取消成功',
      });
      
      return order;
    } catch (err: any) {
      const errorResponse = err.response?.data as ErrorResponse;
      error.value = errorResponse?.message || '取消订单失败';
      
      if (errorResponse?.code === ResponseCode.NOT_FOUND) {
        showNotification({
          type: 'warning',
          message: '订单不存在',
        });
      } else if (errorResponse?.code === ResponseCode.FORBIDDEN) {
        showNotification({
          type: 'error',
          message: '无权操作此订单',
        });
      } else if (errorResponse?.code === ResponseCode.BUSINESS_ERROR) {
        if (errorResponse.errorCode === 'ORDER_ALREADY_DELIVERED') {
          showNotification({
            type: 'warning',
            message: '订单已发货，无法取消',
          });
        }
      } else {
        showNotification({
          type: 'error',
          message: error.value,
        });
      }
      
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    loading,
    error,
    createOrder,
    cancelOrder,
  };
}
```

### 3. 表单验证错误显示

```vue
<!-- apps/web/src/features/users/components/UserForm.vue -->
<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label for="name">姓名</label>
      <input
        id="name"
        v-model="form.name"
        type="text"
        :class="{ 'is-invalid': fieldErrors.name }"
      />
      <div v-if="fieldErrors.name" class="error-message">
        {{ fieldErrors.name }}
      </div>
    </div>
    
    <div class="form-group">
      <label for="email">邮箱</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        :class="{ 'is-invalid': fieldErrors.email }"
      />
      <div v-if="fieldErrors.email" class="error-message">
        {{ fieldErrors.email }}
      </div>
    </div>
    
    <div class="form-group">
      <label for="password">密码</label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        :class="{ 'is-invalid': fieldErrors.password }"
      />
      <div v-if="fieldErrors.password" class="error-message">
        {{ fieldErrors.password }}
      </div>
    </div>
    
    <div class="form-group">
      <label for="age">年龄（可选）</label>
      <input
        id="age"
        v-model.number="form.age"
        type="number"
        :class="{ 'is-invalid': fieldErrors.age }"
      />
      <div v-if="fieldErrors.age" class="error-message">
        {{ fieldErrors.age }}
      </div>
    </div>
    
    <button type="submit" :disabled="loading">
      {{ loading ? '提交中...' : '提交' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useUsers } from '../composables/useUsers';
import type { ErrorResponse, ErrorDetail } from '@/shared/api/core/types';
import { ResponseCode } from '@dailyuse/contracts';

const { createUser, loading } = useUsers();

const form = reactive({
  name: '',
  email: '',
  password: '',
  age: undefined as number | undefined,
});

const fieldErrors = reactive<Record<string, string>>({});

const handleSubmit = async () => {
  // 清除之前的错误
  Object.keys(fieldErrors).forEach((key) => {
    delete fieldErrors[key];
  });
  
  try {
    await createUser(form);
    
    // 重置表单
    form.name = '';
    form.email = '';
    form.password = '';
    form.age = undefined;
  } catch (err: any) {
    const errorResponse = err.response?.data as ErrorResponse;
    
    // 处理验证错误
    if (errorResponse?.code === ResponseCode.VALIDATION_ERROR && errorResponse.errors) {
      errorResponse.errors.forEach((error: ErrorDetail) => {
        if (error.field) {
          fieldErrors[error.field] = error.message;
        }
      });
    }
  }
};
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

.error-message {
  color: #f56c6c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.is-invalid {
  border-color: #f56c6c;
}
</style>
```

---

## 响应数据示例

### 成功响应示例

#### 获取单个用户

```json
{
  "code": 200,
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": "user-123",
    "name": "张三",
    "email": "zhangsan@example.com",
    "age": 25,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": 1704067200000,
  "traceId": "trace-abc-123"
}
```

#### 获取用户列表（带分页）

```json
{
  "code": 200,
  "success": true,
  "message": "获取用户列表成功",
  "data": [
    {
      "id": "user-123",
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    {
      "id": "user-456",
      "name": "李四",
      "email": "lisi@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": 1704067200000,
  "traceId": "trace-abc-124"
}
```

### 错误响应示例

#### 验证错误（422）

```json
{
  "code": 422,
  "success": false,
  "message": "输入数据验证失败",
  "timestamp": 1704067200000,
  "traceId": "trace-abc-125",
  "errors": [
    {
      "code": "REQUIRED",
      "field": "name",
      "message": "姓名不能为空"
    },
    {
      "code": "INVALID_FORMAT",
      "field": "email",
      "message": "邮箱格式不正确",
      "value": "invalid-email",
      "constraints": {
        "isEmail": "必须是有效的邮箱地址"
      }
    },
    {
      "code": "WEAK_PASSWORD",
      "field": "password",
      "message": "密码强度不足，必须包含大小写字母、数字和特殊字符",
      "constraints": {
        "pattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])"
      }
    }
  ]
}
```

#### 资源不存在（404）

```json
{
  "code": 404,
  "success": false,
  "message": "用户不存在",
  "timestamp": 1704067200000,
  "traceId": "trace-abc-126"
}
```

#### 资源冲突（409）

```json
{
  "code": 409,
  "success": false,
  "message": "该邮箱已被注册",
  "timestamp": 1704067200000,
  "traceId": "trace-abc-127"
}
```

#### 业务错误（1000）

```json
{
  "code": 1000,
  "success": false,
  "message": "余额不足，无法创建订单",
  "timestamp": 1704067200000,
  "traceId": "trace-abc-128",
  "errorCode": "INSUFFICIENT_BALANCE",
  "errors": [
    {
      "code": "INSUFFICIENT_BALANCE",
      "field": "balance",
      "message": "当前余额: ¥50.00, 需要: ¥100.00",
      "value": 50.00
    }
  ]
}
```

#### 权限不足（403）

```json
{
  "code": 403,
  "success": false,
  "message": "只有管理员可以删除用户",
  "timestamp": 1704067200000,
  "traceId": "trace-abc-129"
}
```

#### 服务器错误（500）

```json
{
  "code": 500,
  "success": false,
  "message": "服务器内部错误",
  "timestamp": 1704067200000,
  "traceId": "trace-abc-130",
  "debug": {
    "stack": "Error: Database connection failed\n    at ...",
    "environment": "development"
  }
}
```

---

## 总结

通过这些示例，你可以看到：

1. **后端**：所有 API 路由都使用统一的响应函数（`Response.ok`, `Response.error` 等）
2. **前端**：Axios 自动提取 `data` 字段，业务代码直接获得类型化的数据
3. **错误处理**：前端可以根据 `ResponseCode` 进行精确的错误处理
4. **类型安全**：从后端到前端全程 TypeScript 类型保护

这套系统让 API 开发和使用变得更加简单、一致和可靠。
