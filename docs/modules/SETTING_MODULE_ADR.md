# Setting 模块架构决策记录 (ADR)

## ADR-001: 采用 DDD 分层架构

### 状态
已接受 (2024-10-04)

### 背景
Setting 模块需要一个清晰、可维护的架构来管理用户偏好设置。

### 决策
采用领域驱动设计 (DDD) 的四层架构：
- Domain Layer: 业务逻辑和规则
- Application Layer: 用例编排
- Infrastructure Layer: 技术实现
- Interface Layer: 外部接口

### 理由
1. **关注点分离**: 每层有明确的职责
2. **业务逻辑保护**: 核心逻辑在 Domain 层，不依赖外部
3. **可测试性**: 每层可以独立测试
4. **可维护性**: 易于理解和修改

### 影响
- 需要更多的代码文件
- 初期开发时间较长
- 但长期维护成本降低

---

## ADR-002: 使用事件驱动架构实现模块解耦

### 状态
已接受 (2024-10-04)

### 背景
Setting 模块需要与 Theme、Editor 等模块通信，但不希望产生强耦合。

### 决策
采用事件驱动架构 (EDA)：
- Setting 模块发布领域事件
- 其他模块订阅并响应事件
- 通过事件总线进行通信

### 理由
1. **松耦合**: 模块间不直接依赖
2. **可扩展**: 易于添加新的监听器
3. **审计**: 事件记录提供操作历史
4. **异步处理**: 可以异步处理事件

### 备选方案
1. **直接调用**: Setting 直接调用 Theme 模块
   - 缺点: 强耦合，难以测试
2. **消息队列**: 使用 RabbitMQ/Redis
   - 缺点: 增加复杂度，本地开发困难

### 影响
- 需要实现事件总线
- 需要定义事件类型
- 调试可能稍微复杂

---

## ADR-003: UserPreferences 作为聚合根

### 状态
已接受 (2024-10-04)

### 背景
用户偏好设置包含多个相关属性，需要确定如何组织。

### 决策
将 UserPreferences 设计为聚合根，包含所有用户级别的偏好设置。

### 理由
1. **事务一致性**: 所有偏好在一个事务内更新
2. **业务规则**: 可以在聚合内实施规则（如禁用通知时禁用邮件通知）
3. **简化查询**: 一次查询获取所有偏好

### 备选方案
1. **多个独立实体**: 语言设置、主题设置等分开
   - 缺点: 需要多次查询，事务管理复杂
2. **值对象**: 将偏好作为值对象
   - 缺点: 无法单独持久化

### 影响
- 表结构相对扁平
- 单表可能变大
- 但查询和更新简单

---

## ADR-004: 使用 Prisma 作为 ORM

### 状态
已接受 (2024-10-04)

### 背景
需要一个类型安全的 ORM 来操作数据库。

### 决策
使用 Prisma 作为 ORM。

### 理由
1. **类型安全**: TypeScript 原生支持
2. **迁移管理**: 内置迁移工具
3. **查询构建器**: 类型安全的查询
4. **性能**: 生成优化的 SQL

### 备选方案
1. **TypeORM**: 
   - 缺点: 类型推断不如 Prisma
2. **Sequelize**:
   - 缺点: TypeScript 支持较弱
3. **Raw SQL**:
   - 缺点: 无类型安全，迁移管理困难

### 影响
- 需要维护 schema.prisma
- 需要运行迁移
- 但开发效率高

---

## ADR-005: 事件发布在 Application Layer

### 状态
已接受 (2024-10-04)

### 背景
需要确定在哪一层发布事件。

### 决策
在 Application Layer 发布事件，但事件在 Domain Layer 生成。

### 理由
1. **职责分离**: Domain 生成事件（业务逻辑），Application 发布事件（基础设施）
2. **测试**: Domain Layer 不依赖事件总线，易于测试
3. **灵活性**: Application Layer 可以决定是否发布、何时发布

