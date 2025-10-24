# STORY-SETTING-001-003: Infrastructure & Repository 实现

> **Story ID**: STORY-SETTING-001-003  
> **Epic**: EPIC-SETTING-001 - 用户偏好设置  
> **Sprint**: Sprint 1  
> **Story Points**: 2 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Backend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 后端开发者  
**我想要** 实现用户偏好设置的 Infrastructure 层 (Repository + Prisma)  
**以便于** 将用户偏好数据持久化到 PostgreSQL 数据库

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: 定义 Prisma Schema

```gherkin
Feature: 定义 UserPreference 数据库模型
  As a Backend Developer
  I want to create Prisma schema for UserPreference
  So that data can be persisted in PostgreSQL

Scenario: 创建 UserPreference model
  Given Prisma schema 文件存在
  When 添加 UserPreference model 定义
  Then 应该包含所有必需字段
  And 设置正确的字段类型和约束
  And 设置 accountUuid 为 unique 索引
  And 设置 uuid 为主键

  Examples: 字段定义
  | Field            | Type      | Constraints                     |
  | uuid             | String    | @id @default(uuid())            |
  | accountUuid      | String    | @unique                         |
  | theme            | String    |                                 |
  | language         | String    |                                 |
  | notifications    | Json      |                                 |
  | shortcuts        | Json      |                                 |
  | sidebarPosition  | String    |                                 |
  | fontSize         | Int       |                                 |
  | createdAt        | DateTime  | @default(now())                 |
  | updatedAt        | DateTime  | @updatedAt                      |
```

### Scenario 2: 实现 Repository

```gherkin
Feature: 实现 UserPreferenceRepository
  As a Backend Developer
  I want to implement the IUserPreferenceRepository interface
  So that the Application layer can persist data

Scenario: 实现 findByAccountUuid 方法
  Given Prisma client 已配置
  When 调用 repository.findByAccountUuid("user-123")
  Then 应该执行 SQL 查询 WHERE accountUuid = "user-123"
  And 如果找到记录，返回 UserPreference 实体
  And 如果未找到，返回 null
  And JSON 字段应该正确解析为对象

Scenario: 实现 save 方法 (创建新记录)
  Given 一个新的 UserPreference 实体
  When 调用 repository.save(entity)
  Then 应该执行 Prisma upsert 操作
  And 应该将 JSON 字段序列化后存储
  And 数据库应该包含新记录

Scenario: 实现 save 方法 (更新现有记录)
  Given 一个已存在的 UserPreference 实体 (已修改)
  When 调用 repository.save(entity)
  Then 应该执行 upsert 更新现有记录
  And updatedAt 应该自动更新

Scenario: 实现 delete 方法
  Given 用户 "user-123" 的偏好存在
  When 调用 repository.delete("user-123")
  Then 应该执行 DELETE WHERE accountUuid = "user-123"
  And 记录应该从数据库删除
```

### Scenario 3: 测试 Repository

```gherkin
Feature: Repository 集成测试
  As a Backend Developer
  I want to test repository with real database
  So that I can ensure data persistence works correctly

Scenario: 测试完整的 CRUD 流程
  Given 测试数据库已清空
  When 依次执行:
    1. save() 创建新记录
    2. findByAccountUuid() 查询记录
    3. save() 更新记录
    4. findByAccountUuid() 验证更新
    5. delete() 删除记录
    6. findByAccountUuid() 验证已删除
  Then 所有操作应该成功
  And 数据应该正确持久化
```

---

## 📋 任务清单 (Task Breakdown)

### Prisma Schema 任务

- [ ] **Task 1.1**: 更新 `apps/api/prisma/schema.prisma`
  - [ ] 添加 UserPreference model 定义
  - [ ] 设置字段类型和约束
  - [ ] 添加索引 (accountUuid unique)
  - [ ] 添加注释说明

- [ ] **Task 1.2**: 生成 Prisma migration

  ```bash
  pnpm nx run api:prisma:migrate:dev --name add_user_preference
  ```

- [ ] **Task 1.3**: 生成 Prisma Client
  ```bash
  pnpm nx run api:prisma:generate
  ```

### Repository 实现任务

- [ ] **Task 2.1**: 创建 `packages/domain-server/src/setting/infrastructure/prisma/PrismaUserPreferenceRepository.ts`
  - [ ] 实现 IUserPreferenceRepository 接口
  - [ ] 注入 PrismaClient
  - [ ] 实现 `findByAccountUuid()` 方法
  - [ ] 实现 `findByUuid()` 方法
  - [ ] 实现 `existsByAccountUuid()` 方法
  - [ ] 实现 `save()` 方法 (upsert)
  - [ ] 实现 `delete()` 方法
  - [ ] 添加私有方法 `toDomain()` (Prisma → Entity)
  - [ ] 添加私有方法 `toPrisma()` (Entity → Prisma)

