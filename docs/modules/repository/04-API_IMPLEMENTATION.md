---
title: Repository 模块 - API 实现指南
created: 2025-10-10
updated: 2025-10-10
tags:
  - repository
  - api
  - nestjs
  - controller
  - service
category: 实现指南
---

# Repository 模块 - API 实现指南

> **API 层原则**：薄控制器 + 应用服务 + 统一响应格式

---

## 📋 实现顺序

```
1. TypeORM Entity (数据库实体)
   ↓
2. Repository (TypeORM 仓储实现)
   ↓
3. Application Service (应用服务)
   ↓
4. Controller (控制器)
   ↓
5. Module (模块注册)
```

---

## 1️⃣ TypeORM Entity 实现

**位置**: `apps/api/src/repository/infrastructure/persistence/entities/RepositoryEntity.ts`

### 📐 规范

- ✅ 使用 `@Entity()` 装饰器
- ✅ 所有字段使用装饰器定义
- ✅ 使用 `@Column('jsonb')` 存储复杂对象
- ✅ 提供 `fromDomain` 和 `toDomain` 转换方法

### 📝 示例代码

```typescript
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { RepositoryContracts } from '@dailyuse/contracts';
import { Repository } from '../../../domain/aggregates/Repository';

/**
 * Repository 数据库实体
 */
@Entity('repositories')
export class RepositoryEntity {
  @PrimaryColumn('uuid')
  uuid!: string;

  @Column('uuid')
  accountUuid!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('text')
  path!: string;

  @Column('varchar', { length: 50 })
  type!: RepositoryContracts.RepositoryType;

  @Column('varchar', { length: 50 })
  status!: RepositoryContracts.RepositoryStatus;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('jsonb')
  config!: RepositoryContracts.RepositoryConfig;

  @Column('jsonb', { nullable: true })
  gitInfo!: RepositoryContracts.GitInfo | null;

  @Column('varchar', { length: 50 })
  syncStatus!: RepositoryContracts.SyncStatus;

  @Column('timestamp', { nullable: true })
  lastSyncedAt!: Date | null;

  @Column('jsonb', { default: [] })
  relatedGoals!: string[];

  @Column('jsonb', { default: [] })
  tags!: string[];

  @Column('jsonb', { nullable: true })
  stats!: RepositoryContracts.RepositoryStats | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column('int', { default: 1 })
  version!: number;

  // ============ 转换方法 ============

  /**
   * 从领域实体转换为数据库实体
   */
  static fromDomain(repository: Repository): RepositoryEntity {
    const entity = new RepositoryEntity();
    const dto = repository.toDTO();

    entity.uuid = dto.uuid;
    entity.accountUuid = dto.accountUuid;
    entity.name = dto.name;
    entity.path = dto.path;
    entity.type = dto.type;
    entity.status = dto.status;
    entity.description = dto.description;
    entity.config = dto.config;
    entity.gitInfo = dto.gitInfo;
    entity.syncStatus = dto.syncStatus;
    entity.lastSyncedAt = dto.lastSyncedAt;
    entity.relatedGoals = dto.relatedGoals;
    entity.tags = dto.tags;
    entity.stats = dto.stats;
    entity.createdAt = dto.createdAt;
    entity.updatedAt = dto.updatedAt;
    entity.version = dto.version;

    return entity;
  }

  /**
   * 转换为领域实体
   */
  toDomain(): Repository {
    const dto: RepositoryContracts.RepositoryServerDTO = {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      path: this.path,
      type: this.type,
      status: this.status,
      description: this.description,
      config: this.config,
      gitInfo: this.gitInfo,
      syncStatus: this.syncStatus,
      lastSyncedAt: this.lastSyncedAt,
      relatedGoals: this.relatedGoals,
      tags: this.tags,
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };

    return Repository.fromDTO(dto);
  }
}
```

---

## 2️⃣ TypeORM Repository 实现

**位置**: `apps/api/src/repository/infrastructure/persistence/RepositoryRepositoryImpl.ts`

### 📐 规范

- ✅ 实现领域层定义的仓储接口
- ✅ 使用 TypeORM Repository 进行数据库操作
- ✅ 进行 Entity ↔ Domain 转换
- ✅ 使用 `@Injectable()` 装饰器

### 📝 示例代码

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { IRepositoryRepository } from '../../domain/repositories/IRepositoryRepository';
import { Repository } from '../../domain/aggregates/Repository';
import { RepositoryEntity } from './entities/RepositoryEntity';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * Repository 仓储实现
 */
@Injectable()
export class RepositoryRepositoryImpl implements IRepositoryRepository {
  constructor(
    @InjectRepository(RepositoryEntity)
    private readonly repository: TypeOrmRepository<RepositoryEntity>,
  ) {}

