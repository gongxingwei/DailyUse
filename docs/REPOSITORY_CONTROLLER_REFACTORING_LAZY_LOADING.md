# Repository Controller 重构：懒加载与统计信息实体

## 问题1: getInstance 优雅使用 - 懒加载模式 ✅ 已实现

### 问题描述
Controller 直接 `new RepositoryApplicationService(...)` 不优雅，应该使用 `getInstance()`。但 `getInstance()` 是异步的，而静态属性初始化必须是同步的。

### 解决方案：懒加载（Lazy Initialization）

```typescript
export class RepositoryController {
  // ❌ 旧代码（直接初始化）
  // private static repositoryService = new RepositoryApplicationService(
  //   new PrismaRepositoryAggregateRepository(prisma),
  // );

  // ✅ 新代码（懒加载）
  private static repositoryService: RepositoryApplicationService | null = null;

  /**
   * 获取应用服务实例（懒加载）
   */
  private static async getRepositoryService(): Promise<RepositoryApplicationService> {
    if (!RepositoryController.repositoryService) {
      RepositoryController.repositoryService = await RepositoryApplicationService.getInstance();
    }
    return RepositoryController.repositoryService;
  }

  /**
   * 创建仓库
   */
  static async createRepository(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      
      // ❌ 旧代码
      // const domainService = RepositoryController.repositoryService.getDomainService();
      
      // ✅ 新代码（通过懒加载获取）
      const service = await RepositoryController.getRepositoryService();
      const domainService = service.getDomainService();

      const repository = await domainService.createRepository({...});
      // ...
    }
  }
}
```

### 优势

1. **优雅获取单例**: 使用 `getInstance()` 工厂方法
2. **延迟初始化**: 只在第一次调用时创建实例
3. **依赖注入支持**: Container 管理的依赖可以正确注入
4. **测试友好**: 可以通过 Container 替换测试实现
5. **一致性**: 所有模块都使用相同的获取模式

### 实现状态

✅ **已完成重构**:
- `getRepositoryService()` 懒加载方法
- 所有 7 个 Controller 方法都已更新
- 使用 `await getRepositoryService()` 替代直接访问

---

## 问题2: 统计信息实体设计 - 事件驱动架构

### 你的想法总结

1. 每个模块需要快速获取统计数据（仓库数量、资源数量等）
2. 临时计算统计数据性能不好
3. 创建**统计信息实体**，属性都是统计数据
4. 监听业务事件（新建仓库、新建资源等）自动更新统计信息

### 架构评估：✅ 非常好的想法！

这是**事件驱动架构（Event-Driven Architecture）+ CQRS模式**的典型应用。

### 设计方案

#### 1. 统计信息实体（Aggregate Root）

```prisma
// apps/api/prisma/schema.prisma

/// 仓库统计信息（按账户聚合）
model RepositoryStatistics {
  id                    Int      @id @default(autoincrement())
  account_uuid          String   @unique
  
  // 基础统计
  total_repositories    Int      @default(0)   // 总仓库数
  active_repositories   Int      @default(0)   // 活跃仓库数
  archived_repositories Int      @default(0)   // 归档仓库数
  
  // 资源统计
  total_resources       Int      @default(0)   // 总资源数
  total_files           Int      @default(0)   // 文件数
  total_folders         Int      @default(0)   // 文件夹数
  
  // Git 统计
  git_enabled_repos     Int      @default(0)   // 启用Git的仓库数
  total_commits         Int      @default(0)   // 总提交数
  
  // 引用统计
  total_references      Int      @default(0)   // 总引用数
  total_linked_contents Int      @default(0)   // 总链接内容数
  
  // 存储统计
  total_size_bytes      BigInt   @default(0)   // 总大小（字节）
  
  // 时间统计
  last_updated_at       DateTime @default(now())
  created_at            DateTime @default(now())
  
  // 关联
  account               Account  @relation(fields: [account_uuid], references: [uuid], onDelete: Cascade)
  
  @@index([account_uuid])
  @@map("repository_statistics")
}

// Account 模型中添加关系
model Account {
  // ... 现有字段
  
  repositoryStatistics RepositoryStatistics?
}
```