- [ ] **Task 2.2**: 创建 Mapper 辅助类
  - [ ] 创建 `infrastructure/prisma/UserPreferenceMapper.ts`
  - [ ] 实现 `toDomain(prismaData): UserPreference`
  - [ ] 实现 `toPrisma(entity): PrismaCreateInput`
  - [ ] 处理 JSON 字段的序列化/反序列化

### 测试任务

- [ ] **Task 3.1**: 创建 `infrastructure/prisma/__tests__/PrismaUserPreferenceRepository.test.ts`
  - [ ] 配置测试数据库连接
  - [ ] 测试 save() 创建新记录
  - [ ] 测试 save() 更新现有记录
  - [ ] 测试 findByAccountUuid() 成功和失败
  - [ ] 测试 findByUuid()
  - [ ] 测试 existsByAccountUuid()
  - [ ] 测试 delete()
  - [ ] 测试 JSON 字段序列化
  - [ ] 确保覆盖率 ≥ 80%

- [ ] **Task 3.2**: 配置集成测试环境
  - [ ] 使用 testcontainers 或 docker-compose
  - [ ] 配置测试数据库清理逻辑

---

## 🔧 技术实现细节

### Prisma Schema

**apps/api/prisma/schema.prisma** (添加):

```prisma
model UserPreference {
  /// 用户偏好唯一标识
  uuid             String   @id @default(uuid()) @db.Uuid

  /// 所属账户 UUID (唯一索引)
  accountUuid      String   @unique @db.Uuid

  /// 主题设置 (light, dark, auto)
  theme            String   @db.VarChar(10)

  /// 语言设置 (zh-CN, en-US, ja-JP)
  language         String   @db.VarChar(10)

  /// 通知设置 (JSON)
  notifications    Json     @db.JsonB

  /// 快捷键设置 (JSON)
  shortcuts        Json     @db.JsonB

  /// 侧边栏位置 (left, right)
  sidebarPosition  String   @db.VarChar(10)

  /// 字体大小 (12-24)
  fontSize         Int      @db.SmallInt

  /// 创建时间
  createdAt        DateTime @default(now()) @db.Timestamptz

  /// 更新时间 (自动更新)
  updatedAt        DateTime @updatedAt @db.Timestamptz

  @@map("user_preferences")
  @@index([accountUuid], name: "idx_user_preferences_account_uuid")
}
```

### Repository Implementation

**packages/domain-server/src/setting/infrastructure/prisma/PrismaUserPreferenceRepository.ts**:

```typescript
import type { PrismaClient } from '@prisma/client';
import type { IUserPreferenceRepository } from '../../../domain/repositories/IUserPreferenceRepository';
import { UserPreference } from '../../../domain/entities/UserPreference';
import { UserPreferenceMapper } from './UserPreferenceMapper';

export class PrismaUserPreferenceRepository implements IUserPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAccountUuid(accountUuid: string): Promise<UserPreference | null> {
    const data = await this.prisma.userPreference.findUnique({
      where: { accountUuid },
    });

    if (!data) return null;
    return UserPreferenceMapper.toDomain(data);
  }

  async findByUuid(uuid: string): Promise<UserPreference | null> {
    const data = await this.prisma.userPreference.findUnique({
      where: { uuid },
    });

    if (!data) return null;
    return UserPreferenceMapper.toDomain(data);
  }

  async existsByAccountUuid(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.userPreference.count({
      where: { accountUuid },
    });
    return count > 0;
  }

  async save(entity: UserPreference): Promise<void> {
    const prismaData = UserPreferenceMapper.toPrisma(entity);

    await this.prisma.userPreference.upsert({
      where: { accountUuid: entity.accountUuid },
      create: prismaData,
      update: prismaData,
    });
  }

  async delete(accountUuid: string): Promise<void> {
    await this.prisma.userPreference.delete({
      where: { accountUuid },
    });
  }
}
```

**UserPreferenceMapper.ts**:

```typescript
import type { UserPreference as PrismaUserPreference } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { UserPreference } from '../../../domain/entities/UserPreference';
import type { NotificationSettings, ShortcutSettings } from '@dailyuse/contracts';

export class UserPreferenceMapper {
  /**
   * Prisma 数据 → Domain 实体
   */
  static toDomain(data: PrismaUserPreference): UserPreference {
    return new UserPreference(
      {
        accountUuid: data.accountUuid,
        theme: data.theme as any,
        language: data.language as any,
        notifications: data.notifications as NotificationSettings,
        shortcuts: data.shortcuts as ShortcutSettings,
        sidebarPosition: data.sidebarPosition as any,
        fontSize: data.fontSize,
        createdAt: data.createdAt.getTime(),
        updatedAt: data.updatedAt.getTime(),
      },
      data.uuid,
    );
  }

  /**
   * Domain 实体 → Prisma 数据
   */
  static toPrisma(entity: UserPreference): Prisma.UserPreferenceCreateInput {
    return {
      uuid: entity.uuid,
      accountUuid: entity.accountUuid,
      theme: entity.theme,
      language: entity.language,
      notifications: entity.notifications as any,
      shortcuts: entity.shortcuts as any,
      sidebarPosition: entity.sidebarPosition,
      fontSize: entity.fontSize,
      createdAt: new Date(entity.createdAt),
      updatedAt: new Date(entity.updatedAt),
    };
  }
}
```