  async save(repository: Repository): Promise<void> {
    const entity = RepositoryEntity.fromDomain(repository);
    await this.repository.save(entity);
  }

  async findByUuid(uuid: string): Promise<Repository | null> {
    const entity = await this.repository.findOne({ where: { uuid } });
    return entity ? entity.toDomain() : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<Repository[]> {
    const entities = await this.repository.find({ where: { accountUuid } });
    return entities.map((entity) => entity.toDomain());
  }

  async findByPath(accountUuid: string, path: string): Promise<Repository | null> {
    const entity = await this.repository.findOne({
      where: { accountUuid, path },
    });
    return entity ? entity.toDomain() : null;
  }

  async findByStatus(
    accountUuid: string,
    status: RepositoryContracts.RepositoryStatus,
  ): Promise<Repository[]> {
    const entities = await this.repository.find({
      where: { accountUuid, status },
    });
    return entities.map((entity) => entity.toDomain());
  }

  async delete(uuid: string): Promise<void> {
    await this.repository.delete({ uuid });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.repository.count({ where: { uuid } });
    return count > 0;
  }
}
```

---

## 3️⃣ Application Service 实现

**位置**: `apps/api/src/repository/application/services/RepositoryApplicationService.ts`

### 📐 规范

- ✅ 负责业务流程编排
- ✅ 调用领域对象的业务方法
- ✅ 进行 DTO 转换（Request → Domain → Response）
- ✅ 处理事务和错误
- ✅ 使用 `@Injectable()` 装饰器

### 📝 示例代码

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { RepositoryContracts } from '@dailyuse/contracts';
import { IRepositoryRepository } from '../../domain/repositories/IRepositoryRepository';
import { Repository } from '../../domain/aggregates/Repository';

/**
 * Repository 应用服务
 */
@Injectable()
export class RepositoryApplicationService {
  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  /**
   * 创建仓库
   */
  async createRepository(
    request: RepositoryContracts.CreateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryServerDTO> {
    // 1. 验证路径是否已存在
    const existingRepo = await this.repositoryRepository.findByPath(
      request.accountUuid,
      request.path,
    );
    if (existingRepo) {
      throw new BadRequestException('Repository path already exists');
    }

    // 2. 创建领域实体
    const repository = Repository.create(
      request.accountUuid,
      request.name,
      request.path,
      request.type,
      request.description,
      request.config,
    );

    // 3. 保存到数据库
    await this.repositoryRepository.save(repository);

    // 4. 返回 DTO
    return repository.toDTO();
  }

  /**
   * 更新仓库
   */
  async updateRepository(
    request: RepositoryContracts.UpdateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryServerDTO> {
    // 1. 查找仓库
    const repository = await this.repositoryRepository.findByUuid(request.uuid);
    if (!repository) {
      throw new NotFoundException('Repository not found');
    }

    // 2. 如果路径变更，检查新路径是否已存在
    if (request.path && request.path !== repository.path) {
      const existingRepo = await this.repositoryRepository.findByPath(
        repository.accountUuid,
        request.path,
      );
      if (existingRepo) {
        throw new BadRequestException('Repository path already exists');
      }
    }

    // 3. 调用领域方法更新
    repository.update({
      name: request.name,
      path: request.path,
      description: request.description,
      config: request.config,
      tags: request.tags,
    });

    // 4. 保存
    await this.repositoryRepository.save(repository);

    // 5. 返回 DTO
    return repository.toDTO();
  }

  /**
   * 删除仓库
   */
  async deleteRepository(uuid: string): Promise<void> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new NotFoundException('Repository not found');
    }

    await this.repositoryRepository.delete(uuid);
  }

  /**
   * 获取仓库详情
   */
  async getRepositoryByUuid(uuid: string): Promise<RepositoryContracts.RepositoryServerDTO> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new NotFoundException('Repository not found');
    }

    return repository.toDTO();
  }

  /**
   * 获取用户的所有仓库
   */
  async getRepositoriesByAccountUuid(
    accountUuid: string,
  ): Promise<RepositoryContracts.RepositoryServerDTO[]> {
    const repositories = await this.repositoryRepository.findByAccountUuid(accountUuid);
    return repositories.map((repo) => repo.toDTO());
  }

  /**
   * 激活仓库
   */
  async activateRepository(uuid: string): Promise<RepositoryContracts.RepositoryServerDTO> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new NotFoundException('Repository not found');
    }

    repository.activate();
    await this.repositoryRepository.save(repository);

    return repository.toDTO();
  }

  /**
   * 归档仓库
   */
  async archiveRepository(uuid: string): Promise<RepositoryContracts.RepositoryServerDTO> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new NotFoundException('Repository not found');
    }

    repository.archive();
    await this.repositoryRepository.save(repository);

    return repository.toDTO();
  }

  /**
   * 关联目标
   */
  async linkGoal(repositoryUuid: string, goalUuid: string): Promise<void> {
    const repository = await this.repositoryRepository.findByUuid(repositoryUuid);
    if (!repository) {
      throw new NotFoundException('Repository not found');
    }

    repository.linkGoal(goalUuid);
    await this.repositoryRepository.save(repository);
  }

  /**
   * 取消关联目标
   */
  async unlinkGoal(repositoryUuid: string, goalUuid: string): Promise<void> {
    const repository = await this.repositoryRepository.findByUuid(repositoryUuid);
    if (!repository) {
      throw new NotFoundException('Repository not found');
    }

    repository.unlinkGoal(goalUuid);
    await this.repositoryRepository.save(repository);
  }
}
```

---

## 4️⃣ Controller 实现

**位置**: `apps/api/src/repository/presentation/controllers/RepositoryController.ts`

### 📐 规范

- ✅ 薄控制器，只负责 HTTP 处理
- ✅ 使用装饰器定义路由
- ✅ 调用 Application Service
- ✅ 使用统一响应格式
- ✅ 处理权限验证

### 📝 示例代码

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RepositoryApplicationService } from '../../application/services/RepositoryApplicationService';
import type { RepositoryContracts } from '@dailyuse/contracts';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { DailyUseApiResponse } from '../../../common/types/api-response';