#### 2. 领域事件定义

```typescript
// packages/domain-core/src/events/RepositoryEvents.ts

export namespace RepositoryEvents {
  // 仓库事件
  export interface RepositoryCreated {
    type: 'repository.created';
    aggregateId: string;  // repositoryUuid
    timestamp: number;
    payload: {
      accountUuid: string;
      repositoryUuid: string;
      repositoryType: string;
      hasGit: boolean;
      resourceCount: number;
      sizeBytes: number;
    };
  }

  export interface RepositoryDeleted {
    type: 'repository.deleted';
    aggregateId: string;
    timestamp: number;
    payload: {
      accountUuid: string;
      repositoryUuid: string;
      resourceCount: number;
      referenceCount: number;
    };
  }

  export interface RepositoryArchived {
    type: 'repository.archived';
    aggregateId: string;
    timestamp: number;
    payload: {
      accountUuid: string;
      repositoryUuid: string;
    };
  }

  export interface RepositoryActivated {
    type: 'repository.activated';
    aggregateId: string;
    timestamp: number;
    payload: {
      accountUuid: string;
      repositoryUuid: string;
    };
  }

  // 资源事件
  export interface ResourceCreated {
    type: 'repository.resource.created';
    aggregateId: string;  // repositoryUuid
    timestamp: number;
    payload: {
      accountUuid: string;
      repositoryUuid: string;
      resourceUuid: string;
      resourceType: 'file' | 'folder';
      sizeBytes: number;
    };
  }

  export interface ResourceDeleted {
    type: 'repository.resource.deleted';
    aggregateId: string;
    timestamp: number;
    payload: {
      accountUuid: string;
      repositoryUuid: string;
      resourceUuid: string;
      resourceType: 'file' | 'folder';
      sizeBytes: number;
    };
  }

  // 引用事件
  export interface ReferenceCreated {
    type: 'repository.reference.created';
    aggregateId: string;
    timestamp: number;
    payload: {
      accountUuid: string;
      repositoryUuid: string;
      referenceUuid: string;
    };
  }

  export interface ReferenceDeleted {
    type: 'repository.reference.deleted';
    aggregateId: string;
    timestamp: number;
    payload: {
      accountUuid: string;
      repositoryUuid: string;
      referenceUuid: string;
    };
  }

  // Git 事件
  export interface GitEnabled {
    type: 'repository.git.enabled';
    aggregateId: string;
    timestamp: number;
    payload: {
      accountUuid: string;
      repositoryUuid: string;
    };
  }

  export interface GitDisabled {
    type: 'repository.git.disabled';
    aggregateId: string;
    timestamp: number;
    payload: {
      accountUuid: string;
      repositoryUuid: string;
    };
  }

  export interface CommitCreated {
    type: 'repository.commit.created';
    aggregateId: string;
    timestamp: number;
    payload: {
      accountUuid: string;
      repositoryUuid: string;
      commitSha: string;
    };
  }

  // 联合类型
  export type RepositoryEvent =
    | RepositoryCreated
    | RepositoryDeleted
    | RepositoryArchived
    | RepositoryActivated
    | ResourceCreated
    | ResourceDeleted
    | ReferenceCreated
    | ReferenceDeleted
    | GitEnabled
    | GitDisabled
    | CommitCreated;
}
```

#### 3. 统计信息聚合根