### 集成测试

**infrastructure/prisma/**tests**/PrismaUserPreferenceRepository.test.ts**:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaUserPreferenceRepository } from '../PrismaUserPreferenceRepository';
import { UserPreference } from '../../../../domain/entities/UserPreference';

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL,
});

describe('PrismaUserPreferenceRepository (Integration)', () => {
  let repository: PrismaUserPreferenceRepository;

  beforeAll(async () => {
    repository = new PrismaUserPreferenceRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 清空测试数据
    await prisma.userPreference.deleteMany();
  });

  it('应该创建新的用户偏好', async () => {
    const entity = createTestEntity('user-123');
    await repository.save(entity);

    const found = await repository.findByAccountUuid('user-123');
    expect(found).not.toBeNull();
    expect(found!.accountUuid).toBe('user-123');
    expect(found!.theme).toBe('dark');
  });

  it('应该更新现有的用户偏好', async () => {
    const entity = createTestEntity('user-123');
    await repository.save(entity);

    entity.updateTheme('light');
    await repository.save(entity);

    const found = await repository.findByAccountUuid('user-123');
    expect(found!.theme).toBe('light');
  });

  it('应该在用户不存在时返回 null', async () => {
    const found = await repository.findByAccountUuid('user-999');
    expect(found).toBeNull();
  });

  it('应该正确检查用户是否存在', async () => {
    const entity = createTestEntity('user-123');
    await repository.save(entity);

    const exists = await repository.existsByAccountUuid('user-123');
    expect(exists).toBe(true);

    const notExists = await repository.existsByAccountUuid('user-999');
    expect(notExists).toBe(false);
  });

  it('应该删除用户偏好', async () => {
    const entity = createTestEntity('user-123');
    await repository.save(entity);

    await repository.delete('user-123');

    const found = await repository.findByAccountUuid('user-123');
    expect(found).toBeNull();
  });

  it('应该正确序列化和反序列化 JSON 字段', async () => {
    const entity = createTestEntity('user-123');
    await repository.save(entity);

    const found = await repository.findByAccountUuid('user-123');
    expect(found!.notifications.enabled).toBe(true);
    expect(found!.notifications.channels).toEqual(['push', 'email']);
    expect(found!.shortcuts['task.create']).toBe('Ctrl+N');
  });
});

function createTestEntity(accountUuid: string): UserPreference {
  return new UserPreference({
    accountUuid,
    theme: 'dark',
    language: 'zh-CN',
    notifications: {
      enabled: true,
      channels: ['push', 'email'],
      doNotDisturbStart: '22:00',
      doNotDisturbEnd: '08:00',
      soundEnabled: true,
    },
    shortcuts: {
      'task.create': 'Ctrl+N',
      'task.complete': 'Ctrl+Enter',
    },
    sidebarPosition: 'left',
    fontSize: 14,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
```

---

## ✅ Definition of Done

### 功能完整性

- [x] Prisma schema 定义完整
- [x] Migration 已生成并应用
- [x] Repository 实现所有接口方法
- [x] Mapper 正确处理数据转换

### 代码质量

- [x] TypeScript strict 模式无错误
- [x] ESLint 无警告
- [x] 集成测试覆盖率 ≥ 80%

### 测试

- [x] 所有集成测试通过
- [x] 测试数据库隔离
- [x] JSON 字段序列化测试通过

### 数据库

- [x] Migration 成功运行
- [x] 索引正确创建
- [x] 约束验证正常

### Code Review

- [x] Code Review 完成
- [x] DBA Review 通过 (schema 设计)

---

## 📊 预估时间

| 任务                      | 预估时间   |
| ------------------------- | ---------- |
| Prisma Schema & Migration | 1 小时     |
| Repository 实现           | 2 小时     |
| Mapper 实现               | 1 小时     |
| 集成测试编写              | 2 小时     |
| **总计**                  | **6 小时** |

**Story Points**: 2 SP

---

## 🔗 依赖关系

### 上游依赖

- ✅ STORY-SETTING-001-001 (Domain 层)
- ✅ STORY-SETTING-001-002 (Application Service)

### 下游依赖

- STORY-SETTING-001-004 (API Endpoints) 依赖此 Story

---

**Story 创建日期**: 2025-10-21  
**Story 创建者**: SM Bob
