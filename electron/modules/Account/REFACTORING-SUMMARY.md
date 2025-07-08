# Account 模块密码重构总结

## 重构目标

根据 DDD 原则，将 Account 模块重构为纯粹的身份信息管理模块，将所有密码和认证相关功能迁移到 Authentication 模块。

## 已完成的重构

### 1. Account 聚合根 (account.ts)

**移除的内容：**
- ✅ 移除 Password 值对象依赖
- ✅ 移除构造函数中的 password 参数
- ✅ 移除所有密码相关方法（changePassword, verifyPassword 等）

**保留的内容：**
- ✅ 身份信息管理（用户名、邮箱、手机号）
- ✅ 账号状态管理（启用/禁用/暂停）
- ✅ 角色管理
- ✅ 验证流程（邮箱验证、手机验证）

### 2. Account 类型定义 (account.ts)

**修改的内容：**
- ✅ IAccount 接口移除所有密码相关方法
- ✅ RegisterData 接口移除 password 和 confirmPassword 字段
- ✅ 保留纯身份信息字段

### 3. Account 仓库 (sqliteAccountRepository.ts)

**移除的内容：**
- ✅ 移除 Password 值对象导入
- ✅ insertAccount 方法移除密码字段处理
- ✅ updateAccount 方法移除密码字段处理
- ✅ mapRowToAccount 方法移除密码相关映射

**清理的内容：**
- ✅ 数据库查询语句不再包含 password 字段
- ✅ 账号创建和更新逻辑专注于身份信息

### 4. Account 应用服务 (mainAccountApplicationService.ts)

**重构的内容：**
- ✅ 完全重写为专注身份信息管理的服务
- ✅ 移除所有认证相关依赖（AuthenticationApplicationService、SessionManagementService）
- ✅ 移除登录、登出、密码修改等认证相关方法
- ✅ 保留账号管理核心功能：创建、查询、更新、禁用/启用、验证

**新增功能：**
- ✅ getAccountById: 根据ID获取账号
- ✅ getAccountByUsername: 根据用户名获取账号
- ✅ updateAccountInfo: 更新账号信息
- ✅ disableAccount: 禁用账号
- ✅ enableAccount: 启用账号
- ✅ verifyEmail: 验证邮箱
- ✅ verifyPhone: 验证手机号

### 5. Account IPC 处理器 (newAccountIpcHandler.ts)

**修改的内容：**
- ✅ 注册接口移除密码字段，添加重构说明
- ✅ 登录接口移除密码字段，添加重构说明
- ✅ 登出接口替换为重构说明
- ✅ 密码修改接口替换为重构说明
- ✅ 会话验证接口替换为重构说明
- ✅ 修复时间戳访问问题（timestamp → getTime()）
- ✅ 注销账号接口改为调用 disableAccount

### 6. 数据库结构 (database.ts)

**清理的内容：**
- ✅ login_sessions 表移除密码字段
- ✅ 默认用户创建逻辑将密码存储到 auth_credentials 表
- ✅ 数据迁移脚本确保现有密码迁移到认证模块
- ✅ 移除重复的迁移函数，统一版本管理

## Authentication 模块设计

密码和认证相关功能已在 Authentication 模块中实现：

### 核心组件
- **AuthCredential 聚合根**: 管理密码哈希、盐值、算法等
- **Password 值对象**: 密码验证和加密逻辑
- **Token 值对象**: 令牌管理
- **Session 实体**: 会话管理
- **MFADevice 实体**: 多因素认证设备

### 仓库层
- **SqliteAuthCredentialRepository**: 认证凭证存储
- **SqliteTokenRepository**: 令牌存储
- **SqliteUserSessionRepository**: 用户会话存储
- **SqliteMFADeviceRepository**: MFA 设备存储

## 待完成工作

### 1. 集成重构
- [ ] 更新主进程初始化逻辑，集成 Authentication 模块
- [ ] 实现 Authentication 应用服务层
- [ ] 创建 Authentication IPC 处理器

### 2. UI 层适配
- [ ] 更新前端注册界面，移除密码字段或集成认证模块接口
- [ ] 更新前端登录界面，调用认证模块接口
- [ ] 更新密码修改界面，调用认证模块接口

### 3. 测试和验证
- [ ] 测试账号创建流程（不含密码）
- [ ] 测试认证模块独立功能
- [ ] 测试跨模块协作（Account + Authentication）

## 架构优势

### 1. 职责分离
- **Account 模块**: 专注身份信息管理，职责单一
- **Authentication 模块**: 专注认证和会话管理
- **SessionLogging 模块**: 专注审计和监控

### 2. 符合 DDD 原则
- 每个模块都有明确的界限上下文
- 聚合根职责清晰，不会跨域
- 领域模型反映真实业务概念

### 3. 可扩展性
- 认证策略可独立演进（OAuth、JWT、MFA等）
- 身份信息管理不受认证方式影响
- 便于添加新的认证方式

## 总结

✅ **重构完成**: Account 模块已成功去除所有密码相关内容，专注于身份信息管理

⚠️ **需要注意**: 当前 Account 模块的注册、登录、密码修改接口已标记为需要重构，需要与 Authentication 模块集成才能正常工作

🎯 **下一步**: 完成 Authentication 模块的应用服务层和 IPC 处理器，实现完整的认证流程
