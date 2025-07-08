# 仓库层重构总结

## 模块职责划分

### 1. Account 模块 - 身份信息管理
- **职责**: 仅管理用户身份信息（用户名、邮箱、手机号、个人资料等）
- **聚合根**: `Account`
- **仓库**: `SqliteAccountRepository`
- **重要变更**: 已完全移除密码相关内容

### 2. Authentication 模块 - 认证与会话管理
- **职责**: 管理认证凭证、用户会话、令牌和多因素认证
- **聚合根**: `AuthCredential`
- **实体**: `Session`, `MFADevice`  
- **值对象**: `Password`, `Token`
- **仓库**: 
  - `SqliteAuthCredentialRepository` - 认证凭证管理
  - `SqliteUserSessionRepository` - 用户会话管理（登录状态）
  - `SqliteTokenRepository` - 各种令牌管理
  - `SqliteMFADeviceRepository` - 多因素认证设备管理

### 3. SessionLogging 模块 - 会话行为审计
- **职责**: 记录和审计用户的会话行为，用于安全监控
- **聚合根**: `SessionLog`
- **实体**: `AuditTrail`
- **值对象**: `IPLocation`
- **仓库**:
  - `SqliteSessionLogRepository` - 会话操作日志记录
  - `SqliteAuditTrailRepository` - 安全审计轨迹记录

## 关键区别说明

### Session vs SessionLog
很重要的概念区别：

1. **Authentication.Session (用户会话)**:
   - 表示用户当前的登录状态
   - 包含会话ID、过期时间、设备信息等
   - 用于验证用户是否已登录
   - 存储在 `auth_sessions` 表

2. **SessionLogging.SessionLog (会话日志)**:
   - 记录用户的登录/登出行为
   - 用于安全审计和异常检测
   - 包含风险评估、地理位置等
   - 存储在 `session_logs` 表

## 数据库表对应关系

### Authentication 模块表
- `auth_credentials` - 认证凭证（密码哈希等）
- `auth_sessions` - 活跃用户会话
- `auth_tokens` - 各种令牌（记住我、重置密码等）
- `mfa_devices` - 多因素认证设备

### SessionLogging 模块表  
- `session_logs` - 会话操作日志
- `audit_trails` - 详细审计轨迹

### Account 模块表
- `users` - 用户身份信息（不含密码）

## 仓库工厂使用

```typescript
// 获取 Authentication 模块仓库
const authCredentialRepo = RepositoryFactory.getAuthCredentialRepository();
const userSessionRepo = RepositoryFactory.getUserSessionRepository(); // 用户会话
const tokenRepo = RepositoryFactory.getTokenRepository();
const mfaDeviceRepo = RepositoryFactory.getMFADeviceRepository();

// 获取 SessionLogging 模块仓库  
const sessionLogRepo = RepositoryFactory.getSessionLogRepository(); // 会话日志
const auditTrailRepo = RepositoryFactory.getAuditTrailRepository();

// 获取 Account 模块仓库
const accountRepo = RepositoryFactory.getAccountRepository();
```

## 业务流程示例

### 1. 用户登录流程
```typescript
// 1. 验证认证凭证
const credential = await authCredentialRepo.findByAccountId(accountId);
const isValidPassword = credential.verifyPassword(password);

// 2. 创建用户会话
const session = new Session(sessionId, accountId, deviceInfo, ipAddress);
await userSessionRepo.save(session);

// 3. 记录登录日志
const sessionLog = new SessionLog(logId, accountId, OperationType.LOGIN, deviceInfo, ipLocation);
await sessionLogRepo.save(sessionLog);
```

### 2. 修改密码流程
```typescript
// 1. 验证当前密码（Authentication 模块负责）
const credential = await authCredentialRepo.findByAccountId(accountId);
const isValid = credential.verifyPassword(oldPassword);

// 2. 更新密码
credential.changePassword(newPassword);
await authCredentialRepo.save(credential);

// 3. 终止所有其他会话
await userSessionRepo.deleteByAccountId(accountId);

// 4. 记录安全操作
const auditTrail = new AuditTrail(auditId, accountId, 'password_change', 'User changed password', RiskLevel.MEDIUM, ipLocation);
await auditTrailRepo.save(auditTrail);
```

## 重构完成情况

✅ **已完成**:
- Account 模块去除密码相关内容
- Authentication 模块领域模型和仓库实现
- SessionLogging 模块领域模型和仓库实现  
- 数据库表结构和索引
- 仓库工厂统一管理
- 清晰的职责边界划分

🔄 **待完成**:
- AuthenticationApplicationService 完整实现
- SessionLoggingApplicationService 实现
- IPC 处理器更新
- 主进程与渲染进程集成
- 完整的业务流程测试

这个重构严格遵循了 DDD 原则，将认证、会话管理和审计功能分离到不同的限界上下文中，使系统更加清晰和可维护。

## 数据库表结构

### Authentication 模块表

#### auth_credentials
```sql
CREATE TABLE auth_credentials (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_algorithm TEXT NOT NULL DEFAULT 'bcrypt',
  password_created_at INTEGER NOT NULL,
  last_auth_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
);
```

#### auth_sessions
```sql
CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  device_info TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
);
```