/**
 * Repository 控制器
 */
@Controller('repositories')
@UseGuards(JwtAuthGuard) // ⚠️ 全局启用认证
export class RepositoryController {
  constructor(private readonly repositoryApplicationService: RepositoryApplicationService) {}

  /**
   * 创建仓库
   * POST /repositories
   */
  @Post()
  async create(
    @Body() request: RepositoryContracts.CreateRepositoryRequestDTO,
    @Request() req: any,
  ): Promise<DailyUseApiResponse<RepositoryContracts.RepositoryServerDTO>> {
    // 从 JWT 获取 accountUuid
    const accountUuid = req.user.accountUuid;

    const repository = await this.repositoryApplicationService.createRepository({
      ...request,
      accountUuid, // ⚠️ 从认证信息获取
    });

    return {
      success: true,
      data: repository,
      message: 'Repository created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 更新仓库
   * PUT /repositories/:uuid
   */
  @Put(':uuid')
  async update(
    @Param('uuid') uuid: string,
    @Body() request: RepositoryContracts.UpdateRepositoryRequestDTO,
  ): Promise<DailyUseApiResponse<RepositoryContracts.RepositoryServerDTO>> {
    const repository = await this.repositoryApplicationService.updateRepository({
      ...request,
      uuid,
    });

    return {
      success: true,
      data: repository,
      message: 'Repository updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 删除仓库
   * DELETE /repositories/:uuid
   */
  @Delete(':uuid')
  async delete(@Param('uuid') uuid: string): Promise<DailyUseApiResponse<void>> {
    await this.repositoryApplicationService.deleteRepository(uuid);

    return {
      success: true,
      data: undefined,
      message: 'Repository deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取仓库详情
   * GET /repositories/:uuid
   */
  @Get(':uuid')
  async getOne(
    @Param('uuid') uuid: string,
  ): Promise<DailyUseApiResponse<RepositoryContracts.RepositoryServerDTO>> {
    const repository = await this.repositoryApplicationService.getRepositoryByUuid(uuid);

    return {
      success: true,
      data: repository,
      message: 'Repository retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取所有仓库
   * GET /repositories
   */
  @Get()
  async getAll(
    @Request() req: any,
  ): Promise<DailyUseApiResponse<RepositoryContracts.RepositoryListResponseDTO>> {
    const accountUuid = req.user.accountUuid;

    const repositories =
      await this.repositoryApplicationService.getRepositoriesByAccountUuid(accountUuid);

    return {
      success: true,
      data: {
        items: repositories,
        pagination: {
          total: repositories.length,
          page: 1,
          pageSize: repositories.length,
          totalPages: 1,
        },
      },
      message: 'Repositories retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 激活仓库
   * POST /repositories/:uuid/activate
   */
  @Post(':uuid/activate')
  async activate(
    @Param('uuid') uuid: string,
  ): Promise<DailyUseApiResponse<RepositoryContracts.RepositoryServerDTO>> {
    const repository = await this.repositoryApplicationService.activateRepository(uuid);

    return {
      success: true,
      data: repository,
      message: 'Repository activated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 归档仓库
   * POST /repositories/:uuid/archive
   */
  @Post(':uuid/archive')
  async archive(
    @Param('uuid') uuid: string,
  ): Promise<DailyUseApiResponse<RepositoryContracts.RepositoryServerDTO>> {
    const repository = await this.repositoryApplicationService.archiveRepository(uuid);

    return {
      success: true,
      data: repository,
      message: 'Repository archived successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 关联目标
   * POST /repositories/:uuid/goals/:goalUuid
   */
  @Post(':uuid/goals/:goalUuid')
  async linkGoal(
    @Param('uuid') uuid: string,
    @Param('goalUuid') goalUuid: string,
  ): Promise<DailyUseApiResponse<void>> {
    await this.repositoryApplicationService.linkGoal(uuid, goalUuid);

    return {
      success: true,
      data: undefined,
      message: 'Goal linked successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 取消关联目标
   * DELETE /repositories/:uuid/goals/:goalUuid
   */
  @Delete(':uuid/goals/:goalUuid')
  async unlinkGoal(
    @Param('uuid') uuid: string,
    @Param('goalUuid') goalUuid: string,
  ): Promise<DailyUseApiResponse<void>> {
    await this.repositoryApplicationService.unlinkGoal(uuid, goalUuid);

    return {
      success: true,
      data: undefined,
      message: 'Goal unlinked successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
```

---

## 5️⃣ Module 注册

**位置**: `apps/api/src/repository/RepositoryModule.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepositoryEntity } from './infrastructure/persistence/entities/RepositoryEntity';
import { RepositoryRepositoryImpl } from './infrastructure/persistence/RepositoryRepositoryImpl';
import { RepositoryApplicationService } from './application/services/RepositoryApplicationService';
import { RepositoryController } from './presentation/controllers/RepositoryController';

@Module({
  imports: [TypeOrmModule.forFeature([RepositoryEntity])],
  controllers: [RepositoryController],
  providers: [
    RepositoryApplicationService,
    {
      provide: 'IRepositoryRepository', // ⚠️ 使用接口名作为 token
      useClass: RepositoryRepositoryImpl,
    },
  ],
  exports: [RepositoryApplicationService],
})
export class RepositoryModule {}
```

---

## ⚠️ 易错点总结

❌ **错误 1**：Controller 包含业务逻辑

```typescript
// 错误示例
@Post()
async create(@Body() request: CreateRepositoryRequestDTO) {
  // ❌ 业务逻辑在 Controller
  if (existingRepo) {
    throw new BadRequestException('...');
  }
  const repository = Repository.create(...);
  await this.repository.save(repository);
}
```

✅ **正确**：Controller 调用 Service

```typescript
@Post()
async create(@Body() request: CreateRepositoryRequestDTO) {
  // ✅ 调用 Application Service
  const repository = await this.service.createRepository(request);
  return { success: true, data: repository };
}
```

❌ **错误 2**：忘记使用统一响应格式

```typescript
// 错误示例
@Get(':uuid')
async getOne(@Param('uuid') uuid: string) {
  return await this.service.getRepositoryByUuid(uuid);  // ❌ 直接返回数据
}
```

✅ **正确**：使用统一响应格式

```typescript
@Get(':uuid')
async getOne(@Param('uuid') uuid: string) {
  const repository = await this.service.getRepositoryByUuid(uuid);
  // ✅ 统一响应格式
  return {
    success: true,
    data: repository,
    message: 'Repository retrieved successfully',
    timestamp: new Date().toISOString(),
  };
}
```

❌ **错误 3**：忘记从认证信息获取 accountUuid

```typescript
// 错误示例
@Post()
async create(@Body() request: CreateRepositoryRequestDTO) {
  // ❌ 直接使用请求中的 accountUuid（不安全）
  return await this.service.createRepository(request);
}
```

✅ **正确**：从 JWT 获取 accountUuid

```typescript
@Post()
async create(@Body() request: CreateRepositoryRequestDTO, @Request() req: any) {
  const accountUuid = req.user.accountUuid;  // ✅ 从认证信息获取
  return await this.service.createRepository({
    ...request,
    accountUuid,
  });
}
```

---

## ✅ API 层检查清单

- [ ] TypeORM Entity 使用装饰器定义字段
- [ ] 提供 fromDomain 和 toDomain 方法
- [ ] Repository 实现接口并进行 Entity ↔ Domain 转换
- [ ] Application Service 负责业务流程编排
- [ ] Controller 薄控制器，只处理 HTTP
- [ ] 使用统一响应格式
- [ ] 从认证信息获取 accountUuid
- [ ] Module 正确注册所有依赖

---

**下一步**: [[05-WEB_IMPLEMENTATION|Web 实现]]