```typescript
// packages/domain-server/src/repository/aggregates/RepositoryStatistics.ts

export class RepositoryStatistics {
  constructor(
    public readonly accountUuid: string,
    public totalRepositories: number,
    public activeRepositories: number,
    public archivedRepositories: number,
    public totalResources: number,
    public totalFiles: number,
    public totalFolders: number,
    public gitEnabledRepos: number,
    public totalCommits: number,
    public totalReferences: number,
    public totalLinkedContents: number,
    public totalSizeBytes: bigint,
    public lastUpdatedAt: number,
    public readonly createdAt: number,
  ) {}

  /**
   * 创建空统计（用于新账户）
   */
  static createEmpty(accountUuid: string): RepositoryStatistics {
    const now = Date.now();
    return new RepositoryStatistics(
      accountUuid,
      0, 0, 0,  // repositories
      0, 0, 0,  // resources
      0, 0,     // git
      0, 0,     // references
      BigInt(0),// size
      now, now, // timestamps
    );
  }

  /**
   * 创建仓库时更新统计
   */
  onRepositoryCreated(event: RepositoryEvents.RepositoryCreated): void {
    this.totalRepositories++;
    this.activeRepositories++;
    
    if (event.payload.hasGit) {
      this.gitEnabledRepos++;
    }
    
    this.totalResources += event.payload.resourceCount;
    this.totalSizeBytes += BigInt(event.payload.sizeBytes);
    this.lastUpdatedAt = event.timestamp;
  }

  /**
   * 删除仓库时更新统计
   */
  onRepositoryDeleted(event: RepositoryEvents.RepositoryDeleted): void {
    this.totalRepositories--;
    this.activeRepositories--;
    this.totalResources -= event.payload.resourceCount;
    this.totalReferences -= event.payload.referenceCount;
    this.lastUpdatedAt = event.timestamp;
  }

  /**
   * 归档仓库时更新统计
   */
  onRepositoryArchived(event: RepositoryEvents.RepositoryArchived): void {
    this.activeRepositories--;
    this.archivedRepositories++;
    this.lastUpdatedAt = event.timestamp;
  }

  /**
   * 激活仓库时更新统计
   */
  onRepositoryActivated(event: RepositoryEvents.RepositoryActivated): void {
    this.activeRepositories++;
    this.archivedRepositories--;
    this.lastUpdatedAt = event.timestamp;
  }

  /**
   * 创建资源时更新统计
   */
  onResourceCreated(event: RepositoryEvents.ResourceCreated): void {
    this.totalResources++;
    
    if (event.payload.resourceType === 'file') {
      this.totalFiles++;
    } else {
      this.totalFolders++;
    }
    
    this.totalSizeBytes += BigInt(event.payload.sizeBytes);
    this.lastUpdatedAt = event.timestamp;
  }

  /**
   * 删除资源时更新统计
   */
  onResourceDeleted(event: RepositoryEvents.ResourceDeleted): void {
    this.totalResources--;
    
    if (event.payload.resourceType === 'file') {
      this.totalFiles--;
    } else {
      this.totalFolders--;
    }
    
    this.totalSizeBytes -= BigInt(event.payload.sizeBytes);
    this.lastUpdatedAt = event.timestamp;
  }

  /**
   * 启用Git时更新统计
   */
  onGitEnabled(event: RepositoryEvents.GitEnabled): void {
    this.gitEnabledRepos++;
    this.lastUpdatedAt = event.timestamp;
  }

  /**
   * 禁用Git时更新统计
   */
  onGitDisabled(event: RepositoryEvents.GitDisabled): void {
    this.gitEnabledRepos--;
    this.lastUpdatedAt = event.timestamp;
  }

  /**
   * 创建提交时更新统计
   */
  onCommitCreated(event: RepositoryEvents.CommitCreated): void {
    this.totalCommits++;
    this.lastUpdatedAt = event.timestamp;
  }

  /**
   * 转换为DTO
   */
  toDTO(): RepositoryStatisticsDTO {
    return {
      accountUuid: this.accountUuid,
      totalRepositories: this.totalRepositories,
      activeRepositories: this.activeRepositories,
      archivedRepositories: this.archivedRepositories,
      totalResources: this.totalResources,
      totalFiles: this.totalFiles,
      totalFolders: this.totalFolders,
      gitEnabledRepos: this.gitEnabledRepos,
      totalCommits: this.totalCommits,
      totalReferences: this.totalReferences,
      totalLinkedContents: this.totalLinkedContents,
      totalSizeBytes: this.totalSizeBytes.toString(),
      lastUpdatedAt: this.lastUpdatedAt,
      createdAt: this.createdAt,
    };
  }
}
```

#### 4. 事件监听器（Event Handlers）

