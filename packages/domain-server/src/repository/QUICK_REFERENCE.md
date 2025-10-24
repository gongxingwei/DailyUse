# Repository 模块快速参考

## 🚀 快速开始

### 应用数据库迁移

```bash
cd apps/api
npx prisma migrate dev --name add-repository-model
npx prisma generate
```

### 使用 Domain Service

```typescript
import { RepositoryDomainService } from '@dailyuse/domain-server';
import { PrismaRepositoryRepository } from '@dailyuse/domain-server/repository/infrastructure';

// 初始化
const prisma = new PrismaClient();
const repository = new PrismaRepositoryRepository(prisma);
const service = new RepositoryDomainService(repository);

// 创建仓储
const repo = await service.createRepository({
  accountUuid: 'account-123',
  name: '我的笔记仓库',
  type: RepositoryType.LOCAL,
  path: '/Users/me/notes',
  description: '个人笔记集合',
  initializeGit: true,
});

// 获取仓储
const found = await service.getRepositoryById(repo.uuid);

// 更新仓储
await service.updateRepository(repo.uuid, {
  name: '更新后的名称',
  description: '更新后的描述',
});

// 归档仓储
await service.archiveRepository(repo.uuid);
```

## 📁 文件结构

```
packages/domain-server/src/repository/
├── aggregates/
│   └── Repository.ts              # 聚合根实现
├── value-objects/
│   ├── RepositoryConfig.ts        # 配置值对象
│   ├── RepositoryStats.ts         # 统计值对象
│   ├── SyncStatus.ts              # 同步状态值对象
│   └── GitInfo.ts                 # Git 信息值对象
├── entities/
│   ├── Resource.ts                # 资源实体
│   └── RepositoryExplorer.ts      # 浏览器实体
├── interfaces/
│   └── IRepositoryRepository.ts   # 仓储接口
├── services/
│   ├── RepositoryDomainService.ts # 领域服务
│   └── RepositoryDomainService.test.ts # 服务测试
├── infrastructure/
│   ├── prisma/
│   │   ├── PrismaRepositoryRepository.ts  # Prisma 实现
│   │   └── mappers/
│   │       └── RepositoryMapper.ts        # DTO 映射器
│   ├── git/
│   │   └── GitService.ts          # Git 服务（占位）
│   └── filesystem/
│       └── FileSystemService.ts   # 文件系统服务
└── index.ts                       # 导出
```

## 🔧 API 参考

### RepositoryDomainService

#### 创建操作

- `createRepository(params)` - 创建新仓储
- `createRepositoryWithResources(params, resources)` - 创建并添加资源

#### 查询操作

- `getRepositoryById(uuid)` - 根据 ID 获取
- `getRepositoriesByAccount(accountUuid)` - 获取账户的所有仓储
- `getRepositoryByPath(path)` - 根据路径获取

#### 更新操作

- `updateRepository(uuid, updates)` - 更新基本信息
- `updateRepositoryConfig(uuid, config)` - 更新配置
- `updateRepositoryStats(uuid, stats)` - 更新统计

#### 状态操作

- `archiveRepository(uuid)` - 归档
- `activateRepository(uuid)` - 激活

#### Git 操作

- `initializeGit(uuid, remoteUrl?)` - 初始化 Git
- `syncWithRemote(uuid)` - 同步远程
- `commitChanges(uuid, message)` - 提交变更

#### 关联操作

- `linkGoals(uuid, goalUuids)` - 关联目标
- `unlinkGoals(uuid, goalUuids)` - 取消关联
- `getRelatedGoals(uuid)` - 获取关联的目标

## 🗄️ Prisma Schema

```prisma
model Repository {
  uuid           String    @id @default(cuid())
  accountUuid    String    @map("account_uuid")
  name           String
  type           String
  path           String
  description    String?
  config         String    // JSON
  relatedGoals   String    @default("[]") @map("related_goals")
  status         String    @default("active")
  git            String?   // JSON
  syncStatus     String?   @map("sync_status") // JSON
  stats          String    // JSON
  lastAccessedAt DateTime? @map("last_accessed_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  account        Account   @relation(fields: [accountUuid], references: [uuid])

  @@map("repositories")
}
```

## 🧪 测试

### 运行测试

```bash
cd packages/domain-server
pnpm test -- src/repository --run
```

### 测试覆盖

- ✅ Repository 聚合根: 33 tests
- ✅ RepositoryConfig 值对象: 16 tests
- ✅ GitInfo 值对象: 32 tests
- ✅ SyncStatus 值对象: 27 tests
- ✅ RepositoryDomainService: 16 tests

**总计**: 124 tests passed ✅

## ⚙️ 配置

### 默认配置

```typescript
{
  enableGit: false,
  autoSync: false,
  syncInterval: 3600000, // 1 hour
  defaultLinkedDocName: 'README.md',
  supportedFileTypes: [
    ResourceType.MARKDOWN,
    ResourceType.IMAGE,
    ResourceType.CODE
  ],
  maxFileSize: 10485760, // 10MB
  enableVersionControl: false
}
```

### 环境变量

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dailyuse"
```

## 🐛 常见问题

### Q: 如何集成真实的 Git 功能？

A: 安装 `simple-git` 并替换 `GitService` 中的占位实现：

```bash
pnpm add simple-git
```

### Q: 如何添加新的资源类型？

A: 在 `contracts` 包中的 `ResourceType` 枚举添加新类型：

```typescript
export enum ResourceType {
  MARKDOWN = 'markdown',
  // ... 现有类型
  NEW_TYPE = 'new_type', // 添加这里
}
```

### Q: Domain-Client 什么时候实现？

A: 当前 contracts 包类型导出有问题，等修复后实现。暂时可以直接使用 DTO 类型。

## 📞 获取帮助

- 查看 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) 了解详细设计
- 查看 [REPOSITORY_MODULE_STATUS.md](./REPOSITORY_MODULE_STATUS.md) 了解当前状态
- 参考 Goal 模块实现: `packages/domain-server/src/goal/`

---

**最后更新**: 2025-10-09
