# STORY-SETTING-001-004: API Endpoints 实现

> **Story ID**: STORY-SETTING-001-004  
> **Epic**: EPIC-SETTING-001 - 用户偏好设置  
> **Sprint**: Sprint 1  
> **Story Points**: 3 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Backend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 前端开发者  
**我想要** 调用 RESTful API 来管理用户偏好设置  
**以便于** 在 Web/Desktop 应用中实现用户设置功能

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: 创建用户偏好

```gherkin
Feature: POST /api/v1/user-preferences
  As a Frontend Developer
  I want to create user preferences via API
  So that new users can initialize their settings

Scenario: 使用默认值创建用户偏好
  Given 用户已登录，accountUuid = "user-123"
  When 发送 POST /api/v1/user-preferences
    """json
    {
      "accountUuid": "user-123"
    }
    """
  Then 响应状态码应该是 201 Created
  And 响应体包含 UserPreferenceServerDTO
  And 所有字段使用默认值

Scenario: 使用自定义值创建
  When 发送 POST /api/v1/user-preferences
    """json
    {
      "accountUuid": "user-123",
      "theme": "dark",
      "language": "en-US"
    }
    """
  Then 响应状态码应该是 201
  And 响应体中 theme = "dark", language = "en-US"

Scenario: 创建失败 - 用户已有偏好
  Given 用户 "user-123" 已有偏好设置
  When 发送 POST /api/v1/user-preferences
  Then 响应状态码应该是 409 Conflict
  And 错误信息为 "User preference already exists"
```

### Scenario 2: 获取用户偏好

```gherkin
Feature: GET /api/v1/user-preferences
  As a Frontend Developer
  I want to fetch user preferences
  So that I can display current settings

Scenario: 获取当前用户的偏好 (通过 accountUuid)
  Given 用户 "user-123" 已登录
  When 发送 GET /api/v1/user-preferences?accountUuid=user-123
  Then 响应状态码应该是 200 OK
  And 响应体包含 UserPreferenceServerDTO

Scenario: 获取失败 - 用户偏好不存在
  Given 用户 "user-999" 没有偏好设置
  When 发送 GET /api/v1/user-preferences?accountUuid=user-999
  Then 响应状态码应该是 404 Not Found

Scenario: 通过 UUID 获取偏好
  When 发送 GET /api/v1/user-preferences/pref-456
  Then 响应状态码应该是 200 OK
```

### Scenario 3: 更新主题设置

```gherkin
Feature: PATCH /api/v1/user-preferences/:accountUuid/theme
  As a Frontend Developer
  I want to update only the theme
  So that I can provide quick theme switching

Scenario: 成功更新主题
  Given 用户 "user-123" 存在
  When 发送 PATCH /api/v1/user-preferences/user-123/theme
    """json
    { "theme": "dark" }
    """
  Then 响应状态码应该是 200 OK
  And 响应体中 theme = "dark"
  And updatedAt 已更新

Scenario: 更新失败 - 无效主题值
  When 发送 PATCH /api/v1/user-preferences/user-123/theme
    """json
    { "theme": "invalid" }
    """
  Then 响应状态码应该是 400 Bad Request
  And 错误信息为 "Invalid theme value"
```

### Scenario 4: 更新通知设置

```gherkin
Feature: PATCH /api/v1/user-preferences/:accountUuid/notifications
  As a Frontend Developer
  I want to update notification settings
  So that users can customize notifications

Scenario: 成功更新通知设置
  When 发送 PATCH /api/v1/user-preferences/user-123/notifications
    """json
    {
      "enabled": true,
      "channels": ["push", "email"],
      "doNotDisturbStart": "22:00",
      "doNotDisturbEnd": "08:00",
      "soundEnabled": false
    }
    """
  Then 响应状态码应该是 200 OK

Scenario: 验证失败 - 时间格式错误
  When 发送通知设置，doNotDisturbStart = "25:00"
  Then 响应状态码应该是 400 Bad Request
  And 错误信息包含 "Invalid time format"
```

### Scenario 5: 批量更新设置

```gherkin
Feature: PUT /api/v1/user-preferences/:accountUuid
  As a Frontend Developer
  I want to update multiple settings at once
  So that I can save user changes in batch

Scenario: 同时更新主题、语言、字体大小
  When 发送 PUT /api/v1/user-preferences/user-123
    """json
    {
      "theme": "dark",
      "language": "en-US",
      "fontSize": 16
    }
    """
  Then 响应状态码应该是 200 OK
  And 所有指定字段已更新
  And 未指定字段保持不变
```

### Scenario 6: 删除用户偏好

```gherkin
Feature: DELETE /api/v1/user-preferences/:accountUuid
  As a System Administrator
  I want to delete user preferences
  So that data can be cleaned when accounts are deleted

Scenario: 成功删除
  Given 用户 "user-123" 的偏好存在
  When 发送 DELETE /api/v1/user-preferences/user-123
  Then 响应状态码应该是 204 No Content

Scenario: 删除失败 - 用户不存在
  When 发送 DELETE /api/v1/user-preferences/user-999
  Then 响应状态码应该是 404 Not Found
```