```typescript
// apps/api/src/modules/repository/infrastructure/event-handlers/RepositoryStatisticsHandler.ts

import { EventEmitter } from 'events';
import { RepositoryEvents } from '@dailyuse/domain-core';
import { PrismaClient } from '@prisma/client';

/**
 * 统计信息事件监听器
 * 
 * 监听所有 Repository 相关事件，自动更新统计信息
 */
export class RepositoryStatisticsHandler {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventBus: EventEmitter,
  ) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 仓库事件
    this.eventBus.on('repository.created', this.onRepositoryCreated.bind(this));
    this.eventBus.on('repository.deleted', this.onRepositoryDeleted.bind(this));
    this.eventBus.on('repository.archived', this.onRepositoryArchived.bind(this));
    this.eventBus.on('repository.activated', this.onRepositoryActivated.bind(this));

    // 资源事件
    this.eventBus.on('repository.resource.created', this.onResourceCreated.bind(this));
    this.eventBus.on('repository.resource.deleted', this.onResourceDeleted.bind(this));

    // 引用事件
    this.eventBus.on('repository.reference.created', this.onReferenceCreated.bind(this));
    this.eventBus.on('repository.reference.deleted', this.onReferenceDeleted.bind(this));

    // Git 事件
    this.eventBus.on('repository.git.enabled', this.onGitEnabled.bind(this));
    this.eventBus.on('repository.git.disabled', this.onGitDisabled.bind(this));
    this.eventBus.on('repository.commit.created', this.onCommitCreated.bind(this));
  }

  private async onRepositoryCreated(event: RepositoryEvents.RepositoryCreated): Promise<void> {
    await this.prisma.repositoryStatistics.upsert({
      where: { account_uuid: event.payload.accountUuid },
      create: {
        account_uuid: event.payload.accountUuid,
        total_repositories: 1,
        active_repositories: 1,
        git_enabled_repos: event.payload.hasGit ? 1 : 0,
        total_resources: event.payload.resourceCount,
        total_size_bytes: event.payload.sizeBytes,
        last_updated_at: new Date(event.timestamp),
      },
      update: {
        total_repositories: { increment: 1 },
        active_repositories: { increment: 1 },
        git_enabled_repos: event.payload.hasGit ? { increment: 1 } : undefined,
        total_resources: { increment: event.payload.resourceCount },
        total_size_bytes: { increment: event.payload.sizeBytes },
        last_updated_at: new Date(event.timestamp),
      },
    });
  }

  private async onRepositoryDeleted(event: RepositoryEvents.RepositoryDeleted): Promise<void> {
    await this.prisma.repositoryStatistics.update({
      where: { account_uuid: event.payload.accountUuid },
      data: {
        total_repositories: { decrement: 1 },
        active_repositories: { decrement: 1 },
        total_resources: { decrement: event.payload.resourceCount },
        total_references: { decrement: event.payload.referenceCount },
        last_updated_at: new Date(event.timestamp),
      },
    });
  }

  private async onRepositoryArchived(event: RepositoryEvents.RepositoryArchived): Promise<void> {
    await this.prisma.repositoryStatistics.update({
      where: { account_uuid: event.payload.accountUuid },
      data: {
        active_repositories: { decrement: 1 },
        archived_repositories: { increment: 1 },
        last_updated_at: new Date(event.timestamp),
      },
    });
  }

  private async onResourceCreated(event: RepositoryEvents.ResourceCreated): Promise<void> {
    await this.prisma.repositoryStatistics.update({
      where: { account_uuid: event.payload.accountUuid },
      data: {
        total_resources: { increment: 1 },
        total_files: event.payload.resourceType === 'file' ? { increment: 1 } : undefined,
        total_folders: event.payload.resourceType === 'folder' ? { increment: 1 } : undefined,
        total_size_bytes: { increment: event.payload.sizeBytes },
        last_updated_at: new Date(event.timestamp),
      },
    });
  }

  // ... 其他事件处理方法
}
```

#### 5. 在 DomainService 中发布事件