#### auth_tokens
```sql
CREATE TABLE auth_tokens (
  value TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('remember_me', 'access_token', 'refresh_token', 'email_verification', 'password_reset')),
  account_id TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  device_info TEXT,
  is_revoked BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
);
```

#### mfa_devices
```sql
CREATE TABLE mfa_devices (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('totp', 'sms', 'email', 'hardware_key', 'backup_codes')),
  name TEXT NOT NULL,
  secret_key TEXT,
  phone_number TEXT,
  email_address TEXT,
  backup_codes TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT 0,
  verification_attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
);
```

### SessionLogging 模块表

#### session_logs
```sql
CREATE TABLE session_logs (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  session_id TEXT,
  operation_type TEXT NOT NULL CHECK(operation_type IN ('login', 'logout', 'expired', 'forced_logout', 'session_refresh', 'mfa_verification', 'password_change', 'suspicious_activity')),
  device_info TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  ip_country TEXT,
  ip_region TEXT,
  ip_city TEXT,
  ip_latitude REAL,
  ip_longitude REAL,
  ip_timezone TEXT,
  ip_isp TEXT,
  user_agent TEXT,
  login_time INTEGER,
  logout_time INTEGER,
  duration INTEGER,
  risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  risk_factors TEXT,
  is_anomalous BOOLEAN NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
);
```

#### audit_trails
```sql
CREATE TABLE audit_trails (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  session_log_id TEXT,
  operation_type TEXT NOT NULL,
  description TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
  ip_address TEXT NOT NULL,
  ip_country TEXT,
  ip_region TEXT,
  ip_city TEXT,
  ip_latitude REAL,
  ip_longitude REAL,
  ip_timezone TEXT,
  ip_isp TEXT,
  user_agent TEXT,
  metadata TEXT,
  is_alert_triggered BOOLEAN NOT NULL DEFAULT 0,
  alert_level TEXT CHECK(alert_level IN ('info', 'warning', 'error', 'critical')),
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE,
  FOREIGN KEY (session_log_id) REFERENCES session_logs(id) ON DELETE CASCADE
);
```

## 仓库工厂

使用 `RepositoryFactory` 统一管理所有仓库实例：

```typescript
import { RepositoryFactory } from '../shared/services/repositoryFactory';

// 获取仓库实例
const authCredentialRepo = RepositoryFactory.getAuthCredentialRepository();
const sessionRepo = RepositoryFactory.getSessionRepository();
const tokenRepo = RepositoryFactory.getTokenRepository();
const mfaDeviceRepo = RepositoryFactory.getMFADeviceRepository();
const sessionLogRepo = RepositoryFactory.getSessionLogRepository();
const auditTrailRepo = RepositoryFactory.getAuditTrailRepository();
const accountRepo = RepositoryFactory.getAccountRepository();
```

## 使用示例

### 1. 认证凭证管理

```typescript
// 创建认证凭证
const password = new Password('securePassword123!');
const credential = new AuthCredential('cred-id', 'account-id', password);
await authCredentialRepo.save(credential);

// 验证密码
const foundCredential = await authCredentialRepo.findByAccountId('account-id');
const isValid = foundCredential?.verifyPassword('securePassword123!');
```

### 2. 会话管理

```typescript
// 创建会话
const session = new Session('session-id', 'account-id', 'Device Info', '192.168.1.1');
await sessionRepo.save(session);

// 查找活跃会话
const activeSessions = await sessionRepo.findActiveByAccountId('account-id');
```

### 3. 令牌管理

```typescript
// 创建记住我令牌
const token = Token.createRememberToken('account-id', 'Device Info');
await tokenRepo.save(token);

// 验证令牌
const foundToken = await tokenRepo.findByValue(token.value);
const isValid = foundToken?.isValid();
```

### 4. 会话日志记录

```typescript
// 创建IP位置
const ipLocation = new IPLocation('192.168.1.1', 'China', 'Beijing', 'Beijing');

// 记录登录
const sessionLog = new SessionLog('log-id', 'account-id', OperationType.LOGIN, 'Device Info', ipLocation);
await sessionLogRepo.save(sessionLog);
```

### 5. 审计轨迹

```typescript
// 创建审计记录
const auditTrail = new AuditTrail('audit-id', 'account-id', 'login_attempt', 'User login attempt', RiskLevel.LOW, ipLocation);
await auditTrailRepo.save(auditTrail);
```

## 测试

运行仓库层测试：

```bash
# 编译并运行测试
npm run build
node dist-electron/tests/repositoryTest.js
```

## 性能优化

所有表都配置了适当的索引以优化查询性能：

- 按账户ID查询的索引
- 按时间范围查询的索引
- 按状态/类型查询的索引
- 复合索引用于复杂查询

## 安全考虑

1. **密码安全**: 使用bcrypt算法加密存储
2. **令牌安全**: 支持令牌撤销和过期管理
3. **会话安全**: 自动检测异常登录和风险评估
4. **审计完整性**: 完整记录所有安全相关操作

## 扩展性

仓库接口设计遵循SOLID原则，便于：
- 添加新的存储后端
- 扩展查询功能
- 集成缓存层
- 支持分布式存储
