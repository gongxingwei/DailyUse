# Editor 模块 API 层实现进度报告

## ✅ 已完成工作

### 1. Domain 层重构（packages/domain-server）

- ✅ DDD 架构修正完成
  - EditorSession 从 aggregates 移至 entities
  - 正确的聚合层级：EditorWorkspace → EditorSession → EditorGroup → EditorTab
- ✅ Contracts 层完善
  - 所有 DTO 定义完整（Server/Client/Persistence）
  - TabType 枚举正确导出
  - 递归结构正确
- ✅ Domain-Server 实体实现
  - 所有实体工厂方法（create）
  - 所有 DTO 转换方法（toXxxDTO, fromXxxDTO）
  - 聚合根管理子实体方法（addSession, addGroup, addTab）
  - 类型检查全部通过

### 2. Domain Service 创建

- ✅ `EditorWorkspaceDomainService.ts` 完成
  - 协调聚合根和仓储
  - 实现所有业务用例方法
  - Workspace / Session / Group / Tab 管理
  - 激活状态管理
- ✅ 导出配置
  - `services/index.ts` 创建
  - `editor/index.ts` 添加 services 导出

### 3. Application Service 创建

- ✅ `EditorWorkspaceApplicationService.ts` 完成
  - 委托给 DomainService 处理业务逻辑
  - DTO 转换（Domain ↔ Contracts）
  - 单例模式 + 依赖注入支持
- ⚠️ 存在类型错误（map 参数 implicit any）

### 4. Infrastructure 层

- ✅ `EditorContainer.ts` 完成
  - DI 容器实现
  - 懒加载仓储实例
  - 测试支持（setter 方法）
- ⚠️ `PrismaEditorWorkspaceRepository.ts` 创建但有多个编译错误

## ❌ 待完成工作

### 1. Prisma Schema 定义

**问题**: 数据库中缺少 Editor 模块表结构

需要在 `apps/api/prisma/schema.prisma` 中添加：

```prisma
model EditorWorkspace {
  uuid        String   @id @default(uuid())
  accountUuid String
  name        String
  description String?
  projectPath String   @unique
  projectType String
  layout      Json
  settings    Json
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  accessedAt  DateTime @default(now())

  sessions    EditorSession[]

  @@map("editor_workspaces")
}

model EditorSession {
  uuid          String   @id @default(uuid())
  workspaceUuid String
  accountUuid   String
  name          String
  layout        Json
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  workspace     EditorWorkspace @relation(fields: [workspaceUuid], references: [uuid], onDelete: Cascade)
  groups        EditorGroup[]

  @@map("editor_sessions")
}

model EditorGroup {
  uuid           String   @id @default(uuid())
  sessionUuid    String
  workspaceUuid  String
  accountUuid    String
  groupIndex     Int
  name           String?
  splitDirection String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  session        EditorSession @relation(fields: [sessionUuid], references: [uuid], onDelete: Cascade)
  tabs           EditorTab[]

  @@map("editor_groups")
}

model EditorTab {
  uuid          String   @id @default(uuid())
  groupUuid     String
  sessionUuid   String
  workspaceUuid String
  accountUuid   String
  documentUuid  String?
  tabIndex      Int
  tabType       String
  title         String
  viewState     Json
  isPinned      Boolean  @default(false)
  isActive      Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  group         EditorGroup @relation(fields: [groupUuid], references: [uuid], onDelete: Cascade)

  @@map("editor_tabs")
}
```

**操作步骤**:

1. 添加上述 schema 到 `schema.prisma`
2. 运行 `npx prisma migrate dev --name add-editor-module`
3. 运行 `npx prisma generate`

### 2. EditorWorkspace PersistenceDTO 修正

**问题**: 当前 PersistenceDTO 缺少 `accessed_at` 和 `sessions` 字段

需要修改 `packages/contracts/src/modules/editor/aggregates/EditorWorkspaceServer.ts`:

```typescript
export interface EditorWorkspacePersistenceDTO {
  uuid: string;
  account_uuid: string;
  name: string;
  description: string;
  project_path: string;
  project_type: ProjectType;
  layout: WorkspaceLayoutPersistenceDTO;
  settings: WorkspaceSettingsPersistenceDTO;
  is_active: boolean;
  created_at: number;
  updated_at: number;
  accessed_at: number; // ← 添加

  // 子实体（可选，用于急加载）
  sessions?: EditorSessionPersistenceDTO[]; // ← 添加
}
```