```typescript
// packages/domain-server/src/repository/services/RepositoryDomainService.ts

export class RepositoryDomainService {
  constructor(
    private readonly repositoryRepo: IRepositoryRepository,
    private readonly eventBus?: EventEmitter,  // 注入事件总线
  ) {}

  public async createRepository(params: {...}): Promise<Repository> {
    // ... 创建逻辑

    await this.repositoryRepo.save(repository);

    // ✅ 发布事件
    this.eventBus?.emit('repository.created', {
      type: 'repository.created',
      aggregateId: repository.uuid,
      timestamp: Date.now(),
      payload: {
        accountUuid: params.accountUuid,
        repositoryUuid: repository.uuid,
        repositoryType: params.type,
        hasGit: params.initializeGit ?? false,
        resourceCount: repository.getAllResources().length,
        sizeBytes: 0,  // 初始为0
      },
    } as RepositoryEvents.RepositoryCreated);

    return repository;
  }

  public async deleteRepository(uuid: string, options?: {...}): Promise<void> {
    const repository = await this.repositoryRepo.findById(uuid, {
      includeChildren: true,
    });

    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    const accountUuid = repository.accountUuid;
    const resourceCount = repository.getAllResources().length;
    const referenceCount = repository.getAllReferences().length;

    await this.repositoryRepo.delete(uuid);

    // ✅ 发布事件
    this.eventBus?.emit('repository.deleted', {
      type: 'repository.deleted',
      aggregateId: uuid,
      timestamp: Date.now(),
      payload: {
        accountUuid,
        repositoryUuid: uuid,
        resourceCount,
        referenceCount,
      },
    } as RepositoryEvents.RepositoryDeleted);
  }
}
```

#### 6. 统计信息API

```typescript
// apps/api/src/modules/repository/interface/http/controllers/RepositoryStatisticsController.ts

export class RepositoryStatisticsController {
  /**
   * 获取统计信息
   * @route GET /api/repositories/statistics
   */
  static async getStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryStatisticsController.extractAccountUuid(req);

      const stats = await prisma.repositoryStatistics.findUnique({
        where: { account_uuid: accountUuid },
      });

      if (!stats) {
        // 如果没有统计数据，返回空统计
        return responseBuilder.sendSuccess(res, {
          accountUuid,
          totalRepositories: 0,
          activeRepositories: 0,
          archivedRepositories: 0,
          totalResources: 0,
          totalFiles: 0,
          totalFolders: 0,
          gitEnabledRepos: 0,
          totalCommits: 0,
          totalReferences: 0,
          totalLinkedContents: 0,
          totalSizeBytes: '0',
        });
      }

      return responseBuilder.sendSuccess(res, {
        accountUuid: stats.account_uuid,
        totalRepositories: stats.total_repositories,
        activeRepositories: stats.active_repositories,
        archivedRepositories: stats.archived_repositories,
        totalResources: stats.total_resources,
        totalFiles: stats.total_files,
        totalFolders: stats.total_folders,
        gitEnabledRepos: stats.git_enabled_repos,
        totalCommits: stats.total_commits,
        totalReferences: stats.total_references,
        totalLinkedContents: stats.total_linked_contents,
        totalSizeBytes: stats.total_size_bytes.toString(),
        lastUpdatedAt: stats.last_updated_at.getTime(),
      });
    } catch (error) {
      logger.error('Error fetching repository statistics', { error });
      return responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to fetch statistics',
      });
    }
  }

  /**
   * 手动重新计算统计信息（管理员功能）
   * @route POST /api/repositories/statistics/recalculate
   */
  static async recalculateStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryStatisticsController.extractAccountUuid(req);

      // 重新计算所有统计数据
      const repositories = await prisma.repository.findMany({
        where: { account_uuid: accountUuid, is_deleted: false },
        include: {
          resources: true,
          _count: {
            select: {
              resources: true,
            },
          },
        },
      });

      const stats = {
        total_repositories: repositories.length,
        active_repositories: repositories.filter(r => !r.is_archived).length,
        archived_repositories: repositories.filter(r => r.is_archived).length,
        git_enabled_repos: repositories.filter(r => r.has_git).length,
        total_resources: repositories.reduce((sum, r) => sum + r._count.resources, 0),
        // ... 其他统计计算
      };

      await prisma.repositoryStatistics.upsert({
        where: { account_uuid: accountUuid },
        create: { account_uuid: accountUuid, ...stats },
        update: stats,
      });

      return responseBuilder.sendSuccess(res, stats, 'Statistics recalculated successfully');
    } catch (error) {
      logger.error('Error recalculating statistics', { error });
      return responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to recalculate statistics',
      });
    }
  }
}
```

