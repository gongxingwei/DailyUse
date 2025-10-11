# Authentication Module

基于DDD架构的完整认证模块，支持用户登录、MFA验证、会话管理等功能。

## 目录结构

```
authentication/
├── application/                    # 应用层
│   └── AuthenticationApplicationService.ts  # 认证应用服务
├── infrastructure/                # 基础设施层
│   ├── container.ts              # 依赖注入容器
│   ├── PrismaAuthCredentialRepository.ts  # 认证凭证仓库实现
│   ├── PrismaSessionRepository.ts         # 会话仓库实现
│   ├── PrismaTokenRepository.ts           # 令牌仓库实现
│   ├── PrismaMFADeviceRepository.ts       # MFA设备仓库实现
│   └── repositories/
│       └── prisma/
│           └── index.ts          # 仓库导出文件
├── presentation/                  # 表现层
│   └── AuthenticationController.ts       # 认证控制器
├── routes/                       # 路由配置
│   └── authenticationRoutes.ts   # 认证路由
└── index.ts                      # 模块主入口
```

## 架构改进

### 🎯 领域层集中化

**新设计**：所有领域接口（仓库接口、服务接口）都集中在 `@dailyuse/domain-server` 包中。

**优势**：

- ✅ **避免重复定义** - 多个模块共享相同接口
- ✅ **保持领域完整性** - 接口和实体在同一包中
- ✅ **更好的依赖管理** - API模块只依赖domain-server包
- ✅ **架构更清晰** - 领域层完全独立

**接口位置**：

```
packages/domain-server/src/
├── authentication/repositories/IAuthenticationRepository.ts
└── account/repositories/IAccountRepository.ts
```

## 功能特性

### 1. 用户登录

- **端点**: `POST /api/auth/login`
- **功能**: 用户名/密码登录，支持MFA
- **响应**: 返回访问令牌、刷新令牌或MFA验证要求

### 2. MFA验证

- **端点**: `POST /api/auth/mfa/verify`
- **功能**: 多因素认证验证
- **响应**: 验证成功后返回访问令牌

### 3. 用户登出

- **端点**: `POST /api/auth/logout`
- **功能**: 终止用户会话
- **响应**: 确认登出状态

### 4. 令牌刷新

- **端点**: `POST /api/auth/refresh`
- **功能**: 使用刷新令牌获取新的访问令牌
- **响应**: 返回新的访问令牌和刷新令牌

### 5. MFA设备管理

- **创建设备**: `POST /api/auth/mfa/devices`
- **获取设备列表**: `GET /api/auth/mfa/devices/:accountUuid`
- **删除设备**: `DELETE /api/auth/mfa/devices/:deviceUuid`

### 6. 会话管理

- **获取会话列表**: `GET /api/auth/sessions/:accountUuid`
- **终止会话**: `DELETE /api/auth/sessions/:sessionId`

## 架构设计

### DDD三层架构

1. **领域层 (Domain)**
   - 定义仓库接口
   - 集成domain-server包中的聚合根和实体

2. **应用层 (Application)**
   - `AuthenticationApplicationService`: 处理认证业务逻辑
   - 协调领域对象和基础设施服务

3. **基础设施层 (Infrastructure)**
   - Prisma仓库实现
   - 数据库访问和持久化
   - 依赖注入容器

4. **表现层 (Presentation)**
   - REST API控制器
   - 请求响应处理
   - 错误处理和状态码

### 依赖关系

```
Presentation → Application → Domain ← Infrastructure
```

## 数据库模型

### 主要表结构

- `accounts`: 用户账户信息
- `user_profiles`: 用户资料
- `auth_credentials`: 认证凭证
- `user_sessions`: 用户会话
- `auth_tokens`: 认证令牌
- `mfa_devices`: MFA设备

### 关系设计

- Account 1:1 UserProfile
- Account 1:1 AuthCredential
- Account 1:N UserSession
- Account 1:N AuthToken
- Account 1:N MFADevice

## 安全特性

1. **密码安全**
   - bcrypt哈希加密
   - 密码强度验证
   - 密码过期策略

2. **会话管理**
   - 安全的会话令牌
   - 会话超时机制
   - 多设备登录支持

3. **多因素认证**
   - TOTP支持
   - SMS验证
   - 邮箱验证

4. **防护机制**
   - 登录失败次数限制
   - 账户锁定机制
   - 令牌过期和刷新

## 使用方法

### 1. 集成到Express应用

```typescript
import express from 'express';
import { authenticationRouter } from './modules/authentication';

const app = express();

app.use(express.json());
app.use('/api/auth', authenticationRouter);
```

### 2. 登录请求示例

```typescript
// POST /api/auth/login
{
  "username": "user@example.com",
  "password": "securePassword123",
  "deviceInfo": "Chrome on Windows"
}
```

### 3. MFA验证示例

```typescript
// POST /api/auth/mfa/verify
{
  "sessionId": "session-uuid",
  "mfaCode": "123456"
}
```

## 配置要求

### 1. 环境变量

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dailyuse"
JWT_SECRET="your-jwt-secret-key"
```

### 2. 依赖包

```json
{
  "@dailyuse/domain-server": "workspace:*",
  "@dailyuse/domain-core": "workspace:*",
  "@dailyuse/utils": "workspace:*",
  "@prisma/client": "^5.0.0",
  "express": "^4.18.0",
  "bcrypt": "^5.1.0"
}
```

## API响应格式

### 成功响应

```json
{
  "success": true,
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "accountUuid": "account-uuid",
  "message": "Login successful"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "Invalid username or password"
}
```

### MFA要求响应

```json
{
  "success": true,
  "requiresMFA": true,
  "sessionId": "temp-session-id",
  "message": "MFA verification required"
}
```

## 扩展性

该认证模块采用了充分的抽象和接口设计，支持：

1. **多种认证方式**: 可扩展OAuth、LDAP等
2. **多种存储后端**: 可替换为其他数据库
3. **多种MFA方式**: 支持硬件令牌、生物识别等
4. **自定义验证规则**: 可扩展密码策略、登录策略等

## 开发状态

- ✅ 核心认证功能完成
- ✅ MFA支持完成
- ✅ 会话管理完成
- ✅ REST API完成
- ✅ 数据库集成完成
- ⏳ 单元测试待完成
- ⏳ API文档待完善
