# 日志系统集成完成报告

## 概述

已成功将 `@dailyuse/utils` 的跨平台日志系统集成到 DailyUse 项目中。

---

## ✅ 已完成的集成

### 1. API 项目集成

#### 1.1 日志配置文件

**文件**: `apps/api/src/config/logger.config.ts`

```typescript
import { LoggerFactory, ConsoleTransport, FileTransport, LogLevel } from '@dailyuse/utils';

// 生产环境：文件日志 + 控制台
// 开发环境：仅控制台（彩色输出）
```

**特性**:
- ✅ 开发环境：彩色控制台输出
- ✅ 生产环境：文件日志（combined.log + error.log）
- ✅ 环境变量配置支持（LOG_LEVEL, ENABLE_FILE_LOGS）
- ✅ JSON 格式日志便于分析

#### 1.2 入口文件集成

**文件**: `apps/api/src/index.ts`

```typescript
import { initializeLogger, getStartupInfo } from './config/logger.config';
import { createLogger } from '@dailyuse/utils';

initializeLogger();
const logger = createLogger('API');

// 使用示例
logger.info('Starting DailyUse API server...', getStartupInfo());
logger.info('Database connected successfully');
logger.error('Failed to start server', err);
```

**文件**: `apps/api/src/app.ts`

```typescript
const logger = createLogger('Express');

app.use((err: any, _req, res, _next) => {
  logger.error('Express error handler caught error', err, {
    status: err?.status,
    code: err?.code,
  });
});
```

---

### 2. 核心模块集成示例

#### AccountApplicationService

```typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountService');

// 在方法中使用
logger.info('Account saved to database', { uuid: account.uuid });
logger.warn('Authentication credential creation failed', { 
  uuid: account.uuid,
  message: result.message 
});
logger.error('Failed to create account', error);
```

---

## 🔄 需要迁移的模块

由于项目中有大量 `console.log`（120+ 处），建议**渐进式迁移**：

### 优先级 1：核心业务模块

1. **Account 模块**
   - `AccountApplicationService.ts` (20+ console.log)
   - 替换为: `const logger = createLogger('AccountService');`

2. **Authentication 模块**
   - `AuthenticationLoginService.ts` (25+ console.log)
   - `AuthenticationApplicationService.ts` (3+ console.log)
   - 替换为: `const logger = createLogger('AuthService');`

3. **Goal 模块**
   - `goalInitialization.ts` (6+ console.log)
   - `goalEventHandlers.ts` (10+ console.log)
   - 替换为: `const logger = createLogger('GoalService');`

### 优先级 2：基础设施模块

4. **事件系统**
   - `unifiedEventSystem.ts` (15+ console.log)
   - 替换为: `const logger = createLogger('EventSystem');`

5. **初始化系统**
   - `initializer.ts` (10+ console.log)
   - 替换为: `const logger = createLogger('Initializer');`

6. **Reminder 模块**
   - `ReminderApplicationService.ts` (5+ console.log)
   - `PrismaReminderAggregateRepository.ts` (6+ console.log)

---

## 📝 迁移指南

### 步骤 1: 添加 Logger 导入

```typescript
// 在文件顶部添加
import { createLogger } from '@dailyuse/utils';

// 在类外部或类内部创建 logger 实例
const logger = createLogger('ModuleName');
```

### 步骤 2: 替换 console.log

| 原始代码 | 替换为 |
|---------|--------|
| `console.log('message')` | `logger.info('message')` |
| `console.error('error:', err)` | `logger.error('error', err)` |
| `console.warn('warning')` | `logger.warn('warning')` |
| `console.debug('debug')` | `logger.debug('debug')` |

### 步骤 3: 添加结构化元数据

**之前**:
```typescript
console.log(`User ${username} logged in with ID ${userId}`);
```

**之后**:
```typescript
logger.info('User logged in', { username, userId });
```

### 步骤 4: 错误日志最佳实践

**之前**:
```typescript
console.error('Failed to create account:', error);
```

**之后**:
```typescript
logger.error('Failed to create account', error, { 
  accountData: dto,
  timestamp: new Date().toISOString() 
});
```

---

## 🌐 Web 项目集成（待完成）

### Web 日志配置

**文件**: `apps/web/src/config/logger.config.ts`

```typescript
import { LoggerFactory, ConsoleTransport, LogLevel } from '@dailyuse/utils';

export function initializeLogger(): void {
  LoggerFactory.configure({
    level: import.meta.env.DEV ? 'debug' : 'warn',
    enableInProduction: false,
    transports: [
      new ConsoleTransport({
        level: LogLevel.DEBUG,
        colorize: true,
        timestamp: true,
      }),
    ],
  });
}
```

### Web 入口集成

**文件**: `apps/web/src/main.ts`

```typescript
import { initializeLogger } from './config/logger.config';
import { createLogger } from '@dailyuse/utils';

// 初始化日志系统
initializeLogger();
const logger = createLogger('WebApp');

async function startApp() {
  logger.info('Starting Vue application...');
  
  try {
    await AppInitializationManager.initializeApp();
    logger.info('Application modules initialized');
    
    app.mount('#app');
    logger.info('Application mounted successfully');
  } catch (error) {
    logger.error('Application startup failed', error);
  }
}
```

---