### 3. IEditorWorkspaceRepository 接口补充

**问题**: 仓储接口缺少多个方法

需要在 `packages/domain-server/src/editor/repositories/IEditorWorkspaceRepository.ts` 添加：

```typescript
// 添加这些方法签名
findByAccountUuidAndName(accountUuid: string, name: string): Promise<EditorWorkspace | null>;
findActiveByAccountUuid(accountUuid: string): Promise<EditorWorkspace[]>;
saveBatch(workspaces: EditorWorkspace[]): Promise<void>;
existsByName(accountUuid: string, name: string): Promise<boolean>;
countByAccountUuid(accountUuid: string): Promise<number>;
```

### 4. PrismaEditorWorkspaceRepository 完善

**问题**: 需要实现缺失的接口方法

在 `PrismaEditorWorkspaceRepository.ts` 中添加：

```typescript
async findByAccountUuidAndName(
  accountUuid: string,
  name: string,
): Promise<EditorWorkspace | null> {
  const workspace = await this.prisma.editorWorkspace.findFirst({
    where: { accountUuid, name },
    include: {
      sessions: {
        include: {
          groups: { include: { tabs: true } },
        },
      },
    },
  });

  return workspace ? this.mapWorkspaceToEntity(workspace) : null;
}

async findActiveByAccountUuid(accountUuid: string): Promise<EditorWorkspace[]> {
  const workspaces = await this.prisma.editorWorkspace.findMany({
    where: { accountUuid, isActive: true },
    include: {
      sessions: {
        include: {
          groups: { include: { tabs: true } },
        },
      },
    },
  });

  return workspaces.map((w) => this.mapWorkspaceToEntity(w));
}

async saveBatch(workspaces: EditorWorkspace[]): Promise<void> {
  for (const workspace of workspaces) {
    await this.save(workspace);
  }
}

async existsByName(accountUuid: string, name: string): Promise<boolean> {
  const count = await this.prisma.editorWorkspace.count({
    where: { accountUuid, name },
  });
  return count > 0;
}

async countByAccountUuid(accountUuid: string): Promise<number> {
  return await this.prisma.editorWorkspace.count({
    where: { accountUuid },
  });
}
```

### 5. HTTP Interface 层

**目标**: 创建 REST API 路由

需要创建 `apps/api/src/modules/editor/interface/http/` 目录结构：

```
interface/http/
├── controllers/
│   ├── EditorWorkspaceController.ts
│   ├── EditorSessionController.ts
│   ├── EditorGroupController.ts
│   └── EditorTabController.ts
├── routes/
│   └── editorRoutes.ts
├── validators/
│   └── editorValidators.ts
└── index.ts
```

**EditorWorkspaceController.ts** 示例：

```typescript
import type { Request, Response } from 'express';
import { EditorWorkspaceApplicationService } from '../../application/services/EditorWorkspaceApplicationService';
import { handleApiResponse } from '@/shared/utils/response-handler';

export class EditorWorkspaceController {
  static async createWorkspace(req: Request, res: Response) {
    const service = await EditorWorkspaceApplicationService.getInstance();
    const workspace = await service.createWorkspace(req.body);
    return handleApiResponse(res, workspace, 'Workspace created');
  }

  static async getWorkspace(req: Request, res: Response) {
    const service = await EditorWorkspaceApplicationService.getInstance();
    const workspace = await service.getWorkspace(req.params.uuid);
    return handleApiResponse(res, workspace, 'Workspace retrieved');
  }

  static async listWorkspaces(req: Request, res: Response) {
    const service = await EditorWorkspaceApplicationService.getInstance();
    const workspaces = await service.getWorkspacesByAccount(req.params.accountUuid);
    return handleApiResponse(res, workspaces, 'Workspaces retrieved');
  }

  static async updateWorkspace(req: Request, res: Response) {
    const service = await EditorWorkspaceApplicationService.getInstance();
    const workspace = await service.updateWorkspace({
      uuid: req.params.uuid,
      ...req.body,
    });
    return handleApiResponse(res, workspace, 'Workspace updated');
  }

  static async deleteWorkspace(req: Request, res: Response) {
    const service = await EditorWorkspaceApplicationService.getInstance();
    const result = await service.deleteWorkspace(req.params.uuid);
    return handleApiResponse(res, { success: result }, 'Workspace deleted');
  }
}
```

**editorRoutes.ts** 示例：