### 流程
```
Domain Service → 生成事件
     ↓
Application Service → 接收事件
     ↓
Event Publisher → 发布到事件总线
```

### 影响
- Domain Service 返回 {result, event}
- Application Service 负责发布
- 清晰的职责划分

---

## ADR-006: 使用简单的 EventEmitter 作为事件总线

### 状态
已接受 (2024-10-04)

### 背景
需要选择事件总线实现。

### 决策
使用 Node.js 内置的 EventEmitter 实现简单的事件总线。

### 理由
1. **简单**: 无需额外依赖
2. **足够**: 满足当前需求
3. **性能**: 内存中传递，速度快
4. **易于测试**: 简单的 API

### 备选方案
1. **RabbitMQ/Redis**: 
   - 优点: 分布式、持久化
   - 缺点: 过于复杂，本地开发困难
2. **EventEmitter2**:
   - 优点: 更多功能（通配符等）
   - 缺点: 额外依赖

### 限制
- 仅在单个进程内有效
- 事件不持久化
- 不支持分布式

### 未来考虑
如果需要分布式或持久化，可以替换为消息队列，接口保持不变。

---

## ADR-007: Controller 使用静态方法

### 状态
已接受 (2024-10-04)

### 背景
需要确定 Controller 的设计模式。

### 决策
Controller 使用静态方法和静态服务实例。

### 理由
1. **一致性**: 与 GoalController 等保持一致
2. **简单**: 无需依赖注入容器
3. **性能**: 单例模式，减少实例创建

### 示例
```typescript
export class UserPreferencesController {
  private static service = new UserPreferencesApplicationService(...);
  
  static async getPreferences(req, res) { ... }
}
```

### 备选方案
1. **依赖注入**:
   - 优点: 更灵活，易于测试
   - 缺点: 需要 DI 容器，增加复杂度

### 影响
- 每个 Controller 是单例
- 服务也是单例
- 测试时需要 mock 静态方法

---

## ADR-008: 响应格式使用 ResponseBuilder

### 状态
已接受 (2024-10-04)

### 背景
需要统一的 API 响应格式。

### 决策
使用 @dailyuse/contracts 的 ResponseBuilder。

### 理由
1. **一致性**: 全项目统一的响应格式
2. **类型安全**: TypeScript 类型定义
3. **错误处理**: 标准化的错误响应

### 格式
```typescript
// 成功
{
  code: 'SUCCESS',
  message: string,
  data: T
}

// 错误
{
  code: ResponseCode,
  message: string,
  debug?: string
}
```

---

## ADR-009: 使用 UTC 时间戳存储时间

### 状态
已接受 (2024-10-04)

### 背景
UserPreferences 中的时间字段存储格式。

### 决策
在 Domain Model 中使用 number (timestamp)，在 Prisma 中使用 DateTime。

### 理由
1. **简单**: 数字易于计算
2. **时区无关**: 不受时区影响
3. **序列化**: JSON 序列化简单

### 转换
```typescript
// Domain → Prisma
createdAt: new Date(preferences.createdAt)

// Prisma → Domain
createdAt: prisma.createdAt.getTime()
```

---

## ADR-010: 默认值在多处定义

### 状态
已接受 (2024-10-04)

### 背景
默认值应该在哪里定义？

### 决策
在多处定义：
1. Prisma Schema: 数据库默认值
2. Domain Model: createDefault() 方法
3. Application Service: resetToDefault() 方法

### 理由
1. **防御性编程**: 多层保护
2. **数据库完整性**: 即使绕过应用也有默认值
3. **业务逻辑**: Domain 层控制业务默认值

### 保持同步
- 使用常量文件
- 或者从 Domain Model 生成 Schema

---

## 总结

这些架构决策共同构成了 Setting 模块的技术基础：
- DDD 提供清晰的分层
- 事件驱动实现松耦合
- Prisma 提供类型安全
- EventEmitter 提供简单的事件总线

未来可以根据需求调整这些决策，但应保持向后兼容。
