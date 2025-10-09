# 日志系统使用示例

## API 项目使用

```typescript
// apps/api/src/main.ts
import { LoggerFactory, ConsoleTransport, FileTransport, LogLevel } from '@dailyuse/utils';
import path from 'path';

// 配置全局日志系统
LoggerFactory.configure({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  enableInProduction: true,
  transports: [
    // 控制台输出
    new ConsoleTransport({
      level: LogLevel.DEBUG,
      colorize: true,
      timestamp: true,
    }),
    
    // 文件输出（仅生产环境）
    ...(process.env.NODE_ENV === 'production'
      ? [
          new FileTransport({
            filename: path.join(__dirname, '../logs/app.log'),
            level: LogLevel.INFO,
            json: true,
          }),
          new FileTransport({
            filename: path.join(__dirname, '../logs/error.log'),
            level: LogLevel.WARN,
            json: true,
          }),
        ]
      : []),
  ],
});
```

```typescript
// apps/api/src/modules/goal/application/services/GoalApplicationService.ts
import { createLogger } from '@dailyuse/utils';

export class GoalApplicationService {
  private readonly logger = createLogger('GoalService');

  async createGoal(dto: CreateGoalDto) {
    this.logger.info('Creating goal', { title: dto.title, accountUuid: dto.accountUuid });
    
    try {
      const entity = GoalMapper.toDomain(dto);
      const goal = await this.goalDomainService.createGoal(entity);
      
      this.logger.info('Goal created successfully', { 
        goalId: goal.id, 
        directoryId: goal.directoryId 
      });
      
      return ApiResponse.success(goal);
    } catch (error) {
      this.logger.error('Failed to create goal', error, { dto });
      return ApiResponse.error('Failed to create goal', error);
    }
  }
}
```

---

## Web 项目使用

```typescript
// apps/web/src/main.ts
import { LoggerFactory, ConsoleTransport, LogLevel } from '@dailyuse/utils';

// 配置浏览器日志
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

const logger = createLogger('WebApp');
logger.info('Vue application mounted', { 
  version: import.meta.env.VITE_APP_VERSION 
});
```

```typescript
// apps/web/src/modules/goal/composables/useGoalActions.ts
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalActions');

export function useGoalActions() {
  const createGoal = async (data: CreateGoalInput) => {
    logger.debug('User creating goal', { title: data.title });
    
    try {
      const response = await goalApi.create(data);
      
      if (response.success) {
        logger.info('Goal created successfully', { goalId: response.data.id });
        return response.data;
      } else {
        logger.warn('Goal creation failed', { error: response.error });
        throw new Error(response.error);
      }
    } catch (error) {
      logger.error('Failed to create goal', error, { data });
      throw error;
    }
  };

  return { createGoal };
}
```

---

## Desktop 项目使用

### 主进程 (Electron Main)

```typescript
// apps/desktop/electron/main.ts
import { app } from 'electron';
import { LoggerFactory, ConsoleTransport, FileTransport, LogLevel } from '@dailyuse/utils';
import path from 'path';

// 配置主进程日志
LoggerFactory.configure({
  level: 'debug',
  enableInProduction: true,
  transports: [
    new ConsoleTransport({
      level: LogLevel.DEBUG,
      colorize: true,
      timestamp: true,
    }),
    
    new FileTransport({
      filename: path.join(app.getPath('logs'), 'main.log'),
      level: LogLevel.INFO,
      json: true,
    }),
  ],
});

const logger = createLogger('ElectronMain');

app.whenReady().then(() => {
  logger.info('Electron app ready');
  createWindow();
});

app.on('window-all-closed', () => {
  logger.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### 渲染进程 (Electron Renderer)

```typescript
// apps/desktop/src/main.ts
import { LoggerFactory, ConsoleTransport, LogLevel } from '@dailyuse/utils';

// 渲染进程配置（类似浏览器）
LoggerFactory.configure({
  level: import.meta.env.DEV ? 'debug' : 'info',
  enableInProduction: false,
  transports: [
    new ConsoleTransport({
      level: LogLevel.DEBUG,
      colorize: true,
      timestamp: true,
    }),
  ],
});

