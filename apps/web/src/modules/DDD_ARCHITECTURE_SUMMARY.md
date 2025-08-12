# DailyUse Web Application - Account & Authentication Modules

基于DDD (Domain-Driven Design) 架构的Account和Authentication模块实现

## 🏗️ 架构概览

```
src/modules/
├── account/                    # 用户账户模块
│   ├── domain/                 # 领域层
│   │   ├── models/             # 领域模型
│   │   │   └── User.ts         # 用户领域模型
│   │   ├── repositories/       # 仓储接口
│   │   │   └── IUserRepository.ts
│   │   └── services/           # 领域服务
│   │       └── UserDomainService.ts
│   │
│   ├── application/            # 应用层
│   │   ├── services/           # 应用服务
│   │   │   └── UserApplicationService.ts
│   │   └── dtos/               # 数据传输对象
│   │       └── UserDtos.ts
│   │
│   ├── infrastructure/         # 基础设施层
│   │   ├── api/                # API客户端
│   │   │   └── UserApiClient.ts
│   │   └── repositories/       # 仓储实现
│   │       └── UserRepositoryImpl.ts
│   │
│   └── presentation/           # 表现层
│       ├── stores/             # 状态管理
│       │   └── userStore.ts
│       ├── views/              # 页面组件
│       │   └── ProfileView.vue
│       └── components/         # 表现组件
│
└── authentication/             # 认证模块
    ├── domain/                 # 领域层
    │   ├── models/             # 认证领域模型
    │   │   └── Auth.ts         # 会话、凭据等模型
    │   ├── repositories/       # 认证仓储接口
    │   │   └── IAuthRepository.ts
    │   └── services/           # 认证领域服务
    │       └── AuthDomainService.ts
    │
    ├── application/            # 应用层
    ├── infrastructure/         # 基础设施层
    └── presentation/           # 表现层
```

## 📋 已实现功能

### Account模块

#### ✅ Domain层 (领域层)

- **User.ts** - 用户领域模型
  - 封装用户基本信息访问
  - 提供UI相关的领域逻辑 (头像首字母、全名等)
  - 用户状态判断 (可编辑、可停用等)
  - 个人信息完整性检查

- **IUserRepository.ts** - 用户仓储接口
  - 定义用户CRUD操作契约
  - 用户查询、更新、状态管理
  - 用户名和邮箱可用性检查

- **UserDomainService.ts** - 用户领域服务
  - 个人信息完整性验证
  - 显示名称建议生成
  - 敏感操作权限检查
  - 用户状态描述和推荐操作

#### ✅ Application层 (应用层)

- **UserDtos.ts** - 数据传输对象
  - 用户创建、更新、查询DTO
  - 用户响应和操作结果DTO
  - 推荐操作和统计DTO

- **UserApplicationService.ts** - 用户应用服务
  - 协调领域对象和基础设施
  - 实现具体业务用例 (获取用户、更新资料、上传头像)
  - 数据验证和错误处理
  - DTO映射和业务流程控制

#### ✅ Infrastructure层 (基础设施层)

- **UserApiClient.ts** - API客户端
  - 封装HTTP请求
  - 统一错误处理和认证拦截
  - RESTful API调用方法

- **UserRepositoryImpl.ts** - 用户仓储实现
  - 实现IUserRepository接口
  - API调用封装和数据映射
  - 错误处理和异常转换

#### ✅ Presentation层 (表现层)

- **userStore.ts** - Pinia状态管理
  - 用户状态集中管理
  - 响应式数据和计算属性
  - 异步操作和错误处理

- **ProfileView.vue** - 用户资料页面
  - 完整的用户资料管理界面
  - 集成@dailyuse/ui组件库
  - 头像上传、信息编辑、快速操作

### Authentication模块

#### ✅ Domain层 (领域层)