---

## 📋 任务清单 (Task Breakdown)

### Controller 实现任务

- [ ] **Task 1.1**: 创建 `apps/api/src/modules/user-preference/interface/http/controllers/UserPreferenceController.ts`
  - [ ] 注入 UserPreferenceService
  - [ ] 实现 `create()` (POST /api/v1/user-preferences)
  - [ ] 实现 `getByAccountUuid()` (GET /api/v1/user-preferences?accountUuid=...)
  - [ ] 实现 `getByUuid()` (GET /api/v1/user-preferences/:uuid)
  - [ ] 实现 `updateTheme()` (PATCH .../theme)
  - [ ] 实现 `updateLanguage()` (PATCH .../language)
  - [ ] 实现 `updateNotifications()` (PATCH .../notifications)
  - [ ] 实现 `updateShortcuts()` (PATCH .../shortcuts)
  - [ ] 实现 `update()` (PUT .../user-preferences/:accountUuid)
  - [ ] 实现 `delete()` (DELETE .../user-preferences/:accountUuid)
  - [ ] 添加统一错误处理 (handleError 方法)

### 路由配置任务

- [ ] **Task 1.2**: 创建 `apps/api/src/modules/user-preference/interface/http/routes.ts`
  - [ ] 注册所有路由
  - [ ] 添加认证中间件 (需要登录)
  - [ ] 添加权限校验 (只能修改自己的设置)

### DTO 验证任务

- [ ] **Task 1.3**: 创建 Request DTOs
  - [ ] 创建 `CreateUserPreferenceRequestDTO.ts`
  - [ ] 创建 `UpdateThemeRequestDTO.ts`
  - [ ] 创建 `UpdateNotificationSettingsRequestDTO.ts`
  - [ ] 使用 class-validator 添加验证规则

### 文档任务

- [ ] **Task 1.4**: 生成 API 文档
  - [ ] 添加 Swagger/OpenAPI 注解
  - [ ] 生成 API 文档 (Swagger UI)

### 测试任务

- [ ] **Task 1.5**: 编写集成测试
  - [ ] 创建 `__tests__/UserPreferenceController.e2e.test.ts`
  - [ ] 测试所有 API 端点 (成功和失败场景)
  - [ ] 测试认证和权限
  - [ ] 确保覆盖率 ≥ 80%

---

## 🔧 技术实现细节

### Controller Implementation

**UserPreferenceController.ts**:
```typescript
import { Controller, Post, Get, Patch, Put, Delete, Body, Param, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserPreferenceService } from '../../../application/services/UserPreferenceService';
import type { UserPreferenceServerDTO } from '@dailyuse/contracts';
import {
  CreateUserPreferenceRequestDTO,
  UpdateThemeRequestDTO,
  UpdateNotificationSettingsRequestDTO,
  UpdateUserPreferenceRequestDTO,
} from '../dtos';

@ApiTags('User Preferences')
@Controller('api/v1/user-preferences')
export class UserPreferenceController {
  constructor(
    private readonly userPreferenceService: UserPreferenceService
  ) {}

  @Post()
  @ApiOperation({ summary: '创建用户偏好设置' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '用户偏好已存在' })
  async create(@Body() dto: CreateUserPreferenceRequestDTO): Promise<UserPreferenceServerDTO> {
    try {
      return await this.userPreferenceService.create(dto);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get()
  @ApiOperation({ summary: '根据 accountUuid 获取用户偏好' })
  async getByAccountUuid(@Query('accountUuid') accountUuid: string): Promise<UserPreferenceServerDTO> {
    try {
      return await this.userPreferenceService.getByAccountUuid(accountUuid);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get(':uuid')
  @ApiOperation({ summary: '根据 UUID 获取用户偏好' })
  async getByUuid(@Param('uuid') uuid: string): Promise<UserPreferenceServerDTO> {
    try {
      return await this.userPreferenceService.getByUuid(uuid);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':accountUuid/theme')
  @ApiOperation({ summary: '更新主题设置' })
  async updateTheme(
    @Param('accountUuid') accountUuid: string,
    @Body() dto: UpdateThemeRequestDTO
  ): Promise<UserPreferenceServerDTO> {
    try {
      return await this.userPreferenceService.updateTheme({
        accountUuid,
        theme: dto.theme,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':accountUuid/notifications')
  @ApiOperation({ summary: '更新通知设置' })
  async updateNotifications(
    @Param('accountUuid') accountUuid: string,
    @Body() dto: UpdateNotificationSettingsRequestDTO
  ): Promise<UserPreferenceServerDTO> {
    try {
      return await this.userPreferenceService.updateNotificationSettings({
        accountUuid,
        notifications: dto,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Put(':accountUuid')
  @ApiOperation({ summary: '批量更新用户偏好' })
  async update(
    @Param('accountUuid') accountUuid: string,
    @Body() dto: UpdateUserPreferenceRequestDTO
  ): Promise<UserPreferenceServerDTO> {
    try {
      return await this.userPreferenceService.update({
        accountUuid,
        ...dto,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Delete(':accountUuid')
  @HttpCode(204)
  @ApiOperation({ summary: '删除用户偏好' })
  async delete(@Param('accountUuid') accountUuid: string): Promise<void> {
    try {
      await this.userPreferenceService.delete(accountUuid);
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof UserPreferenceNotFoundError) {
      throw new NotFoundException(error.message);
    }
    if (error instanceof UserPreferenceAlreadyExistsError) {
      throw new ConflictException(error.message);
    }
    if (error instanceof InvalidThemeError || error instanceof InvalidNotificationSettingsError) {
      throw new BadRequestException(error.message);
    }
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
```