### 架构优势

#### ✅ 优点

1. **性能优秀**: 
   - 统计信息已预计算，查询O(1)复杂度
   - 不需要每次JOIN多表计算

2. **实时更新**: 
   - 事件驱动自动更新
   - 不需要定时任务

3. **解耦性强**: 
   - 统计信息模块独立
   - 通过事件通信，不直接依赖

4. **可扩展**: 
   - 新增统计维度只需要添加字段和事件处理
   - 不影响现有代码

5. **审计友好**: 
   - 事件是不可变的
   - 可以追溯统计变化历史

6. **一致性保证**: 
   - 通过事务保证统计更新
   - 支持最终一致性

#### ⚠️ 注意事项

1. **事件丢失风险**: 
   - 需要可靠的事件总线（考虑使用消息队列）
   - 实现重试机制

2. **初始化数据**: 
   - 对于已有用户需要初始化统计数据
   - 提供 `recalculate` API

3. **事务边界**: 
   - 业务操作和事件发布应该在同一事务中
   - 或使用outbox pattern

4. **最终一致性**: 
   - 统计信息可能有短暂延迟
   - 大多数场景可接受

### 实施步骤

#### Step 1: 数据库迁移
```bash
# 添加 RepositoryStatistics 表
pnpm nx run api:prisma-migrate -- add-repository-statistics
```

#### Step 2: 创建事件定义
```typescript
// packages/domain-core/src/events/RepositoryEvents.ts
```

#### Step 3: 实现统计聚合根
```typescript
// packages/domain-server/src/repository/aggregates/RepositoryStatistics.ts
```

#### Step 4: 实现事件监听器
```typescript
// apps/api/src/modules/repository/infrastructure/event-handlers/
```

#### Step 5: 集成事件总线
```typescript
// apps/api/src/config/event-bus.ts
import { EventEmitter } from 'events';

export const eventBus = new EventEmitter();
eventBus.setMaxListeners(100);
```

#### Step 6: 在服务中发布事件
```typescript
// RepositoryDomainService 中所有修改操作后发布事件
```

#### Step 7: 添加统计API
```typescript
// GET /api/repositories/statistics
// POST /api/repositories/statistics/recalculate
```

#### Step 8: 初始化历史数据
```typescript
// 为所有现有账户计算统计信息
```

### Goal 模块也应该使用相同模式

```prisma
model GoalStatistics {
  id                Int      @id @default(autoincrement())
  account_uuid      String   @unique
  
  total_goals       Int      @default(0)
  active_goals      Int      @default(0)
  completed_goals   Int      @default(0)
  paused_goals      Int      @default(0)
  
  total_tasks       Int      @default(0)
  completed_tasks   Int      @default(0)
  
  total_milestones  Int      @default(0)
  
  last_updated_at   DateTime @default(now())
  created_at        DateTime @default(now())
  
  account           Account  @relation(fields: [account_uuid], references: [uuid], onDelete: Cascade)
  
  @@index([account_uuid])
  @@map("goal_statistics")
}
```

---

## 总结

### 问题1: getInstance 优雅使用
✅ **已实现** - 使用懒加载模式解决异步初始化问题

### 问题2: 统计信息实体
✅ **优秀的架构设计** - 推荐实施

**下一步行动**:
1. 创建 RepositoryStatistics Prisma 模型
2. 运行数据库迁移
3. 实现事件总线和事件定义
4. 实现统计信息聚合根和事件监听器
5. 在所有 DomainService 中发布事件
6. 添加统计信息API
7. Goal模块也使用相同模式

**预期效果**:
- 统计查询从 O(n) 降低到 O(1)
- 实时更新，无需定时任务
- 模块解耦，易于扩展
- 为将来的数据分析和报表打下基础