## 📊 日志输出示例

### 开发环境控制台

```
2025-10-03T10:30:15.234Z [INFO] [API] Starting DailyUse API server...
  Metadata: { environment: 'development', nodeVersion: 'v20.x.x' }
2025-10-03T10:30:15.456Z [INFO] [API] Database connected successfully
2025-10-03T10:30:15.678Z [INFO] [API] Application initialized successfully
2025-10-03T10:30:15.890Z [INFO] [API] Schedule task scheduler started
2025-10-03T10:30:16.012Z [INFO] [API] API server listening on http://localhost:3888
```

### 生产环境文件日志 (JSON)

```json
{"timestamp":"2025-10-03T10:30:15.234Z","level":"info","message":"Starting DailyUse API server...","context":"API","metadata":{"environment":"production","nodeVersion":"v20.x.x"}}
{"timestamp":"2025-10-03T10:30:15.456Z","level":"info","message":"Database connected successfully","context":"API"}
{"timestamp":"2025-10-03T10:30:16.012Z","level":"info","message":"API server listening on http://localhost:3888","context":"API"}
{"timestamp":"2025-10-03T10:31:20.123Z","level":"error","message":"Express error handler caught error","context":"Express","error":{"message":"Database query failed","stack":"Error: Database query failed\n    at ..."},"metadata":{"status":500,"code":"DB_ERROR"}}
```

---

## 🎯 使用建议

### 1. 上下文命名规范

| 模块类型 | 上下文名称示例 |
|---------|-------------|
| 应用服务 | `AccountService`, `GoalService` |
| 领域服务 | `GoalDomainService` |
| 仓储层 | `AccountRepository`, `GoalRepository` |
| 基础设施 | `EventSystem`, `Initializer`, `Scheduler` |
| HTTP/API | `Express`, `API` |
| 控制器 | `AccountController`, `GoalController` |

### 2. 日志级别使用指南

| 级别 | 使用场景 | 示例 |
|------|---------|------|
| DEBUG | 调试信息、详细的流程跟踪 | `logger.debug('Processing step 1', { data })` |
| INFO | 正常业务流程、重要操作 | `logger.info('User logged in', { userId })` |
| WARN | 警告信息、非致命错误 | `logger.warn('API response slow', { duration })` |
| ERROR | 错误信息、异常 | `logger.error('Database failed', error)` |

### 3. 结构化日志最佳实践

**✅ 推荐**:
```typescript
logger.info('Account created', {
  accountUuid: account.uuid,
  username: account.username,
  type: account.type,
  createdAt: account.createdAt,
});
```

**❌ 不推荐**:
```typescript
logger.info(`Account created: ${account.uuid}, username: ${account.username}`);
```

**原因**: 结构化日志便于查询、过滤和分析。

### 4. 性能敏感代码

在高频调用的代码中，使用条件日志：

```typescript
// 仅在 DEBUG 级别时执行
if (logger.level === LogLevel.DEBUG) {
  logger.debug('High frequency operation', { 
    data: expensiveSerializationOperation() 
  });
}
```

---

## 🔧 环境配置

### .env 配置

```env
# 日志级别 (error | warn | info | http | debug)
LOG_LEVEL=info

# 开发环境启用文件日志
ENABLE_FILE_LOGS=false

# Node 环境
NODE_ENV=development
```

### 生产环境配置

```env
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_FILE_LOGS=true
```

---

## 📦 迁移检查清单

### API 项目

- [x] 创建日志配置文件
- [x] 集成到入口文件 (index.ts, app.ts)
- [x] 添加 AccountService logger 示例
- [ ] 迁移 Authentication 模块 (25+ console.log)
- [ ] 迁移 Goal 模块 (16+ console.log)
- [ ] 迁移 EventSystem (15+ console.log)
- [ ] 迁移 Initializer (10+ console.log)
- [ ] 迁移 Reminder 模块 (11+ console.log)

### Web 项目

- [ ] 创建日志配置文件
- [ ] 集成到入口文件 (main.ts)
- [ ] 迁移 Composables 中的 console.log
- [ ] 迁移 Stores 中的 console.log

### Desktop 项目

- [ ] 主进程日志配置
- [ ] 渲染进程日志配置

---

## 🚀 下一步行动

### 立即行动

1. **测试 API 服务器启动**
   ```bash
   cd apps/api
   pnpm dev
   ```
   验证日志输出格式正确

2. **逐步迁移核心模块**
   - 从 AccountService 开始
   - 每迁移一个模块，测试相关功能
   - 提交一次 Git 变更

### 渐进式迁移策略

**阶段 1**: 核心业务模块（本周）
- Account, Authentication, Goal

**阶段 2**: 基础设施模块（下周）
- EventSystem, Initializer, Scheduler

**阶段 3**: 其他模块（两周内）
- Reminder, Repository, Editor

**阶段 4**: Web 和 Desktop（三周内）

---

## 📚 相关文档

- 完整指南: `docs/logger-usage-guide.md`
- 使用示例: `docs/logger-examples.md`
- 系统提取: `LOGGER_SYSTEM_EXTRACTION_COMPLETE.md`

---

**集成状态**: ✅ API 入口完成，核心模块迁移中  
**最后更新**: 2025-10-03  
**维护者**: DailyUse Team