```typescript
import { Router } from 'express';
import { EditorWorkspaceController } from '../controllers/EditorWorkspaceController';
import { authMiddleware } from '@/shared/middleware/auth';

const router = Router();

// Workspace routes
router.post('/workspaces', authMiddleware, EditorWorkspaceController.createWorkspace);
router.get('/workspaces/:uuid', authMiddleware, EditorWorkspaceController.getWorkspace);
router.get(
  '/accounts/:accountUuid/workspaces',
  authMiddleware,
  EditorWorkspaceController.listWorkspaces,
);
router.put('/workspaces/:uuid', authMiddleware, EditorWorkspaceController.updateWorkspace);
router.delete('/workspaces/:uuid', authMiddleware, EditorWorkspaceController.deleteWorkspace);

// TODO: Session, Group, Tab routes

export default router;
```

### 6. 注册路由到主应用

在 `apps/api/src/app.ts` 中添加：

```typescript
import editorRoutes from './modules/editor/interface/http/routes/editorRoutes';

// ... 其他代码 ...

app.use('/api/v1/editor', editorRoutes);
```

## 📋 实施计划

按以下顺序执行以完成 API 层实现：

1. **Step 1**: 添加 Prisma Schema（5分钟）
2. **Step 2**: 运行数据库迁移（3分钟）
3. **Step 3**: 修正 PersistenceDTO 接口（5分钟）
4. **Step 4**: 补充仓储接口方法（5分钟）
5. **Step 5**: 实现仓储缺失方法（10分钟）
6. **Step 6**: 创建 HTTP Controllers（15分钟）
7. **Step 7**: 创建路由配置（10分钟）
8. **Step 8**: 集成测试（10分钟）

**预计总时间**: 约 60 分钟

## 🔍 验证清单

完成后需验证：

- [ ] Prisma Schema 已添加且迁移成功
- [ ] 所有 TypeScript 编译错误已修复
- [ ] Repository 接口完全实现
- [ ] ApplicationService 无类型错误
- [ ] HTTP 路由正确注册
- [ ] API 端点可以通过 Postman/curl 访问
- [ ] 创建 Workspace 成功并存入数据库
- [ ] 读取 Workspace 正确返回 DTO
- [ ] 更新和删除操作正常工作

## 📝 架构总结

最终架构清晰分层：

```
┌─────────────────────────────────────────────────────────┐
│                     HTTP Interface                       │
│  (apps/api/src/modules/editor/interface/http)          │
│  - Controllers: 处理 HTTP 请求/响应                      │
│  - Routes: 路由定义                                      │
│  - Validators: 请求验证                                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Application Service                     │
│  (apps/api/src/modules/editor/application)             │
│  - EditorWorkspaceApplicationService                    │
│  - 协调 DomainService                                    │
│  - DTO 转换                                              │
│  - 事务管理                                              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Domain Service                         │
│  (packages/domain-server/src/editor/services)          │
│  - EditorWorkspaceDomainService                         │
│  - 业务逻辑协调                                          │
│  - 跨聚合根操作                                          │
│  - 领域事件触发                                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Domain Model                           │
│  (packages/domain-server/src/editor)                   │
│  - Aggregates: EditorWorkspace                          │
│  - Entities: EditorSession, EditorGroup, EditorTab      │
│  - Value Objects: WorkspaceLayout, SessionLayout, etc.  │
│  - 业务规则和验证                                        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Infrastructure                        │
│  (apps/api/src/modules/editor/infrastructure)          │
│  - Repositories: PrismaEditorWorkspaceRepository        │
│  - DI Container: EditorContainer                        │
│  - 数据持久化                                            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                       Database                           │
│  (Prisma + PostgreSQL/MySQL/SQLite)                    │
│  - editor_workspaces                                     │
│  - editor_sessions                                       │
│  - editor_groups                                         │
│  - editor_tabs                                           │
└─────────────────────────────────────────────────────────┘
```

## ✅ DDD 原则遵循

- ✅ 聚合根只有一个：EditorWorkspace
- ✅ 实体层级清晰：Workspace → Session → Group → Tab
- ✅ 一个聚合根一个仓储：IEditorWorkspaceRepository
- ✅ Domain Service 在 domain-server package
- ✅ Application Service 在 api 项目
- ✅ 跨聚合引用使用 UUID：documentUuid (引用 Document 聚合)
- ✅ DTO 三层分离：Server/Client/Persistence
- ✅ 递归 DTO 转换：支持完整对象图序列化

---

生成时间: ${new Date().toISOString()}
