# Express JWT 认证中间件使用指南

## 概述

我们实现了一个统一的JWT认证中间件，可以自动从请求的 `Authorization` header 中提取和验证JWT token，并将用户信息（特别是`accountUuid`）注入到请求对象中。这样前后端的DTO数据传输就不需要每次都手动传递`accountUuid`了。

## 中间件功能

### 1. `authMiddleware` - 强制认证中间件

- **用途**: 要求用户必须提供有效的JWT token
- **位置**: `apps/api/src/shared/middlewares/authMiddleware.ts`
- **功能**:
  - 从 `Authorization: Bearer <token>` header 提取JWT token
  - 验证token的有效性和过期时间
  - 解析token获取用户信息（`accountUuid`、`tokenType`、`exp`等）
  - 将用户信息注入到 `req.user` 和 `req.accountUuid` 中
  - 如果认证失败，返回401错误

### 2. `optionalAuthMiddleware` - 可选认证中间件

- **用途**: 如果提供了token则验证，没有提供则继续执行
- **适用场景**: 某些API端点对登录和未登录用户都开放，但对认证用户提供额外功能

### 3. 辅助函数

- `requireAuth(req)`: 检查请求是否已认证，抛出异常如果未认证
- `getCurrentAccountUuid(req)`: 安全地获取当前用户UUID，可能返回null

## 使用方法

### 1. 在路由级别应用认证中间件

```typescript
// app.ts 中的示例
import { authMiddleware, optionalAuthMiddleware } from './shared/middlewares';

// 需要认证的路由
api.use('/goals', authMiddleware, goalRouter);
api.use('/tasks', authMiddleware, taskRouter);
api.use('/goal-dirs', authMiddleware, goalDirRouter);

// 不需要认证的路由（如登录、注册）
api.use('/auth', authenticationRoutes);

// 可选认证的路由
api.use('/public', optionalAuthMiddleware, publicRouter);
```

### 2. 在控制器中使用认证信息

```typescript
// 控制器示例
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../../shared/middlewares/authMiddleware';

export class GoalController {
  static async createGoal(req: AuthenticatedRequest, res: Response) {
    try {
      const request = req.body;
      
      // 直接从req.accountUuid获取用户UUID，无需从body或header中传递
      const accountUuid = req.accountUuid!; // 认证中间件保证存在
      
      const goal = await goalService.createGoal(request, accountUuid);
      
      res.status(201).json({
        success: true,
        data: goal
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
```

### 3. 前端调用时的变化

#### 之前（需要在每个请求中传递accountUuid）

```typescript
// ❌ 之前的方式
const response = await fetch('/api/v1/goals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: '学习目标',
    description: '完成课程学习',
    accountUuid: 'user-uuid-123' // 需要手动传递
  })
});
```

#### 现在（只需要Authorization header）

```typescript
// ✅ 现在的方式
const response = await fetch('/api/v1/goals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // 只需要token
  },
  body: JSON.stringify({
    name: '学习目标',
    description: '完成课程学习'
    // 不需要传递accountUuid了
  })
});
```

## 认证流程

1. **前端发送请求**: 在Authorization header中包含JWT token
2. **中间件拦截**: 认证中间件自动拦截请求
3. **Token验证**: 使用JWT secret验证token有效性
4. **信息注入**: 将解析出的用户信息注入到请求对象
5. **控制器处理**: 控制器直接从`req.accountUuid`获取用户UUID
6. **业务逻辑**: 应用服务使用accountUuid处理业务逻辑

## JWT Token格式

我们的JWT token包含以下payload：

```json
{
  "accountUuid": "user-uuid-123",
  "type": "ACCESS_TOKEN",
  "exp": 1234567890,
  "iat": 1234567890
}
```

## 错误处理

认证中间件会返回以下错误：

- **401 Unauthorized**: 
  - 缺少Authorization header
  - Token格式错误（不是Bearer格式）
  - Token无效或已过期
  - Token中缺少必要信息

- **500 Internal Server Error**: 
  - 认证服务异常

## 环境配置

确保设置了JWT密钥环境变量：

```bash
# .env
JWT_SECRET=your-super-secret-key-here
```

如果未设置，将使用默认值 `'default-secret'`（仅用于开发环境）。

## 安全注意事项

1. **HTTPS**: 生产环境必须使用HTTPS传输JWT token
2. **Secret安全**: JWT_SECRET应该是强密码且定期更换
3. **Token过期**: 设置合理的token过期时间
4. **刷新机制**: 实现token刷新机制避免频繁登录

## 迁移指南

### 对于现有控制器

1. 导入 `AuthenticatedRequest` 类型
2. 将参数类型从 `Request` 改为 `AuthenticatedRequest`
3. 移除手动获取accountUuid的逻辑
4. 直接使用 `req.accountUuid`

### 对于现有DTO

1. 从DTO中移除 `accountUuid` 字段
2. 更新Contracts定义，移除不必要的accountUuid字段
3. 更新应用服务方法签名，将accountUuid作为单独参数传递

### 对于前端代码

1. 移除请求body中的accountUuid字段
2. 确保所有API调用都包含Authorization header
3. 更新类型定义，移除accountUuid相关字段

## 示例完整流程

```typescript
// 1. 前端调用
const createGoal = async (goalData: CreateGoalRequest) => {
  const response = await fetch('/api/v1/goals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAccessToken()}`
    },
    body: JSON.stringify(goalData) // 不包含accountUuid
  });
  return response.json();
};

// 2. 控制器处理
static async createGoal(req: AuthenticatedRequest, res: Response) {
  const request: CreateGoalRequest = req.body;
  const accountUuid = req.accountUuid!; // 从中间件获取
  
  const goal = await goalService.createGoal(request, accountUuid);
  res.json({ success: true, data: goal });
}

// 3. 应用服务
async createGoal(request: CreateGoalRequest, accountUuid: string) {
  // 使用accountUuid进行业务逻辑处理
  return await this.goalRepository.createGoal({
    ...request,
    accountUuid // 在服务层添加accountUuid
  });
}
```

这样的设计让API更加安全、简洁，并且减少了前后端之间的数据传输冗余。