### Request DTOs with Validation

**CreateUserPreferenceRequestDTO.ts**:
```typescript
import { IsString, IsOptional, IsEnum, IsInt, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ThemeType, LanguageType } from '@dailyuse/contracts';

export class CreateUserPreferenceRequestDTO {
  @ApiProperty({ description: '账户 UUID' })
  @IsString()
  accountUuid: string;

  @ApiPropertyOptional({ enum: ['light', 'dark', 'auto'] })
  @IsOptional()
  @IsEnum(['light', 'dark', 'auto'])
  theme?: ThemeType;

  @ApiPropertyOptional({ enum: ['zh-CN', 'en-US', 'ja-JP'] })
  @IsOptional()
  @IsEnum(['zh-CN', 'en-US', 'ja-JP'])
  language?: LanguageType;

  @ApiPropertyOptional({ minimum: 12, maximum: 24 })
  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(24)
  fontSize?: number;
}
```

### E2E Tests

**__tests__/UserPreferenceController.e2e.test.ts**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../../../../app'; // NestJS app instance

describe('UserPreferenceController (E2E)', () => {
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    request = supertest(app.getHttpServer());
  });

  describe('POST /api/v1/user-preferences', () => {
    it('应该使用默认值创建用户偏好', async () => {
      const response = await request
        .post('/api/v1/user-preferences')
        .send({ accountUuid: 'user-123' })
        .expect(201);

      expect(response.body).toMatchObject({
        accountUuid: 'user-123',
        theme: 'auto',
        language: 'zh-CN',
        fontSize: 14,
      });
    });

    it('应该在用户已存在时返回 409', async () => {
      // 先创建
      await request.post('/api/v1/user-preferences').send({ accountUuid: 'user-456' });

      // 再次创建应该失败
      await request
        .post('/api/v1/user-preferences')
        .send({ accountUuid: 'user-456' })
        .expect(409);
    });
  });

  describe('GET /api/v1/user-preferences', () => {
    it('应该获取用户偏好', async () => {
      await request.post('/api/v1/user-preferences').send({ accountUuid: 'user-789' });

      const response = await request
        .get('/api/v1/user-preferences')
        .query({ accountUuid: 'user-789' })
        .expect(200);

      expect(response.body.accountUuid).toBe('user-789');
    });

    it('应该在用户不存在时返回 404', async () => {
      await request
        .get('/api/v1/user-preferences')
        .query({ accountUuid: 'user-999' })
        .expect(404);
    });
  });

  describe('PATCH /api/v1/user-preferences/:accountUuid/theme', () => {
    it('应该更新主题', async () => {
      await request.post('/api/v1/user-preferences').send({ accountUuid: 'user-theme' });

      const response = await request
        .patch('/api/v1/user-preferences/user-theme/theme')
        .send({ theme: 'dark' })
        .expect(200);

      expect(response.body.theme).toBe('dark');
    });

    it('应该在主题无效时返回 400', async () => {
      await request.post('/api/v1/user-preferences').send({ accountUuid: 'user-theme2' });

      await request
        .patch('/api/v1/user-preferences/user-theme2/theme')
        .send({ theme: 'invalid' })
        .expect(400);
    });
  });

  // 更多测试...
});
```

---

## ✅ Definition of Done

- [x] 所有 API 端点实现完成
- [x] 路由配置正确
- [x] Request DTOs 验证生效
- [x] 错误处理统一
- [x] API 文档生成 (Swagger)
- [x] E2E 测试覆盖率 ≥ 80%
- [x] 所有测试通过
- [x] Code Review 完成

---

## 📊 预估时间

| 任务 | 预估时间 |
|------|---------|
| Controller 实现 | 2.5 小时 |
| 路由 & DTOs | 1.5 小时 |
| API 文档 (Swagger) | 1 小时 |
| E2E 测试编写 | 2.5 小时 |
| Code Review & 修复 | 1.5 小时 |
| **总计** | **9 小时** |

**Story Points**: 3 SP

---

## 🔗 依赖关系

### 上游依赖
- ✅ STORY-SETTING-001-002 (Application Service)
- ✅ STORY-SETTING-001-003 (Infrastructure)

### 下游依赖
- STORY-SETTING-001-005 (Client Services) 依赖此 Story

---

**Story 创建日期**: 2025-10-21  
**Story 创建者**: SM Bob
