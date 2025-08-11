# Account API Module

这是 DailyUse 项目的账户管理 API 模块，基于 DDD（领域驱动设计）架构实现。

## 模块结构

```
account/
├── application/           # 应用服务层
│   ├── AccountApplicationService.ts
│   └── AccountController.ts
├── domain/               # 领域层（目前为空，依赖 domain-server 包）
├── infrastructure/       # 基础设施层
│   ├── PrismaAccountRepository.ts
│   ├── EmailService.ts
│   └── AccountValidationService.ts
├── account.routes.ts     # 路由配置
└── index.ts             # 模块导出
```

## 核心组件

### AccountApplicationService

应用服务层的核心类，负责协调领域对象和基础设施服务，实现业务用例。

主要功能：

- 创建账户
- 获取账户信息
- 更新账户
- 账户状态管理（激活/停用/暂停）
- 邮箱和手机号验证
- 角色管理
- 账户搜索和分页

### PrismaAccountRepository

基础设施层的仓储实现，负责账户数据的持久化操作。

### EmailService

邮件服务，负责发送各种邮件通知：

- 欢迎邮件
- 邮箱验证邮件
- 密码重置邮件
- 账户状态变更通知

### AccountValidationService

验证服务，负责账户相关的数据验证：

- 账户创建数据验证
- 账户更新数据验证
- 邮箱格式验证
- 手机号格式验证
- 密码强度验证

## API 端点

### 创建账户

```
POST /api/v1/accounts
```

### 获取账户信息

```
GET /api/v1/accounts/:id
GET /api/v1/accounts/username/:username
```

### 更新账户

```
PUT /api/v1/accounts/:id
```

### 账户状态管理

```
POST /api/v1/accounts/:id/activate
POST /api/v1/accounts/:id/deactivate
POST /api/v1/accounts/:id/suspend
```

### 验证功能

```
POST /api/v1/accounts/:id/verify-email
POST /api/v1/accounts/:id/verify-phone
```

### 账户列表和搜索

```
GET /api/v1/accounts
GET /api/v1/accounts/search
```

### 删除账户

```
DELETE /api/v1/accounts/:id
```

## 使用示例

### 在 Express 应用中使用

```typescript
import express from 'express';
import { accountRoutes } from './modules/account';

const app = express();

// 注册账户路由
app.use('/api/v1', accountRoutes);
```

### 直接使用应用服务

```typescript
import {
  AccountApplicationService,
  PrismaAccountRepository,
  EmailService,
  AccountValidationService,
} from './modules/account';

// 创建依赖
const accountRepository = new PrismaAccountRepository();
const emailService = new EmailService();
const validationService = new AccountValidationService();

// 创建应用服务
const accountService = new AccountApplicationService(
  accountRepository,
  emailService,
  validationService,
);

// 使用服务
const account = await accountService.createAccount({
  username: 'testuser',
  accountType: 'PERSONAL',
  user: {
    firstName: 'Test',
    lastName: 'User',
    // ...
  },
  email: 'test@example.com',
  password: 'SecurePass123!',
});
```

## 数据传输对象 (DTOs)

### CreateAccountDto

```typescript
interface CreateAccountDto {
  username: string;
  accountType: any;
  user: any;
  email?: any;
  phoneNumber?: any;
  password?: string;
}
```

### UpdateAccountDto

```typescript
interface UpdateAccountDto {
  email?: string;
  phoneNumber?: string;
  address?: any;
  userProfile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
}
```

### AccountResponseDto

```typescript
interface AccountResponseDto {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  status: any;
  accountType: any;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    socialAccounts: { [key: string]: string };
  };
  roleIds: string[];
}
```

## 注意事项

1. 目前某些依赖项（如 @dailyuse/domain-server）可能需要正确安装和配置
2. 数据库表结构需要与 Prisma 配置匹配
3. 邮件服务目前是模拟实现，实际部署时需要配置真实的邮件服务提供商
4. 认证中间件需要根据项目需求添加
5. 权限控制逻辑需要进一步完善

## 下一步工作

1. 完善数据库模式设计
2. 实现真实的邮件服务集成
3. 添加详细的错误处理
4. 实现缓存策略
5. 添加日志记录
6. 编写单元测试和集成测试