const logger = createLogger('DesktopApp');
logger.info('Desktop app mounted');
```

---

## 高级用法

### 1. HTTP 请求日志

```typescript
// apps/api/src/middleware/loggingMiddleware.ts
import { createLogger } from '@dailyuse/utils';
import type { Request, Response, NextFunction } from 'express';

const logger = createLogger('HTTP');

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;

    logger.http(`${method} ${url}`, {
      statusCode,
      duration,
      ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}
```

### 2. 错误边界日志

```typescript
// apps/web/src/errorHandler.ts
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ErrorBoundary');

export function setupGlobalErrorHandler() {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason);
  });
}
```

### 3. 模块化日志

```typescript
// 创建模块级 logger
export class AuthenticationService {
  private readonly logger = createLogger('AuthService');
  private readonly loginLogger = this.logger.child('Login');
  private readonly registerLogger = this.logger.child('Register');

  async login(credentials: LoginDto) {
    this.loginLogger.info('User attempting login', { username: credentials.username });
    // ...
  }

  async register(data: RegisterDto) {
    this.registerLogger.info('User attempting registration', { username: data.username });
    // ...
  }
}
```

---

## 环境变量配置

### API (.env)

```env
NODE_ENV=production
LOG_LEVEL=info
LOG_DIR=./logs
```

```typescript
// apps/api/src/config/logger.config.ts
import { LoggerFactory, FileTransport, LogLevel } from '@dailyuse/utils';
import path from 'path';

const logDir = process.env.LOG_DIR || './logs';
const logLevel = (process.env.LOG_LEVEL as any) || 'info';

LoggerFactory.configure({
  level: logLevel,
  enableInProduction: true,
  transports: [
    new FileTransport({
      filename: path.join(logDir, 'combined.log'),
      level: LogLevel.INFO,
      json: true,
    }),
    new FileTransport({
      filename: path.join(logDir, 'error.log'),
      level: LogLevel.ERROR,
      json: true,
    }),
  ],
});
```

### Web (.env)

```env
VITE_LOG_LEVEL=debug
VITE_ENABLE_LOGGING=true
```

```typescript
// apps/web/src/config/logger.config.ts
import { LoggerFactory, ConsoleTransport, LogLevel } from '@dailyuse/utils';

const logLevel = import.meta.env.VITE_LOG_LEVEL || 'info';
const enableLogging = import.meta.env.VITE_ENABLE_LOGGING === 'true';

if (enableLogging) {
  LoggerFactory.configure({
    level: logLevel as any,
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

---

## 输出示例

### 控制台输出 (Node.js)

```
2024-01-15T10:30:15.234Z [INFO] [GoalService] Creating goal
  Metadata: { title: 'Learn TypeScript', accountUuid: 'abc-123' }
2024-01-15T10:30:15.456Z [INFO] [GoalService] Goal created successfully
  Metadata: { goalId: 'goal-456', directoryId: 'dir-789' }
```

### 控制台输出 (浏览器)

![Browser Console](https://example.com/browser-console.png)

### JSON 日志文件

```json
{"timestamp":"2024-01-15T10:30:15.234Z","level":"info","message":"Creating goal","context":"GoalService","metadata":{"title":"Learn TypeScript","accountUuid":"abc-123"}}
{"timestamp":"2024-01-15T10:30:15.456Z","level":"info","message":"Goal created successfully","context":"GoalService","metadata":{"goalId":"goal-456","directoryId":"dir-789"}}
{"timestamp":"2024-01-15T10:30:20.123Z","level":"error","message":"Failed to create goal","context":"GoalService","error":{"message":"Database connection failed","stack":"Error: Database connection failed\n    at ..."},"metadata":{"dto":{"title":"Test"}}}
```

---

## 性能监控示例

```typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('Performance');

export function measureAsync<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now();
    logger.debug(`[${operationName}] Started`);

    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      logger.info(`[${operationName}] Completed`, { duration });
      resolve(result);
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`[${operationName}] Failed`, error, { duration });
      reject(error);
    }
  });
}

// 使用
const result = await measureAsync('CreateGoal', () => 
  goalService.createGoal(dto)
);
```

---

**更多信息**: 请参阅完整文档 `docs/logger-usage-guide.md`