- **Auth.ts** - 认证领域模型
  - `AuthSession` - 认证会话模型 (token管理、过期检查)
  - `AuthCredentials` - 认证凭据模型 (用户名密码验证)
  - `PasswordResetRequest` - 密码重置请求模型
  - `VerificationCode` - 验证码模型

- **IAuthRepository.ts** - 认证仓储接口
  - 登录、登出、token刷新
  - 密码重置和修改
  - 验证码发送和验证
  - 会话管理 (多设备支持)

- **AuthDomainService.ts** - 认证领域服务
  - 凭据安全性验证
  - 会话安全等级计算
  - 密码重置安全性检查
  - 登录频率异常检测
  - 会话过期提醒机制

## 🔗 模块间依赖关系

```
┌─────────────────┐    ┌─────────────────┐
│  Authentication │    │     Account     │
│     Module      │    │     Module      │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────┬───────────────┘
                 │
         ┌─────────────────┐
         │  @dailyuse/ui   │
         │   Components    │
         └─────────────────┘
                 │
     ┌─────────────────────────┐
     │  @dailyuse/domain-client │
     │    Domain Objects       │
     └─────────────────────────┘
```

## 🎯 核心设计原则

### 1. 依赖倒置

- 领域层定义接口，基础设施层实现
- 应用层依赖抽象，不依赖具体实现

### 2. 单一职责

- 每个类和服务都有明确的单一职责
- 领域逻辑与技术实现分离

### 3. 开闭原则

- 通过接口扩展功能
- 核心领域逻辑稳定，基础设施可替换

### 4. 聚合根管理

- User作为聚合根管理个人信息
- AuthSession管理认证状态和token

## 🚀 集成指南

### 1. 依赖注入设置

```typescript
// main.ts
import { UserApplicationService } from './modules/account/application/services/UserApplicationService';
import { UserRepository } from './modules/account/infrastructure/repositories/UserRepositoryImpl';
import { UserApiClient } from './modules/account/infrastructure/api/UserApiClient';
import { UserDomainService } from './modules/account/domain/services/UserDomainService';

// 创建依赖
const userApiClient = new UserApiClient();
const userRepository = new UserRepository(userApiClient);
const userDomainService = new UserDomainService();
const userApplicationService = new UserApplicationService(userRepository, userDomainService);

// 注入到store
const userStore = useUserStore();
userStore.setUserApplicationService(userApplicationService);
```

### 2. 路由配置

```typescript
// router.ts
const routes = [
  {
    path: '/profile',
    component: () => import('./modules/account/presentation/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
];
```

### 3. UI组件使用

```vue
<template>
  <DuProfileForm
    :user-data="userStore.currentUser"
    @submit="handleProfileUpdate"
    @avatar-upload="handleAvatarUpload"
  />
</template>

<script setup>
import { DuProfileForm } from '@dailyuse/ui';
import { useUserStore } from './modules/account/presentation/stores/userStore';
</script>
```

## 📈 扩展计划

### 短期扩展

- [ ] Authentication模块的Application和Infrastructure层实现
- [ ] 完整的登录/注册页面组件
- [ ] 密码重置流程页面
- [ ] 多设备会话管理界面

### 中期目标

- [ ] 用户权限管理模块
- [ ] 社交登录集成
- [ ] 双因子认证支持
- [ ] 用户活动日志

### 长期规划

- [ ] 单点登录(SSO)集成
- [ ] 生物识别认证
- [ ] 风险评估和异常检测
- [ ] 合规性审计日志

## ✅ 质量保证

### 已实现的质量特性

- ✅ **类型安全** - 完整的TypeScript类型定义
- ✅ **错误处理** - 统一的错误处理和用户友好提示
- ✅ **数据验证** - 多层数据验证机制
- ✅ **安全性** - 密码强度检查、频率限制
- ✅ **可测试性** - 依赖注入和接口抽象
- ✅ **可维护性** - 清晰的分层架构和职责分离

这个DDD架构为DailyUse项目提供了坚实的基础，支持快速开发和长期维护。
