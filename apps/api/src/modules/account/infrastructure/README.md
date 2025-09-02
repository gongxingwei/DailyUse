# Account Module Infrastructure

这个模块包含了 Account 模块的基础设施层实现，遵循 DDD (Domain-Driven Design) 架构模式。

## 目录结构

```
infrastructure/
├── di/                          # 依赖注入
│   ├── container.ts             # 账户模块依赖注入容器
│   └── examples.ts              # 使用示例和最佳实践
├── repositories/                # 仓储层
│   └── prisma/                  # Prisma ORM 实现
│       ├── PrismaAccountRepository.ts  # 账户仓储实现
│       ├── PrismaUserRepository.ts     # 用户仓储实现
│       └── index.ts             # 仓储导出文件
├── AccountValidationService.ts  # 账户验证服务
├── index.ts                     # 基础设施层总导出文件
└── README.md                    # 文档说明
```

## 快速开始

### 1. 基本使用

```typescript
import { accountContainer } from '@/modules/account/infrastructure';

// 获取账户服务
const accountService = accountContainer.resolve('accountService');

// 创建账户
const result = await accountService.createAccount({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'securePassword123',
  accountType: 'local',
});
```

### 2. 在控制器中使用

```typescript
import { accountContainer } from '@/modules/account/infrastructure';

export class AccountController {
  static async createAccount(req: Request, res: Response) {
    const accountService = accountContainer.resolve('accountService');
    const result = await accountService.createAccount(req.body);
    res.json(result);
  }
}
```

更多使用示例请参考 [`examples.ts`](./di/examples.ts) 文件。

## 依赖注入容器

### 核心特性

- **单例模式**: 确保所有依赖项的统一管理
- **类型安全**: 严格的 TypeScript 类型检查
- **资源管理**: 自动管理数据库连接和其他资源
- **调试友好**: 提供容器状态查询和健康检查功能
- **可扩展**: 支持未来添加角色和权限仓储

### 可用服务

| 服务名称            | 类型                      | 描述         |
| ------------------- | ------------------------- | ------------ |
| `prismaClient`      | PrismaClient              | 数据库客户端 |
| `accountRepository` | PrismaAccountRepository   | 账户仓储     |
| `userRepository`    | PrismaUserRepository      | 用户仓储     |
| `emailService`      | EmailService              | 邮件服务     |
| `validationService` | AccountValidationService  | 验证服务     |
| `accountService`    | AccountApplicationService | 账户应用服务 |

### 容器方法

```typescript
// 解析服务
const service = accountContainer.resolve('serviceName');

// 检查服务是否存在
const exists = accountContainer.hasService('serviceName');

// 获取所有可用服务
const services = accountContainer.getAvailableServices();

// 获取容器状态信息
const info = accountContainer.getContainerInfo();

// 释放资源
await accountContainer.dispose();
```

## 仓储层实现

### PrismaAccountRepository

实现了 `IAccountRepository` 接口，提供账户数据的持久化操作：

**主要方法：**

- `save(account)`: 保存账户（支持创建和更新）
- `findById(uuid)`: 根据ID查找账户
- `findByEmail(email)`: 根据邮箱查找账户
- `findByUsername(username)`: 根据用户名查找账户
- `findAll(page, limit)`: 分页查询账户
- `search(query)`: 搜索账户

**特性：**

- 使用事务确保数据一致性
- 自动处理用户配置信息的关联
- 支持复杂查询和搜索
- 类型安全的数据映射

### PrismaUserRepository

实现了 `IUserRepository` 接口，提供用户数据的持久化操作：

**主要方法：**

- `save(user)`: 保存用户信息
- `findById(uuid)`: 根据ID查找用户
- `findByAccountUuid(accountUuid)`: 根据账户UUID查找用户
- `findAll()`: 获取所有用户
- `delete(uuid)`: 删除用户

## 使用场景

### 在中间件中使用

```typescript
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const accountService = accountContainer.resolve('accountService');
  // 中间件逻辑...
};
```

### 在服务层中使用

```typescript
export class NotificationService {
  async sendNotification(accountId: string, message: string) {
    const accountRepo = accountContainer.resolve('accountRepository');
    const account = await accountRepo.findById(accountId);
    // 发送通知逻辑...
  }
}
```

### 在测试中使用

```typescript
describe('Account Service', () => {
  afterAll(async () => {
    await accountContainer.dispose();
  });

  it('should create account', async () => {
    const accountService = accountContainer.resolve('accountService');
    // 测试逻辑...
  });
});
```

## 健康检查和监控

### 容器健康检查

```typescript
import { ContainerHealthCheck } from './di/examples';

// 检查容器健康状态
const health = await ContainerHealthCheck.checkContainerHealth();
console.log(health);

// 列出所有可用服务
ContainerHealthCheck.listAvailableServices();
```

### 优雅关闭

```typescript
import { gracefulShutdown } from './di/examples';

// 应用关闭时自动清理资源
process.on('SIGTERM', gracefulShutdown);
```

## 最佳实践

### 1. 资源管理

- 始终在应用关闭时调用 `dispose()` 方法
- 在长时间运行的操作后释放不必要的连接

### 2. 错误处理

- 使用 try-catch 包装容器调用
- 检查服务是否存在再使用

### 3. 测试

- 在测试后清理容器状态
- 使用容器提供的测试辅助方法

### 4. 性能优化

- 合理使用仓储层的批量操作
- 避免在循环中重复解析服务

## 扩展计划

### 未来功能

- [ ] 角色仓储 (Role Repository)
- [ ] 权限仓储 (Permission Repository)
- [ ] 缓存层集成
- [ ] 性能监控和指标收集
- [ ] 配置热重载

### 架构改进

- [ ] 支持多租户
- [ ] 支持读写分离
- [ ] 支持分布式缓存
- [ ] 支持事件溯源

## 故障排除

### 常见问题

**1. 服务解析失败**

```
Error: Service serviceName not found in container
```

解决方案：检查服务名称拼写，或使用 `hasService()` 方法验证

**2. 数据库连接问题**

```
Error: Can't reach database server
```

解决方案：检查数据库配置和网络连接

**3. 内存泄漏**
解决方案：确保在应用关闭时调用 `dispose()` 方法

### 调试技巧

1. 使用容器信息方法：`getContainerInfo()`
2. 检查服务状态：`ContainerHealthCheck.checkContainerHealth()`
3. 启用 Prisma 日志：在环境变量中设置 `DATABASE_URL` 和日志级别

## 参考资料

- [Prisma 文档](https://www.prisma.io/docs)
- [DDD 架构模式](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [依赖注入模式](https://martinfowler.com/articles/injection.html)
